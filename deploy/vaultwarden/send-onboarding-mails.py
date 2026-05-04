#!/usr/bin/env python3
"""Schickt die Onboarding-Mail aus onboarding-mail.txt an eine Liste Mitarbeiter.

Läuft auf der VPS, liest SMTP-Credentials aus /opt/employeemanagement/.env
(MAIL_HOST/PORT/USERNAME/PASSWORD), nutzt also dieselbe Mailbox wie die
Vaultwarden-Invite-Mails. Subject + Body werden aus dem Template gelesen,
{Vorname} pro Empfänger ersetzt.

Usage (auf der VPS):
    sudo python3 /opt/employeemanagement/deploy/vaultwarden/send-onboarding-mails.py \\
        "Anna:anna@example.com" "Bob:bob@example.com"

    # Mit --dry-run wird nur die Preview gezeigt, nichts gesendet:
    sudo python3 ... "Anna:anna@example.com" --dry-run

    # Ohne --yes fragt das Skript vor dem Senden „Senden? [yes/no]"
"""

import argparse
import re
import smtplib
import ssl
import sys
import time
from email.mime.text import MIMEText
from email.utils import formataddr, formatdate, make_msgid
from pathlib import Path

ENV_PATH = Path("/opt/employeemanagement/.env")
TEMPLATE_PATH = Path(__file__).resolve().parent / "onboarding-mail.txt"


def load_env(path: Path) -> dict[str, str]:
    cfg: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        k, v = s.split("=", 1)
        cfg[k.strip()] = v.strip()
    return cfg


def load_template(path: Path) -> tuple[str, str]:
    text = path.read_text(encoding="utf-8")
    m = re.match(r"Betreff:\s*(.+?)\n\n(.+)", text, re.DOTALL)
    if not m:
        sys.exit(f"Template ohne 'Betreff: ...\\n\\n<body>'-Struktur: {path}")
    return m.group(1).strip(), m.group(2)


def parse_recipients(raw: list[str]) -> list[tuple[str, str]]:
    out = []
    for entry in raw:
        if ":" not in entry:
            sys.exit(f"Falsches Format '{entry}' — erwartet 'Vorname:mail@adresse'")
        name, mail = (s.strip() for s in entry.split(":", 1))
        if "@" not in mail:
            sys.exit(f"Mailadresse '{mail}' sieht nicht valide aus")
        out.append((name, mail))
    return out


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("recipients", nargs="+", help="'Vorname:mail@adresse' Paare")
    p.add_argument("--from-name", default="Kemal Cavdar",
                   help="Display-Name im From-Header (Default: Kemal Cavdar)")
    p.add_argument("--dry-run", action="store_true",
                   help="Nur Preview, nichts senden")
    p.add_argument("--yes", "-y", action="store_true",
                   help="Bestätigungs-Prompt überspringen")
    p.add_argument("--env", default=str(ENV_PATH),
                   help=f"Pfad zur .env (Default: {ENV_PATH})")
    args = p.parse_args()

    cfg = load_env(Path(args.env))
    try:
        host = cfg.get("MAIL_HOST", "smtp.gmail.com")
        port = int(cfg.get("MAIL_PORT", "587"))
        user = cfg["MAIL_USERNAME"]
        pw = cfg["MAIL_PASSWORD"]
    except KeyError as e:
        sys.exit(f".env unvollständig — Variable fehlt: {e}")

    from_addr = formataddr((args.from_name, user))
    subject, body_tpl = load_template(TEMPLATE_PATH)
    recipients = parse_recipients(args.recipients)

    n0, m0 = recipients[0]
    sep = "=" * 70
    print(sep)
    print(f"PREVIEW — Mail an {n0} <{m0}>")
    print(sep)
    print(f"From:    {from_addr}")
    print(f"To:      {formataddr((n0, m0))}")
    print(f"Subject: {subject}")
    print()
    print(body_tpl.replace("{Vorname}", n0))
    print(sep)
    print()
    print(f"Würde an {len(recipients)} Empfänger gehen:")
    for n, m in recipients:
        print(f"  • {n} <{m}>")
    print()

    if args.dry_run:
        print("--dry-run aktiv — kein Versand.")
        return

    if not args.yes:
        ans = input("Senden? [yes/no] ").strip().lower()
        if ans != "yes":
            print("Abbruch.")
            return

    ctx = ssl.create_default_context()
    sent, failed = 0, 0
    with smtplib.SMTP(host, port, timeout=30) as smtp:
        smtp.starttls(context=ctx)
        smtp.login(user, pw)
        for name, mail in recipients:
            msg = MIMEText(body_tpl.replace("{Vorname}", name), "plain", "utf-8")
            msg["Subject"] = subject
            msg["From"] = from_addr
            msg["To"] = formataddr((name, mail))
            msg["Date"] = formatdate(localtime=True)
            msg["Message-ID"] = make_msgid(domain="cavdar.de")
            try:
                smtp.send_message(msg)
                print(f"  ✓ {name} <{mail}>")
                sent += 1
                time.sleep(0.5)
            except Exception as e:
                print(f"  ✗ {name} <{mail}>: {e}")
                failed += 1

    print()
    print(f"Fertig: {sent} gesendet, {failed} fehlgeschlagen.")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
