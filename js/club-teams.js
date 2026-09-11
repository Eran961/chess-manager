// ===== LEAGUES TAB (לשונית ליגות) =====

const DIV_STYLES = {
  'לאומית': { grad: 'linear-gradient(135deg,#1a1a2e,#0f3460)', accent: '#f0c040', light: '#fffbeb' },
  'עילית':  { grad: 'linear-gradient(135deg,#134e4a,#0f766e)', accent: '#5eead4', light: '#f0fdfa' },
  'ארצית':  { grad: 'linear-gradient(135deg,#0d1f3c,#1a4a8a)', accent: '#93c5fd', light: '#eff6ff' },
  'מחוזית': { grad: 'linear-gradient(135deg,#7c2d12,#9a3412)', accent: '#fdba74', light: '#fff7ed' },
  'א':      { grad: 'linear-gradient(135deg,#14532d,#166534)', accent: '#86efac', light: '#f0fff4' },
  'ב':      { grad: 'linear-gradient(135deg,#3b0764,#4c1d95)', accent: '#c4b5fd', light: '#f5f3ff' },
  'ג':      { grad: 'linear-gradient(135deg,#7f1d1d,#991b1b)', accent: '#fca5a5', light: '#fff5f5' },
};
const DEFAULT_STYLE = { grad: 'linear-gradient(135deg,#2d3748,#4a5568)', accent: '#e2e8f0', light: '#f7fafc' };

