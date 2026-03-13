/**
 * en_US (English)
 * Debug level structure and find valid first moves
 * 
 * zh_TW（繁體中文）
 * 調試關卡結構並找出有效的首次移動
 */
import { readFileSync } from 'fs';

const levels = JSON.parse(readFileSync('./server/levels.json', 'utf8'));
const level0 = levels[0];

console.log('Level 0 raw string:');
console.log(JSON.stringify(level0));
console.log('\n');

console.log('Level 0 visualization:');
const rows = level0.trim().split('\n');
rows.forEach((row, idx) => {
  console.log(`Row ${idx}: "${row}" (${row.length} chars)`);
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    const charCode = char.charCodeAt(0);
    if (char === '@') console.log(`  - Col ${i}: '@' (player) [code: ${charCode}]`);
    if (char === '$') console.log(`  - Col ${i}: '$' (box) [code: ${charCode}]`);
    if (char === '.') console.log(`  - Col ${i}: '.' (target) [code: ${charCode}]`);
    if (char === '*') console.log(`  - Col ${i}: '*' (box on target) [code: ${charCode}]`);
    if (char === '#') console.log(`  - Col ${i}: '#' (wall) [code: ${charCode}]`);
  }
});

console.log('\n');
console.log('Analyzing initial state:');

let playerPos = null;
const boxes = [];
const targets = [];
const walls = [];

rows.forEach((row, r) => {
  for (let c = 0; c < row.length; c++) {
    const cell = row[c];
    if (cell === '@') playerPos = { row: r, col: c };
    if (cell === '$' || cell === '*') boxes.push({ row: r, col: c });
    if (cell === '.' || cell === '*') targets.push({ row: r, col: c });
    if (cell === '#') walls.push({ row: r, col: c });
  }
});

console.log('Player:', playerPos);
console.log('Boxes:', boxes);
console.log('Targets:', targets);
console.log('Total walls:', walls.length);

console.log('\n');
console.log('Testing single moves from initial position:');

const moves = ['u', 'd', 'l', 'r'];
moves.forEach(move => {
  const dir = {
    u: { row: -1, col: 0 },
    d: { row: 1, col: 0 },
    l: { row: 0, col: -1 },
    r: { row: 0, col: 1 }
  }[move];
  
  const newRow = playerPos.row + dir.row;
  const newCol = playerPos.col + dir.col;
  
  if (newRow >= 0 && newRow < rows.length && newCol >= 0 && newCol < rows[newRow].length) {
    const targetCell = rows[newRow][newCol];
    const hasBox = boxes.some(b => b.row === newRow && b.col === newCol);
    
    console.log(`Move '${move}': Player (${playerPos.row},${playerPos.col}) -> (${newRow},${newCol})`);
    console.log(`  Target cell: '${targetCell}' [code: ${targetCell.charCodeAt(0)}]`);
    console.log(`  Has box: ${hasBox}`);
    
    if (hasBox) {
      const boxNewRow = newRow + dir.row;
      const boxNewCol = newCol + dir.col;
      if (boxNewRow >= 0 && boxNewRow < rows.length && boxNewCol >= 0 && boxNewCol < rows[boxNewRow].length) {
        const boxTargetCell = rows[boxNewRow][boxNewCol];
        console.log(`  Box would move to (${boxNewRow},${boxNewCol}): '${boxTargetCell}'`);
      }
    }
  }
  console.log('');
});
