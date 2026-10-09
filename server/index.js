/**
 * Sokoban Brawl - Node.js 伺服器
 * 排行榜 API、路徑驗證、SQLite 儲存
 */
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { readFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHmac, createHash } from 'crypto';
import { spawn, execSync } from 'child_process';
import { initDb, getLeaderboard, hasDuplicateMoves, insertRecord, insertCustomLevel, getCustomLevels, getCustomLevelById } from './db.js';
import { validateSolution } from './core/validator.js';
import {
  applyMove as applyMultiplayerMove,
  computeRanking,
  createMultiplayerMatch,
  getNpcPlayers,
  serializeMatchState,
  setPlayerConnection,
  updateScores,
} from './core/multiplayerEngine.js';
import { pickNpcMove } from './core/npcBot.js';
import { seedDefaultCustomLevelsIfNeeded } from './seedDefaultLevels.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDir = join(__dirname, '..', 'client');

function normalizeLevelData(levelData) {
  const rows = String(levelData || '').replace(/^[\r\n]+|[\r\n]+$/g, '').split('\n');
  const width = Math.max(0, ...rows.map((r) => r.length));
  return rows.map((r) => r.padEnd(width, '?')).join('\n');
}

function isRectangularLevelData(levelData) {
  const rows = String(levelData || '').replace(/^[\r\n]+|[\r\n]+$/g, '').split('\n');
  if (rows.length === 0) return false;
  const width = rows[0].length;
  if (width === 0) return false;
  return rows.every((r) => r.length === width);
}

function normalizeCanonicalCell(ch) {
  if (ch === '#' || ch === '?') return '#';
  if (ch === '$') return '$';
  if (ch === '*') return '*';
  if (ch === '.') return '.';
  if (ch === '@') return '@';
  if (ch === '%') return '%';
  return ' ';
}

function levelToCanonicalMatrix(levelData) {
  const normalized = normalizeLevelData(levelData);
  return normalized.split('\n').map((row) => row.split('').map((ch) => normalizeCanonicalCell(ch)));
}

function findPlayerInMatrix(matrix) {
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c] === '@' || matrix[r][c] === '%') return { row: r, col: c };
    }
  }
  return null;
}

function floodFill(matrix, start, passable) {
  const rows = matrix.length;
  const cols = rows > 0 ? matrix[0].length : 0;
  const inBounds = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols;
  const key = (r, c) => `${r},${c}`;
  const queue = [start];
  const visited = new Set();
  let minRow = start.row;
  let maxRow = start.row;
  let minCol = start.col;
  let maxCol = start.col;

  while (queue.length > 0) {
    const cur = queue.shift();
    const k = key(cur.row, cur.col);
    if (visited.has(k)) continue;
    if (!inBounds(cur.row, cur.col)) continue;
    if (!passable(matrix[cur.row][cur.col])) continue;
    visited.add(k);
    if (cur.row < minRow) minRow = cur.row;
    if (cur.row > maxRow) maxRow = cur.row;
    if (cur.col < minCol) minCol = cur.col;
    if (cur.col > maxCol) maxCol = cur.col;
    queue.push({ row: cur.row - 1, col: cur.col });
    queue.push({ row: cur.row + 1, col: cur.col });
    queue.push({ row: cur.row, col: cur.col - 1 });
    queue.push({ row: cur.row, col: cur.col + 1 });
  }

  return { visited, bounds: { minRow, maxRow, minCol, maxCol } };
}

function cropMatrix(matrix, bounds) {
  const out = [];
  for (let r = bounds.minRow; r <= bounds.maxRow; r++) {
    out.push(matrix[r].slice(bounds.minCol, bounds.maxCol + 1));
  }
  return out;
}

function transformMatrix(matrix, type) {
  const R = matrix.length;
  const C = R > 0 ? matrix[0].length : 0;
  const make = (rows, cols) => Array.from({ length: rows }, () => Array(cols).fill(' '));
  let out;

  if (type === 'id') {
    out = make(R, C);
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) out[r][c] = matrix[r][c];
    return out;
  }
  if (type === 'rot90') {
    out = make(C, R);
    for (let r = 0; r < C; r++) for (let c = 0; c < R; c++) out[r][c] = matrix[R - 1 - c][r];
    return out;
  }
  if (type === 'rot180') {
    out = make(R, C);
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) out[r][c] = matrix[R - 1 - r][C - 1 - c];
    return out;
  }
  if (type === 'rot270') {
    out = make(C, R);
    for (let r = 0; r < C; r++) for (let c = 0; c < R; c++) out[r][c] = matrix[c][C - 1 - r];
    return out;
  }
  if (type === 'flipH') {
    out = make(R, C);
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) out[r][c] = matrix[r][C - 1 - c];
    return out;
  }
  if (type === 'flipV') {
    out = make(R, C);
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) out[r][c] = matrix[R - 1 - r][c];
    return out;
  }
  if (type === 'diagMain') {
    out = make(C, R);
    for (let r = 0; r < C; r++) for (let c = 0; c < R; c++) out[r][c] = matrix[c][r];
    return out;
  }
  // diagAnti
  out = make(C, R);
  for (let r = 0; r < C; r++) for (let c = 0; c < R; c++) out[r][c] = matrix[R - 1 - c][C - 1 - r];
  return out;
}

