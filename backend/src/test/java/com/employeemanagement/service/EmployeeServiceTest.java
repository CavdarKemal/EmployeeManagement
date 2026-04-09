package com.employeemanagement.service;

import com.employeemanagement.dto.EmployeeDTO;
import com.employeemanagement.exception.BusinessException;
import com.employeemanagement.exception.ResourceNotFoundException;
import com.employeemanagement.mapper.EmployeeMapper;
import com.employeemanagement.model.Employee;
import com.employeemanagement.repository.EmployeeRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock EmployeeRepository repo;
    @Mock EmployeeMapper mapper;
    @InjectMocks EmployeeService service;

    @Test
    @DisplayName("findById – Erfolg")
    void findById_success() {
        Employee emp = Employee.builder().id(1L).email("test@firma.de").build();
        EmployeeDTO dto = new EmployeeDTO(); dto.setId(1L);

        when(repo.findById(1L)).thenReturn(Optional.of(emp));
        when(mapper.toDTO(emp)).thenReturn(dto);

        EmployeeDTO result = service.findById(1L);

        assertThat(result.getId()).isEqualTo(1L);
        verify(repo).findById(1L);
    }

    @Test
    @DisplayName("findById – 404")
    void findById_notFound() {
        when(repo.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.findById(99L));
    }

    @Test
    @DisplayName("create – Duplikat E-Mail wirft Exception")
    void create_duplicateEmail() {
        EmployeeDTO dto = new EmployeeDTO();
        dto.setEmail("exists@firma.de");
        when(repo.existsByEmail("exists@firma.de")).thenReturn(true);
        assertThrows(BusinessException.class, () -> service.create(dto, null));
    }

    @Test
    @DisplayName("create – Adressfelder werden korrekt übergeben")
    void create_withAddress() {
        EmployeeDTO dto = new EmployeeDTO();
        dto.setEmployeeNumber("EMP-ADDR");
        dto.setEmail("addr@firma.de");
        dto.setFirstName("Test");
        dto.setLastName("Adresse");
        dto.setStreet("Musterstr. 1");
        dto.setCity("Berlin");
        dto.setZipCode("10115");
        dto.setCountry("Deutschland");

        Employee entity = Employee.builder().id(1L).email("addr@firma.de")
                .street("Musterstr. 1").city("Berlin").zipCode("10115").country("Deutschland").build();
        EmployeeDTO saved = new EmployeeDTO();
        saved.setId(1L);
        saved.setStreet("Musterstr. 1");
        saved.setCity("Berlin");

        when(repo.existsByEmail("addr@firma.de")).thenReturn(false);
        when(repo.existsByEmployeeNumber("EMP-ADDR")).thenReturn(false);
        when(mapper.toEntity(dto)).thenReturn(entity);
        when(repo.save(entity)).thenReturn(entity);
        when(mapper.toDTO(entity)).thenReturn(saved);

        EmployeeDTO result = service.create(dto, null);

        assertThat(result.getStreet()).isEqualTo("Musterstr. 1");
        assertThat(result.getCity()).isEqualTo("Berlin");
    }
}
