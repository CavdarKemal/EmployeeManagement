package com.employeemanagement.service;

import com.employeemanagement.dto.ImportResultDTO;
import com.employeemanagement.model.Employee;
import com.employeemanagement.model.Hardware;
import com.employeemanagement.model.Software;
import com.employeemanagement.repository.EmployeeRepository;
import com.employeemanagement.repository.HardwareRepository;
import com.employeemanagement.repository.SoftwareRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CsvImportService {

    private final EmployeeRepository employeeRepo;
    private final HardwareRepository hardwareRepo;
    private final SoftwareRepository softwareRepo;

    @Transactional
    public ImportResultDTO importEmployees(MultipartFile file) {
        return processFile(file, (headers, values, result) -> {
            Map<String, String> row = mapRow(headers, values);
            String email = row.get("E-Mail");
            String empNr = row.get("Nr.");
            if (email == null || email.isBlank()) { result.getErrors().add("Zeile ohne E-Mail übersprungen"); result.setSkipped(result.getSkipped() + 1); return; }

            // Existierender Mitarbeiter? → Aktualisieren (reaktivieren falls inaktiv)
            var existing = employeeRepo.findByEmail(email);
            if (existing.isPresent()) {
                Employee emp = existing.get();
                emp.setFirstName(row.getOrDefault("Vorname", emp.getFirstName()));
                emp.setLastName(row.getOrDefault("Nachname", emp.getLastName()));
                if (empNr != null) emp.setEmployeeNumber(empNr);
                emp.setPhone(row.get("Telefon"));
                emp.setPosition(row.get("Position"));
                emp.setDepartment(row.get("Abteilung"));
                if (row.containsKey("Eingestellt")) emp.setHireDate(parseDate(row.get("Eingestellt")));
                if (row.containsKey("Gehalt")) emp.setSalary(parseBigDecimal(row.get("Gehalt")));
                emp.setStreet(row.get("Straße"));
                emp.setZipCode(row.get("PLZ"));
                emp.setCity(row.get("Stadt"));
                if (row.containsKey("Land")) emp.setCountry(row.get("Land"));
                if (!emp.isActive()) {
                    emp.setActive(true);
                    result.getErrors().add("Reaktiviert: " + email);
                }
                employeeRepo.save(emp);
                result.setImported(result.getImported() + 1);
                return;
            }

            if (empNr != null && employeeRepo.existsByEmployeeNumber(empNr)) { result.getErrors().add("Mitarbeiternummer bereits vorhanden: " + empNr); result.setSkipped(result.getSkipped() + 1); return; }

            Employee emp = Employee.builder()
                    .employeeNumber(empNr != null ? empNr : "EMP-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase())
                    .firstName(row.getOrDefault("Vorname", ""))
                    .lastName(row.getOrDefault("Nachname", ""))
                    .email(email)
                    .phone(row.get("Telefon"))
                    .position(row.get("Position"))
                    .department(row.get("Abteilung"))
                    .hireDate(parseDate(row.get("Eingestellt")))
                    .salary(parseBigDecimal(row.get("Gehalt")))
                    .street(row.get("Straße"))
                    .zipCode(row.get("PLZ"))
                    .city(row.get("Stadt"))
                    .country(row.getOrDefault("Land", "Deutschland"))
                    .build();
            employeeRepo.save(emp);
            result.setImported(result.getImported() + 1);
        });
    }

    @Transactional
    public ImportResultDTO importHardware(MultipartFile file) {
        return processFile(file, (headers, values, result) -> {
            Map<String, String> row = mapRow(headers, values);
            String assetTag = row.get("Asset-Tag");
            if (assetTag == null || assetTag.isBlank()) { result.getErrors().add("Zeile ohne Asset-Tag übersprungen"); result.setSkipped(result.getSkipped() + 1); return; }

            // Existierend? → Aktualisieren
            var existingHw = hardwareRepo.findByAssetTag(assetTag);
            if (existingHw.isPresent()) {
                Hardware hw = existingHw.get();
                hw.setName(row.getOrDefault("Name", hw.getName()));
                hw.setCategory(row.getOrDefault("Kategorie", hw.getCategory()));
                hw.setManufacturer(row.get("Hersteller"));
                hw.setModel(row.get("Modell"));
                if (row.containsKey("Seriennummer")) hw.setSerialNumber(row.get("Seriennummer"));
                if (row.containsKey("Status")) hw.setStatus(parseHwStatus(row.get("Status")));
                if (row.containsKey("Kaufpreis")) hw.setPurchasePrice(parseBigDecimal(row.get("Kaufpreis")));
                if (row.containsKey("Garantie bis")) hw.setWarrantyUntil(parseDate(row.get("Garantie bis")));
                hw.setNotes(row.get("Notizen"));
                hardwareRepo.save(hw);
                result.setImported(result.getImported() + 1);
                return;
            }

            Hardware hw = Hardware.builder()
                    .assetTag(assetTag)
                    .name(row.getOrDefault("Name", ""))
                    .category(row.get("Kategorie"))
                    .manufacturer(row.get("Hersteller"))
                    .model(row.get("Modell"))
                    .serialNumber(row.get("Seriennummer"))
                    .status(parseHwStatus(row.get("Status")))
                    .purchasePrice(parseBigDecimal(row.get("Kaufpreis")))
                    .warrantyUntil(parseDate(row.get("Garantie bis")))
                    .notes(row.get("Notizen"))
                    .build();
            hardwareRepo.save(hw);
            result.setImported(result.getImported() + 1);
        });
    }

    @Transactional
    public ImportResultDTO importSoftware(MultipartFile file) {
        return processFile(file, (headers, values, result) -> {
            Map<String, String> row = mapRow(headers, values);
            String name = row.get("Name");
            if (name == null || name.isBlank()) { result.getErrors().add("Zeile ohne Name übersprungen"); result.setSkipped(result.getSkipped() + 1); return; }

            // Existierend (gleicher Name)? → Aktualisieren
            var existingSw = softwareRepo.findByName(name);
            if (existingSw.isPresent()) {
                Software sw = existingSw.get();
                if (row.containsKey("Hersteller")) sw.setVendor(row.get("Hersteller"));
                if (row.containsKey("Version")) sw.setVersion(row.get("Version"));
                if (row.containsKey("Kategorie")) sw.setCategory(row.get("Kategorie"));
                if (row.containsKey("Lizenztyp")) sw.setLicenseType(row.get("Lizenztyp"));
                if (row.containsKey("Lizenzen gesamt")) sw.setTotalLicenses(parseInt(row.get("Lizenzen gesamt"), sw.getTotalLicenses()));
                if (row.containsKey("Kosten/Lizenz")) sw.setCostPerLicense(parseBigDecimal(row.get("Kosten/Lizenz")));
                if (row.containsKey("Erneuerung")) sw.setRenewalDate(parseDate(row.get("Erneuerung")));
                sw.setNotes(row.get("Notizen"));
                softwareRepo.save(sw);
                result.setImported(result.getImported() + 1);
                return;
            }

            Software sw = Software.builder()
                    .name(name)
                    .vendor(row.get("Hersteller"))
                    .version(row.get("Version"))
                    .category(row.get("Kategorie"))
                    .licenseType(row.get("Lizenztyp"))
                    .totalLicenses(parseInt(row.get("Lizenzen gesamt"), 1))
                    .costPerLicense(parseBigDecimal(row.get("Kosten/Lizenz")))
                    .renewalDate(parseDate(row.get("Erneuerung")))
                    .notes(row.get("Notizen"))
                    .build();
            softwareRepo.save(sw);
            result.setImported(result.getImported() + 1);
        });
    }

    // ── Helpers ──────────────────────────────────────────────────

    @FunctionalInterface
    private interface RowProcessor {
        void process(String[] headers, String[] values, ImportResultDTO result);
    }

    private ImportResultDTO processFile(MultipartFile file, RowProcessor processor) {
        ImportResultDTO result = ImportResultDTO.builder().build();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null) { result.getErrors().add("Leere Datei"); return result; }
            // BOM entfernen
            if (headerLine.startsWith("\uFEFF")) headerLine = headerLine.substring(1);
            String[] headers = parseCsvLine(headerLine);

            String line;
            int lineNum = 1;
            while ((line = reader.readLine()) != null) {
                lineNum++;
                if (line.isBlank()) continue;
                try {
                    String[] values = parseCsvLine(line);
                    processor.process(headers, values, result);
                } catch (Exception e) {
                    result.getErrors().add("Zeile " + lineNum + ": " + e.getMessage());
                    result.setSkipped(result.getSkipped() + 1);
                }
            }
        } catch (Exception e) {
            result.getErrors().add("Datei konnte nicht gelesen werden: " + e.getMessage());
        }
        log.info("CSV-Import: {} importiert, {} übersprungen, {} Fehler", result.getImported(), result.getSkipped(), result.getErrors().size());
        return result;
    }

    private String[] parseCsvLine(String line) {
        // Semikolon-separiert, Felder optional in Anführungszeichen
        List<String> fields = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder sb = new StringBuilder();
        for (char c : line.toCharArray()) {
            if (c == '"') { inQuotes = !inQuotes; }
            else if (c == ';' && !inQuotes) { fields.add(sb.toString().trim()); sb.setLength(0); }
            else { sb.append(c); }
        }
        fields.add(sb.toString().trim());
        return fields.toArray(new String[0]);
    }

    private Map<String, String> mapRow(String[] headers, String[] values) {
        Map<String, String> map = new LinkedHashMap<>();
        for (int i = 0; i < headers.length && i < values.length; i++) {
            String val = values[i].trim();
            if (!val.isEmpty()) map.put(headers[i].trim(), val);
        }
        return map;
    }

    private LocalDate parseDate(String val) {
        if (val == null || val.isBlank()) return LocalDate.now();
        try { return LocalDate.parse(val); } catch (DateTimeParseException e) {
            // Versuche dd.MM.yyyy
            try {
                String[] parts = val.split("\\.");
                return LocalDate.of(Integer.parseInt(parts[2]), Integer.parseInt(parts[1]), Integer.parseInt(parts[0]));
            } catch (Exception ex) { return LocalDate.now(); }
        }
    }

    private BigDecimal parseBigDecimal(String val) {
        if (val == null || val.isBlank()) return null;
        try { return new BigDecimal(val.replace(",", ".").replaceAll("[^\\d.]", "")); }
        catch (Exception e) { return null; }
    }

    private int parseInt(String val, int defaultVal) {
        if (val == null || val.isBlank()) return defaultVal;
        try { return Integer.parseInt(val.trim()); } catch (Exception e) { return defaultVal; }
    }

    private Hardware.HardwareStatus parseHwStatus(String val) {
        if (val == null || val.isBlank()) return Hardware.HardwareStatus.AVAILABLE;
        try { return Hardware.HardwareStatus.valueOf(val.toUpperCase()); }
        catch (Exception e) { return Hardware.HardwareStatus.AVAILABLE; }
    }
}
