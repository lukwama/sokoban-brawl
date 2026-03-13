# Test Scripts Guide / 測試腳本指南

## en_US (English)

This document describes all available test scripts for validating the Sokoban Brawl server's anti-cheat and custom level systems.

---

## Quick Start

Run the comprehensive test suite:
```bash
node comprehensive_validation_test.js
```

This runs all tests and provides a complete validation report.

---

## Available Test Scripts

### 1. `comprehensive_validation_test.js` ⭐ **Recommended**
**Purpose**: Complete validation test covering both systems  
**Tests**: 8 tests (anti-cheat + custom levels + integration)  
**Run**: `node comprehensive_validation_test.js`  
**Output**: Pass/fail for each test + summary statistics

**What it tests**:
- Anti-cheat: fake steps, incomplete solutions, garbage input
- Custom levels: validation rules, duplicate detection
- Integration: leaderboard for custom levels

---

### 2. `anti_cheat_test.sh`
**Purpose**: Specific tests for leaderboard anti-cheat  
**Tests**: 11 tests  
**Run**: `./anti_cheat_test.sh`  
**Output**: Detailed server responses for each cheating attempt

**What it tests**:
- Fake step counts (too few/many)
- Invalid moves (wall collision, incomplete)
- Random garbage input
- Negative/zero steps
- Missing required fields
- Duplicate submissions

---

### 3. `test_custom_api.js`
**Purpose**: Test custom level upload API  
**Tests**: 12 tests  
**Run**: `node test_custom_api.js`  
**Output**: API responses with JSON formatting

**What it tests**:
- Valid custom level upload
- Duplicate level detection
- Player name validation
- Solution validation
- Missing field handling
- API endpoint functionality

---

### 4. `test_sample_levels.js`
**Purpose**: Upload real sample levels from lukwama.com/sokoban  
**Tests**: 5 tests + leaderboard integration  
**Run**: `node test_sample_levels.js`  
**Output**: Upload results for 3 sample levels

**Sample levels tested**:
- Level 1: 28-step solution
- Level 2: 3-step solution
- Level 3: 114-step complex solution

---

### 5. `bfs_solver.js`
**Purpose**: Find valid solutions for Sokoban levels  
**Run**: `node bfs_solver.js`  
**Output**: Optimal solution path

**Use case**: Generate valid solutions for testing

---

### 6. `final_demo.sh` (Interactive)
**Purpose**: Interactive demonstration of validation systems  
**Run**: `./final_demo.sh`  
**Output**: Step-by-step walkthrough with user prompts

**Shows**:
- Anti-cheat in action
- Custom level validation
- System status and statistics

---

### 7. `test_demo_final.sh` (Interactive)
**Purpose**: Interactive anti-cheat demo  
**Run**: `./test_demo_final.sh`  
**Output**: 4 common cheating attempts demonstrated

---

## Test Results Summary

All scripts are working and validated:

| Script | Tests | Status | Purpose |
|--------|-------|--------|---------|
| comprehensive_validation_test.js | 8 | ✅ 100% | Main test suite |
| anti_cheat_test.sh | 11 | ✅ 100% | Anti-cheat focus |
| test_custom_api.js | 12 | ✅ 100% | API testing |
| test_sample_levels.js | 5 | ✅ 100% | Real-world samples |
| bfs_solver.js | N/A | ✅ Working | Solution finder |
| final_demo.sh | Interactive | ✅ Working | Full demo |
| test_demo_final.sh | Interactive | ✅ Working | Anti-cheat demo |

---

## Prerequisites

Make sure the server is running:
```bash
npm run dev
```

The server should be running at `http://localhost:3000`

---

## Interpreting Results

### Success Indicators
- ✅ PASS: Test passed as expected
- ✓ or 100%: All validation working
- `success: true`: API operation succeeded

### Failure Indicators (Expected for fraud tests)
- ❌ or ✗: Fraudulent submission blocked (this is good!)
- Error messages: `steps_mismatch`, `not_completed`, `invalid_move`, etc.
- `success: false`: Validation correctly rejected invalid input

### Actual Failures (System issues)
- Network errors: Check if server is running
- Syntax errors: Check code for bugs
- Unexpected success for fraud tests: Validation not working

---

## Documentation

For detailed reports and analysis:
- `docs/ANTI_CHEAT_TEST_REPORT.md` - Anti-cheat detailed report
- `docs/CUSTOM_LEVEL_TEST_REPORT.md` - Custom level detailed report
- `docs/VALIDATION_COMPLETE.md` - Completion summary
- `VALIDATION_SUMMARY_FINAL.md` - Overall summary
- `IMPLEMENTATION_SUMMARY.md` - Implementation details

---

## zh_TW（繁體中文）

