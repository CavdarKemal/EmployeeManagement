package com.employeemanagement.controller;

import com.employeemanagement.model.AuditLogEntry;
import com.employeemanagement.repository.AuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Testcontainers
class AuditLogControllerIT {

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
    @Autowired AuditLogRepository repo;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(wac)
                .apply(springSecurity())
                .build();
        repo.deleteAll();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAuditLog_200() throws Exception {
        repo.save(AuditLogEntry.builder()
                .username("admin@firma.de").action("POST")
                .path("/api/v1/employees").status(201).ipAddress("127.0.0.1")
                .build());

        mockMvc.perform(get("/api/v1/admin/audit-log"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].username").value("admin@firma.de"))
            .andExpect(jsonPath("$.content[0].action").value("POST"));
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void getAuditLog_forbidden_403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/audit-log"))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAuditLog_withSearch_200() throws Exception {
        repo.save(AuditLogEntry.builder().username("admin@firma.de").action("POST").path("/api/v1/employees").status(201).ipAddress("127.0.0.1").build());
        repo.save(AuditLogEntry.builder().username("hr@firma.de").action("PUT").path("/api/v1/hardware/1").status(200).ipAddress("10.0.0.1").build());

        mockMvc.perform(get("/api/v1/admin/audit-log?search=hardware"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$.content[0].path").value("/api/v1/hardware/1"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAuditLog_empty_200() throws Exception {
        mockMvc.perform(get("/api/v1/admin/audit-log"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isEmpty());
    }
}
