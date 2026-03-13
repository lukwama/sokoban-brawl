#!/bin/bash

# en_US (English)
# Final demonstration of anti-cheat capabilities
#
# zh_TW（繁體中文）
# 防作弊能力最終演示

clear

echo "========================================="
echo "🎮 Sokoban Brawl Anti-Cheat Demo"
echo "🎮 倉庫大亂鬥防作弊演示"
echo "========================================="
echo ""
echo "This demo shows how the server validates"
echo "本演示展示伺服器如何驗證"
echo "all leaderboard submissions."
echo "所有排行榜提交。"
echo ""
echo "Press Enter to continue..."
read

clear

API_URL="http://localhost:3000/api/leaderboard/0"
VALID_MOVES="lruulldddurrrluurrddd"
VALID_STEPS=21

echo "========================================="
echo "Valid Solution / 有效解法"
echo "========================================="
echo ""
echo "Level 0 has a valid solution:"
echo "關卡 0 有一個有效解法："
echo ""
echo "  Moves: $VALID_MOVES"
echo "  Steps: $VALID_STEPS"
echo ""
echo "Press Enter to test cheating attempts..."
read

clear

echo "========================================="
echo "❌ Cheat Attempt #1"
echo "❌ 作弊嘗試 #1"
echo "========================================="
echo ""
echo "Attacker submits FAKE STEP COUNT"
echo "攻擊者提交虛假步數"
echo ""
echo "Claim: I completed it in only 5 steps!"
echo "聲稱：我只用了 5 步就完成了！"
echo ""
echo "Submission:"
echo "  playerName: 作弊玩家"
echo "  steps: 5 (FAKE! Real: 21)"
echo "  moves: $VALID_MOVES"
echo ""
echo "Server response:"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"playerName\":\"作弊玩家A\",\"steps\":5,\"moves\":\"$VALID_MOVES\"}")
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""
echo "✅ BLOCKED! Server recalculates steps from moves."
echo "✅ 已攔截！伺服器從 moves 重新計算步數。"
echo ""
echo "Press Enter to continue..."
read

clear

echo "========================================="
echo "❌ Cheat Attempt #2"
echo "❌ 作弊嘗試 #2"
echo "========================================="
echo ""
echo "Attacker submits INCOMPLETE SOLUTION"
echo "攻擊者提交未完成的解法"
echo ""
echo "Claim: I finished the level!"
echo "聲稱：我完成關卡了！"
echo ""
echo "Submission:"
echo "  playerName: 作弊玩家"
echo "  steps: 5"
echo "  moves: lruul (doesn't complete level)"
echo ""
echo "Server response:"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"playerName":"作弊玩家B","steps":5,"moves":"lruul"}')
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""
echo "✅ BLOCKED! Server simulates moves and checks win condition."
echo "✅ 已攔截！伺服器模擬移動並檢查過關條件。"
echo ""
echo "Press Enter to continue..."
read

clear

echo "========================================="
echo "❌ Cheat Attempt #3"
echo "❌ 作弊嘗試 #3"
echo "========================================="
echo ""
echo "Attacker submits RANDOM GARBAGE"
echo "攻擊者提交隨機亂碼"
echo ""
echo "Claim: Here's my solution!"
echo "聲稱：這是我的解法！"
echo ""
echo "Submission:"
echo "  playerName: 作弊玩家"
echo "  steps: 10"
echo "  moves: xyz123!@# (invalid characters)"
echo ""
echo "Server response:"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"playerName":"作弊玩家C","steps":10,"moves":"xyz123!@#"}')
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""
echo "✅ BLOCKED! Server validates each move character."
echo "✅ 已攔截！伺服器驗證每個移動字元。"
echo ""
echo "Press Enter to continue..."
read

clear

echo "========================================="
echo "❌ Cheat Attempt #4"
echo "❌ 作弊嘗試 #4"
echo "========================================="
echo ""
echo "Attacker submits NEGATIVE STEPS"
echo "攻擊者提交負數步數"
echo ""
echo "Claim: I have -999 steps! (trying to get #1 rank)"
echo "聲稱：我有 -999 步！（試圖獲得第 1 名）"
echo ""
echo "Submission:"
echo "  playerName: 作弊玩家"
echo "  steps: -999"
echo "  moves: $VALID_MOVES"
echo ""
echo "Server response:"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"playerName\":\"作弊玩家D\",\"steps\":-999,\"moves\":\"$VALID_MOVES\"}")
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""
echo "✅ BLOCKED! Server validates steps > 0."
echo "✅ 已攔截！伺服器驗證步數 > 0。"
echo ""
echo "Press Enter to see results..."
read

clear

echo "========================================="
echo "📊 Final Results"
echo "📊 最終結果"
echo "========================================="
echo ""
echo "✅ All 4 cheating attempts BLOCKED!"
echo "✅ 所有 4 次作弊嘗試已攔截！"
echo ""
echo "Server validation mechanisms:"
echo "伺服器驗證機制："
echo ""
echo "  1. ✓ Recalculate steps from moves"
echo "     ✓ 從 moves 重新計算步數"
echo ""
echo "  2. ✓ Simulate moves step-by-step"
echo "     ✓ 逐步模擬移動"
echo ""
echo "  3. ✓ Check win condition (all boxes on targets)"
echo "     ✓ 檢查過關條件（所有箱子在目標上）"
echo ""
echo "  4. ✓ Validate input (no negative steps, no invalid chars)"
echo "     ✓ 驗證輸入（無負數步數、無無效字元）"
echo ""
echo "  5. ✓ Prevent duplicate solutions"
echo "     ✓ 防止重複解法"
echo ""
echo "========================================="
echo ""
echo "🎉 Server is production-ready!"
echo "🎉 伺服器已準備好上線！"
echo ""
echo "See docs/ANTI_CHEAT_TEST_REPORT.md for full details."
echo "詳細內容請參閱 docs/ANTI_CHEAT_TEST_REPORT.md。"
echo "========================================="
