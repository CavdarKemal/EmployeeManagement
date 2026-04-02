# Deployment-Checkliste: EmployeeManagement auf cavdar.de

Bevor wir die App auf deinen Webserver bringen können, müssen ein paar Dinge
geklärt werden. Geh die Punkte der Reihe nach durch und notier die Antworten —
dann können wir direkt loslegen.

---

## Frage 1: Welchen Hosting-Typ hast du bei cloud86?

**Warum wichtig?**
Die App läuft in Docker-Containern. Das funktioniert nur auf einem Server, auf
dem du Root-Zugriff hast (VPS oder Dedicated Server). Auf Shared Hosting ist
Docker grundsätzlich nicht möglich.

**Wie herausfinden?**
1. Melde dich auf cloud86.de in deinem Kundenkonto an
2. Geh zu „Meine Produkte" oder „Verträge"
3. Schaue, wie dein Paket heißt:
   - Enthält es Begriffe wie **„Webhosting"**, **„Shared Hosting"**, **„Hosting-Paket"**?
     → Das ist Shared Hosting → Docker **nicht** möglich → Upgrade nötig
   - Enthält es Begriffe wie **„VPS"**, **„V-Server"**, **„Root-Server"**, **„Dedicated Server"**?
     → Passt → Docker möglich → weiter mit Frage 2

---

## Frage 2: Welches Betriebssystem läuft auf dem Server?

**Warum wichtig?**
Docker läuft am besten auf Linux. Windows Server wäre komplizierter.

**Wie herausfinden?**
- Im cloud86-Kundenkonto unter deinem VPS-Paket nachschauen
- Oder: In Plesk → oben rechts auf deinen Servernamen klicken → Systeminformationen
- Ideal: **Ubuntu 22.04** oder **Debian 12** (oder ähnliche Linux-Version)

---

## Frage 3: Hast du SSH-Zugang zum Server?

**Warum wichtig?**
Docker wird über die Kommandozeile (SSH) installiert und gestartet. Ohne SSH
kommen wir nicht an den Server.

**Wie herausfinden?**
- Im cloud86-Kundenkonto: Gibt es unter deinem Server-Paket eine Option
  „SSH-Zugang", „Root-Passwort" oder „Server-Login"?
- Alternativ: Plesk → „Server-Verwaltung" oder „SSH-Terminal"
- Was du brauchst: **IP-Adresse des Servers** + **Root-Passwort** (oder SSH-Key)

---

## Frage 4: Wie viel RAM hat dein Server?

**Warum wichtig?**
Die drei Docker-Container (Datenbank + Backend + Frontend) brauchen zusammen
mindestens **1 GB RAM**, empfohlen sind **2 GB**.

**Wie herausfinden?**
- cloud86-Kundenkonto → dein Server-Paket → technische Details
- Oder: Plesk → Serverinformationen → Arbeitsspeicher

---

## Frage 5: Welche Plesk-Version hast du?

**Warum wichtig?**
Neuere Plesk-Versionen haben Docker-Integration und können Let's Encrypt-
Zertifikate automatisch erstellen. Ältere Versionen brauchen mehr manuelle
Konfiguration.

**Wie herausfinden?**
- In Plesk: unten links in der Seitenleiste steht die Versionsnummer,
  z.B. „Plesk Obsidian 18.x"

---

## Frage 6: Welche Subdomain soll die App bekommen?

**Warum wichtig?**
Die App braucht eine eigene Adresse unter cavdar.de. Du entscheidest, wie sie
heißen soll.

**Vorschläge:**
- `em.cavdar.de`
- `app.cavdar.de`
- `personal.cavdar.de`
- `employees.cavdar.de`

**Kein technischer Aufwand für diese Frage — einfach aussuchen!**

---

## Zusammenfassung: Was du brauchst

| # | Frage | Antwort (bitte ausfüllen) |
|---|-------|--------------------------|
| 1 | Hosting-Typ (Shared / VPS / Root) | |
| 2 | Betriebssystem des Servers | |
| 3 | SSH-Zugang vorhanden? (Ja/Nein) | |
| 4 | RAM des Servers | |
| 5 | Plesk-Version | |
| 6 | Gewünschte Subdomain | |

---

## Falls du ein Upgrade brauchst

Wenn sich herausstellt, dass du nur Shared Hosting hast, empfehle ich bei
cloud86 einen **VPS mit mindestens 2 GB RAM und Ubuntu 22.04**. Schau dir die
aktuellen Angebote auf cloud86.de an — ein kleiner VPS kostet meist ca. 5–10 €
pro Monat.

---

*Erstellt: 2026-04-02 | Projekt: EmployeeManagement*
