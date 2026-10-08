package com.unbora.api.domain.guide;

import com.unbora.api.common.exception.ApiException;
import jakarta.annotation.PostConstruct;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class GuideService {

    private final GuideOptionRepository options;
    private final GuideSettingsRepository settings;

    public GuideService(GuideOptionRepository options, GuideSettingsRepository settings) {
        this.options = options;
        this.settings = settings;
    }

    @PostConstruct
    @Transactional
    public void seed() {
        if (options.count() == 0) {
            int position = 0;
            for (Seed row : SEED) {
                GuideOption option = new GuideOption();
                option.setId(UUID.randomUUID().toString());
                option.setStep(row.step());
                option.setItemKey(row.itemKey());
                option.setPosition(position++);
                option.setLabel(row.label());
                option.setPromptValue(row.promptValue());
                option.setNote(row.note());
                option.setDetail(row.detail());
                option.setSearchHint(row.searchHint());
                option.setActive(true);
                options.save(option);
            }
        }
        if (settings.findById(GuideSettings.ID).isEmpty()) {
            settings.save(new GuideSettings());
        }
    }

    public Map<String, Object> catalog(boolean includeInactive) {
        GuideSettings budget = settings.findById(GuideSettings.ID).orElseGet(GuideSettings::new);
        Map<String, List<Map<String, Object>>> grouped = new LinkedHashMap<>();
        grouped.put("moods", new ArrayList<>());
        grouped.put("interests", new ArrayList<>());
        grouped.put("company", new ArrayList<>());
        grouped.put("durations", new ArrayList<>());
        for (GuideOption option : options.findAllByOrderByStepAscPositionAsc()) {
            if (!includeInactive && !option.isActive()) continue;
            String bucket = switch (option.getStep()) {
                case "mood" -> "moods";
                case "interest" -> "interests";
                case "company" -> "company";
                case "duration" -> "durations";
                default -> null;
            };
            if (bucket == null) continue;
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", option.getId());
            item.put("key", option.getItemKey());
            item.put("label", option.getLabel());
            item.put("value", option.getPromptValue());
            item.put("line", option.getDetail());
            item.put("note", option.getNote());
            item.put("searchHint", option.getSearchHint());
            item.put("active", option.isActive());
            item.put("position", option.getPosition());
            grouped.get(bucket).add(item);
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.putAll(grouped);
        body.put("budget", Map.of(
                "min", budget.getBudgetMin(),
                "max", budget.getBudgetMax(),
                "step", budget.getBudgetStep(),
                "defaultValue", budget.getBudgetDefault()
        ));
        return body;
    }

    @Transactional
    public Map<String, Object> create(String step, String label, String promptValue, String note, String detail, String searchHint) {
        String normalized = normalizeStep(step);
        String cleanLabel = required(label, "O nome do item é obrigatório.");
        int position = options.findByStepOrderByPositionAsc(normalized).stream()
                .mapToInt(GuideOption::getPosition)
                .max()
                .orElse(-1) + 1;
        GuideOption option = new GuideOption();
        option.setId(UUID.randomUUID().toString());
        option.setStep(normalized);
        option.setItemKey(slug(cleanLabel));
        option.setPosition(position);
        option.setLabel(cleanLabel);
        option.setPromptValue(blankToNull(promptValue));
        option.setNote(blankToNull(note));
        option.setDetail(blankToNull(detail));
        option.setSearchHint(blankToNull(searchHint));
        option.setActive(true);
        options.save(option);
        return catalog(true);
    }

    @Transactional
    public Map<String, Object> update(String id, String label, String promptValue, String note, String detail, String searchHint, Boolean active) {
        GuideOption option = options.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Item do formulário não encontrado."));
        if (label != null && !label.isBlank()) option.setLabel(label.trim());
        if (promptValue != null) option.setPromptValue(blankToNull(promptValue));
        if (note != null) option.setNote(blankToNull(note));
        if (detail != null) option.setDetail(blankToNull(detail));
        if (searchHint != null) option.setSearchHint(blankToNull(searchHint));
        if (active != null) option.setActive(active);
        options.save(option);
        return catalog(true);
    }

    @Transactional
    public Map<String, Object> remove(String id) {
        if (!options.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Item do formulário não encontrado.");
        }
        options.deleteById(id);
        return catalog(true);
    }

    @Transactional
    public Map<String, Object> updateBudget(int min, int max, int step, int defaultValue) {
        if (max <= min || step <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "O intervalo de gasto precisa ter um máximo maior que o mínimo.");
        }
        int clamped = Math.min(max, Math.max(min, defaultValue));
        GuideSettings budget = settings.findById(GuideSettings.ID).orElseGet(GuideSettings::new);
        budget.setId(GuideSettings.ID);
        budget.setBudgetMin(min);
        budget.setBudgetMax(max);
        budget.setBudgetStep(step);
        budget.setBudgetDefault(clamped);
        settings.save(budget);
        return catalog(true);
    }

    private static String normalizeStep(String step) {
        if (step == null) throw new ApiException(HttpStatus.BAD_REQUEST, "Informe a etapa.");
        String value = step.trim().toLowerCase(Locale.ROOT);
        if (!value.equals("mood") && !value.equals("interest") && !value.equals("company") && !value.equals("duration")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Etapa desconhecida.");
        }
        return value;
    }

    private static String required(String value, String message) {
        if (value == null || value.isBlank()) throw new ApiException(HttpStatus.BAD_REQUEST, message);
        return value.trim();
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private static String slug(String label) {
        String base = java.text.Normalizer.normalize(label, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
        if (base.isBlank()) base = "item";
        return base + "-" + UUID.randomUUID().toString().substring(0, 4);
    }

    private record Seed(String step, String itemKey, String label, String promptValue, String note, String detail, String searchHint) {}

    private static final List<Seed> SEED = List.of(
            new Seed("mood", "relaxar", "Relaxar", "relaxar, em paz, sem pressa", "Pausas lentas, sombras frescas, vinho e café.", "Seu momento pede algo mais tranquilo.", null),
            new Seed("mood", "animado", "Animado", "animado, com energia, querendo aproveitar", "Vozes altas, som selecionado, balcão vivo.", "Seu momento pede algo mais leve.", null),
            new Seed("mood", "rotina", "Sair da rotina", "sair da rotina, um programa diferente", "Esquinas inéditas, conceitos fora do padrão.", "Seu momento pede uma quebra de rotina.", null),
            new Seed("mood", "encontro", "Encontro", "um encontro, clima a dois", "Iluminação indireta, acústica para conversar.", "Seu momento pede um encontro.", null),
            new Seed("mood", "curioso", "Curioso", "curioso, querendo descobrir algo novo", "Galerias de bairro, feiras locais, cardápios autorais.", "Seu momento pede algo que você ainda não conhece.", null),
            new Seed("mood", "paz", "Em paz", "em paz, um tempo só seu", "Brisa atlântica, pouca gente, silêncio protegido.", "Seu momento pede um tempo só seu.", null),
            new Seed("interest", "cafe", "Cafés", null, null, null, "cafés, padarias e brunch"),
            new Seed("interest", "music", "Música", null, null, null, "música ao vivo, bares com show e casas de show"),
            new Seed("interest", "nature", "Natureza", null, null, null, "parques, trilhas, mirantes e áreas verdes"),
            new Seed("interest", "food", "Gastronomia", null, null, null, "restaurantes, bistrôs, almoço e jantar"),
            new Seed("interest", "culture", "Cultura", null, null, null, "museus, teatros, centros culturais e feiras"),
            new Seed("interest", "games", "Games", null, null, null, "fliperamas, board games e jogos"),
            new Seed("interest", "beach", "Praia", null, null, null, "praia, orla e quiosques"),
            new Seed("interest", "cinema", "Cinema", null, null, null, "cinemas e sessões de filme"),
            new Seed("company", "sozinho", "Sozinho", "sozinho", null, null, null),
            new Seed("company", "dois", "A dois", "a dois", null, null, null),
            new Seed("company", "amigos", "Com amigos", "com amigos", null, null, null),
            new Seed("company", "familia", "Com família", "em família", null, null, null),
            new Seed("company", "pessoas", "Conhecendo pessoas", "aberto a conhecer pessoas", null, null, null),
            new Seed("duration", "30", "30 min", "30 minutos", null, null, null),
            new Seed("duration", "60", "1h", "1 hora", null, null, null),
            new Seed("duration", "120", "2h", "2 horas", null, null, null),
            new Seed("duration", "180", "3h+", "3 horas ou mais", null, null, null)
    );
}
