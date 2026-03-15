/**
 * Sokoban Brawl - Multi-tab UI (Game, Editor, Leaderboard, Settings)
 * Icon-only; leaderboard & moves from server API; replay from server moves.
 */
const DIR = { u: { r: -1, c: 0 }, d: { r: 1, c: 0 }, l: { r: 0, c: -1 }, r: { r: 0, c: 1 } };
const STORAGE_URL = 'sokoban_brawl_server_url';
const STORAGE_NAME = 'sokoban_brawl_player_name';
const STORAGE_CUSTOM = 'sokobanCustomLevels';
const STORAGE_CONTROL_MODE = 'sokoban_brawl_control_mode';
const STORAGE_LANG = 'sokoban_brawl_lang';

// en_US: i18n dictionary — all UI strings in English and Traditional Chinese
// zh_TW: 國際化字典 — 所有 UI 字串的英文與繁體中文版本
const I18N = {
  'control.auto':      { en: 'Auto',       zh: '自動' },
  'control.swipe':     { en: 'Swipe',      zh: '滑動' },
  'control.buttons':   { en: 'Buttons',    zh: '按鈕' },
  'lang.bilingual':    { en: 'Bilingual',  zh: '雙語' },
  'lang.en':           { en: 'English',    zh: '英語' },
  'lang.zh':           { en: 'Chinese',    zh: '繁體中文' },
  'tab.game':          { en: 'Single Player',  zh: '單人遊戲' },
  'tab.multi':         { en: 'Multiplayer',    zh: '多人遊戲' },
  'tab.editor':        { en: 'Level Editor',   zh: '關卡編輯器' },
  'tab.leaderboard':   { en: 'Leaderboard',    zh: '排行榜' },
  'tab.settings':      { en: 'Settings',       zh: '設定介面' },
  'lb.player':         { en: 'Player',   zh: '玩家' },
  'lb.time':           { en: 'Time',     zh: '時間' },
  'multi.title':       { en: 'Multiplayer',    zh: '多人遊戲' },
  'multi.coming':      { en: 'Coming Soon',    zh: '即將開放' },
  'badge.testing':     { en: 'Testing',   zh: '測試中' },
  'badge.custom':      { en: 'Custom',    zh: '玩家自訂' },
  'btn.ok':            { en: 'OK',        zh: '確定' },
  'btn.cancel':        { en: 'Cancel',    zh: '取消' },
  'jump.title':        { en: 'Jump to Level',  zh: '跳關' },
  'jump.go':           { en: 'Go',        zh: '前往' },
  'toast.linkCopied':  { en: 'Link copied to clipboard!', zh: '連結已複製到剪貼簿！' },
  'toast.linkFailed':  { en: 'Failed to copy link',       zh: '複製連結失敗' },
  'editor.invalid':    { en: 'Invalid Level',  zh: '關卡無效' },
  'editor.needPlayer': { en: 'Must have exactly one player',  zh: '必須有且僅有一個玩家' },
  'editor.needBox':    { en: 'Need at least one box',         zh: '至少需要一個箱子' },
  'editor.alreadySolved': { en: 'Level starts already solved. Keep at least one box off target.', zh: '關卡初始已是通關狀態，請至少保留一個箱子不在目標點上' },
  'editor.needRectangle': { en: 'Map must be rectangular with no missing cells', zh: '地圖必須為完整矩形且不可缺字' },
  'editor.unsavedTitle': { en: 'Unsaved Changes', zh: '尚未儲存' },
  'editor.unsavedBody':  { en: 'You have unsaved edits. Save and start validation, or discard and leave?', zh: '編輯器有未儲存變更。要先儲存並開始驗證，或放棄變更離開？' },
  'editor.saveAndTest':  { en: 'Save & Test', zh: '儲存並驗證' },
  'editor.discardLeave': { en: 'Discard', zh: '放棄離開' },
  'editor.startTest':  { en: 'Start Testing',  zh: '開始測試通關' },
  'editor.testBody':   { en: 'Please complete this level first, then you can upload it!', zh: '請先通關此關卡，通關後即可上傳！' },
  'upload.nameTitle':  { en: 'Player Name Not Set', zh: '玩家名稱未設定' },
  'upload.nameBody':   { en: 'Please set your player name in settings (cannot use default name Player).', zh: '請先在設定中設定您的玩家名稱（不可使用預設名稱 Player）' },
  'upload.congrats':   { en: 'Congratulations!', zh: '恭喜通關！' },
  'upload.confirm':    { en: 'Upload this level?', zh: '是否要將此關卡上傳到伺服器？' },
  'upload.creator':    { en: 'Creator', zh: '上傳者' },
  'upload.steps':      { en: 'Steps',   zh: '步數' },
  'name.dialogTitle':  { en: 'Set Player Name', zh: '設定玩家名稱' },
  'name.dialogBody':   { en: 'Please set your player name to continue.', zh: '請先設定玩家名稱再繼續。' },
  'name.placeholder':  { en: 'Enter your name', zh: '請輸入玩家名稱' },
  'name.save':         { en: 'Save', zh: '儲存' },
  'name.invalid':      { en: 'Please enter a valid name (cannot use default name Player).', zh: '請輸入有效玩家名稱（不可使用預設名稱 Player）' },
  'upload.success':    { en: 'Upload Successful!', zh: '上傳成功！' },
  'upload.failed':     { en: 'Upload Failed',      zh: '上傳失敗' },
  'upload.network':    { en: 'Network error',       zh: '網路錯誤' },
  'level.notFound':    { en: 'Level not found',     zh: '此關卡不存在' },
  'swipe.hint':        { en: 'Swipe to move', zh: '滑動操作' },
};

