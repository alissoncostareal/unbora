package com.unbora.api.domain.place;

import com.unbora.api.ai.EmbeddingService;
import com.unbora.api.ai.GooglePlacesDiscoveryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class PlaceVectorSeederService {

    private static final Logger log = LoggerFactory.getLogger(PlaceVectorSeederService.class);

    private final PlaceEmbeddingRepository placeEmbeddingRepository;
    private final EmbeddingService embeddingService;
    private final GooglePlacesDiscoveryService googlePlacesDiscoveryService;
    private final com.unbora.api.ai.PlaceDnaTagExtractor placeDnaTagExtractor;

    @Autowired
    public PlaceVectorSeederService(
            PlaceEmbeddingRepository placeEmbeddingRepository,
            EmbeddingService embeddingService,
            @Autowired(required = false) GooglePlacesDiscoveryService googlePlacesDiscoveryService,
            @Autowired(required = false) com.unbora.api.ai.PlaceDnaTagExtractor placeDnaTagExtractor
    ) {
        this.placeEmbeddingRepository = placeEmbeddingRepository;
        this.embeddingService = embeddingService;
        this.googlePlacesDiscoveryService = googlePlacesDiscoveryService;
        this.placeDnaTagExtractor = placeDnaTagExtractor != null ? placeDnaTagExtractor : new com.unbora.api.ai.PlaceDnaTagExtractor();
    }

    public PlaceVectorSeederService(PlaceEmbeddingRepository placeEmbeddingRepository, EmbeddingService embeddingService) {
        this(placeEmbeddingRepository, embeddingService, null, null);
    }

    public record SeedPlace(
            String id,
            String name,
            String city,
            String categoryTag,
            String primaryType,
            String formattedAddress,
            Double latitude,
            Double longitude,
            Double rating,
            Integer userRatingCount,
            String googleMapsUri,
            String photoUrl,
            String vibeDna
    ) {}

    @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void onApplicationReady() {
        java.util.concurrent.CompletableFuture.runAsync(this::seedIconicPlaces);
    }

    public void seedIconicPlaces() {
        try {
            long existingCount = placeEmbeddingRepository.countByCityIgnoreCase("Fortaleza");
            if (existingCount >= 22) {
                log.info("[pgvector Seeder] Base vetorial de Fortaleza já possui {} locais indexados.", existingCount);
                return;
            }

            log.info("[pgvector Seeder] Indexando estabelecimentos icônicos de Fortaleza no pgvector...");

            List<SeedPlace> iconicPlaces = List.of(
                    new SeedPlace(
                            "ordones-pioneiro",
                            "Restaurante Carneiro do Ordones O Pioneiro",
                            "Fortaleza",
                            "gastronomia",
                            "Restaurante Regional e Churrascaria",
                            "R. Azevedo Bolão, 571 - Parquelândia, Fortaleza - CE",
                            -3.7350354,
                            -38.5493545,
                            4.6,
                            31954,
                            "https://maps.google.com/?cid=9084961581983902583",
                            "https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80",
                            "Carneiro do Ordones é o restaurante regional mais famoso e tradicional do Ceará, localizado na Parquelândia. Famoso pelo carneiro na brasa suculento, baião de dois com queijo coalho, paçoca, macaxeira frita, chopp trincando de gelado, ambiente familiar animado e acolhedor para reunir amigos e família."
                    ),
                    new SeedPlace(
                            "coco-bambu-beiramar",
                            "Coco Bambu Beira Mar",
                            "Fortaleza",
                            "gastronomia",
                            "Restaurante de Frutos do Mar",
                            "Av. Beira Mar, 3698 - Meireles, Fortaleza - CE",
                            -3.7236276,
                            -38.4874909,
                            4.7,
                            26558,
                            "https://maps.google.com/?cid=10917257566125565940",
                            "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&auto=format&fit=crop&q=80",
                            "Coco Bambu Beira Mar é o maior ícone gastronômico da orla de Fortaleza, em frente à praia do Meireles. Especialista em camarão internacional, frutos do mar fartos, peixe à meunière, sobremesas gigantescas como a cocada ao forno com sorvete, chopp gelado e ambiente climatizado sofisticado com vista para o mar."
                    ),
                    new SeedPlace(
                            "cantinho-do-frango",
                            "Cantinho do Frango",
                            "Fortaleza",
                            "gastronomia",
                            "Bar e Restaurante Tradicional",
                            "R. Torres Câmara, 71 - Aldeota, Fortaleza - CE",
                            -3.737198,
                            -38.508492,
                            4.7,
                            6800,
                            "https://maps.google.com/?cid=1234567890",
                            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80",
                            "Cantinho do Frango é uma instituição boêmia e cultural da Aldeota em Fortaleza. Famoso pelo frango desossado e assado na brasa, cachaças artesanais, vinis, MPB e chorinho ao vivo, chopp artesanal e clima descontraído ao ar livre com mesas de madeira."
                    ),
                    new SeedPlace(
                            "chico-do-caranguejo-praia",
                            "Chico do Caranguejo Praia",
                            "Fortaleza",
                            "praia",
                            "Barraca de Praia e Restaurante",
                            "Av. Clóvis Arrais Maia, 4930 - Praia do Futuro, Fortaleza - CE",
                            -3.743120,
                            -38.448910,
                            4.6,
                            38000,
                            "https://maps.google.com/?cid=9876543210",
                            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
                            "Chico do Caranguejo na Praia do Futuro é a mais famosa barraca de caranguejo do Brasil. Tradicional caranguejada na quinta-feira e finais de semana, parque aquático infantil, água de coco, caipirinhas de frutas tropicais, música ao vivo e pé na areia com brisa do mar."
                    ),
                    new SeedPlace(
                            "santa-grelha",
                            "Santa Grelha Meireles",
                            "Fortaleza",
                            "gastronomia",
                            "Steakhouse Contemporânea",
                            "R. Tibúrcio Cavalcante, 790 - Meireles, Fortaleza - CE",
                            -3.7316086,
                            -38.5014786,
                            4.7,
                            2571,
                            "https://maps.google.com/?cid=8978536179627837216",
                            "https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80",
                            "Santa Grelha é a principal steakhouse premium de Fortaleza. Cortes nobres de carne bovina na grelha argentina, bife de tira, ancho, carta de vinhos selecionados com sommelier, ambiente intimista elegante para jantares românticos e reuniões executivas."
                    ),
                    new SeedPlace(
                            "illa-mare",
                            "Illa Mare",
                            "Fortaleza",
                            "gastronomia",
                            "Restaurante de Frutos do Mar e Vista Mar",
                            "Av. Beira Mar, 3821 - Meireles, Fortaleza - CE",
                            -3.7229288,
                            -38.4869976,
                            4.5,
                            4678,
                            "https://maps.google.com/?cid=17312483939114518999",
                            "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=1200&auto=format&fit=crop&q=80",
                            "Illa Mare é um dos restaurantes mais bonitos da orla da Beira-Mar com vista panorâmica para o oceano. Especialista em lagosta, polvo grelhado, risotos de frutos do mar, drinks autorais e clima romântico requintado."
                    ),
                    new SeedPlace(
                            "giz-bar",
                            "Giz Bar",
                            "Fortaleza",
                            "bar",
                            "Gastrobar e Boteco Boêmio",
                            "R. Professor Dias da Rocha, 579 - Meireles, Fortaleza - CE",
                            -3.735112,
                            -38.498845,
                            4.8,
                            3200,
                            "https://maps.google.com/?cid=1122334455",
                            "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&auto=format&fit=crop&q=80",
                            "Giz Bar é um gastrobar premiado com alma de boteco carioca e cearense. Petiscos de alta gastronomia, coxinha de caranguejo, chopp artesanal, drinks clássicos e autorais, samba e chorinho com iluminação acolhedora e mesas na calçada."
                    ),
                    new SeedPlace(
                            "cafe-viriato",
                            "Café Viriato",
                            "Fortaleza",
                            "gastronomia",
                            "Cafeteria Especial e Bistrô",
                            "R. Osvaldo Cruz, 2828 - Dionísio Torres, Fortaleza - CE",
                            -3.750123,
                            -38.503456,
                            4.8,
                            2100,
                            "https://maps.google.com/?cid=2233445566",
                            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80",
                            "Café Viriato é uma das cafeterias e bistrôs mais charmosas de Fortaleza. Cafés especiais filtrados e expressos, brunch completo, croissants folhados franceses, tortas artesanais refinadas e ambiente sereno perfeito para trabalhar ou conversar."
                    ),
                    new SeedPlace(
                            "mercado-dos-peixes",
                            "Mercado dos Peixes Mucuripe",
                            "Fortaleza",
                            "praia",
                            "Ponto Turístico e Gastronômico",
                            "Av. Beira Mar, 3479 - Mucuripe, Fortaleza - CE",
                            -3.721456,
                            -38.479876,
                            4.7,
                            18500,
                            "https://maps.google.com/?cid=3344556677",
                            "https://images.unsplash.com/photo-1509233725247-49e657c54213?w=1200&auto=format&fit=crop&q=80",
                            "Mercado dos Peixes no Mucuripe é a experiência mais autêntica de Fortaleza. Você escolhe camarões, lagostas e peixes frescos direto dos pescadores e frita na hora nos boxes vizinhos, acompanhado de cerveja gelada e o pôr do sol mais espetacular da cidade."
                    ),
                    new SeedPlace(
                            "dragao-do-mar",
                            "Centro Dragão do Mar de Arte e Cultura",
                            "Fortaleza",
                            "cultura",
                            "Centro Cultural e Planetário",
                            "R. Dragão do Mar, 81 - Praia de Iracema, Fortaleza - CE",
                            -3.721998,
                            -38.519776,
                            4.7,
                            24000,
                            "https://maps.google.com/?cid=4455667788",
                            "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=1200&auto=format&fit=crop&q=80",
                            "Centro Dragão do Mar de Arte e Cultura é o principal polo cultural do Ceará. Museus de arte contemporânea e cultura cearense, cinema cult do Dragão, planetário Rubens de Azevedo, teatro, anfiteatro com shows ao ar livre e bares boêmios ao redor."
                    ),
                    new SeedPlace(
                            "carbone-steakhouse",
                            "Carbone Steakhouse Aldeota",
                            "Fortaleza",
                            "gastronomia",
                            "Steakhouse e Restaurante Moderno",
                            "Av. Des. Moreira, 1300 - Aldeota, Fortaleza - CE",
                            -3.7373219,
                            -38.4990002,
                            4.7,
                            1595,
                            "https://maps.google.com/?cid=9567741971708846046",
                            "https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80",
                            "Carbone Steakhouse na Aldeota é especialista em carnes nobres grelhadas com máxima sofisticação. Cortes dry aged, tomahawk, carta de drinks assinados, iluminação baixa e sommelier."
                    ),
                    new SeedPlace(
                            "sal-e-brasa-fortaleza",
                            "Sal e Brasa Fortaleza",
                            "Fortaleza",
                            "gastronomia",
                            "Churrascaria Tradicional",
                            "Av. Barão de Studart, 825 - Aldeota, Fortaleza - CE",
                            -3.7315448,
                            -38.5053168,
                            4.7,
                            2952,
                            "https://maps.google.com/?cid=6898162225586776608",
                            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80",
                            "Sal e Brasa é uma das churrascarias mais tradicionais da Aldeota. Carnes nobres servidas no espeto corrido, buffet completo de sushi, queijos e frutos do mar, salão amplo para grupos grandes e celebrações."
                    ),
                    new SeedPlace(
                            "cervejaria-turatti-varjota",
                            "Cervejaria Turatti Varjota",
                            "Fortaleza",
                            "bar",
                            "Cervejaria Artesanal e Gastropub",
                            "R. Ana Bilhar, 1178 - Varjota, Fortaleza - CE",
                            -3.731234,
                            -38.491234,
                            4.7,
                            8400,
                            "https://maps.google.com/?cid=1234567896",
                            "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&auto=format&fit=crop&q=80",
                            "Cervejaria Turatti no polo gastronômico da Varjota produz chopps artesanais premiados no local. Cardápio com parrilla de carnes nobres, petiscos autorais, música ao vivo e fábrica de cerveja com vista panorâmica."
                    ),
                    new SeedPlace(
                            "caravaggio-varjota",
                            "Caravaggio Cucina Italiana",
                            "Fortaleza",
                            "gastronomia",
                            "Restaurante Italiano e Carta de Vinhos",
                            "R. Ana Bilhar, 1146 - Varjota, Fortaleza - CE",
                            -3.731456,
                            -38.491567,
                            4.8,
                            3100,
                            "https://maps.google.com/?cid=1234567897",
                            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80",
                            "Caravaggio é um clássico italiano refinado na Varjota. Massas frescas artesanais preparadas na casa, risotos cremosos, carnes e adega climatizada com rótulos internacionais em ambiente romântico à luz de velas."
                    ),
                    new SeedPlace(
                            "moleskine-gastrobar",
                            "Moleskine Gastrobar",
                            "Fortaleza",
                            "bar",
                            "Gastrobar, Rooftop e Coquetelaria",
                            "R. Prof. Dias da Rocha, 578 - Meireles, Fortaleza - CE",
                            -3.733123,
                            -38.498456,
                            4.6,
                            6200,
                            "https://maps.google.com/?cid=1234567898",
                            "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&auto=format&fit=crop&q=80",
                            "Moleskine Gastrobar no Meireles oferece múltiplos ambientes modernos, incluindo rooftop ao ar livre, carta autoral de coquetéis premiados, pratos contemporâneos elaborados e iluminação indireta aconchegante."
                    ),
                    new SeedPlace(
                            "amika-coffeehouse",
                            "Amika Coffeehouse",
                            "Fortaleza",
                            "gastronomia",
                            "Café Especial e Microtorrefação",
                            "R. Ana Bilhar, 1136 - Varjota, Fortaleza - CE",
                            -3.731678,
                            -38.491890,
                            4.8,
                            2400,
                            "https://maps.google.com/?cid=1234567899",
                            "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop&q=80",
                            "Amika é pioneira em cafés especiais na Varjota. Grãos selecionados de produtores artesanais brasileiros, métodos variados de extração filtrada, espressos perfeitos, bolos caseiros e ambiente sereno com mesas para leitura e trabalho."
                    ),
                    new SeedPlace(
                            "parque-do-coco",
                            "Parque Estadual do Cocó",
                            "Fortaleza",
                            "natureza",
                            "Parque Ecológico, Trilhas e Área Verde",
                            "Av. Padre Antônio Tomás, s/n - Cocó, Fortaleza - CE",
                            -3.754321,
                            -38.485678,
                            4.8,
                            14200,
                            "https://maps.google.com/?cid=1234567900",
                            "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80",
                            "Parque Estadual do Cocó é um dos maiores parques naturais urbanos da América Latina, no bairro Cocó. Trilhas ecológicas sob manguezais, passeios de barco pelo rio Cocó, ar puro e piqueniques em meio à natureza preservada."
                    ),
                    new SeedPlace(
                            "theatro-jose-de-alencar",
                            "Theatro José de Alencar",
                            "Fortaleza",
                            "cultura",
                            "Patrimônio Histórico e Arquitetura",
                            "R. Liberato Barroso, 525 - Centro, Fortaleza - CE",
                            -3.728901,
                            -38.532345,
                            4.9,
                            11300,
                            "https://maps.google.com/?cid=1234567901",
                            "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=1200&auto=format&fit=crop&q=80",
                            "Theatro José de Alencar no Centro Histórico de Fortaleza é uma obra-prima da arquitetura art nouveau com estrutura de ferro fundido escocês, vitrais coloridos, jardim projetado por Burle Marx e programação cultural rica."
                    ),
                    new SeedPlace(
                            "passeio-publico-fortaleza",
                            "Passeio Público e Café das Artes",
                            "Fortaleza",
                            "cultura",
                            "Praça Histórica e Gastronomia ao Ar Livre",
                            "Praça dos Mártires, s/n - Centro, Fortaleza - CE",
                            -3.722345,
                            -38.528765,
                            4.7,
                            8900,
                            "https://maps.google.com/?cid=1234567902",
                            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80",
                            "Passeio Público é a praça mais antiga de Fortaleza, com árvores centenárias, vista para o mar da orla central, feijoada aos sábados com chorinho ao vivo e um café charmoso sob as copas das árvores."
                    ),
                    new SeedPlace(
                            "boteco-praia-meireles",
                            "Boteco Praia Beira Mar",
                            "Fortaleza",
                            "bar",
                            "Boteco com Vista Mar e Música ao Vivo",
                            "Av. Beira Mar, 1680 - Meireles, Fortaleza - CE",
                            -3.725678,
                            -38.502345,
                            4.5,
                            9100,
                            "https://maps.google.com/?cid=1234567903",
                            "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&auto=format&fit=crop&q=80",
                            "Boteco Praia na Beira Mar do Meireles é ponto de encontro imperdível para o fim de tarde. Chope gelado, petiscos tradicionais de boteco, mesas na calçada de frente para o mar e programação de samba e pop rock."
                    ),
                    new SeedPlace(
                            "vignoli-meireles",
                            "Pizzaria Vignoli Meireles",
                            "Fortaleza",
                            "gastronomia",
                            "Pizzas Gourmet com Massa Crocante",
                            "R. Silva Jatahy, 529 - Meireles, Fortaleza - CE",
                            -3.727890,
                            -38.497654,
                            4.7,
                            5400,
                            "https://maps.google.com/?cid=1234567904",
                            "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&auto=format&fit=crop&q=80",
                            "Pizzaria Vignoli no Meireles é famosa pela massa finíssima e crocante premiada que se come com as mãos, usando luvinhas plásticas. Ingredientes selecionados, carta de vinhos e ambiente arborizado romântico."
                    ),
                    new SeedPlace(
                            "bulls-beer-house-aldeota",
                            "Bulls Beer House Aldeota",
                            "Fortaleza",
                            "bar",
                            "Pub de Rock e Chopes Artesanais",
                            "R. Cel. Jucá, 700 - Aldeota, Fortaleza - CE",
                            -3.738901,
                            -38.493456,
                            4.7,
                            4200,
                            "https://maps.google.com/?cid=1234567905",
                            "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&auto=format&fit=crop&q=80",
                            "Bulls Beer House na Aldeota é o principal pub de rock e cervejas artesanais de Fortaleza. Burgers generosos grelhados na brasa, dezenas de torneiras de chopp artesanal e apresentações de bandas de classic rock."
                    )
            );

            for (SeedPlace p : iconicPlaces) {
                com.unbora.api.ai.PlaceDnaTagExtractor.DnaExtractionResult dnaResult = placeDnaTagExtractor.extractDna(
                        p.name(), p.primaryType(), List.of(p.categoryTag()), p.formattedAddress(),
                        p.vibeDna(), p.vibeDna(), null, null
                );
                String tags = dnaResult != null ? dnaResult.tagsString() : "";
                String attributes = dnaResult != null ? dnaResult.attributesJson() : "{}";

                String vectorStr = embeddingService.getEmbeddingVectorString(p.vibeDna() + " " + p.name() + " " + p.categoryTag() + " " + p.primaryType() + " " + tags);
                placeEmbeddingRepository.upsertPlaceVector(
                        p.id(),
                        p.name(),
                        p.city(),
                        p.categoryTag(),
                        p.primaryType(),
                        p.formattedAddress(),
                        p.latitude(),
                        p.longitude(),
                        p.rating(),
                        p.userRatingCount(),
                        p.googleMapsUri(),
                        p.photoUrl(),
                        p.vibeDna(),
                        tags,
                        attributes,
                        vectorStr
                );
            }

            log.info("[pgvector Seeder] {} locais icônicos de Fortaleza vetorizados e indexados no pgvector com sucesso!", iconicPlaces.size());
        } catch (Exception e) {
            log.warn("[pgvector Seeder] Erro ao popular seed places: {}", e.getMessage());
        }
    }

    /**
     * Indexa proativamente os melhores locais de qualquer cidade utilizando Google Places + pgvector + cache de fotos.
     * Modelo "Fetch Once, Serve Forever": Executa uma única vez por cidade no lançamento.
     */
    public Map<String, Object> seedCityFromGooglePlaces(String city, String country, Integer limitPerCategory) {
        if (city == null || city.isBlank()) {
            return Map.of("status", "error", "message", "Cidade e obrigatoria");
        }
        if (googlePlacesDiscoveryService == null || !googlePlacesDiscoveryService.isConfigured()) {
            return Map.of("status", "error", "message", "Google Places API nao configurada");
        }

        String effectiveCountry = (country == null || country.isBlank()) ? "Brasil" : country;
        int maxPerCat = (limitPerCategory != null && limitPerCategory > 0) ? Math.min(limitPerCategory, 20) : 15;

        List<String> searchThemes = List.of(
                "restaurantes e gastronomia",
                "cafeterias e docerias",
                "bares e gastrobares",
                "pontos turisticos e cultura",
                "parques e ar livre",
                "baladas e vida noturna"
        );

        int totalIndexed = 0;
        int totalDiscovered = 0;

        for (String theme : searchThemes) {
            try {
                List<GooglePlacesDiscoveryService.DiscoveredPlace> places = googlePlacesDiscoveryService.searchPlaces(
                        theme, null, null, 15.0, city, effectiveCountry, maxPerCat
                );
                if (places == null || places.isEmpty()) continue;

                totalDiscovered += places.size();
                for (GooglePlacesDiscoveryService.DiscoveredPlace p : places) {
                    if (p.displayName() == null || p.displayName().isBlank()) continue;

                    String id = p.placeId() != null && !p.placeId().isBlank()
                            ? p.placeId()
                            : (p.displayName().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "-") + "-" + city.toLowerCase(Locale.ROOT));

                    String directPhoto = p.photoUrl();
                    if (directPhoto != null && directPhoto.contains("places.googleapis.com")) {
                        directPhoto = googlePlacesDiscoveryService.resolveDirectPhotoUrl(directPhoto);
                    }

                    com.unbora.api.ai.PlaceDnaTagExtractor.DnaExtractionResult dnaResult = placeDnaTagExtractor.extractDna(
                            p.displayName(), p.primaryType(), p.types(), p.formattedAddress(),
                            p.editorialSummary(), null, p.priceLevel(), null
                    );
                    String tags = dnaResult != null ? dnaResult.tagsString() : "";
                    String attributes = dnaResult != null ? dnaResult.attributesJson() : "{}";

                    String dna = p.displayName() + " em " + city + ". "
                            + (tags != null && !tags.isBlank() ? "Tags: " + tags + ". " : "")
                            + (p.editorialSummary() != null && !p.editorialSummary().isBlank() ? p.editorialSummary() : (p.primaryType() != null ? p.primaryType() : "Lugar"))
                            + " " + (p.formattedAddress() != null ? p.formattedAddress() : "");

                    String vector = embeddingService.getEmbeddingVectorString(dna);

                    placeEmbeddingRepository.upsertPlaceVector(
                            id,
                            p.displayName(),
                            city,
                            p.primaryType(),
                            p.primaryType(),
                            p.formattedAddress(),
                            p.latitude(),
                            p.longitude(),
                            p.rating(),
                            p.userRatingCount(),
                            p.googleMapsUri(),
                            directPhoto,
                            dna,
                            tags,
                            attributes,
                            vector
                    );
                    totalIndexed++;
                }
            } catch (Exception e) {
                log.warn("[pgvector Seeder] Erro ao indexar tema '{}' em '{}': {}", theme, city, e.getMessage());
            }
        }

        log.info("[pgvector Seeder] Concluida indexacao de '{}': {} locais descobertos, {} inseridos/atualizados no pgvector.",
                city, totalDiscovered, totalIndexed);

        return Map.of(
                "status", "success",
                "city", city,
                "country", effectiveCountry,
                "totalDiscovered", totalDiscovered,
                "totalIndexed", totalIndexed,
                "existingCityCount", placeEmbeddingRepository.countByCityIgnoreCase(city)
        );
    }
}
