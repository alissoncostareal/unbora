package com.unbora.api.domain.event;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public final class EventCategories {

    public static final List<String> ALL = List.of(
            "Shows",
            "Gastronomia",
            "Festas",
            "Cultura",
            "Esportes",
            "Feiras",
            "Outros"
    );

    private static final Set<String> ALLOWED = new LinkedHashSet<>(ALL);

    private EventCategories() {}

    public static String normalize(String raw) {
        if (raw == null || raw.isBlank()) return "Outros";
        String trimmed = raw.trim();
        for (String allowed : ALLOWED) {
            if (allowed.equalsIgnoreCase(trimmed)) return allowed;
        }
        String lower = trimmed.toLowerCase(Locale.ROOT);
        if (lower.contains("show") || lower.contains("música") || lower.contains("musica") || lower.contains("festival")) {
            return "Shows";
        }
        if (lower.contains("gastro") || lower.contains("comida") || lower.contains("bar")) {
            return "Gastronomia";
        }
        if (lower.contains("festa") || lower.contains("balada") || lower.contains("party")) {
            return "Festas";
        }
        if (lower.contains("teatro") || lower.contains("cinema") || lower.contains("cultura") || lower.contains("arte")) {
            return "Cultura";
        }
        if (lower.contains("esporte") || lower.contains("corrida") || lower.contains("yoga")) {
            return "Esportes";
        }
        if (lower.contains("feira") || lower.contains("mercado")) {
            return "Feiras";
        }
        return "Outros";
    }
}
