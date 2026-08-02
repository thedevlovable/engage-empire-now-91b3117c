#!/usr/bin/env bash
# ============================================================
# backup.sh — daily DB backup + retention
# Cron/timer: roz 3:30 AM
# Usage: sudo bash /opt/extips/deploy/backup.sh
# ============================================================
set -euo pipefail

DB_CONTAINER="extips-db"
BACKUP_DIR="/opt/extips/backups"
RETENTION_DAYS=14
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/extips-$STAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

docker ps --format '{{.Names}}' | grep -qx "$DB_CONTAINER" || {
  echo "ERROR: $DB_CONTAINER running nahi hai — backup skip"; exit 1; }

echo "==> Dump -> $OUT"
docker exec "$DB_CONTAINER" pg_dumpall -U postgres | gzip -9 > "$OUT"

SIZE=$(du -h "$OUT" | cut -f1)
echo "==> Size: $SIZE"

# Corrupt/empty backup detect (gzip footer check)
if ! gzip -t "$OUT"; then
  echo "ERROR: backup corrupt hai, delete kar raha hoon"; rm -f "$OUT"; exit 1
fi

# Sanity: 1 MB se chhota backup suspicious hai
BYTES=$(stat -c%s "$OUT")
if [[ "$BYTES" -lt 1000000 ]]; then
  echo "WARNING: backup sirf $BYTES bytes ka hai — check karo!"
fi

echo "==> Retention: ${RETENTION_DAYS} din se purane hata raha hoon"
find "$BACKUP_DIR" -name 'extips-*.sql.gz' -type f -mtime +$RETENTION_DAYS -print -delete

echo "==> Maujooda backups:"
ls -lh "$BACKUP_DIR" | tail -20
