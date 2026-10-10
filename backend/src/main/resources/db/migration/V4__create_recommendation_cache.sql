-- Cache persistente de recomendacoes e buscas geradas por IA/Groq.
-- Economiza chamadas a LLM e Google Places com resposta instantanea em consultas repetidas.
CREATE TABLE IF NOT EXISTS recommendation_cache (
    cache_key VARCHAR(128) PRIMARY KEY,
    query_type VARCHAR(32) NOT NULL,
    city VARCHAR(100) NOT NULL,
    payload TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recommendation_cache_expires_at
    ON recommendation_cache (expires_at);

CREATE INDEX IF NOT EXISTS idx_recommendation_cache_city
    ON recommendation_cache (LOWER(city));
