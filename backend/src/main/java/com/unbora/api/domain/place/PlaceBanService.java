package com.unbora.api.domain.place;

import com.unbora.api.common.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class PlaceBanService {

    private final PlaceBanRepository repository;

    public PlaceBanService(PlaceBanRepository repository) {
        this.repository = repository;
    }

    public List<Map<String, Object>> list() {
        return repository.findAllByOrderByCreatedAtDesc().stream().map(this::toMap).toList();
    }

    public boolean blocked(String placeId, String name) {
        String id = placeId == null ? "" : placeId.trim();
        String foldedName = fold(name);
        for (PlaceBan ban : repository.findAll()) {
            if (!id.isBlank() && ban.getPlaceId() != null && id.equals(ban.getPlaceId().trim())) return true;
            String bannedName = fold(ban.getName());
            if (!foldedName.isBlank() && foldedName.equals(bannedName)) return true;
        }
        return false;
    }

    @Transactional
    public Map<String, Object> create(String name, String placeId, String city, String reason) {
        if (name == null || name.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Informe o nome do lugar.");
        }
        PlaceBan ban = new PlaceBan();
        ban.setId(UUID.randomUUID().toString());
        ban.setName(name.trim());
        ban.setPlaceId(blank(placeId));
        ban.setCity(blank(city));
        ban.setReason(blank(reason));
        ban.setCreatedAt(Instant.now());
        return toMap(repository.save(ban));
    }

    @Transactional
    public Map<String, Object> remove(String id) {
        if (!repository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Esse lugar não está na lista negra.");
        }
        repository.deleteById(id);
        return Map.of("deleted", true, "id", id);
    }

    private Map<String, Object> toMap(PlaceBan ban) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", ban.getId());
        item.put("name", ban.getName());
        item.put("placeId", ban.getPlaceId());
        item.put("city", ban.getCity());
        item.put("reason", ban.getReason());
        item.put("createdAt", ban.getCreatedAt() == null ? "" : ban.getCreatedAt().toString());
        return item;
    }

    private static String blank(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private static String fold(String value) {
        if (value == null || value.isBlank()) return "";
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .trim();
    }
}
