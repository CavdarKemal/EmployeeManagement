package com.employeemanagement.controller;

import com.employeemanagement.repository.EmployeeRepository;
import com.employeemanagement.repository.HardwareRepository;
import com.employeemanagement.repository.SoftwareRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Testcontainers
class ImportControllerIT {

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
    @Autowired EmployeeRepository empRepo;
    @Autowired HardwareRepository hwRepo;
    @Autowired SoftwareRepository swRepo;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(wac)
                .apply(springSecurity())
                .build();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void importEmployees_200() throws Exception {
        empRepo.deleteAll();
        String csv = "\"Nr.\";\"Vorname\";\"Nachname\";\"E-Mail\";\"Eingestellt\"\r\n" +
                     "\"EMP-IMP-IT\";\"Import\";\"Test\";\"import-it@test.de\";\"2024-06-01\"\r\n";

        mockMvc.perform(multipart("/api/v1/import/employees")
                .file(new MockMultipartFile("file", "emp.csv", "text/csv", csv.getBytes())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.imported").value(1))
            .andExpect(jsonPath("$.skipped").value(0));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void importHardware_200() throws Exception {
        hwRepo.deleteAll();
        String csv = "\"Asset-Tag\";\"Name\";\"Status\"\r\n" +
                     "\"HW-IMP-IT\";\"Import Laptop\";\"AVAILABLE\"\r\n";

        mockMvc.perform(multipart("/api/v1/import/hardware")
                .file(new MockMultipartFile("file", "hw.csv", "text/csv", csv.getBytes())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.imported").value(1));
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void importEmployees_forbidden_403() throws Exception {
        mockMvc.perform(multipart("/api/v1/import/employees")
                .file(new MockMultipartFile("file", "emp.csv", "text/csv", "test".getBytes())))
            .andExpect(status().isForbidden());
    }
}
