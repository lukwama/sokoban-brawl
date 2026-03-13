/**
 * Sokoban Brawl - Multi-tab UI (Game, Editor, Leaderboard, Settings)
 * Icon-only; leaderboard & moves from server API; replay from server moves.
 */
const DIR = { u: { r: -1, c: 0 }, d: { r: 1, c: 0 }, l: { r: 0, c: -1 }, r: { r: 0, c: 1 } };
const STORAGE_URL = 'sokoban_brawl_server_url';
const STORAGE_NAME = 'sokoban_brawl_player_name';
const STORAGE_CUSTOM = 'sokobanCustomLevels';
const STORAGE_CONTROL_MODE = 'sokoban_brawl_control_mode';

// en_US: Modal dialog system — replaces native alert/confirm
// zh_TW: Modal 對話框系統 — 取代原生 alert/confirm
function showModal({ icon = 'info', title = '', body = '', buttons = [], onClose = null } = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const iconClassMap = { success: 'modal-icon-success', error: 'modal-icon-error', info: 'modal-icon-info', confirm: 'modal-icon-confirm' };
    const iconTextMap = { success: '✓', error: '✕', info: 'ℹ', confirm: '?' };

    let html = `<div class="modal-card">`;
    html += `<span class="modal-icon ${iconClassMap[icon] || 'modal-icon-info'}">${iconTextMap[icon] || 'ℹ'}</span>`;
    if (title) html += `<div class="modal-title">${title}</div>`;
    if (body) html += `<div class="modal-body">${body}</div>`;
    html += `<div class="modal-actions">`;
    buttons.forEach((btn, i) => {
      const cls = btn.primary ? 'modal-btn modal-btn-primary' : (btn.danger ? 'modal-btn modal-btn-danger' : 'modal-btn');
      html += `<button class="${cls}" data-idx="${i}">${btn.text}</button>`;
    });
    html += `</div></div>`;
    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add('visible'));

    function close(value) {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 200);
      if (onClose) onClose(value);
      resolve(value);
    }

    overlay.querySelectorAll('.modal-btn').forEach((btn) => {
      btn.addEventListener('click', () => close(buttons[+btn.dataset.idx]?.value));
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(null);
    });
  });
}

function showAlert(title, body, icon = 'info') {
  return showModal({ icon, title, body, buttons: [{ text: '確定', value: true, primary: true }] });
}

function showConfirm(title, body, icon = 'confirm') {
  return showModal({ icon, title, body, buttons: [{ text: '取消', value: false }, { text: '確定', value: true, primary: true }] });
}

function showError(title, body) {
  return showAlert(title, body, 'error');
}

function showSuccess(title, body) {
  return showAlert(title, body, 'success');
}

function getBaseUrl() {
  const input = document.getElementById('serverUrl');
  const url = (input && input.value.trim()) || localStorage.getItem(STORAGE_URL) || '';
  return url.replace(/\/+$/, '') || window.location.origin;
}

function setBaseUrl(url) {
  if (url) localStorage.setItem(STORAGE_URL, url);
  const input = document.getElementById('serverUrl');
  if (input) input.value = url || '';
}

function parseLevel(levelString) {
  const rows = levelString.trim().split('\n').map((r) => r.split(''));
  const R = rows.length;
  const C = Math.max(0, ...rows.map((r) => r.length));
  let player = null;
  const boxes = [];
  const targets = [];
  for (let row = 0; row < R; row++) {
    for (let col = 0; col < rows[row].length; col++) {
      const c = rows[row][col];
      if (c === '@') player = { row, col };
      if (c === '$' || c === '*') boxes.push({ row, col });
      if (c === '.' || c === '*') targets.push({ row, col });
    }
  }
  return { grid: rows, R, C, player, boxes, targets };
}

function tryMove(state, key, recordMove = true) {
  const d = DIR[key];
  if (!d || !state.player) return null;
  const { grid, R, C, player, boxes } = state;
  const nr = player.row + d.r;
  const nc = player.col + d.c;
  if (nr < 0 || nr >= R || nc < 0 || nc >= C) return null;
  const cell = grid[nr]?.[nc];
  if (cell === '#' || cell === '?') return null;
  const bi = boxes.findIndex((b) => b.row === nr && b.col === nc);
  if (bi >= 0) {
    const nnr = nr + d.r;
    const nnc = nc + d.c;
    if (nnr < 0 || nnr >= R || nnc < 0 || nnc >= C) return null;
    const nextCell = grid[nnr]?.[nnc];
    if (nextCell === '#' || nextCell === '?') return null;
    if (boxes.some((b) => b.row === nnr && b.col === nnc)) return null;
    const newBoxes = boxes.slice();
    newBoxes[bi] = { row: nnr, col: nnc };
    return { ...state, player: { row: nr, col: nc }, boxes: newBoxes };
  }
  return { ...state, player: { row: nr, col: nc } };
}

function checkWin(boxes, targets) {
  return targets.length > 0 && targets.every((t) => boxes.some((b) => b.row === t.row && b.col === t.col));
}

