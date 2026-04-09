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

import static org.assertj.core.api.Assertions.assertThat;
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

    // ── CREATE ───────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void createEmployee_201_andVerifyDbState() throws Exception {
        String body = """
            {
              "employeeNumber": "EMP-001",
              "firstName": "Hans",
              "lastName": "Test",
              "email": "hans@test.de",
              "hireDate": "2024-01-01",
              "position": "Tester",
              "department": "QA"
            }
            """;

        String response = mockMvc.perform(post("/api/v1/employees")
                .contentType(APPLICATION_JSON).content(body))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();

        // DB-Verifikation
        var all = repo.findAll();
        assertThat(all).hasSize(1);
        Employee saved = all.getFirst();
        assertThat(saved.getEmail()).isEqualTo("hans@test.de");
        assertThat(saved.getEmployeeNumber()).isEqualTo("EMP-001");
        assertThat(saved.getDepartment()).isEqualTo("QA");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createEmployee_defaultValues_activeTrue_countryDeutschland() throws Exception {
        String body = """
            {
              "employeeNumber": "EMP-DEF",
              "firstName": "Default",
              "lastName": "Test",
              "email": "default@test.de",
              "hireDate": "2024-01-01"
            }
            """;

        mockMvc.perform(post("/api/v1/employees")
                .contentType(APPLICATION_JSON).content(body))
            .andExpect(status().isCreated());

        Employee saved = repo.findByEmail("default@test.de").orElseThrow();
        assertThat(saved.isActive()).isTrue();
        assertThat(saved.getCountry()).isEqualTo("Deutschland");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createEmployee_withAddress_verifyAllFieldsInDb() throws Exception {
        String body = """
            {
              "employeeNumber": "EMP-ADDR",
              "firstName": "Anna",
              "lastName": "Adresse",
              "email": "anna@test.de",
              "hireDate": "2024-06-01",
              "street": "Berliner Str. 42",
              "zipCode": "10115",
              "city": "Berlin",
              "country": "Österreich",
              "salary": 75000
            }
            """;

        mockMvc.perform(post("/api/v1/employees")
                .contentType(APPLICATION_JSON).content(body))
            .andExpect(status().isCreated());

        Employee saved = repo.findByEmail("anna@test.de").orElseThrow();
        assertThat(saved.getStreet()).isEqualTo("Berliner Str. 42");
        assertThat(saved.getZipCode()).isEqualTo("10115");
        assertThat(saved.getCity()).isEqualTo("Berlin");
        assertThat(saved.getCountry()).isEqualTo("Österreich");
        assertThat(saved.getSalary()).isEqualByComparingTo("75000");
    }

    @Test
    @WithMockUser(roles = "HR")
    void createEmployee_duplicateEmail_409() throws Exception {
        repo.save(Employee.builder()
            .employeeNumber("EMP-001").firstName("A").lastName("B")
            .email("dup@test.de").hireDate(LocalDate.now()).build());

        String body = """
            {"employeeNumber":"EMP-002","firstName":"C","lastName":"D",
             "email":"dup@test.de","hireDate":"2024-01-01"}
            """;
        mockMvc.perform(post("/api/v1/employees")
                .contentType(APPLICATION_JSON).content(body))
            .andExpect(status().isConflict());

        // DB hat weiterhin nur 1 Mitarbeiter
        assertThat(repo.count()).isEqualTo(1);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createEmployee_duplicateNumber_409() throws Exception {
        repo.save(Employee.builder()
            .employeeNumber("EMP-DUP").firstName("A").lastName("B")
            .email("a@test.de").hireDate(LocalDate.now()).build());

        String body = """
            {"employeeNumber":"EMP-DUP","firstName":"C","lastName":"D",
             "email":"c@test.de","hireDate":"2024-01-01"}
            """;
        mockMvc.perform(post("/api/v1/employees")
                .contentType(APPLICATION_JSON).content(body))
            .andExpect(status().isConflict());

        assertThat(repo.count()).isEqualTo(1);
    }

    // ── READ ─────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "VIEWER")
    void getEmployees_returnsList() throws Exception {
        repo.save(Employee.builder().employeeNumber("EMP-1").firstName("A").lastName("B").email("a@t.de").hireDate(LocalDate.now()).build());
        repo.save(Employee.builder().employeeNumber("EMP-2").firstName("C").lastName("D").email("c@t.de").hireDate(LocalDate.now()).build());

        mockMvc.perform(get("/api/v1/employees?size=10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(2))
            .andExpect(jsonPath("$.content[0].firstName").exists());
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void getEmployee_notFound_404() throws Exception {
        mockMvc.perform(get("/api/v1/employees/999"))
            .andExpect(status().isNotFound());
    }

    // ── UPDATE ───────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateEmployee_verifyDbState() throws Exception {
        Employee emp = repo.save(Employee.builder()
            .employeeNumber("EMP-UPD").firstName("Alt").lastName("Name")
            .email("upd@test.de").hireDate(LocalDate.now()).department("IT").build());

        // Update via multipart PUT
        mockMvc.perform(multipart("/api/v1/employees/" + emp.getId())
                .file(new org.springframework.mock.web.MockMultipartFile(
                    "employee", "", "application/json",
                    """
                    {"employeeNumber":"EMP-UPD","firstName":"Neu","lastName":"Name",
                     "email":"upd@test.de","hireDate":"2024-01-01","department":"Engineering",
                     "street":"Neue Str. 1","city":"München","active":true}
                    """.getBytes()))
                .with(request -> { request.setMethod("PUT"); return request; }))
            .andExpect(status().isOk());

        // DB-Verifikation
        Employee updated = repo.findById(emp.getId()).orElseThrow();
        assertThat(updated.getFirstName()).isEqualTo("Neu");
        assertThat(updated.getDepartment()).isEqualTo("Engineering");
        assertThat(updated.getStreet()).isEqualTo("Neue Str. 1");
        assertThat(updated.getCity()).isEqualTo("München");
    }

    // ── DELETE ───────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void deactivateEmployee_verifyDbState() throws Exception {
        Employee emp = repo.save(Employee.builder()
            .employeeNumber("EMP-DEL").firstName("Del").lastName("Test")
            .email("del@test.de").hireDate(LocalDate.now()).build());

        assertThat(emp.isActive()).isTrue();

        mockMvc.perform(delete("/api/v1/employees/" + emp.getId()))
            .andExpect(status().isNoContent());

        // DB-Verifikation: Mitarbeiter ist deaktiviert, nicht gelöscht
        Employee deactivated = repo.findById(emp.getId()).orElseThrow();
        assertThat(deactivated.isActive()).isFalse();
    }

    // ── FULL LIFECYCLE ───────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void fullLifecycle_create_read_update_deactivate() throws Exception {
        // 1. Create
        String createBody = """
            {"employeeNumber":"EMP-LIFE","firstName":"Life","lastName":"Cycle",
             "email":"life@test.de","hireDate":"2024-01-01","department":"IT","salary":60000}
            """;
        String createResponse = mockMvc.perform(post("/api/v1/employees")
                .contentType(APPLICATION_JSON).content(createBody))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();

        Long id = objectMapper.readTree(createResponse).get("id").asLong();

        // 2. Read
        mockMvc.perform(get("/api/v1/employees/" + id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.firstName").value("Life"))
            .andExpect(jsonPath("$.active").value(true));

        // 3. Verify in DB
        Employee inDb = repo.findById(id).orElseThrow();
        assertThat(inDb.isActive()).isTrue();
        assertThat(inDb.getSalary()).isEqualByComparingTo("60000");

        // 4. Deactivate
        mockMvc.perform(delete("/api/v1/employees/" + id))
            .andExpect(status().isNoContent());

        // 5. Verify deactivated in DB
        Employee deactivated = repo.findById(id).orElseThrow();
        assertThat(deactivated.isActive()).isFalse();
    }

    // ── VALIDATION ───────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void createEmployee_missingRequiredFields_400() throws Exception {
        mockMvc.perform(post("/api/v1/employees")
                .contentType(APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest());

        assertThat(repo.count()).isZero();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createEmployee_invalidEmail_400() throws Exception {
        String body = """
            {"employeeNumber":"EMP-INV","firstName":"A","lastName":"B",
             "email":"keine-email","hireDate":"2024-01-01"}
            """;
        mockMvc.perform(post("/api/v1/employees")
                .contentType(APPLICATION_JSON).content(body))
            .andExpect(status().isBadRequest());

        assertThat(repo.count()).isZero();
    }

    // ── SECURITY ─────────────────────────────────────────────

    @Test
    void createEmployee_unauthenticated_401or403() throws Exception {
        mockMvc.perform(post("/api/v1/employees")
                .contentType(APPLICATION_JSON).content("{}"))
            .andExpect(status().isForbidden());
    }
}
