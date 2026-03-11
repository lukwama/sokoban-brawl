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