function normalizePlayerPosition(matrix) {
  const player = findPlayerInMatrix(matrix);
  if (!player) return matrix;
  const passable = (ch) => ch !== '#' && ch !== '$' && ch !== '*';
  const ff = floodFill(matrix, player, passable);
  const coords = Array.from(ff.visited).map((k) => {
    const [r, c] = k.split(',').map((n) => parseInt(n, 10));
    return { row: r, col: c };
  });
  if (coords.length === 0) return matrix;
  coords.sort((a, b) => (a.row - b.row) || (a.col - b.col));
  const anchor = coords[0];

  if (anchor.row === player.row && anchor.col === player.col) return matrix;

  const oldCh = matrix[player.row][player.col];
  matrix[player.row][player.col] = oldCh === '%' ? '.' : ' ';
  const newCh = matrix[anchor.row][anchor.col];
  matrix[anchor.row][anchor.col] = newCh === '.' ? '%' : '@';
  return matrix;
}

function matrixToLevelString(matrix) {
  return matrix.map((row) => row.join('')).join('\n');
}

function computeCanonicalLevelHash(levelData) {
  const canonicalMatrix = levelToCanonicalMatrix(levelData);
  const player = findPlayerInMatrix(canonicalMatrix);
  if (!player) return null;

  // Phase 1: boxes are passable, walls are blocked.
  const phase1 = floodFill(canonicalMatrix, player, (ch) => ch !== '#');
  if (phase1.visited.size === 0) return null;
  const cropped = cropMatrix(canonicalMatrix, phase1.bounds);
  const transforms = ['id', 'rot90', 'rot180', 'rot270', 'flipH', 'flipV', 'diagMain', 'diagAnti'];
  const normalizedForms = transforms.map((type) => {
    const transformed = transformMatrix(cropped, type);
    const withNormalizedPlayer = normalizePlayerPosition(transformed);
    return matrixToLevelString(withNormalizedPlayer);
  }).sort();

  const canonicalString = normalizedForms[0];
  return createHash('sha256').update(canonicalString).digest('hex');
}

function isLevelInitiallySolved(levelData) {
  const rows = String(levelData || '').replace(/^[\r\n]+|[\r\n]+$/g, '').split('\n').map((r) => r.split(''));
  const boxes = [];
  const targets = [];
  for (let row = 0; row < rows.length; row++) {
    for (let col = 0; col < rows[row].length; col++) {
      const c = rows[row][col];
      if (c === '$' || c === '*') boxes.push(`${row},${col}`);
      if (c === '.' || c === '*' || c === '%') targets.push(`${row},${col}`);
    }
  }
  if (targets.length === 0) return false;
  return targets.every((t) => boxes.includes(t));
}

function findDuplicateLevelId(normalizedLevelData) {
  const candidateHash = computeCanonicalLevelHash(normalizedLevelData);
  if (!candidateHash) return null;

  const builtInIdx = builtInCanonicalHashes.findIndex((hash) => hash === candidateHash);
  if (builtInIdx >= 0) return builtInIdx;

  const customLevels = getCustomLevels();
  for (const level of customLevels) {
    const customHash = computeCanonicalLevelHash(level.levelData);
    if (customHash && customHash === candidateHash) return level.levelId;
  }
  return null;
}

function evaluateCustomLevelUploadEligibility(levelData) {
  if (!levelData || typeof levelData !== 'string' || !levelData.trim()) {
    return {
      ok: false,
      status: 400,
      payload: {
        success: false,
        error: 'level_data_required',
        message: '關卡內容為必填'
      }
    };
  }

  if (!isRectangularLevelData(levelData)) {
    return {
      ok: false,
      status: 400,
      payload: {
        success: false,
        error: 'level_not_rectangular',
        message: '關卡必須為完整矩形且不可缺字'
      }
    };
  }

  const normalizedLevelData = normalizeLevelData(levelData);

  if (isLevelInitiallySolved(normalizedLevelData)) {
    return {
      ok: false,
      status: 400,
      payload: {
        success: false,
        error: 'already_completed_level',
        message: '關卡初始狀態已完成，請至少保留一個未在目標點上的箱子'
      }
    };
  }

  const duplicateLevelId = findDuplicateLevelId(normalizedLevelData);
  if (duplicateLevelId !== null) {
    return {
      ok: false,
      status: 400,
      payload: {
        success: false,
        error: 'duplicate_level',
        message: `此關卡已存在（關卡 ID: ${duplicateLevelId}）`,
        existingLevelId: duplicateLevelId
      }
    };
  }

  return {
    ok: true,
    normalizedLevelData
  };
}

const rawLevels = JSON.parse(readFileSync(join(__dirname, 'levels.json'), 'utf8'));
const nonRectBuiltInCount = rawLevels.filter((levelData) => !isRectangularLevelData(levelData)).length;
const levels = rawLevels.map((levelData) => normalizeLevelData(levelData));
const builtInCanonicalHashes = levels.map((levelData) => computeCanonicalLevelHash(levelData));

