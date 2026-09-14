package com.unbora.api.domain.place;

import com.unbora.api.ai.EmbeddingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlaceVectorSeederService {

    private static final Logger log = LoggerFactory.getLogger(PlaceVectorSeederService.class);

    private final PlaceEmbeddingRepository placeEmbeddingRepository;
    private final EmbeddingService embeddingService;

    public PlaceVectorSeederService(PlaceEmbeddingRepository placeEmbeddingRepository, EmbeddingService embeddingService) {
        this.placeEmbeddingRepository = placeEmbeddingRepository;
        this.embeddingService = embeddingService;
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

    @EventListener(ApplicationReadyEvent.class)
    public void seedIconicPlaces() {
        try {
            long existingCount = placeEmbeddingRepository.countByCityIgnoreCase("Fortaleza");
            if (existingCount >= 10) {
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
                    )
            );

            for (SeedPlace p : iconicPlaces) {
                String vectorStr = embeddingService.getEmbeddingVectorString(p.vibeDna() + " " + p.name() + " " + p.categoryTag() + " " + p.primaryType());
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
                        vectorStr
                );
            }

            log.info("[pgvector Seeder] {} locais icônicos de Fortaleza vetorizados e indexados no pgvector com sucesso!", iconicPlaces.size());
        } catch (Exception e) {
            log.warn("[pgvector Seeder] Erro ao popular seed places: {}", e.getMessage());
        }
    }
}
