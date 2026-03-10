# sokoban-brawl 📦
Sokoban Brawl: A multiplayer competitive sokoban game. Play as a warehouse keeper to sort colored goods. Features an open-source authoritative server for private hosting and community testing.

**Sokoban Brawl** is a cross-platform multiplayer competitive game inspired by the classic "Sokoban" logic. Players take on the roles of professional warehouse keepers, engaging in a chaotic scramble for cargo within a shared map.

### ✨ Game Modes & Core Features

* **Single-Player Mode**: Practice routes, refine pushing strategy, and clear stages at your own pace.
* **Multiplayer Mode**: Compete against other players in real-time and fight for the highest score before time runs out.
* **Level Editor**: Build and customize your own stages to create new tactical layouts and challenge scenarios.
* **Global Leaderboard**: Track top performances and compare results across players.
* **Leaderboard Replay Support**: Review gameplay replays tied to leaderboard entries to analyze runs and learn advanced tactics.

### 🎮 Objective

The goal is to push as many of your designated colored boxes into your specific target zones as possible within the time limit. Rankings are determined by the final count of successfully placed items.

### ⚔️ Mechanics & Strategy

* **Fair Play**: Maps are designed with a focus on symmetry and balance, ensuring equal opportunities for all players from start to finish.
* **Sabotage & Interference**:
* **Displacement**: You can push opponents' boxes out of their scoring zones to negate their points.
* **Creating Deadlocks**: Strategically push an opponent's box against a wall or into a corner. Since boxes can only be pushed and not pulled, this renders the item nearly impossible to recover, effectively neutralizing their progress.


* **Custom Skins**: Supports user-uploaded textures for boxes, allowing players to brand their own "logistics company."

### 🛠 Technical Architecture

* **Authoritative Server**: A central server built with Node.js to strictly validate move legality and resolve the chronological order of simultaneous actions.
* **Open Source & Self-Hosting**: The server code is fully open-source, allowing individuals or communities to host private servers for low-latency testing and full environment control.

### 🚀 Quick Start (Server)

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

**API 範例：**
```bash
curl http://localhost:3000/api/leaderboard/0
curl -X POST http://localhost:3000/api/leaderboard/0 -H "Content-Type: application/json" \
  -d '{"playerName":"玩家","steps":21,"moves":"lruulldddurrrluurrddd"}'
```
