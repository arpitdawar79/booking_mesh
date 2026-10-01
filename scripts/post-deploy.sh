#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_DIR="/home/ubuntu/apps/booking_mesh"
SHARED_DIR="$DEPLOY_DIR/shared"
APP_URL="http://127.0.0.1:5050"

command -v pnpm >/dev/null 2>&1
command -v pm2 >/dev/null 2>&1
command -v curl >/dev/null 2>&1
[ -s "$SHARED_DIR/.env" ]

echo "[1/7] Linking shared persistent files..."
mkdir -p "$SHARED_DIR/logs" "$SHARED_DIR/whatsapp_auth"
chmod 700 "$SHARED_DIR"
chmod 600 "$SHARED_DIR/.env"
ln -sfn "$SHARED_DIR/.env" .env
ln -sfn "$SHARED_DIR/whatsapp_auth" ./whatsapp_auth
ln -sfn "$SHARED_DIR/logs" ./logs

echo "[2/7] Installing locked dependencies..."
pnpm install --frozen-lockfile

echo "[3/7] Generating Prisma client..."
pnpm prisma generate

echo "[4/7] Running database migrations..."
pnpm prisma migrate deploy

echo "[5/7] Building Next.js for production..."
NODE_OPTIONS="--max-old-space-size=4096" pnpm build

echo "[6/7] Reloading PM2 processes..."
pm2 startOrReload ecosystem.config.js --env production --update-env

echo "[7/7] Verifying processes and application health..."
for ((attempt = 1; attempt <= 30; attempt++)); do
  if [ "$(pm2 pid ekantah-email-templates)" != "0" ] &&
    [ "$(pm2 pid ekantah-cron-runner)" != "0" ] &&
    curl --fail --silent --show-error --max-time 5 "$APP_URL/api/health" >/dev/null; then
    pm2 save
    echo "PM2 deployment complete."
    exit 0
  fi
  sleep 2
done

pm2 status
pm2 logs ekantah-email-templates --lines 30 --nostream || true
pm2 logs ekantah-cron-runner --lines 30 --nostream || true
echo "Deployment health verification failed." >&2
exit 1