let levels = ["?#####?\n#     #\n# # # #\n# $@$ #\n# ### #\n#.   .#\n?#####?", "??###???\n??#.#???\n??# ####\n###$ $.#\n#. $@###\n####$#??\n???#.#??\n???###??", "?######\n## .  #\n#  $$.#\n#.$@$.#\n#.$$  #\n#  . ##\n######?", "####???\n#..####\n#..$  #\n#   $ #\n##$$  #\n?#   @#\n?######", "?####?\n##  #?\n#@$ #?\n##$ ##\n## $ #\n#.$  #\n#..*.#\n######", "?####???\n?#@ ###?\n?# $  #?\n### # ##\n#.# #  #\n#.$  # #\n#.   $ #\n########", "??######\n??#    #\n###$$$ #\n#@ $.. #\n# $...##\n####  #?\n???####?", "??#####?\n###  @#?\n#  $. ##\n#  .$. #\n### *$ #\n? #   ##\n??#####?", "??####??\n??#..#??\n?## .##?\n?#  $.#?\n## $  ##\n#  #$$ #\n#   @  #\n########", "########\n#  #   #\n# $..$ #\n#@$.* ##\n# $..$ #\n#  #   #\n########", "?######?\n?#. ..#?\n?#. $.#?\n###  $##\n# $  $ #\n# #$## #\n#   @  #\n########", "?######\n## . @#\n# $ $ #\n#. * .#\n# $ $ #\n#  . ##\n######?", "#######\n#..$..#\n#..#..#\n# $$$ #\n#  $  #\n# $$$ #\n#  #@ #\n#######", "#####????\n#@  #????\n# $$#?###\n# $ #?#.#\n### ###.#\n?##    .#\n?#   #  #\n?#   ####\n?#####???", "??#####?\n###   #?\n#.#@# #?\n#.# $ #?\n#.  ####\n#  $   #\n#  # $ #\n####   #\n???#####", "?####??\n?#  ###\n## $  #\n#   $ #\n# #   #\n# #$###\n# #@..#\n# $ ..#\n###  ##\n??####?", "???####\n???#  #\n??##$ #\n###.. #\n# $.. #\n# $# @#\n# $   #\n#   ###\n#####??", "??####??\n??#  #??\n??# $#??\n###  ###\n#  *.$ #\n#  ..  #\n### $###\n??# @#??\n??####??", "######??\n#@   ###\n#  $   #\n### ## #\n#  $# .#\n#   $$.#\n## $  .#\n?#####.#\n?????#.#\n?????###", "??###??\n###@###\n#     #\n# # $ #\n# #$ ##\n# $ $#?\n## $ #?\n?#...#?\n?##..#?\n??####?", "######\n#  ..#\n# $$.#\n# #..#\n# $ ##\n# # #?\n#  $##\n#  $@#\n##   #\n?#####", "????###?\n#####.##\n# $ $ .#\n#@$ #.##\n# $ .$.#\n#### .##\n???# $ #\n???#   #\n???#####", "?######\n?#  ..#\n?# $*.#\n## $..#\n# $ #@#\n# # $ #\n#  $# #\n###   #\n??#####", "#########\n# ..#   #\n#..* $ @#\n##.##  ##\n# $ $  #?\n#  $#$##?\n#   #  #?\n###    #?\n??###  #?\n????####?", "?########\n?#   #  #\n## #  $ #\n#  # $ @#\n#   $## #\n# $$ $  #\n#   ..###\n####..#??\n???#..#??\n???####??", "??#####?\n??#   #?\n###$$ ##\n# $ #  #\n#..$ #@#\n#..#   #\n#..$$ ##\n#.# $ #?\n###   #?\n??#####?", "?#####??\n?# @ #??\n?#$$$###\n##.#.#.#\n#.$  $ #\n# .#.#.#\n#  $ $ #\n##     #\n?#######", "########?\n#      #?\n# #$$  #?\n# ...# #?\n##...$ ##\n?# ## $ #\n?#$  $  #\n?#  #  @#\n?########", "?####???\n?# @#???\n?#  ####\n##$$#..#\n#   #..#\n# $ $ .#\n#   $ .#\n## $####\n?#  #???\n?####???", "??######?\n??#   .#?\n### $ ##?\n#.#@$ #??\n# ###.###\n# ..#$  #\n# $$ .$.#\n## $  ###\n?#    #??\n?######??", "#########\n#   # ..#\n#   # *.#\n# $  $..#\n# #$## ##\n#$# #  ##\n# $   $ #\n# # ##@ #\n#.  #####\n#####????", "??#####\n###   #\n#. $$ #\n#.#   #\n#. #$@#\n#.$   #\n#. $$ #\n#.  ###\n#####??", "######??\n#@ . ###\n#  #   #\n# $# # #\n#.$.$. #\n##$# $##\n?# #  #?\n?# .  #?\n?######?", "?????####\n######  #\n#    #$ #\n#   $   #\n###$##$ #\n###@##..#\n#  $ ...#\n# $  #.##\n###  ###?\n??####???", "?####??\n?#  ###\n## @  #\n# $.$ #\n#$.$.$#\n#.$.$.#\n# .$. #\n#  *  #\n#######", "#####?\n#   ##\n#  $ #\n# $ @#\n###. #\n??#.##\n??#. #\n###. #\n#  $ #\n# $  #\n##  ##\n?####?", "??####???\n??#  #???\n??# @#???\n??#  #???\n###$#####\n# $ #   #\n# ..$.. #\n# $ #   #\n### # ###\n??#   #??\n??#####??", "####???\n#  ####\n#  $  #\n# #.# #\n# # # #\n#.$.$.#\n# # # #\n# #.# #\n#  $$ #\n##  @ #\n?#  ###\n?####??", "?????####?\n?????#  #?\n######  #?\n#  ## $ #?\n#  ##..##?\n# ..$$.###\n## .$... #\n?#    $$ #\n?#$$$##  #\n?#  @#####\n?#####????", "???#######\n?###     #\n##   # # #\n#  #.$$$ #\n# #.*# ###\n#  ..# # ?\n###..$ ##?\n??#.# $ #?\n?## # #@#?\n?# $  $ #?\n?#     ##?\n?#######??", "?????####\n######  #\n#  $  $@#\n#   ##  #\n#  #.. ##\n##$#..$ #\n## #..  #\n#   ##  #\n#  $  $ #\n######  #\n?????####", "#########?\n#   #   #?\n# #   $ #?\n# # ##$ #?\n#....$  #?\n##.. #  #?\n?##$## ###\n?#     $ #\n?#   #$# #\n?#####  @#\n?????#####", "?#####\n?# @ #\n?#$$$#\n?# $ #\n?#...#\n##...#\n#    #\n# $$ #\n#  ###\n####??", "####???\n#  ###?\n#...@#?\n# $# #?\n#  #$##\n# $#  #\n#  #$ #\n##$...#\n?#  $ #\n?#    #\n?######", "??????####\n????### @#\n#####    #\n# $ ..#$ #\n#  #..$  #\n# $#  #$ #\n#  $..#  #\n# $#.. $ #\n#    #####\n#  ###????\n####??????", "######??\n# @  #??\n#  $ #??\n# $ ####\n## $#. #\n?#$ #..#\n##  $..#\n#  $ ..#\n#  $####\n#   #???\n#####???", "???####???\n?###  #???\n?#    ##??\n##$#   #??\n#  #$# ###\n# $ .*.  #\n# @###.# #\n## #...$ #\n?#  $#$###\n?##    #??\n??######??", "?#####????\n?#   #????\n?#  $#####\n?#   #   #\n?#*#$# # #\n##.. $   #\n# ..##$###\n#@#.#  #??\n#   $  #??\n#####  #??\n????####??", "?####?????\n?#  #?????\n?#$ ###???\n?#   @#???\n## #. ####\n#  #*.$  #\n# $$..#  #\n## ##.   #\n?# $  ####\n?#  ###???\n?#  #?????\n?####?????", "?#####?\n?#   #?\n?# $ #?\n?#   ##\n?# #$ #\n## .* #\n# ..# #\n# #.. #\n# $ $##\n###$ #?\n??# @#?\n??####?", "#####?????\n#   #?????\n# $ #?????\n# $ ######\n# $ #  . #\n##$    . #\n# $ #....#\n# @ ######\n# $ #?????\n#   #?????\n#####?????", "?????####\n######  #\n#     ..#\n# $$ #..#\n# $  #..#\n##$$@#..#\n# $  #..#\n# $$  # #\n#   $$  #\n####   ##\n???#####?", "?????####\n?????#  #\n????##  #\n#####.$ #\n#  $.$. #\n#@$.$.$.#\n#  $.$. #\n#####.$ #\n????#   #\n????##  #\n?????####", "#####?????\n#   #?????\n#@$$#####?\n##  # $.##\n##    .$ #\n#   #.$. #\n#  #.$.$ #\n###.$.$. #\n??###   ##\n????#####", "???####?\n####  #?\n# . . ##\n# #$$  #\n# @$.# #\n### *  #\n??#  ###\n??####??", "?########??\n?#      ##?\n?# $ $ $ #?\n## *   * ##\n# **#$#** #\n#...   ...#\n# *#$#$#* #\n#    @    #\n###########"];
let customLevels = [];
function getAllLevels() {
  const customLevelStrings = customLevels.map(level => 
    typeof level === 'string' ? level : level.levelData
  );
  return [...levels, ...customLevelStrings];
}

