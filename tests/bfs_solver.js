/**
 * en_US (English)
 * BFS solver for Sokoban level 0
 * 
 * zh_TW（繁體中文）
 * 關卡 0 的廣度優先搜索求解器
 */
import { readFileSync } from 'fs';

const levels = JSON.parse(readFileSync('./server/levels.json', 'utf8'));
const level0 = levels[0];

function parseLevel(levelString) {
  const rows = levelString.trim().split('\n').map((r) => r.split(''));
  let playerPos = null;
  const boxPositions = [];
  const targetPositions = [];

  for (let row = 0; row < rows.length; row++) {
    for (let col = 0; col < rows[row].length; col++) {
      const c = rows[row][col];
      if (c === '@') playerPos = { row, col };
      if (c === '$' || c === '*') boxPositions.push({ row, col });
      if (c === '.' || c === '*') targetPositions.push({ row, col });
    }
  }
  return { levelData: rows, playerPos, boxPositions, targetPositions };
}

function checkWin(boxPositions, targetPositions) {
  if (targetPositions.length === 0) return false;
  return targetPositions.every((t) => boxPositions.some((b) => b.row === t.row && b.col === t.col));
}

function stateKey(playerPos, boxPositions) {
  const boxKey = boxPositions
    .map(b => `${b.row},${b.col}`)
    .sort()
    .join('|');
  return `${playerPos.row},${playerPos.col}|${boxKey}`;
}

function tryMove(levelData, playerPos, boxPositions, dirKey) {
  const DIR = { u: { row: -1, col: 0 }, d: { row: 1, col: 0 }, l: { row: 0, col: -1 }, r: { row: 0, col: 1 } };
  const d = DIR[dirKey];
  if (!d) return null;
  
  const newPos = { row: playerPos.row + d.row, col: playerPos.col + d.col };
  if (newPos.row < 0 || newPos.row >= levelData.length || newPos.col < 0 || newPos.col >= levelData[newPos.row].length) {
    return null;
  }
  
  const cell = levelData[newPos.row]?.[newPos.col];
  if (cell === '#' || cell === '?') return null;

  const boxIdx = boxPositions.findIndex((b) => b.row === newPos.row && b.col === newPos.col);
  if (boxIdx >= 0) {
    const nextBox = { row: newPos.row + d.row, col: newPos.col + d.col };
    if (nextBox.row < 0 || nextBox.row >= levelData.length || nextBox.col < 0 || nextBox.col >= levelData[nextBox.row].length) {
      return null;
    }
    const nextCell = levelData[nextBox.row]?.[nextBox.col];
    if (nextCell === '#' || nextCell === '?') return null;
    if (boxPositions.some((b) => b.row === nextBox.row && b.col === nextBox.col)) return null;
    
    const newBoxes = [...boxPositions];
    newBoxes[boxIdx] = nextBox;
    return { playerPos: newPos, boxPositions: newBoxes };
  }
  return { playerPos: newPos, boxPositions: boxPositions };
}

function solveBFS(levelString, maxDepth = 50) {
  const parsed = parseLevel(levelString);
  const { levelData, playerPos, boxPositions, targetPositions } = parsed;
  
  const queue = [{ playerPos, boxPositions, path: '' }];
  const visited = new Set([stateKey(playerPos, boxPositions)]);
  
  while (queue.length > 0) {
    const { playerPos: curPlayer, boxPositions: curBoxes, path } = queue.shift();
    
    if (checkWin(curBoxes, targetPositions)) {
      return { found: true, solution: path };
    }
    
    if (path.length >= maxDepth) continue;
    
    for (const dir of ['u', 'd', 'l', 'r']) {
      const next = tryMove(levelData, curPlayer, curBoxes, dir);
      if (next) {
        const key = stateKey(next.playerPos, next.boxPositions);
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ playerPos: next.playerPos, boxPositions: next.boxPositions, path: path + dir });
        }
      }
    }
  }
  
  return { found: false };
}

console.log('Solving level 0 with BFS (max depth 50)...\n');
const result = solveBFS(level0, 50);

if (result.found) {
  console.log(`✓✓✓ SOLUTION FOUND! ✓✓✓`);
  console.log(`Solution: "${result.solution}"`);
  console.log(`Steps: ${result.solution.length}`);
} else {
  console.log('✗ No solution found within max depth.');
}
