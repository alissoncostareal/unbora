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
        try {
            log.info("[pgvector] Inicializando extensão vector e tabelas RAG no PostgreSQL...");

            // 1. Extensão (Flyway V2 também cria; aqui é rede de segurança no boot)
            jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS vector;");
            log.info("[pgvector] Extensão 'vector' verificada com sucesso.");

            // 2. Garante tabela/índices mesmo se Flyway falhar (Neon sem permissão pontual)
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
                    embedding vector(1536),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """;
            jdbcTemplate.execute(createTableSql);

            // 3. Criar índices
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_place_embeddings_city ON place_embeddings(LOWER(city));");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_place_embeddings_category ON place_embeddings(category_tag);");

            // 4. Criar índice HNSW vetorial para buscas de cosseno ultrarrápidas
            try {
                jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_place_embeddings_hnsw ON place_embeddings USING hnsw (embedding vector_cosine_ops);");
                log.info("[pgvector] Índice HNSW criado/verificado para place_embeddings.");
            } catch (Exception hnswEx) {
                log.debug("[pgvector] Aviso no índice HNSW (pode já existir ou precisar de dados): {}", hnswEx.getMessage());
            }

            log.info("[pgvector] Estrutura RAG pronta para buscas semânticas.");
        } catch (Exception e) {
            log.warn("[pgvector] Aviso na inicialização vetorial: {}", e.getMessage());
        }
    }
}