let levelIndex = 0;
let state = null;
let moveHistory = [];
let positionHistory = [];
let steps = 0;
let playbackTimer = null;
let isPlaybackActive = false;
let lbLevelIndex = 0;
let controlMode = 'buttons';
let swipeStart = null;
let isLevelTransitioning = false;
let pendingCustomLevelUpload = null;

const boardEl = document.getElementById('gameBoard');
const stepsEl = document.getElementById('gameSteps');
const levelNumEl = document.getElementById('levelNum');
const winOverlay = document.getElementById('winOverlay');
const winStepsEl = document.getElementById('winSteps');
const btnPrevLevel = document.getElementById('btnPrevLevel');
const btnNextLevel = document.getElementById('btnNextLevel');
const btnUndo = document.getElementById('btnUndo');
const btnReset = document.getElementById('btnReset');
const btnSubmit = document.getElementById('btnSubmitScore');
const btnNextLevelAfterWin = document.getElementById('btnNextLevelAfterWin');
const btnLeft = document.getElementById('btnLeft');
const btnUp = document.getElementById('btnUp');
const btnDown = document.getElementById('btnDown');
const btnRight = document.getElementById('btnRight');
const connIcon = document.getElementById('connectionIcon');
const leaderboardBody = document.getElementById('leaderboardBody');
const lbLevelNum = document.getElementById('lbLevelNum');
const lbPrevLevel = document.getElementById('lbPrevLevel');
const lbNextLevel = document.getElementById('lbNextLevel');
const lbRefresh = document.getElementById('lbRefresh');
const gameAreaEl = document.querySelector('.game-area');
const controlsEl = document.querySelector('.controls');
const swipeHintEl = document.getElementById('swipeHint');

function setViewportHeight() {
  const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  document.documentElement.style.setProperty('--app-height', `${Math.round(viewportHeight)}px`);
}

function hasTouchCapability() {
  return ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
}

function isTouchLandscape() {
  return hasTouchCapability() && window.matchMedia('(orientation: landscape)').matches;
}

function scheduleBoardLayout() {
  setViewportHeight();
  window.requestAnimationFrame(updateBoardLayout);
}

