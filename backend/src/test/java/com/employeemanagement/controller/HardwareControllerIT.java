package com.employeemanagement.controller;

import com.employeemanagement.model.Hardware;
import com.employeemanagement.repository.HardwareRepository;
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
class HardwareControllerIT {

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
    @Autowired HardwareRepository repo;

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
    void createHardware_201() throws Exception {
        String body = """
            {
              "assetTag": "HW-IT-001",
              "name": "MacBook Pro 16",
              "category": "LAPTOP",
              "manufacturer": "Apple",
              "status": "AVAILABLE"
            }
            """;

        mockMvc.perform(post("/api/v1/hardware")
                .contentType(APPLICATION_JSON).content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.assetTag").value("HW-IT-001"))
            .andExpect(jsonPath("$.name").value("MacBook Pro 16"));
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void getAllHardware_200() throws Exception {
        repo.save(Hardware.builder().assetTag("HW-001").name("Laptop").status(Hardware.HardwareStatus.AVAILABLE).build());

        mockMvc.perform(get("/api/v1/hardware"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$.content[0].assetTag").value("HW-001"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createHardware_duplicateAssetTag_409() throws Exception {
        repo.save(Hardware.builder().assetTag("HW-DUP").name("Test").status(Hardware.HardwareStatus.AVAILABLE).build());

        String body = """
            {"assetTag":"HW-DUP","name":"Anderes Gerät","status":"AVAILABLE"}
            """;

        mockMvc.perform(post("/api/v1/hardware")
                .contentType(APPLICATION_JSON).content(body))
            .andExpect(status().isConflict());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateHardware_200() throws Exception {
        Hardware hw = repo.save(Hardware.builder().assetTag("HW-UPD").name("Alt").status(Hardware.HardwareStatus.AVAILABLE).build());

        String body = """
            {"assetTag":"HW-UPD","name":"Neu","status":"MAINTENANCE"}
            """;

        mockMvc.perform(put("/api/v1/hardware/" + hw.getId())
                .contentType(APPLICATION_JSON).content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Neu"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteHardware_204() throws Exception {
        Hardware hw = repo.save(Hardware.builder().assetTag("HW-DEL").name("Del").status(Hardware.HardwareStatus.AVAILABLE).build());

        mockMvc.perform(delete("/api/v1/hardware/" + hw.getId()))
            .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void getHardware_notFound_404() throws Exception {
        mockMvc.perform(get("/api/v1/hardware/999"))
            .andExpect(status().isNotFound());
    }
}
