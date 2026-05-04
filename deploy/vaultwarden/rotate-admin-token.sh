#!/usr/bin/env bash
# Rotiert den Vaultwarden ADMIN_TOKEN.
#
# Generiert ein neues Plain-PW, hashed es mit Argon2id (Bitwarden-Preset),
# schreibt den $$-escapeten Hash in /opt/vaultwarden/.env, restartet den
# Container und verifiziert serverseitig, dass der neue Token wirklich
# eingeloggt werden kann.
#
# Plain-PW landet NICHT in stdout, sondern nur in /root/vw-admin-pw.txt
# (chmod 600). Nach dem Sichern in den Vault: `shred -u /root/vw-admin-pw.txt`.

set -euo pipefail

ENV_FILE=/opt/vaultwarden/.env
COMPOSE_DIR=/opt/vaultwarden
PW_FILE=/root/vw-admin-pw.txt
TMP_PW=$(mktemp)
TMP_COOKIE=$(mktemp)
trap 'rm -f "$TMP_PW" "$TMP_COOKIE"' EXIT
chmod 600 "$TMP_PW" "$TMP_COOKIE"

command -v argon2 >/dev/null || { echo "argon2 CLI fehlt — apt install -y argon2"; exit 1; }
[ -f "$ENV_FILE" ] || { echo "$ENV_FILE nicht gefunden"; exit 1; }

PLAIN=$(openssl rand -base64 32)
SALT=$(openssl rand -base64 16)
HASH=$(printf '%s' "$PLAIN" | argon2 "$SALT" -id -t 3 -k 65540 -p 4 -l 32 -e)
ESCAPED=$(printf '%s' "$HASH" | sed 's/\$/\$\$/g')

BACKUP="$ENV_FILE.bak.$(date +%Y%m%d_%H%M%S)"
cp "$ENV_FILE" "$BACKUP"
awk -v new="ADMIN_TOKEN=$ESCAPED" '
    /^ADMIN_TOKEN=/ { print new; next }
    { print }
' "$ENV_FILE" > "$ENV_FILE.new"
mv "$ENV_FILE.new" "$ENV_FILE"
chmod 600 "$ENV_FILE"

cd "$COMPOSE_DIR"
docker compose down >/dev/null 2>&1
docker compose up -d >/dev/null 2>&1

for _ in $(seq 1 30); do
    curl -sf http://127.0.0.1:8222/alive >/dev/null && break
    sleep 1
done

printf '%s' "$PLAIN" > "$TMP_PW"
curl -s -o /dev/null \
    -X POST http://127.0.0.1:8222/admin \
    -c "$TMP_COOKIE" \
    --data-urlencode "token@$TMP_PW" \
    --max-redirs 0

printf '%s\n' "$PLAIN" > "$PW_FILE"
chmod 600 "$PW_FILE"
unset PLAIN SALT HASH ESCAPED

if grep -q "VW_ADMIN" "$TMP_COOKIE"; then
    echo "✓ Rotation erfolgreich. VW_ADMIN-Cookie gesetzt → Token funktioniert."
    echo
    echo "Plain-PW liegt in: $PW_FILE  (chmod 600, nur root lesbar)"
    echo "Backup alter .env: $BACKUP"
    echo
    echo "Nächste Schritte (manuell):"
    echo "  cat $PW_FILE              # PW im Terminal lesen"
    echo "  -> in deinen Vault speichern"
    echo "  shred -u $PW_FILE         # PW-Datei sicher löschen"
else
    echo "✗ Rotation FEHLGESCHLAGEN — Token wurde nicht akzeptiert."
    echo
    echo "Container-Logs:"
    docker compose logs --tail=15 vaultwarden
    echo
    echo "Rollback mit:  cp $BACKUP $ENV_FILE && docker compose down && docker compose up -d"
    echo "Plain-PW liegt trotzdem in: $PW_FILE"
    exit 1
fi
