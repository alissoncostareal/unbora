package com.unbora.api.common.security;

import java.net.URI;
import java.text.Normalizer;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Utilitário enterprise de segurança e sanitização para o ecossistema Unbora.
 * 
 * Protege contra:
 * 1. Prompt Injection, Jailbreaks e quebra de contexto na IA (Groq / Ollama / OpenAI).
 * 2. Cross-Site Scripting (XSS), Event Handlers maliciosos e injeção de HTML/SVG/Scripts.
 * 3. Template Injection (SSTI / Expression Language: ${...}, {{...}}).
 * 4. Caracteres invisíveis, Zero-Width, Directional Overrides e bytes nulos (\0).
 * 5. Negação de serviço (DoS) por payloads gigantescos em query params ou JSON.
 * 6. Server-Side Request Forgery (SSRF) e desvio de rede interna.
 */
public final class InputSanitizer {

    // HTML / XSS / Scripting
    private static final Pattern HTML_TAGS = Pattern.compile("<[^>]*>", Pattern.CASE_INSENSITIVE);
    private static final Pattern DANGEROUS_SCHEMES = Pattern.compile("(?i)(javascript|vbscript|data|file|ftp):");
    private static final Pattern EVENT_HANDLERS = Pattern.compile("(?i)\\b(onload|onerror|onclick|onmouseover|onfocus|onblur|onsubmit)\\s*=", Pattern.CASE_INSENSITIVE);
    
    // Caracteres invisíveis, bytes nulos e caracteres de controle (preserva apenas espaços, tabs e newlines comuns)
    private static final Pattern CONTROL_AND_INVISIBLE_CHARS = Pattern.compile("[\\p{Cntrl}&&[^\r\n\t]]|[\\u200B-\\u200D\\uFEFF\\u202A-\\u202E]");

    // Template Injection (SSTI / SpEL)
    private static final Pattern TEMPLATE_INJECTION = Pattern.compile("(\\$\\{[^}]*\\})|(\\{\\{[^}]*\\})|(<%[^%]*%>)");

    // Prompt Injection & LLM Jailbreak Patterns
    private static final Pattern PROMPT_INJECTION_KEYWORDS = Pattern.compile(
            "(?i)(" +
            "\\b(ignore|disregard|forget|override|bypass)\\s+(all\\s+)?(previous|prior|above|system)\\s+(instructions|prompts|rules|directives)\\b|" +
            "\\b(you are now in|switch to|enter)\\s+(developer mode|dan mode|jailbreak mode|god mode|unrestricted mode)\\b|" +
            "\\b(roleplay as|act as|pretend to be)\\s+(an?\\s+unfiltered|an?\\s+evil|a\\s+hacked|dan)\\b|" +
            "\\b(reveal|print|repeat|output|show|leak)\\s+(your\\s+)?(system prompt|instructions|secret|api key|prompt above)\\b|" +
            "\\b(system|assistant|user|human)\\s*:|" +
            "\\[/?(INST|SYS|SYSTEM)\\]|" +
            "<<\\/?SYS>>|" +
            "<\\|im_(start|end)\\|>|" +
            "<\\|(system|user|assistant|endoftext)\\|>|" +
            "```[a-z]*" +
            ")"
    );

    // Repetições de delimitadores usados para forçar quebra de bloco em prompts
    private static final Pattern DELIMITER_REPETITION = Pattern.compile("([=\\-_~`#*]){3,}");

    // Redes locais e endereços proibidos para SSRF
    private static final Pattern PRIVATE_IP_OR_LOCAL = Pattern.compile(
            "(?i)^(localhost|127\\.\\d+\\.\\d+\\.\\d+|10\\.\\d+\\.\\d+\\.\\d+|172\\.(1[6-9]|2\\d|3[01])\\.\\d+\\.\\d+|192\\.168\\.\\d+\\.\\d+|169\\.254\\.\\d+\\.\\d+|\\[?::1\\]?)$"
    );

    private InputSanitizer() {}

