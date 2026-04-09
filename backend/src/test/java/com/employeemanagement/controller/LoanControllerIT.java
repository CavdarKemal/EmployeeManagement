package com.employeemanagement.controller;

import com.employeemanagement.model.Employee;
import com.employeemanagement.model.Hardware;
import com.employeemanagement.model.Loan;
import com.employeemanagement.repository.EmployeeRepository;
import com.employeemanagement.repository.HardwareRepository;
import com.employeemanagement.repository.LoanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Testcontainers
class LoanControllerIT {

    @Container
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("employeemanagement_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url",      postgres::getJdbcUrl);
        r.add("spring.datasource.username", postgres::getUsername);
        r.add("spring.datasource.password", postgres::getPassword);
        r.add("spring.flyway.enabled",      () -> "true");
    }

    @Autowired WebApplicationContext wac;
    @Autowired EmployeeRepository empRepo;
    @Autowired HardwareRepository hwRepo;
    @Autowired LoanRepository loanRepo;

    private MockMvc mockMvc;
    private Employee testEmp;
    private Hardware testHw;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(wac)
                .apply(springSecurity()).build();
        loanRepo.deleteAll();
        hwRepo.deleteAll();
        empRepo.deleteAll();

        testEmp = empRepo.save(Employee.builder()
                .employeeNumber("EMP-LOAN").firstName("Test").lastName("Loan")
                .email("loan@test.de").hireDate(LocalDate.now()).build());
        testHw = hwRepo.save(Hardware.builder()
                .assetTag("HW-LOAN").name("Test Laptop")
                .status(Hardware.HardwareStatus.AVAILABLE).build());
    }

    // ── LOAN ─────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void loanHardware_verifyDbState() throws Exception {
        mockMvc.perform(post("/api/v1/loans/hardware/" + testHw.getId() + "/loan")
                .contentType(APPLICATION_JSON)
                .content("{\"employeeId\":" + testEmp.getId() + "}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.active").value(true));

        // DB: Hardware ist LOANED
        Hardware hw = hwRepo.findById(testHw.getId()).orElseThrow();
        assertThat(hw.getStatus()).isEqualTo(Hardware.HardwareStatus.LOANED);

        // DB: Loan-Eintrag existiert
        var loans = loanRepo.findAll();
        assertThat(loans).hasSize(1);
        assertThat(loans.getFirst().getReturnedAt()).isNull();
        assertThat(loans.getFirst().getEmployee().getId()).isEqualTo(testEmp.getId());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void loanHardware_alreadyLoaned_409() throws Exception {
        testHw.setStatus(Hardware.HardwareStatus.LOANED);
        hwRepo.save(testHw);

        mockMvc.perform(post("/api/v1/loans/hardware/" + testHw.getId() + "/loan")
                .contentType(APPLICATION_JSON)
                .content("{\"employeeId\":" + testEmp.getId() + "}"))
            .andExpect(status().isConflict());

        // DB: keine neuen Loans
        assertThat(loanRepo.count()).isZero();
    }

    // ── RETURN ───────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void returnHardware_verifyDbState() throws Exception {
        loanRepo.save(Loan.builder().employee(testEmp).hardware(testHw).build());
        testHw.setStatus(Hardware.HardwareStatus.LOANED);
        hwRepo.save(testHw);

        mockMvc.perform(post("/api/v1/loans/hardware/" + testHw.getId() + "/return"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.active").value(false));

        // DB: Hardware ist wieder AVAILABLE
        assertThat(hwRepo.findById(testHw.getId()).get().getStatus())
            .isEqualTo(Hardware.HardwareStatus.AVAILABLE);

        // DB: Loan hat returnedAt
        Loan loan = loanRepo.findAll().getFirst();
        assertThat(loan.getReturnedAt()).isNotNull();
    }

    // ── FULL CYCLE: Loan → Return → Loan again ──────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void fullCycle_loan_return_loanAgain() throws Exception {
        // 1. Loan
        mockMvc.perform(post("/api/v1/loans/hardware/" + testHw.getId() + "/loan")
                .contentType(APPLICATION_JSON)
                .content("{\"employeeId\":" + testEmp.getId() + "}"))
            .andExpect(status().isOk());

        assertThat(hwRepo.findById(testHw.getId()).get().getStatus()).isEqualTo(Hardware.HardwareStatus.LOANED);

        // 2. Return
        mockMvc.perform(post("/api/v1/loans/hardware/" + testHw.getId() + "/return"))
            .andExpect(status().isOk());

        assertThat(hwRepo.findById(testHw.getId()).get().getStatus()).isEqualTo(Hardware.HardwareStatus.AVAILABLE);

        // 3. Loan again (to different or same employee)
        Employee emp2 = empRepo.save(Employee.builder()
            .employeeNumber("EMP-LOAN2").firstName("Second").lastName("User")
            .email("loan2@test.de").hireDate(LocalDate.now()).build());

        mockMvc.perform(post("/api/v1/loans/hardware/" + testHw.getId() + "/loan")
                .contentType(APPLICATION_JSON)
                .content("{\"employeeId\":" + emp2.getId() + "}"))
            .andExpect(status().isOk());

        assertThat(hwRepo.findById(testHw.getId()).get().getStatus()).isEqualTo(Hardware.HardwareStatus.LOANED);
        assertThat(loanRepo.count()).isEqualTo(2);
    }

    // ── HISTORY ──────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "VIEWER")
    void getActiveLoans_onlyActive() throws Exception {
        // Active loan
        loanRepo.save(Loan.builder().employee(testEmp).hardware(testHw).build());
        // Completed loan
        Hardware hw2 = hwRepo.save(Hardware.builder().assetTag("HW-RET").name("Returned").status(Hardware.HardwareStatus.AVAILABLE).build());
        loanRepo.save(Loan.builder().employee(testEmp).hardware(hw2)
            .loanDate(LocalDate.of(2024, 1, 1))
            .returnedAt(LocalDateTime.of(2024, 3, 1, 10, 0)).build());

        mockMvc.perform(get("/api/v1/loans/employees/" + testEmp.getId() + "/active"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].hardwareName").value("Test Laptop"));
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void getLoanHistory_includesAll() throws Exception {
        loanRepo.save(Loan.builder().employee(testEmp).hardware(testHw).build());
        Hardware hw2 = hwRepo.save(Hardware.builder().assetTag("HW-HIST").name("History").status(Hardware.HardwareStatus.AVAILABLE).build());
        loanRepo.save(Loan.builder().employee(testEmp).hardware(hw2)
            .returnedAt(LocalDateTime.now()).build());

        mockMvc.perform(get("/api/v1/loans/employees/" + testEmp.getId() + "/history"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void getActiveLoans_empty() throws Exception {
        mockMvc.perform(get("/api/v1/loans/employees/" + testEmp.getId() + "/active"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isEmpty());
    }
}
