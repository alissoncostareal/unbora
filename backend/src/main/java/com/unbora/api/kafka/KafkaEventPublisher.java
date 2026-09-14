package com.unbora.api.kafka;

import com.unbora.api.kafka.event.ImageEnrichmentEvent;
import com.unbora.api.kafka.event.RecommendationEvent;
import com.unbora.api.kafka.event.UserActivityEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
public class KafkaEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(KafkaEventPublisher.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final boolean kafkaEnabled;

    public KafkaEventPublisher(
            KafkaTemplate<String, Object> kafkaTemplate,
            @Value("${unbora.kafka.enabled:true}") boolean kafkaEnabled
    ) {
        this.kafkaTemplate = kafkaTemplate;
        this.kafkaEnabled = kafkaEnabled;
    }

    public void publishUserActivity(UserActivityEvent event) {
        if (!kafkaEnabled) return;
        CompletableFuture.runAsync(() -> {
            try {
                String key = event.userId() != null ? event.userId() : "anonymous";
                kafkaTemplate.send(KafkaConfig.TOPIC_USER_ACTIVITY, key, event)
                        .whenComplete((result, ex) -> {
                            if (ex == null) {
                                log.info("[Kafka Producer] Evento {} enviado com sucesso. Offset: {}", event.eventType(), result.getRecordMetadata().offset());
                            } else {
                                log.warn("[Kafka Producer] Falha ao enviar evento {}: {}", event.eventType(), ex.getMessage());
                            }
                        });
            } catch (Exception e) {
                log.warn("[Kafka Producer] Erro ao disparar mensagem para o Kafka: {}", e.getMessage());
            }
        });
    }

    public void publishRecommendation(RecommendationEvent event) {
        if (!kafkaEnabled) return;
        CompletableFuture.runAsync(() -> {
            try {
                String key = event.humor() != null ? event.humor() : "general";
                kafkaTemplate.send(KafkaConfig.TOPIC_RECOMMENDATIONS, key, event)
                        .whenComplete((result, ex) -> {
                            if (ex == null) {
                                log.info("[Kafka Producer] Recomendação {} registrada no Kafka. Offset: {}", event.eventType(), result.getRecordMetadata().offset());
                            } else {
                                log.warn("[Kafka Producer] Falha ao enviar recomendação: {}", ex.getMessage());
                            }
                        });
            } catch (Exception e) {
                log.warn("[Kafka Producer] Erro ao disparar recomendação para o Kafka: {}", e.getMessage());
            }
        });
    }

    public void publishImageEnrichment(ImageEnrichmentEvent event) {
        if (!kafkaEnabled) return;
        CompletableFuture.runAsync(() -> {
            try {
                String key = event.venue() != null ? event.venue() : "general";
                kafkaTemplate.send(KafkaConfig.TOPIC_IMAGE_ENRICHMENT, key, event)
                        .whenComplete((result, ex) -> {
                            if (ex == null) {
                                log.debug("[Kafka Producer] Tarefa de enriquecimento de imagem para '{}' enviada ao Kafka. Offset: {}", event.venue(), result.getRecordMetadata().offset());
                            } else {
                                log.warn("[Kafka Producer] Falha ao enviar evento de enriquecimento: {}", ex.getMessage());
                            }
                        });
            } catch (Exception e) {
                log.warn("[Kafka Producer] Erro ao disparar enriquecimento para o Kafka: {}", e.getMessage());
            }
        });
    }
}
