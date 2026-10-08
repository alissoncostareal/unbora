package com.unbora.api.domain.guide;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "guide_settings")
public class GuideSettings {

    public static final String ID = "default";

    @Id
    private String id = ID;

    @Column(name = "budget_min", nullable = false)
    private int budgetMin = 0;

    @Column(name = "budget_max", nullable = false)
    private int budgetMax = 300;

    @Column(name = "budget_step", nullable = false)
    private int budgetStep = 10;

    @Column(name = "budget_default", nullable = false)
    private int budgetDefault = 80;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public int getBudgetMin() {
        return budgetMin;
    }

    public void setBudgetMin(int budgetMin) {
        this.budgetMin = budgetMin;
    }

    public int getBudgetMax() {
        return budgetMax;
    }

    public void setBudgetMax(int budgetMax) {
        this.budgetMax = budgetMax;
    }

    public int getBudgetStep() {
        return budgetStep;
    }

    public void setBudgetStep(int budgetStep) {
        this.budgetStep = budgetStep;
    }

    public int getBudgetDefault() {
        return budgetDefault;
    }

    public void setBudgetDefault(int budgetDefault) {
        this.budgetDefault = budgetDefault;
    }
}
