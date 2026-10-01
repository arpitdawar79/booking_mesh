#!/usr/bin/env bash
set -e

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

CMD="${1:-deploy}"

case "$CMD" in
  setup)
    echo "🚀 Provisioning remote server for PM2 deployment..."
    pm2 deploy ecosystem.config.js production setup
    ;;
  revert)
    STEPS="${2:-1}"
    echo "⏪ Reverting to previous deployment (steps: $STEPS)..."
    pm2 deploy ecosystem.config.js production revert "$STEPS"
    ;;
  curr|current)
    pm2 deploy ecosystem.config.js production curr
    ;;
  prev|previous)
    pm2 deploy ecosystem.config.js production prev
    ;;
  list)
    pm2 deploy ecosystem.config.js production list
    ;;
  exec|run)
    shift
    pm2 deploy ecosystem.config.js production exec "$*"
    ;;
  deploy)
    echo "🚀 Deploying application to production via PM2 deployment system..."
    pm2 deploy ecosystem.config.js production
    ;;
  *)
    # Pass through any other pm2 deploy argument (e.g. --force)
    pm2 deploy ecosystem.config.js production "$@"
    ;;
esac
