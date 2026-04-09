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

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
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
        hwRepo.deleteAll();
        empRepo.deleteAll();
        swRepo.deleteAll();
    }

    // ── EMPLOYEE IMPORT ──────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void importEmployees_verifyDbState() throws Exception {
        String csv = "\uFEFF\"Nr.\";\"Vorname\";\"Nachname\";\"E-Mail\";\"Eingestellt\";\"Abteilung\";\"Gehalt\"\r\n" +
                     "\"EMP-IMP-1\";\"Lisa\";\"Schmidt\";\"lisa@import.de\";\"2024-06-01\";\"Engineering\";\"80000\"\r\n" +
                     "\"EMP-IMP-2\";\"Tom\";\"Fischer\";\"tom@import.de\";\"2024-07-15\";\"Design\";\"65000\"\r\n";

        mockMvc.perform(multipart("/api/v1/import/employees")
                .file(new MockMultipartFile("file", "emp.csv", "text/csv", csv.getBytes())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.imported").value(2))
            .andExpect(jsonPath("$.skipped").value(0));

        // DB-Verifikation: beide Mitarbeiter existieren mit korrekten Daten
        assertThat(empRepo.count()).isEqualTo(2);

        Employee lisa = empRepo.findByEmail("lisa@import.de").orElseThrow();
        assertThat(lisa.getFirstName()).isEqualTo("Lisa");
        assertThat(lisa.getLastName()).isEqualTo("Schmidt");
        assertThat(lisa.getEmployeeNumber()).isEqualTo("EMP-IMP-1");
        assertThat(lisa.getDepartment()).isEqualTo("Engineering");
        assertThat(lisa.getSalary()).isEqualByComparingTo("80000");
        assertThat(lisa.getHireDate()).isEqualTo(LocalDate.of(2024, 6, 1));
        assertThat(lisa.isActive()).isTrue();

        Employee tom = empRepo.findByEmail("tom@import.de").orElseThrow();
        assertThat(tom.getDepartment()).isEqualTo("Design");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void importEmployees_existingUpdated() throws Exception {
        empRepo.save(Employee.builder()
            .employeeNumber("EMP-EXIST").firstName("Alt").lastName("Name")
            .email("exists@import.de").hireDate(LocalDate.now()).department("IT").build());

        String csv = "\"Nr.\";\"Vorname\";\"Nachname\";\"E-Mail\";\"Eingestellt\";\"Abteilung\"\r\n" +
                     "\"EMP-NEW\";\"New\";\"User\";\"new@import.de\";\"2024-01-01\";\"Design\"\r\n" +
                     "\"EMP-EXIST\";\"Neu\";\"Name\";\"exists@import.de\";\"2024-01-01\";\"Engineering\"\r\n";

        mockMvc.perform(multipart("/api/v1/import/employees")
                .file(new MockMultipartFile("file", "emp.csv", "text/csv", csv.getBytes())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.imported").value(2));

        assertThat(empRepo.count()).isEqualTo(2);
        // Existing employee was UPDATED
        Employee updated = empRepo.findByEmail("exists@import.de").orElseThrow();
        assertThat(updated.getFirstName()).isEqualTo("Neu");
        assertThat(updated.getDepartment()).isEqualTo("Engineering");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void importEmployees_reactivatesDeactivated() throws Exception {
        // Deaktivierten Mitarbeiter anlegen
        Employee deactivated = empRepo.save(Employee.builder()
            .employeeNumber("EMP-DEA").firstName("Deaktiviert").lastName("User")
            .email("deactivated@import.de").hireDate(LocalDate.now()).active(false).build());
        assertThat(deactivated.isActive()).isFalse();

        String csv = "\"Nr.\";\"Vorname\";\"Nachname\";\"E-Mail\";\"Eingestellt\"\r\n" +
                     "\"EMP-DEA\";\"Reaktiviert\";\"User\";\"deactivated@import.de\";\"2024-06-01\"\r\n";

        mockMvc.perform(multipart("/api/v1/import/employees")
                .file(new MockMultipartFile("file", "emp.csv", "text/csv", csv.getBytes())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.imported").value(1));

        // DB: Mitarbeiter ist jetzt aktiv und aktualisiert
        Employee reactivated = empRepo.findByEmail("deactivated@import.de").orElseThrow();
        assertThat(reactivated.isActive()).isTrue();
        assertThat(reactivated.getFirstName()).isEqualTo("Reaktiviert");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void importEmployees_emptyFile_returnsError() throws Exception {
        mockMvc.perform(multipart("/api/v1/import/employees")
                .file(new MockMultipartFile("file", "empty.csv", "text/csv", "".getBytes())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.imported").value(0))
            .andExpect(jsonPath("$.errors[0]").value("Leere Datei"));

        assertThat(empRepo.count()).isZero();
    }

    // ── HARDWARE IMPORT ──────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void importHardware_verifyDbState_defaultStatusAvailable() throws Exception {
        String csv = "\"Asset-Tag\";\"Name\";\"Kategorie\";\"Hersteller\"\r\n" +
                     "\"HW-IMP-1\";\"Import Laptop\";\"LAPTOP\";\"Lenovo\"\r\n";

        mockMvc.perform(multipart("/api/v1/import/hardware")
                .file(new MockMultipartFile("file", "hw.csv", "text/csv", csv.getBytes())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.imported").value(1));

        Hardware hw = hwRepo.findByAssetTag("HW-IMP-1").orElseThrow();
        assertThat(hw.getName()).isEqualTo("Import Laptop");
        assertThat(hw.getCategory()).isEqualTo("LAPTOP");
        assertThat(hw.getManufacturer()).isEqualTo("Lenovo");
        assertThat(hw.getStatus()).isEqualTo(Hardware.HardwareStatus.AVAILABLE);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void importHardware_existingUpdated() throws Exception {
        hwRepo.save(Hardware.builder().assetTag("HW-IMP-UPD").name("Alt").manufacturer("Dell")
                .status(Hardware.HardwareStatus.AVAILABLE).build());

        String csv = "\"Asset-Tag\";\"Name\";\"Hersteller\";\"Notizen\"\r\n" +
                     "\"HW-IMP-UPD\";\"Neu\";\"Lenovo\";\"Aktualisiert via Import\"\r\n";

        mockMvc.perform(multipart("/api/v1/import/hardware")
                .file(new MockMultipartFile("file", "hw.csv", "text/csv", csv.getBytes())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.imported").value(1));

        Hardware updated = hwRepo.findByAssetTag("HW-IMP-UPD").orElseThrow();
        assertThat(updated.getName()).isEqualTo("Neu");
        assertThat(updated.getManufacturer()).isEqualTo("Lenovo");
        assertThat(updated.getNotes()).isEqualTo("Aktualisiert via Import");
        assertThat(hwRepo.count()).isEqualTo(1); // kein Duplikat
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void importHardware_withExplicitStatus() throws Exception {
        String csv = "\"Asset-Tag\";\"Name\";\"Status\"\r\n" +
                     "\"HW-IMP-M\";\"Wartung Laptop\";\"MAINTENANCE\"\r\n";

        mockMvc.perform(multipart("/api/v1/import/hardware")
                .file(new MockMultipartFile("file", "hw.csv", "text/csv", csv.getBytes())))
            .andExpect(status().isOk());

        assertThat(hwRepo.findByAssetTag("HW-IMP-M").get().getStatus())
            .isEqualTo(Hardware.HardwareStatus.MAINTENANCE);
    }

    // ── SOFTWARE IMPORT ──────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void importSoftware_verifyDbState() throws Exception {
        String csv = "\"Name\";\"Hersteller\";\"Lizenzen gesamt\";\"Kosten/Lizenz\"\r\n" +
                     "\"Test SW\";\"Vendor\";\"25\";\"19.90\"\r\n";

        mockMvc.perform(multipart("/api/v1/import/software")
                .file(new MockMultipartFile("file", "sw.csv", "text/csv", csv.getBytes())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.imported").value(1));

        Software sw = swRepo.findAll().getFirst();
        assertThat(sw.getName()).isEqualTo("Test SW");
        assertThat(sw.getVendor()).isEqualTo("Vendor");
        assertThat(sw.getTotalLicenses()).isEqualTo(25);
        assertThat(sw.getUsedLicenses()).isZero();
        assertThat(sw.getCostPerLicense()).isEqualByComparingTo("19.90");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void importSoftware_existingUpdated() throws Exception {
        swRepo.save(Software.builder().name("Alt SW").vendor("OldVendor").totalLicenses(5).build());

        String csv = "\"Name\";\"Hersteller\";\"Lizenzen gesamt\";\"Kosten/Lizenz\"\r\n" +
                     "\"Alt SW\";\"NewVendor\";\"25\";\"29.90\"\r\n";

        mockMvc.perform(multipart("/api/v1/import/software")
                .file(new MockMultipartFile("file", "sw.csv", "text/csv", csv.getBytes())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.imported").value(1));

        var all = swRepo.findAll();
        assertThat(all).hasSize(1); // kein Duplikat
        Software updated = all.getFirst();
        assertThat(updated.getVendor()).isEqualTo("NewVendor");
        assertThat(updated.getTotalLicenses()).isEqualTo(25);
        assertThat(updated.getCostPerLicense()).isEqualByComparingTo("29.90");
    }

    // ── SECURITY ─────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "VIEWER")
    void importEmployees_forbidden_403() throws Exception {
        mockMvc.perform(multipart("/api/v1/import/employees")
                .file(new MockMultipartFile("file", "emp.csv", "text/csv", "test".getBytes())))
            .andExpect(status().isForbidden());
    }
}
