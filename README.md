# sokoban-brawl 📦
Sokoban Brawl: A multiplayer competitive sokoban game. Play as a warehouse keeper to sort colored goods. Features an open-source authoritative server for private hosting and community testing.

**Sokoban Brawl** is a cross-platform multiplayer competitive game inspired by the classic "Sokoban" logic. Players take on the roles of professional warehouse keepers, engaging in a chaotic scramble for cargo within a shared map.

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
