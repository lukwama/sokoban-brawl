#!/bin/bash

# en_US (English)
# Anti-cheat testing script for Sokoban Brawl server
# Tests various fraudulent submission scenarios
#
# zh_TW（繁體中文）
# 倉庫大亂鬥伺服器防作弊測試腳本
# 測試各種作弊提交情境

echo "========================================="
echo "Sokoban Brawl Anti-Cheat Testing"
echo "倉庫大亂鬥防作弊測試"
echo "========================================="
echo ""

API_URL="http://localhost:3000/api/leaderboard/0"

# Test 1: Fake steps (mismatched with actual moves)
# 測試 1：虛假步數（與實際 moves 不符）
echo "Test 1: Submitting fake step count"
echo "測試 1：提交虛假步數"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"playerName":"作弊玩家A","steps":5,"moves":"lllddd"}')
echo "Request: steps=5, moves=lllddd (actual steps should be 6)"
echo "Response: $RESPONSE"
echo ""

# Test 2: Invalid moves sequence (cannot complete level)
# 測試 2：無效的 moves 序列（無法完成關卡）
echo "Test 2: Submitting invalid moves (incomplete solution)"
echo "測試 2：提交無效的 moves（未完成過關）"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"playerName":"作弊玩家B","steps":3,"moves":"lll"}')
echo "Request: steps=3, moves=lll (does not complete level)"
echo "Response: $RESPONSE"
echo ""

# Test 3: Random garbage moves
# 測試 3：隨機亂碼 moves
echo "Test 3: Submitting random garbage moves"
echo "測試 3：提交隨機亂碼 moves"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"playerName":"作弊玩家C","steps":10,"moves":"xyzabc123"}')
echo "Request: steps=10, moves=xyzabc123 (garbage input)"
echo "Response: $RESPONSE"
echo ""

# Test 4: Invalid move direction (wall collision)
# 測試 4：無效的移動方向（撞牆）
echo "Test 4: Submitting moves that hit walls"
echo "測試 4：提交撞牆的 moves"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"playerName":"作弊玩家D","steps":5,"moves":"uuuuu"}')
echo "Request: steps=5, moves=uuuuu (tries to move into walls)"
echo "Response: $RESPONSE"
echo ""

# Test 5: Valid solution (control group)
# 測試 5：正常通關記錄（對照組）
echo "Test 5: Submitting valid solution (control group)"
echo "測試 5：提交正常通關記錄（對照組）"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"playerName":"正常玩家","steps":6,"moves":"lllddd"}')
echo "Request: steps=6, moves=lllddd (valid solution)"
echo "Response: $RESPONSE"
echo ""

# Test 6: Zero steps
# 測試 6：零步數
echo "Test 6: Submitting zero steps"
echo "測試 6：提交零步數"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"playerName":"作弊玩家E","steps":0,"moves":""}')
echo "Request: steps=0, moves='' (empty moves)"
echo "Response: $RESPONSE"
echo ""

# Test 7: Negative steps
# 測試 7：負數步數
echo "Test 7: Submitting negative steps"
echo "測試 7：提交負數步數"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"playerName":"作弊玩家F","steps":-10,"moves":"lllddd"}')
echo "Request: steps=-10, moves=lllddd (negative steps)"
echo "Response: $RESPONSE"
echo ""

# Test 8: Missing moves field
# 測試 8：缺少 moves 欄位
echo "Test 8: Missing moves field"
echo "測試 8：缺少 moves 欄位"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"playerName":"作弊玩家G","steps":10}')
echo "Request: steps=10, moves=<missing>"
echo "Response: $RESPONSE"
echo ""

echo "========================================="
echo "Testing completed"
echo "測試完成"
echo "========================================="
