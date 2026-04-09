package com.employeemanagement.controller;

import com.employeemanagement.model.Employee;
import com.employeemanagement.model.Software;
import com.employeemanagement.repository.EmployeeRepository;
import com.employeemanagement.repository.SoftwareAssignmentRepository;
import com.employeemanagement.repository.SoftwareRepository;
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
    @Autowired ObjectMapper objectMapper;
    @Autowired SoftwareRepository swRepo;
    @Autowired EmployeeRepository empRepo;
    @Autowired SoftwareAssignmentRepository assignRepo;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(wac)
                .apply(springSecurity()).build();
        assignRepo.deleteAll();
        swRepo.deleteAll();
        empRepo.deleteAll();
    }

    // ── CREATE + DEFAULTS ────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void createSoftware_verifyDbDefaults() throws Exception {
        mockMvc.perform(post("/api/v1/software")
                .contentType(APPLICATION_JSON)
                .content("{\"name\":\"IntelliJ\",\"vendor\":\"JetBrains\",\"totalLicenses\":15}"))
            .andExpect(status().isCreated());

        Software sw = swRepo.findAll().getFirst();
        assertThat(sw.getName()).isEqualTo("IntelliJ");
        assertThat(sw.getUsedLicenses()).isZero();
        assertThat(sw.getTotalLicenses()).isEqualTo(15);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createSoftware_missingName_400_nothingInDb() throws Exception {
        mockMvc.perform(post("/api/v1/software")
                .contentType(APPLICATION_JSON).content("{\"vendor\":\"Test\"}"))
            .andExpect(status().isBadRequest());

        assertThat(swRepo.count()).isZero();
    }

    // ── READ ─────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "VIEWER")
    void getAllSoftware_paginatedCorrectly() throws Exception {
        swRepo.save(Software.builder().name("A").totalLicenses(5).build());
        swRepo.save(Software.builder().name("B").totalLicenses(10).build());

        mockMvc.perform(get("/api/v1/software"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(2));
    }

    // ── UPDATE ───────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateSoftware_verifyDbState() throws Exception {
        Software sw = swRepo.save(Software.builder().name("Alt").vendor("V1").totalLicenses(5).build());

        mockMvc.perform(put("/api/v1/software/" + sw.getId())
                .contentType(APPLICATION_JSON)
                .content("{\"name\":\"Neu\",\"vendor\":\"V2\",\"totalLicenses\":20}"))
            .andExpect(status().isOk());

        Software updated = swRepo.findById(sw.getId()).orElseThrow();
        assertThat(updated.getName()).isEqualTo("Neu");
        assertThat(updated.getVendor()).isEqualTo("V2");
        assertThat(updated.getTotalLicenses()).isEqualTo(20);
    }

    // ── DELETE ───────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteSoftware_verifyGoneFromDb() throws Exception {
        Software sw = swRepo.save(Software.builder().name("Del").totalLicenses(1).build());

        mockMvc.perform(delete("/api/v1/software/" + sw.getId()))
            .andExpect(status().isNoContent());

        assertThat(swRepo.findById(sw.getId())).isEmpty();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteSoftware_withUsedLicenses_409_stillInDb() throws Exception {
        Software sw = swRepo.save(Software.builder().name("InUse").totalLicenses(5).usedLicenses(2).build());

        mockMvc.perform(delete("/api/v1/software/" + sw.getId()))
            .andExpect(status().isConflict());

        assertThat(swRepo.findById(sw.getId())).isPresent();
    }

    // ── LICENSE LIFECYCLE: Assign → Revoke → Reassign → Delete ─

    @Test
    @WithMockUser(roles = "ADMIN")
    void fullLifecycle_assign_revoke_reassign_delete() throws Exception {
        Software sw = swRepo.save(Software.builder().name("Lifecycle SW").totalLicenses(2).build());
        Employee emp = empRepo.save(Employee.builder()
            .employeeNumber("EMP-SW").firstName("SW").lastName("Test")
            .email("sw@test.de").hireDate(LocalDate.now()).build());

        // 1. Assign license
        mockMvc.perform(post("/api/v1/software/" + sw.getId() + "/assign/" + emp.getId()))
            .andExpect(status().isNoContent());

        Software afterAssign = swRepo.findById(sw.getId()).orElseThrow();
        assertThat(afterAssign.getUsedLicenses()).isEqualTo(1);

        // 2. Cannot assign again (duplicate)
        mockMvc.perform(post("/api/v1/software/" + sw.getId() + "/assign/" + emp.getId()))
            .andExpect(status().isConflict());

        assertThat(swRepo.findById(sw.getId()).get().getUsedLicenses()).isEqualTo(1);

        // 3. Revoke license
        mockMvc.perform(post("/api/v1/software/" + sw.getId() + "/revoke/" + emp.getId()))
            .andExpect(status().isNoContent());

        assertThat(swRepo.findById(sw.getId()).get().getUsedLicenses()).isZero();

        // 4. Reassign (should work after revoke)
        mockMvc.perform(post("/api/v1/software/" + sw.getId() + "/assign/" + emp.getId()))
            .andExpect(status().isNoContent());

        assertThat(swRepo.findById(sw.getId()).get().getUsedLicenses()).isEqualTo(1);

        // 5. Cannot delete with active licenses
        mockMvc.perform(delete("/api/v1/software/" + sw.getId()))
            .andExpect(status().isConflict());

        // 6. Revoke and then delete
        mockMvc.perform(post("/api/v1/software/" + sw.getId() + "/revoke/" + emp.getId()))
            .andExpect(status().isNoContent());
        mockMvc.perform(delete("/api/v1/software/" + sw.getId()))
            .andExpect(status().isNoContent());

        assertThat(swRepo.findById(sw.getId())).isEmpty();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void assignLicense_noCapacity_409() throws Exception {
        Software sw = swRepo.save(Software.builder().name("Full").totalLicenses(1).usedLicenses(1).build());
        Employee emp = empRepo.save(Employee.builder()
            .employeeNumber("EMP-FULL").firstName("F").lastName("U")
            .email("full@test.de").hireDate(LocalDate.now()).build());

        mockMvc.perform(post("/api/v1/software/" + sw.getId() + "/assign/" + emp.getId()))
            .andExpect(status().isConflict());

        assertThat(swRepo.findById(sw.getId()).get().getUsedLicenses()).isEqualTo(1);
    }
}
