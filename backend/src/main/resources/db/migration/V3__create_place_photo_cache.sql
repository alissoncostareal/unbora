-- Cache persistente para fotos reais de locais (Google Places / lh3.googleusercontent.com).
-- Garante modelo "Fetch Once, Serve Forever" com custo zero em consultas repetidas.
CREATE TABLE IF NOT EXISTS place_photo_cache (
    photo_key TEXT PRIMARY KEY,
    photo_uri TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_place_photo_cache_created_at
    ON place_photo_cache (created_at);
