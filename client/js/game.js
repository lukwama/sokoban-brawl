/**
 * Sokoban Brawl - Multi-tab UI (Game, Editor, Leaderboard, Settings)
 * Icon-only; leaderboard & moves from server API; replay from server moves.
 */
const DIR = { u: { r: -1, c: 0 }, d: { r: 1, c: 0 }, l: { r: 0, c: -1 }, r: { r: 0, c: 1 } };
const STORAGE_URL = 'sokoban_brawl_server_url';
const STORAGE_NAME = 'sokoban_brawl_player_name';
const STORAGE_CUSTOM = 'sokobanCustomLevels';
const STORAGE_CONTROL_MODE = 'sokoban_brawl_control_mode';

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
  const C = rows[0]?.length || 0;
  let player = null;
  const boxes = [];
  const targets = [];
  for (let row = 0; row < R; row++) {
    for (let col = 0; col < C; col++) {
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
  return [...levels, ...customLevels];
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
const btnLeft = document.getElementById('btnLeft');
const btnUp = document.getElementById('btnUp');
const btnDown = document.getElementById('btnDown');
const btnRight = document.getElementById('btnRight');
const btnNextLevelAfterWin = document.getElementById('btnNextLevelAfterWin');
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
  if (swipeHintEl) swipeHintEl.hidden = resolved !== 'swipe';
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

function isPlayerInputLocked() {
  return isPlaybackActive;
}

function updateGameControlAvailability() {
  const allLevels = getAllLevels();
  const maxLevelIndex = allLevels.length - 1;
  const locked = isPlayerInputLocked();

  [btnLeft, btnUp, btnDown, btnRight, btnUndo, btnReset, btnSubmit].forEach((btn) => {
    if (btn) btn.disabled = locked;
  });
  if (btnPrevLevel) btnPrevLevel.disabled = locked || levelIndex <= 0;
  if (btnNextLevel) btnNextLevel.disabled = locked || levelIndex >= maxLevelIndex;
}

function handleSwipeMove(dx, dy) {
  if (isPlayerInputLocked()) return;
  if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
  if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? 'r' : 'l');
  else doMove(dy > 0 ? 'd' : 'u');
}

function bindSwipeControls() {
  if (!gameAreaEl) return;
  gameAreaEl.addEventListener('touchstart', (e) => {
    if (controlMode !== 'swipe' || isPlayerInputLocked()) return;
    const panel = document.querySelector('.tab-panel.active');
    if (!panel || panel.id !== 'panelGame') return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    swipeStart = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });

  gameAreaEl.addEventListener('touchmove', (e) => {
    const panel = document.querySelector('.tab-panel.active');
    if (!panel || panel.id !== 'panelGame') return;
    e.preventDefault();
  }, { passive: false });

  gameAreaEl.addEventListener('touchend', (e) => {
    if (controlMode !== 'swipe' || !swipeStart) return;
    const panel = document.querySelector('.tab-panel.active');
    if (!panel || panel.id !== 'panelGame') return;
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
      const baseCell = grid[row][col];
      const isWall = baseCell === '#' || baseCell === '?';
      const isTarget = targetSet.has(`${row},${col}`);
      const isBox = boxSet.has(`${row},${col}`);
      const isPlayer = playerAt === `${row},${col}`;

      const div = document.createElement('div');
      div.className = 'cell';
      div.dataset.row = row;
      div.dataset.col = col;

      if (isWall) div.classList.add('wall');
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
    // 總共 59 個內建關卡 (0~58)，最後三個為 56, 57, 58
    // 或者 levelIndex 大於等於 59 也是玩家自己設計的關卡
    const isCustom = levelIndex >= levels.length - 3;
    badgeEl.hidden = !isCustom;
  }
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
  renderBoard();
  if (winOverlay) {
    winOverlay.classList.remove('visible');
    winOverlay.setAttribute('hidden', '');
    winOverlay.setAttribute('aria-hidden', 'true');
  }
  if (boardEl) boardEl.classList.remove('win-glow');
  const area = document.querySelector('.game-area');
  if (area) area.classList.remove('fade-out');
  updateGameControlAvailability();
}

function syncLbLevel() {
  lbLevelIndex = levelIndex < levels.length ? levelIndex : 0;
  if (lbLevelNum) lbLevelNum.textContent = lbLevelIndex + 1;
  if (lbPrevLevel) lbPrevLevel.disabled = lbLevelIndex <= 0;
  if (lbNextLevel) lbNextLevel.disabled = lbLevelIndex >= levels.length - 1;
}

function doMove(key, recordMove = true) {
  if (recordMove && isPlayerInputLocked()) return;
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
  if (recordMove && checkWin(state.boxes, state.targets)) {
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

function undo() {
  if (isPlayerInputLocked()) return;
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
  if (isPlaybackActive) {
    isPlaybackActive = false;
    updateGameControlAvailability();
  }
}

function startPlayback(movesStr) {
  stopPlayback();
  if (!movesStr || !state) return;
  const keys = movesStr
    .trim()
    .toLowerCase()
    .split('')
    .filter((k) => DIR[k]);
  if (keys.length === 0) return;
  isPlaybackActive = true;
  updateGameControlAvailability();
  let i = 0;
  playbackTimer = setInterval(() => {
    if (i >= keys.length) {
      stopPlayback();
      return;
    }
    doMove(keys[i], false);
    i++;
  }, 300);
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

function loadCustomLevels() {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM);
    customLevels = raw ? JSON.parse(raw) : [];
  } catch (_) {
    customLevels = [];
  }
}

function setConnectionStatus(ok) {
  if (connIcon) {
    connIcon.classList.toggle('connected', ok);
    connIcon.setAttribute('aria-label', ok ? 'Connected' : 'Disconnected');
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
        tr.innerHTML = `<td>${r.rank}</td><td>${r.playerName || 'Player'}</td><td>${r.steps}</td><td></td>`;
        tr.querySelector('td:nth-child(4)').appendChild(playBtn);
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
      if (ch === '#' || ch === '?') cell.classList.add('wall');
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

function editorSave() {
  const str = editorGridToState();
  const parsed = parseLevel(str);
  const boxCount = parsed.boxes.length;
  const targetCount = parsed.targets.length;
  const playerCount = parsed.player ? 1 : 0;
  if (boxCount !== targetCount || playerCount !== 1) return;
  customLevels.push(str);
  localStorage.setItem(STORAGE_CUSTOM, JSON.stringify(customLevels));
  levelIndex = getAllLevels().length - 1;
  loadLevel(levelIndex);
  showTab('game');
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
    btn.addEventListener('click', () => doMove(key));
  });
  if (btnUndo) btnUndo.addEventListener('click', () => undo());
  if (btnPrevLevel) btnPrevLevel.addEventListener('click', () => {
    if (isPlayerInputLocked()) return;
    loadLevel(levelIndex - 1);
  });
  if (btnNextLevel) btnNextLevel.addEventListener('click', () => {
    if (isPlayerInputLocked()) return;
    loadLevel(levelIndex + 1);
  });
  if (btnReset) btnReset.addEventListener('click', () => {
    if (isPlayerInputLocked()) return;
    loadLevel(levelIndex);
  });
  if (btnSubmit) btnSubmit.addEventListener('click', submitScore);
  if (btnNextLevelAfterWin) btnNextLevelAfterWin.addEventListener('click', () => loadLevel(levelIndex + 1));

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
    const panel = document.querySelector('.tab-panel.active');
    if (!panel || panel.id !== 'panelGame') return;
    if (winOverlay && winOverlay.classList.contains('visible')) return;
    const map = { ArrowLeft: 'l', ArrowRight: 'r', ArrowUp: 'u', ArrowDown: 'd', KeyA: 'l', KeyD: 'r', KeyW: 'u', KeyS: 'd' };
    const key = map[e.code];
    if (isPlayerInputLocked()) {
      if (key || e.code === 'Backspace' || e.code === 'KeyZ') e.preventDefault();
      return;
    }
    if (key) {
      e.preventDefault();
      doMove(key);
    } else if (e.code === 'Backspace' || e.code === 'KeyZ') {
      e.preventDefault();
      undo();
    }
  });

  loadCustomLevels();
  if (getAllLevels().length) loadLevel(0);
  updateGameControlAvailability();
  initEditor();
  scheduleBoardLayout();
  
  fetchLevels().then((ok) => {
    setConnectionStatus(ok);
    if (ok && levels.length && state === null) {
      loadLevel(0);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
