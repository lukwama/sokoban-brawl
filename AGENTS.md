## 📄 AGENTS.md (Project Context for AI Agents)

### en_US (English) — preferred order for new content

# Project Overview: Sokoban Brawl

This document guides AI Agents on this project's architecture and conventions.

### 1. Core Technology Stack

* **Server**: Node.js 18+ (Express + Socket.io + sql.js embedded SQLite). Single process serves REST API and static client files on port 3000.
* **Client**: HTML5 / JavaScript (current prototype at `client/`); Godot Engine planned for future cross-platform.
* **Database**: SQLite via sql.js (file at `data/sokoban.db`, auto-created on first run).

### 2. Project Structure

```
sokoban-brawl/
├── client/           # Frontend: HTML, CSS, JS
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── game.js   # Game logic, UI, tabs, editor, leaderboard
│       └── app.js    # Legacy admin/test UI (not used in main game)
├── server/           # Backend: Express + Socket.io + SQLite
│   ├── index.js      # Entry point
│   ├── db.js         # Database layer
│   ├── levels.json   # Built-in level definitions
│   ├── seedDefaultLevels.js
│   └── core/
│       └── validator.js  # Sokoban path validation
├── scripts/          # Deploy, setup, and utility scripts
├── docs/             # Documentation (deployment, API design, etc.)
├── tests/            # Test scripts and utilities
├── archive/          # Historical reports and summaries (safe to delete)
├── data/             # Runtime SQLite DB (gitignored, auto-created)
├── AGENTS.md         # This file — AI Agent guidance
├── README.md         # Project readme (bilingual)
├── package.json      # Node.js config (ESM)
└── .cursor/rules/    # Cursor IDE rules
```

### 3. Key Features (Current)

* **Single-player Sokoban**: 56 built-in levels + server-stored custom levels
* **Leaderboard**: Per-level ranking with server-side move validation
* **Replay playback**: Watch recorded solutions from leaderboard entries
* **Level editor**: Create, test, and upload custom levels (requires completion before upload)
* **Level deep links**: `/singleplayer/:levelId` routes directly to a specific level
* **Level jump modal**: Click the level number to jump to any level (works in both game and leaderboard views)
* **Share button**: Copy a level's shareable URL to clipboard with bilingual toast notification
* **Control modes**: Button d-pad, swipe (touch), or auto-detect
* **Multiplayer**: Socket.io wired but gameplay not yet implemented

### 4. Development Guidelines

* **Authoritative Server**: All move validation and state updates on the server; client sends only intent.
* **Security**: HMAC signatures on packets (planned); JSON with `timestamp`, `action_id`, `checksum`.
* **Open source**: No real host IPs, passwords, API keys, or tokens in docs/code; use placeholders or env vars.

### 5. AI Collaboration Principles

* Keep game logic on the server; write modular code for future Godot migration.
* **Documentation and comments (international community)**:
  * This project targets a global audience. **Provide both en_US (English) and zh_TW (Traditional Chinese)** for user-facing docs and important comments.
  * **Order**: **Put the en_US block first (above), then the zh_TW block (below).**
  * Applies to: README, docs, API descriptions, significant code comments, and release notes.

### 6. Project Cleanliness Guidelines

AI Agents should maintain a clean and organized project structure:

* **No loose files in root**: The repository root should only contain essential config files (`package.json`, `.gitignore`, `.env.example`, `LICENSE`, `README.md`, `AGENTS.md`, `requirements.txt`). Do not scatter temporary test files, reports, or one-off scripts in the root.
* **Temporary test files**: Place in `tests/` directory. Remove when no longer needed.
* **Reports and summaries**: Place in `archive/` if they need to be kept, or delete if no longer relevant.
* **Documentation**: Place in `docs/` directory.
* **Scripts**: Place in `scripts/` directory.
* **Files safe to delete**: `archive/` contents, `tests/` test scripts, and `data/sokoban.db` (auto-recreated on server start) can all be safely deleted without affecting server deployment or client functionality.

---

### zh_TW（繁體中文）

# 專案概覽：倉庫大亂鬥 (Sokoban Brawl)

本文件旨在指導 AI Agent 快速理解本專案之技術架構與開發規範。

### 1. 核心技術棧

* **伺服器端 (Server)**: Node.js 18+（Express + Socket.io + sql.js 嵌入式 SQLite）。單一程序同時提供 REST API 和靜態客戶端檔案，預設 port 3000。
* **客戶端 (Client)**: HTML5 / JavaScript（目前原型在 `client/`）；未來計劃遷移至 Godot Engine 跨平台部署。
* **資料庫**: SQLite（透過 sql.js，檔案位於 `data/sokoban.db`，首次執行時自動建立）。

### 2. 專案結構