function updateBoardLayout() {
  if (!boardEl || !gameAreaEl || !state) return;

  const areaWidth = gameAreaEl.clientWidth;
  const areaHeight = gameAreaEl.clientHeight;
  const controlsWidth = controlsEl ? controlsEl.offsetWidth : 0;
  const controlsHeight = controlsEl ? controlsEl.offsetHeight : 0;
  const boardPadding = 8;
  const layoutGap = 12;
  let maxBoardWidth = areaWidth - boardPadding;
  let maxBoardHeight = areaHeight - boardPadding;

  if (isTouchLandscape()) {
    maxBoardWidth -= controlsWidth + layoutGap;
  } else {
    maxBoardHeight -= controlsHeight + layoutGap;
  }

  maxBoardWidth = Math.max(maxBoardWidth, 120);
  maxBoardHeight = Math.max(maxBoardHeight, 120);

  const cellSize = Math.max(
    16,
    Math.floor(
      Math.min(
        (maxBoardWidth - boardPadding) / state.C,
        (maxBoardHeight - boardPadding) / state.R,
        48
      )
    )
  );

  boardEl.style.setProperty('--cell-size', `${cellSize}px`);
}

function getPreferredControlMode() {
  const saved = localStorage.getItem(STORAGE_CONTROL_MODE);
  if (saved === 'auto' || saved === 'swipe' || saved === 'buttons') return saved;
  return 'auto';
}

function getResolvedControlMode(mode) {
  if (mode === 'swipe' || mode === 'buttons') return mode;
  return hasTouchCapability() ? 'swipe' : 'buttons';
}

function applyControlMode(mode) {
  const resolved = getResolvedControlMode(mode);
  controlMode = resolved;
  document.body.dataset.controlMode = resolved;
  // hide hint to give full screen feeling
  if (swipeHintEl) swipeHintEl.hidden = true; 
  document.querySelectorAll('.mode-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.controlMode === mode);
  });
  scheduleBoardLayout();
}

function bindControlModeButtons() {
  document.querySelectorAll('.mode-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.controlMode || 'auto';
      localStorage.setItem(STORAGE_CONTROL_MODE, mode);
      applyControlMode(mode);
    });
  });
}

function handleSwipeMove(dx, dy) {
  if (!canAcceptPlayerInput()) return;
  if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
  if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? 'r' : 'l');
  else doMove(dy > 0 ? 'd' : 'u');
}

function bindSwipeControls() {
  const panelGame = document.getElementById('panelGame');
  if (!panelGame) return;

  panelGame.addEventListener('touchstart', (e) => {
    if (controlMode !== 'swipe' || !canAcceptPlayerInput()) return;
    // Don't intercept touches on buttons
    if (e.target.closest('button')) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    swipeStart = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });

  panelGame.addEventListener('touchmove', (e) => {
    if (controlMode !== 'swipe') return;
    const panel = document.querySelector('.tab-panel.active');
    if (!panel || panel.id !== 'panelGame') return;
    if (e.target.closest('button')) return;
    e.preventDefault();
  }, { passive: false });

  panelGame.addEventListener('touchend', (e) => {
    if (controlMode !== 'swipe' || !swipeStart || !canAcceptPlayerInput()) return;
    if (e.target.closest('button')) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - swipeStart.x;
    const dy = touch.clientY - swipeStart.y;
    swipeStart = null;
    handleSwipeMove(dx, dy);
  }, { passive: true });

  ['gesturestart', 'gesturechange', 'gestureend'].forEach((eventName) => {
    document.addEventListener(eventName, (e) => {
      const panel = document.querySelector('.tab-panel.active');
      if (!panel || panel.id !== 'panelGame') return;
      e.preventDefault();
    }, { passive: false });
  });
}

