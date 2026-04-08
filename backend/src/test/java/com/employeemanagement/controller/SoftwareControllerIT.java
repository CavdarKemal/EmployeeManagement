package com.employeemanagement.controller;

import com.employeemanagement.model.Software;
import com.employeemanagement.repository.SoftwareRepository;
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

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Testcontainers
class SoftwareControllerIT {

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
    @Autowired SoftwareRepository repo;

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
    void createSoftware_201() throws Exception {
        String body = """
            {
              "name": "IntelliJ IDEA",
              "vendor": "JetBrains",
              "version": "2024.1",
              "category": "DEV_TOOLS",
              "totalLicenses": 15
            }
            """;

        mockMvc.perform(post("/api/v1/software")
                .contentType(APPLICATION_JSON).content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("IntelliJ IDEA"))
            .andExpect(jsonPath("$.vendor").value("JetBrains"));
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void getAllSoftware_200() throws Exception {
        repo.save(Software.builder().name("Figma").vendor("Figma Inc").totalLicenses(10).build());

        mockMvc.perform(get("/api/v1/software"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$.content[0].name").value("Figma"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateSoftware_200() throws Exception {
        Software sw = repo.save(Software.builder().name("Alt").vendor("V").totalLicenses(5).build());

        String body = """
            {"name":"Neu","vendor":"V2","totalLicenses":20}
            """;

        mockMvc.perform(put("/api/v1/software/" + sw.getId())
                .contentType(APPLICATION_JSON).content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Neu"))
            .andExpect(jsonPath("$.totalLicenses").value(20));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteSoftware_204() throws Exception {
        Software sw = repo.save(Software.builder().name("Del").vendor("V").totalLicenses(1).build());

        mockMvc.perform(delete("/api/v1/software/" + sw.getId()))
            .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteSoftware_withUsedLicenses_409() throws Exception {
        Software sw = repo.save(Software.builder().name("InUse").vendor("V").totalLicenses(5).usedLicenses(2).build());

        mockMvc.perform(delete("/api/v1/software/" + sw.getId()))
            .andExpect(status().isConflict());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createSoftware_missingName_400() throws Exception {
        String body = """
            {"vendor":"Test","totalLicenses":1}
            """;

        mockMvc.perform(post("/api/v1/software")
                .contentType(APPLICATION_JSON).content(body))
            .andExpect(status().isBadRequest());
    }
}
