(function () {
  const STORAGE_URL = 'sokoban_brawl_server_url';
  const STORAGE_NAME = 'sokoban_brawl_player_name';
  const DIR_MAP = {
    ArrowLeft: 'l',
    ArrowRight: 'r',
    ArrowUp: 'u',
    ArrowDown: 'd',
    KeyA: 'l',
    KeyD: 'r',
    KeyW: 'u',
    KeyS: 'd',
  };
  const SWIPE_THRESHOLD = 20;

  const multiPanel = document.getElementById('panelMulti');
  if (!multiPanel) return;
  const tabMulti = document.getElementById('tabMulti');

  const elLobby = document.getElementById('multiLobby');
  const elMatch = document.getElementById('multiMatch');
  const elCountdown = document.getElementById('multiCountdown');
  const elQueueCount = document.getElementById('multiQueueCount');
  const elSpectatorCount = document.getElementById('multiSpectatorCount');
  const elBattleCountdown = document.getElementById('multiBattleCountdown');
  const elBoard = document.getElementById('multiBoard');
  const elScoreboard = document.getElementById('multiScoreboard');
  const elChatLog = document.getElementById('multiChatLog');
  const elChatInput = document.getElementById('multiChatInput');
  const elPracticeBoard = document.getElementById('multiPracticeBoard');
  const elRoomIdLabel = document.getElementById('multiRoomIdLabel');
  const btnJoin = document.getElementById('btnMultiJoin');
  const btnSpectate = document.getElementById('btnMultiSpectate');
  const btnLeave = document.getElementById('btnMultiLeave');
  const btnShare = document.getElementById('btnMultiShare');
  const btnBackLobby = document.getElementById('btnMultiBackLobby');
  const btnSend = document.getElementById('btnMultiChatSend');

  let socket = null;
  let currentState = null;
  let inMatch = false;
  let myMode = 'idle';
  let myId = '';
  let lobbyQueueCount = 0;
  let currentRoomId = '';
  let autoJoinRequested = false;
  let touchStartPractice = null;
  let touchStartMatch = null;
  const PRACTICE_MAP = [
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
  let practiceState = null;
  const SLOT_COLORS = ['red', 'blue', 'green', 'orange'];

  function getBaseUrl() {
    const url = (localStorage.getItem(STORAGE_URL) || '').trim().replace(/\/+$/, '');
    return url || window.location.origin;
  }

  function getPlayerName() {
    const n = (localStorage.getItem(STORAGE_NAME) || '').trim();
    return n || 'Player';
  }

  function getPathRoomId() {
    const m = window.location.pathname.match(/^\/multiplayer\/([A-Za-z0-9_-]+)\/?$/);
    return m ? m[1] : '';
  }

  function setRoomUrl(roomId) {
    if (!roomId) return;
    const next = `/multiplayer/${encodeURIComponent(roomId)}`;
    if (window.location.pathname !== next) {
      history.replaceState({ multiplayerRoomId: roomId }, '', next);
    }
  }

  function getRoomUrl(roomId) {
    return `${window.location.origin}/multiplayer/${encodeURIComponent(roomId)}`;
  }

  function updateRoomLabel() {
    if (!elRoomIdLabel) return;
    elRoomIdLabel.textContent = currentRoomId ? `#${currentRoomId}` : '#-';
  }

  function isTypingTarget(target) {
    if (!target || !(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (target.isContentEditable) return true;
    return !!(target.closest && target.closest('input, textarea, select, [contenteditable=\"true\"]'));
  }

  function activeOnMultiPanel() {
    return !multiPanel.hidden && multiPanel.classList.contains('active');
  }

  function appendChatLine(text, className = '') {
    if (!elChatLog) return;
    const line = document.createElement('div');
    line.className = `multi-chat-line ${className}`.trim();
    line.textContent = text;
    elChatLog.appendChild(line);
    elChatLog.scrollTop = elChatLog.scrollHeight;
  }

  function handleChatFocus() {
    window.__sokobanLockViewportHeight = true;
    document.documentElement.style.setProperty('--app-height', `${Math.round(window.innerHeight)}px`);
    window.requestAnimationFrame(() => {
      if (elChatLog) elChatLog.scrollTop = elChatLog.scrollHeight;
    });
  }

  function handleChatBlur() {
    window.__sokobanLockViewportHeight = false;
    const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--app-height', `${Math.round(viewportHeight)}px`);
  }

  async function shareRoomUrl() {
    if (!currentRoomId) return;
    const url = getRoomUrl(currentRoomId);
    try {
      await navigator.clipboard.writeText(url);
      appendChatLine(`Room link copied: ${url}`);
    } catch {
      appendChatLine(`Failed to copy room link: ${url}`);
    }
  }

  function createPracticeState() {
    const rows = PRACTICE_MAP.map((r) => r.split(''));
    return { rows, players: [], boxes: [], targets: [], controlledColor: null };
  }

  function colorFromQueueIndex(queueIndex) {
    const idx = Number.isFinite(queueIndex) ? queueIndex : 0;
    return SLOT_COLORS[((idx % SLOT_COLORS.length) + SLOT_COLORS.length) % SLOT_COLORS.length];
  }

  function clearPracticeEntities() {
    if (!practiceState) return;
    practiceState.players = [];
    practiceState.boxes = [];
    practiceState.targets = [];
    practiceState.controlledColor = null;
  }

  function renderPracticeBoard() {
    if (!elPracticeBoard || !practiceState) return;
    const { rows, players, boxes, targets } = practiceState;
    const R = rows.length;
    const C = rows[0]?.length || 0;
    const boxMap = new Map(boxes.map((b) => [`${b.row},${b.col}`, b]));
    const targetMap = new Map(targets.map((t) => [`${t.row},${t.col}`, t]));
    const playerMap = new Map(players.map((p) => [`${p.row},${p.col}`, p]));
    elPracticeBoard.innerHTML = '';
    const areaW = elPracticeBoard.parentElement ? elPracticeBoard.parentElement.clientWidth : 320;
    const areaH = elPracticeBoard.parentElement ? elPracticeBoard.parentElement.clientHeight : 320;
    const cellSize = Math.max(18, Math.min(44, Math.floor(Math.min(areaW / Math.max(1, C), areaH / Math.max(1, R)))));
    elPracticeBoard.style.setProperty('--cell-size', `${cellSize}px`);
    elPracticeBoard.style.gridTemplateColumns = `repeat(${C}, var(--cell-size))`;
    elPracticeBoard.style.gridTemplateRows = `repeat(${R}, var(--cell-size))`;
    for (let row = 0; row < R; row++) {
      for (let col = 0; col < C; col++) {
        const div = document.createElement('div');
        div.className = 'cell';
        const base = rows[row][col];
        if (base === '#') div.classList.add('wall');
        else {
          div.classList.add('empty');
          const target = targetMap.get(`${row},${col}`);
          if (target) div.classList.add('target', `multi-target-${target.color}`);
        }
        const box = boxMap.get(`${row},${col}`);
        if (box) div.classList.add('box', `multi-box-${box.color}`);
        const player = playerMap.get(`${row},${col}`);
        if (player) div.classList.add('player', `multi-player-${player.color}`);
        elPracticeBoard.appendChild(div);
      }
    }
  }

  function movePractice(dir) {
    if (!socket || !practiceState || !practiceState.controlledColor) return;
    socket.emit('lobby:practice_move', { direction: dir, roomId: currentRoomId });
  }

  function toSwipeDir(dx, dy) {
    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return null;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'r' : 'l';
    return dy > 0 ? 'd' : 'u';
  }

  function bindSwipeControls() {
    if (elPracticeBoard) {
      elPracticeBoard.addEventListener('touchstart', (e) => {
        if (!activeOnMultiPanel() || inMatch || myMode !== 'queue') return;
        const t = e.changedTouches && e.changedTouches[0];
        if (!t) return;
        touchStartPractice = { x: t.clientX, y: t.clientY };
      }, { passive: true });

      elPracticeBoard.addEventListener('touchmove', (e) => {
        if (!touchStartPractice) return;
        e.preventDefault();
      }, { passive: false });

      elPracticeBoard.addEventListener('touchend', (e) => {
        if (!touchStartPractice) return;
        const t = e.changedTouches && e.changedTouches[0];
        if (!t) return;
        const dir = toSwipeDir(t.clientX - touchStartPractice.x, t.clientY - touchStartPractice.y);
        touchStartPractice = null;
        if (dir) movePractice(dir);
      }, { passive: true });
    }

    if (elBoard) {
      elBoard.addEventListener('touchstart', (e) => {
        if (!activeOnMultiPanel() || !inMatch) return;
        const t = e.changedTouches && e.changedTouches[0];
        if (!t) return;
        touchStartMatch = { x: t.clientX, y: t.clientY };
      }, { passive: true });

      elBoard.addEventListener('touchmove', (e) => {
        if (!touchStartMatch) return;
        e.preventDefault();
      }, { passive: false });

      elBoard.addEventListener('touchend', (e) => {
        if (!touchStartMatch || !socket) return;
        const t = e.changedTouches && e.changedTouches[0];
        if (!t) return;
        const dir = toSwipeDir(t.clientX - touchStartMatch.x, t.clientY - touchStartMatch.y);
        touchStartMatch = null;
        if (dir) socket.emit('match:move', { direction: dir });
      }, { passive: true });
    }
  }

  function renderScoreboard(state) {
    if (!elScoreboard) return;
    elScoreboard.innerHTML = '';
    const ranking = Array.isArray(state?.ranking) ? state.ranking : [];
    ranking.forEach((row) => {
      const item = document.createElement('div');
      item.className = 'multi-score-item';
      item.innerHTML = `
        <div class="name">${row.rank}. ${row.playerName} (${row.color})</div>
        <div>Score: ${row.score}</div>
      `;
      elScoreboard.appendChild(item);
    });
  }

  function renderBoard(state) {
    if (!elBoard || !state || !Array.isArray(state.rows)) return;
    const rows = state.rows.map((r) => String(r).split(''));
    const R = rows.length;
    const C = rows[0]?.length || 0;
    const playerMap = new Map((state.players || []).map((p) => [`${p.row},${p.col}`, p]));
    const boxMap = new Map((state.boxes || []).map((b) => [`${b.row},${b.col}`, b]));
    const targetMap = new Map((state.targets || []).map((t) => [`${t.row},${t.col}`, t]));

    elBoard.innerHTML = '';
    const areaW = elBoard.parentElement ? elBoard.parentElement.clientWidth : 420;
    const areaH = elBoard.parentElement ? elBoard.parentElement.clientHeight : 420;
    const maxCell = Math.max(18, Math.min(56, Math.floor(Math.min(areaW / Math.max(1, C), areaH / Math.max(1, R)))));
    elBoard.style.setProperty('--cell-size', `${maxCell}px`);
    elBoard.style.gridTemplateColumns = `repeat(${C}, var(--cell-size))`;
    elBoard.style.gridTemplateRows = `repeat(${R}, var(--cell-size))`;

    for (let row = 0; row < R; row++) {
      for (let col = 0; col < C; col++) {
        const ch = rows[row][col];
        const cell = document.createElement('div');
        cell.className = 'cell';
        if (ch === '?') cell.classList.add('void');
        else if (ch === '#') cell.classList.add('wall');
        else cell.classList.add('empty');

        const target = targetMap.get(`${row},${col}`);
        if (target) {
          cell.classList.add('target', `multi-target-${target.color}`);
        }
        const box = boxMap.get(`${row},${col}`);
        if (box) {
          cell.classList.add('box', `multi-box-${box.color}`);
        }
        const player = playerMap.get(`${row},${col}`);
        if (player) {
          cell.classList.add('player', `multi-player-${player.color}`);
          cell.title = player.name;
        }
        elBoard.appendChild(cell);
      }
    }
  }

  function renderMatchState(state) {
    currentState = state;
    if (elBattleCountdown) {
      const leftSec = Math.max(0, Math.ceil((state.timeLeftMs || 0) / 1000));
      elBattleCountdown.textContent = String(leftSec);
    }
    renderBoard(state);
    renderScoreboard(state);
  }

  function enterMatchView() {
    inMatch = true;
    if (elLobby) elLobby.hidden = true;
    if (elMatch) {
      elMatch.hidden = false;
      elMatch.style.display = '';
      elMatch.classList.add('is-transitioning');
      setTimeout(() => elMatch.classList.remove('is-transitioning'), 20);
    }
  }

  function enterLobbyView() {
    inMatch = false;
    if (elLobby) elLobby.hidden = false;
    if (elMatch) {
      elMatch.classList.remove('is-transitioning');
      elMatch.hidden = true;
      elMatch.style.display = 'none';
    }
    if (elBoard) {
      elBoard.innerHTML = '';
      elBoard.style.gridTemplateColumns = '';
      elBoard.style.gridTemplateRows = '';
    }
    if (elScoreboard) elScoreboard.innerHTML = '';
    currentState = null;
  }

  function connectSocket() {
    if (socket) return;
    if (typeof window.io !== 'function') return;
    socket = window.io(getBaseUrl(), { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      myId = socket.id;
      appendChatLine('Connected / 已連線');
      if (activeOnMultiPanel()) ensureAutoJoinRoom();
    });

    socket.on('room:joined', (payload = {}) => {
      currentRoomId = String(payload.roomId || '').trim();
      if (currentRoomId) {
        setRoomUrl(currentRoomId);
      }
      updateRoomLabel();
    });

    socket.on('lobby:state', (payload = {}) => {
      if (elCountdown) elCountdown.textContent = `${payload.countdownSeconds ?? 60}s`;
      if (elQueueCount) elQueueCount.textContent = String(payload.queueCount ?? 0);
      if (elSpectatorCount) elSpectatorCount.textContent = String(payload.spectatorCount ?? 0);
      lobbyQueueCount = Number(payload.queueCount || 0);
      if (payload.roomId) {
        currentRoomId = String(payload.roomId);
        setRoomUrl(currentRoomId);
        updateRoomLabel();
      }
    });

    socket.on('lobby:countdown', (payload = {}) => {
      if (elCountdown) elCountdown.textContent = `${payload.seconds ?? 0}s`;
    });

    socket.on('lobby:chat', (payload = {}) => {
      const from = payload.fromName || 'Lobby';
      appendChatLine(`[${from}] ${payload.text}`);
    });

    socket.on('lobby:practice_state', (payload = {}) => {
      if (!practiceState) practiceState = createPracticeState();
      practiceState.rows = Array.isArray(payload.rows) ? payload.rows.map((r) => String(r).split('')) : practiceState.rows;
      practiceState.players = Array.isArray(payload.players) ? payload.players.map((p) => ({ ...p })) : [];
      practiceState.boxes = Array.isArray(payload.boxes) ? payload.boxes.map((b) => ({ ...b })) : [];
      practiceState.targets = Array.isArray(payload.targets) ? payload.targets.map((t) => ({ ...t })) : [];
      renderPracticeBoard();
    });

    socket.on('matchmaking:joined', (payload = {}) => {
      if (payload.ok === false) {
        appendChatLine(payload.message || 'Join queue failed');
        return;
      }
      const queueIndex = Number(payload.queueIndex);
      const color = payload.color || colorFromQueueIndex(Number.isFinite(queueIndex) ? queueIndex : lobbyQueueCount);
      if (payload.roomId) {
        currentRoomId = String(payload.roomId);
        setRoomUrl(currentRoomId);
        updateRoomLabel();
      }
      if (practiceState) practiceState.controlledColor = color;
    });

    socket.on('match:start', (payload = {}) => {
      enterMatchView();
      if (payload.state) renderMatchState(payload.state);
      const me = (payload.players || []).find((p) => p.id === myId);
      if (me) appendChatLine(`You are ${me.color} / 你的顏色是 ${me.color}`);
    });

    socket.on('match:state', (payload = {}) => {
      renderMatchState(payload);
    });

    socket.on('match:chat', (payload = {}) => {
      const from = payload.fromName || 'Player';
      appendChatLine(`[${from}] ${payload.text}`);
    });

    socket.on('match:end', (payload = {}) => {
      inMatch = false;
      const ranking = Array.isArray(payload.ranking) ? payload.ranking : [];
      if (ranking.length > 0) {
        appendChatLine('Match End / 對戰結束');
        ranking.forEach((r) => {
          appendChatLine(`#${r.rank} ${r.playerName} (${r.color}) score=${r.score}`);
        });
      }
      enterLobbyView();
    });
  }

  function joinMatchmaking() {
    connectSocket();
    if (!socket) return;
    myMode = 'queue';
    socket.emit('matchmaking:join', { playerName: getPlayerName(), roomId: currentRoomId });
    appendChatLine('Joined queue / 已加入配對');
  }

  function joinSpectator() {
    connectSocket();
    if (!socket) return;
    myMode = 'spectator';
    clearPracticeEntities();
    renderPracticeBoard();
    socket.emit('spectator:joinLobby', { playerName: getPlayerName(), roomId: currentRoomId });
    appendChatLine('Spectating mode / 觀戰模式');
  }

  function leaveQueueOrSpectate() {
    if (!socket) return;
    if (myMode === 'queue') socket.emit('matchmaking:leave');
    if (myMode === 'spectator') socket.emit('spectator:leaveLobby');
    myMode = 'idle';
    clearPracticeEntities();
    renderPracticeBoard();
    appendChatLine('Left waiting mode / 已離開等待模式');
  }

  function sendChat() {
    if (!socket || !elChatInput) return;
    const text = elChatInput.value.trim();
    if (!text) return;
    if (inMatch) socket.emit('match:chat', { text });
    else socket.emit('lobby:chat', { text, playerName: getPlayerName(), roomId: currentRoomId });
    elChatInput.value = '';
  }

  function ensureAutoJoinRoom() {
    connectSocket();
    if (!socket || !socket.connected) return;
    if (currentRoomId && autoJoinRequested) return;
    const pathRoomId = getPathRoomId();
    socket.emit('room:auto_join', { roomId: pathRoomId || currentRoomId || '' });
    autoJoinRequested = true;
  }

  function handleMoveKey(e) {
    if (!activeOnMultiPanel()) return;
    if (isTypingTarget(e.target)) return;
    const dir = DIR_MAP[e.code];
    if (!dir) return;
    e.preventDefault();
    if (inMatch && socket) {
      socket.emit('match:move', { direction: dir });
      return;
    }
    if (myMode === 'queue') {
      movePractice(dir);
    }
  }

  if (btnJoin) btnJoin.addEventListener('click', joinMatchmaking);
  if (btnSpectate) btnSpectate.addEventListener('click', joinSpectator);
  if (btnLeave) btnLeave.addEventListener('click', leaveQueueOrSpectate);
  if (btnShare) btnShare.addEventListener('click', shareRoomUrl);
  if (btnBackLobby) {
    btnBackLobby.addEventListener('click', () => {
      if (socket) socket.emit('match:returnToLobby');
      enterLobbyView();
    });
  }
  if (btnSend) btnSend.addEventListener('click', sendChat);
  if (elChatInput) {
    elChatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendChat();
      }
    });
    elChatInput.addEventListener('focus', handleChatFocus);
    elChatInput.addEventListener('blur', handleChatBlur);
  }
  document.addEventListener('keydown', handleMoveKey);
  bindSwipeControls();
  if (tabMulti) {
    tabMulti.addEventListener('click', () => {
      ensureAutoJoinRoom();
    });
  }
  const panelObserver = new MutationObserver(() => {
    if (activeOnMultiPanel()) ensureAutoJoinRoom();
  });
  panelObserver.observe(multiPanel, { attributes: true, attributeFilter: ['class', 'hidden'] });
  practiceState = createPracticeState();
  renderPracticeBoard();
  currentRoomId = getPathRoomId();
  updateRoomLabel();
  connectSocket();
  if (currentRoomId && tabMulti && !activeOnMultiPanel()) {
    setTimeout(() => tabMulti.click(), 0);
  }
})();