// en_US: Read git commit info at startup for the /health endpoint
// zh_TW: 啟動時讀取 git commit 資訊，供 /health 端點使用
let gitInfo = { commit: 'unknown', branch: 'unknown', date: 'unknown' };
try {
  const repoDir = join(__dirname, '..');
  gitInfo.commit = execSync('git rev-parse --short HEAD', { cwd: repoDir, encoding: 'utf8' }).trim();
  gitInfo.branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: repoDir, encoding: 'utf8' }).trim();
  gitInfo.date = execSync('git log -1 --format=%ci', { cwd: repoDir, encoding: 'utf8' }).trim();
} catch { /* git info unavailable */ }

const app = express();
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// GitHub Webhook endpoint (before express.json() to preserve raw body for signature verification)
app.post('/webhook/github', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const event = req.headers['x-github-event'];
  const secret = process.env.WEBHOOK_SECRET;

  if (!secret) {
    console.warn('[Webhook] WEBHOOK_SECRET not set, skipping signature verification');
  } else if (!signature) {
    console.warn('[Webhook] No signature provided');
    return res.status(401).json({ error: 'No signature' });
  } else {
    const hmac = createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(req.body).digest('hex');
    if (signature !== digest) {
      console.warn('[Webhook] Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  if (event !== 'push') {
    console.log(`[Webhook] Ignored event: ${event}`);
    return res.json({ message: 'Event ignored' });
  }

  const payload = JSON.parse(req.body.toString());
  const branch = payload.ref?.replace('refs/heads/', '');
  const targetBranch = process.env.DEPLOY_BRANCH || 'main';

  if (branch !== targetBranch) {
    console.log(`[Webhook] Ignored push to branch: ${branch} (target: ${targetBranch})`);
    return res.json({ message: `Branch ${branch} ignored` });
  }

  const headCommit = payload.head_commit?.id?.substring(0, 7) || 'unknown';
  console.log(`[Webhook] Push to ${branch} detected (commit: ${headCommit}), triggering deployment...`);
  res.json({ message: 'Deployment triggered', commit: headCommit });

  const deployScript = join(__dirname, '..', 'scripts', 'deploy.sh');
  const deploy = spawn('bash', [deployScript], {
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, DEPLOY_BRANCH: targetBranch },
  });
  deploy.unref();
});

app.use(express.json());
app.use(express.static(clientDir)); // 掛載在根目錄，讓 /css 和 /js 可以直接被存取
app.use('/client', express.static(clientDir)); // 為了相容保留

function getMtime(path) {
  try {
    return statSync(join(clientDir, path)).mtimeMs;
  } catch {
    return Date.now();
  }
}

// en_US: Serve index.html for SPA (root and singleplayer level deep links)
// zh_TW: 供 SPA 使用（首頁與單人關卡直連）
function sendIndexHtml(req, res) {
  let html = readFileSync(join(clientDir, 'index.html'), 'utf8');
  const cssTs = getMtime('css/style.css');
  const jsTs = getMtime('js/game.js');
  const multiJsTs = getMtime('js/multiplayer.js');
  html = html.replace(/href="\/css\/style\.css(?:\?[^"]*)?"/i, `href="/css/style.css?t=${cssTs}"`);
  html = html.replace(/src="\/js\/game\.js(?:\?[^"]*)?"/i, `src="/js/game.js?t=${jsTs}"`);
  html = html.replace(/src="\/js\/multiplayer\.js(?:\?[^"]*)?"/i, `src="/js/multiplayer.js?t=${multiJsTs}"`);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

app.get('/', sendIndexHtml);
app.get('/singleplayer/:levelId', sendIndexHtml);
app.get('/multiplayer/:roomId', sendIndexHtml);
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;
const LOBBY_COUNTDOWN_SECONDS = 60;
const BATTLE_SECONDS = 30;
const SLOT_COLORS = ['red', 'blue', 'green', 'orange'];
const lobbyRooms = new Map();
const PRACTICE_ROWS = [
  '#############',
  '#           #',
  '#           #',
  '#           #',
  '#           #',
  '#           #',
  '#           #',
  '#           #',
  '#           #',
  '#           #',
  '#############',
];

function sanitizePlayerName(input) {
  const n = (input || '').toString().trim().slice(0, 32);
  return n || 'Player';
}

function makeRoomId() {
  return `r${Math.random().toString(36).slice(2, 8)}`;
}

function createLobbyRoom(roomId) {
  return {
    roomId,
    queue: [],
    spectators: new Set(),
    countdownEndsAt: 0,
    countdownTimer: null,
    activeMatch: null,
    practiceState: createPracticeState(),
  };
}

function createPracticeState() {
  return {
    rows: PRACTICE_ROWS,
    players: [],
    boxes: [],
    targets: [],
  };
}

function practiceOccupiedSet(state) {
  const s = new Set();
  state.players.forEach((p) => s.add(`${p.row},${p.col}`));
  state.boxes.forEach((b) => s.add(`${b.row},${b.col}`));
  state.targets.forEach((t) => s.add(`${t.row},${t.col}`));
  return s;
}

function isPracticeWalkable(state, row, col) {
  const rows = state.rows;
  return !!(rows[row] && rows[row][col] && rows[row][col] !== '#');
}

function isPracticeLooseCell(state, row, col) {
  return (
    isPracticeWalkable(state, row, col)
    && isPracticeWalkable(state, row - 1, col)
    && isPracticeWalkable(state, row + 1, col)
    && isPracticeWalkable(state, row, col - 1)
    && isPracticeWalkable(state, row, col + 1)
  );
}