function renderBoard() {
  if (!boardEl || !state) return;
  const { grid, R, C, player, boxes, targets } = state;
  const boxSet = new Set(boxes.map((b) => `${b.row},${b.col}`));
  const targetSet = new Set((targets || []).map((t) => `${t.row},${t.col}`));
  const playerAt = player ? `${player.row},${player.col}` : '';
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = `repeat(${C}, 1fr)`;
  boardEl.style.gridTemplateRows = `repeat(${R}, 1fr)`;
  for (let row = 0; row < R; row++) {
    for (let col = 0; col < C; col++) {
      const baseCell = grid[row]?.[col] ?? '?';
      const isWall = baseCell === '#';
      const isVoid = baseCell === '?';
      const isTarget = targetSet.has(`${row},${col}`);
      const isBox = boxSet.has(`${row},${col}`);
      const isPlayer = playerAt === `${row},${col}`;

      const div = document.createElement('div');
      div.className = 'cell';
      div.dataset.row = row;
      div.dataset.col = col;

      if (isVoid) div.classList.add('void');
      else if (isWall) div.classList.add('wall');
      else {
        div.classList.add('empty');
        if (isTarget) div.classList.add('target');
      }
      if (isBox) div.classList.add('box');
      if (isPlayer) div.classList.add('player');

      boardEl.appendChild(div);
    }
  }
  if (stepsEl) stepsEl.textContent = steps;
  if (levelNumEl) levelNumEl.textContent = levelIndex + 1;
  const badgeEl = document.getElementById('levelBadge');
  if (badgeEl) {
    // en_US: Only levels beyond built-in 56 levels (index >= 56) are custom
    // zh_TW: 只有超過內建 56 關（index >= 56）的才是玩家自訂關卡
    const isCustom = levelIndex >= levels.length;
    badgeEl.hidden = !isCustom;
    
    if (isCustom && customLevels.length > 0) {
      const customIndex = levelIndex - levels.length;
      const customLevel = customLevels[customIndex];
      
      if (customLevel && customLevel.creatorName) {
        const timestamp = new Date(customLevel.createdAt);
        const dateStr = timestamp.toLocaleString('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        badgeEl.textContent = `by ${customLevel.creatorName} ${dateStr}`;
      } else {
        badgeEl.textContent = '玩家自訂';
      }
    }
  }
  updateGameplayControlState();
  scheduleBoardLayout();
}

function loadLevel(idx) {
  stopPlayback();
  const all = getAllLevels();
  if (idx < 0 || idx >= all.length) return;
  levelIndex = idx;
  const levelString = all[levelIndex];
  const parsed = parseLevel(levelString);
  state = { ...parsed, boxes: parsed.boxes.slice() };
  moveHistory = [];
  positionHistory = [];
  steps = 0;
  isLevelTransitioning = false;
  renderBoard();
  if (winOverlay) {
    winOverlay.classList.remove('visible');
    winOverlay.setAttribute('hidden', '');
    winOverlay.setAttribute('aria-hidden', 'true');
  }
  if (boardEl) boardEl.classList.remove('win-glow');
  const area = document.querySelector('.game-area');
  if (area) area.classList.remove('fade-out');
  updateGameplayControlState();
}

function syncLbLevel() {
  lbLevelIndex = levelIndex < levels.length ? levelIndex : 0;
  if (lbLevelNum) lbLevelNum.textContent = lbLevelIndex + 1;
  if (lbPrevLevel) lbPrevLevel.disabled = lbLevelIndex <= 0;
  if (lbNextLevel) lbNextLevel.disabled = lbLevelIndex >= levels.length - 1;
}

function doMove(key, recordMove = true) {
  if (!state) return;
  const next = tryMove(state, key, recordMove);
  if (!next) return;
  if (recordMove) {
    positionHistory.push({ player: { ...state.player }, boxes: state.boxes.map((b) => ({ ...b })) });
    moveHistory.push(key);
    steps++;
  }
  state = next;
  renderBoard();
  if (recordMove && !isLevelTransitioning && checkWin(state.boxes, state.targets)) {
    isLevelTransitioning = true;
    
    // en_US: Check if this is a custom level being tested for upload
    // zh_TW: 檢查這是否為正在測試上傳的自訂關卡
    if (pendingCustomLevelUpload) {
      handleCustomLevelCompletion();
    } else {
      submitScore(); // Auto submit score
      boardEl.classList.add('win-glow');
      setTimeout(() => {
        const area = document.querySelector('.game-area');
        if (area) area.classList.add('fade-out');
        setTimeout(() => {
          loadLevel(levelIndex + 1);
          if (area) area.classList.remove('fade-out');
          boardEl.classList.remove('win-glow');
        }, 500);
      }, 1500);
    }
  }
}

function undo() {
  if (isPlaybackActive) return;
  if (positionHistory.length === 0) return;
  const prev = positionHistory.pop();
  state = { ...state, player: prev.player, boxes: prev.boxes };
  moveHistory.pop();
  steps--;
  renderBoard();
  if (winOverlay) winOverlay.classList.remove('visible');
  if (boardEl) boardEl.classList.remove('win-glow');
}

function getMovesString() {
  return moveHistory.join('');
}

function stopPlayback() {
  if (playbackTimer) {
    clearInterval(playbackTimer);
    playbackTimer = null;
  }
  isPlaybackActive = false;
  updateGameplayControlState();
}

function startPlayback(movesStr) {
  stopPlayback();
  if (!movesStr || !state) return;
  const keys = movesStr.trim().toLowerCase().split('');
  if (!keys.length) return;
  isPlaybackActive = true;
  updateGameplayControlState();
  let i = 0;
  steps = 0;
  if (stepsEl) stepsEl.textContent = steps;
  playbackTimer = setInterval(() => {
    if (i >= keys.length) {
      stopPlayback();
      return;
    }
    doMove(keys[i], false);
    steps++;
    if (stepsEl) stepsEl.textContent = steps;
    i++;
  }, 300);
}

function updateGameplayControlState() {
  const all = getAllLevels();
  const disableGameplay = !state || isPlaybackActive;
  const directionalButtons = [btnLeft, btnUp, btnDown, btnRight];

  directionalButtons.forEach((btn) => {
    if (btn) btn.disabled = disableGameplay;
  });

  if (btnUndo) btnUndo.disabled = disableGameplay || positionHistory.length === 0;
  if (btnReset) btnReset.disabled = disableGameplay;
  if (btnSubmit) btnSubmit.disabled = disableGameplay || moveHistory.length === 0;
  if (btnPrevLevel) btnPrevLevel.disabled = disableGameplay || levelIndex <= 0;
  if (btnNextLevel) btnNextLevel.disabled = disableGameplay || levelIndex >= all.length - 1;
  if (btnNextLevelAfterWin) btnNextLevelAfterWin.disabled = disableGameplay || levelIndex >= all.length - 1;
}

function canAcceptPlayerInput() {
  if (isPlaybackActive) return false;
  const panel = document.querySelector('.tab-panel.active');
  if (!panel || panel.id !== 'panelGame') return false;
  if (winOverlay && winOverlay.classList.contains('visible')) return false;
  return true;
}

async function fetchLevels() {
  const base = getBaseUrl();
  try {
    const res = await fetch(`${base}/api/levels`);
    const data = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(data.levels)) {
      levels = data.levels;
      return true;
    }
  } catch (_) {}
  return false;
}

