# Deployment-Anleitung: EmployeeManagement auf Hetzner Cloud

**Ziel:** App unter `em.cavdar.de` erreichbar machen  
**Hoster:** Hetzner Cloud (hetzner.com/cloud) — ~4 €/Monat  
**Domain bleibt bei cloud86** — nur DNS-Eintrag wird angepasst

---

## Schritt 0 — Hetzner Server erstellen (einmalig)

1. Account anlegen: **hetzner.com/cloud** → „Cloud" → „Jetzt starten"
2. Neues Projekt anlegen: z.B. `employeemanagement`
3. Server hinzufügen:
   - **Standort:** Nürnberg oder Falkenstein (Deutschland)
   - **Image:** Ubuntu 24.04
   - **Typ:** `CX22` (2 vCPU, 4 GB RAM, 40 GB SSD) — ~4,15 €/Monat
   - **SSH-Key:** Deinen öffentlichen Key einfügen (siehe unten)
   - **Firewall:** Noch keine — richten wir im nächsten Schritt ein
4. Server erstellen → **IP-Adresse** notieren (z.B. `1.2.3.4`)

**SSH-Key generieren (auf deinem Windows-PC, falls noch nicht vorhanden):**
```powershell
# In PowerShell oder Git Bash ausführen
ssh-keygen -t ed25519 -C "cavdar.de-deployment"
# Öffentlichen Key anzeigen (für Hetzner-Konsole kopieren):
cat ~/.ssh/id_ed25519.pub
```

**DNS-Eintrag in Plesk (cloud86) setzen:**
- Plesk → Domains → cavdar.de → DNS-Einstellungen
- Neuen A-Record anlegen: `em` → `<HETZNER-IP>`
- DNS-Propagierung dauert 5–60 Minuten

---

## Schritt 1 — VPS absichern (einmalig)

```bash
# Als root einloggen (Hetzner liefert den Server mit root + deinem SSH-Key)
ssh root@<HETZNER-IP>

# System aktualisieren
apt update && apt upgrade -y

# Neuen Deployment-User anlegen (kein root im Betrieb)
adduser deploy
usermod -aG sudo deploy

# SSH-Key für deploy-User übernehmen
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh && chmod 600 /home/deploy/.ssh/authorized_keys

# Root-Login per SSH deaktivieren
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart sshd

# Firewall einrichten (Hetzner hat auch eine Cloud-Firewall — aber UFW zusätzlich)
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable

# Testen: In neuem Terminal einloggen als deploy
# ssh deploy@<HETZNER-IP>
```

---

## Schritt 2 — Docker installieren (einmalig)

```bash
# Als deploy-User einloggen
ssh deploy@<SERVER-IP>

# Docker installieren (offizielles Script)
curl -fsSL https://get.docker.com | sh

# deploy-User zur docker-Gruppe hinzufügen (kein sudo nötig)
sudo usermod -aG docker deploy

# Neu einloggen damit Gruppe aktiv wird
exit && ssh deploy@<SERVER-IP>

# Testen
docker --version
docker compose version
```

---

## Schritt 3 — App-Verzeichnis einrichten (einmalig)

```bash
# Verzeichnisse anlegen
sudo mkdir -p /opt/employeemanagement
sudo mkdir -p /opt/backups/employeemanagement
sudo chown -R deploy:deploy /opt/employeemanagement
sudo chown -R deploy:deploy /opt/backups

# Repository klonen
cd /opt/employeemanagement
git clone https://github.com/CavdarKemal/EmployeeManagement.git .
```

---

## Schritt 4 — Produktions-.env anlegen

```bash
cd /opt/employeemanagement

# .env aus Vorlage erstellen
cp .env.example .env

# .env bearbeiten — ALLE Werte anpassen!
nano .env
```

**Inhalt der `.env` (Beispiel):**
```env
# Datenbank
POSTGRES_DB=employeemanagement
POSTGRES_USER=employeemanagement
POSTGRES_PASSWORD=SicheresPasswortHier_min20Zeichen!

# JWT — mindestens 32 Zeichen, zufällig generiert
# Tipp: openssl rand -base64 48
JWT_SECRET=DeinZufaelligesJwtSecretMindestens32ZeichenLang!
JWT_EXPIRATION_MS=86400000

# Frontend: echte Domain (wird beim Docker-Build gebraucht)
VITE_API_BASE_URL=https://em.cavdar.de/api/v1
```

```bash
# .env vor fremden Augen schützen
chmod 600 .env
```

---

## Schritt 5 — Nginx + SSL auf dem VPS einrichten (einmalig)

```bash
# Nginx installieren
sudo apt install -y nginx certbot python3-certbot-nginx

# Nginx-Konfiguration für die Subdomain erstellen
sudo nano /etc/nginx/sites-available/em.cavdar.de
```