```
sokoban-brawl/
├── client/           # 前端：HTML、CSS、JS
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── game.js   # 遊戲邏輯、UI、分頁、編輯器、排行榜
│       └── app.js    # 舊版管理/測試 UI（主遊戲未使用）
├── server/           # 後端：Express + Socket.io + SQLite
│   ├── index.js      # 入口
│   ├── db.js         # 資料庫層
│   ├── levels.json   # 內建關卡定義
│   ├── seedDefaultLevels.js
│   └── core/
│       └── validator.js  # 推箱子路徑驗證
├── scripts/          # 部署、設定和工具腳本
├── docs/             # 文件（部署、API 設計等）
├── tests/            # 測試腳本和工具
├── archive/          # 歷史報告和摘要（可安全刪除）
├── data/             # 執行時 SQLite 資料庫（gitignored，自動建立）
├── AGENTS.md         # 本檔案 — AI Agent 指引
├── README.md         # 專案說明（雙語）
├── package.json      # Node.js 設定（ESM）
└── .cursor/rules/    # Cursor IDE 規則
```

### 3. 主要功能（目前）

* **單人推箱子**：56 個內建關卡 + 伺服器端儲存的自訂關卡
* **排行榜**：每關排名，伺服器端步數驗證
* **回放播放**：觀看排行榜紀錄的解題過程
* **關卡編輯器**：建立、測試並上傳自訂關卡（上傳前須先通關）
* **關卡深層連結**：`/singleplayer/:levelId` 可直接跳到特定關卡
* **快速跳關**：點擊關卡數字可跳到任意關卡（遊戲介面及排行榜介面皆支援）
* **分享按鈕**：將關卡專屬連結複製到剪貼簿，附雙語 toast 通知
* **操控模式**：按鈕方向鍵、滑動（觸控）、或自動偵測
* **多人模式**：Socket.io 已接線但玩法尚未實作

### 4. 技術開發規範

* **權威伺服器 (Authoritative Server)**：所有推箱子邏輯與座標更新必須由伺服器判定，客戶端僅負責發送「操作意圖」。
* **安全措施**：傳輸封包使用 HMAC 簽章驗證（計劃中）；JSON 格式含 `timestamp`、`action_id`、`checksum`。
* **開源與敏感資訊**：文件與程式碼中不得包含實際主機 IP、密碼、API 金鑰或 Token；連線與部署資訊請以佔位符或環境變數說明取代。

### 5. AI 協助開發原則

* 優先遵循「權威伺服器」原則，避免在客戶端實現業務邏輯。
* 撰寫代碼時請確保模組化，以便從 HTML5 邏輯無痛遷移至 Godot GDScript。
* **文件與註解（國際社群）**：本專案面向國際社群，**說明與備註須同時提供 en_US（英文）與 zh_TW（繁體中文）**。**順序**：**en_US 區塊在上方、zh_TW 區塊在下方**。適用於 README、docs、API 說明、重要程式註解與 release notes。

### 6. 專案整潔原則

AI Agent 應維持專案結構簡潔易懂：

* **根目錄不放散落檔案**：專案根目錄應僅保留必要設定檔（`package.json`、`.gitignore`、`.env.example`、`LICENSE`、`README.md`、`AGENTS.md`、`requirements.txt`）。不應將臨時測試檔案、報告或一次性腳本散落於根目錄。
* **臨時測試檔案**：應放入 `tests/` 目錄。不再需要時應刪除。
* **報告與摘要**：如需保留，應放入 `archive/`；不再相關則應刪除。
* **文件**：應放入 `docs/` 目錄。
* **腳本**：應放入 `scripts/` 目錄。
* **可安全刪除的檔案**：`archive/` 內容、`tests/` 測試腳本、以及 `data/sokoban.db`（伺服器啟動時自動重建）均可安全刪除，不會影響伺服器部署或客戶端運行。

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
- Custom levels API: `GET /api/custom-levels`, `POST /api/custom-levels`
- Level data API: `GET /api/levels`, `GET /api/levels/:levelId`
- Client UI: open `http://localhost:3000/` in a browser
- Deep link: `http://localhost:3000/singleplayer/:levelId`

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
- 自訂關卡 API：`GET /api/custom-levels`、`POST /api/custom-levels`
- 關卡資料 API：`GET /api/levels`、`GET /api/levels/:levelId`
- 客戶端 UI：瀏覽器開啟 `http://localhost:3000/`
- 深層連結：`http://localhost:3000/singleplayer/:levelId`

**注意事項**：
- `package.json` 中未配置 lint 或 test 腳本，無 ESLint 或測試框架。
- 專案使用 ESM（`package.json` 中 `"type": "module"`）。
- SQLite 資料儲存於 `data/sokoban.db`（首次執行時自動建立），刪除此檔案會重置所有排行榜資料。
- 本地開發不需要 `.env` 檔案，伺服器預設使用 port 3000。
- `requirements.txt` 實際為空（Python/venv 為可選，僅用於 `scripts/verify_env.py`）。
