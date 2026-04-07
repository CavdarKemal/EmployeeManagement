# Deployment-Anleitung: EmployeeManagement auf Hetzner Cloud

**Live-URL:** https://em.cavdar.de  
**Server:** Hetzner CX23 — 2 vCPU, 4 GB RAM, 40 GB SSD, ~4,75 €/Monat  
**Standort:** Nürnberg, Deutschland  

---

## Was ist ein Deployment überhaupt?

Wenn du eine App auf deinem PC entwickelst, läuft sie nur bei dir. "Deployment" bedeutet:
die App auf einen Server im Internet kopieren, sodass sie jeder über eine URL aufrufen kann.

Bei dieser App bedeutet das: drei Docker-Container (Datenbank, Backend, Frontend) auf einem
Linux-Server zum Laufen bringen, und den Zugriff über `em.cavdar.de` mit HTTPS absichern.

---

## Die Architektur im Überblick

```
Browser (du oder jemand anderes)
    │
    ▼ https://em.cavdar.de
┌─────────────────────────────────────┐
│  Hetzner VPS (Linux-Server)         │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Nginx (Türsteher)          │    │
│  │  Port 80 (HTTP) → HTTPS     │    │
│  │  Port 443 (HTTPS) → :3000   │    │
│  └──────────────┬──────────────┘    │
│                 │                   │
│  ┌──────────────▼──────────────┐    │
│  │  Docker-Netzwerk            │    │
│  │  ┌─────────┐  ┌──────────┐  │    │
│  │  │Frontend │  │ Backend  │  │    │
│  │  │  :3000  │→ │  :8080   │  │    │
│  │  └─────────┘  └────┬─────┘  │    │
│  │              ┌─────▼──────┐ │    │
│  │              │ PostgreSQL │ │    │
│  │              │   :5432    │ │    │
│  │              └────────────┘ │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Nginx** ist der "Türsteher": Er nimmt alle Anfragen von außen entgegen und leitet sie
an den richtigen Container weiter. Er kümmert sich auch um HTTPS.

**Docker** kapselt jeden Teil der App in einen isolierten Container — wie Schachteln
in einer Schachtel. Die Container kommunizieren intern miteinander, sind aber nach
außen nicht direkt erreichbar (außer über Nginx).

---

## Schritt 0 — Hetzner Server erstellen

### Was ist Hetzner?
Hetzner ist ein deutsches Unternehmen, das Server vermietet. Statt einen eigenen
Rechner zu betreiben, mietest du bei Hetzner einen virtuellen Server (VPS = Virtual
Private Server) — ein Linux-System mit eigener IP-Adresse.

### Warum Hetzner und nicht cloud86?
cloud86 bietet nur "Shared Hosting" an — das ist wie ein Zimmer in einer WG.
Docker braucht aber einen eigenen Rechner (VPS) — wie eine eigene Wohnung.
Hetzner kostet dafür ~4,75 €/Monat statt 189 € bei cloud86.

### Server anlegen
1. Account: **hetzner.com/cloud** → „Cloud" → „Jetzt starten"
2. Projekt: `employeemanagement`
3. Server-Einstellungen:
   - **Standort:** Nürnberg (Deutschland, DSGVO-konform)
   - **Image:** Ubuntu 24.04 (Linux-Betriebssystem)
   - **Typ:** CX23 (2 vCPU, 4 GB RAM) — reicht für 2–3 Apps
   - **SSH-Key:** eigenen öffentlichen Key eintragen (see unten)
   - **Name:** `employeemanagement`

### SSH-Key — was ist das?
SSH ist wie ein Schlüssel für die Haustür des Servers. Statt eines Passworts
(das man erraten könnte) nutzt man ein Schlüsselpaar:
- **Privater Key** (~/.ssh/id_ed25519): bleibt auf deinem PC, nie weitergeben!
- **Öffentlicher Key** (~/.ssh/id_ed25519.pub): wird auf den Server hochgeladen

```powershell
# Öffentlichen Key anzeigen (in PowerShell):
cat C:\Users\CavdarK\.ssh\id_ed25519.pub
```

### DNS-Eintrag setzen (Plesk bei cloud86)
Der DNS-Eintrag sagt dem Internet: "em.cavdar.de ist unter dieser IP-Adresse erreichbar."
- Plesk → cavdar.de → DNS-Einstellungen → A-Record hinzufügen:
  - Name: `em`
  - Wert: `94.130.228.157` (Hetzner-IP)

---

## Schritt 1 — VPS absichern

### Warum absichern?
Ein frischer Server ist wie eine Wohnung mit offener Haustür. Bots scannen das
Internet ständig nach verwundbaren Servern. Deshalb:
- Neuen User `deploy` anlegen (kein Arbeiten als root)
- Firewall einschalten

```bash
# Einloggen als root
ssh root@94.130.228.157

