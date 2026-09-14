package com.unbora.api.ai.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class PlaceDto {
    private String nome;
    private String tipo;
    private String icone;
    private String endereco;
    private Double nota;
    private String descricao;
    private Boolean destaque;
    private String imagem;
    private List<String> tags;

    @JsonProperty("visual_query")
    @JsonAlias({"visualQuery", "foto_search_query", "search_query"})
    private String visualQuery;

    @JsonProperty("category_tag")
    @JsonAlias({"categoryTag", "tag", "categoria"})
    private String categoryTag;

    @JsonProperty("google_maps_uri")
    @JsonAlias({"googleMapsUri", "mapsUri", "maps_url", "link_maps"})
    private String googleMapsUri;

    @JsonProperty("place_id")
    @JsonAlias({"placeId", "googlePlaceId"})
    private String placeId;

    private Double latitude;
    private Double longitude;

    @JsonProperty("open_now")
    @JsonAlias({"openNow", "aberto_agora"})
    private Boolean openNow;

    @JsonProperty("user_rating_count")
    @JsonAlias({"userRatingCount", "total_avaliacoes"})
    private Integer userRatingCount;

    public PlaceDto() {}

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getIcone() {
        return icone;
    }

    public void setIcone(String icone) {
        this.icone = icone;
    }

    public String getEndereco() {
        return endereco;
    }

    public void setEndereco(String endereco) {
        this.endereco = endereco;
    }

    public Double getNota() {
        return nota;
    }

    public void setNota(Double nota) {
        this.nota = nota;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public Boolean getDestaque() {
        return destaque;
    }

    public void setDestaque(Boolean destaque) {
        this.destaque = destaque;
    }

    public String getImagem() {
        return imagem;
    }

    public void setImagem(String imagem) {
        this.imagem = imagem;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
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

    public String getGoogleMapsUri() {
        return googleMapsUri;
    }

    public void setGoogleMapsUri(String googleMapsUri) {
        this.googleMapsUri = googleMapsUri;
    }

    public String getPlaceId() {
        return placeId;
    }

    public void setPlaceId(String placeId) {
        this.placeId = placeId;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Boolean getOpenNow() {
        return openNow;
    }

    public void setOpenNow(Boolean openNow) {
        this.openNow = openNow;
    }

    public Integer getUserRatingCount() {
        return userRatingCount;
    }

    public void setUserRatingCount(Integer userRatingCount) {
        this.userRatingCount = userRatingCount;
    }
}
