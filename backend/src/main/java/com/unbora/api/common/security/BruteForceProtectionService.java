package com.unbora.api.common.security;

import com.unbora.api.common.exception.ApiException;
import com.unbora.api.kafka.KafkaEventPublisher;
import com.unbora.api.kafka.event.UserActivityEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class BruteForceProtectionService {

    private static final Logger log = LoggerFactory.getLogger(BruteForceProtectionService.class);

    // Configurações de Segurança para Login
    public static final int MAX_LOGIN_ATTEMPTS = 5;
    public static final Duration LOGIN_WINDOW = Duration.ofMinutes(15);
    public static final Duration LOGIN_LOCKOUT = Duration.ofMinutes(15);

    // Configurações de Segurança para Recuperação de Senha
    public static final int MAX_FORGOT_ATTEMPTS = 3;
    public static final Duration FORGOT_WINDOW = Duration.ofMinutes(10);
    public static final Duration FORGOT_LOCKOUT = Duration.ofMinutes(15);

    private final ConcurrentHashMap<String, AttemptRecord> ipLoginAttempts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AttemptRecord> emailLoginAttempts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AttemptRecord> forgotPasswordAttempts = new ConcurrentHashMap<>();

    private final KafkaEventPublisher kafkaEventPublisher;

    public BruteForceProtectionService(KafkaEventPublisher kafkaEventPublisher) {
        this.kafkaEventPublisher = kafkaEventPublisher;
    }

    /**
     * Valida se a tentativa de login é permitida para o IP e para a Conta (E-mail).
     * Se bloqueado, lança ApiException 429 (TOO_MANY_REQUESTS).
     */
    public void checkLoginAllowed(String ip, String email) {
        Instant now = Instant.now();
        String normalizedEmail = email != null ? email.trim().toLowerCase() : "";
        String normalizedIp = ip != null ? ip.trim() : "127.0.0.1";

        // 1. Verifica bloqueio por IP
        AttemptRecord ipRecord = ipLoginAttempts.get(normalizedIp);
        if (ipRecord != null && ipRecord.isLocked(now)) {
            long minutesRemaining = ipRecord.getMinutesRemaining(now);
            log.warn("[BruteForce] Login bloqueado por IP: {} (restam {} min)", normalizedIp, minutesRemaining);
            throw new ApiException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Muitas tentativas de login incorretas a partir desta conexão. Por segurança, tente novamente em " + minutesRemaining + " minuto(s)."
            );
        }

        // 2. Verifica bloqueio por Conta / E-mail (evita ataque distribuído com rotação de IPs)
        if (!normalizedEmail.isBlank()) {
            AttemptRecord emailRecord = emailLoginAttempts.get(normalizedEmail);
            if (emailRecord != null && emailRecord.isLocked(now)) {
                long minutesRemaining = emailRecord.getMinutesRemaining(now);
                log.warn("[BruteForce] Login bloqueado por Conta: {} (restam {} min)", normalizedEmail, minutesRemaining);
                throw new ApiException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Esta conta foi temporariamente bloqueada por segurança após 5 tentativas incorretas. Tente novamente em " + minutesRemaining + " minuto(s) ou recupere sua senha."
                );
            }
        }
    }

    /**
     * Registra uma falha de autenticação (senha incorreta ou conta inexistente).
     */
    public void recordLoginFailure(String ip, String email) {
        Instant now = Instant.now();
        String normalizedEmail = email != null ? email.trim().toLowerCase() : "";
        String normalizedIp = ip != null ? ip.trim() : "127.0.0.1";

        // Incrementa falha para o IP
        AttemptRecord ipRecord = ipLoginAttempts.compute(normalizedIp, (k, v) -> {
            if (v == null || v.isExpired(now, LOGIN_WINDOW)) {
                return new AttemptRecord(1, now);
            }
            v.increment(now);
            if (v.getAttempts() >= MAX_LOGIN_ATTEMPTS) {
                v.lock(now.plus(LOGIN_LOCKOUT));
            }
            return v;
        });

        // Incrementa falha para o E-mail
        AttemptRecord emailRecord = null;
        if (!normalizedEmail.isBlank()) {
            emailRecord = emailLoginAttempts.compute(normalizedEmail, (k, v) -> {
                if (v == null || v.isExpired(now, LOGIN_WINDOW)) {
                    return new AttemptRecord(1, now);
                }
                v.increment(now);
                if (v.getAttempts() >= MAX_LOGIN_ATTEMPTS) {
                    v.lock(now.plus(LOGIN_LOCKOUT));
                }
                return v;
            });
        }

        boolean ipLocked = ipRecord != null && ipRecord.isLocked(now);
        boolean emailLocked = emailRecord != null && emailRecord.isLocked(now);

        if (ipLocked || emailLocked) {
            log.error("[BruteForce Alert] Possível ataque de força bruta bloqueado! IP={}, Email={}, IpLocked={}, EmailLocked={}",
                    normalizedIp, normalizedEmail, ipLocked, emailLocked);

            kafkaEventPublisher.publishUserActivity(new UserActivityEvent(
                    "SECURITY_BRUTE_FORCE_LOCKOUT",
                    normalizedEmail,
                    normalizedEmail,
                    "SECURITY_ALERT",
                    "api",
                    now,
                    Map.of("ip", normalizedIp, "attempts", ipRecord != null ? ipRecord.getAttempts() : 0)
            ));
        } else {
            log.info("[BruteForce] Falha de login registrada. IP={}, Email={}, Tentativas IP={}",
                    normalizedIp, normalizedEmail, ipRecord.getAttempts());
        }
    }

    /**
     * Reseta os contadores após um login bem-sucedido.
     */
    public void recordLoginSuccess(String ip, String email) {
        if (ip != null) ipLoginAttempts.remove(ip.trim());
        if (email != null) emailLoginAttempts.remove(email.trim().toLowerCase());
    }

    /**
     * Valida limites para solicitação de recuperação de senha (anti-flood e anti-spam).
     */
    public void checkForgotPasswordAllowed(String ip, String email) {
        Instant now = Instant.now();
        String key = (ip != null ? ip.trim() : "") + ":" + (email != null ? email.trim().toLowerCase() : "");

        AttemptRecord record = forgotPasswordAttempts.get(key);
        if (record != null && record.isLocked(now)) {
            long minutesRemaining = record.getMinutesRemaining(now);
            log.warn("[BruteForce] Recuperação de senha bloqueada por flood: {} (restam {} min)", key, minutesRemaining);
            throw new ApiException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Muitas solicitações de recuperação de senha. Por segurança, tente novamente em " + minutesRemaining + " minuto(s)."
            );
        }
    }

    /**
     * Registra solicitação de recuperação de senha.
     */
    public void recordForgotPasswordRequest(String ip, String email) {
        Instant now = Instant.now();
        String key = (ip != null ? ip.trim() : "") + ":" + (email != null ? email.trim().toLowerCase() : "");

        forgotPasswordAttempts.compute(key, (k, v) -> {
            if (v == null || v.isExpired(now, FORGOT_WINDOW)) {
                return new AttemptRecord(1, now);
            }
            v.increment(now);
            if (v.getAttempts() >= MAX_FORGOT_ATTEMPTS) {
                v.lock(now.plus(FORGOT_LOCKOUT));
            }
            return v;
        });
    }

    /**
     * Limpeza automática a cada 5 minutos de registros inativos e expirados na memória.
     */
    @Scheduled(fixedRate = 300_000)
    public void purgeExpired() {
        Instant now = Instant.now();
        ipLoginAttempts.entrySet().removeIf(e -> e.getValue().isExpired(now, LOGIN_WINDOW) && !e.getValue().isLocked(now));
        emailLoginAttempts.entrySet().removeIf(e -> e.getValue().isExpired(now, LOGIN_WINDOW) && !e.getValue().isLocked(now));
        forgotPasswordAttempts.entrySet().removeIf(e -> e.getValue().isExpired(now, FORGOT_WINDOW) && !e.getValue().isLocked(now));
    }

    /**
     * Classe interna thread-safe para rastreamento de tentativas.
     */
    public static class AttemptRecord {
        private int attempts;
        private Instant firstAttempt;
        private Instant lastAttempt;
        private Instant lockedUntil;

        public AttemptRecord(int attempts, Instant timestamp) {
            this.attempts = attempts;
            this.firstAttempt = timestamp;
            this.lastAttempt = timestamp;
            this.lockedUntil = null;
        }

        public synchronized void increment(Instant timestamp) {
            this.attempts++;
            this.lastAttempt = timestamp;
        }

        public synchronized void lock(Instant lockUntil) {
            this.lockedUntil = lockUntil;
        }

        public synchronized boolean isLocked(Instant now) {
            return lockedUntil != null && lockedUntil.isAfter(now);
        }

        public synchronized boolean isExpired(Instant now, Duration window) {
            return lastAttempt.plus(window).isBefore(now);
        }

        public synchronized long getMinutesRemaining(Instant now) {
            if (lockedUntil == null || !lockedUntil.isAfter(now)) {
                return 1;
            }
            long seconds = Duration.between(now, lockedUntil).getSeconds();
            return Math.max(1, (seconds + 59) / 60);
        }

        public synchronized int getAttempts() {
            return attempts;
        }
    }
}
