#!/bin/bash

###############################################################################
# Auto-Deployment Script for Sokoban Brawl
# 
# en_US:
# This script is triggered by GitHub webhook to automatically update and 
# restart the production server. Uses git reset --hard for reliable deployment
# regardless of local branch state.
#
# zh_TW:
# 此腳本由 GitHub webhook 觸發，自動更新並重啟正式環境伺服器。
# 使用 git reset --hard 確保無論本地分支狀態如何都能可靠部署。
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

log "Current directory: $(pwd)"
log "Current branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
log "Current commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"

# en_US: Stash local changes (e.g. data/sokoban.db modifications) to prevent conflicts
# zh_TW: 暫存本地變更（如 data/sokoban.db 修改）以避免衝突
log "Stashing local changes..."
git stash 2>&1 | tee -a "$LOG_FILE" || true

# en_US: Fetch target branch from origin
# zh_TW: 從 origin 取得目標分支
log "Fetching origin/$BRANCH..."
git fetch origin "$BRANCH" 2>&1 | tee -a "$LOG_FILE" || {
    log "ERROR: git fetch failed"
    exit 1
}

# en_US: Switch to target branch if not already on it (handles master→main migration)
# zh_TW: 若不在目標分支則切換過去（處理 master→main 遷移情形）
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')"
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    log "Switching from '$CURRENT_BRANCH' to '$BRANCH'..."
    git checkout "$BRANCH" 2>&1 | tee -a "$LOG_FILE" || {
        log "Branch '$BRANCH' not found locally, creating from origin/$BRANCH..."
        git checkout -b "$BRANCH" "origin/$BRANCH" 2>&1 | tee -a "$LOG_FILE" || {
            log "ERROR: Failed to checkout $BRANCH"
            exit 1
        }
    }
fi

# en_US: Force-reset to origin/BRANCH — guarantees exact match with remote,
#        avoids merge conflicts and diverged-branch issues.
# zh_TW: 強制重設為 origin/BRANCH — 確保與遠端完全一致，
#        避免合併衝突與分支分歧問題。
log "Resetting to origin/$BRANCH..."
git reset --hard "origin/$BRANCH" 2>&1 | tee -a "$LOG_FILE" || {
    log "ERROR: git reset --hard failed"
    exit 1
}

NEW_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
log "Now at commit: $NEW_COMMIT"

# Install/update dependencies
log "Installing dependencies..."
npm ci --omit=dev 2>&1 | tee -a "$LOG_FILE" || {
    log "ERROR: npm ci failed"
    exit 1
}

# Restart service (adjust service name if different)
SERVICE_NAME="sokoban-brawl"
log "Restarting service: $SERVICE_NAME..."
sudo systemctl restart "$SERVICE_NAME" 2>&1 | tee -a "$LOG_FILE" || {
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
log "Deployment completed successfully (commit: $NEW_COMMIT)"
log "=========================================="
