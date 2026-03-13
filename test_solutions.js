/**
 * en_US (English)
 * Test various solution sequences for level 0
 * 
 * zh_TW（繁體中文）
 * 測試關卡 0 的各種解法序列
 */
import { validateSolution } from './server/core/validator.js';
import { readFileSync } from 'fs';

const levels = JSON.parse(readFileSync('./server/levels.json', 'utf8'));
const level0 = levels[0];

// Based on analysis:
// Player at (3,3), boxes at (3,2) and (3,4), targets at (5,1) and (5,5)
// Valid first moves: u, l, r
const testCases = [
  'u',
  'ul',
  'ur',
  'ull',
  'urr',
  'ulld',
  'urrd',
  'ulldd',
  'urrdd',
  'ulldl',
  'urrdr',
  'ullddl',
  'urrddr',
  'ulldldd',
  'urrddrr',
  'ulldlddrr',
  'urrddrdd',
  // Try pushing left box down first
  'lddrullddr',
  'lddruulddr',
  'lddrruulddr',
  // Try a systematic approach
  'ulddruurddr',
  'urddluurddr',
];

console.log('Testing solution sequences:\n');

let validCount = 0;
for (const moves of testCases) {
  const result = validateSolution(level0, moves);
  const status = result.valid ? '✓ VALID' : '✗ INVALID';
  console.log(`${status}: "${moves}" (${moves.length} steps)`);
  if (!result.valid) {
    console.log(`  Error: ${result.error} at step ${result.step || 'unknown'}`);
  } else {
    console.log(`  ✓ Solution found with ${result.steps} steps!`);
    validCount++;
  }
}

console.log(`\n${validCount} valid solution(s) found.`);
