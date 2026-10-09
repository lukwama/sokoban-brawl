const DIR = {
  u: { row: -1, col: 0 },
  d: { row: 1, col: 0 },
  l: { row: 0, col: -1 },
  r: { row: 0, col: 1 },
};

const SLOT_COLORS = ['red', 'blue', 'green', 'orange'];

const RAW_MAP = [
  '???#######???',
  '???#. . .#???',
  '???#  B  #???',
  '#### bbb ####',
  '#p         h#',
  '#  g     o  #',
  '#pGg     oOh#',
  '#  g     o  #',
  '#p         h#',
  '#### $$$ ####',
  '???#  @  #???',
  '???#n n n#???',
  '???#######???',
].join('\n');

function parseMap(rawMap = RAW_MAP) {
  const rows = String(rawMap).split('\n').map((r) => r.split(''));
  const R = rows.length;
  const C = Math.max(...rows.map((r) => r.length));
  const grid = rows.map((r) => r.concat(Array(Math.max(0, C - r.length)).fill('?')));
  return { grid, R, C };
}

function collectSymbolPositions(grid) {
  const out = new Map();
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const ch = grid[row][col];
      if (!out.has(ch)) out.set(ch, []);
      out.get(ch).push({ row, col });
    }
  }
  return out;
}

function toFloorCell(ch) {
  if (ch === '#' || ch === '?') return ch;
  return ' ';
}

function cellKey(pos) {
  return `${pos.row},${pos.col}`;
}

function clonePos(pos) {
  return { row: pos.row, col: pos.col };
}

function getSlotLayout(symbols) {
  return [
    {
      slotIndex: 0,
      color: 'red',
      spawnPool: symbols.get('@') || [{ row: 10, col: 6 }],
      boxPool: symbols.get('$') || [{ row: 9, col: 5 }, { row: 9, col: 6 }, { row: 9, col: 7 }],
      targetPool: symbols.get('.') || [{ row: 1, col: 4 }, { row: 1, col: 6 }, { row: 1, col: 8 }],
    },
    {
      slotIndex: 1,
      color: 'blue',
      spawnPool: symbols.get('B') || [{ row: 2, col: 6 }],
      boxPool: symbols.get('b') || [{ row: 3, col: 5 }, { row: 3, col: 6 }, { row: 3, col: 7 }],
      targetPool: symbols.get('n') || [{ row: 11, col: 4 }, { row: 11, col: 6 }, { row: 11, col: 8 }],
    },
    {
      slotIndex: 2,
      color: 'green',
      spawnPool: symbols.get('G') || [{ row: 6, col: 2 }],
      boxPool: symbols.get('g') || [{ row: 5, col: 3 }, { row: 6, col: 3 }, { row: 7, col: 3 }],
      targetPool: symbols.get('h') || [{ row: 4, col: 11 }, { row: 6, col: 11 }, { row: 8, col: 11 }],
    },
    {
      slotIndex: 3,
      color: 'orange',
      spawnPool: symbols.get('O') || [{ row: 6, col: 10 }],
      boxPool: symbols.get('o') || [{ row: 5, col: 9 }, { row: 6, col: 9 }, { row: 7, col: 9 }],
      targetPool: symbols.get('p') || [{ row: 4, col: 1 }, { row: 6, col: 1 }, { row: 8, col: 1 }],
    },
  ];
}

function pickByIndex(pool, idx) {
  if (!Array.isArray(pool) || pool.length === 0) return null;
  return clonePos(pool[idx % pool.length]);
}

export function createMultiplayerMatch(participants, battleSeconds = 30) {
  const { grid } = parseMap();
  const symbols = collectSymbolPositions(grid);
  const baseGrid = grid.map((row) => row.map((c) => toFloorCell(c)));
  const slotLayout = getSlotLayout(symbols);
  const now = Date.now();

  const players = [];
  const boxes = [];
  const targets = [];

  for (let i = 0; i < participants.length && i < SLOT_COLORS.length; i++) {
    const p = participants[i];
    const layout = slotLayout[i];
    const playerPos = pickByIndex(layout.spawnPool, i) || { row: 10, col: 6 };
    players.push({
      id: p.id,
      name: p.name,
      slotIndex: i,
      color: SLOT_COLORS[i],
      isNpc: !!p.isNpc,
      connected: true,
      pos: playerPos,
      joinedAt: p.joinedAt || now,
    });
    layout.boxPool.forEach((pos) => {
      boxes.push({
        ownerSlot: i,
        color: SLOT_COLORS[i],
        pos: clonePos(pos),
      });
    });
    layout.targetPool.forEach((pos) => {
      targets.push({
        ownerSlot: i,
        color: SLOT_COLORS[i],
        pos: clonePos(pos),
      });
    });
  }

  return {
    createdAt: now,
    startedAt: now,
    endsAt: now + battleSeconds * 1000,
    battleSeconds,
    grid: baseGrid,
    R: baseGrid.length,
    C: baseGrid[0]?.length || 0,
    players,
    boxes,
    targets,
    firstScoreAt: {},
    scores: {},
    lastMoveAt: now,
  };
}

