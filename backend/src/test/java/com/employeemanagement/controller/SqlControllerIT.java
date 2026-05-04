package com.employeemanagement.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Testcontainers
class SqlControllerIT {

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

    private final ObjectMapper json = new ObjectMapper();

    private MockMvc mvc() {
        return MockMvcBuilders.webAppContextSetup(wac).apply(springSecurity()).build();
    }

    private static String body(String query) {
        return "{\"query\":\"" + query.replace("\\", "\\\\").replace("\"", "\\\"") + "\"}";
    }

    // ── Read-Mode ────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void execute_select_returnsRows() throws Exception {
        mvc().perform(post("/api/v1/admin/sql/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("SELECT 42 AS answer, 'hi' AS greeting")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.queryType").value("SELECT"))
                .andExpect(jsonPath("$.columns[0]").value("answer"))
                .andExpect(jsonPath("$.rows[0][0]").value(42));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void execute_update_rejectedInReadMode_409() throws Exception {
        mvc().perform(post("/api/v1/admin/sql/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("UPDATE app_users SET enabled = true WHERE 1=0")))
                .andExpect(status().isConflict());
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void execute_forbiddenForNonAdmin_403() throws Exception {
        mvc().perform(post("/api/v1/admin/sql/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("SELECT 1")))
                .andExpect(status().isForbidden());
    }

    // ── Transaction-Mode ──────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN", username = "admin@firma.de")
    void transaction_rollback_revertsChanges() throws Exception {
        // Stand vor TX
        long before = countAdminRows();

        // BEGIN
        var openRes = mvc().perform(post("/api/v1/admin/sql/sessions"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String sessionId = json.readTree(openRes).get("sessionId").asText();

        // UPDATE
        mvc().perform(post("/api/v1/admin/sql/sessions/" + sessionId + "/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("UPDATE app_users SET display_name = 'CHANGED'")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rowsAffected").exists());

        // ROLLBACK
        mvc().perform(post("/api/v1/admin/sql/sessions/" + sessionId + "/rollback"))
                .andExpect(status().isNoContent());

        assertThat(countAdminRows()).isEqualTo(before);
        // Verify keine Reihe heißt 'CHANGED'
        var check = mvc().perform(post("/api/v1/admin/sql/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("SELECT COUNT(*) FROM app_users WHERE display_name = 'CHANGED'")))
                .andReturn().getResponse().getContentAsString();
        JsonNode tree = json.readTree(check);
        assertThat(tree.get("rows").get(0).get(0).asLong()).isEqualTo(0);
    }

    @Test
    @WithMockUser(roles = "ADMIN", username = "admin@firma.de")
    void transaction_commit_persistsChanges() throws Exception {
        var openRes = mvc().perform(post("/api/v1/admin/sql/sessions"))
                .andReturn().getResponse().getContentAsString();
        String sessionId = json.readTree(openRes).get("sessionId").asText();

        // Eine harmlose, idempotente Mutation
        mvc().perform(post("/api/v1/admin/sql/sessions/" + sessionId + "/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("CREATE TEMP TABLE t_commit_test (x INT)")))
                .andExpect(status().isOk());

        mvc().perform(post("/api/v1/admin/sql/sessions/" + sessionId + "/commit"))
                .andExpect(status().isNoContent());

        // Zweiter COMMIT auf dieselbe (geschlossene) Session → 409
        mvc().perform(post("/api/v1/admin/sql/sessions/" + sessionId + "/commit"))
                .andExpect(status().isConflict());
    }

    // ── Schema + History ─────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    void schema_listsAtLeastEmployeesTable() throws Exception {
        mvc().perform(get("/api/v1/admin/sql/schema"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tables[?(@.name == 'employees')]").exists());
    }

    @Test
    @WithMockUser(roles = "ADMIN", username = "history-test@firma.de")
    void history_includesPreviousQueries() throws Exception {
        mvc().perform(post("/api/v1/admin/sql/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("SELECT 1")))
                .andExpect(status().isOk());

        mvc().perform(get("/api/v1/admin/sql/history?limit=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].queryText").exists());
    }

    private long countAdminRows() throws Exception {
        var res = mvc().perform(post("/api/v1/admin/sql/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("SELECT COUNT(*) FROM app_users")))
                .andReturn().getResponse().getContentAsString();
        return json.readTree(res).get("rows").get(0).get(0).asLong();
    }
}
