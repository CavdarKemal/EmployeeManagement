// Zentrale Rollenmatrix — muss mit backend SecurityConfig + Controller-
// @PreAuthorize konsistent bleiben.
//
// Rollen:
//   ADMIN  — alles
//   HR     — Mitarbeiter schreiben (POST/PUT /employees), Rest lesen
//   IT     — Hardware-Ausleihe (POST /loans), Rest lesen
//   VIEWER — nur Leserechte

const has = (user, ...roles) => user && roles.includes(user.role);

export const isAdmin         = (user) => has(user, "ADMIN");
export const isViewer        = (user) => has(user, "VIEWER");

// Mitarbeiter-Verwaltung
export const canWriteEmployees   = (user) => has(user, "ADMIN", "HR");
export const canDeleteEmployees  = (user) => has(user, "ADMIN");

// Hardware-Assets (Stammdaten)
export const canWriteHardware    = (user) => has(user, "ADMIN");
export const canDeleteHardware   = (user) => has(user, "ADMIN");

// Ausleihe (Loan)
export const canLoanHardware     = (user) => has(user, "ADMIN", "IT");

// Software-Assets (Stammdaten + Zuweisung)
export const canWriteSoftware    = (user) => has(user, "ADMIN");
export const canAssignSoftware   = (user) => has(user, "ADMIN");

// Import / Reports / Benachrichtigungen / Benutzer / Audit
export const canImport           = (user) => has(user, "ADMIN");
export const canSeeAuditLog      = (user) => has(user, "ADMIN");
export const canManageUsers      = (user) => has(user, "ADMIN");
export const canConfigNotifications = (user) => has(user, "ADMIN");
