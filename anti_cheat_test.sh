#!/bin/bash

# en_US (English)
# Comprehensive anti-cheat testing with valid solution
#
# zh_TW（繁體中文）
# 使用有效解法進行全面的防作弊測試

API_URL="http://localhost:3000/api/leaderboard/0"
VALID_MOVES="lruulldddurrrluurrddd"
VALID_STEPS=21

echo "========================================="
echo "Sokoban Brawl Anti-Cheat Testing"
echo "倉庫大亂鬥防作弊測試"
echo "========================================="
echo ""
echo "Valid solution: $VALID_MOVES"
echo "Valid steps: $VALID_STEPS"
echo ""

# Test 1: Submit valid solution (control group)
# 測試 1：提交正常通關記錄（對照組）
echo "✓ Test 1: Valid solution"
echo "✓ 測試 1：正常通關記錄"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"playerName\":\"正常玩家\",\"steps\":$VALID_STEPS,\"moves\":\"$VALID_MOVES\"}")
echo "Request: playerName=正常玩家, steps=$VALID_STEPS, moves=$VALID_MOVES"
echo "Response: $RESPONSE"
echo ""

# Test 2: Fake steps (too few)
# 測試 2：虛假步數（太少）
echo "✗ Test 2: Fake steps (too few)"
echo "✗ 測試 2：虛假步數（太少）"
echo "-----------------------------------"
FAKE_STEPS=10
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"playerName\":\"作弊玩家A\",\"steps\":$FAKE_STEPS,\"moves\":\"$VALID_MOVES\"}")
echo "Request: playerName=作弊玩家A, steps=$FAKE_STEPS (actual: $VALID_STEPS), moves=$VALID_MOVES"
echo "Response: $RESPONSE"
echo ""

# Test 3: Fake steps (too many)
# 測試 3：虛假步數（太多）
echo "✗ Test 3: Fake steps (too many)"
echo "✗ 測試 3：虛假步數（太多）"
echo "-----------------------------------"
FAKE_STEPS=100
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"playerName\":\"作弊玩家B\",\"steps\":$FAKE_STEPS,\"moves\":\"$VALID_MOVES\"}")
echo "Request: playerName=作弊玩家B, steps=$FAKE_STEPS (actual: $VALID_STEPS), moves=$VALID_MOVES"
echo "Response: $RESPONSE"
echo ""

# Test 4: Invalid moves (incomplete)
# 測試 4：無效的 moves（未完成過關）
echo "✗ Test 4: Invalid moves (incomplete)"
echo "✗ 測試 4：無效的 moves（未完成過關）"
echo "-----------------------------------"
INCOMPLETE_MOVES="lruulldd"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"playerName\":\"作弊玩家C\",\"steps\":${#INCOMPLETE_MOVES},\"moves\":\"$INCOMPLETE_MOVES\"}")
echo "Request: playerName=作弊玩家C, steps=${#INCOMPLETE_MOVES}, moves=$INCOMPLETE_MOVES"
echo "Response: $RESPONSE"
echo ""

# Test 5: Invalid moves (hits wall)
# 測試 5：無效的 moves（撞牆）
echo "✗ Test 5: Invalid moves (hits wall)"
echo "✗ 測試 5：無效的 moves（撞牆）"
echo "-----------------------------------"
INVALID_MOVES="ddddddddddd"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"playerName\":\"作弊玩家D\",\"steps\":${#INVALID_MOVES},\"moves\":\"$INVALID_MOVES\"}")
echo "Request: playerName=作弊玩家D, steps=${#INVALID_MOVES}, moves=$INVALID_MOVES"
echo "Response: $RESPONSE"
echo ""

# Test 6: Random garbage moves
# 測試 6：隨機亂碼 moves
echo "✗ Test 6: Random garbage moves"
echo "✗ 測試 6：隨機亂碼 moves"
echo "-----------------------------------"
GARBAGE_MOVES="xyz123abc!@#"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"playerName\":\"作弊玩家E\",\"steps\":${#GARBAGE_MOVES},\"moves\":\"$GARBAGE_MOVES\"}")
echo "Request: playerName=作弊玩家E, steps=${#GARBAGE_MOVES}, moves=$GARBAGE_MOVES"
echo "Response: $RESPONSE"
echo ""

# Test 7: Empty moves
# 測試 7：空的 moves
echo "✗ Test 7: Empty moves"
echo "✗ 測試 7：空的 moves"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"playerName":"作弊玩家F","steps":0,"moves":""}')
echo "Request: playerName=作弊玩家F, steps=0, moves=''"
echo "Response: $RESPONSE"
echo ""

# Test 8: Negative steps
# 測試 8：負數步數
echo "✗ Test 8: Negative steps"
echo "✗ 測試 8：負數步數"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"playerName\":\"作弊玩家G\",\"steps\":-100,\"moves\":\"$VALID_MOVES\"}")
echo "Request: playerName=作弊玩家G, steps=-100, moves=$VALID_MOVES"
echo "Response: $RESPONSE"
echo ""

# Test 9: Missing moves field
# 測試 9：缺少 moves 欄位
echo "✗ Test 9: Missing moves field"
echo "✗ 測試 9：缺少 moves 欄位"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"playerName":"作弊玩家H","steps":100}')
echo "Request: playerName=作弊玩家H, steps=100, moves=<missing>"
echo "Response: $RESPONSE"
echo ""

# Test 10: Try to submit duplicate moves
# 測試 10：嘗試提交重複的 moves
echo "✗ Test 10: Duplicate moves"
echo "✗ 測試 10：重複的 moves"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"playerName\":\"重複玩家\",\"steps\":$VALID_STEPS,\"moves\":\"$VALID_MOVES\"}")
echo "Request: playerName=重複玩家, steps=$VALID_STEPS, moves=$VALID_MOVES (same as Test 1)"
echo "Response: $RESPONSE"
echo ""

# Test 11: Check leaderboard
# 測試 11：檢查排行榜
echo "📊 Test 11: Check leaderboard"
echo "📊 測試 11：檢查排行榜"
echo "-----------------------------------"
RESPONSE=$(curl -s -X GET "$API_URL")
echo "Response: $RESPONSE"
echo ""

echo "========================================="
echo "Testing completed"
echo "測試完成"
echo "========================================="
