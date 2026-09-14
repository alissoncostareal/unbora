package com.unbora.api.kafka.event;

import java.time.Instant;
import java.util.Map;

public record UserActivityEvent(
        String eventType, // e.g. "USER_REGISTERED", "MERCHANT_REGISTERED", "USER_LOGGED_IN", "USER_SYNCED"
        String userId,
        String email,
        String role,
        String platform,
        Instant timestamp,
        Map<String, Object> metadata
) {}
