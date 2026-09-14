-- RAG Semântico: pgvector + place_embeddings (Neon/PostgreSQL)
-- Aplicado em runtime por DatabaseVectorInitializer (CREATE IF NOT EXISTS).
-- Pode também ser executado manualmente no SQL Editor do Neon.
CREATE EXTENSION IF NOT EXISTS vector;

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
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_place_embeddings_city
    ON place_embeddings (LOWER(city));

CREATE INDEX IF NOT EXISTS idx_place_embeddings_category
    ON place_embeddings (category_tag);

-- HNSW para similaridade de cosseno ultrarrápida
CREATE INDEX IF NOT EXISTS idx_place_embeddings_hnsw
    ON place_embeddings
    USING hnsw (embedding vector_cosine_ops);
