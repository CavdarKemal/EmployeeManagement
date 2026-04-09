package com.employeemanagement.controller;

import com.employeemanagement.model.Employee;
import com.employeemanagement.model.Hardware;
import com.employeemanagement.model.Loan;
import com.employeemanagement.repository.EmployeeRepository;
import com.employeemanagement.repository.HardwareRepository;
import com.employeemanagement.repository.LoanRepository;
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
import java.time.LocalDateTime;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Testcontainers
class LoanControllerIT {

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
    @Autowired LoanRepository loanRepo;

    private MockMvc mockMvc;
    private Employee testEmp;
    private Hardware testHw;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(wac)
                .apply(springSecurity())
                .build();
        loanRepo.deleteAll();
        hwRepo.deleteAll();
        empRepo.deleteAll();

        testEmp = empRepo.save(Employee.builder()
                .employeeNumber("EMP-LOAN-001").firstName("Test").lastName("Loan")
                .email("loan@test.de").hireDate(LocalDate.now()).build());
        testHw = hwRepo.save(Hardware.builder()
                .assetTag("HW-LOAN-001").name("Test Laptop")
                .status(Hardware.HardwareStatus.AVAILABLE).build());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void loanHardware_200() throws Exception {
        String body = String.format("""
            {"employeeId": %d}
            """, testEmp.getId());

        mockMvc.perform(post("/api/v1/loans/hardware/" + testHw.getId() + "/loan")
                .contentType(APPLICATION_JSON).content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.hardwareName").value("Test Laptop"))
            .andExpect(jsonPath("$.employeeName").value("Test Loan"))
            .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void returnHardware_200() throws Exception {
        // Erst ausleihen
        loanRepo.save(Loan.builder().employee(testEmp).hardware(testHw).build());
        testHw.setStatus(Hardware.HardwareStatus.LOANED);
        hwRepo.save(testHw);

        mockMvc.perform(post("/api/v1/loans/hardware/" + testHw.getId() + "/return"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.active").value(false));
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void getActiveLoans_200() throws Exception {
        loanRepo.save(Loan.builder().employee(testEmp).hardware(testHw).build());

        mockMvc.perform(get("/api/v1/loans/employees/" + testEmp.getId() + "/active"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].hardwareName").value("Test Laptop"));
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void getLoanHistory_200() throws Exception {
        // Abgeschlossene Ausleihe
        loanRepo.save(Loan.builder().employee(testEmp).hardware(testHw)
                .loanDate(LocalDate.of(2024, 1, 1))
                .returnedAt(LocalDateTime.of(2024, 3, 1, 10, 0))
                .build());

        mockMvc.perform(get("/api/v1/loans/employees/" + testEmp.getId() + "/history"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].active").value(false));
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void getActiveLoans_empty_200() throws Exception {
        mockMvc.perform(get("/api/v1/loans/employees/" + testEmp.getId() + "/active"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$").isEmpty());
    }
}
