package com.unbora.api.config;

import com.unbora.api.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final com.unbora.api.common.security.AiRateLimitFilter aiRateLimitFilter;
    private final String allowedOrigin;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            com.unbora.api.common.security.AiRateLimitFilter aiRateLimitFilter,
            @Value("${unbora.cors.allowed-origin:*}") String allowedOrigin
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.aiRateLimitFilter = aiRateLimitFilter;
        this.allowedOrigin = allowedOrigin;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .headers(headers -> headers
                        .contentTypeOptions(contentType -> {})
                        .frameOptions(frame -> frame.deny())
                        .xssProtection(xss -> {})
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31536000))
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public system endpoints
                        .requestMatchers("/", "/health").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/venue-photos/**").hasAnyRole("SUPERADMIN", "ADMIN")
                        .requestMatchers("/api/**").permitAll()
                        .requestMatchers("/locations/**").permitAll()

                        // Swagger UI & OpenAPI docs
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()

                        // Admin authentication & endpoints
                        .requestMatchers("/admin/auth/login").permitAll()
                        .requestMatchers("/admin/auth/me").authenticated()
                        .requestMatchers("/admin/events/**").hasAnyRole("SUPERADMIN", "ADMIN")
                        .requestMatchers("/admin/users/**").hasRole("SUPERADMIN")
                        .requestMatchers("/admin/guide/**").hasAnyRole("SUPERADMIN", "ADMIN")
                        .requestMatchers("/admin/bans/**").hasAnyRole("SUPERADMIN", "ADMIN")
                        .requestMatchers("/admin/places/**").hasAnyRole("SUPERADMIN", "ADMIN")
                        .requestMatchers("/admin/locations/**").hasAnyRole("SUPERADMIN", "ADMIN", "CONSULTOR")
                        .requestMatchers("/admin/sponsored/**").hasAnyRole("SUPERADMIN", "ADMIN", "CONSULTOR")
                        .requestMatchers("/admin/partner-settings/**").hasAnyRole("SUPERADMIN", "ADMIN", "CONSULTOR")
                        .requestMatchers("/admin/testimonials/**").hasAnyRole("SUPERADMIN", "ADMIN", "CONSULTOR")

                        // Public content endpoints
                        .requestMatchers(HttpMethod.GET, "/guide").permitAll()
                        .requestMatchers(HttpMethod.GET, "/partner-settings/**", "/api/partner-settings/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/testimonials/**", "/api/testimonials/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/events/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/events").permitAll()
                        .requestMatchers(HttpMethod.POST, "/events/sync-live").hasAnyRole("SUPERADMIN", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/carousels/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/notifications/**").permitAll()
                        .requestMatchers("/checkins/**").permitAll()

                        // Public user onboarding & auth
                        .requestMatchers(HttpMethod.POST, "/users/sync").permitAll()
                        .requestMatchers(HttpMethod.POST, "/users/register").permitAll()
                        .requestMatchers(HttpMethod.POST, "/users/register-merchant").permitAll()
                        .requestMatchers(HttpMethod.POST, "/users/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/users/google-login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/users/forgot-password").permitAll()
                        .requestMatchers(HttpMethod.POST, "/users/reset-password").permitAll()
                        .requestMatchers(HttpMethod.POST, "/users/confirm-account").permitAll()
                        .requestMatchers(HttpMethod.POST, "/users/upgrade-to-merchant").authenticated()

                        // Protected user administration
                        .requestMatchers("/users/stats").hasAnyRole("SUPERADMIN", "ADMIN", "CONSULTOR")
                        .requestMatchers(HttpMethod.GET, "/users").hasAnyRole("SUPERADMIN", "ADMIN", "CONSULTOR")
                        .requestMatchers(HttpMethod.GET, "/users/*").hasAnyRole("SUPERADMIN", "ADMIN", "CONSULTOR")

                        // Merchant portal operations
                        .requestMatchers(HttpMethod.GET, "/merchant/sponsored/plans").permitAll()
                        .requestMatchers("/merchant/sponsored/**").hasAnyRole("MERCHANT", "SUPERADMIN", "ADMIN")

                        // Default fallback: require authentication
                        .anyRequest().authenticated()
                )
                .addFilterBefore(aiRateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        if ("*".equals(allowedOrigin) || allowedOrigin.isBlank()) {
            configuration.addAllowedOriginPattern("*");
            configuration.setAllowCredentials(false);
        } else {
            configuration.setAllowedOrigins(Arrays.asList(allowedOrigin.split(",")));
            configuration.setAllowCredentials(true);
        }
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Content-Type", "Authorization", "x-user-id"));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
