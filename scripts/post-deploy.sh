#!/usr/bin/env bash
set -e

DEPLOY_DIR="/home/ubuntu/booking_mesh"
SHARED_DIR="$DEPLOY_DIR/shared"

echo "🔗 [1/6] Symlinking shared persistent files..."
mkdir -p "$SHARED_DIR/logs" "$SHARED_DIR/whatsapp_auth"
ln -sfn "$SHARED_DIR/.env" .env
ln -sfn "$SHARED_DIR/whatsapp_auth" ./whatsapp_auth
ln -sfn "$SHARED_DIR/logs" ./logs

echo "📦 [2/6] Installing dependencies..."
pnpm install

echo "🗄️ [3/6] Generating Prisma client..."
pnpm prisma generate

echo "🚀 [4/6] Running database migrations..."
pnpm prisma migrate deploy

echo "🏗️ [5/6] Building Next.js for production..."
NODE_OPTIONS="--max-old-space-size=4096" pnpm build

echo "♻️ [6/6] Reloading PM2 processes..."
pm2 startOrReload ecosystem.config.js --env production --update-env

echo "✅ PM2 deployment complete!"