async function loadCustomLevelsFromServer() {
  try {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/custom-levels`);
    const data = await res.json().catch(() => ({ customLevels: [] }));
    
    if (res.ok && Array.isArray(data.customLevels)) {
      customLevels = data.customLevels.map(level => ({
        levelData: level.levelData,
        levelId: level.levelId,
        creatorName: level.creatorName,
        createdAt: level.createdAt,
        solutionSteps: level.solutionSteps
      }));
      return true;
    }
  } catch {
    // Fallback to localStorage if server fails
  }
  
  // Fallback: load from localStorage
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM);
    const localLevels = raw ? JSON.parse(raw) : [];
    customLevels = localLevels.map(levelStr => ({
      levelData: levelStr,
      levelId: null,
      creatorName: null,
      createdAt: null
    }));
  } catch {
    customLevels = [];
  }
  
  return false;
}

function loadCustomLevels() {
  loadCustomLevelsFromServer();
}

// en_US: Find game level index for a given levelId (built-in 0..55 or custom 57+)
// zh_TW: 依 levelId 取得遊戲關卡索引（內建 0..55 或自訂 57+）
function findLevelIndexByLevelId(levelId) {
  const id = parseInt(levelId, 10);
  if (isNaN(id) || id < 0) return null;
  if (id < levels.length) return id;
  const i = customLevels.findIndex((l) => l.levelId === id);
  if (i >= 0) return levels.length + i;
  return null;
}

// en_US: Ensure level by ID is in list (fetch from API if custom and not in customLevels)
// zh_TW: 確保關卡在列表中（若為自訂且不在列表中則向 API 取得）
async function ensureLevelById(levelId) {
  const idx = findLevelIndexByLevelId(levelId);
  if (idx !== null) return idx;
  const base = getBaseUrl();
  try {
    const res = await fetch(`${base}/api/levels/${levelId}`);
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!data || !data.levelData) return null;
    if (data.isCustom) {
      customLevels.push({
        levelData: data.levelData,
        levelId: data.levelId,
        creatorName: data.creatorName || null,
        createdAt: data.createdAt || null,
        solutionSteps: data.solutionSteps,
      });
      return levels.length + customLevels.length - 1;
    }
    return data.levelId;
  } catch {
    return null;
  }
}

function setConnectionStatus(ok) {
  if (connIcon) {
    connIcon.classList.toggle('connected', ok);
    connIcon.setAttribute('aria-label', ok ? 'Connected' : 'Disconnected');
  }
}

async function handleCustomLevelCompletion() {
  // en_US: Player completed their custom level, prompt to upload
  // zh_TW: 玩家完成了自訂關卡，提示上傳
  
  boardEl.classList.add('win-glow');
  
  setTimeout(async () => {
    const playerName = (document.getElementById('playerName') && document.getElementById('playerName').value.trim()) || 'Player';
    const moves = getMovesString();
    
    const defaultNames = ['Player', 'player', '匿名', '玩家', 'Anonymous'];
    if (defaultNames.includes(playerName)) {
      await showError('玩家名稱未設定', '請先在設定中設定您的玩家名稱（不可使用預設名稱 Player）\nPlease set your player name in settings.');
      showTab('settings');
      pendingCustomLevelUpload = null;
      customLevels = [];
      isLevelTransitioning = false;
      boardEl.classList.remove('win-glow');
      return;
    }
    
    const confirmed = await showConfirm('恭喜通關！', `是否要將此關卡上傳到伺服器？\n上傳者：${playerName}\n步數：${steps}\n\nUpload this level?\nCreator: ${playerName}\nSteps: ${steps}`, 'success');
    
    if (confirmed) {
      await uploadCustomLevel(pendingCustomLevelUpload.levelData, playerName, moves);
    }
    
    pendingCustomLevelUpload = null;
    customLevels = [];
    
    const area = document.querySelector('.game-area');
    if (area) area.classList.add('fade-out');
    setTimeout(() => {
      loadLevel(0);
      if (area) area.classList.remove('fade-out');
      boardEl.classList.remove('win-glow');
      isLevelTransitioning = false;
    }, 500);
  }, 1500);
}

async function uploadCustomLevel(levelData, creatorName, solutionMoves) {
  const base = getBaseUrl();
  setConnectionStatus(false);
  
  try {
    const res = await fetch(`${base}/api/custom-levels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        levelData,
        creatorName,
        solutionMoves
      })
    });
    
    const data = await res.json().catch(() => ({}));
    
    if (res.ok && data.success) {
      setBaseUrl(base);
      setConnectionStatus(true);
      await showSuccess('上傳成功！', `關卡 ID: ${data.levelId}\n網址: ${data.levelUrl}\n\nLevel ID: ${data.levelId}\nURL: ${data.levelUrl}`);
      await loadCustomLevelsFromServer();
    } else {
      setConnectionStatus(false);
      const errorMsg = data.message || data.error || 'Unknown error';
      await showError('上傳失敗', `${errorMsg}\nUpload failed: ${errorMsg}`);
    }
  } catch (err) {
    setConnectionStatus(false);
    await showError('上傳失敗', '網路錯誤\nUpload failed: Network error');
  }
}

async function submitScore() {
  const base = getBaseUrl();
  const name = (document.getElementById('playerName') && document.getElementById('playerName').value.trim()) || 'Player';
  const moves = getMovesString();
  if (!moves) return;
  const submitLevelId = levelIndex < levels.length ? String(levelIndex) : '0';
  setConnectionStatus(false);
  try {
    const res = await fetch(`${base}/api/leaderboard/${submitLevelId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: name, steps, moves }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      setBaseUrl(base);
      setConnectionStatus(true);
      refreshLeaderboard();
    } else {
      setConnectionStatus(false);
    }
  } catch (_) {
    setConnectionStatus(false);
  }
}

async function refreshLeaderboard() {
  if (!leaderboardBody) return;
  const levelId = String(lbLevelIndex);
  leaderboardBody.innerHTML = '';
  try {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/leaderboard/${levelId}`);
    const data = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(data.records)) {
      data.records.forEach((r) => {
        const tr = document.createElement('tr');
        const playBtn = document.createElement('button');
        playBtn.type = 'button';
        playBtn.className = 'icon-btn small';
        playBtn.innerHTML = '▶';
        playBtn.setAttribute('aria-label', 'Play');
        playBtn.disabled = !(r.moves && r.moves.length > 0);
        playBtn.addEventListener('click', () => {
          showTab('game');
          loadLevel(lbLevelIndex);
          setTimeout(() => startPlayback(r.moves || ''), 100);
        });
        
        let timeStr = '';
        if (r.timestamp) {
          const d = new Date(r.timestamp);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          const hh = String(d.getHours()).padStart(2, '0');
          const min = String(d.getMinutes()).padStart(2, '0');
          const ss = String(d.getSeconds()).padStart(2, '0');
          timeStr = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
        }
        
        tr.innerHTML = `<td>${r.rank}</td><td>${r.playerName || 'Player'}</td><td>${timeStr}</td><td>${r.steps}</td><td></td>`;
        tr.querySelector('td:nth-child(5)').appendChild(playBtn);
        leaderboardBody.appendChild(tr);
      });
    }
  } catch (_) {}
}

