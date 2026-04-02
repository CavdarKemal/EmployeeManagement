package com.employeemanagement.controller;

import com.employeemanagement.model.Employee;
import com.employeemanagement.repository.EmployeeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
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

    @Autowired WebApplicationContext wac;
    @Autowired ObjectMapper objectMapper;
    @Autowired EmployeeRepository repo;

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
        Employee emp = Employee.builder()
            .employeeNumber("EMP-001").firstName("A").lastName("B")
            .email("dup@test.de").hireDate(LocalDate.now()).build();
        repo.save(emp);

        String body = """
            {"employeeNumber":"EMP-002","firstName":"C","lastName":"D",
             "email":"dup@test.de","hireDate":"2024-01-01"}
            """;
        mockMvc.perform(post("/api/v1/employees")
                .contentType(APPLICATION_JSON).content(body))
            .andExpect(status().isConflict());
    }
}
