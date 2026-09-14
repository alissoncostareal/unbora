package com.unbora.api.kafka.event;

import java.time.Instant;

public record ImageEnrichmentEvent(
        String venue,
        String city,
        String visualQuery,
        String categoryTag,
        Instant timestamp
) {}
