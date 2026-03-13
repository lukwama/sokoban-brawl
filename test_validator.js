/**
 * en_US (English)
 * Test validator to find a valid solution for level 0
 * 
 * zh_TW（繁體中文）
 * 測試驗證器，找出關卡 0 的有效解法
 */
import { validateSolution } from './server/core/validator.js';
import { readFileSync } from 'fs';

const levels = JSON.parse(readFileSync('./server/levels.json', 'utf8'));
const level0 = levels[0];

console.log('Level 0:');
console.log(level0);
console.log('\n');

// Test various move sequences
const testCases = [
  'lllddd',
  'lllurrrddd',
  'llluuurrrddd',
  'dddlll',
  'dddrrrullddd',
  'dllldrrruuurrrddd',
  'dllluuurrrddd',
  'dlllurrrddduuu',
];

console.log('Testing various move sequences:\n');

for (const moves of testCases) {
  const result = validateSolution(level0, moves);
  console.log(`Moves: ${moves} (${moves.length} steps)`);
  console.log(`Result: ${JSON.stringify(result)}`);
  console.log('---');
}
