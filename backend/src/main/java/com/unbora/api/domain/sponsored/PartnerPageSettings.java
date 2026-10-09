package com.unbora.api.domain.sponsored;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "partner_page_settings")
public class PartnerPageSettings {

    public static final String ID = "default";

    @Id
    private String id = ID;

    @Column(name = "badge_text", length = 120)
    private String badgeText = "Programa de Parceiros Unbora";

    @Column(name = "headline", length = 300)
    private String headline = "Coloque seu estabelecimento no radar de quem decide onde ir agora.";

    @Column(name = "subheadline", length = 800)
    private String subheadline = "Milhares de pessoas usam o Unbora todos os dias para descobrir restaurantes, bares, cafés e eventos. Anuncie com destaque garantido, benefícios exclusivos e modelos flexíveis.";

    @Column(name = "feature1_title", length = 150)
    private String feature1Title = "Slot de Ouro nas Buscas";

    @Column(name = "feature1_description", length = 500)
    private String feature1Description = "Apareça no topo dos resultados recomendados quando os usuários procurarem por opções no seu estilo e cidade.";

    @Column(name = "feature2_title", length = 150)
    private String feature2Title = "Unbora Perks Exclusivo";

    @Column(name = "feature2_description", length = 500)
    private String feature2Description = "Ofereça um benefício especial (ex: 15% de desconto ou drink de boas-vindas) para atrair e fidelizar clientes.";

    @Column(name = "feature3_title", length = 150)
    private String feature3Title = "Pagamento Rápido via PIX";

    @Column(name = "feature3_description", length = 500)
    private String feature3Description = "Ativação instantânea via PIX Copia e Cola. Escolha planos mensais fixos ou créditos pré-pagos por clique.";

    @Column(name = "cta_primary_text", length = 100)
    private String ctaPrimaryText = "Criar Conta de Lojista";

    @Column(name = "cta_secondary_text", length = 100)
    private String ctaSecondaryText = "Já sou cadastrado · Entrar";

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public PartnerPageSettings() {}

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getBadgeText() {
        return badgeText;
    }

    public void setBadgeText(String badgeText) {
        this.badgeText = badgeText;
    }

    public String getHeadline() {
        return headline;
    }

    public void setHeadline(String headline) {
        this.headline = headline;
    }

    public String getSubheadline() {
        return subheadline;
    }

    public void setSubheadline(String subheadline) {
        this.subheadline = subheadline;
    }

    public String getFeature1Title() {
        return feature1Title;
    }

    public void setFeature1Title(String feature1Title) {
        this.feature1Title = feature1Title;
    }

    public String getFeature1Description() {
        return feature1Description;
    }

    public void setFeature1Description(String feature1Description) {
        this.feature1Description = feature1Description;
    }

    public String getFeature2Title() {
        return feature2Title;
    }

    public void setFeature2Title(String feature2Title) {
        this.feature2Title = feature2Title;
    }

    public String getFeature2Description() {
        return feature2Description;
    }

    public void setFeature2Description(String feature2Description) {
        this.feature2Description = feature2Description;
    }

    public String getFeature3Title() {
        return feature3Title;
    }

    public void setFeature3Title(String feature3Title) {
        this.feature3Title = feature3Title;
    }

    public String getFeature3Description() {
        return feature3Description;
    }

    public void setFeature3Description(String feature3Description) {
        this.feature3Description = feature3Description;
    }

    public String getCtaPrimaryText() {
        return ctaPrimaryText;
    }

    public void setCtaPrimaryText(String ctaPrimaryText) {
        this.ctaPrimaryText = ctaPrimaryText;
    }

    public String getCtaSecondaryText() {
        return ctaSecondaryText;
    }

    public void setCtaSecondaryText(String ctaSecondaryText) {
        this.ctaSecondaryText = ctaSecondaryText;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
