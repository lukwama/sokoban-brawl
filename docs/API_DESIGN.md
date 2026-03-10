# Sokoban Brawl 伺服器 API 設計

> 依據 AGENTS.md 技術架構與 SINGLE_PLAYER_ANALYSIS.md 遷移需求規劃

---

## 一、架構概覽

```
┌─────────────┐     HTTP/WebSocket      ┌─────────────────┐
│   Client    │ ◄──────────────────────► │  Node.js 伺服器  │
│ (HTML5/Godot)│   JSON + HMAC 簽章     │  (Express +     │
└─────────────┘                         │   Socket.io)    │
                                         └────────┬────────┘
                                                  │
                                         ┌────────▼────────┐
                                         │ Python 核心邏輯  │
                                         │ (推箱驗證、關卡) │
                                         └────────┬────────┘
                                                  │
                                         ┌────────▼────────┐
                                         │ SQLite (WAL)    │
                                         │ 排行榜、回放     │
                                         └─────────────────┘
```

---

## 二、傳輸協定規範（AGENTS.md）

所有請求／回應使用 **JSON**，並包含：

| 欄位 | 類型 | 說明 |
|------|------|------|
| `timestamp` | number | Unix 毫秒時間戳 |
| `action_id` | string | 唯一操作 ID（防重放） |
| `checksum` | string | HMAC 簽章，驗證封包完整性 |

---

## 三、REST API

### 3.1 健康檢查

```
GET /health
```

**回應：**
```json
{
  "status": "ok",
  "service": "sokoban-brawl"
}
```

---

### 3.2 排行榜

#### 取得排行榜

```
GET /api/leaderboard/:levelId
```

**參數：**
- `levelId`：關卡 ID（對應 builtInLevels 索引或自訂關卡 ID）
- `limit`（query，可選）：筆數，預設 10
- `scope`（query，可選）：`global` | `personal`，預設 `global`

**回應：**
```json
{
  "levelId": "0",
  "records": [
    {
      "rank": 1,
      "steps": 21,
      "moves": "lruulldddurrrluurrddd",
      "timestamp": 1745978627091,
      "userId": "anonymous_abc123",
      "recordId": "rec_xxx"
    }
  ]
}
```

> `moves` 為字串（u/d/l/r），供前端回放使用。

---

#### 提交記錄

```
POST /api/leaderboard/:levelId
```

**請求：**
```json
{
  "timestamp": 1745978627091,
  "action_id": "act_xxx",
  "checksum": "hmac_signature",
  "steps": 21,
  "moves": "lruulldddurrrluurrddd",
  "userId": "anonymous_abc123"
}
```

**驗證：**
- 伺服器需驗證 `moves` 可通關該關卡（呼叫 Python 核心邏輯）
- `steps` 需與 `moves.length` 一致
- 相同路徑（moves 完全相同）不重複儲存

**回應：**
```json
{
  "success": true,
  "recordId": "rec_xxx",
  "rank": 3
}
```

**錯誤：**
```json
{
  "success": false,
  "error": "invalid_moves",
  "message": "操作序列無法通關"
}
```

---

### 3.3 回放

#### 取得回放資料

```
GET /api/replay/:recordId
```

**回應：**
```json
{
  "recordId": "rec_xxx",
  "levelId": "0",
  "steps": 21,
  "moves": "lruulldddurrrluurrddd",
  "timestamp": 1745978627091
}
```

> 若排行榜 API 已回傳 `moves`，此端點可選用；或作為獨立回放連結。

---

### 3.4 關卡（可選）

#### 取得內建關卡列表

```
GET /api/levels
```

**回應：**
```json
{
  "builtIn": 59,
  "custom": []
}
```

#### 取得單一關卡

```
GET /api/levels/:levelId
```

**回應：**
```json
{
  "levelId": "0",
  "data": "?#####?\n#     #\n# # # #\n# $@$ #\n# ### #\n#.   .#\n?#####?"
}
```

#### 提交自訂關卡（可選）

```
POST /api/levels
```

**請求：**
```json
{
  "timestamp": 1745978627091,
  "action_id": "act_xxx",
  "checksum": "hmac_signature",
  "data": "#########\n#       #\n..."
}
```

---

## 四、WebSocket（Socket.io）— 多人模式用

> 單人模式可先以 REST 為主；多人模式再啟用。

| 事件 | 方向 | 說明 |
|------|------|------|
| `move_intent` | Client → Server | 發送操作意圖 `{ direction: 'u'\|'d'\|'l'\|'r' }` |
| `game_state` | Server → Client | 廣播遊戲狀態（權威伺服器判定後） |
| `player_joined` | Server → Client | 玩家加入 |
| `player_left` | Server → Client | 玩家離開 |

---

## 五、資料庫 Schema（SQLite）

### leaderboard_records

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | TEXT PK | recordId |
| level_id | TEXT | 關卡 ID |
| steps | INTEGER | 步數 |
| moves | TEXT | 操作序列（u/d/l/r 字串） |
| user_id | TEXT | 使用者 ID |
| created_at | INTEGER | Unix 毫秒 |

**索引：** `(level_id, steps)`

---

## 六、實作優先順序

1. **Phase 1**：REST 排行榜
   - `GET /api/leaderboard/:levelId`
   - `POST /api/leaderboard/:levelId`
   - SQLite 儲存

2. **Phase 2**：回放
   - `GET /api/replay/:recordId` 或由排行榜直接回傳 moves

3. **Phase 3**：關卡 API（若需伺服器提供關卡）

4. **Phase 4**：WebSocket 多人、HMAC 簽章

---

## 七、本地驗證流程

```bash
# 1. Node.js 依賴
npm install

# 2. 啟動伺服器
npm run dev

# 3. 測試
curl http://localhost:3000/health
```

## 八、Linux 單行部署

```bash
# 從 GitHub 一鍵啟動（需 git）
curl -sSL https://raw.githubusercontent.com/lukwama/sokoban-brawl/main/scripts/run.sh | bash

# 或已在專案目錄內
./scripts/run.sh
```
