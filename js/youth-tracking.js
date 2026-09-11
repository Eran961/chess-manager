// ===== שחקני נוער — persistent tracking, goals & instructor notes =====
// Unlike "שחקני המועדון" (club-players.js, live lookup, nothing saved),
// this is a curated, persisted list: the admin picks specific players to
// follow over time, and we keep OUR OWN data about them (which age group,
// goals, instructor notes) in Firebase under youthTracking/{fedId} — while
// all their performance data (rating, tournaments, history) is still always
// pulled live from the federation via the exact same backend and dashboard
// components club-players.js already built, never duplicated/cached here.

const YOUTH_AGE_GROUPS = [
  { label: 'עד 6', max: 6 },
  { label: 'עד 8', max: 8 },
  { label: 'עד 10', max: 10 },
  { label: 'עד 12', max: 12 },
  { label: 'עד 14', max: 14 },
  { label: 'עד 18', max: 18 },
];

let _ytTracked = null;        // cached { [fedId]: {fedId, name, ageGroupMax, addedAt, lastRating, goals, notes} }
let _ytView = 'age-select';   // 'age-select' | 'list' | 'detail'
let _ytActiveAge = null;
let _ytActiveFedId = null;
let _ytOutsideClickBound = false;

function renderYouthTrackingPanel() {
  return `
    <div style="max-width:960px;color:#1a202c">
      <div class="att-card-header" style="border-radius:12px 12px 0 0">👦 שחקני נוער</div>
      <div style="background:white;box-shadow:0 1px 4px rgba(0,0,0,0.08);border-radius:0 0 12px 12px;padding:20px" id="yt-root">
        <div style="text-align:center;padding:40px;color:#a0aec0">⏳ טוען...</div>
      </div>
    </div>`;
}

async function initYouthTrackingTab() {
  if (_ytTracked) { renderYouthTracking(); return; }
  await loadYouthTracking();
}
window.initYouthTrackingTab = initYouthTrackingTab;

async function loadYouthTracking() {
  const root = document.getElementById('yt-root');
  if (!root) return;
  root.innerHTML = '<div style="text-align:center;padding:40px;color:#a0aec0">⏳ טוען...</div>';
  try {
    const snap = await db.ref('youthTracking').get();
    _ytTracked = snap.val() || {};
    renderYouthTracking();
  } catch (e) {
    root.innerHTML = `<div style="text-align:center;padding:40px;color:#c53030">❌ שגיאה בטעינה: ${e.message}</div>`;
  }
}

function renderYouthTracking() {
  const root = document.getElementById('yt-root');
  if (!root) return;
  if (_ytView === 'age-select') root.innerHTML = renderYtAgeSelect();
  else if (_ytView === 'list') root.innerHTML = renderYtPlayerList();
  else if (_ytView === 'detail') root.innerHTML = '<div style="text-align:center;padding:40px;color:#a0aec0">⏳ טוען נתוני שחקן...</div>';
}

function ytCountForAge(max) {
  return Object.values(_ytTracked || {}).filter(p => p.ageGroupMax === max).length;
}

function renderYtAgeSelect() {
  const rows = YOUTH_AGE_GROUPS.map(g => {
    const count = ytCountForAge(g.max);
    return `<button onclick="selectYtAgeGroup(${g.max})"
      style="background:white;border:2px solid #e2e8f0;border-radius:16px;padding:28px 20px;text-align:center;cursor:pointer;font-family:inherit"
      onmouseover="this.style.borderColor='#276749'" onmouseout="this.style.borderColor='#e2e8f0'">
      <div style="font-size:26px;font-weight:900;color:#276749">${g.label}</div>
      <div style="font-size:13px;color:#718096;margin-top:6px;font-weight:600">${count ? count + ' שחקנים במעקב' : 'אין שחקנים עדיין'}</div>
    </button>`;
  }).join('');
  return `
    <div style="font-size:15px;font-weight:700;color:#2d3748;margin-bottom:16px">בחר קבוצת גיל</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:14px">${rows}</div>`;
}