// ---- Tabs ----
function showTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.tab === tabId);
    b.setAttribute('aria-selected', b.dataset.tab === tabId ? 'true' : 'false');
  });
  document.querySelectorAll('.tab-panel').forEach((p) => {
    const show = p.id === 'panel' + tabId.charAt(0).toUpperCase() + tabId.slice(1);
    p.classList.toggle('active', show);
    p.hidden = !show;
  });
  if (tabId === 'leaderboard') {
    syncLbLevel();
    refreshLeaderboard();
  }
  if (tabId === 'game') scheduleBoardLayout();
}

// ---- Editor ----
let editorW = 10;
let editorH = 10;
let editorTool = '#';
let editorGrid = [];

function editorGridToState() {
  const rows = [];
  for (let r = 0; r < editorH; r++) {
    rows[r] = [];
    for (let c = 0; c < editorW; c++) {
      rows[r][c] = editorGrid[r]?.[c] ?? ' ';
    }
  }
  return rows.map((row) => row.join('')).join('\n');
}

function editorStateToGrid(str) {
  const rows = str.trim().split('\n').map((r) => r.split(''));
  editorGrid = rows;
  editorH = rows.length;
  editorW = rows[0]?.length || 10;
}

function editorRender() {
  const el = document.getElementById('editorBoard');
  if (!el) return;
  el.innerHTML = '';
  el.style.gridTemplateColumns = `repeat(${editorW}, 1fr)`;
  el.style.gridTemplateRows = `repeat(${editorH}, 1fr)`;
  for (let r = 0; r < editorH; r++) {
    for (let c = 0; c < editorW; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell editor-cell';
      cell.dataset.r = r;
          cell.dataset.c = c;
      const ch = editorGrid[r]?.[c] ?? ' ';
      if (ch === '?') cell.classList.add('void');
      else if (ch === '#') cell.classList.add('wall');
      else {
        cell.classList.add('empty');
        if (ch === '.' || ch === '*') cell.classList.add('target');
      }
      if (ch === '$' || ch === '*') cell.classList.add('box');
      if (ch === '@') cell.classList.add('player');

      cell.addEventListener('click', () => {
        editorGrid[r] = editorGrid[r] || [];
        editorGrid[r][c] = editorTool;
        editorRender();
        editorUpdateStats();
      });
      el.appendChild(cell);
    }
  }
}

function editorUpdateStats() {
  let box = 0, target = 0, player = 0;
  for (let r = 0; r < editorH; r++) {
    for (let c = 0; c < editorW; c++) {
      const ch = editorGrid[r]?.[c] ?? ' ';
      if (ch === '$' || ch === '*') box++;
      if (ch === '.' || ch === '*') target++;
      if (ch === '@') player++;
    }
  }
  const el = document.getElementById('editorStats');
  if (el) el.textContent = `▤${box} ◎${target} ●${player}`;
}

function editorResize() {
  editorW = Math.max(5, Math.min(20, editorW));
  editorH = Math.max(5, Math.min(20, editorH));
  const newGrid = [];
  for (let r = 0; r < editorH; r++) {
    newGrid[r] = [];
    for (let c = 0; c < editorW; c++) {
      newGrid[r][c] = editorGrid[r]?.[c] ?? ' ';
    }
  }
  editorGrid = newGrid;
  document.getElementById('editorWidth').textContent = editorW;
  document.getElementById('editorHeight').textContent = editorH;
  editorRender();
  editorUpdateStats();
}

async function editorSave() {
  const str = editorGridToState();
  // en_US: Validate directly from editorGrid to avoid trim() issues
  // zh_TW: 直接從 editorGrid 驗證，避免 trim() 導致的問題
  let boxCount = 0, targetCount = 0, playerCount = 0;
  for (let r = 0; r < editorH; r++) {
    for (let c = 0; c < editorW; c++) {
      const ch = editorGrid[r]?.[c] ?? ' ';
      if (ch === '$' || ch === '*') boxCount++;
      if (ch === '.' || ch === '*') targetCount++;
      if (ch === '@') playerCount++;
    }
  }

  if (playerCount !== 1) {
    await showError('關卡無效', '必須有且僅有一個玩家\nMust have exactly one player');
    return;
  }
  if (boxCount === 0) {
    await showError('關卡無效', '至少需要一個箱子\nNeed at least one box');
    return;
  }
  if (boxCount !== targetCount) {
    await showError('關卡無效', `箱子數量（${boxCount}）必須等於目標數量（${targetCount}）\nBox count (${boxCount}) must equal target count (${targetCount})`);
    return;
  }

  // en_US: Store level for upload after completion
  // zh_TW: 儲存關卡以便通關後上傳
  pendingCustomLevelUpload = {
    levelData: str,
    timestamp: Date.now()
  };

  // en_US: Load level for testing
  // zh_TW: 載入關卡進行測試
  customLevels = [str];
  levelIndex = levels.length;
  loadLevel(levelIndex);
  showTab('game');

  await showAlert('開始測試通關', '請先通關此關卡，通關後即可上傳！\nPlease complete this level first, then you can upload it!');
}