let currentLang = 'bilingual';

function t(key) {
  const entry = I18N[key];
  if (!entry) return key;
  if (currentLang === 'en') return entry.en;
  if (currentLang === 'zh') return entry.zh;
  return `${entry.en}\n${entry.zh}`;
}

function tSingle(key) {
  const entry = I18N[key];
  if (!entry) return key;
  if (currentLang === 'en') return entry.en;
  if (currentLang === 'zh') return entry.zh;
  return `${entry.en} / ${entry.zh}`;
}

function tHtml(key) {
  const entry = I18N[key];
  if (!entry) return key;
  if (currentLang === 'en') return entry.en;
  if (currentLang === 'zh') return entry.zh;
  return `<span class="i18n-line">${entry.en}</span><span class="i18n-line i18n-sub">${entry.zh}</span>`;
}

function applyLanguage() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    el.innerHTML = tHtml(key);
  });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = tSingle(el.dataset.i18nTitle);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const entry = I18N[el.dataset.i18nPlaceholder];
    if (entry) {
      if (currentLang === 'en') el.placeholder = entry.en;
      else if (currentLang === 'zh') el.placeholder = entry.zh;
      else el.placeholder = `${entry.en} / ${entry.zh}`;
    }
  });
  // Leaderboard table headers
  const lbHead = document.querySelector('.lb-table thead tr');
  if (lbHead) {
    const en = I18N['lb.player'], et = I18N['lb.time'];
    const playerTh = lbHead.children[1];
    const timeTh = lbHead.children[2];
    if (playerTh) playerTh.innerHTML = tHtml('lb.player');
    if (timeTh) timeTh.innerHTML = tHtml('lb.time');
  }
  // Multiplayer placeholder
  const multiTitle = document.querySelector('#panelMulti h3');
  const multiP = document.querySelector('#panelMulti p');
  if (multiTitle) multiTitle.innerHTML = tHtml('multi.title');
  if (multiP) multiP.innerHTML = tHtml('multi.coming');
  // Swipe hint
  if (swipeHintEl) swipeHintEl.textContent = tSingle('swipe.hint');
  // Language toggle active state
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });
  // Refresh badge text
  if (state) renderBoard();
}

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
  return showModal({ icon, title, body, buttons: [{ text: tSingle('btn.ok'), value: true, primary: true }] });
}

function showConfirm(title, body, icon = 'confirm') {
  return showModal({ icon, title, body, buttons: [{ text: tSingle('btn.cancel'), value: false }, { text: tSingle('btn.ok'), value: true, primary: true }] });
}

function showError(title, body) {
  return showAlert(title, body, 'error');
}

function showSuccess(title, body) {
  return showAlert(title, body, 'success');
}

const INVALID_PLAYER_NAMES = ['Player', 'player', '匿名', '玩家', 'Anonymous', ''];

function getPlayerNameInputEl() {
  return document.getElementById('playerName');
}

function getStoredOrInputPlayerName() {
  const inputName = (getPlayerNameInputEl() && getPlayerNameInputEl().value.trim()) || '';
  const storedName = (localStorage.getItem(STORAGE_NAME) || '').trim();
  return inputName || storedName || '';
}

function isValidPlayerName(name) {
  const n = String(name || '').trim();
  return !!n && !INVALID_PLAYER_NAMES.includes(n) && n.length <= 32;
}

function setPlayerName(name) {
  const n = String(name || '').trim();
  const input = getPlayerNameInputEl();
  if (input) input.value = n;
  localStorage.setItem(STORAGE_NAME, n);
}

function promptPlayerNameDialog(initialName = '') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card">
        <span class="modal-icon modal-icon-info">👤</span>
        <div class="modal-title">${tSingle('name.dialogTitle')}</div>
        <div class="modal-body">${tSingle('name.dialogBody')}</div>
        <div class="level-jump-body">
          <input type="text" id="nameInput" class="jump-input" maxlength="32" placeholder="${tSingle('name.placeholder')}" value="${String(initialName || '').replace(/"/g, '&quot;')}" />
        </div>
        <div class="modal-actions">
          <button class="modal-btn" data-action="cancel">${tSingle('btn.cancel')}</button>
          <button class="modal-btn modal-btn-primary" data-action="save">${tSingle('name.save')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));

    const input = overlay.querySelector('#nameInput');
    if (input) {
      input.focus();
      input.select();
    }

    const close = (value) => {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 200);
      resolve(value);
    };

    const trySave = () => {
      const value = (input && input.value ? input.value : '').trim();
      if (!isValidPlayerName(value)) {
        showToast(tSingle('name.invalid'));
        return;
      }
      close(value);
    };

    overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => close(null));
    overlay.querySelector('[data-action="save"]').addEventListener('click', trySave);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(null); });
    if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') trySave(); });
  });
}

