package com.unbora.api.ai;

import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Set;

/**
 * Classifica o card para o roteador de foto.
 * A IA não escolhe a imagem: este classificador só decide o caso
 * e o código busca Google Maps (lugar) ou cartaz/tema (evento).
 */
@Component
public class ImageSubjectClassifier {

    public enum Kind {
        LOCAL_PLACE,
        CULTURAL_EVENT
    }

    /** Tokens fortes no nome → evento cultural (cartaz/tema). */
    private static final Set<String> STRONG_EVENT_TOKENS = Set.of(
            "festival", "show", "peca", "exposicao", "exposicoes", "concerto", "espetaculo",
            "stand up", "standup", "dj set", "baile", "roda de samba", "sarau", "recital",
            "vernissage", "workshop", "palestra", "maratona"
    );

    /** Só contam como evento se não houver sinal claro de estabelecimento. */
    private static final Set<String> WEAK_EVENT_TOKENS = Set.of(
            "evento", "feira", "encontro", "agenda", "oficina", "inauguracao", "corrida", "dj ",
            "teatro"
    );

    private static final Set<String> PLACE_TOKENS = Set.of(
            "restaurante", "restaurant", "cafe", "cafeteria", "bar", "pub", "padaria",
            "pizzaria", "hamburgueria", "bistro", "praia", "beach", "parque", "park",
            "sorveteria", "churrascaria", "lanchonete", "boteco", "gastro", "club",
            "balada", "night club", "nightclub", "museu", "museum", "mercado", "shopping",
            "hotel", "pousada", "academia", "estudio", "galeria", "mirante", "orla",
            "gastronomia", "natureza", "teatro"
    );

    public Kind classify(String name, String type, String categoryTag) {
        String nameNorm = normalize(name);
        String typeNorm = normalize(type);
        String tagNorm = normalize(categoryTag);
        String meta = (typeNorm + " " + tagNorm).trim();

        boolean strongEventInName = containsToken(nameNorm, STRONG_EVENT_TOKENS);
        boolean weakEventInName = containsToken(nameNorm, WEAK_EVENT_TOKENS);
        boolean eventInMeta = containsToken(meta, STRONG_EVENT_TOKENS)
                || containsToken(meta, WEAK_EVENT_TOKENS);
        boolean placeSignal = containsToken(nameNorm, PLACE_TOKENS)
                || containsToken(meta, PLACE_TOKENS)
                || looksLikeGooglePlaceType(typeNorm);

        // Estabelecimento real (bar/café/restaurante/praia) sempre usa Maps,
        // mesmo se o nome tiver "encontro" / "feira".
        if (placeSignal && !strongEventInName) {
            return Kind.LOCAL_PLACE;
        }
        if (strongEventInName) {
            return Kind.CULTURAL_EVENT;
        }
        if ((weakEventInName || eventInMeta) && !placeSignal) {
            return Kind.CULTURAL_EVENT;
        }
        return Kind.LOCAL_PLACE;
    }

    private static boolean looksLikeGooglePlaceType(String typeNorm) {
        if (typeNorm == null || typeNorm.isBlank()) return false;
        return typeNorm.contains("restaurant")
                || typeNorm.contains("cafe")
                || typeNorm.contains("bar")
                || typeNorm.contains("bakery")
                || typeNorm.contains("meal")
                || typeNorm.contains("food")
                || typeNorm.contains("park")
                || typeNorm.contains("beach")
                || typeNorm.contains("lodging")
                || typeNorm.contains("museum")
                || typeNorm.contains("tourist")
                || typeNorm.contains("store")
                || typeNorm.contains("market");
    }

    private static boolean containsToken(String haystack, Set<String> tokens) {
        if (haystack == null || haystack.isBlank()) return false;
        for (String token : tokens) {
            if (haystack.contains(token)) return true;
        }
        return false;
    }

    static String normalize(String value) {
        if (value == null || value.isBlank()) return "";
        String stripped = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return stripped.toLowerCase(Locale.ROOT).replace('-', ' ').replace('_', ' ');
    }
}