本文件說明所有可用的測試腳本，用於驗證倉庫大亂鬥伺服器的防作弊和自訂關卡系統。

---

## 快速開始

執行綜合測試套件：
```bash
node comprehensive_validation_test.js
```

這會執行所有測試並提供完整的驗證報告。

---

## 可用的測試腳本

### 1. `comprehensive_validation_test.js` ⭐ **建議使用**
**用途**：涵蓋兩個系統的完整驗證測試  
**測試數**：8 項測試（防作弊 + 自訂關卡 + 整合）  
**執行**：`node comprehensive_validation_test.js`  
**輸出**：每個測試的通過/失敗 + 摘要統計

**測試內容**：
- 防作弊：虛假步數、未完成解法、亂碼輸入
- 自訂關卡：驗證規則、重複檢測
- 整合：自訂關卡的排行榜

---

### 2. `anti_cheat_test.sh`
**用途**：排行榜防作弊專用測試  
**測試數**：11 項測試  
**執行**：`./anti_cheat_test.sh`  
**輸出**：每次作弊嘗試的詳細伺服器回應

**測試內容**：
- 虛假步數（太少/太多）
- 無效移動（撞牆、未完成）
- 隨機亂碼輸入
- 負數/零步數
- 缺少必填欄位
- 重複提交

---

### 3. `test_custom_api.js`
**用途**：測試自訂關卡上傳 API  
**測試數**：12 項測試  
**執行**：`node test_custom_api.js`  
**輸出**：格式化的 JSON API 回應

**測試內容**：
- 有效的自訂關卡上傳
- 重複關卡檢測
- 玩家名稱驗證
- 解法驗證
- 缺少欄位處理
- API 端點功能

---

### 4. `test_sample_levels.js`
**用途**：上傳來自 lukwama.com/sokoban 的實際示範關卡  
**測試數**：5 項測試 + 排行榜整合  
**執行**：`node test_sample_levels.js`  
**輸出**：3 個示範關卡的上傳結果

**測試的示範關卡**：
- 關卡 1：28 步解法
- 關卡 2：3 步解法
- 關卡 3：114 步複雜解法

---

### 5. `bfs_solver.js`
**用途**：尋找倉庫番關卡的有效解法  
**執行**：`node bfs_solver.js`  
**輸出**：最佳解法路徑

**使用情境**：產生測試用的有效解法

---

### 6. `final_demo.sh`（互動式）
**用途**：驗證系統的互動式演示  
**執行**：`./final_demo.sh`  
**輸出**：逐步引導的演示

**展示內容**：
- 防作弊運作
- 自訂關卡驗證
- 系統狀態和統計

---

### 7. `test_demo_final.sh`（互動式）
**用途**：防作弊互動式演示  
**執行**：`./test_demo_final.sh`  
**輸出**：展示 4 種常見作弊嘗試

---

## 測試結果摘要

所有腳本都已驗證並正常運作：

| 腳本 | 測試數 | 狀態 | 用途 |
|------|--------|------|------|
| comprehensive_validation_test.js | 8 | ✅ 100% | 主要測試套件 |
| anti_cheat_test.sh | 11 | ✅ 100% | 防作弊專用 |
| test_custom_api.js | 12 | ✅ 100% | API 測試 |
| test_sample_levels.js | 5 | ✅ 100% | 實際示範 |
| bfs_solver.js | N/A | ✅ 運作中 | 解法尋找器 |
| final_demo.sh | 互動式 | ✅ 運作中 | 完整演示 |
| test_demo_final.sh | 互動式 | ✅ 運作中 | 防作弊演示 |

---

## 前置要求

確保伺服器正在運行：
```bash
npm run dev
```

伺服器應該在 `http://localhost:3000` 運行

---

## 解讀結果

### 成功指標
- ✅ PASS：測試如預期通過
- ✓ 或 100%：所有驗證正常運作
- `success: true`：API 操作成功

### 失敗指標（作弊測試的預期結果）
- ❌ 或 ✗：虛假提交被攔截（這是好的！）
- 錯誤訊息：`steps_mismatch`、`not_completed`、`invalid_move` 等
- `success: false`：驗證正確拒絕無效輸入

### 實際失敗（系統問題）
- 網路錯誤：檢查伺服器是否運行
- 語法錯誤：檢查程式碼是否有 bug
- 作弊測試意外成功：驗證未運作

---

## 文件

詳細報告和分析：
- `docs/ANTI_CHEAT_TEST_REPORT.md` - 防作弊詳細報告
- `docs/CUSTOM_LEVEL_TEST_REPORT.md` - 自訂關卡詳細報告
- `docs/VALIDATION_COMPLETE.md` - 完成摘要
- `VALIDATION_SUMMARY_FINAL.md` - 整體摘要
- `IMPLEMENTATION_SUMMARY.md` - 實作細節
