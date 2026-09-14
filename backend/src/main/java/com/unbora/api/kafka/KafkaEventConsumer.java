package com.unbora.api.kafka;

import com.unbora.api.kafka.event.ImageEnrichmentEvent;
import com.unbora.api.kafka.event.RecommendationEvent;
import com.unbora.api.kafka.event.UserActivityEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

/**
 * Consumidores leves — telemetria / auditoria.
 * Só registra beans quando Kafka está habilitado.
 */
@Service
@ConditionalOnProperty(name = "unbora.kafka.enabled", havingValue = "true")
public class KafkaEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(KafkaEventConsumer.class);

    @KafkaListener(topics = KafkaConfig.TOPIC_USER_ACTIVITY, groupId = "unbora-backend-group")
    public void consumeUserActivity(UserActivityEvent event) {
        log.debug("[Kafka] user.activity type={} userId={}", event.eventType(), event.userId());
    }

    @KafkaListener(topics = KafkaConfig.TOPIC_RECOMMENDATIONS, groupId = "unbora-backend-group")
    public void consumeRecommendations(RecommendationEvent event) {
        log.debug("[Kafka] recommendations type={} city={} results={}",
                event.eventType(), event.city(), event.resultsCount());
    }

    @KafkaListener(topics = KafkaConfig.TOPIC_IMAGE_ENRICHMENT, groupId = "unbora-backend-group")
    public void consumeImageEnrichment(ImageEnrichmentEvent event) {
        log.debug("[Kafka] image.enrichment ignorado (venue={})", event.venue());
    }
}