function selectYtAgeGroup(max) {
  _ytActiveAge = max;
  _ytView = 'list';
  renderYouthTracking();
}
window.selectYtAgeGroup = selectYtAgeGroup;

function backToYtAgeSelect() {
  _ytView = 'age-select';
  _ytActiveAge = null;
  renderYouthTracking();
}
window.backToYtAgeSelect = backToYtAgeSelect;

function renderYtPlayerList() {
  const group = YOUTH_AGE_GROUPS.find(g => g.max === _ytActiveAge);
  const players = Object.values(_ytTracked || {}).filter(p => p.ageGroupMax === _ytActiveAge)
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));
  const rows = players.map(p => `
    <div onclick="selectYtPlayer(${p.fedId})"
      style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;cursor:pointer"
      onmouseenter="this.style.background='#f7fafc'" onmouseleave="this.style.background=''">
      <span style="font-weight:700;color:#2d3748">${p.name}</span>
      <span style="font-size:12px;color:#718096">${p.lastRating ? 'מד כושר ' + p.lastRating : ''}</span>
    </div>`).join('');
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <button onclick="backToYtAgeSelect()" style="background:none;border:none;color:#276749;font-size:13px;font-weight:700;cursor:pointer">→ חזרה לבחירת גיל</button>
      <div style="font-size:15px;font-weight:800;color:#2d3748">${group ? group.label : ''}</div>
      <button onclick="openYtAddPlayer()" style="background:#276749;color:white;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer">+ הוסף שחקן למעקב</button>
    </div>
    ${players.length ? rows : '<div style="text-align:center;padding:40px;color:#a0aec0">אין שחקנים במעקב בקבוצת גיל זו עדיין</div>'}`;
}

function selectYtPlayer(fedId) {
  _ytActiveFedId = fedId;
  _ytView = 'detail';
  renderYouthTracking();
  loadYtPlayerDetail(fedId);
}
window.selectYtPlayer = selectYtPlayer;

function backToYtList() {
  _ytView = 'list';
  _ytActiveFedId = null;
  renderYouthTracking();
}
window.backToYtList = backToYtList;

// ── Add player (reuses the exact same club-roster search as שחקני המועדון) ──
function openYtAddPlayer() {
  const root = document.getElementById('yt-root');
  if (!root) return;
  root.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <button onclick="renderYouthTracking()" style="background:none;border:none;color:#276749;font-size:13px;font-weight:700;cursor:pointer">→ ביטול</button>
      <div style="font-size:15px;font-weight:800;color:#2d3748">הוספת שחקן למעקב</div>
      <span></span>
    </div>
    <div id="yt-add-search-wrap" style="position:relative;max-width:420px;margin:0 auto">
      <input id="yt-add-search" type="text" placeholder="🔍 חפש שחקן לפי שם..." autocomplete="off"
        oninput="onYtAddSearchInput(this.value)"
        style="width:100%;box-sizing:border-box;padding:11px 14px;border:2px solid #e2e8f0;border-radius:10px;font-size:15px;font-family:inherit">
      <div id="yt-add-search-results" style="display:none;position:absolute;top:calc(100% + 4px);right:0;left:0;background:white;border:1px solid #e2e8f0;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.12);max-height:320px;overflow-y:auto;z-index:20"></div>
    </div>
    <div id="yt-add-status" style="margin-top:10px;font-size:13px;color:#718096;text-align:center"></div>`;
  if (!_ytOutsideClickBound) {
    _ytOutsideClickBound = true;
    document.addEventListener('click', (e) => {
      const wrap = document.getElementById('yt-add-search-wrap');
      const results = document.getElementById('yt-add-search-results');
      if (wrap && results && !wrap.contains(e.target)) results.style.display = 'none';
    });
  }
  // Reuse the exact same cached club roster שחקני המועדון already loads —
  // same source data, restricted to the same club, no reason to fetch twice.
  loadClubPlayersRoster().then(() => {
    const statusEl = document.getElementById('yt-add-status');
    if (statusEl && _clubPlayersRoster) statusEl.textContent = `${_clubPlayersRoster.length} שחקני מועדון זמינים לחיפוש`;
  });
}
window.openYtAddPlayer = openYtAddPlayer;

