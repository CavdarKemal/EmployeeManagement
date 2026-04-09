package com.employeemanagement.service;

import com.employeemanagement.model.Employee;
import com.employeemanagement.model.Hardware;
import com.employeemanagement.model.Software;
import com.employeemanagement.repository.EmployeeRepository;
import com.employeemanagement.repository.HardwareRepository;
import com.employeemanagement.repository.SoftwareRepository;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PdfReportService {

    private final EmployeeRepository empRepo;
    private final HardwareRepository hwRepo;
    private final SoftwareRepository swRepo;

    private static final DeviceRgb HEADER_BG = new DeviceRgb(99, 102, 241);
    private static final DeviceRgb STRIPE_BG = new DeviceRgb(241, 245, 249);
    private static final DateTimeFormatter DE_DATE = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    public byte[] generateEmployeeReport() {
        List<Employee> employees = empRepo.findAll().stream().filter(Employee::isActive).toList();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
        Document doc = new Document(pdf);

        addTitle(doc, "Mitarbeiter-Bericht", employees.size() + " aktive Mitarbeiter");

        Table table = new Table(UnitValue.createPercentArray(new float[]{12, 18, 18, 20, 15, 17})).useAllAvailableWidth();
        addHeaderRow(table, "Nr.", "Vorname", "Nachname", "E-Mail", "Abteilung", "Eingestellt");

        for (int i = 0; i < employees.size(); i++) {
            Employee e = employees.get(i);
            boolean stripe = i % 2 == 1;
            addRow(table, stripe, e.getEmployeeNumber(), e.getFirstName(), e.getLastName(),
                    e.getEmail(), nvl(e.getDepartment()), e.getHireDate() != null ? e.getHireDate().format(DE_DATE) : "");
        }
        doc.add(table);
        addFooter(doc);
        doc.close();
        return baos.toByteArray();
    }

    public byte[] generateHardwareReport() {
        List<Hardware> hardware = hwRepo.findAll();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
        Document doc = new Document(pdf);

        addTitle(doc, "Hardware-Inventar", hardware.size() + " Geräte");

        Table table = new Table(UnitValue.createPercentArray(new float[]{14, 22, 14, 14, 14, 12, 10})).useAllAvailableWidth();
        addHeaderRow(table, "Asset-Tag", "Name", "Hersteller", "Kategorie", "Status", "Garantie", "Preis");

        for (int i = 0; i < hardware.size(); i++) {
            Hardware h = hardware.get(i);
            boolean stripe = i % 2 == 1;
            String warranty = h.getWarrantyUntil() != null ? h.getWarrantyUntil().format(DE_DATE) : "";
            String price = h.getPurchasePrice() != null ? h.getPurchasePrice().toPlainString() + " €" : "";
            addRow(table, stripe, h.getAssetTag(), h.getName(), nvl(h.getManufacturer()),
                    nvl(h.getCategory()), h.getStatus() != null ? h.getStatus().name() : "", warranty, price);
        }
        doc.add(table);
        addFooter(doc);
        doc.close();
        return baos.toByteArray();
    }

    public byte[] generateLicenseReport() {
        List<Software> software = swRepo.findAll();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
        Document doc = new Document(pdf);

        int totalLicenses = software.stream().mapToInt(Software::getTotalLicenses).sum();
        int usedLicenses = software.stream().mapToInt(Software::getUsedLicenses).sum();
        addTitle(doc, "Lizenz-Audit-Bericht", totalLicenses + " Lizenzen gesamt, " + usedLicenses + " genutzt");

        Table table = new Table(UnitValue.createPercentArray(new float[]{22, 16, 12, 12, 12, 14, 12})).useAllAvailableWidth();
        addHeaderRow(table, "Software", "Hersteller", "Gesamt", "Genutzt", "Frei", "Kosten/Monat", "Erneuerung");

        for (int i = 0; i < software.size(); i++) {
            Software s = software.get(i);
            boolean stripe = i % 2 == 1;
            int free = s.getTotalLicenses() - s.getUsedLicenses();
            String cost = s.getCostPerLicense() != null ? s.getCostPerLicense().multiply(java.math.BigDecimal.valueOf(s.getTotalLicenses())).toPlainString() + " €" : "";
            String renewal = s.getRenewalDate() != null ? s.getRenewalDate().format(DE_DATE) : "";
            addRow(table, stripe, s.getName(), nvl(s.getVendor()),
                    String.valueOf(s.getTotalLicenses()), String.valueOf(s.getUsedLicenses()),
                    String.valueOf(free), cost, renewal);
        }
        doc.add(table);
        addFooter(doc);
        doc.close();
        return baos.toByteArray();
    }

    // ── Helpers ──────────────────────────────────────────────

    private void addTitle(Document doc, String title, String subtitle) {
        doc.add(new Paragraph(title).setFontSize(20).setFontColor(new DeviceRgb(15, 23, 42)));
        doc.add(new Paragraph(subtitle).setFontSize(11).setFontColor(new DeviceRgb(100, 116, 139)).setMarginBottom(16));
        doc.add(new Paragraph("Erstellt am " + LocalDate.now().format(DE_DATE))
                .setFontSize(9).setFontColor(new DeviceRgb(148, 163, 184)).setMarginBottom(12));
    }

    private void addHeaderRow(Table table, String... headers) {
        for (String h : headers) {
            table.addHeaderCell(new Cell().add(new Paragraph(h).setFontSize(9).setFontColor(ColorConstants.WHITE))
                    .setBackgroundColor(HEADER_BG).setPadding(6));
        }
    }

    private void addRow(Table table, boolean stripe, String... values) {
        for (String v : values) {
            Cell cell = new Cell().add(new Paragraph(v).setFontSize(9)).setPadding(5);
            if (stripe) cell.setBackgroundColor(STRIPE_BG);
            table.addCell(cell);
        }
    }

    private void addFooter(Document doc) {
        doc.add(new Paragraph("\n— EmployeeManagement System • " + LocalDate.now().format(DE_DATE))
                .setFontSize(8).setFontColor(new DeviceRgb(148, 163, 184)).setTextAlignment(TextAlignment.RIGHT));
    }

    private String nvl(String val) { return val != null ? val : ""; }
}
