/**
 * Sokoban Brawl - Node.js 伺服器
 * 排行榜 API、路徑驗證、SQLite 儲存
 */
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initDb, getLeaderboard, hasDuplicateMoves, insertRecord } from './db.js';
import { validateSolution } from './core/validator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const levels = JSON.parse(readFileSync(join(__dirname, 'levels.json'), 'utf8'));
const clientDir = join(__dirname, '..', 'client');

const app = express();
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json());
app.use('/client', express.static(clientDir));
app.get('/', (req, res) => res.sendFile(join(clientDir, 'index.html')));
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;

async function start() {
  await initDb();

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'sokoban-brawl' });
  });

  app.get('/api/leaderboard/:levelId', (req, res) => {
    const { levelId } = req.params;
    const levelIndex = parseInt(levelId, 10);
    if (isNaN(levelIndex) || levelIndex < 0 || levelIndex >= levels.length) {
      return res.status(400).json({ error: 'invalid_level_id' });
    }
    const records = getLeaderboard(levelId);
    res.json({ levelId, records });
  });

  app.post('/api/leaderboard/:levelId', (req, res) => {
    const { levelId } = req.params;
    const { steps, moves, playerName } = req.body || {};

    const levelIndex = parseInt(levelId, 10);
    if (isNaN(levelIndex) || levelIndex < 0 || levelIndex >= levels.length) {
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

    const levelString = levels[levelIndex];
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
    socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
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
