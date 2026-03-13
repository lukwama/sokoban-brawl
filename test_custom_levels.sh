#!/bin/bash

# en_US (English)
# Test custom level upload and validation
#
# zh_TW（繁體中文）
# 測試自訂關卡上傳與驗證

API_URL="http://localhost:3000/api/custom-levels"

echo "========================================="
echo "Custom Level Upload Testing"
echo "自訂關卡上傳測試"
echo "========================================="
echo ""

# Sample level from lukwama.com/sokoban
SAMPLE_LEVEL_1='??#####
??#  @#
??# $ #
??#$###
###  #?
#..  #?
######?'

SAMPLE_MOVES_1='lrlldddrdllruuuurrdluldddrdl'
SAMPLE_STEPS_1=28

# Test 1: Valid custom level upload
# 測試 1：有效的自訂關卡上傳
echo "✓ Test 1: Valid custom level upload"
echo "✓ 測試 1：有效的自訂關卡上傳"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"levelData\":\"$SAMPLE_LEVEL_1\",\"creatorName\":\"測試玩家\",\"solutionMoves\":\"$SAMPLE_MOVES_1\"}")
echo "Request: creatorName=測試玩家, levelData=<sample>, solutionMoves=$SAMPLE_MOVES_1"
echo "Response: $RESPONSE"
echo ""

# Test 2: Try to upload duplicate level
# 測試 2：嘗試上傳重複的關卡
echo "✗ Test 2: Duplicate level upload"
echo "✗ 測試 2：上傳重複的關卡"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"levelData\":\"$SAMPLE_LEVEL_1\",\"creatorName\":\"作弊玩家A\",\"solutionMoves\":\"$SAMPLE_MOVES_1\"}")
echo "Request: Same level as Test 1"
echo "Response: $RESPONSE"
echo ""

# Test 3: Upload with default player name (should fail)
# 測試 3：使用預設玩家名稱上傳（應該失敗）
SAMPLE_LEVEL_2='#########
#       #
#       #
#   .   #
#       #
#   $ * #
#       #
#   @   #
#########'
SAMPLE_MOVES_2='uuu'

echo "✗ Test 3: Upload with default player name"
echo "✗ 測試 3：使用預設玩家名稱上傳"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"levelData\":\"$SAMPLE_LEVEL_2\",\"creatorName\":\"Player\",\"solutionMoves\":\"$SAMPLE_MOVES_2\"}")
echo "Request: creatorName=Player (default name)"
echo "Response: $RESPONSE"
echo ""

# Test 4: Upload without completing the level (invalid solution)
# 測試 4：未通關就上傳（無效的解法）
echo "✗ Test 4: Upload without completing level"
echo "✗ 測試 4：未通關就上傳"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"levelData\":\"$SAMPLE_LEVEL_2\",\"creatorName\":\"作弊玩家B\",\"solutionMoves\":\"uu\"}")
echo "Request: creatorName=作弊玩家B, solutionMoves=uu (incomplete)"
echo "Response: $RESPONSE"
echo ""

# Test 5: Upload with empty player name
# 測試 5：使用空的玩家名稱上傳
echo "✗ Test 5: Upload with empty player name"
echo "✗ 測試 5：使用空的玩家名稱上傳"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"levelData\":\"$SAMPLE_LEVEL_2\",\"creatorName\":\"\",\"solutionMoves\":\"$SAMPLE_MOVES_2\"}")
echo "Request: creatorName='' (empty)"
echo "Response: $RESPONSE"
echo ""

# Test 6: Upload without level data
# 測試 6：不提供關卡內容
echo "✗ Test 6: Upload without level data"
echo "✗ 測試 6：不提供關卡內容"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"creatorName":"測試玩家","solutionMoves":"uuu"}')
echo "Request: levelData=<missing>"
echo "Response: $RESPONSE"
echo ""

# Test 7: Upload without solution
# 測試 7：不提供通關步驟
echo "✗ Test 7: Upload without solution"
echo "✗ 測試 7：不提供通關步驟"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"levelData\":\"$SAMPLE_LEVEL_2\",\"creatorName\":\"測試玩家\"}")
echo "Request: solutionMoves=<missing>"
echo "Response: $RESPONSE"
echo ""

# Test 8: Upload with invalid solution (wrong moves)
# 測試 8：上傳無效的解法（錯誤的移動）
echo "✗ Test 8: Upload with invalid solution"
echo "✗ 測試 8：上傳無效的解法"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"levelData\":\"$SAMPLE_LEVEL_2\",\"creatorName\":\"作弊玩家C\",\"solutionMoves\":\"ddddd\"}")
echo "Request: creatorName=作弊玩家C, solutionMoves=ddddd (invalid)"
echo "Response: $RESPONSE"
echo ""

# Test 9: Valid second custom level upload
# 測試 9：有效的第二個自訂關卡上傳
echo "✓ Test 9: Valid second custom level upload"
echo "✓ 測試 9：有效的第二個自訂關卡上傳"
echo "-----------------------------------"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"levelData\":\"$SAMPLE_LEVEL_2\",\"creatorName\":\"測試玩家2\",\"solutionMoves\":\"$SAMPLE_MOVES_2\"}")
echo "Request: creatorName=測試玩家2, levelData=<different level>, solutionMoves=$SAMPLE_MOVES_2"
echo "Response: $RESPONSE"
echo ""

# Test 10: Get all custom levels
# 測試 10：取得所有自訂關卡
echo "📊 Test 10: Get all custom levels"
echo "📊 測試 10：取得所有自訂關卡"
echo "-----------------------------------"
RESPONSE=$(curl -s -X GET "$API_URL")
echo "Response: $RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 11: Get custom level by ID
# 測試 11：依 ID 取得自訂關卡
echo "📊 Test 11: Get custom level by ID"
echo "📊 測試 11：依 ID 取得自訂關卡"
echo "-----------------------------------"
RESPONSE=$(curl -s -X GET "http://localhost:3000/api/levels/57")
echo "Response: $RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

echo "========================================="
echo "Testing completed"
echo "測試完成"
echo "========================================="
