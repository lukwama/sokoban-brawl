/**
 * en_US (English)
 * Test custom level upload with sample levels from lukwama.com/sokoban
 * 
 * zh_TW（繁體中文）
 * 使用 lukwama.com/sokoban 的示範關卡測試上傳
 */

const API_URL = 'http://localhost:3000/api/custom-levels';

// Sample levels from lukwama.com/sokoban defaultXMLData
// level id="56" 已經是內建關卡 56，所以這裡不測試
// level id="57"
const sampleLevel57 = `??#####
??#  @#
??# $ #
??#$###
###  #?
#..  #?
######?`;
const sampleMoves57 = 'lrlldddrdllruuuurrdluldddrdl';
const sampleSteps57 = 28;

// level id="58" (from the XML, corresponds to custom level 1)
const sampleLevel58 = `#########
#       #
#       #
#   .   #
#       #
#   $ * #
#       #
#   @   #
#########`;
const sampleMoves58 = 'uuu';
const sampleSteps58 = 3;

// level id="59" (from the XML, corresponds to custom level 2)
const sampleLevel59 = `#######
#     #
# $@. #
#     #
#     #
#     #
#######`;
const sampleMoves59 = 'udduudduudduudduudduuddrruullddlluurrdddrruuulldddlluuurrddddrruuuullddddlluuuurrrrddlluulldddrruuurrddddlllluuurr';
const sampleSteps59 = 114;

async function testSampleLevels() {
  console.log('=========================================');
  console.log('Sample Level Upload Testing');
  console.log('示範關卡上傳測試');
  console.log('=========================================\n');

  // Test 1: Upload sample level 57
  console.log('✓ Test 1: Upload sample level (ID 57 from XML)');
  console.log('✓ 測試 1：上傳示範關卡（XML 中的 ID 57）');
  console.log('-----------------------------------');
  console.log(`Steps: ${sampleSteps57}, Moves: ${sampleMoves57}`);
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        levelData: sampleLevel57,
        creatorName: 'XMLTestUser1',
        solutionMoves: sampleMoves57
      })
    });
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('');
  } catch (err) {
    console.log('Error:', err.message);
    console.log('');
  }

  // Test 2: Upload sample level 58
  console.log('✓ Test 2: Upload sample level (ID 58 from XML)');
  console.log('✓ 測試 2：上傳示範關卡（XML 中的 ID 58）');
  console.log('-----------------------------------');
  console.log(`Steps: ${sampleSteps58}, Moves: ${sampleMoves58}`);
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        levelData: sampleLevel58,
        creatorName: 'XMLTestUser2',
        solutionMoves: sampleMoves58
      })
    });
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('');
  } catch (err) {
    console.log('Error:', err.message);
    console.log('');
  }

  // Test 3: Upload sample level 59
  console.log('✓ Test 3: Upload sample level (ID 59 from XML, complex 114-step solution)');
  console.log('✓ 測試 3：上傳示範關卡（XML 中的 ID 59，複雜的 114 步解法）');
  console.log('-----------------------------------');
  console.log(`Steps: ${sampleSteps59}, Moves length: ${sampleMoves59.length}`);
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        levelData: sampleLevel59,
        creatorName: 'XMLTestUser3',
        solutionMoves: sampleMoves59
      })
    });
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('');
  } catch (err) {
    console.log('Error:', err.message);
    console.log('');
  }

  // Test 4: Get all custom levels
  console.log('📊 Test 4: Get all custom levels');
  console.log('📊 測試 4：取得所有自訂關卡');
  console.log('-----------------------------------');
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    console.log(`Total custom levels: ${data.customLevels?.length || 0}`);
    data.customLevels?.forEach((level, idx) => {
      const date = new Date(level.createdAt).toLocaleString('zh-TW');
      console.log(`  ${idx + 1}. Level ${level.levelId} by ${level.creatorName} (${level.solutionSteps} steps) - ${date}`);
    });
    console.log('');
  } catch (err) {
    console.log('Error:', err.message);
    console.log('');
  }

  // Test 5: Verify leaderboard works for custom levels
  console.log('📊 Test 5: Test leaderboard for custom level');
  console.log('📊 測試 5：測試自訂關卡的排行榜');
  console.log('-----------------------------------');
  try {
    // Submit a score for the first custom level (ID 57 if it was uploaded)
    const res = await fetch('http://localhost:3000/api/leaderboard/57', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName: '排行榜測試者',
        steps: sampleSteps57,
        moves: sampleMoves57
      })
    });
    const data = await res.json();
    console.log('Submit score response:', JSON.stringify(data, null, 2));
    
    // Get leaderboard
    const lbRes = await fetch('http://localhost:3000/api/leaderboard/57');
    const lbData = await lbRes.json();
    console.log('Leaderboard:', JSON.stringify(lbData, null, 2));
    console.log('');
  } catch (err) {
    console.log('Error:', err.message);
    console.log('');
  }

  console.log('=========================================');
  console.log('Testing completed');
  console.log('測試完成');
  console.log('=========================================');
}

testSampleLevels();
