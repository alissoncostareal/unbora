package com.unbora.api.domain.user;

import com.unbora.api.domain.user.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@Tag(name = "Users", description = "Operações de usuários do app e lojistas")
public class UsersController {

    private final UsersService usersService;

    public UsersController(UsersService usersService) {
        this.usersService = usersService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CONSULTOR')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Listar usuários (Portal Admin)")
    public List<PublicUserDto> list() {
        return usersService.list();
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CONSULTOR')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Estatísticas de usuários (Portal Admin)")
    public UserStatsDto stats() {
        return usersService.stats();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CONSULTOR')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Buscar usuário por ID")
    public PublicUserDto findOne(@PathVariable String id) {
        return usersService.findById(id);
    }

    @PostMapping("/register")
    @Operation(summary = "Cadastrar usuário comum")
    public PublicUserDto register(@Valid @RequestBody RegisterUserDto dto) {
        return usersService.register(dto);
    }

    @PostMapping("/register-merchant")
    @Operation(summary = "Cadastrar lojista/comerciante parceiro")
    public PublicUserDto registerMerchant(@Valid @RequestBody RegisterMerchantDto dto) {
        return usersService.registerMerchant(dto);
    }

    @PostMapping("/login")
    @Operation(summary = "Login de usuário / lojista com e-mail e senha")
    public PublicUserDto login(@Valid @RequestBody LoginUserDto dto) {
        return usersService.login(dto);
    }

    @PostMapping("/google-login")
    @Operation(summary = "Login social Google")
    public PublicUserDto googleLogin(@Valid @RequestBody GoogleLoginDto dto) {
        return usersService.googleLogin(dto);
    }

    @PostMapping("/sync")
    @Operation(summary = "Sincronizar sessão do app (convidado ou logado)")
    public PublicUserDto sync(@Valid @RequestBody SyncUserDto dto) {
        return usersService.sync(dto);
    }
}
