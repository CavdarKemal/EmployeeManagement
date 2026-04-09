package com.employeemanagement.controller;

import com.employeemanagement.model.Employee;
import com.employeemanagement.model.Hardware;
import com.employeemanagement.model.Software;
import com.employeemanagement.repository.EmployeeRepository;
import com.employeemanagement.repository.HardwareRepository;
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

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Testcontainers
class ReportControllerIT {

    @Container
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("employeemanagement_test")
            .withUsername("test").withPassword("test");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", postgres::getJdbcUrl);
        r.add("spring.datasource.username", postgres::getUsername);
        r.add("spring.datasource.password", postgres::getPassword);
        r.add("spring.flyway.enabled", () -> "true");
    }

    @Autowired WebApplicationContext wac;
    @Autowired EmployeeRepository empRepo;
    @Autowired HardwareRepository hwRepo;
    @Autowired SoftwareRepository swRepo;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(wac).apply(springSecurity()).build();
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void employeeReport_returnsPdf() throws Exception {
        empRepo.deleteAll();
        empRepo.save(Employee.builder().employeeNumber("EMP-PDF").firstName("PDF").lastName("Test")
                .email("pdf@test.de").hireDate(LocalDate.now()).department("IT").build());

        byte[] pdf = mockMvc.perform(get("/api/v1/reports/employees"))
            .andExpect(status().isOk())
            .andExpect(content().contentType("application/pdf"))
            .andExpect(header().string("Content-Disposition", "attachment; filename=\"Mitarbeiter-Bericht.pdf\""))
            .andReturn().getResponse().getContentAsByteArray();

        assertThat(pdf.length).isGreaterThan(100);
        assertThat(new String(pdf, 0, 5)).isEqualTo("%PDF-"); // PDF magic bytes
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void hardwareReport_returnsPdf() throws Exception {
        hwRepo.deleteAll();
        hwRepo.save(Hardware.builder().assetTag("HW-PDF").name("PDF Test")
                .status(Hardware.HardwareStatus.AVAILABLE).build());

        byte[] pdf = mockMvc.perform(get("/api/v1/reports/hardware"))
            .andExpect(status().isOk())
            .andExpect(content().contentType("application/pdf"))
            .andReturn().getResponse().getContentAsByteArray();

        assertThat(new String(pdf, 0, 5)).isEqualTo("%PDF-");
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void licenseReport_returnsPdf() throws Exception {
        swRepo.deleteAll();
        swRepo.save(Software.builder().name("PDF SW").vendor("Test").totalLicenses(10).build());

        byte[] pdf = mockMvc.perform(get("/api/v1/reports/licenses"))
            .andExpect(status().isOk())
            .andExpect(content().contentType("application/pdf"))
            .andReturn().getResponse().getContentAsByteArray();

        assertThat(new String(pdf, 0, 5)).isEqualTo("%PDF-");
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void employeeReport_emptyDb_stillReturnsPdf() throws Exception {
        empRepo.deleteAll();

        byte[] pdf = mockMvc.perform(get("/api/v1/reports/employees"))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsByteArray();

        assertThat(new String(pdf, 0, 5)).isEqualTo("%PDF-");
    }
}
