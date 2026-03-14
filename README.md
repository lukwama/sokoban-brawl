# sokoban-brawl 📦

### en_US (English)

**Sokoban Brawl** is a cross-platform multiplayer competitive game inspired by classic Sokoban. Play as a warehouse keeper to sort colored goods. Features an open-source authoritative server for private hosting and community testing.

#### 🌍 Public Testing

The game is currently open for public testing! Try out the latest single-player levels, mobile-friendly touch controls, and global leaderboard features at: **[https://sokoban.lukwama.com](https://sokoban.lukwama.com)**

#### ✨ Game Modes & Core Features

* **Single-Player Mode**: Practice routes, refine pushing strategy, and clear stages at your own pace.
* **Multiplayer Mode**: Compete against other players in real-time and fight for the highest score before time runs out.
* **Level Editor**: Build and customize your own stages.
* **Global Leaderboard**: Track top performances and compare results.
* **Leaderboard Replay Support**: Review gameplay replays tied to leaderboard entries.
* **Level Jump**: Click the level number in game or leaderboard to quickly jump to any level.
* **Share**: Copy a level's direct link to share with others.
* **Deep Links**: Access any level directly via `/singleplayer/:levelId`.

#### 🎮 Objective

Push as many of your designated colored boxes into your target zones as possible within the time limit. Rankings are determined by the final count of successfully placed items.

#### ⚔️ Mechanics & Strategy

* **Fair Play**: Maps focus on symmetry and balance.
* **Sabotage & Interference**: Displace opponents' boxes from their scoring zones; create deadlocks by pushing their boxes into corners (boxes can only be pushed, not pulled).
* **Custom Skins**: User-uploaded textures for boxes.

#### 🛠 Technical Architecture

* **Authoritative Server**: Node.js server validates move legality and resolves action order.
* **Anti-Cheat System**: Server-side validation prevents fraudulent leaderboard submissions (100% success rate).
* **Custom Level Upload**: Players can upload custom levels with validation (requires completion, prevents duplicates).
* **Open Source & Self-Hosting**: Full server code for private hosting.

#### 🚀 Quick Start

**One-line run (Linux, community testing):**
```bash
curl -sSL https://raw.githubusercontent.com/lukwama/sokoban-brawl/main/scripts/run.sh | bash
```

**Local development:**
```bash
git clone https://github.com/lukwama/sokoban-brawl.git
cd sokoban-brawl
npm install
npm run dev
```

On first run, the server automatically seeds **three demo custom levels** (IDs 57, 58, 59) from [lukwama.com/sokoban](https://lukwama.com/sokoban) defaultXMLData, with creator name **lukwama** and one leaderboard record per level. No extra step required. To re-apply these defaults later (e.g. after DB drift): `node scripts/restore_default_custom_levels.js`.

**API examples:**
```bash
curl http://localhost:3000/api/leaderboard/0
curl -X POST http://localhost:3000/api/leaderboard/0 -H "Content-Type: application/json" \
  -d '{"playerName":"Player","steps":21,"moves":"lruulldddurrrluurrddd"}'
```

#### 🖥 Server Setup

For a fresh **Ubuntu 24.04** server: [docs/SERVER-SETUP.md](docs/SERVER-SETUP.md) (SSH protection, swap, fail2ban, clone). For production (e.g. https://sokoban.lukwama.com): [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Direct links to custom levels (e.g. `/singleplayer/57`) work out of the box—no extra Nginx or server config needed.

#### 📚 Auto-Deployment

Set up GitHub webhook for automatic deployment:
- **[Quick Start (5 min)](docs/AUTO-DEPLOY-QUICKSTART.md)** - Fast setup guide
- **[Full Guide](docs/AUTO-DEPLOY.md)** - Detailed configuration and troubleshooting
- **[Remote Agent Prompt](docs/REMOTE-AGENT-DEPLOY-PROMPT.md)** - For Cursor AI Agent
- **[Path Detection](docs/PATH-DETECTION-EXPLAINED.md)** - How auto-detection works

#### 🧪 Testing & Validation

The server includes comprehensive anti-cheat and custom level validation:
- **[Test Scripts Guide](tests/README.md)** - How to run tests
- **[Validation Report](docs/VALIDATION_COMPLETE.md)** - Test results (100% success)
- **[Anti-Cheat Report](docs/ANTI_CHEAT_TEST_REPORT.md)** - Detailed anti-cheat analysis
- **[Custom Level Report](docs/CUSTOM_LEVEL_TEST_REPORT.md)** - Custom level system details

**Quick test**: `node tests/comprehensive_validation_test.js`

#### 📂 Project Structure

```
client/     — Frontend HTML/CSS/JS
server/     — Backend (Express + Socket.io + SQLite)
scripts/    — Deploy & utility scripts
docs/       — Documentation
tests/      — Test scripts & utilities
archive/    — Historical reports (safe to delete)
```

---

### zh_TW（繁體中文）

**Sokoban Brawl** 為跨平台多人競技倉庫番遊戲。扮演倉庫管理員整理指定顏色貨物，具開源權威伺服器，可自架或社群測試。

#### 🌍 公開測試

目前遊戲已開放公開測試！歡迎前往 **[https://sokoban.lukwama.com](https://sokoban.lukwama.com)** 體驗最新的單人關卡、行動裝置觸控滑動操作與全球排行榜等功能。

#### ✨ 遊戲模式與特色

* **單人模式**：練習路線、精進推箱策略，自訂步調破關。
* **多人模式**：即時與其他玩家競技，在時限內爭取最高分。
* **關卡編輯器**：自建與自訂關卡。
* **全球排行榜**：追蹤頂尖成績並比較。
* **排行榜回放**：可觀看排行榜紀錄的遊玩回放。
* **快速跳關**：在遊戲或排行榜介面點擊關卡數字，可快速跳到任意關卡。
* **分享**：複製關卡專屬連結與他人分享。
* **深層連結**：透過 `/singleplayer/:levelId` 直接存取任意關卡。

#### 🎮 目標

在時限內將己方指定顏色的箱子推入目標區，數量越多排名越高。

#### ⚔️ 機制與策略

* **公平**：地圖講究對稱與平衡。
* **干擾**：可將對手箱子推出得分區；可製造死鎖（把對手箱子推入死角，箱子只能推不能拉）。
* **自訂外觀**：支援自訂箱子貼圖。

#### 🛠 技術架構

* **權威伺服器**：Node.js 伺服器驗證操作合法性與先後順序。
* **防作弊系統**：伺服器端驗證防止虛假排行榜提交（100% 成功率）。
* **自訂關卡上傳**：玩家可上傳自訂關卡並進行驗證（需先通關、防止重複）。
* **開源與自架**：伺服器程式碼完整開放，可私人架設。

#### 🚀 快速開始

**Linux 單行啟動（社群測試）：**
```bash
curl -sSL https://raw.githubusercontent.com/lukwama/sokoban-brawl/main/scripts/run.sh | bash
```

**本地開發：**
```bash
git clone https://github.com/lukwama/sokoban-brawl.git
cd sokoban-brawl
npm install
npm run dev
```

首次啟動時，伺服器會自動種入 **三個示範自訂關卡**（ID 57、58、59），來源為 [lukwama.com/sokoban](https://lukwama.com/sokoban) 的 defaultXMLData，上傳者名稱為 **lukwama**，且每關各有一筆排行榜記錄，無需額外步驟。日後若要重新套用這三關預設（例如 DB 偏離後）：執行 `node scripts/restore_default_custom_levels.js`。

**API 範例：**
```bash
curl http://localhost:3000/api/leaderboard/0
curl -X POST http://localhost:3000/api/leaderboard/0 -H "Content-Type: application/json" \
  -d '{"playerName":"玩家","steps":21,"moves":"lruulldddurrrluurrddd"}'
```

#### 🖥 伺服器設定

全新 **Ubuntu 24.04** 可依 [docs/SERVER-SETUP.md](docs/SERVER-SETUP.md) 進行 SSH 資源保護、swap、fail2ban 與專案拉取。正式環境（例：https://sokoban.lukwama.com）請參考 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)。自訂關卡直連（如 `/singleplayer/57`）開箱即用，無需額外 Nginx 或伺服器設定。

#### 📚 自動部署

設定 GitHub webhook 以自動部署：
- **[快速入門（5 分鐘）](docs/AUTO-DEPLOY-QUICKSTART.md)** - 快速設置指南
- **[完整指南](docs/AUTO-DEPLOY.md)** - 詳細配置與故障排除
- **[遠端 Agent 指令](docs/REMOTE-AGENT-DEPLOY-PROMPT.md)** - 給 Cursor AI Agent 使用
- **[路徑偵測說明](docs/PATH-DETECTION-EXPLAINED.md)** - 自動偵測運作原理

#### 🧪 測試與驗證

伺服器包含全面的防作弊和自訂關卡驗證：
- **[測試腳本指南](tests/README.md)** - 如何執行測試
- **[驗證報告](docs/VALIDATION_COMPLETE.md)** - 測試結果（100% 成功）
- **[防作弊報告](docs/ANTI_CHEAT_TEST_REPORT.md)** - 詳細防作弊分析
- **[自訂關卡報告](docs/CUSTOM_LEVEL_TEST_REPORT.md)** - 自訂關卡系統細節

**快速測試**：`node tests/comprehensive_validation_test.js`

#### 📂 專案結構

```
client/     — 前端 HTML/CSS/JS
server/     — 後端（Express + Socket.io + SQLite）
scripts/    — 部署與工具腳本
docs/       — 文件
tests/      — 測試腳本與工具
archive/    — 歷史報告（可安全刪除）
```
