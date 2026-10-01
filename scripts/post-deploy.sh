#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_DIR="/home/ubuntu/apps/booking_mesh"
SHARED_DIR="$DEPLOY_DIR/shared"
APP_URL="http://127.0.0.1:5050"

command -v npx >/dev/null 2>&1
command -v node >/dev/null 2>&1
command -v pm2 >/dev/null 2>&1
command -v curl >/dev/null 2>&1
[ -s "$SHARED_DIR/.env" ]
PNPM=(npx --yes pnpm@10.33.4)

processes_online() {
  pm2 jlist | node -e '
    let input = "";
    process.stdin.on("data", (chunk) => (input += chunk));
    process.stdin.on("end", () => {
      const required = new Set(["ekantah-email-templates", "ekantah-cron-runner"]);
      for (const process of JSON.parse(input)) {
        if (process.pm2_env.status === "online") required.delete(process.name);
      }
      process.exit(required.size === 0 ? 0 : 1);
    });
  '
}

echo "[1/7] Preparing shared persistent files..."
mkdir -p "$SHARED_DIR/logs" "$SHARED_DIR/whatsapp_auth"
chmod 700 "$SHARED_DIR"
chmod 600 "$SHARED_DIR/.env"
[ ! -L ./logs ] || unlink ./logs
[ ! -L ./whatsapp_auth ] || unlink ./whatsapp_auth
ln -sfn "$SHARED_DIR/.env" .env

echo "[2/7] Installing locked dependencies..."
"${PNPM[@]}" install --frozen-lockfile

echo "[3/7] Generating Prisma client..."
"${PNPM[@]}" prisma generate

echo "[4/7] Running database migrations..."
"${PNPM[@]}" prisma migrate deploy

echo "[5/7] Building production processes..."
NODE_OPTIONS="--max-old-space-size=4096" "${PNPM[@]}" build
"${PNPM[@]}" build:cron

echo "[6/7] Reloading PM2 processes..."
pm2 startOrReload ecosystem.config.js --only ekantah-email-templates --env production --update-env
pm2 delete ekantah-cron-runner >/dev/null 2>&1 || true
pm2 start ecosystem.config.js --only ekantah-cron-runner --env production --update-env

echo "[7/7] Verifying processes and application health..."
for ((attempt = 1; attempt <= 30; attempt++)); do
  if processes_online &&
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
