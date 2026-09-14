package com.unbora.api.ai;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ImageSubjectClassifierTest {

    private final ImageSubjectClassifier classifier = new ImageSubjectClassifier();

    @Test
    void restauranteLocalUsaFotoDoMaps() {
        assertEquals(
                ImageSubjectClassifier.Kind.LOCAL_PLACE,
                classifier.classify("Coco Bambu Meireles", "Restaurante", "gastronomia")
        );
    }

    @Test
    void festivalNaoUsaFotoDoLocal() {
        assertEquals(
                ImageSubjectClassifier.Kind.CULTURAL_EVENT,
                classifier.classify("Festival de Reggae no Cuca", "Show", "musica")
        );
    }

    @Test
    void pecaDeTeatroEEventoMesmoComLocalNoNome() {
        assertEquals(
                ImageSubjectClassifier.Kind.CULTURAL_EVENT,
                classifier.classify("Peça O Auto da Compadecida", "Espetáculo", "cultura")
        );
    }

    @Test
    void barNaoViraEventoSoPeloTipoAusente() {
        assertEquals(
                ImageSubjectClassifier.Kind.LOCAL_PLACE,
                classifier.classify("Boteco Praia de Iracema", "Bar", "bar")
        );
    }

    @Test
    void barComEncontroNoNomeContinuaLugar() {
        assertEquals(
                ImageSubjectClassifier.Kind.LOCAL_PLACE,
                classifier.classify("Bar do Encontro", "Bar", "bar")
        );
    }

    @Test
    void cafeteriaUsaMaps() {
        assertEquals(
                ImageSubjectClassifier.Kind.LOCAL_PLACE,
                classifier.classify("Atelier 1913", "Café", "gastronomia")
        );
    }
}
