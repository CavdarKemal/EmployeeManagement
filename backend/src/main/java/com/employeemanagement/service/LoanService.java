package com.employeemanagement.service;

import com.employeemanagement.dto.LoanDTO;
import com.employeemanagement.exception.BusinessException;
import com.employeemanagement.exception.ResourceNotFoundException;
import com.employeemanagement.mapper.LoanMapper;
import com.employeemanagement.model.Employee;
import com.employeemanagement.model.Hardware;
import com.employeemanagement.model.Loan;
import com.employeemanagement.repository.EmployeeRepository;
import com.employeemanagement.repository.HardwareRepository;
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
    private final HardwareRepository hardwareRepo;
    private final LoanMapper loanMapper;

    public LoanDTO loanHardware(Long employeeId, Long hardwareId, LocalDate returnDate, String notes) {
        Employee employee = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Mitarbeiter", employeeId));

        Hardware hardware = hardwareRepo.findById(hardwareId)
                .orElseThrow(() -> new ResourceNotFoundException("Hardware", hardwareId));

        // Prüfen ob Hardware verfügbar ist
        if (hardware.getStatus() != Hardware.HardwareStatus.AVAILABLE)
            throw new BusinessException("Hardware ist nicht verfügbar. Status: " + hardware.getStatus());

        // Aktive Ausleihe prüfen (Doppelschutz)
        loanRepo.findActiveLoanByHardwareId(hardwareId).ifPresent(l -> {
            throw new BusinessException("Hardware ist bereits ausgeliehen");
        });

        Loan loan = Loan.builder()
                .employee(employee)
                .hardware(hardware)
                .loanDate(LocalDate.now())
                .returnDate(returnDate)
                .notes(notes)
                .build();

        hardware.setStatus(Hardware.HardwareStatus.LOANED);
        hardwareRepo.save(hardware);

        Loan saved = loanRepo.save(loan);
        log.info("Hardware ausgeliehen: {} → {}", hardware.getAssetTag(), employee.getEmail());
        return loanMapper.toDTO(saved);
    }

    public LoanDTO returnHardware(Long hardwareId, String notes) {
        Loan loan = loanRepo.findActiveLoanByHardwareId(hardwareId)
                .orElseThrow(() -> new BusinessException("Keine aktive Ausleihe für Hardware: " + hardwareId));

        loan.setReturnedAt(LocalDateTime.now());
        if (notes != null) loan.setNotes(notes);

        Hardware hardware = loan.getHardware();
        hardware.setStatus(Hardware.HardwareStatus.AVAILABLE);
        hardwareRepo.save(hardware);

        Loan saved = loanRepo.save(loan);
        log.info("Hardware zurückgegeben: {}", hardware.getAssetTag());
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
