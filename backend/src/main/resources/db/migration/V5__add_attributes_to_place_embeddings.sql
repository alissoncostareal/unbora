-- V5: Adiciona suporte a DNA tags e atributos semanticos para aprendizado continuo (RAG + pgvector)
ALTER TABLE place_embeddings ADD COLUMN IF NOT EXISTS tags TEXT;
ALTER TABLE place_embeddings ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_place_embeddings_tags ON place_embeddings (tags);
CREATE INDEX IF NOT EXISTS idx_place_embeddings_attributes ON place_embeddings USING gin (attributes);
