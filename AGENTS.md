## 📄 AGENTS.md (Project Context for AI Agents)

### 🇹🇼 繁體中文版

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

---

### 🇺🇸 English Version

# Project Overview: Sokoban Brawl

This document serves as a guide for AI Agents to quickly understand the technical architecture and development standards of this project.

### 1. Core Technology Stack

* **Server-side**:
* **Languages**: Python (Core logic), Node.js (Connection handling).
* **Communication**: Socket.io (WebSocket).


* **Client-side**:
* **Engine**: Godot Engine (Targeting cross-platform App deployment).
* **Core Technologies**: HTML5 Canvas / JavaScript (Initial prototyping & web testing).


* **Database**: SQLite (using WAL mode for asynchronous persistence).

### 2. Development Guidelines

* **Security & Anti-Cheat**:
* **Authoritative Server**: All move validation (collision, push logic) must be processed on the server. Clients only send "Intent" packets.
* **Encryption**: Implement HMAC signatures on data packets to prevent tampering and injection attacks.


* **Unified Transport Protocol**:
* All data structures use **JSON** with required fields: `timestamp`, `action_id`, and `checksum` to ensure consistency across future mobile/desktop platforms (iOS/Android/PC).



### 3. Principles for AI Collaboration

* Always adhere to the "Authoritative Server" pattern; never place game logic on the client.
* Write modular code to facilitate the transition from HTML5/JS logic to Godot GDScript.
