package com.unbora.api.domain.checkin;

import com.unbora.api.common.exception.ApiException;
import com.unbora.api.domain.checkin.dto.*;
import com.unbora.api.kafka.KafkaEventPublisher;
import com.unbora.api.kafka.event.UserActivityEvent;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class CheckinService {

    private final CheckinRepository checkinRepository;
    private final KafkaEventPublisher kafkaEventPublisher;

    public CheckinService(CheckinRepository checkinRepository, KafkaEventPublisher kafkaEventPublisher) {
        this.checkinRepository = checkinRepository;
        this.kafkaEventPublisher = kafkaEventPublisher;
    }

    private CheckinDto toDto(Checkin c) {
        return new CheckinDto(
                c.getId(),
                c.getUserId(),
                c.getPlaceId(),
                c.getPlaceName(),
                c.getPlaceType(),
                c.getCity(),
                c.getImageUrl(),
                c.getMapsUrl(),
                c.getRating(),
                c.getNotes(),
                c.getVisitedAt(),
                c.getCreatedAt()
        );
    }

    @Transactional
    public CheckinDto create(String userId, CreateCheckinDto dto) {
        if (userId == null || userId.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado para fazer check-in.");
        }

        Checkin checkin = new Checkin();
        checkin.setId(UUID.randomUUID().toString());
        checkin.setUserId(userId);
        checkin.setPlaceId(dto.placeId().trim());
        checkin.setPlaceName(dto.placeName().trim());
        checkin.setPlaceType(dto.placeType());
        checkin.setCity(dto.city());
        checkin.setImageUrl(dto.imageUrl());
        checkin.setMapsUrl(dto.mapsUrl());
        checkin.setRating(dto.rating());
        checkin.setNotes(dto.notes());
        checkin.setVisitedAt(dto.visitedAt() != null ? dto.visitedAt() : Instant.now());
        checkin.setCreatedAt(Instant.now());

        Checkin saved = checkinRepository.save(checkin);

        kafkaEventPublisher.publishUserActivity(new UserActivityEvent(
                "USER_CHECKIN",
                userId,
                "",
                "user",
                "app",
                Instant.now(),
                Map.of(
                        "placeId", saved.getPlaceId(),
                        "placeName", saved.getPlaceName(),
                        "rating", String.valueOf(saved.getRating() != null ? saved.getRating() : 0)
                )
        ));

        return toDto(saved);
    }

    public List<CheckinDto> listByUser(String userId) {
        if (userId == null || userId.isBlank()) {
            return Collections.emptyList();
        }
        return checkinRepository.findByUserIdOrderByVisitedAtDesc(userId).stream()
                .map(this::toDto)
                .toList();
    }

    public RevisitGroupDto getRevisitGroups(String userId) {
        if (userId == null || userId.isBlank()) {
            return new RevisitGroupDto(0, List.of(), List.of(), List.of(), List.of(), List.of());
        }

        List<Checkin> all = checkinRepository.findByUserIdOrderByVisitedAtDesc(userId);
        Instant now = Instant.now();

        Instant sevenDaysAgo = now.minus(7, ChronoUnit.DAYS);
        Instant fourteenDaysAgo = now.minus(14, ChronoUnit.DAYS);
        Instant fortyFiveDaysAgo = now.minus(45, ChronoUnit.DAYS);

        List<CheckinDto> thisWeek = new ArrayList<>();
        List<CheckinDto> lastWeek = new ArrayList<>();
        List<CheckinDto> lastMonth = new ArrayList<>();
        List<CheckinDto> older = new ArrayList<>();

        Map<String, Checkin> latestByPlace = new LinkedHashMap<>();

        for (Checkin c : all) {
            CheckinDto dto = toDto(c);
            Instant v = c.getVisitedAt() != null ? c.getVisitedAt() : c.getCreatedAt();

            if (!latestByPlace.containsKey(c.getPlaceId())) {
                latestByPlace.put(c.getPlaceId(), c);
            }

            if (v.isAfter(sevenDaysAgo)) {
                thisWeek.add(dto);
            } else if (v.isAfter(fourteenDaysAgo)) {
                lastWeek.add(dto);
            } else if (v.isAfter(fortyFiveDaysAgo)) {
                lastMonth.add(dto);
            } else {
                older.add(dto);
            }
        }

        List<RevisitSuggestionDto> suggestions = new ArrayList<>();
        for (Checkin c : latestByPlace.values()) {
            Instant v = c.getVisitedAt() != null ? c.getVisitedAt() : c.getCreatedAt();
            long days = Duration.between(v, now).toDays();

            // Recomenda se visitou há 7 dias ou mais
            if (days >= 7) {
                String invite;
                if (days < 14) {
                    invite = "Você esteve aqui semana passada! Que tal repetir a dose ou convidar alguém especial?";
                } else if (days < 30) {
                    invite = "Já faz quase um mês da sua última visita ao " + c.getPlaceName() + ". Hora de matar a saudade!";
                } else {
                    invite = "Faz " + days + " dias desde seu último check-in no " + c.getPlaceName() + ". O que acha de redescobrir o cardápio e a atmosfera?";
                }

                suggestions.add(new RevisitSuggestionDto(
                        c.getPlaceId(),
                        c.getPlaceName(),
                        c.getPlaceType(),
                        c.getCity(),
                        c.getImageUrl(),
                        c.getMapsUrl(),
                        c.getRating(),
                        c.getNotes(),
                        v,
                        days,
                        invite
                ));
            }
        }

        // Limita a 8 sugestões de revisita
        if (suggestions.size() > 8) {
            suggestions = suggestions.subList(0, 8);
        }

        return new RevisitGroupDto(all.size(), thisWeek, lastWeek, lastMonth, older, suggestions);
    }

    @Transactional
    public void delete(String id, String userId) {
        Checkin checkin = checkinRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Check-in não encontrado."));
        checkinRepository.delete(checkin);
    }
}
