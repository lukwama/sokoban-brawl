#!/bin/bash

###############################################################################
# Auto-Deployment Script for Sokoban Brawl
# 
# en_US:
# This script is triggered by GitHub webhook to automatically update and 
# restart the production server.
#
# zh_TW:
# 此腳本由 GitHub webhook 觸發，自動更新並重啟正式環境伺服器。
###############################################################################

set -e

# Detect repository directory (use REPO_DIR env var, or script's parent directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="${REPO_DIR:-$(dirname "$SCRIPT_DIR")}"
BRANCH="${DEPLOY_BRANCH:-main}"

# Log file (use LOG_FILE env var, or default location)
LOG_FILE="${LOG_FILE:-/var/log/sokoban-brawl-deploy.log}"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "Deployment started"
log "=========================================="

# Navigate to repository directory
cd "$REPO_DIR" || {
    log "ERROR: Failed to cd to $REPO_DIR"
    exit 1
}

# Stash any local changes (backup)
log "Stashing local changes..."
git stash

# Fetch and pull latest changes
log "Fetching latest changes from origin/$BRANCH..."
git fetch origin "$BRANCH"

log "Pulling latest changes..."
git pull origin "$BRANCH" || {
    log "ERROR: git pull failed"
    exit 1
}

# Install/update dependencies
log "Installing dependencies..."
npm ci --omit=dev || {
    log "ERROR: npm ci failed"
    exit 1
}

# Restart service (adjust service name if different)
SERVICE_NAME="sokoban-brawl"
log "Restarting service: $SERVICE_NAME..."
sudo systemctl restart "$SERVICE_NAME" || {
    log "ERROR: Failed to restart $SERVICE_NAME"
    exit 1
}

# Wait and check service status
sleep 2
if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
    log "Service $SERVICE_NAME is running"
else
    log "WARNING: Service $SERVICE_NAME may not be running"
fi

log "=========================================="
log "Deployment completed successfully"
log "=========================================="