function onYtAddSearchInput(val) {
  const resultsEl = document.getElementById('yt-add-search-results');
  if (!resultsEl) return;
  const q = (val || '').trim();
  if (!q) { resultsEl.style.display = 'none'; resultsEl.innerHTML = ''; return; }
  if (!_clubPlayersRoster) {
    resultsEl.style.display = 'block';
    resultsEl.innerHTML = '<div style="padding:10px 14px;color:#a0aec0;font-size:13px">עדיין טוען את רשימת השחקנים...</div>';
    return;
  }
  const matches = _clubPlayersRoster.filter(p => p.name && clubPlayerNameMatches(p.name, q)).slice(0, 10);
  resultsEl.style.display = 'block';
  if (!matches.length) {
    resultsEl.innerHTML = '<div style="padding:10px 14px;color:#a0aec0;font-size:13px">לא נמצאו שחקנים תואמים במועדון</div>';
    return;
  }
  resultsEl.innerHTML = matches.map(p => {
    const already = _ytTracked && _ytTracked[p.fedId];
    return `
    <div ${already ? '' : `onclick="addYtPlayer(${p.fedId},'${(p.name || '').replace(/'/g, "\\'")}')"`}
      style="padding:10px 14px;${already ? '' : 'cursor:pointer;'}border-bottom:1px solid #f0f4f8;display:flex;justify-content:space-between;align-items:center;gap:10px${already ? ';opacity:0.5' : ''}"
      ${already ? '' : `onmouseenter="this.style.background='#f7fafc'" onmouseleave="this.style.background=''"`}>
      <span style="font-weight:600;color:#2d3748">${p.name}</span>
      <span style="font-size:12px;color:#718096;white-space:nowrap">${already ? 'כבר במעקב' : (p.rating ? 'מד כושר ' + p.rating : '')}${!already && p.age != null ? ' · גיל ' + p.age : ''}</span>
    </div>`;
  }).join('');
}
window.onYtAddSearchInput = onYtAddSearchInput;

async function addYtPlayer(fedId, name) {
  const statusEl = document.getElementById('yt-add-status');
  if (statusEl) statusEl.textContent = '⏳ מוסיף למעקב...';
  try {
    const entry = { fedId, name, ageGroupMax: _ytActiveAge, addedAt: Date.now(), lastRating: null, goals: null, notes: null };
    await db.ref(`youthTracking/${fedId}`).set(entry);
    _ytTracked[fedId] = entry;
    _ytView = 'list';
    renderYouthTracking();
    showToast(`${name} נוסף למעקב ✅`);
  } catch (e) {
    if (statusEl) { statusEl.style.color = '#c53030'; statusEl.textContent = `❌ שגיאה: ${e.message}`; }
  }
}
window.addYtPlayer = addYtPlayer;

async function removeYtPlayer(fedId) {
  if (!confirm('להסיר את השחקן ממעקב? המטרות וההערות שנשמרו יימחקו.')) return;
  try {
    await db.ref(`youthTracking/${fedId}`).remove();
    delete _ytTracked[fedId];
    backToYtList();
    showToast('הוסר ממעקב');
  } catch (e) {
    showToast('שגיאה: ' + e.message, 'error');
  }
}
window.removeYtPlayer = removeYtPlayer;

// ── Player detail: live dashboard (reused from club-players.js) + goals/notes ──
async function loadYtPlayerDetail(fedId) {
  const root = document.getElementById('yt-root');
  if (!root) return;
  try {
    const res = await fetch(`${CLUB_PLAYERS_API}/api/player-profile?fedId=${fedId}`, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) throw new Error(`שגיאת שרת ${res.status}`);
    const data = await res.json();
    if (!data.name) throw new Error('שחקן לא נמצא');
    if (_ytTracked[fedId]) { _ytTracked[fedId].lastRating = data.rating || null; db.ref(`youthTracking/${fedId}/lastRating`).set(data.rating || null).catch(() => {}); }
    if (_ytView !== 'detail' || _ytActiveFedId !== fedId) return; // navigated away while loading
    root.innerHTML = renderYtPlayerDetail(data);
  } catch (e) {
    if (_ytView !== 'detail' || _ytActiveFedId !== fedId) return;
    root.innerHTML = `<div style="text-align:center;padding:50px;color:#c53030">❌ שגיאה בשליפת נתוני השחקן: ${e.message}</div>`;
  }
}

function renderYtPlayerDetail(profile) {
  const fedId = profile.fedId;
  const tracked = (_ytTracked && _ytTracked[fedId]) || {};
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <button onclick="backToYtList()" style="background:none;border:none;color:#276749;font-size:13px;font-weight:700;cursor:pointer">→ חזרה לרשימה</button>
      <button onclick="removeYtPlayer(${fedId})" style="background:#fff5f5;color:#c53030;border:1px solid #fed7d7;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer">🗑 הסר ממעקב</button>
    </div>
    ${renderClubPlayerDashboard(profile, 'yt', () => loadYtPlayerDetail(fedId))}
    ${renderYtGoalsSection(fedId, tracked.goals)}
    ${renderYtNotesSection(fedId, tracked.notes)}`;
}

// ── מטרות ומעקב ───────────────────────────────────────────────────────────
function renderYtGoalsSection(fedId, goals) {
  goals = goals || {};
  const profile = _cpGetState('yt').profile;
  const currentRating = profile ? profile.rating : null;
  let progressHtml = '';
  if (goals.targetRating && currentRating != null) {
    const startRating = goals.startRating != null ? goals.startRating : currentRating;
    const span = goals.targetRating - startRating;
    const done = currentRating - startRating;
    const pct = span !== 0 ? Math.max(0, Math.min(100, Math.round((done / span) * 100))) : (currentRating >= goals.targetRating ? 100 : 0);
    const remaining = goals.targetRating - currentRating;
    progressHtml = `
      <div style="margin-top:12px">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#718096;margin-bottom:4px">
          <span>${currentRating} (נוכחי)</span>
          <span>${goals.targetRating} (יעד)</span>
        </div>
        <div style="background:#f0f4f8;border-radius:8px;height:10px;overflow:hidden">
          <div style="background:${remaining <= 0 ? '#276749' : '#38a169'};height:100%;width:${pct}%;border-radius:8px"></div>
        </div>
        <div style="margin-top:6px;font-size:12px;font-weight:700;color:${remaining <= 0 ? '#276749' : '#4a5568'}">
          ${remaining <= 0 ? '🎉 היעד הושג!' : `נשארו ${remaining} נקודות ליעד (${pct}%)`}
        </div>
      </div>`;
  }
  return `
    <div style="background:white;border:1px solid #e2e8f0;border-radius:14px;padding:18px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:14px;font-weight:700;color:#2d3748">🎯 מטרות ומעקב</div>
        <button onclick="openYtGoalsEditor(${fedId})" style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer">✏️ עריכה</button>
      </div>
      ${goals.primary || goals.secondary || goals.targetRating ? `
        <div style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:#4a5568">
          ${goals.primary ? `<div><b>מטרה ראשית:</b> ${goals.primary}</div>` : ''}
          ${goals.secondary ? `<div><b>מטרה משנית:</b> ${goals.secondary}</div>` : ''}
          ${goals.targetDate ? `<div><b>יעד לתאריך:</b> ${formatDate ? formatDate(goals.targetDate) : goals.targetDate}</div>` : ''}
        </div>
        ${progressHtml}
      ` : `<div style="color:#a0aec0;font-size:13px;text-align:center;padding:10px">לא הוגדרו מטרות עדיין</div>`}
    </div>`;
}

function openYtGoalsEditor(fedId) {
  const existing = document.getElementById('yt-goals-popup');
  if (existing) { existing.remove(); return; }
  const g = (_ytTracked[fedId] && _ytTracked[fedId].goals) || {};
  const profile = _cpGetState('yt').profile;
  const S = 'width:100%;padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:inherit;box-sizing:border-box';
  const L = t => `<div style="font-size:11px;font-weight:700;color:#4a5568;margin-bottom:4px">${t}</div>`;
  const popup = document.createElement('div');
  popup.id = 'yt-goals-popup';
  popup.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;border-radius:14px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,0.3);z-index:9999;min-width:280px;max-width:340px;width:90vw;font-family:inherit;direction:rtl';
  popup.innerHTML = `
    <div style="font-size:14px;font-weight:700;color:#276749;margin-bottom:16px">🎯 מטרות ומעקב</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <div>${L('מטרה ראשית')}<input id="yt-g-primary" type="text" value="${(g.primary || '').replace(/"/g, '&quot;')}" placeholder="לדוגמה: להעלות מד כושר ב-100 נקודות" style="${S}"></div>
      <div>${L('מטרה משנית')}<input id="yt-g-secondary" type="text" value="${(g.secondary || '').replace(/"/g, '&quot;')}" placeholder="לדוגמה: להשתתף באליפות ישראל" style="${S}"></div>
      <div>${L('יעד מד כושר')}<input id="yt-g-targetRating" type="number" min="100" max="3000" value="${g.targetRating || ''}" placeholder="לדוגמה: 1500" style="${S};direction:ltr"></div>
      <div>${L('יעד לתאריך')}<input id="yt-g-targetDate" type="date" value="${g.targetDate || ''}" style="${S};direction:ltr"></div>
    </div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button onclick="saveYtGoals(${fedId})" style="flex:1;padding:10px;background:#276749;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">שמור</button>
      <button onclick="document.getElementById('yt-goals-popup')?.remove()" style="padding:10px 14px;background:#f7fafc;color:#718096;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">ביטול</button>
    </div>`;
  document.body.appendChild(popup);
  setTimeout(() => {
    const close = e => { if (!popup.contains(e.target)) { popup.remove(); document.removeEventListener('click', close); } };
    document.addEventListener('click', close);
  }, 50);
}
window.openYtGoalsEditor = openYtGoalsEditor;

