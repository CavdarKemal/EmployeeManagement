package com.employeemanagement.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() throws Exception {
        jwtService = new JwtService();
        setField("secret", "TestSecretKeyThatIsAtLeast32CharactersLong!");
        setField("expirationMs", 86400000L);
    }

    private void setField(String name, Object value) throws Exception {
        Field field = JwtService.class.getDeclaredField(name);
        field.setAccessible(true);
        field.set(jwtService, value);
    }

    @Test
    @DisplayName("generateToken – erzeugt gültigen JWT-Token")
    void generateToken_valid() {
        String token = jwtService.generateToken("admin@firma.de");

        assertThat(token).isNotBlank();
        assertThat(token.split("\\.")).hasSize(3); // header.payload.signature
    }

    @Test
    @DisplayName("extractSubject – Subject wird korrekt extrahiert")
    void extractSubject_success() {
        String token = jwtService.generateToken("user@firma.de");

        String subject = jwtService.extractSubject(token);

        assertThat(subject).isEqualTo("user@firma.de");
    }

    @Test
    @DisplayName("isTokenValid – gültiger Token wird akzeptiert")
    void isTokenValid_valid() {
        String token = jwtService.generateToken("admin@firma.de");

        assertThat(jwtService.isTokenValid(token)).isTrue();
    }

    @Test
    @DisplayName("isTokenValid – ungültiger Token wird abgelehnt")
    void isTokenValid_invalid() {
        assertThat(jwtService.isTokenValid("invalid.token.here")).isFalse();
    }

    @Test
    @DisplayName("isTokenValid – manipulierter Token wird abgelehnt")
    void isTokenValid_tampered() {
        String token = jwtService.generateToken("admin@firma.de");
        String tampered = token.substring(0, token.length() - 5) + "XXXXX";

        assertThat(jwtService.isTokenValid(tampered)).isFalse();
    }

    @Test
    @DisplayName("getExpirationMs – gibt konfigurierte Ablaufzeit zurück")
    void getExpirationMs() {
        assertThat(jwtService.getExpirationMs()).isEqualTo(86400000L);
    }
}
