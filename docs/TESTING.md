# Testing Documentation / 測試文件

## en_US (English)

### Available Test Scripts

#### 1. Anti-Cheat Test Suite (`anti_cheat_test.sh`)
Comprehensive testing of server-side validation and anti-cheat mechanisms.

```bash
./anti_cheat_test.sh
```

Tests include:
- Valid solution submission
- Fake step counts (too few/many)
- Invalid move sequences
- Wall collision detection
- Random garbage input
- Empty/missing fields
- Negative steps
- Duplicate submission prevention

#### 2. BFS Solver (`bfs_solver.js`)
Breadth-first search algorithm to find optimal solutions for Sokoban levels.

```bash
node bfs_solver.js
```

Used for:
- Finding valid solutions for testing
- Verifying level solvability
- Generating test data

#### 3. Level Debugger (`debug_level.js`)
Analyzes level structure and initial game state.

```bash
node debug_level.js
```

Outputs:
- Level grid visualization
- Player position
- Box positions
- Target positions
- Valid initial moves

#### 4. Validator Tester (`test_validator.js`)
Tests the server-side move validator with various sequences.

```bash
node test_validator.js
```

### Running Tests

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Run anti-cheat tests:**
   ```bash
   ./anti_cheat_test.sh
   ```

3. **Find solutions:**
   ```bash
   node bfs_solver.js
   ```

### Test Results

See [ANTI_CHEAT_TEST_REPORT.md](./ANTI_CHEAT_TEST_REPORT.md) for detailed test results and analysis.

**Summary: 100% of fraudulent submissions blocked (10/10 tests passed)**

---

## zh_TW（繁體中文）

### 可用的測試腳本

#### 1. 防作弊測試套件（`anti_cheat_test.sh`）
全面測試伺服器端驗證與防作弊機制。

```bash
./anti_cheat_test.sh
```

測試包括：
- 有效解法提交
- 虛假步數（太少/太多）
- 無效移動序列
- 撞牆檢測
- 隨機亂碼輸入
- 空白/缺少欄位
- 負數步數
- 防止重複提交

#### 2. BFS 求解器（`bfs_solver.js`）
廣度優先搜尋演算法，用於尋找倉庫番關卡的最佳解法。

```bash
node bfs_solver.js
```

用途：
- 尋找測試用的有效解法
- 驗證關卡可解性
- 產生測試資料

#### 3. 關卡除錯器（`debug_level.js`）
分析關卡結構與初始遊戲狀態。

```bash
node debug_level.js
```

輸出：
- 關卡網格視覺化
- 玩家位置
- 箱子位置
- 目標位置
- 有效的初始移動

#### 4. 驗證器測試器（`test_validator.js`）
使用各種序列測試伺服器端移動驗證器。

```bash
node test_validator.js
```

### 執行測試

1. **啟動伺服器：**
   ```bash
   npm run dev
   ```

2. **執行防作弊測試：**
   ```bash
   ./anti_cheat_test.sh
   ```

3. **尋找解法：**
   ```bash
   node bfs_solver.js
   ```

### 測試結果

詳細的測試結果與分析請參閱 [ANTI_CHEAT_TEST_REPORT.md](./ANTI_CHEAT_TEST_REPORT.md)。

**摘要：成功攔截 100% 的虛假提交（10/10 項測試通過）**