# System aktualisieren (Sicherheitslücken schließen)
apt update && apt upgrade -y

# Nach Update: Neustart nötig
reboot

# Neuen User anlegen — "root" hat zu viele Rechte für den Alltag
adduser deploy
usermod -aG sudo deploy   # sudo = darf root-Befehle mit Passwort ausführen

# SSH-Key vom root-User übernehmen
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh && chmod 600 /home/deploy/.ssh/authorized_keys

# Firewall: nur SSH (22), HTTP (80) und HTTPS (443) erlauben
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

---

## Schritt 2 — Docker installieren

### Was ist Docker?
Docker ist eine Software, die Anwendungen in "Container" verpackt. Ein Container
enthält alles, was die App braucht: Code, Laufzeitumgebung, Bibliotheken.

Vorteile:
- Läuft überall gleich (lokal wie auf dem Server)
- Verschiedene Apps stören sich nicht gegenseitig
- Einfach starten, stoppen, aktualisieren

```bash
# Offizielles Docker-Installationsscript
curl -fsSL https://get.docker.com | sh

# deploy-User darf Docker nutzen (sonst muss man immer sudo schreiben)
usermod -aG docker deploy

# Neu einloggen als deploy
su - deploy

# Test
docker --version
docker compose version
```

---

## Schritt 3 — App einrichten

```bash
# Verzeichnisse anlegen
sudo mkdir -p /opt/employeemanagement /opt/backups/employeemanagement
sudo chown -R deploy:deploy /opt/employeemanagement /opt/backups

# Code vom GitHub holen
git clone https://github.com/CavdarKemal/EmployeeManagement.git /opt/employeemanagement
```

### Die .env Datei — was ist das?
Die `.env`-Datei enthält geheime Konfigurationswerte (Passwörter, Schlüssel),
die nicht im Code stehen dürfen. Die Datei wird nie in Git eingecheckt!

```bash
cp /opt/employeemanagement/.env.example /opt/employeemanagement/.env
nano /opt/employeemanagement/.env
```

```env
POSTGRES_DB=employeemanagement
POSTGRES_USER=employeemanagement
POSTGRES_PASSWORD=SicheresPasswortHier!        # mindestens 20 Zeichen

JWT_SECRET=ZufaelligerStringMindestens32Zeichen!  # openssl rand -base64 48
JWT_EXPIRATION_MS=86400000                     # Token läuft nach 24h ab

VITE_API_BASE_URL=https://em.cavdar.de/api/v1  # echte Domain!
```

```bash
# .env vor fremden Augen schützen (nur deploy darf lesen)
chmod 600 /opt/employeemanagement/.env
```

---

## Schritt 4 — Nginx einrichten

### Was ist Nginx hier?
Nginx läuft direkt auf dem Server (nicht in Docker) und ist der erste Empfänger
aller Anfragen. Er:
- Leitet HTTP (Port 80) auf HTTPS (Port 443) um
- Terminiert SSL (verschlüsselt/entschlüsselt HTTPS)
- Leitet Anfragen an den Frontend-Container (Port 3000) weiter

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Konfiguration `/etc/nginx/sites-available/em.cavdar.de`:

```nginx
server {
    listen 80;
    server_name em.cavdar.de;

    location / {
        proxy_pass         http://localhost:3000;   # → Frontend-Container
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

```bash
# Konfiguration aktivieren
sudo ln -s /etc/nginx/sites-available/em.cavdar.de /etc/nginx/sites-enabled/
sudo nginx -t          # Syntax prüfen
sudo systemctl reload nginx
```

---

## Schritt 5 — HTTPS / SSL einrichten

### Was ist Let's Encrypt?
Let's Encrypt ist eine kostenlose Zertifizierungsstelle. Sie stellt SSL-Zertifikate
aus, die dem Browser beweisen: "Diese Seite ist wirklich em.cavdar.de und die
Verbindung ist verschlüsselt." Ohne Zertifikat würde der Browser "Nicht sicher" anzeigen.

```bash
# Zertifikat automatisch holen und Nginx-Konfiguration anpassen
sudo certbot --nginx -d em.cavdar.de

# Certbot erneuert das Zertifikat automatisch alle 90 Tage
# Test:
sudo certbot renew --dry-run
```

---

## Schritt 6 — App starten

```bash
cd /opt/employeemanagement

# Container bauen und starten
# -f docker-compose.yml          → Basis-Konfiguration
# -f docker-compose.prod.yml     → Produktions-Overrides (kein DB-Port nach außen)
# -d                             → im Hintergrund laufen (detached)
# --build                        → Images neu bauen
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Status prüfen
```bash
docker compose ps
# Alle drei Container sollen "healthy" zeigen:
# employeemanagement-postgres   healthy
# employeemanagement-backend    healthy
# employeemanagement-frontend   healthy
```

---

