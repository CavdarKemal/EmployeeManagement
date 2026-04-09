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

        when(employeeRepo.existsByEmail("anna@import.de")).thenReturn(false);
        when(employeeRepo.existsByEmployeeNumber("EMP-IMP-1")).thenReturn(false);
        when(employeeRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        ImportResultDTO result = service.importEmployees(file);

        assertThat(result.getImported()).isEqualTo(1);
        assertThat(result.getSkipped()).isZero();
        verify(employeeRepo).save(any());
    }

    @Test
    @DisplayName("importEmployees – Duplikat-E-Mail wird übersprungen")
    void importEmployees_duplicateEmail() {
        String csv = "\"Nr.\";\"Vorname\";\"Nachname\";\"E-Mail\"\r\n" +
                     "\"EMP-1\";\"A\";\"B\";\"exists@firma.de\"\r\n";
        MockMultipartFile file = new MockMultipartFile("file", "test.csv", "text/csv", csv.getBytes());

        when(employeeRepo.existsByEmail("exists@firma.de")).thenReturn(true);

        ImportResultDTO result = service.importEmployees(file);

        assertThat(result.getImported()).isZero();
        assertThat(result.getSkipped()).isEqualTo(1);
        assertThat(result.getErrors()).anyMatch(e -> e.contains("bereits vorhanden"));
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
    @DisplayName("importHardware – gültige CSV wird importiert")
    void importHardware_success() {
        String csv = "\"Asset-Tag\";\"Name\";\"Kategorie\";\"Status\"\r\n" +
                     "\"HW-IMP-1\";\"Test Laptop\";\"LAPTOP\";\"AVAILABLE\"\r\n";
        MockMultipartFile file = new MockMultipartFile("file", "hw.csv", "text/csv", csv.getBytes());

        when(hardwareRepo.existsByAssetTag("HW-IMP-1")).thenReturn(false);
        when(hardwareRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        ImportResultDTO result = service.importHardware(file);

        assertThat(result.getImported()).isEqualTo(1);
    }

    @Test
    @DisplayName("importSoftware – gültige CSV wird importiert")
    void importSoftware_success() {
        String csv = "\"Name\";\"Hersteller\";\"Lizenzen gesamt\"\r\n" +
                     "\"Test SW\";\"Vendor\";\"10\"\r\n";
        MockMultipartFile file = new MockMultipartFile("file", "sw.csv", "text/csv", csv.getBytes());

        when(softwareRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        ImportResultDTO result = service.importSoftware(file);

        assertThat(result.getImported()).isEqualTo(1);
    }
}
