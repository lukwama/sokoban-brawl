/**
 * 伺服器端路徑驗證：模擬推箱子，確認 moves 可過關
 * 防止作弊上傳
 */

const DIR = { u: { row: -1, col: 0 }, d: { row: 1, col: 0 }, l: { row: 0, col: -1 }, r: { row: 0, col: 1 } };
const ALIAS = { up: 'u', down: 'd', left: 'l', right: 'r' };

function parseLevel(levelString) {
  const rows = levelString.trim().split('\n').map((r) => r.split(''));
  const rows_ = rows.length;
  const cols_ = rows[0]?.length || 0;
  let playerPos = null;
  const boxPositions = [];
  const targetPositions = [];

  for (let row = 0; row < rows_; row++) {
    for (let col = 0; col < cols_; col++) {
      const c = rows[row][col];
      if (c === '@' || c === '%') playerPos = { row, col };
      if (c === '$' || c === '*') boxPositions.push({ row, col });
      if (c === '.' || c === '*' || c === '%') targetPositions.push({ row, col });
    }
  }
  return { levelData: rows, gridSize: { rows: rows_, cols: cols_ }, playerPos, boxPositions, targetPositions };
}

function tryMove(state, dirKey) {
  const d = DIR[dirKey] || DIR[ALIAS[dirKey]];
  if (!d) return false;
  const { levelData, gridSize, playerPos, boxPositions } = state;
  const newPos = { row: playerPos.row + d.row, col: playerPos.col + d.col };
  if (newPos.row < 0 || newPos.row >= gridSize.rows || newPos.col < 0 || newPos.col >= gridSize.cols) return false;
  const cell = levelData[newPos.row]?.[newPos.col];
  if (cell === '#' || cell === '?') return false;

  const boxIdx = boxPositions.findIndex((b) => b.row === newPos.row && b.col === newPos.col);
  if (boxIdx >= 0) {
    const nextBox = { row: newPos.row + d.row, col: newPos.col + d.col };
    if (nextBox.row < 0 || nextBox.row >= gridSize.rows || nextBox.col < 0 || nextBox.col >= gridSize.cols) return false;
    const nextCell = levelData[nextBox.row]?.[nextBox.col];
    if (nextCell === '#' || nextCell === '?') return false;
    if (boxPositions.some((b) => b.row === nextBox.row && b.col === nextBox.col)) return false;
    const newBoxes = [...boxPositions];
    newBoxes[boxIdx] = nextBox;
    return { ...state, playerPos: newPos, boxPositions: newBoxes };
  }
  return { ...state, playerPos: newPos };
}

function checkWin(boxPositions, targetPositions) {
  if (targetPositions.length === 0) return false;
  return targetPositions.every((t) => boxPositions.some((b) => b.row === t.row && b.col === t.col));
}

/**
 * 驗證 moves 是否可過關
 * @param {string} levelString - 關卡字串
 * @param {string} moves - 操作序列，如 "lruulldddurrrluurrddd"
 * @returns {{ valid: boolean, steps?: number, error?: string }}
 */
export function validateSolution(levelString, moves) {
  if (!levelString || !moves || typeof moves !== 'string') {
    return { valid: false, error: 'invalid_input' };
  }
  const parsed = parseLevel(levelString);
  if (!parsed.playerPos) return { valid: false, error: 'invalid_level' };

  let state = parsed;
  const seq = moves.trim().toLowerCase().split('');
  let steps = 0;

  for (const key of seq) {
    const next = tryMove(state, key);
    if (!next) return { valid: false, error: 'invalid_move', step: steps };
    state = next;
    steps++;
  }

  if (!checkWin(state.boxPositions, parsed.targetPositions)) {
    return { valid: false, error: 'not_completed', steps };
  }
  return { valid: true, steps };
}
