# 單人倉庫番遊戲完整分析

> 來源：https://lukwama.com/sokoban/  
> 用途：作為 Sokoban Brawl 單人模式基礎，並將排行榜與回放改為伺服器端儲存

---

## 一、檔案結構

| 類型 | 說明 |
|------|------|
| **單一 HTML** | 所有程式碼內嵌於 `index.html`，無外部 JS/CSS |
| **內嵌 CSS** | 約 150 行，含 RWD、觸控樣式 |
| **內嵌 JavaScript** | 約 2000+ 行，全部遊戲邏輯 |
| **靜態資源** | `favicon.png`、`og_img.png` |

---

## 二、關卡格式（文字地圖）

| 字元 | 意義 |
|------|------|
| `#` | 牆壁 |
| `?` | 隱形牆（視覺透明，邏輯阻擋） |
| `$` | 箱子 |
| `.` | 目標區 |
| `@` | 玩家 |
| `*` | 箱子在目標上 |
| ` ` | 空地 |

範例：
```
?#####?
#     #
# # # #
# $@$ #
# ### #
#.   .#
?#####?
```

---

## 三、核心遊戲邏輯

### 3.1 狀態變數
- `currentLevelData`：二維陣列，關卡地圖
- `playerPos`：`{row, col}` 玩家座標
- `boxPositions`：`[{row,col}, ...]` 箱子座標陣列
- `targetPositions`：`[{row,col}, ...]` 目標區座標
- `stepCount`：已走步數
- `moveHistory`：`['u','d','l','r']` 操作序列
- `positionHistory`：用於 undo 的狀態堆疊

### 3.2 核心函式

| 函式 | 功能 |
|------|------|
| `loadLevel(levelString)` | 解析關卡字串，初始化狀態與 DOM |
| `movePlayer(direction, recordMove)` | 處理移動：邊界、牆、推箱、記錄 |
| `undoLastMove()` | 從 `positionHistory` 還原上一步 |
| `checkWinCondition()` | 檢查所有箱子是否都在目標上 |
| `updateGameBoard()` | 依狀態重繪遊戲畫面 |
| `getDirectionName(direction)` | `{row,col}` → `'u'/'d'/'l'/'r'` |

### 3.3 移動規則
- 玩家可往上下左右移動
- 若前方為箱子，則推動箱子（前方不可為牆、隱形牆、另一箱子）
- 箱子不可拉回，只能推

---

## 四、排行榜（目前：客戶端 localStorage）

### 4.1 資料結構
```javascript
leaderboards = {
  "0": [  // levelIndex
    { steps: 21, moves: ['l','r','u',...], timestamp: 1745978627091 },
    ...
  ],
  "1": [...],
  ...
}
```

### 4.2 規則
- 每關最多 10 筆記錄
- 依 `steps` 升序排列
- 相同路徑（moves 完全相同）不重複加入
- 過關時呼叫 `addToLeaderboard(levelIndex, stepCount, moveHistory)`

### 4.3 相關函式
- `loadLeaderboards()`：從 `localStorage.sokobanLeaderboards` 讀取
- `saveLeaderboards()`：寫回 localStorage
- `addToLeaderboard(levelIndex, steps, moves)`：新增並排序、截斷
- `updateLeaderboard()`：渲染排行榜表格

---

## 五、遊戲回放（目前：客戶端執行）

### 5.1 回放資料
- 使用 `moves` 陣列（`['u','d','l','r']`）
- 每 300ms 執行一步 `movePlayer(direction, false)`
- `recordMove=false` 表示不記錄、不計入步數、不觸發排行榜

### 5.2 相關函式
- `startPlayback(moves)`：開始回放
- `stopPlayback()`：停止回放
- 排行榜每筆記錄有「播放」按鈕，點擊即 `startPlayback(record.moves)`

---

## 六、匯出／匯入（XML 格式）

### 6.1 XML 結構
```xml
<?xml version="1.0" encoding="UTF-8"?>
<gameData>
  <leaderboards>
    <level id="0">
      <record>
        <steps>21</steps>
        <moves>lruulldddurrrluurrddd</moves>
        <timestamp>1745978627091</timestamp>
      </record>
    </level>
    ...
  </leaderboards>
  <customLevels>
    <level id="0"><![CDATA[??#####\n??#  @#\n...]]></level>
    ...
  </customLevels>
</gameData>
```

### 6.2 函式
- `generateLeaderboardXML()`：產生匯出 XML
- `parseLeaderboardXML(xmlString)`：解析匯入 XML，回傳 `{ leaderboards, customLevels }`

---

## 七、關卡編輯器

- 工具：牆、隱形牆、箱子、目標、玩家、空地、箱子在目標上
- 關卡尺寸：5–20 格
- 即時同步：textarea 與編輯器雙向綁定
- 驗證：箱子數 = 目標數，玩家數 = 1
- 自訂關卡存於 `localStorage.sokobanCustomLevels`

---

## 八、內建關卡

- `builtInLevels`：59 個預設關卡（字串陣列）
- `customLevels`：使用者自訂關卡
- `allLevels = [...builtInLevels, ...customLevels]`

---

## 九、觸控支援

- **按鈕模式**：上下左右 + 復原按鈕
- **手勢模式**：在觸控區滑動辨識方向
- 偏好存於 `localStorage.sokobanTouchMode`（`'button'` | `'gesture'`）

---

## 十、需改為伺服器端的功能

### 10.1 排行榜
| 現狀 | 目標 |
|------|------|
| `localStorage.sokobanLeaderboards` | 伺服器 API 儲存／查詢 |
| 每關 10 筆，無使用者識別 | 需支援使用者 ID、可選全球／個人排行 |
| 無需認證 | 可選登入後才寫入 |

**建議 API：**
- `GET /api/leaderboard/:levelId`：取得排行榜
- `POST /api/leaderboard/:levelId`：提交記錄（`{ steps, moves, userId? }`）

### 10.2 遊戲回放
| 現狀 | 目標 |
|------|------|
| 回放資料存於客戶端 | 回放資料存於伺服器 |
| 播放時從 `record.moves` 執行 | 從伺服器取得 `moves` 再執行 |

**建議：**
- 排行榜記錄含 `replayId` 或直接含 `moves`
- `GET /api/replay/:recordId`：取得回放資料
- 或 `GET /api/leaderboard/:levelId` 回傳即含 `moves`，由前端播放

### 10.3 自訂關卡（可選）
- 目前存於 `localStorage.sokobanCustomLevels`
- 可改為伺服器儲存，供多人共用或分享

---

## 十一、遷移時需保留的模組

1. **關卡解析與渲染**：`loadLevel`、`updateGameBoard`、地圖字元對應
2. **遊戲邏輯**：`movePlayer`、`checkWinCondition`、`undoLastMove`
3. **回放播放**：`startPlayback`、`stopPlayback`（改為接收伺服器回傳的 moves）
4. **關卡編輯器**：工具、驗證、儲存流程
5. **觸控**：按鈕與手勢模式
6. **UI 元件**：`showCustomAlert`、`showCustomConfirm`、排行榜表格結構

---

## 十二、遷移時需替換的模組

- `loadLeaderboards()` → 從 API 取得
- `saveLeaderboards()` → 改為呼叫 API
- `addToLeaderboard()` → 改為 `POST` 到伺服器
- 匯出／匯入：可保留為備份或匯出功能，但主要來源改為伺服器
