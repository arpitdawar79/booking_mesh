#!/usr/bin/env bash
set -e

SERVER_USER="ubuntu"
SERVER_HOST="18.60.147.134"
REMOTE_DIR="/home/ubuntu/booking_mesh"
SSH_KEY="${SSH_KEY:-}" # Optional: export SSH_KEY=~/.ssh/your-key.pem if needed

SSH_CMD="ssh"
if [ -n "$SSH_KEY" ]; then
  SSH_CMD="ssh -i $SSH_KEY"
fi

echo "🚀 [1/4] Building Next.js locally for production..."
# Use .env.production if it exists, otherwise fall back to .env
ENV_FILE=".env"
if [ -f ".env.production" ]; then
  ENV_FILE=".env.production"
fi
echo "📄 Loading environment from $ENV_FILE"

# Generate Prisma client locally
pnpm exec dotenv -e "$ENV_FILE" -- pnpm prisma generate
# Build using production environment variables (e.g. NEXT_PUBLIC_* baked into JS bundle)
pnpm exec dotenv -e "$ENV_FILE" -- pnpm build

echo "📦 [2/4] Syncing build artifacts to $SERVER_HOST..."
# Sync only necessary production files & built artifacts
rsync -avz --delete \
  -e "$SSH_CMD" \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.env' \
  --exclude '.env.local' \
  --exclude '.env.production' \
  --exclude 'logs' \
  --exclude 'backups' \
  --exclude '.next/cache' \
  ./.next \
  ./public \
  ./prisma \
  ./jobs \
  ./lib \
  ./app \
  ./package.json \
  ./pnpm-lock.yaml \
  ./pnpm-workspace.yaml \
  ./ecosystem.config.js \
  "$SERVER_USER@$SERVER_HOST:$REMOTE_DIR/"

echo "🔄 [3/4] Running database migrations & dependencies on server..."
$SSH_CMD "$SERVER_USER@$SERVER_HOST" bash -l -c "'
  set -e
  export NVM_DIR=\"\$HOME/.nvm\"
  [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\"
  nvm use 24 || true

  cd $REMOTE_DIR
  # Install deps without re-running heavy compiles
  pnpm install --prod
  # Run any pending schema migrations
  pnpm prisma migrate deploy
  # Ensure log directory exists
  mkdir -p logs
'"

echo "♻️ [4/4] Reloading PM2 on server..."
$SSH_CMD "$SERVER_USER@$SERVER_HOST" bash -l -c "'
  set -e
  export NVM_DIR=\"\$HOME/.nvm\"
  [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\"
  nvm use 24 || true

  cd $REMOTE_DIR
  pm2 startOrReload ecosystem.config.js --env production
  pm2 status
'"

echo "✅ Deployment complete! App running at http://$SERVER_HOST:5050"
