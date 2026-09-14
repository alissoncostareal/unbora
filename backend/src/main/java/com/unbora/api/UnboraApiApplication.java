package com.unbora.api;

import com.unbora.api.config.DotenvLoader;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;

@SpringBootApplication(exclude = {KafkaAutoConfiguration.class})
public class UnboraApiApplication {

    public static void main(String[] args) {
        DotenvLoader.load();
        SpringApplication.run(UnboraApiApplication.class, args);
    }

    @Bean
    public CommandLineRunner startupBanner(Environment env) {
        return args -> {
            String port = env.getProperty("server.port", "3001");
            String groqKey = env.getProperty("unbora.groq.api-key", "");
            String dbUrl = env.getProperty("spring.datasource.url", "");
            String braveKey = env.getProperty("unbora.brave.api-key", "");
            String placesKey = env.getProperty("unbora.google.places-api-key", "");
            String superadminEmail = env.getProperty("unbora.superadmin.email", "");
            String superadminPassword = env.getProperty("unbora.superadmin.password", "");
            String jwtSecret = env.getProperty("unbora.jwt.secret", "");
            boolean kafkaEnabled = Boolean.parseBoolean(env.getProperty("unbora.kafka.enabled", "false"));

            boolean groqReady = groqKey != null && !groqKey.isBlank();
            boolean dbReady = dbUrl != null && !dbUrl.isBlank();
            boolean braveReady = braveKey != null && !braveKey.isBlank();
            boolean placesReady = placesKey != null && !placesKey.isBlank();
            boolean superadminReady = superadminEmail != null && !superadminEmail.isBlank() && superadminPassword != null && !superadminPassword.isBlank();
            boolean jwtReady = jwtSecret != null && !jwtSecret.isBlank();

            String maskedSuperadmin = superadminEmail != null && superadminEmail.contains("@")
                    ? superadminEmail.replaceAll("(.{2}).+(@.*)", "$1***$2")
                    : "não configurado";

            String baseUrl = "http://localhost:" + port;

            System.out.println("");
            System.out.println("╔══════════════════════════════════════════════╗");
            System.out.println(formatRow("✓ Unbora API (Spring Boot 3.4) rodando"));
            System.out.println("╠══════════════════════════════════════════════╣");
            System.out.println(formatRow("Local:    " + baseUrl));
            System.out.println(formatRow("Health:   " + baseUrl + "/health"));
            System.out.println(formatRow("Swagger:  " + baseUrl + "/swagger-ui.html"));
            System.out.println(formatRow("Groq/IA:  " + (groqReady ? "ok" : "faltando GROQ_API_KEY")));
            System.out.println(formatRow("Postgres: " + (dbReady ? "ok (Neon DB)" : "faltando DATABASE_URL")));
            System.out.println(formatRow("Brave:    " + (braveReady ? "ok" : "opcional")));
            System.out.println(formatRow("Places:   " + (placesReady ? "ok (fotos)" : "faltando GOOGLE_PLACES_API_KEY")));
            System.out.println(formatRow("Kafka:    " + (kafkaEnabled ? "on" : "off (ok no Render)")));
            System.out.println(formatRow("Admin:    " + (superadminReady && jwtReady ? "ok (.env)" : "faltando SUPERADMIN_* / ADMIN_JWT_SECRET")));
            if (superadminReady) {
                System.out.println(formatRow("Super:    " + maskedSuperadmin));
            }
            System.out.println("╠══════════════════════════════════════════════╣");
            System.out.println(formatRow("Celular:  http://<seu-ip>:" + port));
            System.out.println("╚══════════════════════════════════════════════╝");
            System.out.println("");
        };
    }

    private static String formatRow(String text) {
        int width = 44;
        if (text.length() > width) {
            text = text.substring(0, width);
        }
        return "║  " + String.format("%-" + width + "s", text) + "║";
    }
}
