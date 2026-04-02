package com.employeemanagement.controller;

import com.employeemanagement.model.Employee;
import com.employeemanagement.repository.EmployeeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;

import static org.springframework.boot.test.context.SpringBootTest.WebEnvironment.RANDOM_PORT;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
class EmployeeControllerIT {

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

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired EmployeeRepository repo;

    @BeforeEach void clean() { repo.deleteAll(); }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createEmployee_201() throws Exception {
        String body = """
            {
              "employeeNumber": "EMP-TEST-001",
              "firstName": "Hans",
              "lastName": "Test",
              "email": "hans@test.de",
              "hireDate": "2024-01-01",
              "position": "Tester",
              "department": "QA"
            }
            """;

        mockMvc.perform(post("/api/v1/employees")
                .contentType(APPLICATION_JSON).content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.email").value("hans@test.de"))
            .andExpect(jsonPath("$.employeeNumber").value("EMP-TEST-001"));
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void getEmployee_notFound_404() throws Exception {
        mockMvc.perform(get("/api/v1/employees/999"))
            .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "HR")
    void createEmployee_duplicateEmail_409() throws Exception {
        // Ersten Mitarbeiter anlegen
        Employee emp = Employee.builder()
            .employeeNumber("EMP-001").firstName("A").lastName("B")
            .email("dup@test.de").hireDate(LocalDate.now()).build();
        repo.save(emp);

        // Gleiche E-Mail erneut → 409
        String body = """
            {"employeeNumber":"EMP-002","firstName":"C","lastName":"D",
             "email":"dup@test.de","hireDate":"2024-01-01"}
            """;
        mockMvc.perform(post("/api/v1/employees")
                .contentType(APPLICATION_JSON).content(body))
            .andExpect(status().isConflict());
    }
}
