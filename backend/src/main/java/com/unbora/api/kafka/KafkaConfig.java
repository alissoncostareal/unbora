package com.unbora.api.kafka;

import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.*;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

/**
 * Kafka só sobe quando UNBORA_KAFKA_ENABLED=true (docker-compose / k8s).
 * No Render e deploys sem broker, fica desligado — evita spam em localhost:29094.
 */
@Configuration
@EnableKafka
@ConditionalOnProperty(name = "unbora.kafka.enabled", havingValue = "true")
public class KafkaConfig {

    public static final String TOPIC_USER_ACTIVITY = "unbora.user.activity";
    public static final String TOPIC_RECOMMENDATIONS = "unbora.recommendations";
    public static final String TOPIC_NOTIFICATIONS = "unbora.notifications";
    public static final String TOPIC_IMAGE_ENRICHMENT = "unbora.image.enrichment";

    private final String bootstrapServers;

    public KafkaConfig(@Value("${spring.kafka.bootstrap-servers:localhost:9092}") String bootstrapServers) {
        this.bootstrapServers = bootstrapServers;
    }

    @Bean
    public ProducerFactory<String, Object> producerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        configProps.put(ProducerConfig.RETRIES_CONFIG, 2);
        configProps.put(ProducerConfig.REQUEST_TIMEOUT_MS_CONFIG, 4000);
        configProps.put(ProducerConfig.DELIVERY_TIMEOUT_MS_CONFIG, 8000);
        return new DefaultKafkaProducerFactory<>(configProps);
    }

    @Bean
    public KafkaTemplate<String, Object> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }

    @Bean
    public ConsumerFactory<String, Object> consumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "unbora-backend-group");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        props.put(JsonDeserializer.TRUSTED_PACKAGES, "com.unbora.api.kafka.event,java.util,java.lang");
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "latest");
        return new DefaultKafkaConsumerFactory<>(props);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, Object> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, Object> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        return factory;
    }

    @Bean
    public NewTopic topicUserActivity() {
        return TopicBuilder.name(TOPIC_USER_ACTIVITY)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic topicRecommendations() {
        return TopicBuilder.name(TOPIC_RECOMMENDATIONS)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic topicNotifications() {
        return TopicBuilder.name(TOPIC_NOTIFICATIONS)
                .partitions(2)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic topicImageEnrichment() {
        return TopicBuilder.name(TOPIC_IMAGE_ENRICHMENT)
                .partitions(3)
                .replicas(1)
                .build();
    }
}
