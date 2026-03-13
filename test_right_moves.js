/**
 * en_US (English)
 * Test right-first solutions
 * 
 * zh_TW（繁體中文）
 * 測試以右移動開始的解法
 */
import { validateSolution } from './server/core/validator.js';
import { readFileSync } from 'fs';

const levels = JSON.parse(readFileSync('./server/levels.json', 'utf8'));
const level0 = levels[0];

// Try sequences starting with 'r' (pushing right box)
const testCases = [
  'r',
  'rr',
  'rl',
  'rll',
  'rlll',
  'rllll',
  'rdlll',
  'rrdlll',
  'ruulll',
  'rruulll',
  // After pushing right box, try to maneuver
  'ruurddl',
  'ruurdldl',
  'ruurdlddl',
];

console.log('Testing right-first solutions:\n');

for (const moves of testCases) {
  const result = validateSolution(level0, moves);
  const status = result.valid ? '✓ VALID' : '✗ INVALID';
  console.log(`${status}: "${moves}" (${moves.length} steps)`);
  if (!result.valid) {
    console.log(`  Error: ${result.error} at step ${result.step || 'unknown'}`);
  } else {
    console.log(`  ✓✓✓ SOLUTION FOUND with ${result.steps} steps! ✓✓✓`);
  }
}
