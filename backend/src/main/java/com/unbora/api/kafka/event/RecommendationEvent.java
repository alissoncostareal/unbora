package com.unbora.api.kafka.event;

import java.time.Instant;
import java.util.List;

public record RecommendationEvent(
        String eventType, // e.g. "RECOMMENDATION_GENERATED", "SEARCH_PERFORMED", "EVENTS_DISCOVERED"
        String humor,
        String sentir,
        List<String> activities,
        String query,
        String city,
        int resultsCount,
        String topResultName,
        Instant timestamp
) {}
