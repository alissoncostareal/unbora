package com.unbora.api.domain.place;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PlaceBanServiceTest {

    private PlaceBanRepository repository;
    private PlaceBanService service;

    @BeforeEach
    void setUp() {
        repository = Mockito.mock(PlaceBanRepository.class);
        service = new PlaceBanService(repository);
    }

    @Test
    void shouldBlockByPlaceId() {
        PlaceBan ban = new PlaceBan();
        ban.setId("1");
        ban.setName("Algum Lugar");
        ban.setPlaceId("ChIJ12345");

        when(repository.findAll()).thenReturn(List.of(ban));

        assertTrue(service.blocked("ChIJ12345", "Outro Nome"));
        assertFalse(service.blocked("ChIJ99999", "Outro Nome"));
    }

    @Test
    void shouldBlockByNameIgnoringCaseAndAccents() {
        PlaceBan ban = new PlaceBan();
        ban.setId("1");
        ban.setName("Café São José");
        ban.setPlaceId(null);

        when(repository.findAll()).thenReturn(List.of(ban));

        assertTrue(service.blocked(null, "cafe sao jose"));
        assertTrue(service.blocked("", "CAFÉ SÃO JOSÉ"));
        assertTrue(service.blocked("ChIJxyz", "Cafe Sao Jose"));
        assertFalse(service.blocked(null, "Café São Bento"));
    }

    @Test
    void shouldCreateBanRecord() {
        when(repository.save(any(PlaceBan.class))).thenAnswer(invocation -> {
            PlaceBan p = invocation.getArgument(0);
            p.setCreatedAt(Instant.now());
            return p;
        });

        Map<String, Object> result = service.create("Lugar Indesejado", "ChIJabc", "Fortaleza", "Reclamações");

        assertNotNull(result.get("id"));
        assertEquals("Lugar Indesejado", result.get("name"));
        assertEquals("ChIJabc", result.get("placeId"));
        assertEquals("Fortaleza", result.get("city"));
        assertEquals("Reclamações", result.get("reason"));
    }

    @Test
    void shouldRemoveBanRecord() {
        when(repository.existsById("ban-123")).thenReturn(true);

        Map<String, Object> result = service.remove("ban-123");

        assertTrue((Boolean) result.get("deleted"));
        assertEquals("ban-123", result.get("id"));
        verify(repository).deleteById("ban-123");
    }
}
