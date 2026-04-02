package com.employeemanagement.service;

import com.employeemanagement.dto.LoanDTO;
import com.employeemanagement.exception.BusinessException;
import com.employeemanagement.mapper.LoanMapper;
import com.employeemanagement.model.Employee;
import com.employeemanagement.model.Hardware;
import com.employeemanagement.model.Loan;
import com.employeemanagement.repository.EmployeeRepository;
import com.employeemanagement.repository.HardwareRepository;
import com.employeemanagement.repository.LoanRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoanServiceTest {

    @Mock LoanRepository loanRepo;
    @Mock EmployeeRepository employeeRepo;
    @Mock HardwareRepository hardwareRepo;
    @Mock LoanMapper loanMapper;
    @InjectMocks LoanService service;

    @Test
    @DisplayName("loanHardware – Erfolg")
    void loanHardware_success() {
        Employee emp = Employee.builder().id(1L).build();
        Hardware hw = Hardware.builder().id(2L)
                .status(Hardware.HardwareStatus.AVAILABLE).build();
        Loan loan = Loan.builder().id(10L).employee(emp).hardware(hw).build();
        LoanDTO dto = new LoanDTO(); dto.setId(10L);

        when(employeeRepo.findById(1L)).thenReturn(Optional.of(emp));
        when(hardwareRepo.findById(2L)).thenReturn(Optional.of(hw));
        when(loanRepo.findActiveLoanByHardwareId(2L)).thenReturn(Optional.empty());
        when(loanRepo.save(any())).thenReturn(loan);
        when(loanMapper.toDTO(loan)).thenReturn(dto);

        LoanDTO result = service.loanHardware(1L, 2L, null, null);
        assertThat(result.getId()).isEqualTo(10L);
        assertThat(hw.getStatus()).isEqualTo(Hardware.HardwareStatus.LOANED);
    }

    @Test
    @DisplayName("loanHardware – Hardware nicht verfügbar")
    void loanHardware_notAvailable() {
        Employee emp = Employee.builder().id(1L).build();
        Hardware hw = Hardware.builder().id(2L)
                .status(Hardware.HardwareStatus.LOANED).build();

        when(employeeRepo.findById(1L)).thenReturn(Optional.of(emp));
        when(hardwareRepo.findById(2L)).thenReturn(Optional.of(hw));

        assertThrows(BusinessException.class,
                () -> service.loanHardware(1L, 2L, null, null));
    }
}