async function ensurePlayerName() {
  const current = getStoredOrInputPlayerName();
  if (isValidPlayerName(current)) {
    setPlayerName(current);
    return current;
  }
  const entered = await promptPlayerNameDialog(current);
  if (!entered) return null;
  setPlayerName(entered);
  return entered;
}

// en_US: Level jump modal — click level number to jump to any level
// zh_TW: 跳關模態框 — 點擊關卡數字跳到任意關卡
function showLevelJumpModal() {
  const all = getAllLevels();
  const totalLevels = all.length;
  if (totalLevels === 0) return Promise.resolve(null);

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const current = levelIndex + 1;

    let html = `<div class="modal-card">`;
    html += `<span class="modal-icon modal-icon-info">⇥</span>`;
    html += `<div class="modal-title">${tSingle('jump.title')}</div>`;
    html += `<div class="level-jump-body">`;
    html += `<input type="number" id="jumpLevelInput" class="jump-input" min="1" max="${totalLevels}" value="${current}" />`;
    html += `<input type="range" id="jumpLevelSlider" class="jump-slider" min="1" max="${totalLevels}" value="${current}" step="1" />`;
    html += `<div class="jump-range-labels"><span>1</span><span>${totalLevels}</span></div>`;
    html += `</div>`;
    html += `<div class="modal-actions">`;
    html += `<button class="modal-btn" data-action="cancel">${tSingle('btn.cancel')}</button>`;
    html += `<button class="modal-btn modal-btn-primary" data-action="go">${tSingle('jump.go')}</button>`;
    html += `</div></div>`;

    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));

    const input = overlay.querySelector('#jumpLevelInput');
    const slider = overlay.querySelector('#jumpLevelSlider');

    input.addEventListener('input', () => { slider.value = input.value; });
    slider.addEventListener('input', () => { input.value = slider.value; });

    function close(value) {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 200);
      resolve(value);
    }

    function tryGo() {
      const val = parseInt(input.value, 10);
      if (val >= 1 && val <= totalLevels) close(val - 1);
    }

    overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => close(null));
    overlay.querySelector('[data-action="go"]').addEventListener('click', tryGo);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryGo(); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(null); });

    // en_US: Do NOT auto-focus the input — prevents mobile virtual keyboard from covering the slider
    // zh_TW: 不自動聚焦輸入框 — 避免手機虛擬鍵盤遮擋下方滑棒
  });
}