**Dateiinhalt `/etc/nginx/sites-available/em.cavdar.de`:**
```nginx
server {
    listen 80;
    server_name em.cavdar.de;

    # Weiterleitung zu HTTPS (certbot ergänzt das automatisch)
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name em.cavdar.de;

    # SSL — wird von certbot automatisch ausgefüllt
    ssl_certificate     /etc/letsencrypt/live/em.cavdar.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/em.cavdar.de/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # Sicherheits-Header
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Anfragen an den Frontend-Container weiterleiten
    # (nginx im Container übernimmt das API-Proxying intern)
    location / {
        proxy_pass         http://localhost:3000;
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
sudo nginx -t && sudo systemctl reload nginx

# DNS-Eintrag zuerst setzen! (Plesk → DNS → A-Record em.cavdar.de → SERVER-IP)
# Dann SSL-Zertifikat von Let's Encrypt holen:
sudo certbot --nginx -d em.cavdar.de

# Auto-Renewal testen
sudo certbot renew --dry-run
```

---

## Schritt 6 — App starten

```bash
cd /opt/employeemanagement

# Images bauen und Container starten
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Status prüfen
docker compose ps
docker compose logs -f backend
```

**App ist jetzt erreichbar unter:** `https://em.cavdar.de`

---

## Schritt 7 — GitHub Actions für automatisches Deployment einrichten

In deinem GitHub-Repo unter **Settings → Secrets → Actions** folgende Secrets anlegen:

| Secret | Wert |
|--------|------|
| `PROD_HOST` | IP-Adresse des VPS |
| `PROD_USER` | `deploy` |
| `PROD_SSH_KEY` | Inhalt von `~/.ssh/id_rsa` (privater Key) |
| `VITE_API_BASE_URL` | `https://em.cavdar.de/api/v1` |
| `CODECOV_TOKEN` | (optional, von codecov.io) |

Nach jedem `git push` auf `main` läuft die Pipeline automatisch:  
Tests → Docker Build → Push zu GHCR → SSH-Deploy auf VPS

---

## Schritt 8 — Automatische Backups einrichten (empfohlen)

```bash
# Backup-Script erstellen
sudo nano /opt/backups/backup.sh
```

```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/employeemanagement"

# PostgreSQL Dump
docker exec employeemanagement-postgres \
  pg_dump -U employeemanagement employeemanagement \
  > "$BACKUP_DIR/db_$TIMESTAMP.sql"

# Alte Backups löschen (älter als 7 Tage)
find "$BACKUP_DIR" -name "db_*.sql" -mtime +7 -delete

echo "Backup abgeschlossen: db_$TIMESTAMP.sql"
```

```bash
chmod +x /opt/backups/backup.sh

# Täglich um 3:00 Uhr ausführen
(crontab -l 2>/dev/null; echo "0 3 * * * /opt/backups/backup.sh >> /var/log/em-backup.log 2>&1") | crontab -
```

---

## Update ausführen (nach Antwort von cloud86)

```bash
cd /opt/employeemanagement

# Neuesten Code holen
git pull

# Container neu bauen und starten
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Alte ungenutzte Images aufräumen
docker image prune -f
```

---

## Nützliche Befehle

```bash
# Container-Status
docker compose ps

# Logs anzeigen
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres

# In die Datenbank einloggen
docker exec -it employeemanagement-postgres psql -U employeemanagement

# Alle Container neu starten
docker compose restart

# Alles stoppen
docker compose down

# RAM-Verbrauch prüfen
docker stats --no-stream
free -h
```

---

## Checkliste vor dem Go-Live

- [ ] VPS mit Root-Zugriff vorhanden
- [ ] DNS-Eintrag: `em.cavdar.de` → VPS-IP gesetzt
- [ ] Docker installiert
- [ ] `.env` mit sicheren Passwörtern befüllt
- [ ] Nginx-Konfiguration aktiv
- [ ] SSL-Zertifikat (Let's Encrypt) eingerichtet
- [ ] Container laufen (`docker compose ps`)
- [ ] App unter `https://em.cavdar.de` erreichbar
- [ ] Login mit `admin@firma.de / admin123` funktioniert
- [ ] GitHub Actions Secrets gesetzt
- [ ] Automatische Backups aktiv

---

## Kosten-Übersicht

| Position | Kosten |
|----------|--------|
| Hetzner CX22 | ~4,15 €/Monat |
| Domain cavdar.de (cloud86) | bleibt wie gehabt |
| SSL-Zertifikat (Let's Encrypt) | kostenlos |
| **Gesamt** | **~4–5 €/Monat** |

---

*Erstellt: 2026-04-03 | Projekt: EmployeeManagement | Hoster: Hetzner Cloud*
