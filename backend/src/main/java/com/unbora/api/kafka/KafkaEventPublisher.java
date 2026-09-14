package com.unbora.api.kafka;

import com.unbora.api.kafka.event.ImageEnrichmentEvent;
import com.unbora.api.kafka.event.RecommendationEvent;
import com.unbora.api.kafka.event.UserActivityEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
public class KafkaEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(KafkaEventPublisher.class);

    private final ObjectProvider<KafkaTemplate<String, Object>> kafkaTemplate;
    private final boolean kafkaEnabled;

    public KafkaEventPublisher(
            ObjectProvider<KafkaTemplate<String, Object>> kafkaTemplate,
            @Value("${unbora.kafka.enabled:false}") boolean kafkaEnabled
    ) {
        this.kafkaTemplate = kafkaTemplate;
        this.kafkaEnabled = kafkaEnabled;
        if (!kafkaEnabled) {
            log.info("[Kafka] desabilitado (UNBORA_KAFKA_ENABLED=false) — telemetria em no-op");
        }
    }

    public void publishUserActivity(UserActivityEvent event) {
        send(KafkaConfig.TOPIC_USER_ACTIVITY, event.userId() != null ? event.userId() : "anonymous", event, event.eventType());
    }

    public void publishRecommendation(RecommendationEvent event) {
        send(KafkaConfig.TOPIC_RECOMMENDATIONS, event.humor() != null ? event.humor() : "general", event, event.eventType());
    }

    public void publishImageEnrichment(ImageEnrichmentEvent event) {
        send(KafkaConfig.TOPIC_IMAGE_ENRICHMENT, event.venue() != null ? event.venue() : "general", event, "IMAGE_ENRICHMENT");
    }

    private void send(String topic, String key, Object event, String label) {
        if (!kafkaEnabled) return;
        KafkaTemplate<String, Object> template = kafkaTemplate.getIfAvailable();
        if (template == null) return;
        CompletableFuture.runAsync(() -> {
            try {
                template.send(topic, key, event)
                        .whenComplete((result, ex) -> {
                            if (ex == null) {
                                log.info("[Kafka Producer] {} ok offset={}", label, result.getRecordMetadata().offset());
                            } else {
                                log.warn("[Kafka Producer] Falha {}: {}", label, ex.getMessage());
                            }
                        });
            } catch (Exception e) {
                log.warn("[Kafka Producer] Erro ao disparar {}: {}", label, e.getMessage());
            }
        });
    }
}