// en_US: Toast notification — lightweight, auto-dismiss notification at bottom of screen
// zh_TW: Toast 通知 — 輕量自動消失的底部通知
function showToast(message, duration = 3000) {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// en_US: Copy the current level's shareable URL to clipboard
// zh_TW: 將當前關卡的分享連結複製到剪貼簿
async function shareLevelLink() {
  const lid = getLevelId(levelIndex);
  if (lid === null) return;
  const url = `https://sokoban.lukwama.com/singleplayer/${lid}`;
  try {
    await navigator.clipboard.writeText(url);
    showToast(t('toast.linkCopied'));
  } catch {
    showToast(t('toast.linkFailed'));
  }
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
  const rows = levelString.replace(/^[\r\n]+|[\r\n]+$/g, '').split('\n').map((r) => r.split(''));
  const R = rows.length;
  const C = Math.max(0, ...rows.map((r) => r.length));
  let player = null;
  const boxes = [];
  const targets = [];
  for (let row = 0; row < R; row++) {
    for (let col = 0; col < rows[row].length; col++) {
      const c = rows[row][col];
      if (c === '@' || c === '%') player = { row, col };
      if (c === '$' || c === '*') boxes.push({ row, col });
      if (c === '.' || c === '*' || c === '%') targets.push({ row, col });
    }
  }
  return { grid: rows, R, C, player, boxes, targets };
}

function normalizeLevelString(levelString) {
  const rows = String(levelString || '').replace(/^[\r\n]+|[\r\n]+$/g, '').split('\n');
  const width = Math.max(0, ...rows.map((r) => r.length));
  return rows.map((r) => r.padEnd(width, '?')).join('\n');
}

function isRectangularLevelString(levelString) {
  const rows = String(levelString || '').replace(/^[\r\n]+|[\r\n]+$/g, '').split('\n');
  if (rows.length === 0) return false;
  const width = rows[0].length;
  if (width === 0) return false;
  return rows.every((r) => r.length === width);
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
levels = levels.map((levelData) => normalizeLevelString(levelData));

let customLevels = [];
function getAllLevels() {
  const customLevelStrings = customLevels.map(level => 
    typeof level === 'string' ? level : level.levelData
  );
  const allLevels = [...levels, ...customLevelStrings];
  if (validationTestLevel !== null) {
    allLevels.push(validationTestLevel);
  }
  return allLevels;
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
let currentTabId = 'game';
let rememberedLevelIndex = 0;
// en_US: Temporary level string used for editor validation play-through (not persisted in customLevels)
// zh_TW: 編輯器驗證通關時暫存的關卡字串（不會影響 customLevels）
let validationTestLevel = null;

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
    const isCustom = levelIndex >= levels.length;
    const customIndex = levelIndex - levels.length;
    const customLevel = isCustom ? customLevels[customIndex] : null;
    badgeEl.hidden = !isCustom;
      if (isCustom) {
      if (customLevel && customLevel.creatorName) {
        const ts = new Date(customLevel.createdAt);
        const dateStr = ts.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
        badgeEl.textContent = `by ${customLevel.creatorName}  ${dateStr}`;
      } else {
        badgeEl.textContent = pendingCustomLevelUpload ? tSingle('badge.testing') : tSingle('badge.custom');
      }
    }
  }
  updateGameplayControlState();
  scheduleBoardLayout();
}

function updateUrlForLevel(idx) {
  const validationIdx = levels.length + customLevels.length;
  const isValidationLevel = validationTestLevel !== null && idx === validationIdx;
  let newPath = null;
  let historyState = null;

  if (isValidationLevel) {
    newPath = '/singleplayer/validate';
    historyState = { validation: true };
  } else {
    const lid = getLevelId(idx);
    if (lid === null) return;
    newPath = `/singleplayer/${lid}`;
    historyState = { levelId: lid };
  }

  if (window.location.pathname !== newPath) {
    history.replaceState(historyState, '', newPath);
  }
}

function getPlayableLevelCount() {
  return levels.length + customLevels.length;
}

function clampPlayableLevelIndex(idx) {
  const total = getPlayableLevelCount();
  if (total <= 0) return 0;
  if (idx < 0) return 0;
  if (idx >= total) return total - 1;
  return idx;
}

function rememberLevelIndex(idx) {
  const total = getPlayableLevelCount();
  if (idx < 0 || idx >= total) return;
  rememberedLevelIndex = idx;
}

function loadLevel(idx) {
  stopPlayback();

  // en_US: If in validation mode and navigating to a different level, cancel validation
  // zh_TW: 若正在驗證模式且導航到其他關卡，取消驗證並恢復所有自訂關卡
  if (pendingCustomLevelUpload) {
    const validationIdx = levels.length + customLevels.length;
    if (idx !== validationIdx) {
      pendingCustomLevelUpload = null;
      validationTestLevel = null;
      isLevelTransitioning = false;
      loadCustomLevelsFromServer();
    }
  }

  const all = getAllLevels();
  if (idx < 0 || idx >= all.length) {
    isLevelTransitioning = false;
    return;
  }
  levelIndex = idx;
  rememberLevelIndex(levelIndex);
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
  updateUrlForLevel(idx);
}

// en_US: Get the API level ID for a given game-level index (built-in: index=id; custom: from customLevels)
// zh_TW: 依遊戲關卡索引取得 API 用的 levelId（內建：index=id；自訂：由 customLevels 取得）
function getLevelId(gameIndex) {
  if (gameIndex < levels.length) return gameIndex;
  const ci = gameIndex - levels.length;
  if (ci >= 0 && ci < customLevels.length) {
    const cl = customLevels[ci];
    return cl && cl.levelId != null ? cl.levelId : null;
  }
  return null;
}

function syncLbLevel() {
  const totalLb = levels.length + customLevels.length;
  lbLevelIndex = (levelIndex >= 0 && levelIndex < totalLb) ? levelIndex : 0;
  updateLbDisplay();
}

function updateLbDisplay() {
  const totalLb = levels.length + customLevels.length;
  if (lbLevelNum) lbLevelNum.textContent = lbLevelIndex + 1;
  if (lbPrevLevel) lbPrevLevel.disabled = totalLb <= 1;
  if (lbNextLevel) lbNextLevel.disabled = totalLb <= 1;
  const lbBadge = document.getElementById('lbLevelBadge');
  if (lbBadge) {
    const isCustom = lbLevelIndex >= levels.length;
    lbBadge.hidden = !isCustom;
    if (isCustom) {
      const ci = lbLevelIndex - levels.length;
      const cl = customLevels[ci];
      lbBadge.textContent = (cl && cl.creatorName) ? `by ${cl.creatorName}` : tSingle('badge.custom');
    }
  }
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
      // en_US: Snapshot score payload before transition to avoid losing level/moves during name prompt
      // zh_TW: 切關前先快照送分資料，避免姓名輸入期間狀態切換造成關卡/步驟遺失
      const scoreSnapshot = {
        levelId: getLevelId(levelIndex),
        steps,
        moves: getMovesString(),
      };
      submitScore(scoreSnapshot); // Auto submit score
      boardEl.classList.add('win-glow');
      setTimeout(() => {
        const area = document.querySelector('.game-area');
        if (area) area.classList.add('fade-out');
        setTimeout(() => {
          const total = getAllLevels().length;
          if (total > 0) {
            loadLevel((levelIndex + 1) % total);
          }
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
  if (btnReset) btnReset.disabled = !state;
  if (btnSubmit) btnSubmit.disabled = disableGameplay || moveHistory.length === 0;
  // en_US: Level nav buttons remain enabled during playback so users can switch levels freely
  // zh_TW: 播放期間關卡切換按鈕保持啟用，讓玩家可自由切換關卡
  if (btnPrevLevel) btnPrevLevel.disabled = !state || all.length <= 1;
  if (btnNextLevel) btnNextLevel.disabled = !state || all.length <= 1;
  if (btnNextLevelAfterWin) btnNextLevelAfterWin.disabled = disableGameplay || all.length <= 1;
}

function getWrappedLevelIndex(idx) {
  const total = getAllLevels().length;
  if (total <= 0) return null;
  return ((idx % total) + total) % total;
}

function canAcceptPlayerInput() {
  if (isPlaybackActive) return false;
  if (isLevelTransitioning) return false;
  const panel = document.querySelector('.tab-panel.active');
  if (!panel || panel.id !== 'panelGame') return false;
  if (winOverlay && winOverlay.classList.contains('visible')) return false;
  return true;
}

function isTypingTarget(target) {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  if (target.closest && target.closest('input, textarea, select, [contenteditable="true"]')) return true;
  return false;
}

async function fetchLevels() {
  const base = getBaseUrl();
  try {
    const res = await fetch(`${base}/api/levels`);
    const data = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(data.levels)) {
      levels = data.levels.map((levelData) => normalizeLevelString(levelData));
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
        levelData: normalizeLevelString(level.levelData),
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
      levelData: normalizeLevelString(levelStr),
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
        levelData: normalizeLevelString(data.levelData),
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
    const playerName = await ensurePlayerName();
    const moves = getMovesString();
    
    if (!playerName) {
      pendingCustomLevelUpload = null;
      validationTestLevel = null;
      await loadCustomLevelsFromServer();
      isLevelTransitioning = false;
      boardEl.classList.remove('win-glow');
      loadLevel(0);
      return;
    }
    
    const confirmed = await showConfirm(tSingle('upload.congrats'), `${tSingle('upload.confirm')}\n${tSingle('upload.creator')}：${playerName}\n${tSingle('upload.steps')}：${steps}`, 'success');
    
    let navigateToLevelIdx = 0;
    
    if (confirmed) {
      const result = await uploadCustomLevel(pendingCustomLevelUpload.levelData, playerName, moves);
      pendingCustomLevelUpload = null;
      
      if (result && result.levelId) {
        // en_US: Reload custom levels and navigate to the newly uploaded one
        // zh_TW: 重新載入自訂關卡並導航到新上傳的關卡
        await loadCustomLevelsFromServer();
        const newIdx = findLevelIndexByLevelId(result.levelId);
        if (newIdx !== null) navigateToLevelIdx = newIdx;
      } else {
        await loadCustomLevelsFromServer();
      }
    } else {
      pendingCustomLevelUpload = null;
      await loadCustomLevelsFromServer();
    }
    
    validationTestLevel = null;
    
    const area = document.querySelector('.game-area');
    if (area) area.classList.add('fade-out');
    setTimeout(() => {
      loadLevel(navigateToLevelIdx);
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
      await showSuccess(tSingle('upload.success'), `Level ID: ${data.levelId}\nURL: ${data.levelUrl}`);
      return { levelId: data.levelId, levelUrl: data.levelUrl };
    } else {
      setConnectionStatus(false);
      const errorMsg = data.message || data.error || 'Unknown error';
      await showError(tSingle('upload.failed'), errorMsg);
      return null;
    }
  } catch (err) {
    setConnectionStatus(false);
    await showError(tSingle('upload.failed'), t('upload.network'));
    return null;
  }
}

async function precheckCustomLevel(levelData) {
  const base = getBaseUrl();
  setConnectionStatus(false);
  try {
    const res = await fetch(`${base}/api/custom-levels/precheck`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ levelData })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      setBaseUrl(base);
      setConnectionStatus(true);
      return { ok: true };
    }
    setConnectionStatus(false);
    return { ok: false, message: data.message || data.error || 'Precheck failed' };
  } catch (_) {
    setConnectionStatus(false);
    return { ok: false, message: t('upload.network') };
  }
}

async function submitScore(snapshot = null) {
  const base = getBaseUrl();
  const name = await ensurePlayerName();
  if (!name) return;
  const moves = snapshot ? String(snapshot.moves || '') : getMovesString();
  if (!moves) return;
  const lid = snapshot ? snapshot.levelId : getLevelId(levelIndex);
  if (lid === null) return;
  const submitLevelId = String(lid);
  const submitSteps = snapshot ? parseInt(snapshot.steps, 10) : steps;
  if (isNaN(submitSteps) || submitSteps < 0) return;
  setConnectionStatus(false);
  try {
    const res = await fetch(`${base}/api/leaderboard/${submitLevelId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: name, steps: submitSteps, moves }),
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
  const lid = getLevelId(lbLevelIndex);
  if (lid === null) { leaderboardBody.innerHTML = ''; return; }
  const levelId = String(lid);
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
  currentTabId = tabId;
  // en_US: Stop replay immediately when leaving game tab
  // zh_TW: 離開遊戲分頁時立即停止重播並重設關卡
  if (isPlaybackActive && tabId !== 'game') {
    stopPlayback();
    loadLevel(levelIndex);
  }

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
  // en_US: When switching to game tab, sync level from leaderboard so both views stay consistent
  // zh_TW: 切換到遊戲分頁時，從排行榜同步關卡，保持雙向一致
  if (tabId === 'game') {
    const validationIdx = levels.length + customLevels.length;
    const isValidationPlaythrough = validationTestLevel !== null && levelIndex === validationIdx;
    if (!isValidationPlaythrough) {
      const totalLb = levels.length + customLevels.length;
      if (lbLevelIndex >= 0 && lbLevelIndex < totalLb && lbLevelIndex !== levelIndex) {
        loadLevel(lbLevelIndex);
      }
    }
    scheduleBoardLayout();
  }
}

// ---- Editor ----
let editorW = 10;
let editorH = 10;
let editorTool = '#';
let editorGrid = [];
let editorHasUnsavedChanges = false;

function markEditorDirty() {
  editorHasUnsavedChanges = true;
}

function resetEditorDirty() {
  editorHasUnsavedChanges = false;
}

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

let editorDragging = false;

function editorPlaceAt(r, c) {
  if (r < 0 || r >= editorH || c < 0 || c >= editorW) return;
  editorGrid[r] = editorGrid[r] || [];
  if (editorGrid[r][c] === editorTool) return;
  editorGrid[r][c] = editorTool;
  markEditorDirty();
  editorRender();
  editorUpdateStats();
}

function editorCellFromEvent(e) {
  const el = document.getElementById('editorBoard');
  if (!el) return null;
  const touch = e.changedTouches ? e.changedTouches[0] : e;
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  if (!target || !target.classList.contains('editor-cell')) return null;
  return { r: parseInt(target.dataset.r, 10), c: parseInt(target.dataset.c, 10) };
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
        if (ch === '.' || ch === '*' || ch === '%') cell.classList.add('target');
      }
      if (ch === '$' || ch === '*') cell.classList.add('box');
      if (ch === '@' || ch === '%') cell.classList.add('player');

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
      if (ch === '.' || ch === '*' || ch === '%') target++;
      if (ch === '@' || ch === '%') player++;
    }
  }
  const el = document.getElementById('editorStats');
  if (el) el.textContent = `▤${box} ◎${target} ●${player}`;
}

function editorResize(markDirty = false) {
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
  if (markDirty) markEditorDirty();
}

function normalizeEditorCell(ch) {
  if (ch === '?') return '?';
  if (ch === '#') return '#';
  if (ch === '$') return '$';
  if (ch === '.') return '.';
  if (ch === '@') return '@';
  if (ch === '*') return '*';
  if (ch === '%') return '%';
  return ' ';
}

function loadRememberedLevelIntoEditor() {
  const all = getAllLevels();
  const totalPlayable = getPlayableLevelCount();
  if (all.length === 0 || totalPlayable <= 0) return;

  const sourceIdx = clampPlayableLevelIndex(rememberedLevelIndex);
  const source = all[sourceIdx] || all[0] || '';
  const rows = String(source).replace(/^[\r\n]+|[\r\n]+$/g, '').split('\n');
  const sourceH = Math.max(5, Math.min(20, rows.length));
  const sourceW = Math.max(5, Math.min(20, rows.reduce((max, row) => Math.max(max, row.length), 0)));

  editorH = sourceH;
  editorW = sourceW;
  editorGrid = [];
  for (let r = 0; r < editorH; r++) {
    editorGrid[r] = [];
    const row = rows[r] || '';
    for (let c = 0; c < editorW; c++) {
      editorGrid[r][c] = normalizeEditorCell(row[c] ?? '?');
    }
  }
  editorResize(false);
  resetEditorDirty();
}

async function editorSave() {
  const str = editorGridToState();
  if (!isRectangularLevelString(str)) {
    await showError(tSingle('editor.invalid'), t('editor.needRectangle'));
    return;
  }
  const parsed = parseLevel(str);
  if (checkWin(parsed.boxes, parsed.targets)) {
    await showError(tSingle('editor.invalid'), t('editor.alreadySolved'));
    return;
  }
  // en_US: Validate directly from editorGrid to avoid trim() issues
  // zh_TW: 直接從 editorGrid 驗證，避免 trim() 導致的問題
  let boxCount = 0, targetCount = 0, playerCount = 0;
  for (let r = 0; r < editorH; r++) {
    for (let c = 0; c < editorW; c++) {
      const ch = editorGrid[r]?.[c] ?? ' ';
      if (ch === '$' || ch === '*') boxCount++;
      if (ch === '.' || ch === '*' || ch === '%') targetCount++;
      if (ch === '@' || ch === '%') playerCount++;
    }
  }

  if (playerCount !== 1) {
    await showError(tSingle('editor.invalid'), t('editor.needPlayer'));
    return;
  }
  if (boxCount === 0) {
    await showError(tSingle('editor.invalid'), t('editor.needBox'));
    return;
  }
  if (boxCount !== targetCount) {
    const boxTargetEntry = I18N['editor.needBox'];
    const msg = currentLang === 'zh'
      ? `箱子數量（${boxCount}）必須等於目標數量（${targetCount}）`
      : currentLang === 'en'
      ? `Box count (${boxCount}) must equal target count (${targetCount})`
      : `Box count (${boxCount}) must equal target count (${targetCount})\n箱子數量（${boxCount}）必須等於目標數量（${targetCount})`;
    await showError(tSingle('editor.invalid'), msg);
    return;
  }

  const precheck = await precheckCustomLevel(str);
  if (!precheck.ok) {
    await showError(tSingle('editor.invalid'), precheck.message || tSingle('upload.failed'));
    return;
  }

  // en_US: Store level for upload after completion
  // zh_TW: 儲存關卡以便通關後上傳
  pendingCustomLevelUpload = {
    levelData: str,
    timestamp: Date.now()
  };

  // en_US: Set as temporary validation level (preserves existing customLevels)
  // zh_TW: 設為暫時驗證關卡（保留現有自訂關卡不被覆蓋）
  validationTestLevel = str;
  levelIndex = levels.length + customLevels.length;
  loadLevel(levelIndex);
  showTab('game');
  resetEditorDirty();

  await showAlert(tSingle('editor.startTest'), t('editor.testBody'));
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
  document.getElementById('btnWidthPlus').addEventListener('click', () => { editorW++; editorResize(true); });
  document.getElementById('btnWidthMinus').addEventListener('click', () => { editorW--; editorResize(true); });
  document.getElementById('btnHeightPlus').addEventListener('click', () => { editorH++; editorResize(true); });
  document.getElementById('btnHeightMinus').addEventListener('click', () => { editorH--; editorResize(true); });
  document.getElementById('btnEditorReset').addEventListener('click', () => {
    editorW = 10;
    editorH = 10;
    editorGrid = [];
    editorResize(true);
  });
  document.getElementById('btnEditorSave').addEventListener('click', editorSave);

  // en_US: Drag-to-place support — mouse and touch drag to continuously place tiles
  // zh_TW: 拖曳連續擺放 — 滑鼠及觸控拖曳以連續放置方塊
  const board = document.getElementById('editorBoard');
  if (board) {
    board.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      editorDragging = true;
      const pos = editorCellFromEvent(e);
      if (pos) editorPlaceAt(pos.r, pos.c);
    });
    board.addEventListener('mousemove', (e) => {
      if (!editorDragging) return;
      const pos = editorCellFromEvent(e);
      if (pos) editorPlaceAt(pos.r, pos.c);
    });
    document.addEventListener('mouseup', () => { editorDragging = false; });

    board.addEventListener('touchstart', (e) => {
      editorDragging = true;
      const pos = editorCellFromEvent(e);
      if (pos) editorPlaceAt(pos.r, pos.c);
    }, { passive: true });
    board.addEventListener('touchmove', (e) => {
      if (!editorDragging) return;
      e.preventDefault();
      const pos = editorCellFromEvent(e);
      if (pos) editorPlaceAt(pos.r, pos.c);
    }, { passive: false });
    board.addEventListener('touchend', () => { editorDragging = false; }, { passive: true });
    board.addEventListener('touchcancel', () => { editorDragging = false; }, { passive: true });
  }

  editorResize(false);
  resetEditorDirty();
}

async function requestTabSwitch(targetTabId) {
  if (!targetTabId || targetTabId === currentTabId) return;

  if (currentTabId === 'editor' && targetTabId !== 'editor' && editorHasUnsavedChanges) {
    const decision = await showModal({
      icon: 'confirm',
      title: tSingle('editor.unsavedTitle'),
      body: tSingle('editor.unsavedBody'),
      buttons: [
        { text: tSingle('btn.cancel'), value: 'cancel' },
        { text: tSingle('editor.discardLeave'), value: 'discard', danger: true },
        { text: tSingle('editor.saveAndTest'), value: 'save', primary: true }
      ]
    });
    if (decision === 'cancel' || decision === null) return;
    if (decision === 'save') {
      await editorSave();
      return;
    }
    resetEditorDirty();
  }

  if (targetTabId === 'editor') {
    if (currentTabId === 'leaderboard') rememberLevelIndex(lbLevelIndex);
    else rememberLevelIndex(levelIndex);
    lbLevelIndex = clampPlayableLevelIndex(rememberedLevelIndex);
    loadRememberedLevelIntoEditor();
  }

  if (currentTabId === 'editor' && targetTabId !== 'editor') {
    lbLevelIndex = clampPlayableLevelIndex(rememberedLevelIndex);
  }

  showTab(targetTabId);
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
  // en_US: Level nav stops playback immediately and switches level (no lock during replay)
  // zh_TW: 關卡切換會立即停止播放並切換關卡（播放期間不鎖定）
  if (btnPrevLevel) btnPrevLevel.addEventListener('click', () => {
    const nextIdx = getWrappedLevelIndex(levelIndex - 1);
    if (nextIdx === null) return;
    if (isPlaybackActive) { stopPlayback(); loadLevel(nextIdx); return; }
    if (!canAcceptPlayerInput()) return;
    loadLevel(nextIdx);
  });
  if (btnNextLevel) btnNextLevel.addEventListener('click', () => {
    const nextIdx = getWrappedLevelIndex(levelIndex + 1);
    if (nextIdx === null) return;
    if (isPlaybackActive) { stopPlayback(); loadLevel(nextIdx); return; }
    if (!canAcceptPlayerInput()) return;
    loadLevel(nextIdx);
  });
  if (btnReset) btnReset.addEventListener('click', () => {
    if (isPlaybackActive) { stopPlayback(); loadLevel(levelIndex); return; }
    if (!canAcceptPlayerInput()) return;
    loadLevel(levelIndex);
  });
  if (levelNumEl) {
    levelNumEl.addEventListener('click', async () => {
      if (isPlaybackActive) stopPlayback();
      const idx = await showLevelJumpModal();
      if (idx !== null) loadLevel(idx);
    });
  }
  if (btnSubmit) btnSubmit.addEventListener('click', () => {
    if (!canAcceptPlayerInput()) return;
    submitScore();
  });
  const btnShare = document.getElementById('btnShare');
  if (btnShare) btnShare.addEventListener('click', shareLevelLink);
  if (btnNextLevelAfterWin) btnNextLevelAfterWin.addEventListener('click', () => {
    const nextIdx = getWrappedLevelIndex(levelIndex + 1);
    if (nextIdx === null) return;
    if (!canAcceptPlayerInput()) return;
    loadLevel(nextIdx);
  });

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => requestTabSwitch(btn.dataset.tab));
  });

  if (lbPrevLevel) lbPrevLevel.addEventListener('click', () => {
    const totalLb = levels.length + customLevels.length;
    if (totalLb <= 0) return;
    lbLevelIndex = ((lbLevelIndex - 1) % totalLb + totalLb) % totalLb;
    rememberLevelIndex(lbLevelIndex);
    updateLbDisplay();
    refreshLeaderboard();
  });
  if (lbNextLevel) lbNextLevel.addEventListener('click', () => {
    const totalLb = levels.length + customLevels.length;
    if (totalLb <= 0) return;
    lbLevelIndex = (lbLevelIndex + 1) % totalLb;
    rememberLevelIndex(lbLevelIndex);
    updateLbDisplay();
    refreshLeaderboard();
  });
  // en_US: Click leaderboard level number to jump to any level's leaderboard
  // zh_TW: 點擊排行榜關卡數字可快速跳到任意關卡的排行榜
  if (lbLevelNum) {
    lbLevelNum.addEventListener('click', async () => {
      const idx = await showLevelJumpModal();
      if (idx !== null) {
        lbLevelIndex = idx;
        rememberLevelIndex(lbLevelIndex);
        updateLbDisplay();
        refreshLeaderboard();
      }
    });
  }
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

  // en_US: Language setting — load preference and bind buttons
  // zh_TW: 語言設定 — 載入偏好並綁定按鈕
  currentLang = localStorage.getItem(STORAGE_LANG) || 'bilingual';
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentLang = btn.dataset.lang || 'bilingual';
      localStorage.setItem(STORAGE_LANG, currentLang);
      applyLanguage();
    });
  });
  applyLanguage();

  document.addEventListener('keydown', (e) => {
    if (isTypingTarget(e.target)) return;
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

  // en_US: Handle browser back/forward navigation for SPA level URLs
  // zh_TW: 處理瀏覽器前進/後退按鈕的 SPA 關卡網址導航
  window.addEventListener('popstate', (e) => {
    if (/^\/singleplayer\/validate\/?$/.test(window.location.pathname)) {
      if (validationTestLevel !== null) {
        const validationIdx = levels.length + customLevels.length;
        if (validationIdx !== levelIndex) loadLevel(validationIdx);
      } else if (levelIndex !== 0) {
        loadLevel(0);
      }
      showTab('game');
      return;
    }
    const m = window.location.pathname.match(/^\/singleplayer\/(\d+)\/?$/);
    if (m) {
      const urlLevelId = parseInt(m[1], 10);
      const idx = findLevelIndexByLevelId(urlLevelId);
      if (idx !== null && idx !== levelIndex) {
        loadLevel(idx);
        showTab('game');
      }
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
    if (/^\/singleplayer\/validate\/?$/.test(window.location.pathname)) {
      if (validationTestLevel !== null) {
        idx = levels.length + customLevels.length;
      }
    } else {
      const m = window.location.pathname.match(/^\/singleplayer\/(\d+)\/?$/);
      if (m) {
        const urlLevelId = parseInt(m[1], 10);
        let found = findLevelIndexByLevelId(urlLevelId);
        if (found === null) found = await ensureLevelById(urlLevelId);
        if (found !== null) idx = found;
        else await showError(tSingle('level.notFound'), tSingle('level.notFound'));
      }
    }
    loadLevel(idx);
  })();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
