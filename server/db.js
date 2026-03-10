/**
 * SQLite 資料庫：排行榜儲存（使用 sql.js，無需 native 編譯）
 * 排序：步數少優先，同步數先達成者優先
 */
import initSqlJs from 'sql.js';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

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
export function insertRecord(levelId, playerName, steps, moves) {
  const d = getDb();
  const id = 'rec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
  const createdAt = Date.now();
  d.run(
    `INSERT INTO leaderboard (id, level_id, player_name, steps, moves, created_at)
     VALUES ('${id}', '${escape(levelId)}', '${escape(playerName)}', ${parseInt(steps, 10)}, '${escape(moves)}', ${createdAt})`
  );
  saveDb();
  const all = getLeaderboard(levelId);
  const rank = all.findIndex((r) => r.recordId === id) + 1;
  return { recordId: id, rank };
}
