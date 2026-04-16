# Deploy-Benachrichtigungen

Bei jedem Push auf den `main`-Branch schickt eine GitHub Action eine
E-Mail an alle aktiven Administrator(en) mit Commit-Info und der
vollständigen Deployment-Anleitung. So weiß jede/r Admin sofort,
dass ein Deployment ansteht.

---

## Architektur

```
git push → GitHub Action          Backend                 Admin-Postfächer
  (main)   notify-deploy.yml  →   /api/v1/notify/  →     SMTP →  admin1@…
                                  deployment-pending              admin2@…
```

### Komponenten

| Schicht         | Datei                                                                 |
|-----------------|-----------------------------------------------------------------------|
| GitHub Action   | `.github/workflows/notify-deploy.yml`                                 |
| Backend API     | `backend/.../controller/DeploymentNotificationController.java`        |
| Security-Freigabe | `backend/.../config/SecurityConfig.java` (Route ist `permitAll`)   |
| Admin-Lookup    | `UserRepository.findByRoleAndEnabledTrue(Role.ADMIN)`                 |
| Mail-Versand    | `JavaMailSender` (Spring Boot, nutzt `spring.mail.*` Env-Konfiguration) |
| Konfiguration   | `backend/src/main/resources/application.yml` → `app.deploy-notify.secret` |

### Authentifizierung

Der Endpunkt `/api/v1/notify/deployment-pending` ist nicht per JWT
geschützt, sondern per **Shared-Secret-Header** `X-Deploy-Secret`.

- Korrekter Header → 200, Mails werden verschickt
- Falscher Header → 401
- Secret leer (nicht konfiguriert) → 503 (feature disabled)

So muss die GitHub Action keinen Login durchführen — sie kennt nur
das gemeinsame Secret.

---

## Empfänger

Alle `AppUser` mit:
- `role = ADMIN`
- `enabled = true`

Kein separates Admin-Verzeichnis — Single Source of Truth ist die
User-Tabelle.  Wer einen Admin ergänzen oder entfernen will, ändert
das einfach über die normale Admin-Seite in der Anwendung.

---

## Einmalige Einrichtung

### 1. Secret generieren

Lokal auf irgendeinem Rechner:

```bash
openssl rand -hex 32
```

Das Ergebnis (64 Zeichen Hex) ist das **gemeinsame Secret**. An drei
Stellen identisch eintragen (Schritte 2 + 3).

### 2. GitHub Secrets setzen

**Repo** → Settings → Secrets and variables → Actions → *New repository secret*

| Name                   | Wert                                                         |
|------------------------|--------------------------------------------------------------|
| `DEPLOY_NOTIFY_URL`    | `https://em.cavdar.de/api/v1/notify/deployment-pending`      |
| `DEPLOY_NOTIFY_SECRET` | das in Schritt 1 generierte Secret                           |

### 3. Secret auf den VPS bringen

```bash
ssh vps
cd /opt/employeemanagement

# Secret in die .env ergänzen
echo "DEPLOY_NOTIFY_SECRET=<das-secret>" >> .env

# Backend neu starten, damit es die Env-Variable liest
docker compose up -d --build backend
```

### 4. Mail-Konfiguration prüfen

Damit Spring Boot Mails verschicken kann, müssen in der `.env` auf
dem VPS folgende Variablen gesetzt sein (werden auch vom vorhandenen
`NotificationService` genutzt):

```env
MAIL_HOST=smtp.gmail.com       # oder ein anderer SMTP-Server
MAIL_PORT=587
MAIL_USERNAME=noreply@…
MAIL_PASSWORD=…                # App-Passwort, kein Account-Passwort
```

### 5. Testen

Einen kleinen, harmlosen Commit pushen (z.B. Tippfehler in einer
MD-Datei korrigieren):

```bash
git commit -am "test: deploy-notify"
git push
```

Danach:
- In GitHub **Actions**-Tab sollte der Workflow *Notify admins on push* grün sein
- Alle aktiven Admins bekommen eine Mail mit Betreff
  `[EmployeeManagement] Deployment erforderlich: <sha7>`

---

## Inhalt der Mail

- Commit-SHA, Autor, Message, GitHub-URL
- Die 7 Schritte aus `DEPLOYMENT_VPS.md` (Kurzform), zum Mitkopieren
- Hinweis auf die vollständige Anleitung im Repo

---

## Troubleshooting

### Action läuft, aber keine Mail kommt an

1. **GitHub Actions-Log** öffnen und die Response vom Backend prüfen:
   - `HTTP 503` → `DEPLOY_NOTIFY_SECRET` auf dem VPS ist leer
   - `HTTP 401` → die beiden Secrets stimmen nicht überein
   - `HTTP 200` + `"sent": 0` → kein aktiver Admin in der DB
   - `HTTP 200` + `"sent": N` → Mail ist raus; dann Mail-Server prüfen

2. **Backend-Log** auf dem VPS anschauen:
   ```bash
   docker logs employeemanagement-backend --tail 50 | grep -i deploy
   ```

3. **SMTP-Auth-Fehler** (typisch bei Gmail): Es muss ein
   *App-Passwort* sein, nicht das normale Account-Passwort.
   Siehe auch `NotificationService` — er benutzt dieselbe Mail-Konfig.

### Action wird übersprungen (Warning)

> `DEPLOY_NOTIFY_URL oder DEPLOY_NOTIFY_SECRET nicht gesetzt — skip`

→ Schritt 2 (GitHub Secrets) wurde nie durchgeführt oder die Secret-
Namen sind anders geschrieben.

### Admin soll KEINE Mail bekommen

User auf `enabled = false` setzen (deaktivieren) oder Rolle ändern —
der Endpunkt filtert auf `role = ADMIN AND enabled = true`.

---

## Secret rotieren

Wenn das Secret geleakt wurde oder zur Routine erneuert werden soll:

1. Neues Secret generieren: `openssl rand -hex 32`
2. GitHub Secret `DEPLOY_NOTIFY_SECRET` aktualisieren
3. VPS `.env` aktualisieren + `docker compose up -d backend`
4. Testen mit einem harmlosen Commit

Zeitfenster zwischen Schritt 2 und 3 sollte klein sein — sonst
schlagen Pushes in dem Zeitraum mit HTTP 401 fehl (Mail kommt nicht,
Deployment bleibt aber möglich).

---

## Deaktivieren

Auf dem VPS die Env-Variable leeren:

```bash
sed -i 's/^DEPLOY_NOTIFY_SECRET=.*/DEPLOY_NOTIFY_SECRET=/' .env
docker compose up -d backend
```

Pushes werden danach mit `HTTP 503` beantwortet, keine Mails. Die
GitHub Action läuft weiter, bricht aber ab. Um den Workflow komplett
zu deaktivieren: `.github/workflows/notify-deploy.yml` löschen oder
in Repo-Settings → Actions den Workflow auf *Disabled* setzen.
