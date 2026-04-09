package com.employeemanagement.controller;

import com.employeemanagement.model.Employee;
import com.employeemanagement.model.Hardware;
import com.employeemanagement.repository.EmployeeRepository;
import com.employeemanagement.repository.HardwareRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Testcontainers
class BatchControllerIT {

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

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(wac)
                .apply(springSecurity()).build();
        hwRepo.deleteAll();
        empRepo.deleteAll();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void batchDeactivateEmployees_200() throws Exception {
        Employee e1 = empRepo.save(Employee.builder().employeeNumber("B-001").firstName("A").lastName("B").email("b1@t.de").hireDate(LocalDate.now()).build());
        Employee e2 = empRepo.save(Employee.builder().employeeNumber("B-002").firstName("C").lastName("D").email("b2@t.de").hireDate(LocalDate.now()).build());

        mockMvc.perform(post("/api/v1/batch/employees/deactivate")
                .contentType(APPLICATION_JSON)
                .content("[" + e1.getId() + "," + e2.getId() + "]"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.deactivated").value(2));

        assertThat(empRepo.findById(e1.getId()).get().isActive()).isFalse();
        assertThat(empRepo.findById(e2.getId()).get().isActive()).isFalse();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void batchChangeDepartment_200() throws Exception {
        Employee e1 = empRepo.save(Employee.builder().employeeNumber("B-003").firstName("E").lastName("F").email("b3@t.de").hireDate(LocalDate.now()).department("IT").build());

        mockMvc.perform(post("/api/v1/batch/employees/department")
                .contentType(APPLICATION_JSON)
                .content("{\"ids\":[" + e1.getId() + "],\"department\":\"Engineering\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.updated").value(1));

        assertThat(empRepo.findById(e1.getId()).get().getDepartment()).isEqualTo("Engineering");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void batchDeleteHardware_200() throws Exception {
        Hardware hw = hwRepo.save(Hardware.builder().assetTag("B-HW-001").name("Test").status(Hardware.HardwareStatus.AVAILABLE).build());

        mockMvc.perform(post("/api/v1/batch/hardware/delete")
                .contentType(APPLICATION_JSON)
                .content("[" + hw.getId() + "]"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.deleted").value(1));

        assertThat(hwRepo.findById(hw.getId())).isEmpty();
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void batchDeactivate_forbidden_403() throws Exception {
        mockMvc.perform(post("/api/v1/batch/employees/deactivate")
                .contentType(APPLICATION_JSON).content("[1]"))
            .andExpect(status().isForbidden());
    }
}