function buildSingleTypeSection(type) {

  const teams = _clubTeams.filter(t => (t.type || 'בוגרים') === type);
  const byDiv = {};
  teams.forEach(t => {
    const d = t.division || 'אחר';
    if (!byDiv[d]) byDiv[d] = [];
    byDiv[d].push({ ...t, idx: _clubTeams.indexOf(t) });
  });
  const TYPE_DIV_ORDER = { 'בוגרים': ['לאומית','ארצית','א','ב','ג'], 'נוער': ['עילית','ארצית','מחוזית'], 'נשים': ['עילית','ארצית'] };
  const baseDivOrder = TYPE_DIV_ORDER[type] || DIV_ORDER;
  const divOrder = [...baseDivOrder, ...Object.keys(byDiv).filter(k => !baseDivOrder.includes(k))];

  if (teams.length === 0) {
    return `
      <div style="max-width:640px;padding:60px 20px;text-align:center">
        <div style="font-size:52px;margin-bottom:16px;opacity:.4">♟</div>
        <div style="font-size:16px;font-weight:700;color:#4a5568;margin-bottom:6px">אין קבוצות ${type} כרגע</div>
        <div style="font-size:13px;color:#a0aec0;margin-bottom:24px">לחץ "סנכרן כל הקבוצות מהאיגוד" בראש העמוד</div>
      </div>`;
  }

  const sectionsHTML = divOrder.filter(d => byDiv[d]).map(divName => {
    const s = DIV_STYLES[divName] || DEFAULT_STYLE;
    const divTeams = byDiv[divName];
    const cardsHTML = divTeams.map(t => {
      return `
        <div onclick="openTeamDetail(${t.idx})"
          style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:white;border-radius:12px;margin-bottom:8px;border:1.5px solid #e2e8f0;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.05)"
          onmouseenter="this.style.borderColor='#93c5fd';this.style.boxShadow='0 4px 14px rgba(59,130,246,.15)';this.style.transform='translateY(-1px)'"
          onmouseleave="this.style.borderColor='#e2e8f0';this.style.boxShadow='0 1px 4px rgba(0,0,0,0.05)';this.style.transform=''">
          <div style="display:flex;align-items:center;gap:13px">
            <div style="width:42px;height:42px;border-radius:11px;background:${s.grad};display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">♟</div>
            <div>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <span style="font-size:15px;font-weight:700;color:#1a202c">${t.name}</span>
                ${t.captain ? `<span style="font-size:12px;color:#718096;font-weight:500">· 👤 ${t.captain}</span>` : ''}
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            ${t.teamId ? `<span style="background:#eff6ff;color:#3b82f6;border-radius:6px;padding:3px 8px;font-size:11px;font-weight:700">#${t.teamId}</span>` : ''}
            <span style="color:#cbd5e0;font-size:22px;font-weight:300">›</span>
          </div>
        </div>`;
    }).join('');

    return `
      <div style="margin-bottom:22px">
        <div style="border-radius:12px 12px 0 0;padding:13px 20px;background:${s.grad}">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div style="font-size:15px;font-weight:800;color:${s.accent};letter-spacing:.3px">ליגה ${divName}</div>
            <span style="background:rgba(255,255,255,0.12);border-radius:20px;padding:3px 11px;font-size:12px;color:rgba(255,255,255,0.75)">${divTeams.length} קבוצות</span>
          </div>
        </div>
        <div style="background:${s.light};border:1.5px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:12px">
          ${cardsHTML}
        </div>
      </div>`;
  }).join('');

  const seasonYear = teams.find(t => t.season)?.season || 2026; // detected from the last sync; 2026 only as a pre-sync placeholder
  const youthDivisionSync = type === 'נוער' ? `
    <div id="youth-div-sync-bar" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">
      ${['עילית','ארצית','מחוזית'].map(d => `
        <button id="btn-sync-youth-${d}" onclick="syncYouthDivisionTeams('${d}')"
          style="background:${(DIV_STYLES[d]||DEFAULT_STYLE).grad};color:white;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
          🔄 סנכרן ליגת ${d}
        </button>`).join('')}
      <span id="youth-div-sync-status" style="font-size:12px;color:#718096;align-self:center"></span>
    </div>` : '';

  return `
    <div style="max-width:640px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div>
          <div style="font-size:20px;font-weight:800;color:#1a202c">${type} <span style="font-size:14px;font-weight:600;color:#a0aec0">· עונת ${seasonYear}</span></div>
          <div style="font-size:13px;color:#718096;margin-top:2px">${teams.length} קבוצות פעילות</div>
        </div>
      </div>
      ${youthDivisionSync}
      ${sectionsHTML}
      <details style="margin-top:6px">
        <summary style="font-size:12px;color:#a0aec0;cursor:pointer;user-select:none;padding:6px 0">+ הוסף קבוצה ידנית</summary>
        <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
          <input id="new-team-input-${type}" type="text" placeholder="שם הקבוצה"
            style="flex:2;min-width:120px;padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:inherit"
            onkeydown="if(event.key==='Enter')addClubTeamManualTyped('${type}')">
          <select id="new-team-div-${type}" style="flex:1;min-width:90px;padding:8px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:inherit">
            ${baseDivOrder.map(d=>`<option value="${d}">ליגה ${d}</option>`).join('')}
          </select>
          <button onclick="addClubTeamManualTyped('${type}')"
            style="background:#276749;color:white;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">הוסף</button>
        </div>
      </details>
    </div>`;
}

function renderLeagueTypePanels() {
  [['בוגרים','lteams-בוגרים'], ['נשים','lteams-נשים'], ['נוער','lteams-נוער']].forEach(([type, elId]) => {
    const el = document.getElementById(elId);
    if (el) el.innerHTML = buildSingleTypeSection(type);
  });
  const dl = document.getElementById('datalist-club-teams');
  if (dl) dl.innerHTML = _clubTeams.map(t => `<option value="${t.name}">`).join('');
}

// Pull the club's team roster for ONE youth division (עילית/ארצית/מחוזית) from the
// federation and merge it in — only teams in that division get replaced, everything
// else in _clubTeams (other divisions/types) is left untouched. Each division has its
// own button so a sync never mixes in teams from a different league by mistake.
async function syncYouthDivisionTeams(division) {
  const btn = document.getElementById(`btn-sync-youth-${division}`);
  const statusEl = document.getElementById('youth-div-sync-status');
  const origText = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = '⏳ טוען...'; }
  if (statusEl) { statusEl.textContent = ''; statusEl.style.color = '#718096'; }
  try {
    const res = await fetch('https://chess-manager-7wkr.onrender.com/api/club-teams?clubId=31', { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`שגיאת שרת ${res.status}`);
    const all = await res.json();
    const matching = all.filter(t => t.type === 'נוער' && t.division === division);
    if (!matching.length) throw new Error(`לא נמצאו קבוצות נוער בליגה ${division}`);

    // Merge: drop any existing נוער/division teams, keep everything else, add the fresh ones.
    _clubTeams = _clubTeams.filter(t => !(t.type === 'נוער' && t.division === division)).concat(matching);
    await db.ref('clubTeams').set(_clubTeams);

    const seasonNote = matching[0]?.season ? ` (עונת ${matching[0].season})` : '';
    if (btn) { btn.style.background = '#276749'; btn.textContent = '✅ הצליח'; }
    if (statusEl) { statusEl.textContent = `${matching.length} קבוצות נטענו לליגת ${division}${seasonNote}`; statusEl.style.color = '#276749'; }
    showToast(`✅ ${matching.length} קבוצות נוער (${division})${seasonNote} נטענו`, 'success');
    renderLeagueTypePanels();
  } catch(e) {
    if (btn) { btn.style.background = '#c53030'; btn.textContent = '❌ נכשל'; }
    if (statusEl) { statusEl.textContent = e.message; statusEl.style.color = '#c53030'; }
    showToast('❌ שגיאה: ' + e.message, 'error');
  } finally {
    setTimeout(() => {
      if (!btn) return;
      btn.disabled = false; btn.textContent = origText;
      btn.style.background = (DIV_STYLES[division]||DEFAULT_STYLE).grad;
    }, 2500);
  }
}
window.syncYouthDivisionTeams = syncYouthDivisionTeams;

async function addClubTeamManualTyped(type) {
  const inp = document.getElementById(`new-team-input-${type}`);
  const divEl = document.getElementById(`new-team-div-${type}`);
  const name = inp?.value?.trim();
  if (!name) return;
  if (_clubTeams.some(t => t.name === name)) { showToast('קבוצה זו כבר קיימת', 'error'); return; }
  _clubTeams = [..._clubTeams, { name, type, division: divEl?.value || '' }];
  await db.ref('clubTeams').set(_clubTeams);
  if (inp) inp.value = '';
  renderLeagueTypePanels();
  showToast('נוסף', 'success');
}

// ── Team detail modal ──────────────────────────────────────────────────────────

let _detailTeam = null;

function openTeamDetail(teamIdx) {
  _detailTeam = _clubTeams[teamIdx];
  if (!_detailTeam) return;
  const team = _detailTeam;

  let modal = document.getElementById('team-detail-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'team-detail-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:none;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';
    modal.innerHTML = `
      <div style="background:#f7fafc;border-radius:16px;width:100%;max-width:680px;max-height:90vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,0.35)">
        <div style="background:linear-gradient(135deg,#0d1f3c,#1a4a8a);padding:20px 24px;display:flex;align-items:flex-start;justify-content:space-between;flex-shrink:0">
          <div>
            <div id="tdm-title" style="font-size:20px;font-weight:800;color:white;line-height:1.2"></div>
            <div id="tdm-sub" style="font-size:12px;color:rgba(255,255,255,0.55);margin-top:5px"></div>
          </div>
          <button onclick="closeTeamDetail()" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);color:white;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:14px;font-family:inherit;flex-shrink:0;margin-top:2px">✕</button>
        </div>
        <div style="display:flex;border-bottom:2px solid #e2e8f0;padding:0 20px;background:white;flex-shrink:0">
          <button id="tdtab-schedule" onclick="switchTeamDetailTab('schedule')"
            style="padding:13px 20px;border:none;background:none;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;border-bottom:3px solid #2b6cb0;color:#2b6cb0;margin-bottom:-2px;white-space:nowrap">
            📅 לוח משחקים</button>
          <button id="tdtab-players" onclick="switchTeamDetailTab('players')"
            style="padding:13px 20px;border:none;background:none;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;border-bottom:3px solid transparent;color:#718096;margin-bottom:-2px;white-space:nowrap">
            👥 שחקנים</button>
        </div>
        <div style="overflow-y:auto;flex:1">
          <div id="tdpanel-schedule" style="padding:20px"></div>
          <div id="tdpanel-players" style="display:none;padding:20px"></div>
        </div>
      </div>`;
    modal.addEventListener('click', e => { if (e.target === modal) closeTeamDetail(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeTeamDetail(); });
    document.body.appendChild(modal);
  }

  document.getElementById('tdm-title').textContent = team.name;
  const subParts = [`ליגה ${team.division}`, team.type];
  if (team.captain) subParts.push(`קפטן: ${team.captain}`);
  document.getElementById('tdm-sub').textContent = subParts.join('  ·  ');

  // Reset panels
  const sp = document.getElementById('tdpanel-schedule');
  const pp = document.getElementById('tdpanel-players');
  if (sp) sp.innerHTML = '';
  if (pp) { pp.innerHTML = ''; pp.dataset.loaded = ''; pp.style.display = 'none'; }
  switchTeamDetailTab('schedule');

  modal.style.display = 'flex';
  // Load both tabs in parallel — players in background so it's ready when user switches
  loadTeamScheduleDetail(team);
  loadTeamPlayersDetail(team);
}

function closeTeamDetail() {
  const modal = document.getElementById('team-detail-modal');
  if (modal) modal.style.display = 'none';
  _detailTeam = null;
}

function switchTeamDetailTab(tab) {
  ['schedule','players'].forEach(id => {
    const btn = document.getElementById(`tdtab-${id}`);
    const panel = document.getElementById(`tdpanel-${id}`);
    const active = id === tab;
    if (btn) { btn.style.borderBottomColor = active ? '#2b6cb0' : 'transparent'; btn.style.color = active ? '#2b6cb0' : '#718096'; }
    if (panel) panel.style.display = active ? 'block' : 'none';
  });
  if (tab === 'players' && _detailTeam) loadTeamPlayersDetail(_detailTeam);
}

async function loadTeamScheduleDetail(team) {
  const el = document.getElementById('tdpanel-schedule');
  if (!el) return;
  if (!team.teamId) {
    el.innerHTML = `<div style="text-align:center;padding:40px;color:#a0aec0;font-size:14px">אין מזהה קבוצה — לא ניתן לשלוף מהאיגוד</div>`;
    return;
  }
  el.innerHTML = `<div style="text-align:center;padding:36px;color:#718096">⏳ טוען...</div>`;
  try {
    const snap = await db.ref(`teamRoundsCache/${team.teamId}`).get();
    const cached = snap.val();
    if (cached?.rounds?.length) {
      el.innerHTML = renderTeamScheduleHTML(cached.rounds, team);
      return;
    }
  } catch(e) {}
  el.innerHTML = `
    <div style="text-align:center;padding:40px 20px">
      <div style="font-size:14px;color:#718096;margin-bottom:18px">אין נתונים מהאיגוד עדיין</div>
      <button onclick="fetchAndShowTeamSchedule(${team.teamId})"
        style="background:#2b6cb0;color:white;border:none;border-radius:10px;padding:11px 26px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">
        📥 טען לוח משחקים מהאיגוד</button>
    </div>`;
}

async function fetchAndShowTeamSchedule(teamId) {
  const team = _clubTeams.find(t => t.teamId === teamId);
  if (!team) return;
  const el = document.getElementById('tdpanel-schedule');
  if (!el) return;
  el.innerHTML = `<div style="text-align:center;padding:36px;color:#718096">⏳ שולף מהאיגוד...</div>`;
  try {
    const res = await fetch('https://chess-manager-7wkr.onrender.com/api/team-rounds-stream', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teams: [team] })
    });
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let rounds = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of decoder.decode(value).split('\n')) {
        if (!line.startsWith('data: ')) continue;
        try { const d = JSON.parse(line.slice(6)); if (d.rounds?.length) rounds = d.rounds; } catch(e) {}
      }
    }
    if (rounds.length) {
      el.innerHTML = renderTeamScheduleHTML(rounds, team);
    } else {
      el.innerHTML = `<div style="text-align:center;padding:36px;color:#a0aec0;font-size:14px">לא נמצאו משחקים לקבוצה זו</div>`;
    }
  } catch(e) {
    el.innerHTML = `<div style="text-align:center;padding:36px;color:#c53030;font-size:14px">שגיאה: ${e.message}</div>`;
  }
}

function renderTeamScheduleHTML(rounds, team) {
  const today = new Date().toISOString().split('T')[0];
  const toIso = d => { if (!d) return ''; const [dd,mm,yyyy] = d.split('/'); return `${yyyy}-${mm}-${dd}`; };
  const sorted = [...rounds].sort((a,b) => toIso(a.matchDate).localeCompare(toIso(b.matchDate)));

  const played = rounds.filter(r => r.isPlayed);
  const wins = played.filter(r => { const h = r.homeTeam===team.name; return h ? r.homeScore>r.awayScore : r.awayScore>r.homeScore; }).length;
  const losses = played.filter(r => { const h = r.homeTeam===team.name; return h ? r.homeScore<r.awayScore : r.awayScore<r.homeScore; }).length;
  const draws = played.length - wins - losses;

  const statsHTML = played.length > 0 ? `
    <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap">
      <div style="flex:1;min-width:70px;background:#f0fff4;border:1.5px solid #9ae6b4;border-radius:12px;padding:12px;text-align:center">
        <div style="font-size:26px;font-weight:900;color:#276749">${wins}</div>
        <div style="font-size:11px;color:#38a169;font-weight:700;margin-top:2px">ניצחונות</div>
      </div>
      <div style="flex:1;min-width:70px;background:#fff5f5;border:1.5px solid #fed7d7;border-radius:12px;padding:12px;text-align:center">
        <div style="font-size:26px;font-weight:900;color:#c53030">${losses}</div>
        <div style="font-size:11px;color:#e53e3e;font-weight:700;margin-top:2px">הפסדים</div>
      </div>
      <div style="flex:1;min-width:70px;background:#f3f0ff;border:1.5px solid #d6bcfa;border-radius:12px;padding:12px;text-align:center">
        <div style="font-size:26px;font-weight:900;color:#6b46c1">${draws}</div>
        <div style="font-size:11px;color:#805ad5;font-weight:700;margin-top:2px">תיקו</div>
      </div>
      <div style="flex:1;min-width:70px;background:#ebf8ff;border:1.5px solid #bee3f8;border-radius:12px;padding:12px;text-align:center">
        <div style="font-size:26px;font-weight:900;color:#2b6cb0">${played.length}</div>
        <div style="font-size:11px;color:#3182ce;font-weight:700;margin-top:2px">סה"כ שוחק</div>
      </div>
    </div>` : '';

  const rowsHTML = sorted.map(r => {
    const iso = toIso(r.matchDate);
    const isHome = r.homeTeam === team.name;
    const opponent = isHome ? r.awayTeam : r.homeTeam;
    const venue = isHome
      ? `<span style="background:#f0fff4;color:#276749;border-radius:5px;padding:2px 7px;font-size:10px;font-weight:700">🏠 בית</span>`
      : `<span style="background:#eff6ff;color:#2b6cb0;border-radius:5px;padding:2px 7px;font-size:10px;font-weight:700">✈️ חוץ</span>`;

    let scoreHTML;
    if (r.isPlayed) {
      const myScore = isHome ? r.homeScore : r.awayScore;
      const oppScore = isHome ? r.awayScore : r.homeScore;
      const won = myScore > oppScore, lost = myScore < oppScore;
      const [bg, clr] = won ? ['#f0fff4','#276749'] : lost ? ['#fff5f5','#c53030'] : ['#f3f0ff','#6b46c1'];
      scoreHTML = `<div style="background:${bg};color:${clr};border-radius:8px;padding:5px 12px;font-size:14px;font-weight:900;white-space:nowrap;min-width:60px;text-align:center">${r.homeScore}–${r.awayScore}</div>`;
    } else {
      const isPast = iso && iso < today;
      scoreHTML = isPast
        ? `<div style="background:#fff5f5;color:#c53030;border-radius:8px;padding:5px 10px;font-size:10px;font-weight:700;white-space:nowrap">טרם הוזנה תוצאה</div>`
        : `<div style="background:#fffff0;color:#b7791f;border-radius:8px;padding:5px 10px;font-size:10px;font-weight:700;white-space:nowrap">טרם שוחק</div>`;
    }

    return `
      <div style="display:flex;align-items:center;gap:12px;padding:13px 16px;background:white;border-radius:11px;margin-bottom:8px;border:1.5px solid #e2e8f0">
        <div style="min-width:95px;flex-shrink:0">
          <div style="font-size:13px;font-weight:700;color:#2d3748">${r.matchDate || '—'}</div>
          <div style="font-size:11px;color:#a0aec0;margin-top:2px">סיבוב ${r.roundNumber ?? '?'}</div>
        </div>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            ${venue}
            <span style="font-size:13px;color:#2d3748;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${opponent}</span>
          </div>
        </div>
        ${scoreHTML}
      </div>`;
  }).join('');

  return statsHTML + (rowsHTML || `<div style="text-align:center;padding:24px;color:#a0aec0">אין משחקים</div>`);
}

async function loadTeamPlayersDetail(team) {
  const el = document.getElementById('tdpanel-players');
  if (!el) return;
  if (el.dataset.loaded === team.teamId?.toString()) return; // already loaded for this team

  if (!team.teamId) {
    el.innerHTML = `<div style="text-align:center;padding:40px;color:#a0aec0;font-size:14px">אין מזהה קבוצה</div>`;
    return;
  }

  el.innerHTML = `<div style="text-align:center;padding:36px;color:#718096">⏳ טוען שחקנים...</div>`;

  // Check Firebase cache first
  try {
    const snap = await db.ref(`teamPlayersCache/${team.teamId}`).get();
    const cached = snap.val();
    // v5: also reject caches where any player has position 999 (unmatched names from old bug)
    const hasPlayedData = cached?.players?.some(p => p.games > 0);
    const hasUnmatched = cached?.players?.some(p => p.position === 999);
    if (cached?.players?.length && cached.players[0]?.position !== undefined && hasPlayedData && !hasUnmatched) {
      el.innerHTML = renderPlayerStatsHTML(cached.players, cached.rounds);
      el.dataset.loaded = team.teamId.toString();
      return;
    }
  } catch(e) {}

  // Not cached — fetch automatically
  await fetchAndCacheTeamPlayers(team.teamId);
}

async function fetchAndCacheTeamPlayers(teamId) {
  const team = _clubTeams.find(t => t.teamId === teamId);
  if (!team) return;
  const el = document.getElementById('tdpanel-players');
  if (!el) return;

  el.innerHTML = `<div style="text-align:center;padding:36px;color:#718096">⏳ שולף מהאיגוד... (עשוי לקחת עד 30 שניות)</div>`;

  try {
    const res = await fetch('https://chess-manager-7wkr.onrender.com/api/team-players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: team.teamId, teamName: team.name, type: team.type || 'בוגרים', division: team.division || '' }),
      signal: AbortSignal.timeout(60000)
    });
    if (!res.ok) throw new Error(`שגיאת שרת ${res.status}`);
    const data = await res.json();

    if (!data.players?.length) {
      el.innerHTML = `<div style="text-align:center;padding:36px;color:#a0aec0;font-size:14px">לא נמצאו נתוני שחקנים (ייתכן שתוצאות הלוח אינן מוזנות)</div>`;
      return;
    }

    // Save to Firebase permanently (no TTL — season is over)
    await db.ref(`teamPlayersCache/${teamId}`).set({ players: data.players, rounds: data.rounds, ts: Date.now() });

    el.innerHTML = renderPlayerStatsHTML(data.players, data.rounds);
    el.dataset.loaded = teamId.toString();
  } catch(e) {
    el.innerHTML = `
      <div style="text-align:center;padding:36px">
        <div style="color:#c53030;margin-bottom:16px;font-size:14px">שגיאה: ${e.message}</div>
        <button onclick="fetchAndCacheTeamPlayers(${teamId})"
          style="background:#c53030;color:white;border:none;border-radius:8px;padding:9px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">נסה שוב</button>
      </div>`;
  }
}

function renderPlayerStatsHTML(players, totalRounds) {
  const rows = players.map((p) => {
    const played = p.games > 0;
    const pts = played ? (p.points % 1 === 0 ? p.points : p.points.toFixed(1)) : '—';
    const pct = played ? (p.points / p.games) * 100 : 0;
    const pos = p.position && p.position < 999 ? p.position : null;
    return `
      <div style="background:${played ? 'white' : '#f9fafb'};border-radius:12px;padding:14px 16px;margin-bottom:8px;border:1.5px solid ${played ? '#e2e8f0' : '#edf2f7'}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${played ? '10px' : '0'}">
          <div style="min-width:0">
            ${pos ? `<div style="font-size:11px;font-weight:700;color:#a0aec0;margin-bottom:3px">${pos}.</div>` : ''}
            <div style="font-size:15px;font-weight:700;color:${played ? '#1a202c' : '#a0aec0'}">${p.name}</div>
            ${!played ? `<div style="font-size:11px;color:#cbd5e0;margin-top:2px">לא שיחק</div>` : ''}
          </div>
          ${played ? `
          <div style="background:#ebf8ff;border:2px solid #bee3f8;border-radius:10px;padding:6px 14px;text-align:center;flex-shrink:0">
            <div style="font-size:22px;font-weight:900;color:#1a4a8a;line-height:1">${pts}</div>
            <div style="font-size:11px;color:#4a90d9;font-weight:600;margin-top:2px">מתוך ${p.games}</div>
          </div>` : ''}
        </div>
        ${played ? `
        <div style="display:flex;gap:6px;margin-bottom:8px">
          <span style="flex:1;text-align:center;background:#f0fff4;color:#276749;border-radius:7px;padding:5px 0;font-size:13px;font-weight:700">✓ ${p.wins}</span>
          <span style="flex:1;text-align:center;background:#f3f0ff;color:#6b46c1;border-radius:7px;padding:5px 0;font-size:13px;font-weight:700">½ ${p.draws}</span>
          <span style="flex:1;text-align:center;background:#fff5f5;color:#c53030;border-radius:7px;padding:5px 0;font-size:13px;font-weight:700">✗ ${p.losses}</span>
        </div>
        <div style="background:#edf2f7;border-radius:4px;height:6px;overflow:hidden">
          <div style="background:linear-gradient(90deg,#3b82f6,#1a4a8a);height:100%;width:${pct.toFixed(1)}%;border-radius:4px"></div>
        </div>` : ''}
      </div>`;
  }).join('');

  return `
    <div style="margin-bottom:16px;padding:12px 16px;background:#ebf8ff;border-radius:10px;border:1.5px solid #bee3f8">
      <div style="font-size:12px;color:#2b6cb0;font-weight:700">${players.length} שחקנים · ${totalRounds} סיבובים</div>
    </div>
    ${rows}`;
}

let _syncAbort = false;
let _syncRunning = false;

async function syncAllTeamsData(type) {
  const suffix = type === 'בוגרים' ? 'adults' : type === 'נשים' ? 'women' : 'youth';
  const btn = document.getElementById(`btn-sync-${suffix}`);
  const statusEl = document.getElementById(`sync-status-${suffix}`);
  const setStatus = (text, color='#718096') => { if (statusEl) { statusEl.textContent = text; statusEl.style.color = color; } };

  // If running — cancel
  if (_syncRunning) {
    _syncAbort = true;
    if (btn) { btn.textContent = '⏳ מבטל...'; btn.disabled = true; }
    return;
  }

  const teams = _clubTeams.filter(t => t.teamId && t.type === type);
  if (!teams.length) { showToast('אין קבוצות — סנכרן קבוצות מהאיגוד תחילה'); return; }

  _syncAbort = false;
  _syncRunning = true;
  if (btn) { btn.textContent = '⏹ עצור סנכרון'; btn.style.background = '#c53030'; btn.disabled = false; }

  let done = 0, failed = 0;
  const total = teams.length;
  setStatus(`0/${total} קבוצות...`);

  async function syncOne(team) {
    if (_syncAbort) return;
    try {
      const pr = await fetch('https://chess-manager-7wkr.onrender.com/api/team-players', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({teamId: team.teamId, teamName: team.name, type: team.type||'בוגרים', division: team.division||''})
      });
      if (pr.ok) {
        const pd = await pr.json();
        await db.ref(`teamPlayersCache/${team.teamId}`).set({players: pd.players, rounds: pd.rounds, ts: Date.now()});
        if (pd.captain) {
          const idx = _clubTeams.findIndex(t => t.teamId === team.teamId);
          if (idx >= 0) {
            _clubTeams[idx].captain = pd.captain;
            await db.ref(`clubTeams/${idx}/captain`).set(pd.captain);
          }
        }
      }
      if (_syncAbort) return;
      const sr = await fetch('https://chess-manager-7wkr.onrender.com/api/team-rounds-stream', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({teams: [team]})
      });
      const reader = sr.body.getReader(); const dec = new TextDecoder(); let rounds = [];
      while (true) {
        const {done: d, value} = await reader.read(); if (d) break;
        for (const line of dec.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try { const obj = JSON.parse(line.slice(6)); if (obj.rounds?.length) rounds = obj.rounds; } catch(e) {}
        }
      }
      if (rounds.length) await db.ref(`teamRoundsCache/${team.teamId}`).set({rounds, ts: Date.now()});
      done++;
    } catch(e) { failed++; done++; }
    setStatus(`${done}/${total} קבוצות...`);
  }

  const CONCURRENCY = 4;
  for (let i = 0; i < teams.length; i += CONCURRENCY) {
    if (_syncAbort) break;
    await Promise.all(teams.slice(i, i + CONCURRENCY).map(syncOne));
  }

  _syncRunning = false;
  const cancelled = _syncAbort;
  if (btn) { btn.textContent = `🔄 סנכרן קבוצות ${type} מהאיגוד`; btn.style.background = ''; btn.disabled = false; }
  if (cancelled) {
    setStatus(`⚠️ בוטל — ${done} קבוצות סונכרנו`, '#d69e2e');
  } else {
    setStatus(`✅ הושלם — ${total - failed} קבוצות${failed ? ` (${failed} נכשלו)` : ''}`, '#276749');
  }
  setTimeout(() => setStatus(''), 5000);
}

async function loadLeagueStars() {
  const el = document.getElementById('league-stars-content');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:40px;color:#718096">⏳ טוען...</div>';
  try {
    const snap = await db.ref('teamPlayersCache').get();
    const allCache = snap.val() || {};
    const TYPE_DIV_ORDER = { 'בוגרים': ['לאומית','ארצית','א','ב','ג'], 'נוער': ['עילית','ארצית','מחוזית'], 'נשים': ['עילית','ארצית'] };
    const TYPE_ORDER = ['בוגרים', 'נוער', 'נשים'];
    const grouped = {};
    TYPE_ORDER.forEach(t => { grouped[t] = {}; });
    _clubTeams.forEach(team => {
      if (!team.teamId) return;
      const cached = allCache[team.teamId];
      if (!cached?.players?.length) return;
      const type = team.type || 'בוגרים';
      const div = team.division || 'אחר';
      if (!grouped[type]) grouped[type] = {};
      if (!grouped[type][div]) grouped[type][div] = [];
      cached.players.forEach(p => {
        if (p.games >= 6 && p.points / p.games >= 0.6)
          grouped[type][div].push({ ...p, teamName: team.name, division: div, type });
      });
    });
    let html = '';
    const TYPE_ICONS = { 'בוגרים': '♟', 'נוער': '🎓', 'נשים': '♛' };
    for (const type of TYPE_ORDER) {
      const baseDivs = TYPE_DIV_ORDER[type] || [];
      const allDivs = Object.keys(grouped[type] || {});
      const orderedDivs = [...baseDivs.filter(d => allDivs.includes(d)), ...allDivs.filter(d => !baseDivs.includes(d))];
      const anyStars = orderedDivs.some(d => grouped[type][d]?.length);
      if (!anyStars) continue;
      html += `<div style="margin-bottom:32px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;padding-bottom:10px;border-bottom:2px solid #e2e8f0">
          <span style="font-size:22px">${TYPE_ICONS[type]}</span>
          <span style="font-size:20px;font-weight:800;color:#1a202c">${type}</span>
        </div>`;
      for (const div of orderedDivs) {
        const stars = grouped[type][div];
        if (!stars?.length) continue;
        stars.sort((a, b) => (b.points / b.games) - (a.points / a.games) || b.points - a.points);
        html += `<div style="margin-bottom:20px">
          <div style="font-size:12px;font-weight:700;color:#718096;margin-bottom:10px;letter-spacing:.5px;text-transform:uppercase">ליגה ${div}</div>`;
        stars.forEach((p, i) => {
          const pct = Math.round((p.points / p.games) * 100);
          const pts = p.points % 1 === 0 ? p.points : p.points.toFixed(1);
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `<span style="font-size:12px;color:#a0aec0;font-weight:700;min-width:22px;text-align:center">${i+1}</span>`;
          html += `<div style="display:flex;align-items:center;gap:12px;padding:11px 14px;background:white;border-radius:11px;margin-bottom:7px;border:1.5px solid #e2e8f0">
            <div style="font-size:20px;min-width:28px;text-align:center">${medal}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:14px;font-weight:700;color:#1a202c">${p.name}</div>
              <div style="font-size:11px;color:#718096;margin-top:2px">${p.teamName}</div>
            </div>
            <div style="text-align:center;background:#ebf8ff;border:1.5px solid #bee3f8;border-radius:9px;padding:5px 12px;flex-shrink:0">
              <div style="font-size:17px;font-weight:900;color:#1a4a8a;line-height:1">${pts}</div>
              <div style="font-size:10px;color:#4a90d9;font-weight:600">מתוך ${p.games}</div>
            </div>
            <div style="background:${pct>=75?'#f0fff4':pct>=60?'#fffff0':'#fff5f5'};color:${pct>=75?'#276749':pct>=60?'#744210':'#c53030'};border-radius:8px;padding:5px 10px;font-size:13px;font-weight:800;flex-shrink:0;min-width:42px;text-align:center">${pct}%</div>
          </div>`;
        });
        html += '</div>';
      }
      html += '</div>';
    }
    el.innerHTML = html || '<div style="text-align:center;padding:60px 20px;color:#a0aec0"><div style="font-size:48px;margin-bottom:12px">⭐</div><div style="font-size:15px;font-weight:700">לא נמצאו מצטיינים</div><div style="font-size:13px;margin-top:6px">יש לסנכרן קבוצות תחילה</div></div>';
  } catch(e) {
    el.innerHTML = `<div style="text-align:center;padding:40px;color:#c53030">שגיאה: ${e.message}</div>`;
  }
}

window.syncAllTeamsData = syncAllTeamsData;
window.loadLeagueStars = loadLeagueStars;
window.addClubTeamManualTyped = addClubTeamManualTyped;
window.renderLeagueTypePanels = renderLeagueTypePanels;
window.openTeamDetail = openTeamDetail;
window.closeTeamDetail = closeTeamDetail;
window.switchTeamDetailTab = switchTeamDetailTab;
window.fetchAndShowTeamSchedule = fetchAndShowTeamSchedule;
window.fetchAndCacheTeamPlayers = fetchAndCacheTeamPlayers;
