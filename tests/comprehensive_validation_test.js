/**
 * en_US (English)
 * Comprehensive validation test combining anti-cheat and custom level tests
 * 
 * zh_TW（繁體中文）
 * 結合防作弊與自訂關卡的綜合驗證測試
 */

const BASE_URL = 'http://localhost:3000';

console.log('='.repeat(60));
console.log('🎮 Sokoban Brawl Comprehensive Validation Test');
console.log('🎮 倉庫大亂鬥綜合驗證測試');
console.log('='.repeat(60));
console.log('');

async function runTests() {
  let passedTests = 0;
  let totalTests = 0;

  console.log('Part 1: Anti-Cheat Tests (Leaderboard Submission)');
  console.log('第一部分：防作弊測試（排行榜提交）');
  console.log('-'.repeat(60));
  console.log('');

  // Valid solution for level 0
  const validSolution = 'lruulldddurrrluurrddd';
  const validSteps = 21;

  // Test 1.1: Fake step count (too few)
  totalTests++;
  console.log('Test 1.1: Fake step count (too few) / 虛假步數（太少）');
  try {
    const res = await fetch(`${BASE_URL}/api/leaderboard/0`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName: '作弊玩家A',
        steps: 10,
        moves: validSolution
      })
    });
    const data = await res.json();
    if (!res.ok && data.error === 'steps_mismatch') {
      console.log('  ✅ PASS: Server rejected fake step count');
      passedTests++;
    } else {
      console.log('  ❌ FAIL: Should reject fake steps');
    }
  } catch (err) {
    console.log('  ❌ FAIL:', err.message);
  }
  console.log('');

  // Test 1.2: Invalid moves (not completed)
  totalTests++;
  console.log('Test 1.2: Incomplete solution / 未完成的解法');
  try {
    const res = await fetch(`${BASE_URL}/api/leaderboard/0`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName: '作弊玩家B',
        steps: 5,
        moves: 'lruul'
      })
    });
    const data = await res.json();
    if (!res.ok && data.error === 'not_completed') {
      console.log('  ✅ PASS: Server rejected incomplete solution');
      passedTests++;
    } else {
      console.log('  ❌ FAIL: Should reject incomplete solution');
    }
  } catch (err) {
    console.log('  ❌ FAIL:', err.message);
  }
  console.log('');

  // Test 1.3: Random garbage
  totalTests++;
  console.log('Test 1.3: Random garbage input / 隨機亂碼');
  try {
    const res = await fetch(`${BASE_URL}/api/leaderboard/0`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName: '作弊玩家C',
        steps: 10,
        moves: 'xyz123!@#'
      })
    });
    const data = await res.json();
    if (!res.ok && data.error === 'invalid_move') {
      console.log('  ✅ PASS: Server rejected garbage input');
      passedTests++;
    } else {
      console.log('  ❌ FAIL: Should reject garbage input');
    }
  } catch (err) {
    console.log('  ❌ FAIL:', err.message);
  }
  console.log('');

  console.log('');
  console.log('Part 2: Custom Level Upload Tests');
  console.log('第二部分：自訂關卡上傳測試');
  console.log('-'.repeat(60));
  console.log('');

  const testLevel = `?#####?
#     #
# $ $ #
#@$.* #
# $ $ #
#  .  #
?#####?`;
  const testMoves = 'rdldr';

  // Test 2.1: Upload with default name
  totalTests++;
  console.log('Test 2.1: Upload with default player name / 使用預設名稱上傳');
  try {
    const res = await fetch(`${BASE_URL}/api/custom-levels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        levelData: testLevel,
        creatorName: 'Player',
        solutionMoves: testMoves
      })
    });
    const data = await res.json();
    if (!res.ok && data.error === 'invalid_player_name') {
      console.log('  ✅ PASS: Server rejected default player name');
      passedTests++;
    } else {
      console.log('  ❌ FAIL: Should reject default name');
    }
  } catch (err) {
    console.log('  ❌ FAIL:', err.message);
  }
  console.log('');

  // Test 2.2: Upload without completing
  totalTests++;
  console.log('Test 2.2: Upload without completing / 未通關就上傳');
  try {
    const res = await fetch(`${BASE_URL}/api/custom-levels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        levelData: testLevel,
        creatorName: '作弊玩家D',
        solutionMoves: 'rd'
      })
    });
    const data = await res.json();
    if (!res.ok && data.error === 'not_completed') {
      console.log('  ✅ PASS: Server rejected incomplete solution');
      passedTests++;
    } else {
      console.log('  ❌ FAIL: Should reject incomplete solution');
    }
  } catch (err) {
    console.log('  ❌ FAIL:', err.message);
  }
  console.log('');

  // Test 2.3: Valid upload
  totalTests++;
  console.log('Test 2.3: Valid custom level upload / 有效的自訂關卡上傳');
  try {
    const res = await fetch(`${BASE_URL}/api/custom-levels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        levelData: testLevel,
        creatorName: 'ValidPlayer',
        solutionMoves: testMoves
      })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      console.log(`  ✅ PASS: Level uploaded successfully as ID ${data.levelId}`);
      console.log(`  URL: ${data.levelUrl}`);
      passedTests++;
      
      // Store for duplicate test
      globalThis.uploadedLevelId = data.levelId;
    } else {
      console.log('  ❌ FAIL: Should accept valid level');
      console.log('  Response:', data);
    }
  } catch (err) {
    console.log('  ❌ FAIL:', err.message);
  }
  console.log('');

  // Test 2.4: Duplicate level
  totalTests++;
  console.log('Test 2.4: Duplicate level upload / 重複關卡上傳');
  try {
    const res = await fetch(`${BASE_URL}/api/custom-levels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        levelData: testLevel,
        creatorName: '作弊玩家E',
        solutionMoves: testMoves
      })
    });
    const data = await res.json();
    if (!res.ok && data.error === 'duplicate_level') {
      console.log('  ✅ PASS: Server rejected duplicate level');
      console.log(`  Existing level ID: ${data.existingLevelId}`);
      passedTests++;
    } else {
      console.log('  ❌ FAIL: Should reject duplicate');
    }
  } catch (err) {
    console.log('  ❌ FAIL:', err.message);
  }
  console.log('');

  console.log('');
  console.log('Part 3: Integration Tests');
  console.log('第三部分：整合測試');
  console.log('-'.repeat(60));
  console.log('');

  // Test 3.1: Custom level leaderboard
  if (globalThis.uploadedLevelId) {
    totalTests++;
    console.log('Test 3.1: Submit score to custom level / 提交分數到自訂關卡');
    try {
      const res = await fetch(`${BASE_URL}/api/leaderboard/${globalThis.uploadedLevelId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: '整合測試者',
          steps: 5,
          moves: testMoves
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        console.log(`  ✅ PASS: Score submitted successfully (Rank ${data.rank})`);
        passedTests++;
      } else {
        console.log('  ❌ FAIL: Should accept valid score');
        console.log('  Response:', data);
      }
    } catch (err) {
      console.log('  ❌ FAIL:', err.message);
    }
    console.log('');
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('📊 Final Results / 最終結果');
  console.log('='.repeat(60));
  console.log('');
  console.log(`Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`通過測試：${passedTests}/${totalTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log(`成功率：${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('');
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! System is production-ready!');
    console.log('🎉 所有測試通過！系統已準備好上線！');
  } else {
    console.log('⚠️  Some tests failed. Please review the results.');
    console.log('⚠️  部分測試失敗，請檢閱結果。');
  }
  console.log('');
  console.log('='.repeat(60));
}

runTests();
