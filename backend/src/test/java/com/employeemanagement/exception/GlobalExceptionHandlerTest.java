package com.employeemanagement.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("ResourceNotFoundException → 404")
    void handleNotFound() {
        var response = handler.handleNotFound(new ResourceNotFoundException("Mitarbeiter", 1L));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().status()).isEqualTo(404);
    }

    @Test
    @DisplayName("BusinessException → 409")
    void handleBusiness() {
        var response = handler.handleBusiness(new BusinessException("Duplikat"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().message()).isEqualTo("Duplikat");
    }

    @Test
    @DisplayName("AuthenticationException → 401")
    void handleAuth() {
        var response = handler.handleAuth(new BadCredentialsException("Bad creds"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody().status()).isEqualTo(401);
    }

    @Test
    @DisplayName("Generische Exception → 500")
    void handleGeneric() {
        var response = handler.handleGeneric(new RuntimeException("Unbekannt"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().status()).isEqualTo(500);
    }
}
