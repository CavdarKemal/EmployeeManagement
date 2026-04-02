# EmployeeManagement — Technologie-Dokumentation

## Inhaltsverzeichnis
1. [Übersicht](#übersicht)
2. [Backend](#backend)
3. [Frontend](#frontend)
4. [Datenbank](#datenbank)
5. [Container & Docker](#container--docker)
6. [CI/CD & Dependency-Management](#cicd--dependency-management)
7. [Testing](#testing)
8. [Monitoring](#monitoring)
9. [Build-Umgebung (lokal)](#build-umgebung-lokal)
10. [Spring Boot 4 — Besonderheiten & bekannte Fallstricke](#spring-boot-4--besonderheiten--bekannte-fallstricke)

---

## Übersicht

| Schicht | Technologie | Version |
|---------|-------------|---------|
| Backend | Spring Boot | 4.0.5 |
| Backend Runtime | Java (Eclipse Temurin) | 21 (LTS) |
| Backend Framework | Spring Framework | 7.0.6 |
| Frontend | React | 18.3.1 |
| Frontend Build | Vite | 5.2 |
| Datenbank | PostgreSQL | 16-alpine |
| ORM | Hibernate | 7.2.7.Final |
| Container | Docker + Docker Compose | — |
| CI/CD | GitHub Actions | — |

---

## Backend

### Spring Boot 4.0.5 (Java 21)

Spring Boot 4 ist die erste Major-Version seit Spring Boot 3 (2022) und baut auf **Spring Framework 7** auf.
Gegenüber Spring Boot 3 gibt es wesentliche strukturelle Änderungen — siehe Abschnitt [Spring Boot 4 Besonderheiten](#spring-boot-4--besonderheiten--bekannte-fallstricke).

### Abhängigkeiten

| Artefakt | Version | Zweck |
|----------|---------|-------|
| `spring-boot-starter-web` | 4.0.5 (managed) | REST-API, Tomcat 11 |
| `spring-boot-starter-actuator` | 4.0.5 (managed) | Health-Endpoint `/actuator/health` |
| `spring-boot-starter-data-jpa` | 4.0.5 (managed) | JPA / Hibernate-Integration |
| `spring-boot-starter-security` | 4.0.5 (managed) | Spring Security 7 |
| `spring-boot-starter-validation` | 4.0.5 (managed) | Jakarta Validation |
| `spring-boot-flyway` | 4.0.5 (managed) | Flyway Auto-Configuration **\*** |
| `flyway-database-postgresql` | 11.14.1 (managed) | PostgreSQL-Treiber für Flyway 11 |
| `postgresql` (JDBC) | managed | PostgreSQL JDBC-Treiber |
| `jjwt-api / jjwt-impl / jjwt-jackson` | 0.12.6 | JWT-Erzeugung und -Validierung |
| `mapstruct` | 1.5.5.Final | Entity ↔ DTO-Mapping via Codegenerierung |
| `lombok` | managed | Boilerplate-Reduzierung (@Data, @Builder …) |
| `springdoc-openapi-starter-webmvc-ui` | 3.0.0 | Swagger UI + OpenAPI 3.1 **\*\*** |
| `commons-io` | 2.16.1 | Datei-Upload-Hilfsmethoden |
| `spring-boot-starter-test` | 4.0.5 (managed) | JUnit 5, Mockito, AssertJ |
| `spring-security-test` | managed | @WithMockUser, SecurityMockMvc |
| `testcontainers` (junit-jupiter + postgresql) | 1.21.4 | Echte PostgreSQL in Integrationstests |

> **\*** `spring-boot-flyway` ist in Spring Boot 4 ein **eigenes Modul** — es reicht nicht mehr, nur `flyway-core` einzubinden.
> **\*\*** SpringDoc 3.x ist für Spring Boot 4 erforderlich; SpringDoc 2.x ist nicht kompatibel.

### Schichtenarchitektur

```
Controller  →  Service  →  Repository (Spring Data JPA)
                  ↓
              Mapper (MapStruct)  ←→  DTO / Entity
```

### Paketstruktur

```
com.employeemanagement/
├── config/
│   ├── SecurityConfig.java          # Spring Security, JWT-Filter, CORS
│   ├── PasswordEncoderConfig.java   # BCryptPasswordEncoder (eigene Klasse — Circular-Dependency-Vermeidung)
│   ├── JwtConfig.java               # JWT-Properties (@ConfigurationProperties)
│   ├── JwtAuthFilter.java           # OncePerRequestFilter
│   └── SwaggerConfig.java           # OpenAPI-Beschreibung
├── model/                           # JPA-Entities
├── dto/                             # Data Transfer Objects
├── repository/                      # Spring Data JPA Repositories
├── service/                         # Business Logic
├── controller/                      # REST-Controller
├── mapper/                          # MapStruct-Interfaces
└── exception/                       # GlobalExceptionHandler, Custom Exceptions
```

### Sicherheit

- **Authentifizierung:** JWT (Bearer Token), gültig 24 Stunden (konfigurierbar)
- **Autorisierung:** Role-Based Access Control via `@PreAuthorize` und `HttpSecurity`
- **Rollen:** `ADMIN`, `HR`, `IT`, `VIEWER`
- **Passwort-Hashing:** BCrypt (Stärke 12)

### API-Endpunkte (Übersicht)

| Prefix | Controller | Zugriff |
|--------|-----------|---------|
| `POST /api/v1/auth/login` | AuthController | public |
| `/api/v1/employees/**` | EmployeeController | HR, ADMIN (Schreiben); alle (Lesen) |
| `/api/v1/hardware/**` | HardwareController | IT, ADMIN (Schreiben); alle (Lesen) |
| `/api/v1/software/**` | SoftwareController | IT, ADMIN (Schreiben); alle (Lesen) |
| `/api/v1/loans/**` | LoanController | IT, ADMIN |
| `/api/v1/admin/users/**` | UserController | ADMIN only |
| `/actuator/health` | Spring Actuator | public |
| `/swagger-ui.html` | SpringDoc | public |
| `/api-docs` | SpringDoc | public |

### Datenbank-Migrationen (Flyway)

| Version | Datei | Inhalt |
|---------|-------|--------|
| V1 | `V1__create_employees.sql` | Tabelle `employees` |
| V2 | `V2__create_hardware.sql` | Tabelle `hardware` + Enum `hardware_status` |
| V3 | `V3__create_software_and_loans.sql` | Tabellen `software`, `loans`, `software_assignments` |
| V4 | `V4__insert_test_data.sql` | Demo-Datensätze (3 Mitarbeiter, 3 Hardware, 3 Software) |
| V5 | `V5__create_users.sql` | Tabelle `app_users` + Standard-Admin |

Standard-Admin: `admin@firma.de` / `admin123`

---

## Frontend

### React 18.3 + Vite 5.2

Reine Single-Page-Application ohne Router-Library — Navigation per `useState` im Shell-Component.

### Abhängigkeiten

| Paket | Version | Zweck |
|-------|---------|-------|
| `react` + `react-dom` | 18.3.1 | UI-Framework |
| `vite` | 5.2 | Dev-Server, Build-Tool (ESBuild + Rollup) |
| `@vitejs/plugin-react` | 4.3 | Fast Refresh, JSX-Transformation |
| `vitest` | 1.6 | Unit-Test-Runner (Vite-native) |
| `@testing-library/react` | 16.0 | React-Komponenten-Tests |
| `@testing-library/jest-dom` | 6.4 | Custom DOM-Matcher |
| `@playwright/test` | 1.44 | E2E-Tests |
| `jsdom` | 24.1 | DOM-Emulation für Vitest |

### Komponentenstruktur

```
src/
├── api/index.js              # Fetch-Wrapper (GET/POST/PUT/DELETE + JWT)
├── context/AuthContext.jsx   # Login-State, JWT-Verwaltung im localStorage
├── components/               # Atomare UI-Komponenten
│   ├── tokens.js             # Design-Tokens (Farben, Abstände, Schatten)
│   ├── Avatar.jsx            # Initialen-Avatar
│   ├── Badge.jsx             # Status-Label
│   ├── Button.jsx            # Btn (primary/secondary/danger/ghost)
│   ├── Card.jsx              # Surface mit Schatten
│   ├── Input.jsx             # Labeled Input mit Error
│   ├── Modal.jsx             # Overlay-Dialog
│   ├── Select.jsx            # Labeled Select
│   └── Toast.jsx             # Benachrichtigung (unten rechts)
├── pages/
│   ├── LoginPage.jsx         # Email + Passwort, Demo-Fallback auf Mock-Daten
│   ├── Dashboard.jsx         # KPI-Karten, Abteilungs- und Lizenzbalken
│   ├── EmployeesPage.jsx     # Master-Detail, CRUD, Foto-Upload
│   ├── HardwarePage.jsx      # Tabelle, Ausleihe/Rückgabe-Dialog
│   ├── SoftwarePage.jsx      # Lizenz-Karten, Zuweisungs-Modal
│   └── AdminPage.jsx         # Benutzerverwaltung (nur ADMIN)
├── App.jsx                   # Shell: Sidebar, Header, Page-Routing per State
└── main.jsx                  # ReactDOM.createRoot + AuthProvider
```

### API-Kommunikation

- JWT wird nach Login im `localStorage` gespeichert
- Alle API-Requests senden `Authorization: Bearer <token>`
- Bei `401`-Antwort wird automatisch ausgeloggt
- Offline-Fallback: Mock-Daten wenn Backend nicht erreichbar

---

## Datenbank

### PostgreSQL 16-alpine

| Parameter | Wert |
|-----------|------|
| Image | `postgres:16-alpine` |
| Port (Host) | 5432 |
| Datenbank | `employeemanagement` |
| Schema | `public` |
| Migrations-Tool | Flyway 11.14.1 |
| Connection-Pool | HikariCP (max 10) |

### Datenbankschema (Übersicht)

```
employees           ← Mitarbeiterstammdaten
hardware            ← IT-Geräte mit Status-Enum
software            ← Lizenzen (total/used)
loans               ← Hardware-Ausleihen (employee ↔ hardware)
software_assignments← Lizenzzuweisungen (employee ↔ software)
app_users           ← Benutzeraccounts mit Rollen
flyway_schema_history← Flyway-Migrationsstatus
```

---

## Container & Docker

### Images

| Service | Basis-Image | Build-Art | Größe (ca.) |
|---------|-------------|-----------|-------------|
| `postgres` | `postgres:16-alpine` | pull | ~80 MB |
| `backend` | `maven:3.9-eclipse-temurin-21` → `eclipse-temurin:21-jre-alpine` | Multi-Stage | ~250 MB |
| `frontend` | `node:20-alpine` → `nginx:1.25-alpine` | Multi-Stage | ~30 MB |

### Backend Dockerfile (4 Stages)

| Stage | Basis | Zweck |
|-------|-------|-------|
| `build` | `maven:3.9-eclipse-temurin-21` | Maven-Build, JAR erzeugen |
| `test` | `build` | Tests gegen externe DB (test-compose) |
| `development` | `eclipse-temurin:21-jre` | DevTools + Remote-Debug Port 5005 |
| `production` | `eclipse-temurin:21-jre-alpine` | Minimales Image, Non-Root-User |

### Docker Compose Files

| Datei | Zweck |
|-------|-------|
| `docker-compose.yml` | Produktion: postgres + backend + frontend |
| `docker-compose.dev.yml` | Override: Hot-Reload, Debug-Port 5005, Vite DevServer |
| `docker-compose.test.yml` | Isolierte Testumgebung, PostgreSQL auf Port 5433 |
| `monitoring/docker-compose.monitoring.yml` | Prometheus + Grafana + Loki + Alertmanager |

### Ports (Produktion)

| Service | Container-Port | Host-Port |
|---------|---------------|-----------|
| PostgreSQL | 5432 | 5432 |
| Backend | 8080 | **8082** (8080 auf diesem System belegt) |
| Frontend (nginx) | 80 | 3000 |

### Konfiguration (.env)

```env
POSTGRES_DB=employeemanagement
POSTGRES_USER=employeemanagement
POSTGRES_PASSWORD=...
JWT_SECRET=...         # mind. 32 Zeichen
JWT_EXPIRATION_MS=86400000
VITE_API_BASE_URL=http://localhost:8082/api/v1
```

---

## CI/CD & Dependency-Management

### GitHub Actions (`.github/workflows/ci-cd.yml`)

| Stage | Trigger | Aufgabe |
|-------|---------|---------|
| Backend Tests | push `main`/`develop` | JUnit 5, JaCoCo Coverage, PostgreSQL via Service-Container |
| Frontend Tests | push `main`/`develop` | Vitest, ESLint, Vite-Build |
| Security Scan | push `main`/`develop` | OWASP Dependency-Check, Trivy Filesystem |
| Docker Build | push `main`/`develop` | Multi-Arch Build (amd64 + arm64), GHCR Push, Trivy Image Scan |
| Deploy Staging | push `develop` | SSH-Deploy, Smoke-Test |
| Deploy Produktion | push `main` | DB-Backup, Rolling Update, Rollback bei Fehler, Slack-Notification |

### Dependabot (`.github/dependabot.yml`)

Automatische Dependency-Updates für:
- Maven (Backend) — wöchentlich montags
- npm (Frontend) — wöchentlich montags
- Docker Images — dienstags
- GitHub Actions — mittwochs

Patch- und Minor-Updates werden automatisch gemergt (via `dependabot-auto-merge.yml`).
Major-Updates erhalten das Label `major-update` und müssen manuell reviewt werden.

### Renovate (`renovate.json`)

Ergänzt Dependabot mit:
- Semantischen Commit-Messages (`chore(deps): update ...`)
- Monatlicher Lockfile-Wartung
- Priorisierung von Security-Vulnerabilities
- Digest-Pinning für Docker-Images

---

## Testing

### Backend

| Framework | Version | Zweck |
|-----------|---------|-------|
| JUnit 5 | managed | Test-Framework |
| Mockito | managed | Mocking |
| AssertJ | managed | Fluent Assertions |
| Spring Security Test | managed | `@WithMockUser`, MockMvc + Security |
| Testcontainers | 1.21.4 | Echte PostgreSQL in Integrationstests |

**Testklassen:**
- `EmployeeServiceTest` — Unit-Tests mit Mock-Repositories
- `LoanServiceTest` — Unit-Tests Ausleih-Logik
- `EmployeeControllerIT` — Integrationstest mit Testcontainers + WebApplicationContext

> **Spring Boot 4 Hinweis:** `@AutoConfigureMockMvc` wurde entfernt.
> MockMvc wird jetzt über `MockMvcBuilders.webAppContextSetup(wac).apply(springSecurity()).build()` konfiguriert.

### Frontend

| Framework | Version | Zweck |
|-----------|---------|-------|
| Vitest | 1.6 | Unit-/Komponenten-Tests |
| @testing-library/react | 16.0 | Komponenten-Rendering und Interaktion |
| jsdom | 24.1 | DOM-Emulation |

### E2E-Tests (Playwright)

| Datei | Inhalt |
|-------|--------|
| `e2e/playwright.config.ts` | Konfiguration: Chromium, Firefox, WebKit |
| `e2e/pages/*.ts` | Page Object Model |
| `e2e/tests/auth.spec.ts` | Login, geschützte Routen |
| `e2e/tests/employees.spec.ts` | Mitarbeiterliste, Suche, Detail |
| `e2e/tests/hardware.spec.ts` | Ausleihe/Rückgabe-Workflow |
| `e2e/tests/software.spec.ts` | Lizenz-Zuweisung, Auslastung |

---

## Monitoring

### Stack (`monitoring/docker-compose.monitoring.yml`)

| Tool | Version | Port | Aufgabe |
|------|---------|------|---------|
| Prometheus | latest | 9090 | Metriken-Sammlung und -Speicherung |
| Grafana | latest | 3001 | Dashboards und Visualisierung |
| Loki | latest | 3100 | Log-Aggregation |
| Promtail | latest | 9080 | Log-Shipping (Container → Loki) |
| Alertmanager | latest | 9093 | Alert-Routing (Slack, E-Mail) |
| postgres-exporter | latest | 9187 | PostgreSQL-Metriken für Prometheus |
| node-exporter | latest | 9100 | Server-Metriken (CPU, RAM, Disk) |

### Spring Boot Actuator / Micrometer

- Metrics-Endpoint: `/actuator/prometheus`
- Health-Endpoint: `/actuator/health` (öffentlich)
- Custom Business-Metriken: `caems.loans.total`, `caems.loans.active`, `caems.licenses.usage_percent`

### Alert-Regeln (Auswahl)

| Alert | Schwelle | Kritikalität |
|-------|---------|--------------|
| BackendDown | > 0s | critical |
| HighErrorRate | > 5% (5 min) | critical |
| HighLatencyP99 | > 2000ms | warning |
| JvmHeapHigh | > 85% | warning |
| DiskSpaceLow | < 15% | critical |
| LicenseCapacityHigh | > 95% | warning |

---

## Build-Umgebung (lokal)

### Voraussetzungen

| Tool | Version | Verwendung |
|------|---------|-----------|
| Java (Eclipse Temurin) | 21 | Backend-Kompilierung und -Start |
| Maven | 4.0.0 | Backend-Build (`ci.cmd 21`) |
| Node.js | 20 | Frontend-Entwicklung |
| Docker Desktop | aktuell | Container-Betrieb |

### Build-Befehle

```bash
# Backend bauen (lokal, ohne Tests)
ci.cmd 21

# Backend bauen (mit Tests)
cit.cmd 21

# Frontend lokal starten
cd frontend && npm install && npm run dev

# Alle Container starten (Produktion)
docker compose up --build -d

# Alle Container starten (Dev-Modus mit Hot-Reload)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Monitoring-Stack starten
cd monitoring && docker compose -f docker-compose.monitoring.yml up -d
```

### Lokale URLs

| Dienst | URL |
|--------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8082/api/v1 |
| Swagger UI | http://localhost:8082/swagger-ui.html |
| OpenAPI JSON | http://localhost:8082/api-docs |
| Health | http://localhost:8082/actuator/health |
| Grafana | http://localhost:3001 |
| Prometheus | http://localhost:9090 |

---

## Spring Boot 4 — Besonderheiten & bekannte Fallstricke

Spring Boot 4 bringt gegenüber Spring Boot 3 wichtige strukturelle Änderungen mit.
Die folgenden Punkte sind Lessons Learned aus dem Aufbau dieses Projekts.

### 1. Auto-Configuration ist modularisiert

In Spring Boot 4 wurden viele Auto-Configurations aus `spring-boot-autoconfigure` in separate Module ausgelagert.
Diese Module müssen explizit als Dependency deklariert werden.

| Feature | Spring Boot 3 | Spring Boot 4 |
|---------|--------------|--------------|
| Flyway | `flyway-core` reicht | **`spring-boot-flyway`** erforderlich |
| Liquibase | `liquibase-core` reicht | `spring-boot-liquibase` erforderlich |
| Actuator | `spring-boot-starter-actuator` | weiterhin `spring-boot-starter-actuator` |

### 2. SpringDoc: Version 3.x für Spring Boot 4

`springdoc-openapi 2.x` ist **nicht kompatibel** mit Spring Boot 4.
Es muss `springdoc-openapi 3.0.0` oder höher verwendet werden.

```xml
<!-- Falsch für Spring Boot 4: -->
<version>2.5.0</version>

<!-- Richtig: -->
<version>3.0.0</version>
```

### 3. Lombok + MapStruct: Reihenfolge der Annotation Processors

Lombok muss in den `annotationProcessorPaths` **vor** MapStruct stehen, damit MapStruct die
von Lombok generierten Getter/Setter sieht. Zusätzlich ist `lombok-mapstruct-binding` erforderlich:

```xml
<annotationProcessorPaths>
    <path><!-- lombok --></path>
    <path><!-- lombok-mapstruct-binding 0.2.0 --></path>
    <path><!-- mapstruct-processor --></path>
</annotationProcessorPaths>
```

### 4. `@AutoConfigureMockMvc` entfernt

Die Annotation `@AutoConfigureMockMvc` aus `spring-boot-test-autoconfigure` existiert in Spring Boot 4 nicht mehr.
Stattdessen: MockMvc manuell über `WebApplicationContext` konfigurieren.

```java
// Spring Boot 3:
@AutoConfigureMockMvc
class MyTest { @Autowired MockMvc mockMvc; }

// Spring Boot 4:
class MyTest {
    @Autowired WebApplicationContext wac;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(wac)
                .apply(springSecurity()).build();
    }
}
```

### 5. Zirkuläre Abhängigkeiten durch Security-Beans

`SecurityConfig` injiziert `UserDetailsService` (= `UserService`).
`UserService` injiziert `PasswordEncoder` (= Bean in `SecurityConfig`).
→ **Circular Dependency.**

Lösung: `PasswordEncoder`-Bean in eine eigene Konfigurationsklasse auslagern (`PasswordEncoderConfig`).

### 6. Actuator-Endpoints und Spring Security

`/actuator/health` wird standardmäßig durch Spring Security geschützt (HTTP 403).
Die Endpunkte müssen explizit freigegeben werden:

```java
.requestMatchers("/actuator/health", "/actuator/info").permitAll()
```

### 7. Alpine-Images: `curl` nicht verfügbar

Docker Health Checks mit `curl` schlagen in Alpine-basierten Images fehl.
`wget` (BusyBox) ist verfügbar und muss stattdessen verwendet werden:

```yaml
# Falsch (curl fehlt in Alpine):
test: ["CMD-SHELL", "curl -f http://localhost:8080/actuator/health || exit 1"]

# Richtig:
test: ["CMD-SHELL", "wget -qO- http://localhost:8080/actuator/health || exit 1"]
```