function pickPracticeCell(state, { requireLoose = false } = {}) {
  const occupied = practiceOccupiedSet(state);
  const candidates = [];
  for (let row = 1; row < state.rows.length - 1; row++) {
    for (let col = 1; col < state.rows[row].length - 1; col++) {
      if (state.rows[row][col] === '#') continue;
      if (requireLoose && !isPracticeLooseCell(state, row, col)) continue;
      const key = `${row},${col}`;
      if (!occupied.has(key)) candidates.push({ row, col });
    }
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function upsertPracticeEntitiesForSocket(room, socketId, color) {
  const s = room.practiceState;
  s.players = s.players.filter((p) => p.socketId !== socketId);
  s.boxes = s.boxes.filter((b) => b.socketId !== socketId);
  s.targets = s.targets.filter((t) => t.socketId !== socketId);
  const player = pickPracticeCell(s);
  const box = pickPracticeCell(s, { requireLoose: true });
  const target = pickPracticeCell(s, { requireLoose: true });
  if (!player || !box || !target) return;
  s.players.push({ socketId, color, row: player.row, col: player.col });
  s.boxes.push({ socketId, color, row: box.row, col: box.col });
  s.targets.push({ socketId, color, row: target.row, col: target.col });
}

function removePracticeEntitiesForSocket(room, socketId) {
  room.practiceState.players = room.practiceState.players.filter((p) => p.socketId !== socketId);
  room.practiceState.boxes = room.practiceState.boxes.filter((b) => b.socketId !== socketId);
  room.practiceState.targets = room.practiceState.targets.filter((t) => t.socketId !== socketId);
}

function emitPracticeState(room, toSocket = null) {
  const payload = {
    rows: room.practiceState.rows,
    players: room.practiceState.players.map((p) => ({ color: p.color, row: p.row, col: p.col, socketId: p.socketId })),
    boxes: room.practiceState.boxes.map((b) => ({ color: b.color, row: b.row, col: b.col, socketId: b.socketId })),
    targets: room.practiceState.targets.map((t) => ({ color: t.color, row: t.row, col: t.col, socketId: t.socketId })),
  };
  if (toSocket) {
    toSocket.emit('lobby:practice_state', payload);
    return;
  }
  io.to(getLobbyChannel(room.roomId)).emit('lobby:practice_state', payload);
}

function cleanupDisconnectedInRoom(room) {
  const connectedIds = new Set(io.sockets.sockets.keys());
  room.queue = room.queue.filter((q) => connectedIds.has(q.socketId));
  room.spectators = new Set(Array.from(room.spectators).filter((sid) => connectedIds.has(sid)));
  room.practiceState.players = room.practiceState.players.filter((p) => connectedIds.has(p.socketId));
  room.practiceState.boxes = room.practiceState.boxes.filter((b) => connectedIds.has(b.socketId));
  room.practiceState.targets = room.practiceState.targets.filter((t) => connectedIds.has(t.socketId));
}

function pickUniqueQueueColor(room) {
  const used = new Set(room.queue.map((q) => q.color).filter(Boolean));
  for (const color of SLOT_COLORS) {
    if (!used.has(color)) return color;
  }
  return null;
}

function movePracticeEntity(room, socketId, dir) {
  const d = dir === 'u' ? { row: -1, col: 0 } : dir === 'd' ? { row: 1, col: 0 } : dir === 'l' ? { row: 0, col: -1 } : dir === 'r' ? { row: 0, col: 1 } : null;
  if (!d) return false;
  const s = room.practiceState;
  const playerIdx = s.players.findIndex((p) => p.socketId === socketId);
  if (playerIdx < 0) return false;
  const actor = s.players[playerIdx];
  const nr = actor.row + d.row;
  const nc = actor.col + d.col;
  if (!isPracticeWalkable(s, nr, nc)) return false;
  if (s.players.some((p, idx) => idx !== playerIdx && p.row === nr && p.col === nc)) return false;
  const boxIdx = s.boxes.findIndex((b) => b.row === nr && b.col === nc);
  if (boxIdx >= 0) {
    const nnr = nr + d.row;
    const nnc = nc + d.col;
    if (!isPracticeWalkable(s, nnr, nnc)) return false;
    if (s.players.some((p) => p.row === nnr && p.col === nnc)) return false;
    if (s.boxes.some((b, idx) => idx !== boxIdx && b.row === nnr && b.col === nnc)) return false;
    s.boxes[boxIdx] = { ...s.boxes[boxIdx], row: nnr, col: nnc };
  }
  s.players[playerIdx] = { ...actor, row: nr, col: nc };
  return true;
}

function getOrCreateLobbyRoom(roomId) {
  const rid = String(roomId || '').trim() || makeRoomId();
  if (!lobbyRooms.has(rid)) lobbyRooms.set(rid, createLobbyRoom(rid));
  return lobbyRooms.get(rid);
}

function getLobbyChannel(roomId) {
  return `lobby:${roomId}`;
}

function getMatchChannel(roomId) {
  return `match:${roomId}`;
}

function getLobbyCountdownSeconds(room) {
  if (!room.countdownEndsAt) return LOBBY_COUNTDOWN_SECONDS;
  return Math.max(0, Math.ceil((room.countdownEndsAt - Date.now()) / 1000));
}

function emitLobbyState(room, toSocket = null) {
  const payload = {
    roomId: room.roomId,
    countdownSeconds: getLobbyCountdownSeconds(room),
    queueCount: room.queue.length,
    spectatorCount: room.spectators.size,
    activeMatch: room.activeMatch ? { startedAt: room.activeMatch.state.startedAt } : null,
  };
  if (toSocket) {
    toSocket.emit('lobby:state', payload);
    return;
  }
  io.to(getLobbyChannel(room.roomId)).emit('lobby:state', payload);
}

function removeFromRoomQueue(room, socketId) {
  const idx = room.queue.findIndex((p) => p.socketId === socketId);
  if (idx >= 0) room.queue.splice(idx, 1);
}

function stopLobbyTimer(room) {
  if (room.countdownTimer) {
    clearInterval(room.countdownTimer);
    room.countdownTimer = null;
  }
}

function runNpcTick(room) {
  if (!room.activeMatch || room.activeMatch.ended) return;
  const npcs = getNpcPlayers(room.activeMatch.state);
  for (const npc of npcs) {
    const dir = pickNpcMove(room.activeMatch.state, npc);
    const changed = applyMultiplayerMove(room.activeMatch.state, npc.id, dir);
    if (changed) {
      io.to(getMatchChannel(room.roomId)).emit('match:state', serializeMatchState(room.activeMatch.state));
    }
  }
}

function endActiveMatch(room) {
  if (!room.activeMatch || room.activeMatch.ended) return;
  room.activeMatch.ended = true;
  if (room.activeMatch.battleTimer) clearInterval(room.activeMatch.battleTimer);
  if (room.activeMatch.npcTimer) clearInterval(room.activeMatch.npcTimer);
  updateScores(room.activeMatch.state);
  const ranking = computeRanking(room.activeMatch.state);
  io.to(getMatchChannel(room.roomId)).emit('match:end', {
    ranking,
    scores: room.activeMatch.state.scores,
  });
  room.activeMatch = null;
}

function createAndStartMatch(room) {
  if (room.activeMatch && !room.activeMatch.ended) return;
  cleanupDisconnectedInRoom(room);
  const selected = room.queue.splice(0, 4);
  if (selected.length === 0) return;

  const participants = selected.map((entry) => ({
    id: entry.socketId,
    name: entry.name,
    isNpc: false,
    joinedAt: entry.joinedAt,
  }));

  if (participants.length === 1) {
    participants.push({
      id: `npc-blue-${room.roomId}`,
      name: 'Blue NPC',
      isNpc: true,
      joinedAt: Date.now(),
    });
  }

  if (participants.length < 2) return;

  for (const p of selected) {
    const socket = io.sockets.sockets.get(p.socketId);
    if (socket) socket.join(getMatchChannel(room.roomId));
  }
  for (const sid of room.spectators) {
    const socket = io.sockets.sockets.get(sid);
    if (socket) socket.join(getMatchChannel(room.roomId));
  }

  const state = createMultiplayerMatch(participants, BATTLE_SECONDS);
  updateScores(state);
  room.activeMatch = {
    roomId: room.roomId,
    state,
    ended: false,
    battleTimer: null,
    npcTimer: null,
  };

  io.to(getMatchChannel(room.roomId)).emit('match:start', {
    roomId: room.roomId,
    battleSeconds: BATTLE_SECONDS,
    players: state.players.map((p) => ({
      id: p.id,
      name: p.name,
      slotIndex: p.slotIndex,
      color: SLOT_COLORS[p.slotIndex],
      isNpc: p.isNpc,
    })),
    state: serializeMatchState(state),
  });

  room.activeMatch.battleTimer = setInterval(() => {
    if (!room.activeMatch || room.activeMatch.ended) return;
    const timeLeft = room.activeMatch.state.endsAt - Date.now();
    if (timeLeft <= 0) {
      endActiveMatch(room);
      return;
    }
    io.to(getMatchChannel(room.roomId)).emit('match:state', serializeMatchState(room.activeMatch.state));
  }, 1000);

  if (state.players.some((p) => p.isNpc)) {
    room.activeMatch.npcTimer = setInterval(() => runNpcTick(room), 700);
  }
}

function startLobbyTimerIfNeeded(room) {
  if (room.countdownTimer) return;
  room.countdownEndsAt = Date.now() + LOBBY_COUNTDOWN_SECONDS * 1000;
  emitLobbyState(room);
  room.countdownTimer = setInterval(() => {
    const left = getLobbyCountdownSeconds(room);
    io.to(getLobbyChannel(room.roomId)).emit('lobby:countdown', { seconds: left, roomId: room.roomId });
    emitLobbyState(room);
    if (left <= 0) {
      createAndStartMatch(room);
      room.countdownEndsAt = Date.now() + LOBBY_COUNTDOWN_SECONDS * 1000;
      if (room.queue.length === 0 && !room.activeMatch && room.spectators.size === 0) {
        stopLobbyTimer(room);
        room.countdownEndsAt = 0;
      }
    }
  }, 1000);
}

function getJoinableRoom() {
  for (const room of lobbyRooms.values()) {
    if (!room.activeMatch && room.queue.length < 4) return room;
  }
  return getOrCreateLobbyRoom(makeRoomId());
}

function cleanupSocketFromRoom(socket, room) {
  removeFromRoomQueue(room, socket.id);
  room.spectators.delete(socket.id);
  removePracticeEntitiesForSocket(room, socket.id);
  socket.leave(getLobbyChannel(room.roomId));
  socket.leave(getMatchChannel(room.roomId));
  if (room.activeMatch && !room.activeMatch.ended) {
    setPlayerConnection(room.activeMatch.state, socket.id, false);
    io.to(getMatchChannel(room.roomId)).emit('match:state', serializeMatchState(room.activeMatch.state));
  }
  emitLobbyState(room);
  emitPracticeState(room);
}

function assignSocketRoom(socket, requestedRoomId = '') {
  const prevRoomId = socket.data.multiRoomId;
  const prevRoom = prevRoomId ? lobbyRooms.get(prevRoomId) : null;
  const nextRoom = requestedRoomId ? getOrCreateLobbyRoom(requestedRoomId) : getJoinableRoom();
  if (prevRoom && prevRoom.roomId !== nextRoom.roomId) cleanupSocketFromRoom(socket, prevRoom);
  cleanupDisconnectedInRoom(nextRoom);
  socket.data.multiRoomId = nextRoom.roomId;
  socket.join(getLobbyChannel(nextRoom.roomId));
  emitLobbyState(nextRoom, socket);
  emitPracticeState(nextRoom, socket);
  return nextRoom;
}

async function start() {
  await initDb();
  seedDefaultCustomLevelsIfNeeded();
  if (nonRectBuiltInCount > 0) {
    console.warn(`[Levels] Normalized ${nonRectBuiltInCount} non-rectangular built-in map(s) by padding '?'`);
  }

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'sokoban-brawl',
      version: gitInfo.commit,
      branch: gitInfo.branch,
      deployDate: gitInfo.date,
    });
  });

  app.get('/api/levels', (req, res) => {
    res.json({ levels });
  });

  // en_US: Get custom levels
  // zh_TW: 取得自訂關卡列表
  app.get('/api/custom-levels', (req, res) => {
    const customLevels = getCustomLevels().map((level) => ({
      ...level,
      levelData: normalizeLevelData(level.levelData),
    }));
    res.json({ customLevels });
  });

  // en_US: Get level by ID (built-in or custom)
  // zh_TW: 依 ID 取得關卡（內建或自訂）
  app.get('/api/levels/:levelId', (req, res) => {
    const { levelId } = req.params;
    const levelIndex = parseInt(levelId, 10);
    
    if (isNaN(levelIndex) || levelIndex < 0) {
      return res.status(400).json({ error: 'invalid_level_id' });
    }
    
    // Built-in levels (0-55)
    if (levelIndex < levels.length) {
      return res.json({
        levelId: levelIndex,
        levelData: levels[levelIndex],
        isCustom: false
      });
    }
    
    // Custom levels (57+)
    const customLevel = getCustomLevelById(levelIndex);
    if (customLevel) {
      return res.json({
        levelId: customLevel.levelId,
        levelData: normalizeLevelData(customLevel.levelData),
        creatorName: customLevel.creatorName,
        createdAt: customLevel.createdAt,
        isCustom: true
      });
    }
    
    return res.status(404).json({ error: 'level_not_found' });
  });

  // en_US: Submit custom level (with validation)
  // zh_TW: 提交自訂關卡（含驗證）
  app.post('/api/custom-levels/precheck', (req, res) => {
    const { levelData } = req.body || {};
    const eligibility = evaluateCustomLevelUploadEligibility(levelData);
    if (!eligibility.ok) {
      return res.status(eligibility.status).json(eligibility.payload);
    }
    return res.json({ success: true, message: 'ok_to_validate' });
  });

  app.post('/api/custom-levels', (req, res) => {
    const { levelData, creatorName, solutionMoves } = req.body || {};
    
    if (!solutionMoves || typeof solutionMoves !== 'string' || !solutionMoves.trim()) {
      return res.status(400).json({
        success: false,
        error: 'solution_required',
        message: '必須提供通關步驟'
      });
    }

    const eligibility = evaluateCustomLevelUploadEligibility(levelData);
    if (!eligibility.ok) {
      return res.status(eligibility.status).json(eligibility.payload);
    }
    const { normalizedLevelData } = eligibility;
    
    const name = (creatorName || '').toString().trim();
    
    // en_US: Check player name (cannot be default names)
    // zh_TW: 檢查玩家名稱（不可為預設名稱）
    const defaultNames = ['Player', 'player', '匿名', '玩家', '', 'Anonymous'];
    if (!name || defaultNames.includes(name)) {
      return res.status(400).json({
        success: false,
        error: 'invalid_player_name',
        message: '請設定玩家名稱（不可使用預設名稱）'
      });
    }
    
    if (name.length > 32) {
      return res.status(400).json({
        success: false,
        error: 'name_too_long',
        message: '玩家名稱不可超過 32 字元'
      });
    }
    
    // en_US: Validate solution (player must complete the level)
    // zh_TW: 驗證通關（玩家必須先通關才能上傳）
    const validationResult = validateSolution(normalizedLevelData, solutionMoves);
    
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        error: validationResult.error || 'validation_failed',
        message: validationResult.error === 'invalid_move' ? '通關步驟無效' :
          validationResult.error === 'not_completed' ? '未完成過關，請先通關此關卡' : '驗證失敗'
      });
    }
    
    // en_US: Insert custom level
    // zh_TW: 插入自訂關卡
    const { levelId, createdAt } = insertCustomLevel(
      normalizedLevelData,
      name,
      solutionMoves.trim(),
      validationResult.steps
    );

    // en_US: Seed leaderboard with uploader's validated first-clear record
    // zh_TW: 新關卡建立後，立即寫入上傳者首次驗證通關紀錄到排行榜
    insertRecord(String(levelId), name, validationResult.steps, solutionMoves.trim(), createdAt);
    
    const levelUrl = `${req.protocol}://${req.get('host')}/singleplayer/${levelId}`;
    
    res.json({
      success: true,
      levelId,
      levelUrl,
      createdAt,
      message: '關卡上傳成功！'
    });
  });

  app.get('/api/leaderboard/:levelId', (req, res) => {
    const { levelId } = req.params;
    const levelIndex = parseInt(levelId, 10);
    
    if (isNaN(levelIndex) || levelIndex < 0) {
      return res.status(400).json({ error: 'invalid_level_id' });
    }
    
    // en_US: Check if level exists (built-in or custom)
    // zh_TW: 檢查關卡是否存在（內建或自訂）
    let levelExists = false;
    
    if (levelIndex < levels.length) {
      levelExists = true;
    } else if (levelIndex >= 57) {
      const customLevel = getCustomLevelById(levelIndex);
      levelExists = customLevel !== null;
    }
    
    if (!levelExists) {
      return res.status(400).json({ error: 'invalid_level_id' });
    }
    
    const records = getLeaderboard(levelId);
    res.json({ levelId, records });
  });

  app.post('/api/leaderboard/:levelId', (req, res) => {
    const { levelId } = req.params;
    const { steps, moves, playerName } = req.body || {};

    const levelIndex = parseInt(levelId, 10);
    
    // en_US: Check both built-in levels and custom levels
    // zh_TW: 檢查內建關卡和自訂關卡
    let levelString = null;
    
    if (levelIndex >= 0 && levelIndex < levels.length) {
      // Built-in level (1-56)
      levelString = levels[levelIndex];
    } else if (levelIndex >= 57) {
      // Custom level
      const customLevel = getCustomLevelById(levelIndex);
      if (customLevel) {
        levelString = normalizeLevelData(customLevel.levelData);
      }
    }
    
    if (!levelString) {
      return res.status(400).json({ success: false, error: 'invalid_level_id' });
    }

    const name = (playerName || '匿名').toString().trim().slice(0, 32) || '匿名';
    const movesStr = (moves || '').toString().trim();
    const stepsNum = parseInt(steps, 10);

    if (!movesStr) {
      return res.status(400).json({ success: false, error: 'moves_required' });
    }
    if (isNaN(stepsNum) || stepsNum < 0) {
      return res.status(400).json({ success: false, error: 'invalid_steps' });
    }

    const result = validateSolution(levelString, movesStr);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        error: result.error || 'validation_failed',
        message: result.error === 'invalid_move' ? '操作序列無效' :
          result.error === 'not_completed' ? '未完成過關' : '驗證失敗',
      });
    }

    if (result.steps !== stepsNum) {
      return res.status(400).json({
        success: false,
        error: 'steps_mismatch',
        message: `步數不符：實際 ${result.steps}，提交 ${stepsNum}`,
      });
    }

    if (hasDuplicateMoves(levelId, movesStr)) {
      return res.status(400).json({
        success: false,
        error: 'duplicate_moves',
        message: '相同路徑已存在',
      });
    }

    const { recordId, rank } = insertRecord(levelId, name, stepsNum, movesStr);
    res.json({ success: true, recordId, rank });
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.data.playerName = 'Player';

    socket.on('room:auto_join', (payload = {}) => {
      const requestedRoomId = String(payload.roomId || '').trim();
      const room = assignSocketRoom(socket, requestedRoomId);
      socket.emit('room:joined', {
        roomId: room.roomId,
        autoAssigned: !requestedRoomId,
      });
    });

    socket.on('matchmaking:join', (payload = {}) => {
      const name = sanitizePlayerName(payload.playerName);
      const room = assignSocketRoom(socket, payload.roomId);
      socket.data.playerName = name;
      cleanupDisconnectedInRoom(room);
      removeFromRoomQueue(room, socket.id);
      room.spectators.delete(socket.id);
      // Frequent mobile refresh may leave stale same-name entries briefly; replace them.
      room.queue = room.queue.filter((q) => q.name !== name);
      const assignedColor = pickUniqueQueueColor(room);
      if (!assignedColor) {
        socket.emit('matchmaking:joined', {
          ok: false,
          roomId: room.roomId,
          error: 'room_full',
          message: '房間配對已滿（最多 4 人）',
        });
        emitLobbyState(room);
        emitPracticeState(room);
        return;
      }
      room.queue.push({
        socketId: socket.id,
        name,
        color: assignedColor,
        joinedAt: Date.now(),
      });
      const queueIndex = Math.max(0, room.queue.findIndex((p) => p.socketId === socket.id));
      socket.data.practiceColor = assignedColor;
      upsertPracticeEntitiesForSocket(room, socket.id, assignedColor);
      socket.emit('matchmaking:joined', {
        ok: true,
        roomId: room.roomId,
        queueIndex,
        color: assignedColor,
        playerName: name,
      });
      emitLobbyState(room);
      emitPracticeState(room);
      startLobbyTimerIfNeeded(room);
    });

    socket.on('matchmaking:leave', () => {
      const roomId = socket.data.multiRoomId;
      const room = roomId ? lobbyRooms.get(roomId) : null;
      if (!room) return;
      cleanupDisconnectedInRoom(room);
      removeFromRoomQueue(room, socket.id);
      removePracticeEntitiesForSocket(room, socket.id);
      emitLobbyState(room);
      emitPracticeState(room);
    });

    socket.on('spectator:joinLobby', (payload = {}) => {
      const name = sanitizePlayerName(payload.playerName);
      const room = assignSocketRoom(socket, payload.roomId);
      socket.data.playerName = name;
      cleanupDisconnectedInRoom(room);
      removeFromRoomQueue(room, socket.id);
      room.spectators.add(socket.id);
      removePracticeEntitiesForSocket(room, socket.id);
      if (room.activeMatch) socket.join(getMatchChannel(room.roomId));
      socket.emit('spectator:joined', { ok: true });
      emitLobbyState(room);
      emitPracticeState(room);
      startLobbyTimerIfNeeded(room);
    });

    socket.on('spectator:leaveLobby', () => {
      const roomId = socket.data.multiRoomId;
      const room = roomId ? lobbyRooms.get(roomId) : null;
      if (!room) return;
      cleanupDisconnectedInRoom(room);
      room.spectators.delete(socket.id);
      if (room.activeMatch) socket.leave(getMatchChannel(room.roomId));
      emitLobbyState(room);
    });

    socket.on('lobby:practice_move', (payload = {}) => {
      const roomId = socket.data.multiRoomId;
      const room = roomId ? lobbyRooms.get(roomId) : null;
      if (!room) return;
      const dir = String(payload.direction || '').toLowerCase();
      const moved = movePracticeEntity(room, socket.id, dir);
      if (!moved) return;
      emitPracticeState(room);
    });

    socket.on('match:move', (payload = {}) => {
      const roomId = socket.data.multiRoomId;
      const room = roomId ? lobbyRooms.get(roomId) : null;
      if (!room || !room.activeMatch || room.activeMatch.ended) return;
      const dir = String(payload.direction || '').toLowerCase();
      const changed = applyMultiplayerMove(room.activeMatch.state, socket.id, dir);
      if (!changed) return;
      io.to(getMatchChannel(room.roomId)).emit('match:state', serializeMatchState(room.activeMatch.state));
    });

    socket.on('match:chat', (payload = {}) => {
      const roomId = socket.data.multiRoomId;
      const room = roomId ? lobbyRooms.get(roomId) : null;
      if (!room || !room.activeMatch || room.activeMatch.ended) return;
      const text = String(payload.text || '').trim().slice(0, 200);
      if (!text) return;
      const fromPlayer = room.activeMatch.state.players.find((p) => p.id === socket.id);
      const fromName = fromPlayer ? fromPlayer.name : 'Spectator';
      io.to(getMatchChannel(room.roomId)).emit('match:chat', {
        fromName,
        fromId: socket.id,
        text,
        timestamp: Date.now(),
      });
    });

    socket.on('lobby:chat', (payload = {}) => {
      const roomId = socket.data.multiRoomId;
      const room = roomId ? lobbyRooms.get(roomId) : null;
      if (!room) return;
      const text = String(payload.text || '').trim().slice(0, 200);
      if (!text) return;
      const queued = room.queue.find((p) => p.socketId === socket.id);
      const fromName = queued
        ? queued.name
        : sanitizePlayerName(payload.playerName || socket.data.playerName || 'Lobby');
      io.to(getLobbyChannel(room.roomId)).emit('lobby:chat', {
        fromName,
        fromId: socket.id,
        text,
        timestamp: Date.now(),
      });
    });

    socket.on('match:returnToLobby', () => {
      const roomId = socket.data.multiRoomId;
      const room = roomId ? lobbyRooms.get(roomId) : null;
      if (!room) return;
      socket.leave(getMatchChannel(room.roomId));
      emitLobbyState(room);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      const roomId = socket.data.multiRoomId;
      const room = roomId ? lobbyRooms.get(roomId) : null;
      if (!room) return;
      cleanupDisconnectedInRoom(room);
      removeFromRoomQueue(room, socket.id);
      room.spectators.delete(socket.id);
      removePracticeEntitiesForSocket(room, socket.id);
      if (room.activeMatch && !room.activeMatch.ended) {
        setPlayerConnection(room.activeMatch.state, socket.id, false);
        io.to(getMatchChannel(room.roomId)).emit('match:state', serializeMatchState(room.activeMatch.state));
      }
      emitLobbyState(room);
      emitPracticeState(room);
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`Sokoban Brawl server at http://localhost:${PORT}`);
    console.log(`  Client (驗證介面): http://localhost:${PORT}/`);
    console.log(`  Health: http://localhost:${PORT}/health`);
    console.log(`  Leaderboard: GET/POST http://localhost:${PORT}/api/leaderboard/:levelId`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
