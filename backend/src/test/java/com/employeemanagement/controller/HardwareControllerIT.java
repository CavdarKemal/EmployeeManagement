package com.employeemanagement.controller;

import com.employeemanagement.model.Employee;
import com.employeemanagement.model.Hardware;
import com.employeemanagement.repository.EmployeeRepository;
import com.employeemanagement.repository.HardwareRepository;
import com.employeemanagement.repository.LoanRepository;
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
    @Autowired ObjectMapper objectMapper;
    @Autowired HardwareRepository hwRepo;
    @Autowired EmployeeRepository empRepo;
    @Autowired LoanRepository loanRepo;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(wac)
                .apply(springSecurity())
                .build();
        loanRepo.deleteAll();
        hwRepo.deleteAll();
        empRepo.deleteAll();
    }

    // ── CREATE + DEFAULT VALUES ──────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void createHardware_defaultStatus_AVAILABLE() throws Exception {
        String body = """
            {"assetTag":"HW-DEF","name":"Default Test"}
            """;

        mockMvc.perform(post("/api/v1/hardware")
                .contentType(APPLICATION_JSON).content(body))
            .andExpect(status().isCreated());

        Hardware saved = hwRepo.findByAssetTag("HW-DEF").orElseThrow();
        assertThat(saved.getStatus()).isEqualTo(Hardware.HardwareStatus.AVAILABLE);
        assertThat(saved.getName()).isEqualTo("Default Test");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createHardware_withAllFields_verifyDb() throws Exception {
        String body = """
            {
              "assetTag": "HW-FULL",
              "name": "MacBook Pro 16",
              "category": "LAPTOP",
              "manufacturer": "Apple",
              "model": "MK183D/A",
              "serialNumber": "C02XY12345",
              "status": "AVAILABLE",
              "purchasePrice": 2899,
              "warrantyUntil": "2026-06-01",
              "notes": "Kratzer am Gehäuse"
            }
            """;

        mockMvc.perform(post("/api/v1/hardware")
                .contentType(APPLICATION_JSON).content(body))
            .andExpect(status().isCreated());

        Hardware saved = hwRepo.findByAssetTag("HW-FULL").orElseThrow();
        assertThat(saved.getManufacturer()).isEqualTo("Apple");
        assertThat(saved.getSerialNumber()).isEqualTo("C02XY12345");
        assertThat(saved.getPurchasePrice()).isEqualByComparingTo("2899");
        assertThat(saved.getNotes()).isEqualTo("Kratzer am Gehäuse");
        assertThat(saved.getWarrantyUntil()).isEqualTo(LocalDate.of(2026, 6, 1));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createHardware_duplicateAssetTag_409_nothingInDb() throws Exception {
        hwRepo.save(Hardware.builder().assetTag("HW-DUP").name("Existing").status(Hardware.HardwareStatus.AVAILABLE).build());

        mockMvc.perform(post("/api/v1/hardware")
                .contentType(APPLICATION_JSON).content("{\"assetTag\":\"HW-DUP\",\"name\":\"New\"}"))
            .andExpect(status().isConflict());

        assertThat(hwRepo.count()).isEqualTo(1);
        assertThat(hwRepo.findByAssetTag("HW-DUP").get().getName()).isEqualTo("Existing");
    }

    // ── READ ─────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "VIEWER")
    void getAllHardware_returnsPaginated() throws Exception {
        hwRepo.save(Hardware.builder().assetTag("HW-A").name("A").status(Hardware.HardwareStatus.AVAILABLE).build());
        hwRepo.save(Hardware.builder().assetTag("HW-B").name("B").status(Hardware.HardwareStatus.LOANED).build());

        mockMvc.perform(get("/api/v1/hardware"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void getHardware_notFound_404() throws Exception {
        mockMvc.perform(get("/api/v1/hardware/999"))
            .andExpect(status().isNotFound());
    }

    // ── UPDATE ───────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateHardware_verifyDbState() throws Exception {
        Hardware hw = hwRepo.save(Hardware.builder().assetTag("HW-UPD").name("Alt").status(Hardware.HardwareStatus.AVAILABLE).build());

        mockMvc.perform(put("/api/v1/hardware/" + hw.getId())
                .contentType(APPLICATION_JSON)
                .content("{\"assetTag\":\"HW-UPD\",\"name\":\"Neu\",\"status\":\"MAINTENANCE\",\"notes\":\"Zur Wartung\"}"))
            .andExpect(status().isOk());

        Hardware updated = hwRepo.findById(hw.getId()).orElseThrow();
        assertThat(updated.getName()).isEqualTo("Neu");
        assertThat(updated.getStatus()).isEqualTo(Hardware.HardwareStatus.MAINTENANCE);
        assertThat(updated.getNotes()).isEqualTo("Zur Wartung");
    }

    // ── DELETE ───────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteHardware_verifyGoneFromDb() throws Exception {
        Hardware hw = hwRepo.save(Hardware.builder().assetTag("HW-DEL").name("Del").status(Hardware.HardwareStatus.AVAILABLE).build());

        mockMvc.perform(delete("/api/v1/hardware/" + hw.getId()))
            .andExpect(status().isNoContent());

        assertThat(hwRepo.findById(hw.getId())).isEmpty();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteHardware_loaned_409_stillInDb() throws Exception {
        Hardware hw = hwRepo.save(Hardware.builder().assetTag("HW-LOAN").name("Loaned").status(Hardware.HardwareStatus.LOANED).build());

        mockMvc.perform(delete("/api/v1/hardware/" + hw.getId()))
            .andExpect(status().isConflict());

        assertThat(hwRepo.findById(hw.getId())).isPresent();
    }

    // ── FULL LIFECYCLE: Create → Loan → Return → Delete ─────

    @Test
    @WithMockUser(roles = "ADMIN")
    void fullLifecycle_create_loan_return_delete() throws Exception {
        // 1. Create hardware
        String hwResponse = mockMvc.perform(post("/api/v1/hardware")
                .contentType(APPLICATION_JSON)
                .content("{\"assetTag\":\"HW-LIFE\",\"name\":\"Lifecycle Test\"}"))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        Long hwId = objectMapper.readTree(hwResponse).get("id").asLong();

        // Verify AVAILABLE in DB
        assertThat(hwRepo.findById(hwId).orElseThrow().getStatus()).isEqualTo(Hardware.HardwareStatus.AVAILABLE);

        // 2. Create employee for loan
        Employee emp = empRepo.save(Employee.builder()
            .employeeNumber("EMP-LIFE").firstName("Life").lastName("Test")
            .email("life@test.de").hireDate(LocalDate.now()).build());

        // 3. Loan hardware
        mockMvc.perform(post("/api/v1/loans/hardware/" + hwId + "/loan")
                .contentType(APPLICATION_JSON)
                .content("{\"employeeId\":" + emp.getId() + "}"))
            .andExpect(status().isOk());

        // Verify LOANED in DB
        assertThat(hwRepo.findById(hwId).orElseThrow().getStatus()).isEqualTo(Hardware.HardwareStatus.LOANED);

        // 4. Cannot delete while loaned
        mockMvc.perform(delete("/api/v1/hardware/" + hwId))
            .andExpect(status().isConflict());

        // 5. Return hardware
        mockMvc.perform(post("/api/v1/loans/hardware/" + hwId + "/return"))
            .andExpect(status().isOk());

        // Verify AVAILABLE again in DB
        assertThat(hwRepo.findById(hwId).orElseThrow().getStatus()).isEqualTo(Hardware.HardwareStatus.AVAILABLE);

        // 6. Now delete works
        mockMvc.perform(delete("/api/v1/hardware/" + hwId))
            .andExpect(status().isNoContent());

        assertThat(hwRepo.findById(hwId)).isEmpty();
    }

    // ── VALIDATION ───────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void createHardware_missingAssetTag_400() throws Exception {
        mockMvc.perform(post("/api/v1/hardware")
                .contentType(APPLICATION_JSON).content("{\"name\":\"No Tag\"}"))
            .andExpect(status().isBadRequest());

        assertThat(hwRepo.count()).isZero();
    }
}
