/**
 * Sokoban Brawl - 客戶端驗證介面
 * 伺服器設置、連線測試、排行榜讀取與提交測試
 */

const STORAGE_KEY = 'sokoban_brawl_server_url';

function getBaseUrl() {
  const input = document.getElementById('serverUrl');
  let url = (input && input.value.trim()) || localStorage.getItem(STORAGE_KEY) || '';
  url = url.replace(/\/+$/, '');
  return url || '';
}

function setBaseUrl(url) {
  const input = document.getElementById('serverUrl');
  if (input) input.value = url;
  if (url) localStorage.setItem(STORAGE_KEY, url);
}

function setConnectionStatus(connected, text) {
  const el = document.getElementById('connectionStatus');
  if (!el) return;
  el.textContent = text || (connected ? '已連線' : '未連線');
  el.className = connected ? 'connected' : 'disconnected';
}

function showStatus(containerId, type, message) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.className = 'status ' + type;
  el.textContent = message;
  el.style.display = 'block';
}

function hideStatus(containerId) {
  const el = document.getElementById(containerId);
  if (el) el.style.display = 'none';
}

async function checkHealth() {
  const base = getBaseUrl();
  const statusId = 'healthStatus';
  if (!base) {
    showStatus(statusId, 'error', '請先輸入伺服器網址');
    return;
  }
  showStatus(statusId, 'pending', '檢查中…');
  setConnectionStatus(false, '檢查中…');
  try {
    const res = await fetch(base + '/health', { method: 'GET' });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.status === 'ok') {
      showStatus(statusId, 'success', '連線成功\n' + JSON.stringify(data, null, 2));
      setConnectionStatus(true, '已連線');
      setBaseUrl(base);
    } else {
      showStatus(statusId, 'error', `HTTP ${res.status}\n` + (data.message || res.statusText));
      setConnectionStatus(false, '連線失敗');
    }
  } catch (err) {
    showStatus(statusId, 'error', '連線失敗：' + err.message);
    setConnectionStatus(false, '連線失敗');
  }
}

async function fetchLeaderboard() {
  const base = getBaseUrl();
  const levelId = (document.getElementById('testLevelId') && document.getElementById('testLevelId').value.trim()) || '0';
  const statusId = 'leaderboardStatus';
  const tableBody = document.getElementById('leaderboardBody');
  if (!base) {
    showStatus(statusId, 'error', '請先輸入伺服器網址');
    return;
  }
  showStatus(statusId, 'pending', '讀取中…');
  if (tableBody) tableBody.innerHTML = '';
  try {
    const res = await fetch(`${base}/api/leaderboard/${encodeURIComponent(levelId)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showStatus(statusId, 'error', `HTTP ${res.status}\n` + (data.error || JSON.stringify(data)));
      return;
    }
    showStatus(statusId, 'success', `關卡 ${data.levelId}，共 ${(data.records || []).length} 筆`);
    if (tableBody && Array.isArray(data.records)) {
      data.records.forEach((r) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${r.rank}</td><td>${escapeHtml(r.playerName)}</td><td>${r.steps}</td><td>${r.timestamp ? new Date(r.timestamp).toLocaleString() : '-'}</td>`;
        tableBody.appendChild(tr);
      });
      if (data.records.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="4" style="color:var(--text-dim)">暫無記錄</td>';
        tableBody.appendChild(tr);
      }
    }
  } catch (err) {
    showStatus(statusId, 'error', '請求失敗：' + err.message);
  }
}

async function submitTestRecord() {
  const base = getBaseUrl();
  const levelId = (document.getElementById('submitLevelId') && document.getElementById('submitLevelId').value.trim()) || '0';
  const playerName = (document.getElementById('submitPlayerName') && document.getElementById('submitPlayerName').value.trim()) || '測試玩家';
  const steps = (document.getElementById('submitSteps') && document.getElementById('submitSteps').value.trim()) || '21';
  const moves = (document.getElementById('submitMoves') && document.getElementById('submitMoves').value.trim()) || 'lruulldddurrrluurrddd';
  const statusId = 'submitStatus';
  if (!base) {
    showStatus(statusId, 'error', '請先輸入伺服器網址');
    return;
  }
  showStatus(statusId, 'pending', '提交中…');
  try {
    const res = await fetch(`${base}/api/leaderboard/${encodeURIComponent(levelId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName, steps: parseInt(steps, 10), moves }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      showStatus(statusId, 'success', `提交成功\n排名：${data.rank}，recordId：${data.recordId}`);
    } else {
      showStatus(statusId, 'error', (data.message || data.error || '提交失敗') + '\n' + JSON.stringify(data, null, 2));
    }
  } catch (err) {
    showStatus(statusId, 'error', '請求失敗：' + err.message);
  }
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function init() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const input = document.getElementById('serverUrl');
    if (input) input.value = saved;
  }

  const btnHealth = document.getElementById('btnHealth');
  if (btnHealth) btnHealth.addEventListener('click', checkHealth);

  const btnFetchLeaderboard = document.getElementById('btnFetchLeaderboard');
  if (btnFetchLeaderboard) btnFetchLeaderboard.addEventListener('click', fetchLeaderboard);

  const btnSubmit = document.getElementById('btnSubmit');
  if (btnSubmit) btnSubmit.addEventListener('click', submitTestRecord);

  setConnectionStatus(false, '未連線');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
