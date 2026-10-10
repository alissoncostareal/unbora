package com.unbora.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseVectorInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseVectorInitializer.class);

    private final JdbcTemplate jdbcTemplate;

    public DatabaseVectorInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        log.info("[DatabaseInitializer] Verificando tabelas RAG e cache de fotos no PostgreSQL...");

        // 1. Extensão vector (opcional caso a imagem postgres não contenha pgvector)
        try {
            jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS vector;");
            log.info("[DatabaseInitializer] Extensão 'vector' verificada com sucesso.");
        } catch (Exception e) {
            log.debug("[DatabaseInitializer] Extensão 'vector' não disponível no Postgres: {}", e.getMessage());
        }

        // 2. Tabela place_embeddings
        try {
            String createTableSql = """
                CREATE TABLE IF NOT EXISTS place_embeddings (
                    id VARCHAR(64) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    city VARCHAR(100) NOT NULL,
                    category_tag VARCHAR(50),
                    primary_type VARCHAR(100),
                    formatted_address TEXT,
                    latitude DOUBLE PRECISION,
                    longitude DOUBLE PRECISION,
                    rating DOUBLE PRECISION,
                    user_rating_count INT,
                    google_maps_uri TEXT,
                    photo_url TEXT,
                    vibe_summary TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """;
            jdbcTemplate.execute(createTableSql);

            try {
                jdbcTemplate.execute("ALTER TABLE place_embeddings ADD COLUMN IF NOT EXISTS embedding vector(1536);");
            } catch (Exception ignored) {}

            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_place_embeddings_city ON place_embeddings(LOWER(city));");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_place_embeddings_category ON place_embeddings(category_tag);");

            try {
                jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_place_embeddings_hnsw ON place_embeddings USING hnsw (embedding vector_cosine_ops);");
            } catch (Exception ignored) {}
        } catch (Exception e) {
            log.warn("[DatabaseInitializer] Aviso na tabela place_embeddings: {}", e.getMessage());
        }

        // 3. Cache persistente de fotos de locais (Fetch Once, Serve Forever)
        try {
            String createPhotoCacheSql = """
                CREATE TABLE IF NOT EXISTS place_photo_cache (
                    photo_key TEXT PRIMARY KEY,
                    photo_uri TEXT NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_place_photo_cache_created_at ON place_photo_cache(created_at);
            """;
            jdbcTemplate.execute(createPhotoCacheSql);
            log.info("[DatabaseInitializer] Tabela place_photo_cache verificada com sucesso.");
        } catch (Exception e) {
            log.warn("[DatabaseInitializer] Erro ao criar place_photo_cache: {}", e.getMessage());
        }

        // 4. Cache persistente de recomendacoes da LLM/Groq
        try {
            String createRecCacheSql = """
                CREATE TABLE IF NOT EXISTS recommendation_cache (
                    cache_key VARCHAR(128) PRIMARY KEY,
                    query_type VARCHAR(32) NOT NULL,
                    city VARCHAR(100) NOT NULL,
                    payload TEXT NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_recommendation_cache_expires_at ON recommendation_cache(expires_at);
                CREATE INDEX IF NOT EXISTS idx_recommendation_cache_city ON recommendation_cache(LOWER(city));
            """;
            jdbcTemplate.execute(createRecCacheSql);
            log.info("[DatabaseInitializer] Tabela recommendation_cache verificada com sucesso.");
        } catch (Exception e) {
            log.warn("[DatabaseInitializer] Erro ao criar recommendation_cache: {}", e.getMessage());
        }

        log.info("[DatabaseInitializer] Inicialização de tabelas e cache concluída.");
    }
}
