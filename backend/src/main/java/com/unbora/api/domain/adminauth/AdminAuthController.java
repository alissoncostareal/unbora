package com.unbora.api.domain.adminauth;

import com.unbora.api.domain.adminauth.dto.AdminLoginDto;
import com.unbora.api.domain.adminauth.dto.AdminLoginResponseDto;
import com.unbora.api.domain.adminauth.dto.AdminSessionDto;
import com.unbora.api.domain.adminauth.dto.CreatePortalUserDto;
import com.unbora.api.domain.adminauth.dto.PortalUserResponseDto;
import com.unbora.api.security.AdminPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@Tag(name = "Admin Auth", description = "Autenticação e gestão de usuários do portal administrativo")
public class AdminAuthController {

    private final AdminAuthService adminAuthService;

    public AdminAuthController(AdminAuthService adminAuthService) {
        this.adminAuthService = adminAuthService;
    }

    @PostMapping("/auth/login")
    @Operation(summary = "Login no portal administrativo")
    public AdminLoginResponseDto login(@Valid @RequestBody AdminLoginDto dto) {
        return adminAuthService.login(dto);
    }

    @GetMapping("/auth/me")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Obter dados do usuário admin logado")
    public AdminSessionDto me(@AuthenticationPrincipal AdminPrincipal principal) {
        if (principal == null) return null;
        return new AdminSessionDto(
                principal.id(),
                principal.name(),
                principal.email(),
                principal.role()
        );
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Listar usuários administrativos do portal (Superadmin)")
    public List<PortalUserResponseDto> listPortalUsers() {
        return adminAuthService.listPortalUsers();
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Criar usuário administrativo no portal (Superadmin)")
    public PortalUserResponseDto createPortalUser(@Valid @RequestBody CreatePortalUserDto dto) {
        return adminAuthService.createPortalUser(dto);
    }
}
