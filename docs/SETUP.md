# Sokoban Brawl 本地開發環境設定

## 一、Python 虛擬環境

### 建立與啟用
```bash
# 使用 macOS 內建或 Homebrew Python
/usr/local/bin/python3 -m venv .venv
# 或
python3 -m venv .venv

# 啟用
source .venv/bin/activate
```

### 重要說明：SQLite
**SQLite3 為 Python 內建模組，無需 `pip install sqlite3`。** 直接 `import sqlite3` 即可。

### 驗證
```bash
source .venv/bin/activate
pip install -r requirements.txt   # 目前為空依賴
python scripts/verify_env.py      # 驗證 Python + SQLite
```

---

## 二、Node.js

本專案使用系統已安裝的 Node.js（如 Homebrew 安裝），無需 nvm。

### 安裝依賴
```bash
npm install
```

### 啟動伺服器
```bash
npm run dev
```

### 驗證
```bash
curl http://localhost:3000/health
# 應回傳 {"status":"ok","service":"sokoban-brawl"}
```

### 客戶端驗證介面
啟動伺服器後，在瀏覽器開啟 **http://localhost:3000/** 可開啟「伺服器設置與連線驗證」介面，可：
- 設定並儲存伺服器網址
- 檢查連線（GET /health）
- 取得排行榜（GET /api/leaderboard/:levelId）
- 提交測試記錄（POST /api/leaderboard/:levelId）

---

## 三、快速檢查清單

| 項目 | 指令 |
|------|------|
| Python 虛擬環境 | `source .venv/bin/activate && which python` |
| SQLite | `python scripts/verify_env.py` |
| Node 依賴 | `npm install && npm ls` |
| 伺服器 | `npm run dev` |
