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
import { spawn, execSync } from 'child_process';
import { initDb, getLeaderboard, hasDuplicateMoves, insertRecord, getNextCustomLevelId, isDuplicateLevel, insertCustomLevel, getCustomLevels, getCustomLevelById } from './db.js';
import { validateSolution } from './core/validator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const levels = JSON.parse(readFileSync(join(__dirname, 'levels.json'), 'utf8'));
const clientDir = join(__dirname, '..', 'client');

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
  html = html.replace(/href="\/css\/style\.css(?:\?[^"]*)?"/i, `href="/css/style.css?t=${cssTs}"`);
  html = html.replace(/src="\/js\/game\.js(?:\?[^"]*)?"/i, `src="/js/game.js?t=${jsTs}"`);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

app.get('/', sendIndexHtml);
app.get('/singleplayer/:levelId', sendIndexHtml);
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;

async function start() {
  await initDb();

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
    const customLevels = getCustomLevels();
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
        levelData: customLevel.levelData,
        creatorName: customLevel.creatorName,
        createdAt: customLevel.createdAt,
        isCustom: true
      });
    }
    
    return res.status(404).json({ error: 'level_not_found' });
  });

  // en_US: Submit custom level (with validation)
  // zh_TW: 提交自訂關卡（含驗證）
  app.post('/api/custom-levels', (req, res) => {
    const { levelData, creatorName, solutionMoves } = req.body || {};
    
    // Validate required fields
    if (!levelData || typeof levelData !== 'string' || !levelData.trim()) {
      return res.status(400).json({
        success: false,
        error: 'level_data_required',
        message: '關卡內容為必填'
      });
    }
    
    if (!solutionMoves || typeof solutionMoves !== 'string' || !solutionMoves.trim()) {
      return res.status(400).json({
        success: false,
        error: 'solution_required',
        message: '必須提供通關步驟'
      });
    }
    
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
    
    // en_US: Check for duplicate level
    // zh_TW: 檢查關卡是否重複
    const duplicateCheck = isDuplicateLevel(levelData);
    if (duplicateCheck.isDuplicate) {
      return res.status(400).json({
        success: false,
        error: 'duplicate_level',
        message: `此關卡已存在（關卡 ID: ${duplicateCheck.existingLevelId}）`,
        existingLevelId: duplicateCheck.existingLevelId
      });
    }
    
    // en_US: Validate solution (player must complete the level)
    // zh_TW: 驗證通關（玩家必須先通關才能上傳）
    const validationResult = validateSolution(levelData, solutionMoves);
    
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
      levelData.trim(),
      name,
      solutionMoves.trim(),
      validationResult.steps
    );
    
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
        levelString = customLevel.levelData;
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
