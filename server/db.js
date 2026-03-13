/**
 * SQLite 資料庫：排行榜儲存（使用 sql.js，無需 native 編譯）
 * 排序：步數少優先，同步數先達成者優先
 */
import initSqlJs from 'sql.js';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.SQLITE_PATH || join(__dirname, '..', 'data', 'sokoban.db');

let db;
let SQL;

export async function initDb() {
  SQL = await initSqlJs();
  const dataDir = join(__dirname, '..', 'data');
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

  if (existsSync(dbPath)) {
    const buf = readFileSync(dbPath);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id TEXT PRIMARY KEY,
      level_id TEXT NOT NULL,
      player_name TEXT NOT NULL,
      steps INTEGER NOT NULL,
      moves TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_leaderboard_level ON leaderboard(level_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard(level_id, steps, created_at)`);

  // en_US: Custom levels table (player-uploaded levels)
  // zh_TW: 自訂關卡表（玩家上傳的關卡）
  db.run(`
    CREATE TABLE IF NOT EXISTS custom_levels (
      level_id INTEGER PRIMARY KEY,
      level_data TEXT NOT NULL,
      level_hash TEXT NOT NULL,
      creator_name TEXT NOT NULL,
      solution_moves TEXT NOT NULL,
      solution_steps INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_level_hash ON custom_levels(level_hash)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_custom_level_created ON custom_levels(created_at)`);

  return db;
}

function saveDb() {
  if (db) {
    const data = db.export();
    const buf = Buffer.from(data);
    writeFileSync(dbPath, buf);
  }
}

function getDb() {
  if (!db) throw new Error('DB not initialized');
  return db;
}

function escape(s) {
  return String(s).replace(/'/g, "''");
}

/** 取得排行榜：步數升序，同步數以 created_at 升序（先達成者前） */
export function getLeaderboard(levelId, limit = 10000) {
  const d = getDb();
  const res = d.exec(
    `SELECT id, level_id, player_name, steps, moves, created_at
     FROM leaderboard WHERE level_id = '${escape(levelId)}'
     ORDER BY steps ASC, created_at ASC LIMIT ${Math.min(limit, 10000)}`
  );
  const rows = res[0]?.values || [];
  const cols = res[0]?.columns || [];
  const idx = (k) => cols.indexOf(k);
  return rows.map((v, i) => ({
    rank: i + 1,
    recordId: v[idx('id')],
    playerName: v[idx('player_name')],
    steps: v[idx('steps')],
    moves: v[idx('moves')],
    timestamp: v[idx('created_at')],
  }));
}

/** 檢查是否已有相同 moves 的記錄（防重複） */
export function hasDuplicateMoves(levelId, moves) {
  const d = getDb();
  const res = d.exec(
    `SELECT 1 FROM leaderboard WHERE level_id = '${escape(levelId)}' AND moves = '${escape(moves)}' LIMIT 1`
  );
  return (res[0]?.values?.length || 0) > 0;
}

/** 新增記錄，回傳 recordId 與排名 */
export function insertRecord(levelId, playerName, steps, moves, customCreatedAt = null) {
  const d = getDb();
  const id = 'rec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
  const createdAt = customCreatedAt || Date.now();
  d.run(
    `INSERT INTO leaderboard (id, level_id, player_name, steps, moves, created_at)
     VALUES ('${id}', '${escape(levelId)}', '${escape(playerName)}', ${parseInt(steps, 10)}, '${escape(moves)}', ${createdAt})`
  );
  saveDb();
  const all = getLeaderboard(levelId);
  const rank = all.findIndex((r) => r.recordId === id) + 1;
  return { recordId: id, rank };
}

// en_US: Custom levels functions
// zh_TW: 自訂關卡函數

/** Generate hash for level data to detect duplicates */
function hashLevelData(levelData) {
  return createHash('sha256').update(levelData.trim()).digest('hex');
}

/** Get next available custom level ID (starts from 57) */
export function getNextCustomLevelId() {
  const d = getDb();
  const res = d.exec('SELECT MAX(level_id) as max_id FROM custom_levels');
  const maxId = res[0]?.values?.[0]?.[0] || 56;
  return Math.max(57, maxId + 1);
}

/** Check if level data already exists (duplicate check) */
export function isDuplicateLevel(levelData) {
  const d = getDb();
  const hash = hashLevelData(levelData);
  const res = d.exec(`SELECT level_id FROM custom_levels WHERE level_hash = '${escape(hash)}' LIMIT 1`);
  const exists = (res[0]?.values?.length || 0) > 0;
  if (exists) {
    const levelId = res[0].values[0][0];
    return { isDuplicate: true, existingLevelId: levelId };
  }
  return { isDuplicate: false };
}

/** Insert custom level */
export function insertCustomLevel(levelData, creatorName, solutionMoves, solutionSteps) {
  const d = getDb();
  const levelId = getNextCustomLevelId();
  const hash = hashLevelData(levelData);
  const createdAt = Date.now();
  
  d.run(
    `INSERT INTO custom_levels (level_id, level_data, level_hash, creator_name, solution_moves, solution_steps, created_at)
     VALUES (${levelId}, '${escape(levelData)}', '${escape(hash)}', '${escape(creatorName)}', '${escape(solutionMoves)}', ${solutionSteps}, ${createdAt})`
  );
  saveDb();
  
  return { levelId, createdAt };
}

/** Get all custom levels */
export function getCustomLevels() {
  const d = getDb();
  const res = d.exec(
    `SELECT level_id, level_data, creator_name, solution_steps, created_at
     FROM custom_levels ORDER BY level_id ASC`
  );
  const rows = res[0]?.values || [];
  const cols = res[0]?.columns || [];
  const idx = (k) => cols.indexOf(k);
  
  return rows.map((v) => ({
    levelId: v[idx('level_id')],
    levelData: v[idx('level_data')],
    creatorName: v[idx('creator_name')],
    solutionSteps: v[idx('solution_steps')],
    createdAt: v[idx('created_at')],
  }));
}

/** Get custom level by ID */
export function getCustomLevelById(levelId) {
  const d = getDb();
  const res = d.exec(
    `SELECT level_id, level_data, creator_name, solution_steps, created_at
     FROM custom_levels WHERE level_id = ${parseInt(levelId, 10)} LIMIT 1`
  );
  const rows = res[0]?.values || [];
  if (rows.length === 0) return null;
  
  const cols = res[0].columns;
  const idx = (k) => cols.indexOf(k);
  const v = rows[0];
  
  return {
    levelId: v[idx('level_id')],
    levelData: v[idx('level_data')],
    creatorName: v[idx('creator_name')],
    solutionSteps: v[idx('solution_steps')],
    createdAt: v[idx('created_at')],
  };
}
