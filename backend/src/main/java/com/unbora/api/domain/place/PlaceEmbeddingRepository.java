package com.unbora.api.domain.place;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface PlaceEmbeddingRepository extends JpaRepository<PlaceEmbedding, String> {

    @Query(value = """
        SELECT id, name, city, category_tag as categoryTag, primary_type as primaryType, 
               formatted_address as formattedAddress, latitude, longitude, rating, 
               user_rating_count as userRatingCount, google_maps_uri as googleMapsUri, 
               photo_url as photoUrl, vibe_summary as vibeSummary,
               (1.0 - (embedding <=> CAST(:queryVector AS vector))) AS similarity
        FROM place_embeddings
        WHERE LOWER(city) = LOWER(:city)
        ORDER BY (
            (1.0 - (embedding <=> CAST(:queryVector AS vector))) * 0.70 + 
            (COALESCE(rating, 4.5) / 5.0) * 0.30
        ) DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<PlaceEmbeddingProjection> findSimilarPlaces(
            @Param("city") String city,
            @Param("queryVector") String queryVector,
            @Param("limit") int limit
    );

    @Query(value = """
        SELECT id, name, city, category_tag as categoryTag, primary_type as primaryType, 
               formatted_address as formattedAddress, latitude, longitude, rating, 
               user_rating_count as userRatingCount, google_maps_uri as googleMapsUri, 
               photo_url as photoUrl, vibe_summary as vibeSummary,
               (1.0 - (embedding <=> CAST(:queryVector AS vector))) AS similarity
        FROM place_embeddings
        ORDER BY (
            (1.0 - (embedding <=> CAST(:queryVector AS vector))) * 0.70 + 
            (COALESCE(rating, 4.5) / 5.0) * 0.30
        ) DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<PlaceEmbeddingProjection> findSimilarPlacesGlobal(
            @Param("queryVector") String queryVector,
            @Param("limit") int limit
    );

    @Modifying
    @Transactional
    @Query(value = """
        INSERT INTO place_embeddings (
            id, name, city, category_tag, primary_type, formatted_address, 
            latitude, longitude, rating, user_rating_count, google_maps_uri, 
            photo_url, vibe_summary, embedding, created_at, updated_at
        ) VALUES (
            :id, :name, :city, :categoryTag, :primaryType, :formattedAddress,
            :latitude, :longitude, :rating, :userRatingCount, :googleMapsUri,
            :photoUrl, :vibeSummary, CAST(:embeddingVector AS vector), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            city = EXCLUDED.city,
            category_tag = EXCLUDED.category_tag,
            primary_type = EXCLUDED.primary_type,
            formatted_address = EXCLUDED.formatted_address,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            rating = EXCLUDED.rating,
            user_rating_count = EXCLUDED.user_rating_count,
            google_maps_uri = EXCLUDED.google_maps_uri,
            photo_url = EXCLUDED.photo_url,
            vibe_summary = EXCLUDED.vibe_summary,
            embedding = EXCLUDED.embedding,
            updated_at = CURRENT_TIMESTAMP
        """, nativeQuery = true)
    void upsertPlaceVector(
            @Param("id") String id,
            @Param("name") String name,
            @Param("city") String city,
            @Param("categoryTag") String categoryTag,
            @Param("primaryType") String primaryType,
            @Param("formattedAddress") String formattedAddress,
            @Param("latitude") Double latitude,
            @Param("longitude") Double longitude,
            @Param("rating") Double rating,
            @Param("userRatingCount") Integer userRatingCount,
            @Param("googleMapsUri") String googleMapsUri,
            @Param("photoUrl") String photoUrl,
            @Param("vibeSummary") String vibeSummary,
            @Param("embeddingVector") String embeddingVector
    );

    long countByCityIgnoreCase(String city);
}