function isBlockedCell(state, pos) {
  if (pos.row < 0 || pos.row >= state.R || pos.col < 0 || pos.col >= state.C) return true;
  const c = state.grid[pos.row]?.[pos.col];
  return c === '#' || c === '?';
}

function findPlayerIndex(state, playerId) {
  return state.players.findIndex((p) => p.id === playerId);
}

function findBoxIndexAt(state, row, col) {
  return state.boxes.findIndex((b) => b.pos.row === row && b.pos.col === col);
}

function isPlayerAt(state, row, col) {
  return state.players.some((p) => p.pos.row === row && p.pos.col === col);
}

export function applyMove(state, playerId, dirKey) {
  const d = DIR[dirKey];
  if (!d) return false;
  const playerIdx = findPlayerIndex(state, playerId);
  if (playerIdx < 0) return false;
  const actor = state.players[playerIdx];
  if (!actor.connected && !actor.isNpc) return false;

  const next = { row: actor.pos.row + d.row, col: actor.pos.col + d.col };
  if (isBlockedCell(state, next)) return false;
  if (isPlayerAt(state, next.row, next.col)) return false;

  const boxIdx = findBoxIndexAt(state, next.row, next.col);
  if (boxIdx >= 0) {
    const boxNext = { row: next.row + d.row, col: next.col + d.col };
    if (isBlockedCell(state, boxNext)) return false;
    if (isPlayerAt(state, boxNext.row, boxNext.col)) return false;
    if (findBoxIndexAt(state, boxNext.row, boxNext.col) >= 0) return false;
    state.boxes[boxIdx].pos = boxNext;
  }

  state.players[playerIdx].pos = next;
  state.lastMoveAt = Date.now();
  updateScores(state);
  return true;
}

export function updateScores(state) {
  const now = Date.now();
  const nextScores = {};
  for (const player of state.players) {
    const ownTargets = state.targets.filter((t) => t.ownerSlot === player.slotIndex);
    const ownBoxes = state.boxes.filter((b) => b.ownerSlot === player.slotIndex);
    let score = 0;
    for (const box of ownBoxes) {
      if (ownTargets.some((t) => t.pos.row === box.pos.row && t.pos.col === box.pos.col)) score++;
    }
    nextScores[player.slotIndex] = score;
    const prevScore = state.scores[player.slotIndex] || 0;
    if (score > prevScore) {
      state.firstScoreAt[player.slotIndex] = now;
    }
  }
  state.scores = nextScores;
}

export function computeRanking(state) {
  const now = Date.now();
  return state.players
    .map((player) => ({
      playerId: player.id,
      playerName: player.name,
      slotIndex: player.slotIndex,
      color: player.color,
      isNpc: player.isNpc,
      score: state.scores[player.slotIndex] || 0,
      firstScoreAt: state.firstScoreAt[player.slotIndex] || Number.MAX_SAFE_INTEGER,
      joinedAt: player.joinedAt || now,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.firstScoreAt !== b.firstScoreAt) return a.firstScoreAt - b.firstScoreAt;
      return a.joinedAt - b.joinedAt;
    })
    .map((r, idx) => ({ ...r, rank: idx + 1 }));
}

export function serializeMatchState(state) {
  const now = Date.now();
  const players = state.players.map((p) => ({
    id: p.id,
    name: p.name,
    slotIndex: p.slotIndex,
    color: p.color,
    isNpc: p.isNpc,
    connected: p.connected,
    row: p.pos.row,
    col: p.pos.col,
  }));
  const boxes = state.boxes.map((b) => ({
    ownerSlot: b.ownerSlot,
    color: b.color,
    row: b.pos.row,
    col: b.pos.col,
  }));
  const targets = state.targets.map((t) => ({
    ownerSlot: t.ownerSlot,
    color: t.color,
    row: t.pos.row,
    col: t.pos.col,
  }));
  return {
    rows: state.grid.map((r) => r.join('')),
    players,
    boxes,
    targets,
    scores: { ...state.scores },
    ranking: computeRanking(state),
    timeLeftMs: Math.max(0, state.endsAt - now),
    battleSeconds: state.battleSeconds,
  };
}

export function setPlayerConnection(state, playerId, connected) {
  const idx = findPlayerIndex(state, playerId);
  if (idx < 0) return;
  state.players[idx].connected = connected;
}

export function getNpcPlayers(state) {
  return state.players.filter((p) => p.isNpc);
}
