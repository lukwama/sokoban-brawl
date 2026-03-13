#!/bin/bash

###############################################################################
# Test script for path auto-detection
# 
# en_US: Verifies that deploy.sh correctly detects project directory
# zh_TW: 驗證 deploy.sh 是否正確偵測專案目錄
###############################################################################

echo "=== Path Detection Test ==="
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Script directory: $SCRIPT_DIR"

# Get project root (parent of scripts/)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
echo "Detected project root: $PROJECT_ROOT"
echo ""

# Verify key files exist
echo "Verifying project structure..."
if [ -f "$PROJECT_ROOT/package.json" ]; then
    echo "✓ package.json found"
else
    echo "✗ package.json NOT found"
fi

if [ -f "$PROJECT_ROOT/server/index.js" ]; then
    echo "✓ server/index.js found"
else
    echo "✗ server/index.js NOT found"
fi

if [ -f "$PROJECT_ROOT/scripts/deploy.sh" ]; then
    echo "✓ scripts/deploy.sh found"
else
    echo "✗ scripts/deploy.sh NOT found"
fi

if [ -d "$PROJECT_ROOT/.git" ]; then
    echo "✓ .git directory found"
else
    echo "✗ .git directory NOT found"
fi

echo ""
echo "Git repository root:"
git -C "$PROJECT_ROOT" rev-parse --show-toplevel 2>/dev/null || echo "(not a git repo)"

echo ""
echo "=== Test Complete ==="
