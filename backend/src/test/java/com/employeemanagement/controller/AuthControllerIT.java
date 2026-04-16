package com.employeemanagement.controller;

import com.employeemanagement.model.AppUser;
import com.employeemanagement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Testcontainers
class AuthControllerIT {

    @Container
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("employeemanagement_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url",      postgres::getJdbcUrl);
        r.add("spring.datasource.username", postgres::getUsername);
        r.add("spring.datasource.password", postgres::getPassword);
        r.add("spring.flyway.enabled",      () -> "true");
    }

    @Autowired WebApplicationContext wac;
    @Autowired UserRepository userRepo;
    @Autowired PasswordEncoder passwordEncoder;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(wac)
                .apply(springSecurity())
                .build();
    }

    private void createTestUser(String email, String password, AppUser.Role role) {
        if (userRepo.findByEmail(email).isEmpty()) {
            userRepo.save(AppUser.builder()
                    .email(email)
                    .passwordHash(passwordEncoder.encode(password))
                    .displayName("Test User")
                    .role(role)
                    .build());
        }
    }

    @Test
    void login_success_200() throws Exception {
        createTestUser("test-auth@firma.de", "geheim123", AppUser.Role.ADMIN);

        String body = """
            {"email":"test-auth@firma.de","password":"geheim123"}
            """;

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(APPLICATION_JSON).content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isNotEmpty())
            .andExpect(jsonPath("$.tokenType").value("Bearer"));
    }

    @Test
    void login_wrongPassword_401() throws Exception {
        createTestUser("test-wrong@firma.de", "richtig", AppUser.Role.VIEWER);

        String body = """
            {"email":"test-wrong@firma.de","password":"falsch"}
            """;

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(APPLICATION_JSON).content(body))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void login_unknownUser_401() throws Exception {
        String body = """
            {"email":"gibts-nicht@firma.de","password":"egal"}
            """;

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(APPLICATION_JSON).content(body))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void login_missingEmail_400() throws Exception {
        String body = """
            {"password":"test123"}
            """;

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(APPLICATION_JSON).content(body))
            .andExpect(status().isBadRequest());
    }

    @Test
    void login_invalidEmail_400() throws Exception {
        String body = """
            {"email":"keine-email","password":"test123"}
            """;

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(APPLICATION_JSON).content(body))
            .andExpect(status().isBadRequest());
    }
}
