package com.unbora.api.common;

import java.util.List;

public class LocationsConstants {
    public static final String DEFAULT_CITY = "Fortaleza";
    public static final String DEFAULT_REGION = "Grande Fortaleza";

    public record RegionCatalog(String id, String name, List<String> cities) {}

    public static final List<RegionCatalog> REGIONS = List.of(
            new RegionCatalog("grande-fortaleza", "Grande Fortaleza", List.of("Fortaleza", "Caucaia", "Maracanaú", "Eusébio", "Aquiraz")),
            new RegionCatalog("litoral-leste", "Litoral Leste", List.of("Beberibe", "Cascavel", "Aracati", "Canoa Quebrada")),
            new RegionCatalog("litoral-oeste", "Litoral Oeste", List.of("Cumbuco", "Paracuru", "São Gonçalo do Amarante")),
            new RegionCatalog("serra", "Serra de Fortaleza", List.of("Guaramiranga", "Baturité", "Redenção")),
            new RegionCatalog("interior", "Interior do Ceará", List.of("Juazeiro do Norte", "Sobral", "Crato"))
    );

    public static boolean matchesLocation(String itemCity, String itemRegion, String filterCity, String filterRegion) {
        boolean cityMatch = filterCity == null || filterCity.isBlank() || (itemCity != null && itemCity.equalsIgnoreCase(filterCity.trim()));
        boolean regionMatch = filterRegion == null || filterRegion.isBlank() || (itemRegion != null && itemRegion.equalsIgnoreCase(filterRegion.trim()));
        return cityMatch && regionMatch;
    }
}