## App aktualisieren (nach Code-Änderungen)

```bash
cd /opt/employeemanagement

# Neuesten Code holen
git pull

# Container neu bauen und starten (läuft ohne Downtime)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Alte Images aufräumen (spart Speicherplatz)
docker image prune -f
```

---

## Automatische Backups einrichten

```bash
# Backup-Script erstellen
sudo nano /opt/backups/backup.sh
```

```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/employeemanagement"

# PostgreSQL Dump — komplette Datenbank als SQL-Datei sichern
docker exec employeemanagement-postgres \
  pg_dump -U employeemanagement employeemanagement \
  > "$BACKUP_DIR/db_$TIMESTAMP.sql"

# Alte Backups löschen (älter als 7 Tage)
find "$BACKUP_DIR" -name "db_*.sql" -mtime +7 -delete

echo "Backup abgeschlossen: db_$TIMESTAMP.sql"
```

```bash
chmod +x /opt/backups/backup.sh

# Cron-Job: täglich um 3:00 Uhr ausführen
# Cron ist ein Linux-Dienst für geplante Aufgaben
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/backups/backup.sh >> /var/log/em-backup.log 2>&1") | crontab -
```

---

## GitHub Actions — automatisches Deployment (optional)

Nach jedem `git push` auf `main` kann GitHub automatisch:
1. Tests ausführen
2. Docker-Images bauen
3. Per SSH auf den Server deployen

Dafür müssen in GitHub (Settings → Secrets → Actions) folgende Werte hinterlegt sein:

| Secret | Wert |
|--------|------|
| `PROD_HOST` | `94.130.228.157` |
| `PROD_USER` | `deploy` |
| `PROD_SSH_KEY` | Inhalt von `~/.ssh/id_ed25519` (privater Key!) |
| `VITE_API_BASE_URL` | `https://em.cavdar.de/api/v1` |

---

## Nützliche Befehle

```bash
# Status aller Container
docker compose ps

# Logs anzeigen (Ctrl+C zum Beenden)
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres

# In die Datenbank einloggen
docker exec -it employeemanagement-postgres psql -U employeemanagement

# RAM-Verbrauch der Container
docker stats --no-stream

# Freier Speicherplatz auf dem Server
df -h

# Alle Container neu starten
docker compose restart

# Alles stoppen (App offline)
docker compose down

# Alles stoppen + Datenbank-Volume löschen (ACHTUNG: alle Daten weg!)
docker compose down -v
```

---

## Kosten-Übersicht

| Position | Kosten |
|----------|--------|
| Hetzner CX23 | ~4,75 €/Monat |
| Domain cavdar.de (cloud86) | bleibt wie gehabt |
| SSL-Zertifikat (Let's Encrypt) | kostenlos |
| **Gesamt** | **~4,75 €/Monat** |

---

## Glossar

| Begriff | Erklärung |
|---------|-----------|
| **VPS** | Virtual Private Server — gemieteter Linux-Server mit Root-Zugriff |
| **Root** | Administrator-Account auf Linux — darf alles |
| **SSH** | Verschlüsseltes Terminal-Protokoll zum Einloggen auf Server |
| **Docker** | Software zum Verpacken und Starten von Apps in Containern |
| **Container** | Isolierte Laufzeitumgebung für eine App |
| **Nginx** | Webserver und Reverse Proxy — verteilt Anfragen |
| **Reverse Proxy** | Vermittler zwischen Internet und internen Diensten |
| **SSL/TLS** | Verschlüsselungsprotokoll für HTTPS |
| **Let's Encrypt** | Kostenloser Anbieter von SSL-Zertifikaten |
| **DNS** | Übersetzt Domainnamen in IP-Adressen |
| **A-Record** | DNS-Eintrag: Domain → IP-Adresse |
| **Firewall (UFW)** | Blockiert unerwünschte Netzwerkverbindungen |
| **Cron** | Linux-Dienst für geplante, automatische Aufgaben |
| **.env** | Datei mit geheimen Konfigurationswerten (nie in Git!) |

---

*Erstellt: 2026-04-03 | Erfolgreich deployed: 2026-04-03 | Projekt: EmployeeManagement*




Manuell auf dem Hetzner-Server ausführen:                                                                             
  cd /opt/employeemanagement                                                                                            
  # Backup der Datenbank
  docker exec employeemanagement-postgres pg_dump -U employeemanagement employeemanagement \
    > /opt/backups/employeemanagement_$(date +%Y%m%d_%H%M%S).sql

  # Neue Images ziehen (aus GHCR, die CI hat diese schon gebaut)
  docker compose pull backend frontend

  # Rolling Update
  docker compose up -d --no-deps backend
  sleep 20

  # Health-Check
  curl -s http://localhost:8080/actuator/health

  # Wenn "UP" → Frontend hochziehen
  docker compose up -d --no-deps frontend
