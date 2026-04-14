package com.employeemanagement.service;

import com.employeemanagement.dto.LoanDTO;
import com.employeemanagement.exception.BusinessException;
import com.employeemanagement.exception.ResourceNotFoundException;
import com.employeemanagement.mapper.LoanMapper;
import com.employeemanagement.model.Employee;
import com.employeemanagement.model.HardwareUnit;
import com.employeemanagement.model.Loan;
import com.employeemanagement.repository.EmployeeRepository;
import com.employeemanagement.repository.HardwareUnitRepository;
import com.employeemanagement.repository.LoanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LoanService {

    private final LoanRepository loanRepo;
    private final EmployeeRepository employeeRepo;
    private final HardwareUnitRepository unitRepo;
    private final LoanMapper loanMapper;

    public LoanDTO loanHardwareUnit(Long employeeId, Long hardwareUnitId, LocalDate returnDate, String notes) {
        Employee employee = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Mitarbeiter", employeeId));

        HardwareUnit unit = unitRepo.findById(hardwareUnitId)
                .orElseThrow(() -> new ResourceNotFoundException("HardwareUnit", hardwareUnitId));

        if (unit.getStatus() != HardwareUnit.HardwareUnitStatus.AVAILABLE)
            throw new BusinessException("Gerät ist nicht verfügbar. Status: " + unit.getStatus());

        loanRepo.findActiveLoanByHardwareUnitId(hardwareUnitId).ifPresent(l -> {
            throw new BusinessException("Gerät ist bereits ausgeliehen");
        });

        Loan loan = Loan.builder()
                .employee(employee)
                .hardwareUnit(unit)
                .loanDate(LocalDate.now())
                .returnDate(returnDate)
                .notes(notes)
                .build();

        unit.setStatus(HardwareUnit.HardwareUnitStatus.LOANED);
        unitRepo.save(unit);

        Loan saved = loanRepo.save(loan);
        log.info("Gerät ausgeliehen: {} → {}", unit.getAssetTag(), employee.getEmail());
        return loanMapper.toDTO(saved);
    }

    public LoanDTO returnHardwareUnit(Long hardwareUnitId, String notes) {
        Loan loan = loanRepo.findActiveLoanByHardwareUnitId(hardwareUnitId)
                .orElseThrow(() -> new BusinessException("Keine aktive Ausleihe für Gerät: " + hardwareUnitId));

        loan.setReturnedAt(LocalDateTime.now());
        if (notes != null && !notes.isBlank()) {
            loan.setNotes((loan.getNotes() == null ? "" : loan.getNotes() + "\n") + notes);
        }

        HardwareUnit unit = loan.getHardwareUnit();
        unit.setStatus(HardwareUnit.HardwareUnitStatus.AVAILABLE);
        unitRepo.save(unit);

        Loan saved = loanRepo.save(loan);
        log.info("Gerät zurückgegeben: {}", unit.getAssetTag());
        return loanMapper.toDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<LoanDTO> getActiveLoansForEmployee(Long employeeId) {
        return loanRepo.findActiveByEmployeeId(employeeId)
                .stream().map(loanMapper::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<LoanDTO> getLoanHistoryForEmployee(Long employeeId) {
        return loanRepo.findAllByEmployeeId(employeeId)
                .stream().map(loanMapper::toDTO).toList();
    }
}
