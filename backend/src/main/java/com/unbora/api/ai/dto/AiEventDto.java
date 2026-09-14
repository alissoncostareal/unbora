package com.unbora.api.ai.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class AiEventDto {
    private String titulo;
    private String descricao;
    private String local;
    private String data;
    private String tipo;
    private String imagem;

    /** true = imagem temática/ilustrativa (não é foto oficial do evento) */
    @JsonProperty("imagem_ilustrativa")
    @JsonAlias({"imagemIlustrativa", "imageIllustrative", "generic_image"})
    private Boolean imagemIlustrativa;

    @JsonProperty("visual_query")
    @JsonAlias({"visualQuery", "foto_search_query", "search_query"})
    private String visualQuery;

    @JsonProperty("category_tag")
    @JsonAlias({"categoryTag", "tag", "categoria"})
    private String categoryTag;

    public AiEventDto() {}

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public String getLocal() {
        return local;
    }

    public void setLocal(String local) {
        this.local = local;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getImagem() {
        return imagem;
    }

    public void setImagem(String imagem) {
        this.imagem = imagem;
    }

    public Boolean getImagemIlustrativa() {
        return imagemIlustrativa;
    }

    public void setImagemIlustrativa(Boolean imagemIlustrativa) {
        this.imagemIlustrativa = imagemIlustrativa;
    }

    public String getVisualQuery() {
        return visualQuery;
    }

    public void setVisualQuery(String visualQuery) {
        this.visualQuery = visualQuery;
    }

    public String getCategoryTag() {
        return categoryTag;
    }

    public void setCategoryTag(String categoryTag) {
        this.categoryTag = categoryTag;
    }
}
