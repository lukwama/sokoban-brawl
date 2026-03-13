## 📄 AGENTS.md (Project Context for AI Agents)

### en_US (English) — preferred order for new content

# Project Overview: Sokoban Brawl

This document guides AI Agents on this project’s architecture and conventions.

### 1. Core Technology Stack

* **Server**: Python (core logic), Node.js (connection handling). Socket.io (WebSocket).
* **Client**: Godot Engine (future cross-platform); HTML5 Canvas / JavaScript (current prototype).
* **Database**: SQLite (WAL mode).

### 2. Development Guidelines

* **Authoritative Server**: All move validation and state updates on the server; client sends only intent.
* **Security**: HMAC signatures on packets; JSON with `timestamp`, `action_id`, `checksum`.
* **Open source**: No real host IPs, passwords, API keys, or tokens in docs/code; use placeholders or env vars.

### 3. AI Collaboration Principles

* Keep game logic on the server; write modular code for future Godot migration.
* **Documentation and comments (international community)**:
  * This project targets a global audience. **Provide both en_US (English) and zh_TW (Traditional Chinese)** for user-facing docs and important comments.
  * **Order**: **Put the en_US block first (above), then the zh_TW block (below).**
  * Applies to: README, docs, API descriptions, significant code comments, and release notes.

---

### zh_TW（繁體中文）

# 專案概覽：倉庫大亂鬥 (Sokoban Brawl)

本文件旨在指導 AI Agent 快速理解本專案之技術架構與開發規範。

### 1. 核心技術棧

* **伺服器端 (Server)**:
* **語言**: Python (核心邏輯), Node.js (連線處理)。
* **通訊**: Socket.io (WebSocket)。


* **客戶端 (Client)**:
* **引擎**: Godot Engine (用於未來跨平台 App 部署)。
* **核心技術**: HTML5 Canvas / JavaScript (初期原型與 Web 端測試)。


* **資料庫**: SQLite (配合 WAL 模式進行異步數據持久化)。

### 2. 技術開發規範

* **防作弊與安全**:
* **權威伺服器 (Authoritative Server)**: 所有推箱子邏輯與座標更新必須由伺服器判定，客戶端僅負責發送「操作意圖」。
* **加密措施**: 傳輸封包使用 HMAC 簽章驗證，確保封包未被篡改。


* **統一傳輸協定**:
* 所有傳輸資料統一格式為 **JSON**，並包含 `timestamp`、`action_id`、`checksum`，以確保跨平台（PC, iOS, Android）解析一致。



### 3. AI 協助開發原則

* 優先遵循「權威伺服器」原則，避免在客戶端實現業務邏輯。
* 撰寫代碼時請確保模組化，以便從 HTML5 邏輯無痛遷移至 Godot GDScript。
* **開源與敏感資訊**：本專案可被公開查閱，文件與程式碼中不得包含實際主機 IP、密碼、API 金鑰或 Token；連線與部署資訊請以佔位符（如 `YOUR_SERVER_IP`）或環境變數說明取代。
* **文件與註解（國際社群）**：本專案面向國際社群，**說明與備註須同時提供 en_US（英文）與 zh_TW（繁體中文）**，方便全球開發者貢獻。**順序**：**en_US 區塊在上方、zh_TW 區塊在下方**。適用於 README、docs、API 說明、重要程式註解與 release notes。

---

## Cursor Cloud specific instructions

### en_US (English)

**Architecture**: Single Node.js process (Express + Socket.io + sql.js embedded SQLite). The server serves both the REST API and static client files on port 3000.

**Running the dev server**:
```bash
npm install   # install dependencies
npm run dev   # starts server at http://localhost:3000
```

**Verification**:
- Health check: `curl http://localhost:3000/health` → `{"status":"ok","service":"sokoban-brawl"}`
- Leaderboard API: `GET /api/leaderboard/:levelId`, `POST /api/leaderboard/:levelId`
- Client UI: open `http://localhost:3000/` in a browser

**Caveats**:
- No lint or test scripts are configured in `package.json`. There is no ESLint config or test framework set up.
- The project uses ESM (`"type": "module"` in `package.json`).
- SQLite data is stored at `data/sokoban.db` (auto-created on first run). Deleting this file resets all leaderboard data.
- No `.env` file is required for local development; the server defaults to port 3000.
- The `requirements.txt` is effectively empty (Python/venv is optional, only used for `scripts/verify_env.py`).

---

### zh_TW（繁體中文）

**架構**：單一 Node.js 程序（Express + Socket.io + sql.js 嵌入式 SQLite）。伺服器同時提供 REST API 和靜態客戶端檔案，預設 port 3000。

**啟動開發伺服器**：
```bash
npm install   # 安裝依賴
npm run dev   # 啟動伺服器於 http://localhost:3000
```

**驗證**：
- 健康檢查：`curl http://localhost:3000/health` → `{"status":"ok","service":"sokoban-brawl"}`
- 排行榜 API：`GET /api/leaderboard/:levelId`、`POST /api/leaderboard/:levelId`
- 客戶端 UI：瀏覽器開啟 `http://localhost:3000/`

**注意事項**：
- `package.json` 中未配置 lint 或 test 腳本，無 ESLint 或測試框架。
- 專案使用 ESM（`package.json` 中 `"type": "module"`）。
- SQLite 資料儲存於 `data/sokoban.db`（首次執行時自動建立），刪除此檔案會重置所有排行榜資料。
- 本地開發不需要 `.env` 檔案，伺服器預設使用 port 3000。
- `requirements.txt` 實際為空（Python/venv 為可選，僅用於 `scripts/verify_env.py`）。
