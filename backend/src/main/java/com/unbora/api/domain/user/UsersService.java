package com.unbora.api.domain.user;

import com.unbora.api.common.PasswordUtil;
import com.unbora.api.common.exception.ApiException;
import com.unbora.api.domain.user.dto.*;
import com.unbora.api.kafka.KafkaEventPublisher;
import com.unbora.api.kafka.event.UserActivityEvent;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import com.unbora.api.domain.email.EmailService;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class UsersService {

    private final UserRepository userRepository;
    private final KafkaEventPublisher kafkaEventPublisher;
    private final GoogleAuthService googleAuthService;
    private final EmailService emailService;

    public UsersService(
            UserRepository userRepository,
            KafkaEventPublisher kafkaEventPublisher,
            GoogleAuthService googleAuthService,
            EmailService emailService
    ) {
        this.userRepository = userRepository;
        this.kafkaEventPublisher = kafkaEventPublisher;
        this.googleAuthService = googleAuthService;
        this.emailService = emailService;
    }

    public PublicUserDto toPublic(User user) {
        return new PublicUserDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getGuest(),
                user.getPlatform(),
                user.getRole(),
                user.getBusinessName(),
                user.getCreatedAt().toString(),
                user.getLastSeenAt().toString()
        );
    }

    public List<PublicUserDto> list() {
        return userRepository.findAllByOrderByLastSeenAtDesc().stream()
                .map(this::toPublic)
                .toList();
    }

    public UserStatsDto stats() {
        long total = userRepository.count();
        long guests = userRepository.countByIsGuestTrue();
        long registered = userRepository.countByIsGuestFalse();

        ZoneId zone = ZoneId.of("America/Fortaleza");
        LocalDate today = LocalDate.now(zone);
        Instant startOfToday = today.atStartOfDay(zone).toInstant();

        List<User> allUsers = userRepository.findAll();

        long activeToday = allUsers.stream()
                .filter(u -> u.getLastSeenAt() != null && !u.getLastSeenAt().isBefore(startOfToday))
                .count();

        List<Long> dailyActive = new ArrayList<>();
        List<Long> dailyRegistered = new ArrayList<>();
        List<String> dayLabels = new ArrayList<>();

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("EEE", Locale.forLanguageTag("pt-BR"));

        for (int i = 6; i >= 0; i--) {
            LocalDate targetDate = today.minusDays(i);
            Instant start = targetDate.atStartOfDay(zone).toInstant();
            Instant end = targetDate.plusDays(1).atStartOfDay(zone).toInstant();

            long activeCount = allUsers.stream()
                    .filter(u -> u.getLastSeenAt() != null && !u.getLastSeenAt().isBefore(start) && u.getLastSeenAt().isBefore(end))
                    .count();

            long regCount = allUsers.stream()
                    .filter(u -> u.getCreatedAt() != null && !u.getCreatedAt().isBefore(start) && u.getCreatedAt().isBefore(end) && !Boolean.TRUE.equals(u.getGuest()))
                    .count();

            dailyActive.add(activeCount);
            dailyRegistered.add(regCount);
            String label = targetDate.format(dtf).replace(".", "");
            if (!label.isEmpty()) {
                label = label.substring(0, 1).toUpperCase(Locale.ROOT) + label.substring(1);
            }
            dayLabels.add(label);
        }

        return new UserStatsDto(total, guests, registered, activeToday, dailyActive, dailyRegistered, dayLabels);
    }

    @Transactional
    public PublicUserDto register(RegisterUserDto dto) {
        String email = dto.email().trim().toLowerCase();

        boolean exists = userRepository.findByEmail(email)
                .filter(u -> !Boolean.TRUE.equals(u.getGuest()))
                .isPresent();

        if (exists) {
            throw new ApiException(HttpStatus.CONFLICT, "Este e-mail já está cadastrado.");
        }

        String confirmToken = UUID.randomUUID().toString();

        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setName(dto.name().trim());
        user.setEmail(email);
        user.setGuest(false);
        user.setPasswordHash(PasswordUtil.hashPassword(dto.password()));
        user.setPlatform(dto.platform());
        user.setRole("user");
        user.setEmailConfirmed(false);
        user.setEmailConfirmationToken(confirmToken);
        user.setCreatedAt(Instant.now());
        user.setLastSeenAt(Instant.now());

        PublicUserDto saved = toPublic(userRepository.save(user));

        emailService.sendAccountConfirmationEmail(saved.email(), saved.name(), confirmToken);

        kafkaEventPublisher.publishUserActivity(new UserActivityEvent(
                "USER_REGISTERED",
                saved.id(),
                saved.email(),
                saved.role(),
                saved.platform(),
                Instant.now(),
                Map.of("name", saved.name())
        ));

        return saved;
    }

    @Transactional
    public PublicUserDto registerMerchant(RegisterMerchantDto dto) {
        String email = dto.email().trim().toLowerCase();

        boolean exists = userRepository.findByEmail(email)
                .filter(u -> !Boolean.TRUE.equals(u.getGuest()))
                .isPresent();

        if (exists) {
            throw new ApiException(HttpStatus.CONFLICT, "Este e-mail já está cadastrado.");
        }

        String confirmToken = UUID.randomUUID().toString();

        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setName(dto.name().trim());
        user.setEmail(email);
        user.setGuest(false);
        user.setPasswordHash(PasswordUtil.hashPassword(dto.password()));
        user.setPlatform(dto.platform());
        user.setRole("merchant");
        user.setBusinessName(dto.businessName().trim());
        user.setEmailConfirmed(false);
        user.setEmailConfirmationToken(confirmToken);
        user.setCreatedAt(Instant.now());
        user.setLastSeenAt(Instant.now());

        PublicUserDto saved = toPublic(userRepository.save(user));

        emailService.sendAccountConfirmationEmail(saved.email(), saved.name(), confirmToken);

        kafkaEventPublisher.publishUserActivity(new UserActivityEvent(
                "MERCHANT_REGISTERED",
                saved.id(),
                saved.email(),
                saved.role(),
                saved.platform(),
                Instant.now(),
                Map.of("businessName", dto.businessName())
        ));

        return saved;
    }

    @Transactional
    public PublicUserDto login(LoginUserDto dto) {
        String email = dto.email().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .filter(u -> !Boolean.TRUE.equals(u.getGuest()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos."));

        if (!PasswordUtil.verify(dto.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos.");
        }

        user.setLastSeenAt(Instant.now());
        PublicUserDto saved = toPublic(userRepository.save(user));

        kafkaEventPublisher.publishUserActivity(new UserActivityEvent(
                "USER_LOGGED_IN",
                saved.id(),
                saved.email(),
                saved.role(),
                saved.platform(),
                Instant.now(),
                Map.of()
        ));

        return saved;
    }

    @Transactional
    public PublicUserDto googleLogin(GoogleLoginDto dto) {
        String email;
        String name;
        String googleId;
        String platform = dto.platform();

        if (dto.idToken() != null && !dto.idToken().isBlank()) {
            GoogleAuthService.GoogleUserProfile profile = googleAuthService.verifyIdToken(dto.idToken());
            email = profile.email();
            name = profile.name();
            googleId = profile.googleId();
        } else if (dto.email() != null && !dto.email().isBlank()) {
            email = dto.email().trim().toLowerCase();
            name = (dto.name() != null && !dto.name().isBlank()) ? dto.name().trim() : "Usuário Google";
            googleId = (dto.googleId() != null && !dto.googleId().isBlank()) ? dto.googleId() : UUID.randomUUID().toString();
        } else {
            throw ApiException.badRequest("Credenciais de login Google ausentes.");
        }

        User user = userRepository.findByEmail(email)
                .filter(u -> !Boolean.TRUE.equals(u.getGuest()))
                .orElse(null);

        if (user != null) {
            user.setLastSeenAt(Instant.now());
            if (name != null && !name.isBlank() && ("Usuário".equalsIgnoreCase(user.getName()) || user.getName().isBlank())) {
                user.setName(name);
            }
            if (platform != null) user.setPlatform(platform);
            if ("business_web".equalsIgnoreCase(platform) && !"merchant".equalsIgnoreCase(user.getRole())) {
                user.setRole("merchant");
            }
            PublicUserDto saved = toPublic(userRepository.save(user));

            kafkaEventPublisher.publishUserActivity(new UserActivityEvent(
                    "GOOGLE_LOGIN",
                    saved.id(),
                    saved.email(),
                    saved.role(),
                    saved.platform(),
                    Instant.now(),
                    Map.of("googleId", googleId)
            ));

            return saved;
        }

        User newUser = new User();
        newUser.setId(UUID.randomUUID().toString());
        newUser.setName(name);
        newUser.setEmail(email);
        newUser.setGuest(false);
        newUser.setPlatform(platform);
        newUser.setRole("business_web".equalsIgnoreCase(platform) ? "merchant" : "user");
        newUser.setCreatedAt(Instant.now());
        newUser.setLastSeenAt(Instant.now());

        PublicUserDto saved = toPublic(userRepository.save(newUser));

        kafkaEventPublisher.publishUserActivity(new UserActivityEvent(
                "GOOGLE_REGISTER",
                saved.id(),
                saved.email(),
                saved.role(),
                saved.platform(),
                Instant.now(),
                Map.of("googleId", googleId)
        ));

        return saved;
    }

    @Transactional
    public PublicUserDto sync(SyncUserDto dto) {
        String email = dto.email() != null ? dto.email().trim().toLowerCase() : "";

        User user = userRepository.findById(dto.id()).orElse(null);

        if (user == null && !email.isBlank()) {
            user = userRepository.findByEmail(email)
                    .filter(u -> !Boolean.TRUE.equals(u.getGuest()))
                    .orElse(null);
        }

        if (user == null) {
            User newUser = new User();
            newUser.setId(dto.id());
            newUser.setName(dto.name().trim());
            newUser.setEmail(email);
            newUser.setGuest(dto.isGuest());
            newUser.setPlatform(dto.platform());
            newUser.setRole("user");
            newUser.setCreatedAt(Instant.now());
            newUser.setLastSeenAt(Instant.now());

            PublicUserDto saved = toPublic(userRepository.save(newUser));

            kafkaEventPublisher.publishUserActivity(new UserActivityEvent(
                    "USER_SYNC_NEW",
                    saved.id(),
                    saved.email(),
                    saved.role(),
                    saved.platform(),
                    Instant.now(),
                    Map.of("isGuest", saved.isGuest())
            ));

            return saved;
        }

        user.setName(dto.name().trim());
        if (!email.isBlank()) {
            user.setEmail(email);
        }
        user.setGuest(dto.isGuest());
        if (dto.platform() != null) {
            user.setPlatform(dto.platform());
        }
        user.setLastSeenAt(Instant.now());

        PublicUserDto saved = toPublic(userRepository.save(user));

        kafkaEventPublisher.publishUserActivity(new UserActivityEvent(
                "USER_SYNCED",
                saved.id(),
                saved.email(),
                saved.role(),
                saved.platform(),
                Instant.now(),
                Map.of("isGuest", saved.isGuest())
        ));

        return saved;
    }

    public PublicUserDto findById(String id) {
        return userRepository.findById(id)
                .map(this::toPublic)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
    }

    @Transactional
    public PublicUserDto upgradeToMerchant(UpgradeToMerchantDto dto) {
        User user = userRepository.findById(dto.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));

        user.setRole("merchant");
        user.setBusinessName(dto.businessName().trim());
        user.setLastSeenAt(Instant.now());

        PublicUserDto saved = toPublic(userRepository.save(user));

        kafkaEventPublisher.publishUserActivity(new UserActivityEvent(
                "USER_UPGRADED_TO_MERCHANT",
                saved.id(),
                saved.email(),
                saved.role(),
                saved.platform(),
                Instant.now(),
                Map.of("businessName", dto.businessName())
        ));

        return saved;
    }

    @Transactional
    public MessageResponseDto forgotPassword(ForgotPasswordDto dto) {
        String email = dto.email().trim().toLowerCase();

        userRepository.findByEmail(email)
                .filter(u -> !Boolean.TRUE.equals(u.getGuest()))
                .ifPresent(user -> {
                    String token = UUID.randomUUID().toString();
                    user.setPasswordResetToken(token);
                    user.setPasswordResetExpiresAt(Instant.now().plus(1, ChronoUnit.HOURS));
                    userRepository.save(user);

                    emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), token);

                    kafkaEventPublisher.publishUserActivity(new UserActivityEvent(
                            "USER_FORGOT_PASSWORD",
                            user.getId(),
                            user.getEmail(),
                            user.getRole(),
                            user.getPlatform(),
                            Instant.now(),
                            Map.of()
                    ));
                });

        return new MessageResponseDto(
                "Se o e-mail informado estiver cadastrado, você receberá o link de redefinição de senha em instantes.",
                true
        );
    }

    @Transactional
    public MessageResponseDto resetPassword(ResetPasswordDto dto) {
        String token = dto.token().trim();

        User user = userRepository.findByPasswordResetToken(token)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Token de recuperação inválido ou expirado."));

        if (user.getPasswordResetExpiresAt() == null || user.getPasswordResetExpiresAt().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "O link de recuperação expirou. Solicite um novo.");
        }

        user.setPasswordHash(PasswordUtil.hashPassword(dto.newPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiresAt(null);
        userRepository.save(user);

        kafkaEventPublisher.publishUserActivity(new UserActivityEvent(
                "USER_PASSWORD_RESET",
                user.getId(),
                user.getEmail(),
                user.getRole(),
                user.getPlatform(),
                Instant.now(),
                Map.of()
        ));

        return new MessageResponseDto(
                "Sua senha foi atualizada com sucesso! Agora você já pode entrar com a nova senha.",
                true
        );
    }

    @Transactional
    public MessageResponseDto confirmAccount(ConfirmAccountDto dto) {
        String token = dto.token().trim();

        User user = userRepository.findByEmailConfirmationToken(token)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Token de confirmação inválido ou já utilizado."));

        user.setEmailConfirmed(true);
        user.setEmailConfirmationToken(null);
        userRepository.save(user);

        kafkaEventPublisher.publishUserActivity(new UserActivityEvent(
                "USER_EMAIL_CONFIRMED",
                user.getId(),
                user.getEmail(),
                user.getRole(),
                user.getPlatform(),
                Instant.now(),
                Map.of()
        ));

        return new MessageResponseDto(
                "E-mail confirmado com sucesso! Sua conta está 100% verificada.",
                true
        );
    }
}
