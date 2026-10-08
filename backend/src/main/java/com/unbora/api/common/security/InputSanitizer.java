package com.unbora.api.common.security;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Utilitário de segurança e sanitização para prevenir:
 * 1. Prompt Injection e quebra de contexto na IA (Groq/Ollama).
 * 2. Cross-Site Scripting (XSS) e injeção de tags HTML/scripts.
 * 3. Injeção de caracteres de controle e bytes nulos.
 * 4. Negação de serviço por payloads gigantescos via URL/JSON.
 */
public final class InputSanitizer {

    private static final Pattern HTML_TAGS = Pattern.compile("<[^>]*>", Pattern.CASE_INSENSITIVE);
    private static final Pattern JAVASCRIPT_SCHEME = Pattern.compile("(?i)javascript:|vbscript:|data:text/html");
    private static final Pattern CONTROL_CHARS = Pattern.compile("[\\p{Cntrl}&&[^\r\n\t]]");
    private static final Pattern PROMPT_INJECTION_KEYWORDS = Pattern.compile(
            "(?i)(ignore\\s+(all\\s+)?previous\\s+(instructions|prompts)|system\\s*:|assistant\\s*:|user\\s*:|\\[/?INST\\]|<\\|im_(start|end)\\|>|```[a-z]*)"
    );
    private static final Pattern DELIMITER_REPETITION = Pattern.compile("[=\\-_~`]{3,}");

    private InputSanitizer() {}

    /**
     * Sanitiza texto geral: remove tags HTML, scripts, caracteres de controle e trunca no limite seguro.
     */
    public static String sanitizeText(String input, int maxLength) {
        if (input == null) return null;
        String cleaned = input.trim();
        if (cleaned.isEmpty()) return "";

        // Remove caracteres de controle e bytes nulos (\0)
        cleaned = CONTROL_CHARS.matcher(cleaned).replaceAll("");

        // Normaliza unicode para evitar homoglyphs / exploits de encoding
        cleaned = Normalizer.normalize(cleaned, Normalizer.Form.NFC);

        // Remove tags HTML
        cleaned = HTML_TAGS.matcher(cleaned).replaceAll("");

        // Remove esquemas de scripts
        cleaned = JAVASCRIPT_SCHEME.matcher(cleaned).replaceAll("");

        if (cleaned.length() > maxLength) {
            cleaned = cleaned.substring(0, maxLength).trim();
        }
        return cleaned;
    }

    /**
     * Sanitiza parâmetros inseridos em prompts de IA para mitigar Prompt Injection e jailbreaks.
     */
    public static String sanitizeForPrompt(String input, int maxLength) {
        if (input == null) return "";
        String text = sanitizeText(input, maxLength);
        if (text.isEmpty()) return "";

        // Neutraliza palavras-chave típicas de injeção de instrução
        text = PROMPT_INJECTION_KEYWORDS.matcher(text).replaceAll("[filtered]");

        // Neutraliza separadores de blocos repetidos (ex: ===== ou ----- ou ````)
        text = DELIMITER_REPETITION.matcher(text).replaceAll("---");

        return text.trim();
    }

    /**
     * Sanitiza nomes de cidade/país/região: apenas letras, acentos, números, espaços e hífen.
     */
    public static String sanitizeCityOrCountry(String input, int maxLength) {
        if (input == null) return null;
        String text = sanitizeText(input, maxLength);
        if (text.isEmpty()) return "";
        // Permite apenas caracteres válidos para nomes de localidades
        return text.replaceAll("[^\\p{L}\\p{N}\\s\\-.,']", "").replaceAll("\\s+", " ").trim();
    }

    /**
     * Sanitiza IDs de lugares (Google Place ID ou hashes alfanuméricos).
     */
    public static String sanitizePlaceId(String input, int maxLength) {
        if (input == null) return null;
        String text = input.trim();
        if (text.length() > maxLength) {
            text = text.substring(0, maxLength);
        }
        return text.replaceAll("[^a-zA-Z0-9_\\-:]", "");
    }
}
