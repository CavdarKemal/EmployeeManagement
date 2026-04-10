package com.employeemanagement.service;

import com.employeemanagement.model.Hardware;
import com.employeemanagement.model.Software;
import com.employeemanagement.repository.HardwareRepository;
import com.employeemanagement.repository.LoanRepository;
import com.employeemanagement.repository.SoftwareRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock JavaMailSender mailSender;
    @Mock HardwareRepository hardwareRepo;
    @Mock SoftwareRepository softwareRepo;
    @Mock LoanRepository loanRepo;

    private NotificationService service;

    @BeforeEach
    void setUp() throws Exception {
        service = new NotificationService(mailSender, hardwareRepo, softwareRepo, loanRepo);
        // Set @Value fields via reflection
        setField("recipient", "test@firma.de");
        setField("warrantyDays", 30);
        setField("renewalDays", 30);
        setField("returnDays", 7);
        setField("fromAddress", "noreply@test.de");
    }

    private void setField(String name, Object value) throws Exception {
        var field = NotificationService.class.getDeclaredField(name);
        field.setAccessible(true);
        field.set(service, value);
    }

    @Test
    @DisplayName("checkWarrantyExpiration – sendet E-Mail bei ablaufender Garantie")
    void warrantyExpiration_sendsEmail() {
        Hardware hw = Hardware.builder().name("MacBook").assetTag("HW-001")
                .warrantyUntil(LocalDate.now().plusDays(10)).build();
        when(hardwareRepo.findWarrantyExpiredBefore(any())).thenReturn(List.of(hw));

        service.checkWarrantyExpiration();

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        assertThat(captor.getValue().getSubject()).contains("Garantie-Warnung");
        assertThat(captor.getValue().getText()).contains("MacBook");
    }

    @Test
    @DisplayName("checkWarrantyExpiration – keine E-Mail wenn nichts abläuft")
    void warrantyExpiration_noEmail() {
        when(hardwareRepo.findWarrantyExpiredBefore(any())).thenReturn(List.of());

        service.checkWarrantyExpiration();

        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("checkLicenseRenewal – sendet E-Mail bei ablaufender Lizenz")
    void licenseRenewal_sendsEmail() {
        Software sw = Software.builder().name("IntelliJ").vendor("JetBrains")
                .renewalDate(LocalDate.now().plusDays(15)).totalLicenses(10).build();
        when(softwareRepo.findAll()).thenReturn(List.of(sw));

        service.checkLicenseRenewal();

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        assertThat(captor.getValue().getSubject()).contains("Lizenz-Erneuerung");
        assertThat(captor.getValue().getText()).contains("IntelliJ");
    }

    @Test
    @DisplayName("checkLicenseRenewal – keine E-Mail wenn nichts abläuft")
    void licenseRenewal_noEmail() {
        Software sw = Software.builder().name("OK").vendor("V")
                .renewalDate(LocalDate.now().plusDays(90)).totalLicenses(5).build();
        when(softwareRepo.findAll()).thenReturn(List.of(sw));

        service.checkLicenseRenewal();

        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("Mail-Fehler wird abgefangen, kein Crash")
    void mailError_noCrash() {
        Hardware hw = Hardware.builder().name("Test").assetTag("HW-X")
                .warrantyUntil(LocalDate.now().plusDays(5)).build();
        when(hardwareRepo.findWarrantyExpiredBefore(any())).thenReturn(List.of(hw));
        doThrow(new RuntimeException("SMTP down")).when(mailSender).send(any(SimpleMailMessage.class));

        // Should not throw
        service.checkWarrantyExpiration();
    }
}
