package com.unbora.api.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;

@Component
public class PlaceDnaTagExtractor {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Pattern DIACRITICS = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

    public record DnaExtractionResult(
            List<String> tags,
            String tagsString,
            Map<String, Object> attributes,
            String attributesJson
    ) {}

    public DnaExtractionResult extractDna(
            String name,
            String primaryType,
            List<String> types,
            String formattedAddress,
            String editorialSummary,
            String vibeSummary,
            String priceLevel,
            Map<String, Boolean> explicitFeatures
    ) {
        Set<String> tagSet = new LinkedHashSet<>();
        Map<String, Object> attrMap = new LinkedHashMap<>();

        String fullCorpus = normalize(
                (name != null ? name : "") + " "
                + (primaryType != null ? primaryType : "") + " "
                + (types != null ? String.join(" ", types) : "") + " "
                + (formattedAddress != null ? formattedAddress : "") + " "
                + (editorialSummary != null ? editorialSummary : "") + " "
                + (vibeSummary != null ? vibeSummary : "")
        );

        Map<String, Boolean> features = explicitFeatures != null ? explicitFeatures : Collections.emptyMap();

        // 1. Pet Friendly
        boolean isPetFriendly = features.getOrDefault("allowsDogs", false)
                || containsAny(fullCorpus, "pet", "cachorro", "animais", "petfriendly", "pet-friendly", "aceita pet");
        attrMap.put("pet_friendly", isPetFriendly);
        if (isPetFriendly) tagSet.add("pet_friendly");

        // 2. Ao Ar Livre / Outdoor Seating
        boolean isOutdoor = features.getOrDefault("outdoorSeating", false)
                || containsAny(fullCorpus, "ar livre", "varanda", "terraco", "deck", "jardim", "open air", "outdoor", "ao ar livre", "patio");
        attrMap.put("outdoor_seating", isOutdoor);
        if (isOutdoor) tagSet.add("outdoor_seating");

        // 3. Romântico / A Dois
        boolean isCouple = containsAny(fullCorpus, "romantico", "casal", "a dois", "encontro", "intimista", "luz de velas", "fondue", "clima romantico", "jantar a dois");
        attrMap.put("good_for_couples", isCouple);
        if (isCouple) tagSet.add("good_for_couples");

        // 4. Bom para Grupos / Amigos
        boolean isGroup = features.getOrDefault("goodForGroups", false)
                || containsAny(fullCorpus, "grupo", "amigos", "galera", "comemoracao", "aniversario", "happy hour", "rodizio", "churrascaria", "confraternizacao");
        attrMap.put("good_for_groups", isGroup);
        if (isGroup) tagSet.add("good_for_groups");

        // 5. Família e Crianças
        boolean isKids = features.getOrDefault("goodForChildren", false)
                || containsAny(fullCorpus, "crianca", "kids", "familia", "playground", "espaco kids", "brinquedoteca", "parque infantil");
        attrMap.put("kids_friendly", isKids);
        if (isKids) tagSet.add("kids_friendly");

        // 6. Música ao Vivo / Shows
        boolean isLiveMusic = features.getOrDefault("liveMusic", false)
                || containsAny(fullCorpus, "musica ao vivo", "show", "banda", "acustico", "voz e violao", "sertanejo", "samba", "pagode", "dj", "jazz", "rock ao vivo");
        attrMap.put("live_music", isLiveMusic);
        if (isLiveMusic) tagSet.add("live_music");

        // 7. Para Trabalhar / Estudo / Notebook
        boolean isWorking = containsAny(fullCorpus, "coworking", "trabalhar", "estudar", "wifi", "notebook", "laptop", "tomadas")
                || (containsAny(fullCorpus, "cafeteria", "cafe") && !containsAny(fullCorpus, "balada", "boate", "bar barulhento"));
        attrMap.put("good_for_working", isWorking);
        if (isWorking) tagSet.add("good_for_working");

        // 8. Vista Panorâmica / Natureza
        boolean isScenic = containsAny(fullCorpus, "vista", "panoramica", "orla", "beira-mar", "beiramar", "praia", "por do sol", "mirante", "natureza", "trilha", "parque", "lago", "serra");
        attrMap.put("scenic_view", isScenic);
        if (isScenic) tagSet.add("scenic_view");

        // 9. Drinks & Coquetelaria
        boolean isCocktails = features.getOrDefault("servesCocktails", false)
                || containsAny(fullCorpus, "drink", "coquetel", "coqueteis", "coquetelaria", "mixologia", "gin", "carta de drinks", "pub", "bar de drinks");
        attrMap.put("cocktails", isCocktails);
        if (isCocktails) tagSet.add("cocktails");

        // 10. Cerveja Artesanal / Chopp
        boolean isBeer = features.getOrDefault("servesBeer", false)
                || containsAny(fullCorpus, "cerveja artesanal", "chopp", "chope", "cervejaria", "brewery", "taproom", "ipa", "pilsen");
        attrMap.put("craft_beer", isBeer);
        if (isBeer) tagSet.add("craft_beer");

        // 11. Opções Vegetarianas / Veganas
        boolean isVeg = features.getOrDefault("servesVegetarianFood", false)
                || containsAny(fullCorpus, "vegetariano", "vegano", "vegan", "plant-based", "sem carne", "organico");
        attrMap.put("vegetarian_friendly", isVeg);
        if (isVeg) tagSet.add("vegetarian_friendly");

        // 12. Café Especial / Cafeteria
        boolean isCoffee = features.getOrDefault("servesCoffee", false)
                || containsAny(fullCorpus, "cafe especial", "cafeteria", "coffee", "cafe", "espresso", "barista", "confeitaria", "padaria artesanal", "brunch");
        attrMap.put("specialty_coffee", isCoffee);
        if (isCoffee) tagSet.add("specialty_coffee");

        // 13. Gastronomia Refinada / Fine Dining
        boolean isFineDining = "PRICE_LEVEL_EXPENSIVE".equalsIgnoreCase(priceLevel)
                || "PRICE_LEVEL_VERY_EXPENSIVE".equalsIgnoreCase(priceLevel)
                || containsAny(fullCorpus, "bistro", "alta gastronomia", "contemporanea", "menu degustacao", "refinado", "sofisticado", "chef executivo");
        attrMap.put("fine_dining", isFineDining);
        if (isFineDining) tagSet.add("fine_dining");

        // 14. Econômico / Bom e Barato
        boolean isBudget = "PRICE_LEVEL_INEXPENSIVE".equalsIgnoreCase(priceLevel)
                || containsAny(fullCorpus, "barato", "economico", "acessivel", "bom e barato", "custo-beneficio", "popular");
        attrMap.put("budget_friendly", isBudget);
        if (isBudget) tagSet.add("budget_friendly");

        if (priceLevel != null && !priceLevel.isBlank()) {
            attrMap.put("price_level", priceLevel);
        }

        List<String> tagList = new ArrayList<>(tagSet);
        attrMap.put("tags", tagList);

        String tagsString = String.join(",", tagList);
        String attributesJson = "{}";
        try {
            attributesJson = OBJECT_MAPPER.writeValueAsString(attrMap);
        } catch (Exception ignored) {}

        return new DnaExtractionResult(tagList, tagsString, attrMap, attributesJson);
    }

    private boolean containsAny(String corpus, String... terms) {
        if (corpus == null || corpus.isBlank()) return false;
        for (String term : terms) {
            String norm = normalize(term);
            if (corpus.contains(norm)) {
                return true;
            }
        }
        return false;
    }

    private String normalize(String text) {
        if (text == null) return "";
        String normalized = Normalizer.normalize(text.toLowerCase(Locale.ROOT), Normalizer.Form.NFD);
        return DIACRITICS.matcher(normalized).replaceAll("").trim();
    }
}
