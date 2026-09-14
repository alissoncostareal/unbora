package com.unbora.api.domain.notification;

import com.unbora.api.common.LocationsConstants;
import com.unbora.api.common.exception.ApiException;
import com.unbora.api.domain.notification.dto.CreateNotificationDto;
import com.unbora.api.domain.notification.dto.NotificationRecordDto;
import com.unbora.api.domain.notification.dto.UpdateNotificationDto;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class NotificationsService {

    private final NotificationRepository notificationRepository;

    public NotificationsService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    private NotificationRecordDto toRecord(Notification n) {
        return new NotificationRecordDto(
                n.getId(),
                n.getTitle(),
                n.getBody(),
                n.getCity() != null ? n.getCity() : LocationsConstants.DEFAULT_CITY,
                n.getRegion() != null ? n.getRegion() : LocationsConstants.DEFAULT_REGION,
                n.getActive(),
                n.getCreatedAt() != null ? n.getCreatedAt().toString() : "",
                n.getUpdatedAt() != null ? n.getUpdatedAt().toString() : ""
        );
    }

    public List<NotificationRecordDto> list(boolean activeOnly, String city, String region) {
        return notificationRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(n -> !activeOnly || Boolean.TRUE.equals(n.getActive()))
                .filter(n -> LocationsConstants.matchesLocation(n.getCity(), n.getRegion(), city, region))
                .map(this::toRecord)
                .toList();
    }

    @Transactional
    public NotificationRecordDto create(CreateNotificationDto dto) {
        Notification notification = new Notification();
        notification.setId(UUID.randomUUID().toString());
        notification.setTitle(dto.title().trim());
        notification.setBody(dto.body().trim());
        notification.setCity(dto.city().trim());
        notification.setRegion(dto.region().trim());
        notification.setActive(dto.active() != null ? dto.active() : true);
        notification.setCreatedAt(Instant.now());
        notification.setUpdatedAt(Instant.now());

        return toRecord(notificationRepository.save(notification));
    }

    @Transactional
    public NotificationRecordDto update(String id, UpdateNotificationDto dto) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notificação não encontrada."));

        if (dto.title() != null && !dto.title().isBlank()) notification.setTitle(dto.title().trim());
        if (dto.body() != null && !dto.body().isBlank()) notification.setBody(dto.body().trim());
        if (dto.city() != null && !dto.city().isBlank()) notification.setCity(dto.city().trim());
        if (dto.region() != null && !dto.region().isBlank()) notification.setRegion(dto.region().trim());
        if (dto.active() != null) notification.setActive(dto.active());
        notification.setUpdatedAt(Instant.now());

        return toRecord(notificationRepository.save(notification));
    }

    @Transactional
    public Map<String, Object> remove(String id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notificação não encontrada."));

        notificationRepository.delete(notification);
        return Map.of("deleted", true, "id", id);
    }
}
