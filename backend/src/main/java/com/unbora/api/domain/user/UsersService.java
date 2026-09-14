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
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class UsersService {

    private final UserRepository userRepository;
    private final KafkaEventPublisher kafkaEventPublisher;
    private final GoogleAuthService googleAuthService;

    public UsersService(
            UserRepository userRepository,
            KafkaEventPublisher kafkaEventPublisher,
            GoogleAuthService googleAuthService
    ) {
        this.userRepository = userRepository;
        this.kafkaEventPublisher = kafkaEventPublisher;
        this.googleAuthService = googleAuthService;
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

        Instant startOfToday = LocalDate.now(ZoneId.of("America/Fortaleza"))
                .atStartOfDay(ZoneId.of("America/Fortaleza"))
                .toInstant();

        long activeToday = userRepository.findAll().stream()
                .filter(u -> u.getLastSeenAt() != null && u.getLastSeenAt().isAfter(startOfToday))
                .count();

        return new UserStatsDto(total, guests, registered, activeToday);
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

        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setName(dto.name().trim());
        user.setEmail(email);
        user.setGuest(false);
        user.setPasswordHash(PasswordUtil.hashPassword(dto.password()));
        user.setPlatform(dto.platform());
        user.setRole("user");
        user.setCreatedAt(Instant.now());
        user.setLastSeenAt(Instant.now());

        PublicUserDto saved = toPublic(userRepository.save(user));

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

        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setName(dto.name().trim());
        user.setEmail(email);
        user.setGuest(false);
        user.setPasswordHash(PasswordUtil.hashPassword(dto.password()));
        user.setPlatform(dto.platform());
        user.setRole("merchant");
        user.setBusinessName(dto.businessName().trim());
        user.setCreatedAt(Instant.now());
        user.setLastSeenAt(Instant.now());

        PublicUserDto saved = toPublic(userRepository.save(user));

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
        newUser.setRole("user");
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
}
