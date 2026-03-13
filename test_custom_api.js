/**
 * en_US (English)
 * Test custom level upload API with proper JSON encoding
 * 
 * zh_TW（繁體中文）
 * 使用正確的 JSON 編碼測試自訂關卡上傳 API
 */

const API_URL = 'http://localhost:3000/api/custom-levels';

// Sample levels from lukwama.com/sokoban
const sampleLevel1 = `??#####
??#  @#
??# $ #
??#$###
###  #?
#..  #?
######?`;

const sampleMoves1 = 'lrlldddrdllruuuurrdluldddrdl';

const sampleLevel2 = `#########
#       #
#       #
#   .   #
#       #
#   $ * #
#       #
#   @   #
#########`;

const sampleMoves2 = 'uuu';

async function testCustomLevels() {
  console.log('=========================================');
  console.log('Custom Level Upload Testing');
  console.log('自訂關卡上傳測試');
  console.log('=========================================\n');

  // Test 1: Valid custom level upload
  console.log('✓ Test 1: Valid custom level upload');
  console.log('✓ 測試 1：有效的自訂關卡上傳');
  console.log('-----------------------------------');
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        levelData: sampleLevel1,
        creatorName: '測試玩家',
        solutionMoves: sampleMoves1
      })
    });
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('Error:', err.message);
  }
  console.log('');

  // Test 2: Duplicate level upload
  console.log('✗ Test 2: Duplicate level upload');
  console.log('✗ 測試 2：上傳重複的關卡');
  console.log('-----------------------------------');
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        levelData: sampleLevel1,
        creatorName: '作弊玩家A',
        solutionMoves: sampleMoves1
      })
    });
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('Error:', err.message);
  }
  console.log('');

  // Test 3: Upload with default player name
  console.log('✗ Test 3: Upload with default player name');
  console.log('✗ 測試 3：使用預設玩家名稱上傳');
  console.log('-----------------------------------');
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        levelData: sampleLevel2,
        creatorName: 'Player',
        solutionMoves: sampleMoves2
      })
    });
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('Error:', err.message);
  }
  console.log('');

  // Test 4: Upload without completing level
  console.log('✗ Test 4: Upload without completing level');
  console.log('✗ 測試 4：未通關就上傳');
  console.log('-----------------------------------');
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        levelData: sampleLevel2,
        creatorName: '作弊玩家B',
        solutionMoves: 'uu'
      })
    });
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('Error:', err.message);
  }
  console.log('');

  // Test 5: Upload with empty player name
  console.log('✗ Test 5: Upload with empty player name');
  console.log('✗ 測試 5：使用空的玩家名稱上傳');
  console.log('-----------------------------------');
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        levelData: sampleLevel2,
        creatorName: '',
        solutionMoves: sampleMoves2
      })
    });
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('Error:', err.message);
  }
  console.log('');

  // Test 6: Upload without level data
  console.log('✗ Test 6: Upload without level data');
  console.log('✗ 測試 6：不提供關卡內容');
  console.log('-----------------------------------');
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creatorName: '測試玩家',
        solutionMoves: sampleMoves2
      })
    });
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('Error:', err.message);
  }
  console.log('');

  // Test 7: Upload without solution
  console.log('✗ Test 7: Upload without solution');
  console.log('✗ 測試 7：不提供通關步驟');
  console.log('-----------------------------------');
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        levelData: sampleLevel2,
        creatorName: '測試玩家'
      })
    });
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('Error:', err.message);
  }
  console.log('');

  // Test 8: Upload with invalid solution
  console.log('✗ Test 8: Upload with invalid solution');
  console.log('✗ 測試 8：上傳無效的解法');
  console.log('-----------------------------------');
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        levelData: sampleLevel2,
        creatorName: '作弊玩家C',
        solutionMoves: 'ddddd'
      })
    });
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('Error:', err.message);
  }
  console.log('');

  // Test 9: Valid second custom level upload
  console.log('✓ Test 9: Valid second custom level upload');
  console.log('✓ 測試 9：有效的第二個自訂關卡上傳');
  console.log('-----------------------------------');
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        levelData: sampleLevel2,
        creatorName: '測試玩家2',
        solutionMoves: sampleMoves2
      })
    });
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('Error:', err.message);
  }
  console.log('');

  // Test 10: Get all custom levels
  console.log('📊 Test 10: Get all custom levels');
  console.log('📊 測試 10：取得所有自訂關卡');
  console.log('-----------------------------------');
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('Error:', err.message);
  }
  console.log('');

  // Test 11: Get custom level by ID
  console.log('📊 Test 11: Get custom level by ID');
  console.log('📊 測試 11：依 ID 取得自訂關卡');
  console.log('-----------------------------------');
  try {
    const res = await fetch('http://localhost:3000/api/levels/57');
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('Error:', err.message);
  }
  console.log('');

  // Test 12: Get built-in level by ID
  console.log('📊 Test 12: Get built-in level by ID');
  console.log('📊 測試 12：依 ID 取得內建關卡');
  console.log('-----------------------------------');
  try {
    const res = await fetch('http://localhost:3000/api/levels/0');
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('Error:', err.message);
  }
  console.log('');

  console.log('=========================================');
  console.log('Testing completed');
  console.log('測試完成');
  console.log('=========================================');
}

testCustomLevels();
