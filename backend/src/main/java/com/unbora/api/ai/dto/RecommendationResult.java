package com.unbora.api.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class RecommendationResult {
    private String titulo;
    private String subtitulo;
    private List<PlaceDto> lugares = new ArrayList<>();

    public RecommendationResult() {}

    public RecommendationResult(String titulo, String subtitulo, List<PlaceDto> lugares) {
        this.titulo = titulo;
        this.subtitulo = subtitulo;
        this.lugares = lugares;
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

    public List<PlaceDto> getLugares() {
        return lugares;
    }

    public void setLugares(List<PlaceDto> lugares) {
        this.lugares = lugares;
    }
}
