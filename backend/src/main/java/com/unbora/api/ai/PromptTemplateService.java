package com.unbora.api.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PromptTemplateService {

    private static final Logger log = LoggerFactory.getLogger(PromptTemplateService.class);

    private final ResourceLoader resourceLoader;
    private final Map<String, String> templateCache = new ConcurrentHashMap<>();

    public PromptTemplateService(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    /**
     * Carrega e renderiza um template de prompt substituindo variáveis no formato {varName}.
     */
    public String render(String templateName, Map<String, Object> variables) {
        String template = getTemplate(templateName);
        if (template == null || template.isBlank()) {
            throw new IllegalStateException("Template de prompt não encontrado ou vazio: " + templateName);
        }

        String rendered = template;
        if (variables != null) {
            for (Map.Entry<String, Object> entry : variables.entrySet()) {
                String placeholder = "{" + entry.getKey() + "}";
                String value = entry.getValue() != null ? entry.getValue().toString() : "";
                rendered = rendered.replace(placeholder, value);
            }
        }

        return rendered;
    }

    /**
     * Retorna o conteúdo bruto do template a partir do classpath com cache em memória.
     */
    public String getTemplate(String templateName) {
        return templateCache.computeIfAbsent(templateName, this::loadFromClasspath);
    }

    private String loadFromClasspath(String templateName) {
        String path = "classpath:prompts/" + templateName + (templateName.endsWith(".st") ? "" : ".st");
        Resource resource = resourceLoader.getResource(path);
        if (!resource.exists()) {
            log.error("Arquivo de prompt não encontrado no classpath: {}", path);
            return "";
        }

        try (InputStream is = resource.getInputStream()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            log.error("Erro ao ler arquivo de prompt {}: {}", path, e.getMessage());
            return "";
        }
    }
}
