# Path Auto-Detection Explanation

### en_US (English)

## How the Deployment Script Detects Project Path

The deployment script (`scripts/deploy.sh`) uses intelligent path detection to work in any directory:

### Default Behavior

```bash
# Script automatically detects its location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Example: /home/user/sokoban-brawl/scripts

# Project root is the parent directory of scripts/
REPO_DIR="$(dirname "$SCRIPT_DIR")"
# Example: /home/user/sokoban-brawl
```

### Override with Environment Variable

If your project structure is different, set `REPO_DIR` in `.env`:

```bash
# In .env file
REPO_DIR=/opt/sokoban-brawl
```

Or in systemd service:

```ini
[Service]
Environment="REPO_DIR=/opt/sokoban-brawl"
```

## Common Project Locations

| Location | Typical Use Case |
|----------|------------------|
| `/opt/sokoban-brawl` | System-wide production installation |
| `/home/user/sokoban-brawl` | User-specific deployment |
| `/var/www/sokoban-brawl` | Web server document root |
| `/srv/sokoban-brawl` | Service data directory |

## For AI Agents

When connecting to a remote server:

1. **Check current directory**: `pwd`
2. **Verify git repository**: `git rev-parse --show-toplevel`
3. **Use that path** for all operations

**Example Agent Workflow:**

```bash
# Detect project root
PROJECT_ROOT=$(git rev-parse --show-toplevel)
cd "$PROJECT_ROOT"

# Now work from project root
git pull origin main
nano .env  # Create config here
chmod +x scripts/deploy.sh
```

## Benefits of Auto-Detection

✅ **Portable**: Works in any directory  
✅ **No hardcoded paths**: Adapts to different server setups  
✅ **Agent-friendly**: AI agents can work without knowing exact paths  
✅ **Flexible**: Easy to override when needed  

---

### zh_TW（繁體中文）

## 部署腳本如何偵測專案路徑

部署腳本（`scripts/deploy.sh`）使用智慧路徑偵測，可在任何目錄運作：

### 預設行為

```bash
# 腳本自動偵測其位置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# 範例：/home/user/sokoban-brawl/scripts

# 專案根目錄是 scripts/ 的父目錄
REPO_DIR="$(dirname "$SCRIPT_DIR")"
# 範例：/home/user/sokoban-brawl
```

### 使用環境變數覆寫

如果專案結構不同，在 `.env` 中設定 `REPO_DIR`：

```bash
# 在 .env 檔案中
REPO_DIR=/opt/sokoban-brawl
```

或在 systemd 服務中：

```ini
[Service]
Environment="REPO_DIR=/opt/sokoban-brawl"
```

## 常見專案位置

| 位置 | 典型用途 |
|------|---------|
| `/opt/sokoban-brawl` | 系統級正式環境安裝 |
| `/home/user/sokoban-brawl` | 使用者專屬部署 |
| `/var/www/sokoban-brawl` | 網頁伺服器文件根目錄 |
| `/srv/sokoban-brawl` | 服務資料目錄 |

## 給 AI Agent

連接到遠端伺服器時：

1. **檢查當前目錄**：`pwd`
2. **驗證 git 儲存庫**：`git rev-parse --show-toplevel`
3. **使用該路徑**進行所有操作

**Agent 工作流程範例：**

```bash
# 偵測專案根目錄
PROJECT_ROOT=$(git rev-parse --show-toplevel)
cd "$PROJECT_ROOT"

# 現在從專案根目錄工作
git pull origin main
nano .env  # 在此建立配置
chmod +x scripts/deploy.sh
```

## 自動偵測的優點

✅ **可攜性**：可在任何目錄運作  
✅ **無硬編碼路徑**：適應不同伺服器設置  
✅ **Agent 友好**：AI agent 無需知道確切路徑即可工作  
✅ **靈活**：需要時易於覆寫