function initEditor() {
  for (let r = 0; r < editorH; r++) {
    editorGrid[r] = [];
    for (let c = 0; c < editorW; c++) editorGrid[r][c] = ' ';
  }
  document.querySelectorAll('.tool-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tool-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      editorTool = btn.dataset.tool;
    });
  });
  document.getElementById('btnWidthPlus').addEventListener('click', () => { editorW++; editorResize(); });
  document.getElementById('btnWidthMinus').addEventListener('click', () => { editorW--; editorResize(); });
  document.getElementById('btnHeightPlus').addEventListener('click', () => { editorH++; editorResize(); });
  document.getElementById('btnHeightMinus').addEventListener('click', () => { editorH--; editorResize(); });
  document.getElementById('btnEditorReset').addEventListener('click', () => {
    editorW = 10;
    editorH = 10;
    editorGrid = [];
    editorResize();
  });
  document.getElementById('btnEditorSave').addEventListener('click', editorSave);
  editorResize();
}

function initGame() {
  [btnLeft, btnUp, btnDown, btnRight].forEach((btn, i) => {
    if (!btn) return;
    const key = ['l', 'u', 'd', 'r'][i];
    btn.addEventListener('click', () => {
      if (!canAcceptPlayerInput()) return;
      doMove(key);
    });
  });
  if (btnUndo) btnUndo.addEventListener('click', () => {
    if (!canAcceptPlayerInput()) return;
    undo();
  });
  if (btnPrevLevel) btnPrevLevel.addEventListener('click', () => {
    if (!canAcceptPlayerInput()) return;
    loadLevel(levelIndex - 1);
  });
  if (btnNextLevel) btnNextLevel.addEventListener('click', () => {
    if (!canAcceptPlayerInput()) return;
    loadLevel(levelIndex + 1);
  });
  if (btnReset) btnReset.addEventListener('click', () => {
    if (!canAcceptPlayerInput()) return;
    loadLevel(levelIndex);
  });
  if (btnSubmit) btnSubmit.addEventListener('click', () => {
    if (!canAcceptPlayerInput()) return;
    submitScore();
  });
  if (btnNextLevelAfterWin) btnNextLevelAfterWin.addEventListener('click', () => {
    if (!canAcceptPlayerInput()) return;
    loadLevel(levelIndex + 1);
  });

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => showTab(btn.dataset.tab));
  });

  if (lbPrevLevel) lbPrevLevel.addEventListener('click', () => { if (lbLevelIndex > 0) { lbLevelIndex--; lbLevelNum.textContent = lbLevelIndex + 1; lbPrevLevel.disabled = lbLevelIndex <= 0; lbNextLevel.disabled = false; refreshLeaderboard(); } });
  if (lbNextLevel) lbNextLevel.addEventListener('click', () => { if (lbLevelIndex < levels.length - 1) { lbLevelIndex++; lbLevelNum.textContent = lbLevelIndex + 1; lbNextLevel.disabled = lbLevelIndex >= levels.length - 1; lbPrevLevel.disabled = false; refreshLeaderboard(); } });
  if (lbRefresh) lbRefresh.addEventListener('click', refreshLeaderboard);
  bindControlModeButtons();
  bindSwipeControls();
  setViewportHeight();
  window.addEventListener('resize', scheduleBoardLayout);
  window.addEventListener('orientationchange', scheduleBoardLayout);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', scheduleBoardLayout);
  }

  const savedUrl = localStorage.getItem(STORAGE_URL) || window.location.origin;
  setBaseUrl(savedUrl);
  const urlEl = document.getElementById('serverUrl');
  if (urlEl) urlEl.addEventListener('change', () => setBaseUrl(urlEl.value.trim()));
  const savedName = localStorage.getItem(STORAGE_NAME) || '';
  const nameEl = document.getElementById('playerName');
  if (nameEl) {
    nameEl.value = savedName;
    nameEl.addEventListener('change', () => localStorage.setItem(STORAGE_NAME, nameEl.value.trim()));
  }
  applyControlMode(getPreferredControlMode());

  document.addEventListener('keydown', (e) => {
    if (!canAcceptPlayerInput()) return;
    const map = { ArrowLeft: 'l', ArrowRight: 'r', ArrowUp: 'u', ArrowDown: 'd', KeyA: 'l', KeyD: 'r', KeyW: 'u', KeyS: 'd' };
    const key = map[e.code];
    if (key) {
      e.preventDefault();
      doMove(key);
    } else if (e.code === 'Backspace' || e.code === 'KeyZ') {
      e.preventDefault();
      undo();
    }
  });

  loadCustomLevels();
  initEditor();
  scheduleBoardLayout();

  // en_US: Load levels from server, then open level from URL if /singleplayer/:levelId
  // zh_TW: 從伺服器載入關卡後，若網址為 /singleplayer/:levelId 則開啟該關
  (async () => {
    const okLevels = await fetchLevels();
    await loadCustomLevelsFromServer();
    setConnectionStatus(okLevels);
    const all = getAllLevels();
    if (all.length === 0) return;
    let idx = 0;
    const m = window.location.pathname.match(/^\/singleplayer\/(\d+)\/?$/);
    if (m) {
      const urlLevelId = parseInt(m[1], 10);
      let found = findLevelIndexByLevelId(urlLevelId);
      if (found === null) found = await ensureLevelById(urlLevelId);
      if (found !== null) idx = found;
      else await showError('關卡不存在', 'Level not found / 此關卡不存在');
    }
    loadLevel(idx);
  })();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
