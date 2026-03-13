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
import { createHmac } from 'crypto';
import { spawn } from 'child_process';
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

  console.log(`[Webhook] Push to ${branch} detected, triggering deployment...`);
  res.json({ message: 'Deployment triggered' });

  const deployScript = join(__dirname, '..', 'scripts', 'deploy.sh');
  const deploy = spawn('bash', [deployScript], {
    detached: true,
    stdio: 'ignore'
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

app.get('/', (req, res) => {
  let html = readFileSync(join(clientDir, 'index.html'), 'utf8');
  const cssTs = getMtime('css/style.css');
  const jsTs = getMtime('js/game.js');
  html = html.replace(/href="css\/style\.css"(?:\?[^"]*)?/i, `href="css/style.css?t=${cssTs}"`);
  html = html.replace(/src="js\/game\.js"(?:\?[^"]*)?/i, `src="js/game.js?t=${jsTs}"`);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;

async function start() {
  await initDb();

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'sokoban-brawl' });
  });

  app.get('/api/levels', (req, res) => {
    res.json({ levels });
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
