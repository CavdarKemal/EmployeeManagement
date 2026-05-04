# Vaultwarden — Eigener Password-Manager auf der VPS

**Live-URL (nach Setup):** https://vault.em.cavdar.de
**Server:** Hetzner CX23 (gleiche VPS wie EmployeeManagement)
**Image:** `vaultwarden/server:1.36.0-alpine`

> **Diese Anleitung richtet sich an Laien.** Jeder Schritt ist ausführlich
> erklärt. Wenn du DEPLOYMENT_VPS.md nachvollziehen konntest, wirst du auch
> hier nicht stolpern.

---

## Inhaltsverzeichnis

1. [Was ist ein Password-Manager und warum self-hosted?](#1-was-ist-ein-password-manager-und-warum-self-hosted)
2. [Was ist Vaultwarden? Was ist Bitwarden?](#2-was-ist-vaultwarden-was-ist-bitwarden)
3. [Architektur-Überblick](#3-architektur-überblick)
4. [Voraussetzungen](#4-voraussetzungen)
5. [Schritt 1 — DNS-Eintrag setzen](#schritt-1--dns-eintrag-setzen)
6. [Schritt 2 — Verzeichnis auf der VPS anlegen](#schritt-2--verzeichnis-auf-der-vps-anlegen)
7. [Schritt 3 — ADMIN_TOKEN als Argon2-Hash erzeugen](#schritt-3--admin_token-als-argon2-hash-erzeugen)
8. [Schritt 4 — .env-Datei befüllen](#schritt-4--env-datei-befüllen)
9. [Schritt 5 — Nginx-Site einrichten](#schritt-5--nginx-site-einrichten)
10. [Schritt 6 — HTTPS-Zertifikat holen](#schritt-6--https-zertifikat-holen)
11. [Schritt 7 — Vaultwarden starten](#schritt-7--vaultwarden-starten)
12. [Schritt 8 — Erstkonfiguration im Admin-Panel](#schritt-8--erstkonfiguration-im-admin-panel)
13. [Schritt 9 — Den ersten Mitarbeiter einladen](#schritt-9--den-ersten-mitarbeiter-einladen)
14. [Schritt 10 — Browser-Extension installieren](#schritt-10--browser-extension-installieren)
15. [Schritt 11 — Mobile-App einrichten](#schritt-11--mobile-app-einrichten)
16. [Backups einrichten](#backups-einrichten)
17. [Vaultwarden aktualisieren](#vaultwarden-aktualisieren)
18. [Lokal testen (auf dem Entwicklungs-PC)](#lokal-testen-auf-dem-entwicklungs-pc)
19. [Fehlerbehebung](#fehlerbehebung)
20. [Glossar](#glossar)

---

## 1. Was ist ein Password-Manager und warum self-hosted?

Ein **Password-Manager** ist ein verschlüsselter Tresor, in dem du alle
Logins (Mailadresse + Passwort) für Webseiten und Apps speicherst. Du
musst dir nur noch ein einziges Passwort merken — das **Master-Passwort**,
mit dem der Tresor entschlüsselt wird. Alles andere füllt der Manager
automatisch in Browser und Apps ein.

**Vorteile:**

- Für jede Seite ein **eigenes**, langes, zufälliges Passwort
  (z.B. `Tk9!xQ2mP@vR8&nL`) statt überall dasselbe.
- Wird ein Account geleakt, sind alle anderen weiterhin sicher.
- Der Manager warnt, wenn ein Passwort in einer bekannten Datenleck-Datenbank
  auftaucht.
- Auch 2FA-Codes (TOTP) und Notizen lassen sich speichern.

**„Self-hosted" bedeutet:** Der Tresor liegt auf deinem eigenen Server,
nicht bei einem Anbieter (LastPass, 1Password, Bitwarden Cloud). Vorteile:

- **DSGVO-konform** ohne Auftragsverarbeitungs-Vertrag mit US-Anbieter.
- **Keine monatlichen Kosten pro Mitarbeiter** (Bitwarden Cloud kostet
  ~3 €/User/Monat).
- **Volle Datenhoheit** — niemand außer dir kann die Verschlüsselungs-Logs
  einsehen oder den Dienst abschalten.

**Nachteile (musst du wissen):**

- **Du** bist für Backups verantwortlich. Geht der Server kaputt und du
  hast kein Backup, sind alle Passwörter weg.
- **Du** spielst Updates ein. Eine ungepatchte Sicherheitslücke ist deine
  Verantwortung.

---

## 2. Was ist Vaultwarden? Was ist Bitwarden?

**Bitwarden** ist ein Open-Source-Password-Manager. Es gibt:
- Den **offiziellen Bitwarden-Server** (in C#/.NET geschrieben, mehrere
  Container, ressourcenhungrig).
- Die **offiziellen Clients**: Browser-Extensions, Mobile-Apps, Desktop-App,
  CLI — alle mit MIT-Lizenz.

**Vaultwarden** ist eine **Re-Implementierung** des Bitwarden-Servers in
**Rust** durch die Open-Source-Community (Hauptentwickler: Daniel García).

Wichtig:

- Vaultwarden spricht **dasselbe Protokoll** wie der offizielle Server.
  Alle offiziellen Clients funktionieren ohne Änderung.
- Vaultwarden braucht nur **einen** Container und ~50 MB RAM (offizieller
  Bitwarden-Server: 11 Container, ~2 GB RAM).
- Vaultwarden hat alle Features des offiziellen Servers freigeschaltet —
  inklusive Organizations, Collections, Send. Beim offiziellen Server sind
  die hinter einer Bezahllizenz.
- Vaultwarden ist die **inoffizielle** Variante. Probleme mit Vaultwarden
  niemals an Bitwarden melden, sondern an [github.com/dani-garcia/vaultwarden](https://github.com/dani-garcia/vaultwarden).

Für unseren Use-Case (kleine Firma, eigene Mitarbeiter, keine Cloud) ist
Vaultwarden die sinnvollere Wahl.

---

## 3. Architektur-Überblick

```
Browser (Mitarbeiter, irgendwo im Internet)
    │
    ▼ https://vault.em.cavdar.de
┌─────────────────────────────────────────────────┐
│  Hetzner VPS (94.130.228.157)                   │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  Nginx (Türsteher, läuft direkt auf VPS)  │  │
│  │  Port 80  → HTTPS-Redirect                │  │
│  │  Port 443 → Vaultwarden (lokal :8222)     │  │
│  │  Port 443 → Frontend EM (lokal :3000)     │  │
│  └─────────────┬─────────────────────────────┘  │
│                │                                │
│  ┌─────────────▼─────────────────────────────┐  │
│  │  Docker                                   │  │
│  │  ┌──────────────┐  ┌────────────────┐     │  │
│  │  │ Vaultwarden  │  │ EmployeeMgmt   │     │  │
│  │  │   :8222      │  │  Stack (DB,    │     │  │
│  │  │ data/ →      │  │  Backend,      │     │  │
│  │  │ SQLite-DB    │  │  Frontend)     │     │  │
│  │  └──────────────┘  └────────────────┘     │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Schlüssel-Design (wichtig zu verstehen):** Die Verschlüsselung passiert
**im Browser/in der App**, nicht auf dem Server. Der Server sieht nur
verschlüsselten Datenmüll. Selbst der Server-Admin (du) kann die
Passwörter der Mitarbeiter **nicht** entschlüsseln, weil das Master-Passwort
nie zum Server übertragen wird — nur ein abgeleiteter Hash zur Authentifizierung.
Das ist ein Feature, kein Bug.

**Konsequenz:** Verliert ein Mitarbeiter sein Master-Passwort, ist sein
Vault **endgültig weg**. Du kannst es nicht zurücksetzen. Vaultwarden hat
einen "Account-Recovery"-Mechanismus über Organizations (Admin kann den Tresor
verschlüsselt mit eigenem Schlüssel neu freigeben), das setzt aber Setup
*vor* dem Verlust voraus.

---

## 4. Voraussetzungen

- VPS läuft (siehe `DEPLOYMENT_VPS.md`).
- Domain `cavdar.de` ist auf Plesk verwaltet.
- Du kannst dich per `ssh vps` einloggen.
- Docker und Nginx sind installiert (sind sie schon, von der EmployeeManagement-Einrichtung).
- Du hast ein Gmail-App-Passwort für Mail-Versand (oder andere SMTP-Credentials).

---

## Schritt 1 — DNS-Eintrag setzen

Bevor das Internet weiß, dass `vault.em.cavdar.de` existiert, brauchen wir
einen DNS-Eintrag. Der zeigt: „Diese Subdomain führt auf die IP 94.130.228.157."

In **Plesk bei cloud86**:

1. cavdar.de → **DNS-Einstellungen** öffnen.
2. **A-Record hinzufügen**:
   - **Name:** `vault.em` *(ergibt zusammen mit der Zone die Subdomain
     `vault.em.cavdar.de`)*
   - **Wert:** `94.130.228.157`
3. Speichern.

DNS-Änderungen brauchen oft 1–10 Minuten, manchmal länger. Auf deinem PC
prüfen:

```bash
nslookup vault.em.cavdar.de
# Erwartet: Address: 94.130.228.157
```

Erst weitermachen, wenn das stimmt.

---

## Schritt 2 — Verzeichnis auf der VPS anlegen

```bash
ssh vps
sudo mkdir -p /opt/vaultwarden
sudo chown -R deploy:deploy /opt/vaultwarden
```

Wir nutzen die Compose- und Nginx-Files, die im Repo unter
`deploy/vaultwarden/` liegen. Da das EmployeeManagement-Repo schon nach
`/opt/employeemanagement/` geklont ist, können wir die Files einfach
kopieren oder symlinken.

**Variante A — Kopieren (einfacher zu verstehen):**

```bash
cp /opt/employeemanagement/deploy/vaultwarden/docker-compose.yml /opt/vaultwarden/
cp /opt/employeemanagement/deploy/vaultwarden/docker-compose.local.yml /opt/vaultwarden/   # optional
cp /opt/employeemanagement/deploy/vaultwarden/.env.example /opt/vaultwarden/
mkdir -p /opt/vaultwarden/nginx
cp /opt/employeemanagement/deploy/vaultwarden/nginx/vault.em.cavdar.de.conf /opt/vaultwarden/nginx/
```

**Variante B — Symlink (Updates per `git pull` automatisch):**

```bash
ln -s /opt/employeemanagement/deploy/vaultwarden/docker-compose.yml /opt/vaultwarden/docker-compose.yml
ln -s /opt/employeemanagement/deploy/vaultwarden/.env.example /opt/vaultwarden/.env.example
mkdir -p /opt/vaultwarden/nginx
ln -s /opt/employeemanagement/deploy/vaultwarden/nginx/vault.em.cavdar.de.conf /opt/vaultwarden/nginx/vault.em.cavdar.de.conf
```

> Empfehlung: **Variante A**. Du willst beim `git pull` auf der VPS nicht
> aus Versehen den Vault-Dienst durcheinanderbringen. Updates später bewusst
> kopieren.

Datenverzeichnis anlegen:

```bash
mkdir -p /opt/vaultwarden/data
```

In `data/` legt Vaultwarden seine SQLite-Datenbank, hochgeladene Anhänge
und den privaten Schlüssel ab. **Dieses Verzeichnis ist die wichtigste
Sache für Backups** — verlierst du es, sind alle Passwörter aller
Mitarbeiter weg.

---

## Schritt 3 — ADMIN_TOKEN als Argon2-Hash erzeugen

Das **Admin-Panel** (`/admin`) ist das Konfigurations-Backend von Vaultwarden.
Wer den Token kennt, hat Zugriff auf alle Server-Settings — nicht auf die
Vault-Inhalte (die sind ja verschlüsselt), aber er kann z.B. neue User einladen
oder Server-Konfigs ändern. Deshalb darf der Token kein simples Passwort sein.

Vaultwarden verlangt seit Version 1.30+ einen **Argon2-Hash** statt
Plain-Text-Tokens. Argon2 ist eine moderne Passwort-Hashing-Funktion, die
gegen GPU-basierte Brute-Force-Angriffe resistent ist.

Wähle zuerst ein **wirklich starkes** Passwort (mind. 24 Zeichen, zufällig):

```bash
openssl rand -base64 32
# Beispiel-Output: wPezSR+0SOTrMpD5/5VcGEfZUHB1APPP6GbCf9C18ec=
```

Aus dem Plain-Passwort einen Argon2id-Hash machen. **Zwei Wege**, je nach
Umgebung:

**Variante 1 — Vaultwarden's eigenes Hash-Tool (verlangt ein TTY):**

```bash
docker run --rm -it vaultwarden/server /vaultwarden hash
# fragt zweimal nach dem Passwort, gibt dann den Hash aus.
```

> **Achtung:** Bei einer SSH-Session **ohne** TTY (z.B. wenn ein Skript den
> Befehl ausführt) panic't das Tool mit `No such device or address`. Dann
> Variante 2 nehmen.

**Variante 2 — argon2-CLI (funktioniert auch im Skript):**

```bash
apt install -y argon2     # einmalig, falls nicht installiert
PLAIN="wPezSR+0SOTrMpD5/5VcGEfZUHB1APPP6GbCf9C18ec="
SALT=$(openssl rand -base64 16)
echo -n "$PLAIN" | argon2 "$SALT" -id -t 3 -k 65540 -p 4 -l 32 -e
```

Beide Varianten geben einen String dieser Form:

```
$argon2id$v=19$m=65540,t=3,p=4$ZxzAm14dIWXhuCKqPmU0qg$gzjwzD...
```

**Zwei Werte aufschreiben** (am sichersten in den eigenen, neuen Vault,
sobald er läuft):

| Was | Wofür |
|-----|-------|
| Das **Plain-Passwort** | Damit loggst du dich später ins `/admin`-Panel ein. |
| Der **Argon2-Hash-String** (mit allen `$`-Zeichen) | Kommt in die `.env` — siehe Schritt 4. |

> **Tipp — Token später rotieren:** Wenn du den Admin-Token irgendwann
> wechseln willst (oder weil er kompromittiert wurde), nutze das Skript
> `rotate-admin-token.sh` aus diesem Verzeichnis. Es generiert PW + Hash,
> updatet die `.env` (mit `$$`-Escape), restartet den Container und
> verifiziert serverseitig per Cookie-Test, dass der neue Token funktioniert.
> Aufruf auf der VPS:
> ```bash
> sudo cp /opt/employeemanagement/deploy/vaultwarden/rotate-admin-token.sh /opt/vaultwarden/
> sudo chmod +x /opt/vaultwarden/rotate-admin-token.sh
> sudo bash /opt/vaultwarden/rotate-admin-token.sh
> ```
> Das neue Plain-PW landet in `/root/vw-admin-pw.txt` (chmod 600), nicht in
> stdout. Nach dem Sichern in den Vault: `shred -u /root/vw-admin-pw.txt`.

---

## Schritt 4 — .env-Datei befüllen

```bash
cd /opt/vaultwarden
cp .env.example .env
nano .env
```

Werte einsetzen — **Achtung: jedes `$` im Hash als `$$` schreiben** (Erklärung
direkt unter dem Block):

```env
DOMAIN=https://vault.em.cavdar.de
ADMIN_TOKEN=$$argon2id$$v=19$$m=65540,t=3,p=4$$DEIN_SALT$$DEIN_HASH
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURITY=starttls
SMTP_FROM=kemal@cavdar.de
SMTP_FROM_NAME=EmployeeManagement Vault
SMTP_USERNAME=kemal@cavdar.de
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
```

Die **SMTP-Werte** sind dieselben wie in der EmployeeManagement-`.env`
(siehe `DEPLOYMENT_VPS.md` Sektion „E-Mail-Benachrichtigungen einrichten").
Ein Gmail-App-Passwort kann von beiden Diensten gleichzeitig genutzt werden.

> **!!! Stolperstein — `$` muss als `$$` in der `.env` geschrieben werden:**
> Docker Compose interpretiert `${...}` und `$VAR` in `.env`-Werten als
> **Variable-Substitution**. Der Argon2-Hash beginnt mit `$argon2id$v=19$...`
> — Compose liest `$argon2id`, `$v`, `$m` als (nicht definierte) Variablen,
> ersetzt sie mit leeren Strings, und der Token kommt zerlegt im Container
> an. Vaultwarden fällt dann auf Plain-Text-Auswertung zurück; im Container-Log
> erscheint:
> `[NOTICE] You are using a plain text ADMIN_TOKEN which is insecure.`
> **Lösung:** Jedes einzelne `$` im Hash verdoppeln. Der Beispiel-Hash
> `$argon2id$v=19$m=65540,t=3,p=4$SALT$HASH` wird zu
> `$$argon2id$$v=19$$m=65540,t=3,p=4$$SALT$$HASH`. Im Admin-Panel-Login
> später trotzdem das **Plain-Passwort** ohne Verdopplung eintippen — die
> Verdopplung ist nur ein Compose-Escape.

`.env` schützen:

```bash
chmod 600 /opt/vaultwarden/.env
```

Damit kann nur der `deploy`-User die Datei lesen — kein anderer Server-User,
kein Web-Prozess.

---

## Schritt 5 — Nginx-Site einrichten

Nginx ist der „Türsteher" auf Port 80/443. Bisher leitet er Anfragen für
`em.cavdar.de` an den Frontend-Container weiter. Jetzt fügen wir eine
zweite Site hinzu für `vault.em.cavdar.de`, die zum Vaultwarden-Container
auf Port 8222 leitet.

Datei kopieren:

```bash
sudo cp /opt/vaultwarden/nginx/vault.em.cavdar.de.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/vault.em.cavdar.de.conf /etc/nginx/sites-enabled/
```

Syntax prüfen:

```bash
sudo nginx -t
```

Erwartet:

```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

Nginx neu laden:

```bash
sudo systemctl reload nginx
```

> **Was steht in der Site-Konfig?** Drei `location`-Blöcke. Der erste und
> zweite leiten den WebSocket-Hub `/notifications/hub` weiter — den nutzt
> Vaultwarden, damit zwischen Browser, Handy und Desktop-App alles in
> Echtzeit synchronisiert (wenn du am Handy ein Passwort änderst, ist die
> Änderung sofort am PC sichtbar). Der dritte Block leitet alles andere
> auf das Vaultwarden-Web-Interface weiter. Das `client_max_body_size 525M`
> erlaubt Datei-Anhänge bis 525 MB (Bitwarden-Standard).

---

## Schritt 6 — HTTPS-Zertifikat holen

Browser-Extensions weigern sich, Logins an einen Server zu senden, der
nicht HTTPS spricht. Außerdem will niemand ungeschützt Passwörter durchs
Internet schicken.

**Let's Encrypt** stellt kostenlose SSL-Zertifikate aus. Certbot ist auf
deiner VPS schon installiert (von der EM-Einrichtung).

```bash
sudo certbot --nginx -d vault.em.cavdar.de
```

Certbot:
1. Holt ein Zertifikat von Let's Encrypt (deren Server prüft, ob die Domain
   wirklich auf deine IP zeigt).
2. Patcht automatisch die Nginx-Konfig: fügt einen `server { listen 443 ssl; ... }`-Block
   hinzu und leitet Port 80 auf 443 um.
3. Setzt einen Cron-Job, der das Zertifikat alle 90 Tage automatisch erneuert.

Test:

```bash
curl -sI https://vault.em.cavdar.de/alive
```

Erwartet: `HTTP/2 200`.

Falls Fehler: siehe [Fehlerbehebung](#fehlerbehebung).

---

## Schritt 7 — Vaultwarden starten

```bash
cd /opt/vaultwarden
docker compose up -d
```

Die Logs ansehen, bis du `Rocket has launched` liest:

```bash
docker compose logs -f vaultwarden
# Strg+C zum Beenden des Log-Streams
```

Status prüfen:

```bash
docker compose ps
# vaultwarden  Up X minutes (healthy)
```

Falls `(unhealthy)` oder Restart-Schleife: `docker compose logs vaultwarden`
zeigt den Fehler.

---

## Schritt 8 — Erstkonfiguration im Admin-Panel

1. Im Browser öffnen: **https://vault.em.cavdar.de/admin**
2. Eingabefeld zeigt nur ein Passwort-Feld → **Plain-Passwort aus Schritt 3**
   eingeben (nicht den Hash!).
3. Du siehst das Vaultwarden-Admin-Dashboard.

**Empfohlene Erst-Einstellungen** (Sektion **General Settings**):

- `Domain URL` → muss `https://vault.em.cavdar.de` sein. Wenn da `localhost`
  steht, hast du `DOMAIN` in `.env` falsch.
- `Allow new signups` → **AUS** (in unserer `.env` schon `false`).
- `Require email verification on signups` → **AN**.
- `Allow invitations` → **AN**.

Sektion **SMTP Email Settings**:

- Der Block sollte mit den Werten aus `.env` vorbefüllt sein.
- Unten: **Test SMTP** → eigene Mailadresse eingeben → **Send Test Email**.
- Mail muss in deinem Postfach landen (auch im Spam-Ordner schauen).
  Kommt nichts an: Mail-Setup ist falsch (siehe Fehlerbehebung).

Settings speichern (`Save`).

---

## Schritt 9 — Den ersten Mitarbeiter einladen

Im Admin-Panel: Sektion **Users** → **Invite User** → Mailadresse eingeben → **Invite**.

Der Mitarbeiter erhält eine Mail mit einem Einladungslink. Wenn er den
klickt, kommt er auf `https://vault.em.cavdar.de/#/finish-signup?...` und
legt dort:

1. Sein **Master-Passwort** fest (mind. 12 Zeichen, eigene Empfehlung: 16+).
2. Optional einen **Master-Passwort-Hinweis** (wird per Mail geschickt, falls
   das Master-Passwort vergessen wurde — der Hinweis sollte das Passwort
   nicht direkt verraten).

Nach erfolgreicher Registrierung ist der Account aktiv. Ab jetzt:

- Login auf https://vault.em.cavdar.de mit Mailadresse + Master-Passwort.
- Im Web-Vault können Passwörter manuell angelegt, organisiert (Folders,
  Collections), durchsucht, generiert und zwischen Geräten synchronisiert werden.

---

## Schritt 10 — Browser-Extension installieren

Die offizielle **Bitwarden-Extension** funktioniert mit Vaultwarden ohne
Änderungen, sie muss nur auf den eigenen Server zeigen.

**Chrome / Edge / Brave:**
[chrome.google.com/.../bitwarden-free-password](https://chromewebstore.google.com/detail/bitwarden-free-password-m/nngceckbapebfimnlniiiahkandclblb)

**Firefox:**
[addons.mozilla.org/firefox/addon/bitwarden-password-manager](https://addons.mozilla.org/de/firefox/addon/bitwarden-password-manager/)

Nach der Installation:

1. Extension-Icon klicken → **Settings** (Zahnrad oben).
2. **Self-hosted environment** wählen.
3. **Server URL:** `https://vault.em.cavdar.de` eintragen.
4. **Save** → **Log In** → Mailadresse + Master-Passwort.

Ab jetzt füllt die Extension Login-Formulare automatisch aus, generiert
neue Passwörter beim Registrieren und speichert sie zentral.

---

## Schritt 11 — Mobile-App einrichten

**iOS:** [App Store → Bitwarden](https://apps.apple.com/de/app/bitwarden-password-manager/id1137397744)
**Android:** [Play Store → Bitwarden](https://play.google.com/store/apps/details?id=com.x8bit.bitwarden)

Beim ersten Start:

1. Login-Bildschirm → oben links **Zahnrad** (Region/Server).
2. **Self-hosted** wählen.
3. **Server URL:** `https://vault.em.cavdar.de`.
4. Speichern → mit Mailadresse + Master-Passwort einloggen.
5. Auf dem Handy auch **Auto-Fill** und **Biometrische Entsperrung** (FaceID /
   Fingerprint) aktivieren — dann musst du das Master-Passwort nur einmal
   pro Sitzung eingeben.

---

## Backups einrichten

**Was muss gesichert werden?** Nur das Verzeichnis `/opt/vaultwarden/data/`.
Es enthält:

- `db.sqlite3` — die komplette Datenbank (alle User, alle verschlüsselten
  Passwörter, alle Organizations).
- `attachments/` — Datei-Anhänge.
- `rsa_key.pem` — der private Server-Schlüssel.

**Backup-Skript** anlegen:

```bash
sudo nano /opt/backups/vault-backup.sh
```

```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/vaultwarden"
mkdir -p "$BACKUP_DIR"

# Vaultwarden ist Single-Process und SQLite — eine konsistente Kopie
# bekommst du am sichersten über `sqlite3 .backup`. Alternativ Container
# kurz pausieren, kopieren, weiterlaufen lassen.
docker exec vaultwarden /usr/bin/sqlite3 /data/db.sqlite3 ".backup '/data/db_backup.sqlite3'"
tar -czf "$BACKUP_DIR/vault_$TIMESTAMP.tar.gz" -C /opt/vaultwarden data/

# Backup-Datei innerhalb des Containers wegräumen
docker exec vaultwarden rm -f /data/db_backup.sqlite3

# Alte Backups löschen (älter als 14 Tage)
find "$BACKUP_DIR" -name "vault_*.tar.gz" -mtime +14 -delete

echo "Backup abgeschlossen: vault_$TIMESTAMP.tar.gz"
```

```bash
chmod +x /opt/backups/vault-backup.sh

# Cron-Job: täglich um 3:30 Uhr (eine halbe Stunde nach dem EM-Backup)
(crontab -l 2>/dev/null; echo "30 3 * * * /opt/backups/vault-backup.sh >> /var/log/vault-backup.log 2>&1") | crontab -
```

> **Backup-Test mindestens einmal durchspielen!** Ein nie getestetes Backup
> ist kein Backup. Restore-Übung: Test-Container hochfahren, Backup
> entpacken, prüfen ob Login funktioniert.

---

## Vaultwarden aktualisieren

Vaultwarden veröffentlicht etwa monatlich eine neue Version. Update-Workflow:

```bash
cd /opt/vaultwarden

# 1. Backup vorab — Pflicht!
/opt/backups/vault-backup.sh

# 2. .env (oder docker-compose.yml) auf neue Version setzen
nano docker-compose.yml
# Zeile: image: vaultwarden/server:1.36.0-alpine → neue Version

# 3. Neues Image holen, Container neu starten
docker compose pull
docker compose up -d

# 4. Logs prüfen
docker compose logs -f vaultwarden
# warten auf "Rocket has launched", Strg+C
```

**Welche Version ist die neueste?**
[hub.docker.com/r/vaultwarden/server/tags](https://hub.docker.com/r/vaultwarden/server/tags)

> **Niemals `:latest` in Produktion verwenden.** Sonst rollt eine
> Major-Version mit Breaking Changes ungewollt aus, sobald du `pull` machst.

---

## Lokal testen (auf dem Entwicklungs-PC)

Bevor Änderungen an `docker-compose.yml` oder Nginx-Config auf die VPS
gehen, kannst du sie lokal testen.

```bash
cd D:/ClaudeCode/EmployeeManagement/deploy/vaultwarden
docker compose -f docker-compose.yml -f docker-compose.local.yml --env-file .env.local up -d
```

Der Local-Override macht:

- `DOMAIN=http://localhost:8222` (statt der echten URL).
- `SIGNUPS_ALLOWED=true`, damit du dich ohne Mail-Setup selbst registrieren kannst.
- Plain-Text-Token (kein Argon2-Hash nötig — es ist nur dev).
- SMTP wird auf Dummy-Werte gesetzt; Mail-Versand schlägt erwartet fehl.

Im Browser: http://localhost:8222 → Konto registrieren → testen.

Aufräumen, wenn fertig:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml down -v
rm -rf data/
```

> **Achtung:** `down -v` löscht das Docker-Volume, aber das `data/`-Verzeichnis
> ist ein Bind-Mount — das wird durch `down -v` **nicht** gelöscht. Manuell
> entfernen, sonst sind Test-User im nächsten Lauf noch da.

---

## Fehlerbehebung

### `nslookup vault.em.cavdar.de` gibt nichts zurück

DNS-Eintrag ist nicht gesetzt oder noch nicht propagiert. Plesk-Eintrag
prüfen, dann 5–10 Min warten und erneut testen. Cache leeren:

```bash
ipconfig /flushdns      # Windows
sudo systemd-resolve --flush-caches  # Linux
```

### Certbot scheitert mit „Failed to connect"

Certbot prüft die Domain, indem er einen HTTP-Request an
`http://vault.em.cavdar.de/.well-known/acme-challenge/...` schickt. Wenn
das fehlschlägt:

- DNS noch nicht propagiert → warten.
- Firewall blockiert Port 80 → `sudo ufw status` prüfen, ggf. `ufw allow 80`.
- Nginx-Site nicht aktiv → `nginx -T | grep vault.em.cavdar.de` muss
  Treffer geben.

### `/admin` zeigt „Authentication failed"

- Du gibst den **Hash** statt des Plain-Passworts ein. Es muss das
  ursprüngliche Passwort sein, das du beim `vaultwarden hash`-Aufruf eingetippt hast.
- Du hast den Hash falsch in `.env` eingetragen — manchmal verschluckt der
  Editor ein `$`. Lösung: gesamten String ist EINER, ohne Zeilenumbruch,
  ohne Anführungszeichen.

### Container-Log zeigt „You are using a plain text ADMIN_TOKEN"

Das `$`-Escape in `.env` fehlt. Docker Compose hat die Hash-Bestandteile
als Variable-Refs (`$argon2id`, `$v`, `$m`, …) interpretiert und mit leeren
Strings ersetzt — der Container sieht etwas wie `,t=3,p=4HASH` als Token.

Symptome zusätzlich:
```
docker compose up -d
WARN[0000] The "argon2id" variable is not set. Defaulting to a blank string.
WARN[0000] The "v"        variable is not set. Defaulting to a blank string.
WARN[0000] The "m"        variable is not set. Defaulting to a blank string.
```

**Fix:** In `/opt/vaultwarden/.env` jedes `$` im `ADMIN_TOKEN` zu `$$`
verdoppeln, dann `docker compose down && docker compose up -d`. Verifizieren
mit `docker compose logs vaultwarden | grep -i 'plain text'` — keine Treffer
mehr. Das **Plain-Passwort** beim Login bleibt unverändert (kein `$$`-Escape
dort).

### Web-Vault lädt, aber Login schlägt fehl mit „Server URL is invalid"

In den Client-Settings: Ist die Server-URL **mit https://** und **ohne
Trailing-Slash** eingetragen? Korrekt: `https://vault.em.cavdar.de`. Falsch:
`vault.em.cavdar.de` oder `https://vault.em.cavdar.de/`.

### Test-Mail aus Admin-Panel kommt nicht an

- Im Spam-Ordner nachschauen.
- Gmail-App-Passwort gültig? Manchmal werden sie nach Inaktivität widerrufen.
- Im Container-Log nachsehen:
  ```bash
  docker compose logs vaultwarden | grep -i smtp
  ```

### Container ist `(unhealthy)`

```bash
docker compose logs --tail=80 vaultwarden
```

Häufig:
- `ADMIN_TOKEN` fehlt in `.env` → `:?` in Compose schlägt zu, Container startet nicht.
- Port 8222 schon belegt → `sudo netstat -tlnp | grep 8222`.

### Live-Sync funktioniert nicht (Änderung am Handy ist am PC nicht sofort sichtbar)

Der WebSocket-Hub `/notifications/hub` wird vom Reverse-Proxy nicht korrekt
durchgereicht. Prüfen:

```bash
curl -sI https://vault.em.cavdar.de/notifications/hub/negotiate
# Muss 200 OK zurückgeben, nicht 502/504.
```

Falls 502: Nginx-Site enthält die `/notifications/hub`-`location`-Blöcke nicht.
Datei aus `deploy/vaultwarden/nginx/` neu kopieren, Reload.

### Vault-Daten wiederherstellen aus Backup

```bash
cd /opt/vaultwarden
docker compose down
sudo rm -rf data/
sudo tar -xzf /opt/backups/vaultwarden/vault_YYYYMMDD_HHMMSS.tar.gz -C ./
docker compose up -d
```

---

## Glossar

| Begriff | Erklärung |
|---------|-----------|
| **Vault** | Der verschlüsselte Tresor mit allen Passwörtern eines Users. |
| **Master-Passwort** | Das eine Passwort, mit dem ein Mitarbeiter seinen Vault entsperrt. Wird **nie** zum Server übertragen. |
| **Self-hosted** | Dienst läuft auf eigenem Server, nicht in einer Cloud. |
| **Vaultwarden** | Inoffizielle, schlanke Bitwarden-Server-Implementation in Rust. |
| **Bitwarden** | Original-Password-Manager — Server (offiziell) + Clients. |
| **Argon2** | Moderne Passwort-Hashing-Funktion, GPU-resistent. |
| **Master-Passwort-Hinweis** | Optionaler Tipp, der bei „Passwort vergessen" per Mail kommt. Verrät das Passwort nicht direkt. |
| **Account-Recovery** | Mechanismus über Organizations, mit dem ein Admin den Vault eines Users zurücksetzen kann (Setup vorher nötig). |
| **WebSocket** | Bidirektionales Protokoll, das Vaultwarden für Echtzeit-Sync nutzt. |
| **SQLite** | Datei-basierte Datenbank, die Vaultwarden standardmäßig nutzt (eine `.sqlite3`-Datei, kein separater DB-Server). |
| **TOTP** | Time-based One-Time Password — die 6-stelligen 2FA-Codes (Google Authenticator etc.). Vaultwarden kann sie speichern. |
| **Self-hosted environment** | Einstellung in den Bitwarden-Clients, mit der man sie auf den eigenen Server zeigen lässt. |
| **Bind-Mount** | Docker-Volume, das ein Verzeichnis vom Host direkt in den Container einhängt. |
| **Reverse-Proxy** | Vermittler zwischen Internet und internen Diensten — bei uns Nginx. |

---

## Kosten

| Position | Kosten |
|----------|--------|
| Hetzner CX23 (gleiche VPS wie EM) | 0 € (geteilt) |
| Subdomain `vault.em.cavdar.de` | 0 € |
| Let's Encrypt Zertifikat | 0 € |
| Vaultwarden | 0 € (Open Source) |
| **Gesamt** | **0 €/Monat zusätzlich** |

Im Vergleich zu Bitwarden Cloud (~3 €/User/Monat × 5 User = ~180 €/Jahr)
spart self-hosted ab 1 Mitarbeiter Geld.
