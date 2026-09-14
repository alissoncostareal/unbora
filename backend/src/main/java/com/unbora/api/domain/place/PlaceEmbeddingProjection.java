package com.unbora.api.domain.place;

public interface PlaceEmbeddingProjection {
    String getId();
    String getName();
    String getCity();
    String getCategoryTag();
    String getPrimaryType();
    String getFormattedAddress();
    Double getLatitude();
    Double getLongitude();
    Double getRating();
    Integer getUserRatingCount();
    String getGoogleMapsUri();
    String getPhotoUrl();
    String getVibeSummary();
    Double getSimilarity();
}
