package com.unbora.api.domain.adminauth;

import com.unbora.api.common.PasswordUtil;
import com.unbora.api.common.exception.ApiException;
import com.unbora.api.domain.adminauth.dto.*;
import com.unbora.api.domain.user.PortalUser;
import com.unbora.api.domain.user.PortalUserRepository;
import com.unbora.api.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class AdminAuthService {

    private final PortalUserRepository portalUserRepository;
    private final JwtService jwtService;
    private final String superadminEmail;
    private final String superadminPassword;
    private final String superadminName;

    public AdminAuthService(
            PortalUserRepository portalUserRepository,
            JwtService jwtService,
            @Value("${unbora.superadmin.email:}") String superadminEmail,
            @Value("${unbora.superadmin.password:}") String superadminPassword,
            @Value("${unbora.superadmin.name:Super Admin}") String superadminName
    ) {
        this.portalUserRepository = portalUserRepository;
        this.jwtService = jwtService;
        this.superadminEmail = superadminEmail != null ? superadminEmail.trim().toLowerCase() : "";
        this.superadminPassword = superadminPassword != null ? superadminPassword.trim() : "";
        this.superadminName = superadminName != null ? superadminName.trim() : "Super Admin";
    }

    public AdminLoginResponseDto login(AdminLoginDto dto) {
        String email = dto.email().trim().toLowerCase();

        // 1. Check superadmin environment credentials
        if (!superadminEmail.isBlank() && !superadminPassword.isBlank() && email.equals(superadminEmail)) {
            if (!dto.password().equals(superadminPassword)) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos.");
            }

            AdminSessionDto session = new AdminSessionDto(
                    "superadmin",
                    superadminName,
                    superadminEmail,
                    "superadmin"
            );
            String token = jwtService.generateToken(session.id(), session.email(), session.name(), session.role());
            return new AdminLoginResponseDto(token, session);
        }

        // 2. Check portal users in database
        PortalUser portalUser = portalUserRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos."));

        if (!PasswordUtil.verify(dto.password(), portalUser.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos.");
        }

        AdminSessionDto session = new AdminSessionDto(
                portalUser.getId(),
                portalUser.getName(),
                portalUser.getEmail(),
                portalUser.getRole()
        );
        String token = jwtService.generateToken(session.id(), session.email(), session.name(), session.role());
        return new AdminLoginResponseDto(token, session);
    }

    public List<PortalUserResponseDto> listPortalUsers() {
        return portalUserRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(u -> new PortalUserResponseDto(
                        u.getId(),
                        u.getName(),
                        u.getEmail(),
                        u.getRole(),
                        u.getCreatedAt() != null ? u.getCreatedAt().toString() : ""
                ))
                .toList();
    }

    @Transactional
    public PortalUserResponseDto createPortalUser(CreatePortalUserDto dto) {
        String email = dto.email().trim().toLowerCase();

        if (!superadminEmail.isBlank() && email.equals(superadminEmail)) {
            throw new ApiException(HttpStatus.CONFLICT, "Este e-mail já está reservado ao superadmin.");
        }

        if (portalUserRepository.findByEmail(email).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Este e-mail já está cadastrado no portal.");
        }

        PortalUser portalUser = new PortalUser();
        portalUser.setId(UUID.randomUUID().toString());
        portalUser.setName(dto.name().trim());
        portalUser.setEmail(email);
        portalUser.setPasswordHash(PasswordUtil.hashPassword(dto.password()));
        portalUser.setRole(dto.role().trim().toLowerCase());
        portalUser.setCreatedAt(Instant.now());

        PortalUser saved = portalUserRepository.save(portalUser);
        return new PortalUserResponseDto(
                saved.getId(),
                saved.getName(),
                saved.getEmail(),
                saved.getRole(),
                saved.getCreatedAt().toString()
        );
    }
}
