#!/usr/bin/env bash
# Sokoban Brawl 伺服器 - Linux 單行啟動
# 用法：curl -sSL https://raw.githubusercontent.com/lukwama/sokoban-brawl/main/scripts/run.sh | bash
# 或：./scripts/run.sh（在專案目錄內）

set -e
REPO_URL="https://github.com/lukwama/sokoban-brawl.git"

# 若已在專案目錄（有 package.json 和 server/）則直接使用
if [ -f "package.json" ] && [ -d "server" ]; then
  RUN_DIR="$(pwd)"
else
  RUN_DIR="${SOKOBAN_DIR:-$(mktemp -d)}"
  echo "Cloning sokoban-brawl..."
  git clone --depth 1 "$REPO_URL" "$RUN_DIR"
fi

cd "$RUN_DIR"
echo "Installing dependencies..."
npm install --silent
echo "Starting server (PORT=${PORT:-3000})..."
exec node server/index.js
