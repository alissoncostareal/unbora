package com.unbora.api.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class DiscoverEventsResult {
    private String titulo;
    private String subtitulo;
    private List<AiEventDto> eventos = new ArrayList<>();

    public DiscoverEventsResult() {}

    public DiscoverEventsResult(String titulo, String subtitulo, List<AiEventDto> eventos) {
        this.titulo = titulo;
        this.subtitulo = subtitulo;
        this.eventos = eventos;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getSubtitulo() {
        return subtitulo;
    }

    public void setSubtitulo(String subtitulo) {
        this.subtitulo = subtitulo;
    }

    public List<AiEventDto> getEventos() {
        return eventos;
    }

    public void setEventos(List<AiEventDto> eventos) {
        this.eventos = eventos;
    }
}