async function saveYtGoals(fedId) {
  const primary = document.getElementById('yt-g-primary')?.value.trim() || null;
  const secondary = document.getElementById('yt-g-secondary')?.value.trim() || null;
  const tr = document.getElementById('yt-g-targetRating')?.value;
  const targetRating = tr ? parseInt(tr, 10) : null;
  const targetDate = document.getElementById('yt-g-targetDate')?.value || null;
  document.getElementById('yt-goals-popup')?.remove();
  // startRating anchors the progress bar to "where they were when the goal
  // was set" — only stamped once, the first time a target rating is saved,
  // so editing the goal later doesn't reset how much progress already shows.
  const existing = (_ytTracked[fedId] && _ytTracked[fedId].goals) || {};
  const profile = _cpGetState('yt').profile;
  const startRating = existing.startRating != null ? existing.startRating : (profile ? profile.rating : null);
  const data = { primary, secondary, targetRating, targetDate, startRating };
  try {
    await db.ref(`youthTracking/${fedId}/goals`).set(data);
    if (_ytTracked[fedId]) _ytTracked[fedId].goals = data;
    if (_ytView === 'detail' && _ytActiveFedId === fedId) loadYtPlayerDetail(fedId);
  } catch (e) {
    showToast('שגיאה: ' + e.message, 'error');
  }
}
window.saveYtGoals = saveYtGoals;