    /**
     * Sanitiza texto geral:
     * - Remove tags HTML e event handlers
     * - Remove esquemas javascript:/data:
     * - Remove caracteres de controle e bytes nulos
     * - Normaliza Unicode (NFC)
     * - Trunca no limite seguro
     */
    public static String sanitizeText(String input, int maxLength) {
        if (input == null) return null;
        String cleaned = input.trim();
        if (cleaned.isEmpty()) return "";

        // Remove caracteres de controle, zero-width e bytes nulos (\0)
        cleaned = CONTROL_AND_INVISIBLE_CHARS.matcher(cleaned).replaceAll("");

        // Normaliza unicode para evitar homoglyphs / exploits de encoding
        cleaned = Normalizer.normalize(cleaned, Normalizer.Form.NFC);

        // Remove tags HTML
        cleaned = HTML_TAGS.matcher(cleaned).replaceAll("");

        // Remove esquemas de scripts
        cleaned = DANGEROUS_SCHEMES.matcher(cleaned).replaceAll("");

        // Remove event handlers JS inline
        cleaned = EVENT_HANDLERS.matcher(cleaned).replaceAll("");

        // Trunca com segurança
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

        // Neutraliza injeções de template (${...}, {{...}})
        text = TEMPLATE_INJECTION.matcher(text).replaceAll("[filtered]");

        // Neutraliza palavras-chave de injeção de instrução e tokens especiais de IA
        text = PROMPT_INJECTION_KEYWORDS.matcher(text).replaceAll("[filtered]");

        // Neutraliza separadores de blocos repetidos (ex: ===== ou ----- ou ````)
        text = DELIMITER_REPETITION.matcher(text).replaceAll("---");

        return text.trim();
    }

    /**
     * Sanitiza nomes de cidade/país/região:
     * Permite apenas letras (incluindo acentos internacionais), números, espaços, hífens, pontos e apóstrofos.
     */
    public static String sanitizeCityOrCountry(String input, int maxLength) {
        if (input == null) return null;
        String text = sanitizeText(input, maxLength);
        if (text.isEmpty()) return "";
        return text.replaceAll("[^\\p{L}\\p{N}\\s\\-.,']", "").replaceAll("\\s+", " ").trim();
    }

    /**
     * Sanitiza consultas de busca digitadas pelo usuário.
     * Preserva acentos, números e pontuação comum, removendo caracteres perigosos como aspas SQL, tags e delimitadores.
     */
    public static String sanitizeQuery(String input, int maxLength) {
        if (input == null) return "";
        String text = sanitizeText(input, maxLength);
        if (text.isEmpty()) return "";
        // Remove símbolos de escape perigosos como barras invertidas, ponto-e-vírgula e aspas duplas
        text = text.replaceAll("[;\\\\\"`<>|\\[\\]{}]", " ");
        return text.replaceAll("\\s+", " ").trim();
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

    /**
     * Sanitiza UUIDs (ex: IDs de usuário).
     */
    public static String sanitizeUuid(String input) {
        if (input == null) return null;
        String text = input.trim();
        if (text.matches("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")) {
            return text.toLowerCase(Locale.ROOT);
        }
        // Se não for UUID válido, retorna string alfanumérica segura com max 64 caracteres
        String cleaned = text.replaceAll("[^a-zA-Z0-9\\-]", "");
        return cleaned.substring(0, Math.min(cleaned.length(), 64));
    }

    /**
     * Valida se uma URL externa é segura contra SSRF e restringe a domínios permitidos caso informados.
     */
    public static boolean isSafeUrl(String urlString, Set<String> allowedHosts) {
        if (urlString == null || urlString.isBlank()) return false;
        try {
            URI uri = URI.create(urlString.trim());
            String scheme = uri.getScheme();
            if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
                return false;
            }

            String host = uri.getHost();
            if (host == null || host.isBlank()) return false;
            host = host.toLowerCase(Locale.ROOT);

            // Bloqueia IPs privados e localhost
            if (PRIVATE_IP_OR_LOCAL.matcher(host).matches()) {
                return false;
            }

            if (allowedHosts != null && !allowedHosts.isEmpty()) {
                return allowedHosts.contains(host);
            }

            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Verifica se o payload contém padrões explícitos de ataque (útil para auditoria / telemetria de segurança).
     */
    public static boolean isSuspicious(String input) {
        if (input == null || input.isBlank()) return false;
        return PROMPT_INJECTION_KEYWORDS.matcher(input).find() ||
               HTML_TAGS.matcher(input).find() ||
               DANGEROUS_SCHEMES.matcher(input).find() ||
               EVENT_HANDLERS.matcher(input).find() ||
               TEMPLATE_INJECTION.matcher(input).find();
    }
}
