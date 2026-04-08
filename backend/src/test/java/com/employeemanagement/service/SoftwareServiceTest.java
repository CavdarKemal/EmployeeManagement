package com.employeemanagement.service;

import com.employeemanagement.dto.SoftwareDTO;
import com.employeemanagement.exception.BusinessException;
import com.employeemanagement.exception.ResourceNotFoundException;
import com.employeemanagement.model.Employee;
import com.employeemanagement.model.Software;
import com.employeemanagement.model.SoftwareAssignment;
import com.employeemanagement.repository.EmployeeRepository;
import com.employeemanagement.repository.SoftwareAssignmentRepository;
import com.employeemanagement.repository.SoftwareRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SoftwareServiceTest {

    @Mock SoftwareRepository softwareRepo;
    @Mock EmployeeRepository employeeRepo;
    @Mock SoftwareAssignmentRepository assignmentRepo;
    @InjectMocks SoftwareService service;

    @Test
    @DisplayName("create – neue Software wird angelegt")
    void create_success() {
        SoftwareDTO dto = SoftwareDTO.builder().name("IntelliJ").vendor("JetBrains").totalLicenses(10).build();
        Software saved = Software.builder().id(1L).name("IntelliJ").vendor("JetBrains").totalLicenses(10).build();

        when(softwareRepo.save(any(Software.class))).thenReturn(saved);

        SoftwareDTO result = service.create(dto);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getName()).isEqualTo("IntelliJ");
        verify(softwareRepo).save(any(Software.class));
    }

    @Test
    @DisplayName("update – vorhandene Software wird aktualisiert")
    void update_success() {
        Software existing = Software.builder().id(1L).name("Alt").vendor("V").totalLicenses(5).build();
        SoftwareDTO dto = SoftwareDTO.builder().name("Neu").vendor("V2").totalLicenses(20).build();

        when(softwareRepo.findById(1L)).thenReturn(Optional.of(existing));
        when(softwareRepo.save(existing)).thenReturn(existing);

        SoftwareDTO result = service.update(1L, dto);

        assertThat(result.getName()).isEqualTo("Neu");
        assertThat(result.getTotalLicenses()).isEqualTo(20);
    }

    @Test
    @DisplayName("update – nicht vorhandene Software wirft Exception")
    void update_notFound() {
        when(softwareRepo.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> service.update(99L, SoftwareDTO.builder().name("X").build()));
    }

    @Test
    @DisplayName("delete – Software ohne Lizenzen wird gelöscht")
    void delete_success() {
        Software sw = Software.builder().id(1L).name("Test").usedLicenses(0).build();
        when(softwareRepo.findById(1L)).thenReturn(Optional.of(sw));

        service.delete(1L);

        verify(softwareRepo).delete(sw);
    }

    @Test
    @DisplayName("delete – Software mit aktiven Lizenzen wirft BusinessException")
    void delete_withActiveLicenses() {
        Software sw = Software.builder().id(1L).name("Test").usedLicenses(3).build();
        when(softwareRepo.findById(1L)).thenReturn(Optional.of(sw));

        assertThrows(BusinessException.class, () -> service.delete(1L));
        verify(softwareRepo, never()).delete(any());
    }

    @Test
    @DisplayName("assignLicense – Lizenz wird erfolgreich zugewiesen")
    void assignLicense_success() {
        Software sw = Software.builder().id(1L).name("IntelliJ").totalLicenses(10).usedLicenses(2).build();
        Employee emp = Employee.builder().id(1L).firstName("Max").lastName("Test").email("m@t.de")
                .employeeNumber("EMP-001").hireDate(LocalDate.now()).build();

        when(softwareRepo.findById(1L)).thenReturn(Optional.of(sw));
        when(employeeRepo.findById(1L)).thenReturn(Optional.of(emp));
        when(assignmentRepo.existsActiveAssignment(1L, 1L)).thenReturn(false);

        service.assignLicense(1L, 1L, "KEY-123");

        verify(assignmentRepo).save(any(SoftwareAssignment.class));
        assertThat(sw.getUsedLicenses()).isEqualTo(3);
    }

    @Test
    @DisplayName("assignLicense – bereits zugewiesen wirft BusinessException")
    void assignLicense_alreadyAssigned() {
        Software sw = Software.builder().id(1L).name("IntelliJ").totalLicenses(10).usedLicenses(2).build();
        Employee emp = Employee.builder().id(1L).firstName("Max").lastName("Test").email("m@t.de")
                .employeeNumber("EMP-001").hireDate(LocalDate.now()).build();

        when(softwareRepo.findById(1L)).thenReturn(Optional.of(sw));
        when(employeeRepo.findById(1L)).thenReturn(Optional.of(emp));
        when(assignmentRepo.existsActiveAssignment(1L, 1L)).thenReturn(true);

        assertThrows(BusinessException.class, () -> service.assignLicense(1L, 1L, null));
    }

    @Test
    @DisplayName("assignLicense – keine freien Lizenzen wirft BusinessException")
    void assignLicense_noFreeLicenses() {
        Software sw = Software.builder().id(1L).name("IntelliJ").totalLicenses(5).usedLicenses(5).build();
        Employee emp = Employee.builder().id(1L).firstName("Max").lastName("Test").email("m@t.de")
                .employeeNumber("EMP-001").hireDate(LocalDate.now()).build();

        when(softwareRepo.findById(1L)).thenReturn(Optional.of(sw));
        when(employeeRepo.findById(1L)).thenReturn(Optional.of(emp));
        when(assignmentRepo.existsActiveAssignment(1L, 1L)).thenReturn(false);

        assertThrows(BusinessException.class, () -> service.assignLicense(1L, 1L, null));
    }

    @Test
    @DisplayName("revokeLicense – Lizenz wird erfolgreich entzogen")
    void revokeLicense_success() {
        Software sw = Software.builder().id(1L).name("IntelliJ").usedLicenses(3).build();
        SoftwareAssignment assignment = SoftwareAssignment.builder().id(1L).software(sw).build();

        when(assignmentRepo.findActiveAssignment(1L, 1L)).thenReturn(Optional.of(assignment));

        service.revokeLicense(1L, 1L);

        assertThat(assignment.getRevokedDate()).isNotNull();
        assertThat(sw.getUsedLicenses()).isEqualTo(2);
        verify(assignmentRepo).save(assignment);
    }
}