// ── הערות מדריך ───────────────────────────────────────────────────────────
function renderYtNotesSection(fedId, notes) {
  notes = notes || {};
  const hasAny = notes.clubGroup || notes.personalCoach || notes.motivation || notes.freeText;
  return `
    <div style="background:white;border:1px solid #e2e8f0;border-radius:14px;padding:18px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:14px;font-weight:700;color:#2d3748">📝 הערות מדריך</div>
        <button onclick="openYtNotesEditor(${fedId})" style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer">✏️ עריכה</button>
      </div>
      ${hasAny ? `
        <div style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:#4a5568">
          ${notes.clubGroup ? `<div><b>חוג במועדון:</b> ${notes.clubGroup}</div>` : ''}
          ${notes.personalCoach ? `<div><b>מאמן אישי:</b> ${notes.personalCoach}</div>` : ''}
          ${notes.motivation ? `<div><b>מוטיבציה:</b> ${notes.motivation}</div>` : ''}
          ${notes.freeText ? `<div style="white-space:pre-wrap">${notes.freeText}</div>` : ''}
        </div>
      ` : `<div style="color:#a0aec0;font-size:13px;text-align:center;padding:10px">אין הערות עדיין</div>`}
    </div>`;
}

function openYtNotesEditor(fedId) {
  const existing = document.getElementById('yt-notes-popup');
  if (existing) { existing.remove(); return; }
  const n = (_ytTracked[fedId] && _ytTracked[fedId].notes) || {};
  const S = 'width:100%;padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:inherit;background:white;box-sizing:border-box';
  const L = t => `<div style="font-size:11px;font-weight:700;color:#4a5568;margin-bottom:4px">${t}</div>`;
  const popup = document.createElement('div');
  popup.id = 'yt-notes-popup';
  popup.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;border-radius:14px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,0.3);z-index:9999;min-width:290px;max-width:360px;width:90vw;max-height:85vh;overflow-y:auto;font-family:inherit;direction:rtl';
  popup.innerHTML = `
    <div style="font-size:14px;font-weight:700;color:#2d3748;margin-bottom:16px">📝 הערות מדריך</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <div>${L('חוג במועדון')}<input id="yt-n-clubGroup" type="text" value="${(n.clubGroup || '').replace(/"/g, '&quot;')}" placeholder="לדוגמה: גיל 10 — יום ראשון 17:00" style="${S}"></div>
      <div>${L('מאמן אישי')}<input id="yt-n-personalCoach" type="text" value="${(n.personalCoach || '').replace(/"/g, '&quot;')}" placeholder="שם המאמן" style="${S}"></div>
      <div>${L('מוטיבציה לשחמט')}
        <select id="yt-n-motivation" style="${S}">
          <option value=""${!n.motivation ? ' selected' : ''}>לא הוגדר</option>
          <option value="גבוהה"${n.motivation === 'גבוהה' ? ' selected' : ''}>גבוהה ⬆</option>
          <option value="בינונית"${n.motivation === 'בינונית' ? ' selected' : ''}>בינונית ➡</option>
          <option value="נמוכה"${n.motivation === 'נמוכה' ? ' selected' : ''}>נמוכה ⬇</option>
        </select>
      </div>
      <div>${L('הערות חופשיות')}<textarea id="yt-n-freeText" rows="4" style="${S}">${(n.freeText || '').replace(/</g, '&lt;')}</textarea></div>
    </div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button onclick="saveYtNotes(${fedId})" style="flex:1;padding:10px;background:#553c9a;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">שמור</button>
      <button onclick="document.getElementById('yt-notes-popup')?.remove()" style="padding:10px 14px;background:#f7fafc;color:#718096;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">ביטול</button>
    </div>`;
  document.body.appendChild(popup);
  setTimeout(() => {
    const close = e => { if (!popup.contains(e.target)) { popup.remove(); document.removeEventListener('click', close); } };
    document.addEventListener('click', close);
  }, 50);
}
window.openYtNotesEditor = openYtNotesEditor;

async function saveYtNotes(fedId) {
  const data = {
    clubGroup: document.getElementById('yt-n-clubGroup')?.value.trim() || null,
    personalCoach: document.getElementById('yt-n-personalCoach')?.value.trim() || null,
    motivation: document.getElementById('yt-n-motivation')?.value || null,
    freeText: document.getElementById('yt-n-freeText')?.value.trim() || null,
  };
  document.getElementById('yt-notes-popup')?.remove();
  try {
    await db.ref(`youthTracking/${fedId}/notes`).set(data);
    if (_ytTracked[fedId]) _ytTracked[fedId].notes = data;
    if (_ytView === 'detail' && _ytActiveFedId === fedId) loadYtPlayerDetail(fedId);
  } catch (e) {
    showToast('שגיאה: ' + e.message, 'error');
  }
}
window.saveYtNotes = saveYtNotes;
