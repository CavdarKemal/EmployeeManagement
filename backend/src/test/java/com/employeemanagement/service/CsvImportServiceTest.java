package com.employeemanagement.service;

import com.employeemanagement.dto.ImportResultDTO;
import com.employeemanagement.repository.EmployeeRepository;
import com.employeemanagement.repository.HardwareRepository;
import com.employeemanagement.repository.SoftwareRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CsvImportServiceTest {

    @Mock EmployeeRepository employeeRepo;
    @Mock HardwareRepository hardwareRepo;
    @Mock SoftwareRepository softwareRepo;
    @InjectMocks CsvImportService service;

    @Test
    @DisplayName("importEmployees – gültige CSV wird importiert")
    void importEmployees_success() {
        String csv = "\uFEFF\"Nr.\";\"Vorname\";\"Nachname\";\"E-Mail\";\"Eingestellt\"\r\n" +
                     "\"EMP-IMP-1\";\"Anna\";\"Test\";\"anna@import.de\";\"2024-01-01\"\r\n";
        MockMultipartFile file = new MockMultipartFile("file", "test.csv", "text/csv", csv.getBytes());

        when(employeeRepo.findByEmail("anna@import.de")).thenReturn(java.util.Optional.empty());
        when(employeeRepo.existsByEmployeeNumber("EMP-IMP-1")).thenReturn(false);
        when(employeeRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        ImportResultDTO result = service.importEmployees(file);

        assertThat(result.getImported()).isEqualTo(1);
        assertThat(result.getSkipped()).isZero();
        verify(employeeRepo).save(any());
    }

    @Test
    @DisplayName("importEmployees – bestehender Mitarbeiter wird aktualisiert")
    void importEmployees_existingUpdated() {
        String csv = "\"Nr.\";\"Vorname\";\"Nachname\";\"E-Mail\"\r\n" +
                     "\"EMP-1\";\"Neu\";\"Name\";\"exists@firma.de\"\r\n";
        MockMultipartFile file = new MockMultipartFile("file", "test.csv", "text/csv", csv.getBytes());

        Employee existing = Employee.builder().id(1L).employeeNumber("EMP-1")
                .firstName("Alt").lastName("Name").email("exists@firma.de")
                .hireDate(java.time.LocalDate.now()).build();
        when(employeeRepo.findByEmail("exists@firma.de")).thenReturn(java.util.Optional.of(existing));
        when(employeeRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        ImportResultDTO result = service.importEmployees(file);

        assertThat(result.getImported()).isEqualTo(1);
        assertThat(existing.getFirstName()).isEqualTo("Neu");
    }

    @Test
    @DisplayName("importEmployees – leere Datei gibt Fehler")
    void importEmployees_emptyFile() {
        MockMultipartFile file = new MockMultipartFile("file", "empty.csv", "text/csv", "".getBytes());

        ImportResultDTO result = service.importEmployees(file);

        assertThat(result.getImported()).isZero();
        assertThat(result.getErrors()).anyMatch(e -> e.contains("Leere Datei"));
    }

    @Test
    @DisplayName("importHardware – neue Hardware wird importiert")
    void importHardware_success() {
        String csv = "\"Asset-Tag\";\"Name\";\"Kategorie\";\"Status\"\r\n" +
                     "\"HW-IMP-1\";\"Test Laptop\";\"LAPTOP\";\"AVAILABLE\"\r\n";
        MockMultipartFile file = new MockMultipartFile("file", "hw.csv", "text/csv", csv.getBytes());

        when(hardwareRepo.findByAssetTag("HW-IMP-1")).thenReturn(java.util.Optional.empty());
        when(hardwareRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        ImportResultDTO result = service.importHardware(file);

        assertThat(result.getImported()).isEqualTo(1);
    }

    @Test
    @DisplayName("importHardware – bestehende Hardware wird aktualisiert")
    void importHardware_existingUpdated() {
        String csv = "\"Asset-Tag\";\"Name\";\"Hersteller\"\r\n" +
                     "\"HW-EXIST\";\"Neu\";\"Lenovo\"\r\n";
        MockMultipartFile file = new MockMultipartFile("file", "hw.csv", "text/csv", csv.getBytes());

        Hardware existing = Hardware.builder().id(1L).assetTag("HW-EXIST").name("Alt")
                .status(Hardware.HardwareStatus.AVAILABLE).build();
        when(hardwareRepo.findByAssetTag("HW-EXIST")).thenReturn(java.util.Optional.of(existing));
        when(hardwareRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        ImportResultDTO result = service.importHardware(file);

        assertThat(result.getImported()).isEqualTo(1);
        assertThat(existing.getName()).isEqualTo("Neu");
        assertThat(existing.getManufacturer()).isEqualTo("Lenovo");
    }

    @Test
    @DisplayName("importSoftware – neue Software wird importiert")
    void importSoftware_success() {
        String csv = "\"Name\";\"Hersteller\";\"Lizenzen gesamt\"\r\n" +
                     "\"Test SW\";\"Vendor\";\"10\"\r\n";
        MockMultipartFile file = new MockMultipartFile("file", "sw.csv", "text/csv", csv.getBytes());

        when(softwareRepo.findByName("Test SW")).thenReturn(java.util.Optional.empty());
        when(softwareRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        ImportResultDTO result = service.importSoftware(file);

        assertThat(result.getImported()).isEqualTo(1);
    }

    @Test
    @DisplayName("importSoftware – bestehende Software wird aktualisiert")
    void importSoftware_existingUpdated() {
        String csv = "\"Name\";\"Hersteller\";\"Lizenzen gesamt\"\r\n" +
                     "\"Existing SW\";\"NewVendor\";\"50\"\r\n";
        MockMultipartFile file = new MockMultipartFile("file", "sw.csv", "text/csv", csv.getBytes());

        Software existing = Software.builder().id(1L).name("Existing SW").vendor("OldVendor").totalLicenses(10).build();
        when(softwareRepo.findByName("Existing SW")).thenReturn(java.util.Optional.of(existing));
        when(softwareRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        ImportResultDTO result = service.importSoftware(file);

        assertThat(result.getImported()).isEqualTo(1);
        assertThat(existing.getVendor()).isEqualTo("NewVendor");
        assertThat(existing.getTotalLicenses()).isEqualTo(50);
    }
}
