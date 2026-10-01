#!/usr/bin/env bash
set -Eeuo pipefail

# PM2 Deployment System wrapper
# Documentation: https://pm2.keymetrics.io/docs/usage/deployment/
#
# Commands:
#   ./scripts/pm2_deploy.sh setup         # Provision remote server (clones repo & sets up shared dirs)
#   ./scripts/pm2_deploy.sh               # Deploy latest commit from origin/main
#   ./scripts/pm2_deploy.sh revert [n]    # Rollback to previous release (default: 1)
#   ./scripts/pm2_deploy.sh curr          # Output current active release commit
#   ./scripts/pm2_deploy.sh prev          # Output previous release commit
#   ./scripts/pm2_deploy.sh list          # List previous deploy commits
#   ./scripts/pm2_deploy.sh exec <cmd>    # Run a command on remote server

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/ecosystem.config.js"
ENVIRONMENT="${PM2_DEPLOY_ENV:-production}"
CMD="${1:-deploy}"

cd "$PROJECT_ROOT"

command -v pm2 >/dev/null 2>&1 || {
  echo "pm2 is required locally. Install it before deploying." >&2
  exit 1
}

check_release() {
  if [ -n "$(git status --porcelain)" ]; then
    echo "The working tree is not clean. Commit or stash changes before deploying." >&2
    exit 1
  fi

  git fetch --quiet origin main
  if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
    echo "HEAD must match origin/main before deploying." >&2
    exit 1
  fi
}

case "$CMD" in
  setup)
    echo "Provisioning $ENVIRONMENT for PM2 deployment..."
    pm2 deploy "$CONFIG_FILE" "$ENVIRONMENT" setup
    ;;
  revert)
    STEPS="${2:-1}"
    [[ "$STEPS" =~ ^[1-9][0-9]*$ ]] || {
      echo "Rollback steps must be a positive integer." >&2
      exit 1
    }
    echo "Reverting $ENVIRONMENT by $STEPS deployment(s)..."
    pm2 deploy "$CONFIG_FILE" "$ENVIRONMENT" revert "$STEPS"
    ;;
  curr|current)
    pm2 deploy "$CONFIG_FILE" "$ENVIRONMENT" curr
    ;;
  prev|previous)
    pm2 deploy "$CONFIG_FILE" "$ENVIRONMENT" prev
    ;;
  list)
    pm2 deploy "$CONFIG_FILE" "$ENVIRONMENT" list
    ;;
  exec|run)
    shift
    [ "$#" -gt 0 ] || {
      echo "A remote command is required." >&2
      exit 1
    }
    pm2 deploy "$CONFIG_FILE" "$ENVIRONMENT" exec "$*"
    ;;
  deploy|update)
    shift || true
    check_release
    echo "Deploying origin/main to $ENVIRONMENT..."
    pm2 deploy "$CONFIG_FILE" "$ENVIRONMENT" update "$@"
    ;;
  *)
    # Pass through any other pm2 deploy argument (e.g. --force)
    pm2 deploy "$CONFIG_FILE" "$ENVIRONMENT" "$@"
    ;;
esac
