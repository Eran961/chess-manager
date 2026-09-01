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
// ── Youth Players ─────────────────────────────────────────────────────────

const YOUTH_CUTOFF = new Date().toISOString().split('T')[0]; // today
const YOUTH_FROM   = '2025-06-01';
const CUR_YEAR     = 2026;
let _youthPlayers       = {};
let _youthView          = 'age-select';
let _activeYouthAge     = null;
let _selectedYouthFedId = null;
let _addPlayerTargetAge = null;
let _confirmPlayerData  = null;

const YOUTH_AGE_GROUPS = [
  { label: 'עד 6', max: 6, min: 0 },
  { label: 'עד 8', max: 8, min: 7 },
  { label: 'עד 10', max: 10, min: 9 },
  { label: 'עד 12', max: 12, min: 11 },
  { label: 'עד 14', max: 14, min: 13 },
  { label: 'עד 18', max: 18, min: 15 },
];

function buildYouthPlayersHTML() {
  return '<div style="padding:20px" id="youth-players-root">' +
    '<div id="youth-status-bar" style="display:none;padding:10px 14px;border-radius:8px;font-size:12px;font-weight:600;margin-bottom:14px"></div>' +
    '<div id="youth-players-main"><div style="text-align:center;padding:40px;color:#a0aec0">⏳ טוען...</div></div>' +
    '</div>';
}
window.buildYouthPlayersHTML = buildYouthPlayersHTML;

function getPlayerAge(birthYear) {
  if (!birthYear) return null;
  return CUR_YEAR - birthYear;
}

function playersForGroup(max) {
  const group = YOUTH_AGE_GROUPS.find(g => g.max === max);
  if (!group) return [];
  return Object.values(_youthPlayers)
    .filter(p => {
      if (p.ageGroupOverride != null) return p.ageGroupOverride === max;
      const a = getPlayerAge(p.birthYear); return a !== null && a >= group.min && a <= group.max;
    })
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));
}

function renderYouthPlayers() {
  const el = document.getElementById('youth-players-main');
  if (!el) return;
  if (_youthView === 'age-select')      el.innerHTML = renderAgeSelect();
  else if (_youthView === 'player-list')   el.innerHTML = renderYouthPlayerList();
  else if (_youthView === 'player-detail') el.innerHTML = renderYouthPlayerDetail();
  else if (_youthView === 'add-player')    el.innerHTML = renderAddPlayerForm();
  else if (_youthView === 'confirm-add')   el.innerHTML = renderConfirmPlayer();
}

function renderAgeSelect() {
  const rows = YOUTH_AGE_GROUPS.map(g => {
    const count = playersForGroup(g.max).length;
    return `<button onclick="window.selectYouthAgeGroup(${g.max})"
      style="background:white;border:2px solid #e2e8f0;border-radius:16px;padding:28px 20px;
             text-align:center;cursor:pointer;font-family:inherit"
      onmouseover="this.style.borderColor='#553c9a'" onmouseout="this.style.borderColor='#e2e8f0'">
      <div style="font-size:26px;font-weight:900;color:#553c9a">${g.label}</div>
      <div style="font-size:13px;color:#718096;margin-top:6px;font-weight:600">${count ? count + ' שחקנים' : ''}</div>
    </button>`;
  }).join('');
  return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div style="font-size:18px;font-weight:800;color:white">שחקני נוער</div>
      <div style="display:flex;gap:8px">
        <button onclick="window.openAddPlayer(null)"
          style="font-size:12px;padding:6px 14px;border:1px solid rgba(255,255,255,0.3);border-radius:8px;background:rgba(255,255,255,0.12);cursor:pointer;color:white;font-weight:700">
          + הוסף שחקן
        </button>
        <button id="btn-sync-fed" onclick="window.syncYouthPlayersFromFederation()" style="font-size:12px;padding:6px 14px;border:1px solid rgba(255,255,255,0.3);border-radius:8px;background:rgba(255,255,255,0.12);cursor:pointer;color:white;font-weight:700">
          🌐 סנכרן מהאיגוד
        </button>
        <button onclick="window.refreshYouthData()"
          style="font-size:12px;padding:6px 14px;border:1px solid rgba(255,255,255,0.3);border-radius:8px;background:rgba(255,255,255,0.12);cursor:pointer;color:white;font-weight:700">
          🔄 רענן
        </button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">${rows}</div>`;
}

function renderYouthPlayerList() {
  const group = YOUTH_AGE_GROUPS.find(g => g.max === _activeYouthAge);
  const players = playersForGroup(_activeYouthAge);
  const rows = players.map(p => {
    const age = getPlayerAge(p.birthYear);
    const isFemale = p.gender === 'נקבה' || p.gender === 'F';
    return `<div onclick="window.selectYouthPlayer(${p.fedId})"
      style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:white;
             border:1.5px solid #e2e8f0;border-radius:12px;margin-bottom:10px;cursor:pointer"
      onmouseover="this.style.borderColor='#553c9a'" onmouseout="this.style.borderColor='#e2e8f0'">
      <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#553c9a,#805ad5);
                  display:flex;align-items:center;justify-content:center;font-size:18px;color:white;flex-shrink:0">
        ${isFemale ? '♛' : '♟'}
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:15px;font-weight:700;color:#1a202c">${p.name || '—'}</div>
        <div style="font-size:12px;color:#718096;margin-top:2px">👦 גיל ${age ?? '?'}</div>
      </div>
      <div style="text-align:center;min-width:48px">
        <div style="font-size:18px;font-weight:800;color:#553c9a">${p.rating || '—'}</div>
        <div style="font-size:10px;color:#a0aec0">מד כושר</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
        <div style="color:#c0c0c0;font-size:18px">»</div>
        <button onclick="event.stopPropagation();window.openMoveGroupPicker(${p.fedId},${p.ageGroupOverride ?? _activeYouthAge})" style="background:none;border:1px solid #e2e8f0;border-radius:5px;cursor:pointer;font-size:9px;color:#a0aec0;padding:2px 6px;white-space:nowrap">
          העבר
        </button>
      </div>
    </div>`;
  }).join('') || `<div style="text-align:center;padding:60px 20px;color:#a0aec0">
    <div style="font-size:48px;margin-bottom:12px">👦</div>
    <div style="font-size:15px;font-weight:700">אין שחקנים בקבוצה זו עדיין</div>
  </div>`;
  return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
      <div style="font-size:15px;font-weight:800;color:white">${group ? group.label : ''} — ${players.length} שחקנים</div>
      <button onclick="window.backToYouthAgeSelect()"
        style="display:flex;align-items:center;gap:5px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);border-radius:8px;cursor:pointer;font-size:14px;font-weight:700;color:white;padding:6px 14px">
        → חזרה
      </button>
    </div>${rows}
    <button onclick="window.openAddPlayer(${_activeYouthAge})"
      style="width:100%;margin-top:10px;padding:12px;background:rgba(255,255,255,0.1);border:2px dashed rgba(255,255,255,0.3);border-radius:12px;cursor:pointer;font-size:14px;font-weight:700;color:rgba(255,255,255,0.8);text-align:center">
      + הוסף שחקן לקבוצה זו
    </button>`;
}


async function syncYouthPlayersFromFederation() {
  const btn = document.getElementById('btn-sync-fed');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ מסנכרן...'; }
  _youthSetStatus('⏳ שולף שחקנים מאתר האיגוד...', false);
  try {
    const url = 'https://www.chess.org.il/Clubs/Club.aspx?Id=31&View=Players';
    const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(25000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const html = await res.text();

    // Extract each player row: link to Player.aspx?Id=XXXXX
    const rowRe = /<tr[\s\S]*?<\/tr>/gi;
    const rows = html.match(rowRe) || [];
    const found = [];
    for (const row of rows) {
      const linkM = row.match(/Player(?:Page)?\.aspx\?Id=(\d+)[^>]*>([\s\S]*?)<\/a>/i);
      if (!linkM) continue;
      const fedId = parseInt(linkM[1]);
      if (!fedId || fedId < 1000) continue;
      const name = linkM[2].replace(/<[^>]+>/g, '').trim();
      if (!name) continue;
      // Find 4-digit year in 1990-2022 range for birth year
      const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
      let birthYear = null, rating = null, gender = null;
      for (const cell of cells) {
        const text = cell.replace(/<[^>]+>/g, '').trim();
        if (/^(199\d|200\d|201\d|202[012])$/.test(text)) birthYear = parseInt(text);
        if (/^[1-9]\d{2,3}$/.test(text) && parseInt(text) >= 500 && parseInt(text) <= 3000) rating = parseInt(text);
        if (text === 'זכר' || text === 'M') gender = 'זכר';
        if (text === 'נקבה' || text === 'F') gender = 'נקבה';
      }
      found.push({ fedId, name, birthYear, rating, gender });
    }

    if (!found.length) throw new Error('לא נמצאו שחקנים בדף — ייתכן שמבנה הדף השתנה');

    let added = 0, updated = 0;
    for (const pl of found) {
      const existing = _youthPlayers[String(pl.fedId)];
      if (!existing) {
        const newP = { fedId: pl.fedId, name: pl.name, birthYear: pl.birthYear, rating: pl.rating, gender: pl.gender, addedAt: Date.now() };
        await db.ref('youthPlayers/' + pl.fedId).set(newP);
        _youthPlayers[String(pl.fedId)] = newP;
        added++;
      } else {
        // Update only federation fields, preserve manual data
        const updates = {};
        if (pl.rating && pl.rating !== existing.rating) { updates.rating = pl.rating; }
        if (pl.birthYear && !existing.birthYear) { updates.birthYear = pl.birthYear; }
        if (pl.gender && !existing.gender) { updates.gender = pl.gender; }
        if (Object.keys(updates).length) {
          await db.ref('youthPlayers/' + pl.fedId).update(updates);
          Object.assign(_youthPlayers[String(pl.fedId)], updates);
          updated++;
        }
      }
    }

    _youthSetStatus('✅ סנכרון הסתיים — ' + found.length + ' שחקנים באיגוד, ' + added + ' חדשים, ' + updated + ' עודכנו', true);
    renderYouthPlayers();
  } catch(e) {
    _youthSetStatus('❌ שגיאה: ' + e.message, false);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🌐 סנכרן מהאיגוד'; }
  }
}
window.syncYouthPlayersFromFederation = syncYouthPlayersFromFederation;

function openMoveGroupPicker(fedId, currentMax) {
  const p = _youthPlayers[String(fedId)];
  const hasOverride = p && p.ageGroupOverride != null;
  const opts = YOUTH_AGE_GROUPS.map(g =>
    '<button onclick="window.saveAgeGroupOverride(' + fedId + ',' + g.max + ')" style="padding:10px 18px;font-size:14px;font-weight:700;border-radius:8px;cursor:pointer;font-family:inherit;background:' + (g.max===currentMax?'#553c9a':'#f7fafc') + ';color:' + (g.max===currentMax?'white':'#1a202c') + ';border:2px solid ' + (g.max===currentMax?'#553c9a':'#e2e8f0') + '">' + g.label + '</button>'
  ).join('');
  const resetBtn = hasOverride ? '<button onclick="window.saveAgeGroupOverride(' + fedId + ',null)" style="font-size:11px;color:#c53030;background:none;border:none;cursor:pointer;text-decoration:underline;margin-top:4px">אפס לברירת מחדל (לפי שנת לידה)</button>' : '';
  const modal = document.createElement('div');
  modal.id = 'move-group-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center';
  modal.innerHTML = '<div style="background:white;border-radius:16px;padding:28px 24px;max-width:400px;width:90%;text-align:center"><div style="font-size:16px;font-weight:800;color:#1a202c;margin-bottom:6px">העברת שחקן לקבוצת גיל</div><div style="font-size:13px;color:#718096;margin-bottom:20px">' + (p && p.name ? p.name : fedId) + '</div><div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:16px">' + opts + '</div>' + resetBtn + '<div style="margin-top:14px"><button onclick="document.getElementById(\'move-group-modal\').remove()" style="font-size:12px;color:#718096;background:none;border:none;cursor:pointer">סגור</button></div></div>';
  document.getElementById('move-group-modal')?.remove();
  document.body.appendChild(modal);
}
window.openMoveGroupPicker = openMoveGroupPicker;

async function saveAgeGroupOverride(fedId, maxAge) {
  document.getElementById('move-group-modal')?.remove();
  if (maxAge == null) {
    await db.ref('youthPlayers/' + fedId + '/ageGroupOverride').remove();
    if (_youthPlayers[String(fedId)]) delete _youthPlayers[String(fedId)].ageGroupOverride;
  } else {
    await db.ref('youthPlayers/' + fedId + '/ageGroupOverride').set(maxAge);
    if (_youthPlayers[String(fedId)]) _youthPlayers[String(fedId)].ageGroupOverride = maxAge;
  }
  renderYouthPlayers();
}
window.saveAgeGroupOverride = saveAgeGroupOverride;

function renderYouthPlayerDetail() {
  const p = _youthPlayers[String(_selectedYouthFedId)];
  const group = _activeYouthAge ? YOUTH_AGE_GROUPS.find(g => g.max === _activeYouthAge) : null;
  return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
      ${group ? `<div style="font-size:14px;font-weight:700;color:white">${group.label}</div>` : '<div></div>'}
      <button onclick="window.backToYouthList()"
        style="display:flex;align-items:center;gap:5px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);border-radius:8px;cursor:pointer;font-size:14px;font-weight:700;color:white;padding:6px 14px">
        → חזרה לרשימה
      </button>
    </div>
    ${p ? renderYouthCard(p) : '<div style="text-align:center;padding:40px;color:#a0aec0">שחקן לא נמצא</div>'}`;
}

function selectYouthAgeGroup(max) {
  _activeYouthAge = max;
  _youthView = 'player-list';
  renderYouthPlayers();
}
window.selectYouthAgeGroup = selectYouthAgeGroup;

function selectYouthPlayer(fedId) {
  _selectedYouthFedId = fedId;
  _youthView = 'player-detail';
  renderYouthPlayers();
}
window.selectYouthPlayer = selectYouthPlayer;

function backToYouthAgeSelect() {
  _youthView = 'age-select';
  renderYouthPlayers();
}
window.backToYouthAgeSelect = backToYouthAgeSelect;

function backToYouthList() {
  _youthView = 'player-list';
  renderYouthPlayers();
}
window.backToYouthList = backToYouthList;

async function refreshYouthData() {
  for (const p of Object.values(_youthPlayers)) {
    _youthPlayers[String(p.fedId)].profileTs = null;
    await db.ref(`youthPlayers/${p.fedId}/profileTs`).remove();
  }
  await loadYouthPlayers();
}
window.refreshYouthData = refreshYouthData;

function openAddPlayer(maxAge) {
  _addPlayerTargetAge = maxAge;
  _confirmPlayerData = null;
  _youthView = 'add-player';
  renderYouthPlayers();
}
window.openAddPlayer = openAddPlayer;

function renderAddPlayerForm() {
  const group = _addPlayerTargetAge ? YOUTH_AGE_GROUPS.find(g => g.max === _addPlayerTargetAge) : null;
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div style="font-size:15px;font-weight:700;color:white">הוספת שחקן${group ? ' — ' + group.label : ''}</div>
      <button onclick="window.backToYouthAgeSelect()"
        style="display:flex;align-items:center;gap:5px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);border-radius:8px;cursor:pointer;font-size:14px;font-weight:700;color:white;padding:6px 14px">
        → חזרה
      </button>
    </div>
    <div style="background:white;border-radius:14px;padding:28px 24px;text-align:center">
      <div style="font-size:32px;margin-bottom:12px">🔍</div>
      <div style="font-size:16px;font-weight:800;color:#1a202c;margin-bottom:6px">חיפוש שחקן לפי מספר</div>
      <div style="font-size:13px;color:#718096;margin-bottom:24px">הזן את מספר השחקן באיגוד השחמט הישראלי</div>
      <div style="display:flex;gap:10px;max-width:320px;margin:0 auto">
        <input id="add-player-fedid" type="number" placeholder="מספר שחקן (לדוג׳ 203562)"
          style="flex:1;padding:12px 16px;border:2px solid #e2e8f0;border-radius:10px;font-size:15px;font-family:inherit;text-align:center;outline:none"
          onfocus="this.style.borderColor='#553c9a'" onblur="this.style.borderColor='#e2e8f0'"
          onkeydown="if(event.key==='Enter') window.submitAddPlayer()"/>
        <button onclick="window.submitAddPlayer()"
          style="padding:12px 20px;background:#553c9a;color:white;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;white-space:nowrap">
          שלוף ◄
        </button>
      </div>
      <div id="add-player-status" style="margin-top:16px;font-size:13px;min-height:20px"></div>
    </div>`;
}

async function submitAddPlayer() {
  const input = document.getElementById('add-player-fedid');
  if (!input) return;
  const fedId = parseInt(input.value.trim());
  if (isNaN(fedId) || fedId < 1000) {
    document.getElementById('add-player-status').innerHTML =
      '<span style="color:#c53030;font-weight:600">מספר שחקן לא תקין</span>';
    return;
  }
  if (_youthPlayers[String(fedId)]) {
    document.getElementById('add-player-status').innerHTML =
      `<span style="color:#c53030;font-weight:600">שחקן ${_youthPlayers[String(fedId)].name} כבר קיים במערכת</span>`;
    return;
  }
  const statusEl = document.getElementById('add-player-status');
  statusEl.innerHTML = '<span style="color:#553c9a;font-weight:600">⏳ שולף נתונים מהאיגוד... (השרת עלול להתעורר כדקה)</span>';
  try {
    const res = await fetch(`https://chess-manager-7wkr.onrender.com/api/player-profile?fedId=${fedId}`);
    if (!res.ok) { statusEl.innerHTML = `<span style="color:#c53030;font-weight:600">❌ שגיאה: HTTP ${res.status}</span>`; return; }
    const data = await res.json();
    if (!data.name || data.name === 'פרטי שחקן') {
      statusEl.innerHTML = '<span style="color:#c53030;font-weight:600">❌ שחקן לא נמצא באיגוד</span>';
      return;
    }
    _confirmPlayerData = { ...data, fedId };
    _youthView = 'confirm-add';
    renderYouthPlayers();
  } catch(e) {
    statusEl.innerHTML = `<span style="color:#c53030;font-weight:600">❌ שגיאת רשת: ${e.message}</span>`;
  }
}
window.submitAddPlayer = submitAddPlayer;

function renderConfirmPlayer() {
  const d = _confirmPlayerData;
  if (!d) { backToYouthAgeSelect(); return ''; }
  const age = d.birthYear ? (CUR_YEAR - d.birthYear) : null;
  const isFemale = d.gender === 'נקבה' || d.gender === 'F';
  const group = _addPlayerTargetAge ? YOUTH_AGE_GROUPS.find(g => g.max === _addPlayerTargetAge) : null;
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div style="font-size:15px;font-weight:700;color:white">אישור הוספה</div>
      <button onclick="window.openAddPlayer(${_addPlayerTargetAge})"
        style="display:flex;align-items:center;gap:5px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);border-radius:8px;cursor:pointer;font-size:14px;font-weight:700;color:white;padding:6px 14px">
        → חזרה לחיפוש
      </button>
    </div>
    <div style="background:white;border-radius:14px;padding:24px;text-align:center">
      <div style="font-size:14px;color:#718096;font-weight:600;margin-bottom:16px">מצאנו את השחקן הבא. האם התכוונת אליו?</div>
      <div style="display:flex;align-items:center;gap:16px;background:#f8fafc;border-radius:12px;padding:18px;margin-bottom:20px;text-align:right">
        <div style="width:54px;height:54px;border-radius:12px;background:linear-gradient(135deg,#553c9a,#805ad5);
                    display:flex;align-items:center;justify-content:center;font-size:26px;color:white;flex-shrink:0">
          ${isFemale ? '♛' : '♟'}
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:18px;font-weight:800;color:#1a202c">${d.name}</div>
          <div style="display:grid;grid-template-columns:auto 1fr;gap:4px 12px;margin-top:8px;font-size:13px">
            <span style="color:#718096;font-weight:600">שנת לידה</span><span style="color:#2d3748;font-weight:700">${d.birthYear || '—'}${age != null ? ' (גיל ' + age + ')' : ''}</span>
            <span style="color:#718096;font-weight:600">מין</span><span style="color:#2d3748;font-weight:700">${isFemale ? 'נקבה' : 'זכר'}</span>
            <span style="color:#718096;font-weight:600">מד כושר</span><span style="color:#553c9a;font-weight:800">${d.rating || '—'}</span>
            <span style="color:#718096;font-weight:600">מספר שחקן</span><span style="color:#2d3748;font-weight:700">${d.fedId}</span>
            ${d.cardExpiry ? `<span style="color:#718096;font-weight:600">תוקף פנקס</span><span style="color:#276749;font-weight:700">${d.cardExpiry}</span>` : ''}
          </div>
        </div>
        <div style="text-align:center;background:#f3f0ff;border:2px solid #d6bcfa;border-radius:12px;padding:10px 14px;flex-shrink:0">
          <div style="font-size:22px;font-weight:900;color:#553c9a">${d.rating || '—'}</div>
          <div style="font-size:10px;color:#805ad5;font-weight:700;margin-top:2px">מד כושר</div>
        </div>
      </div>
      ${group ? `<div style="font-size:13px;color:#718096;margin-bottom:16px">יתווסף לקבוצת <strong style="color:#553c9a">${group.label}</strong></div>` : ''}
      <div style="display:flex;gap:10px;justify-content:center">
        <button onclick="window.confirmAddPlayer()"
          style="padding:12px 28px;background:#553c9a;color:white;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer">
          כן, הוסף ✓
        </button>
        <button onclick="window.backToYouthAgeSelect()"
          style="padding:12px 28px;background:#f7fafc;color:#4a5568;border:1px solid #e2e8f0;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer">
          ביטול
        </button>
      </div>
      <div id="confirm-add-status" style="margin-top:14px;font-size:13px;min-height:20px"></div>
    </div>`;
}

async function confirmAddPlayer() {
  const d = _confirmPlayerData;
  if (!d) return;
  const statusEl = document.getElementById('confirm-add-status');
  if (statusEl) statusEl.innerHTML = '<span style="color:#553c9a;font-weight:600">⏳ שומר...</span>';
  try {
    const raw = {
      fedId: d.fedId, name: d.name, birthYear: d.birthYear,
      rating: d.rating, ratingExpected: d.ratingExpected,
      gender: d.gender, cardExpiry: d.cardExpiry,
      fide: d.fide, grade: d.grade,
      tournaments: d.tournaments || [], leagues: d.leagues || [],
      ratingHistory: d.ratingHistory || [], profileTs: Date.now(),
    };
    // Firebase rejects undefined values — replace with null
    const playerData = JSON.parse(JSON.stringify(raw, (k, v) => v === undefined ? null : v));
    await db.ref(`youthPlayers/${d.fedId}`).set(playerData);
    _youthPlayers[String(d.fedId)] = playerData;
    _confirmPlayerData = null;
    _youthView = _addPlayerTargetAge ? 'player-list' : 'age-select';
    renderYouthPlayers();
    _youthSetStatus(`✅ ${playerData.name} נוסף בהצלחה!`, false);
  } catch(e) {
    if (statusEl) statusEl.innerHTML = `<span style="color:#c53030;font-weight:600">❌ שגיאה: ${e.message}</span>`;
  }
}
window.confirmAddPlayer = confirmAddPlayer;

function _youthSetStatus(msg, isError) {
  const el = document.getElementById('youth-status-bar');
  if (!el) return;
  el.style.display = msg ? '' : 'none';
  el.style.background = isError ? '#fff5f5' : '#f0fff4';
  el.style.color = isError ? '#c53030' : '#276749';
  el.textContent = msg;
}

async function loadYouthPlayers() {
  const mainEl = document.getElementById('youth-players-main');
  if (mainEl && _youthView === 'age-select')
    mainEl.innerHTML = '<div style="text-align:center;padding:40px;color:#a0aec0">⏳ טוען...</div>';
  try {
    const snap = await db.ref('youthPlayers').get();
    _youthPlayers = snap.val() || {};
    if (!_youthPlayers['203562']?.birthYear) {
      const leo = {
        fedId: 203562, name: 'ליאו לוחם', birthYear: 2017, rating: 1528,
        ratingExpected: 1566, cardExpiry: '31/12/2026', fide: 1483, grade: 'חמישית',
        addedAt: _youthPlayers['203562']?.addedAt || Date.now(),
        tournaments: [
          { date: '12/07/2025', name: 'אליפות ראשון לציון לילדים עד גיל 8', games: '5', points: '4.0', performance: '1483', result: '+4-1=0', ratingChange: 3.2, ratingChangeRaw: '3.2+' },
          { date: '27/06/2025', name: 'שישי מהיר בראשון לציון 27.6 1350-1500', games: '4', points: '2.0', performance: '1411', result: '+2-2=0', ratingChange: -3.2, ratingChangeRaw: '3.2-' },
          { date: '06/06/2025', name: 'שישי מהיר בראשון לציון 6.6 1350-1500', games: '4', points: '3.0', performance: '1592', result: '+3-1=0', ratingChange: 11.3, ratingChangeRaw: '11.3+' },
        ]
      };
      await db.ref('youthPlayers/203562').set(leo);
      _youthPlayers['203562'] = leo;
    }
    const now = Date.now();
    const stale = Object.values(_youthPlayers).filter(p => !p.profileTs || (now - p.profileTs) > 86400000 || !p.birthYear);
    if (stale.length) {
      _youthSetStatus(`⏳ מעדכן נתונים מהאיגוד (${stale.length} שחקנ${stale.length===1?'':'ים'})...`, false);
      for (const p of stale) await fetchYouthPlayerProfile(p.fedId);
      _youthSetStatus('', false);
    }
    renderYouthPlayers();
  } catch(e) {
    if (mainEl) mainEl.innerHTML = `<div style="text-align:center;padding:40px;color:#c53030">שגיאה: ${e.message}</div>`;
  }
}
window.loadYouthPlayers = loadYouthPlayers;

async function fetchYouthPlayerProfile(fedId) {
  try {
    _youthSetStatus(`⏳ טוען פרופיל ${fedId} מהאיגוד... (ייתכן עיכוב של עד דקה בהפעלת השרת)`, false);
    const res = await fetch(`https://chess-manager-7wkr.onrender.com/api/player-profile?fedId=${fedId}`);
    if (!res.ok) {
      _youthSetStatus(`❌ שגיאה בטעינת פרופיל ${fedId}: HTTP ${res.status}`, true);
      return false;
    }
    const data = await res.json();
    if (!data.birthYear) {
      _youthSetStatus(`⚠️ הפרופיל של ${fedId} חזר ללא שנת לידה — ייתכן שגיאת פרסור`, true);
    }
    const update = { ...data, profileTs: Date.now() };
    await db.ref(`youthPlayers/${fedId}`).update(update);
    _youthPlayers[String(fedId)] = { ..._youthPlayers[String(fedId)], ...update };
    return true;
  } catch(e) {
    _youthSetStatus(`❌ שגיאת רשת בטעינת פרופיל ${fedId}: ${e.message}`, true);
    console.error('fetchYouthPlayerProfile', fedId, e);
    return false;
  }
}

function switchYouthCardTab(btn, showId) {
  const showEl = document.getElementById(showId);
  if (!showEl) return;
  const paneWrapper = showEl.parentElement;
  if (paneWrapper) Array.from(paneWrapper.children).forEach(el => { el.style.display = 'none'; });
  showEl.style.display = '';
  btn.parentElement.querySelectorAll('button').forEach(b => { b.style.background = '#f7fafc'; b.style.color = '#4a5568'; });
  btn.style.background = '#553c9a'; btn.style.color = 'white';
}
window.switchYouthCardTab = switchYouthCardTab;

function renderYouthCard(p) {
  const age = getPlayerAge(p.birthYear);
  const isFemale = p.gender === 'נקבה' || p.gender === 'F';
  const today = new Date().toISOString().split('T')[0];
  const parseCardDate = d => { if (!d) return ''; const pts = d.split('/'); return pts.length===3 ? `${pts[2]}-${pts[1]}-${pts[0]}` : d; };
  const cardExpired = p.cardExpiry && parseCardDate(p.cardExpiry) < today;

  const allTourns = (p.tournaments || []).filter(t => {
    const d = t.date || '';
    if (!d) return false;
    const pts = d.split('/');
    if (pts.length < 3) return false;
    const iso = `${pts[2]}-${pts[1].padStart(2,'0')}-${pts[0].padStart(2,'0')}`;
    return iso >= YOUTH_FROM && iso <= today;
  });

  const leagues = p.leagues || [];

  // Category + board number helpers
  const cats = p.tournamentCategories || {};
  const boardNums = p.boardNumbers || {};
  const toKey = n => (n||'').replace(/[.#\$\/\[\]']/g,'_').substring(0,100);
  const autoClassify = n => {
    if (!n) return null;
    if (!/אליפות\s*(ישראל|הארץ)/.test(n)) return null;
    return /קבוצות/.test(n) ? 'teams' : 'individuals';
  };
  const getItemCat = (n, def) => cats[toKey(n)] || autoClassify(n) || def;
  const buckets = { tournaments: [], leagues: [], individuals: [], teams: [] };
  allTourns.forEach(t => { const c = getItemCat(t.name||t['תחרות']||'','tournaments'); (buckets[c]||buckets.tournaments).push(t); });
  leagues.forEach(l => { const c = getItemCat(l['ליגה']||'','leagues'); (buckets[c]||buckets.leagues).push({...l,_isLeague:true}); });

  const totalRc = allTourns.reduce((s, t) => {
    const v = typeof t.ratingChange === 'number' ? t.ratingChange : parseFloat(t.ratingChange) || 0;
    return s + (isNaN(v) ? 0 : v);
  }, 0);

  const renderRow = (t, idx, showBoard = false) => {
    const name  = t.name || t['תחרות'] || '—';
    const date  = t.date || '—';
    const score = (t.points != null && t.games != null) ? `${t.points}/${t.games}` : (t.result || '—');
    const rcNum = typeof t.ratingChange === 'number' ? t.ratingChange : parseFloat(t.ratingChangeRaw || t.ratingChange);
    const rcColor = rcNum > 0 ? '#276749' : rcNum < 0 ? '#c53030' : '#718096';
    const rcText  = !isNaN(rcNum) ? (rcNum > 0 ? `+${rcNum}` : `${rcNum}`) : '';
    const itemKey = toKey(name);
    const curCat  = getItemCat(name, 'tournaments');
    const bn = showBoard ? boardNums[itemKey] : null;
    const boardEl = showBoard
      ? `<button onclick="window.openBoardNumEditor('${p.fedId}','${itemKey}',${bn != null ? bn : 'null'})"
           style="background:none;border:none;padding:0;cursor:pointer;font-size:10px;color:${bn != null ? '#553c9a' : '#c0bcd4'};font-weight:700;margin-top:2px;display:block;text-align:right">
           ${bn != null ? `לוח ${bn} ✏️` : '+ לוח'}
         </button>`
      : '';
    return `<div style="display:flex;gap:8px;align-items:flex-start;padding:5px 0;border-bottom:1px solid #f7fafc;font-size:12px">
      <div style="font-size:10px;font-weight:700;color:#c0bcd4;min-width:18px;text-align:center;flex-shrink:0;padding-top:2px">${idx + 1}</div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;color:#2d3748;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</div>
        ${boardEl}
      </div>
      <div style="color:#a0aec0;white-space:nowrap;flex-shrink:0;padding-top:2px">${date}</div>
      <div style="font-weight:700;color:#1a4a8a;min-width:32px;text-align:center;flex-shrink:0;padding-top:2px">${score}</div>
      ${rcText ? `<div style="font-weight:800;color:${rcColor};min-width:32px;text-align:right;flex-shrink:0;padding-top:2px">${rcText}</div>` : '<div style="min-width:32px"></div>'}
      <button onclick="window.openCatPicker('${p.fedId}','${itemKey}','${curCat}')" style="background:none;border:none;cursor:pointer;color:#c0bcd4;font-size:10px;padding:1px 2px;flex-shrink:0" title="שנה קטגוריה">✏️</button>
    </div>`;
  };

  const renderTabList = (items, emptyMsg) => items.length
    ? `<div style="max-height:220px;overflow-y:auto">${items.map((t, i) => renderRow(t, i)).join('')}</div>`
    : `<div style="padding:20px;text-align:center;color:#a0aec0;font-size:12px">${emptyMsg}</div>`;

  const renderLeagueRow = (l, idx, showBoard = false) => {
    const lName  = l['ליגה'] || '—';
    const team   = l['קבוצה'] || '';
    const score  = l['תוצאה'] || (l['נקודות'] ? `${l['נקודות']}/${l['משחקים']}` : '—');
    const rcRaw  = l['שינוי מד כושר'] || '';
    const rcNum  = parseFloat(rcRaw);
    const rcColor = rcNum > 0 ? '#276749' : rcNum < 0 ? '#c53030' : '#718096';
    const rcText  = !isNaN(rcNum) ? (rcNum > 0 ? `+${rcNum}` : `${rcNum}`) : '';
    const itemKey = toKey(lName);
    const curCat  = getItemCat(lName, 'leagues');
    const bn = showBoard ? boardNums[itemKey] : null;
    const boardEl = showBoard
      ? `<button onclick="window.openBoardNumEditor('${p.fedId}','${itemKey}',${bn != null ? bn : 'null'})"
           style="background:none;border:none;padding:0;cursor:pointer;font-size:10px;color:${bn != null ? '#553c9a' : '#c0bcd4'};font-weight:700;margin-top:2px;display:block;text-align:right">
           ${bn != null ? `לוח ${bn} ✏️` : '+ לוח'}
         </button>`
      : '';
    return `<div style="display:flex;gap:8px;align-items:flex-start;padding:6px 0;border-bottom:1px solid #f7fafc;font-size:12px">
      <div style="font-size:10px;font-weight:700;color:#c0bcd4;min-width:18px;text-align:center;flex-shrink:0;padding-top:3px">${idx + 1}</div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;color:#2d3748;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${lName}">${lName}</div>
        ${team ? `<div style="font-size:10px;color:#718096;margin-top:1px">${team}</div>` : ''}
        ${boardEl}
      </div>
      <div style="font-weight:700;color:#1a4a8a;min-width:42px;text-align:center;flex-shrink:0;white-space:nowrap">${score}</div>
      ${rcText ? `<div style="font-weight:800;color:${rcColor};min-width:36px;text-align:right;flex-shrink:0">${rcText}</div>` : '<div style="min-width:36px"></div>'}
      <button onclick="window.openCatPicker('${p.fedId}','${itemKey}','${curCat}')" style="background:none;border:none;cursor:pointer;color:#c0bcd4;font-size:10px;padding:1px 2px;flex-shrink:0" title="שנה קטגוריה">✏️</button>
    </div>`;
  };

  const renderLeagueList = items => items.length
    ? `<div style="max-height:220px;overflow-y:auto">${items.map((l, i) => renderLeagueRow(l, i, true)).join('')}</div>`
    : `<div style="padding:20px;text-align:center;color:#a0aec0;font-size:12px">לא נמצאו משחקי ליגה</div>`;

  const renderMixedList = (items, emptyMsg, showBoard = false) => items.length
    ? `<div style="max-height:220px;overflow-y:auto">${items.map((item, i) => item._isLeague ? renderLeagueRow(item, i, showBoard) : renderRow(item, i, showBoard)).join('')}</div>`
    : `<div style="padding:20px;text-align:center;color:#a0aec0;font-size:12px">${emptyMsg}</div>`;

  const renderRatingTab = (ratingHistory) => {
    const history = (ratingHistory || []).filter(r => r.date >= YOUTH_FROM && r.date <= today);
    if (!history.length) {
      return `<div style="padding:20px;text-align:center;color:#a0aec0;font-size:14px">${p.profileTs ? 'לא נמצאו נתוני מד כושר' : '⏳ טוען...'}</div>`;
    }
    const monthHe = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
    const monthShort = ['ינו','פבר','מרץ','אפר','מאי','יוני','יול','אוג','ספט','אוק','נוב','דצמ'];
    const chrono = [...history].sort((a, b) => a.date.localeCompare(b.date));
    const ratings = chrono.map(r => r.rating);
    const pad = 25;
    const minR = Math.min(...ratings) - pad;
    const maxR = Math.max(...ratings) + pad;
    // Chart dimensions — bigger, with room for outside Y labels and rotated X labels
    const W = 320, H = 170, PL = 54, PR = 10, PT = 14, PB = 48;
    const cW = W - PL - PR, cH = H - PT - PB;
    const n = chrono.length;
    const xPos = i => PL + (n < 2 ? cW / 2 : (i / (n - 1)) * cW);
    const yPos = r => PT + (1 - (r - minR) / (maxR - minR)) * cH;
    const pts = chrono.map((r, i) => [xPos(i), yPos(r.rating)]);
    // Smooth cubic bezier line
    let linePath = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const cx = (x1 - x0) * 0.4;
      linePath += ` C${(x0+cx).toFixed(1)},${y0.toFixed(1)} ${(x1-cx).toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
    }
    const areaPath = linePath + ` L${pts[n-1][0].toFixed(1)},${(PT+cH).toFixed(1)} L${PL},${(PT+cH).toFixed(1)} Z`;
    // Y grid lines + labels OUTSIDE chart (left of PL)
    const rRange = maxR - minR;
    const gStep = rRange > 150 ? 50 : rRange > 60 ? 25 : 20;
    const firstG = Math.ceil(minR / gStep) * gStep;
    let grids = `<line x1="${PL}" y1="${PT}" x2="${PL}" y2="${PT+cH}" stroke="#e9d8fd" stroke-width="1"/>`;
    for (let g = firstG; g <= maxR; g += gStep) {
      const gy = yPos(g);
      if (gy < PT - 2 || gy > PT + cH + 2) continue;
      grids += `<line x1="${PL}" y1="${gy.toFixed(1)}" x2="${W-PR}" y2="${gy.toFixed(1)}" stroke="#ede9ff" stroke-width="0.8"/>`;
      // Y label outside — to the LEFT of PL
      grids += `<text x="${PL-8}" y="${(gy+4).toFixed(1)}" font-size="10" fill="#9f7aea" text-anchor="end" font-weight="700">${g}</text>`;
    }
    // ALL X labels — rotated -38° so they don't overlap
    let xLabels = '';
    chrono.forEach((r, i) => {
      const [yr, mo] = r.date.split('-');
      const label = `${monthShort[+mo-1]} ${yr.slice(2)}`;
      const x = xPos(i).toFixed(1);
      const y = (PT + cH + 8).toFixed(1);
      xLabels += `<text x="${x}" y="${y}" font-size="9.5" fill="#9f7aea" text-anchor="end" font-weight="600" transform="rotate(-40,${x},${y})">${label}</text>`;
    });
    // Data point dots with hover tooltip
    let dots = '';
    pts.forEach(([x, y], i) => {
      const r = chrono[i];
      const isLatest = i === n - 1;
      const chgStr = r.change > 0 ? `+${r.change}` : `${r.change}`;
      const dotColor = isLatest ? '#553c9a' : (r.change > 0 ? '#6b46c1' : r.change < 0 ? '#9f7aea' : '#b794f4');
      dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${isLatest ? 6 : 4.5}" fill="${dotColor}" stroke="white" stroke-width="2"><title>${r.date}: מד כושר ${r.rating} (${chgStr})</title></circle>`;
    });
    const svgChart = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;overflow:visible;padding-bottom:4px">
      <defs><linearGradient id="rg-${p.fedId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#805ad5" stop-opacity="0.32"/>
        <stop offset="100%" stop-color="#805ad5" stop-opacity="0.02"/>
      </linearGradient></defs>
      ${grids}
      <path d="${areaPath}" fill="url(#rg-${p.fedId})" stroke="none"/>
      <path d="${linePath}" fill="none" stroke="#6b46c1" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
      ${dots}${xLabels}
    </svg>`;
    const totalChange = history.reduce((s, r) => s + (r.change || 0), 0);
    const tcStr = totalChange > 0 ? `+${totalChange}` : `${totalChange}`;
    const tcColor = totalChange > 0 ? '#276749' : totalChange < 0 ? '#c53030' : '#718096';
    // Numbered list — newest first
    const listItems = [...history].sort((a, b) => b.date.localeCompare(a.date)).map((r, idx) => {
      const [yr, mo] = r.date.split('-');
      const label = `${monthHe[+mo-1]} ${yr}`;
      const chgStr = r.change > 0 ? `+${r.change}` : `${r.change}`;
      const chgColor = r.change > 0 ? '#276749' : r.change < 0 ? '#c53030' : '#718096';
      return `<div style="display:flex;gap:10px;align-items:center;padding:6px 0;border-bottom:1px solid #f0ebff;font-size:13px">
        <div style="font-size:11px;font-weight:700;color:#c0bcd4;min-width:20px;text-align:center;flex-shrink:0">${idx + 1}</div>
        <div style="flex:1;color:#4a5568;font-weight:600">${label}</div>
        <div style="font-weight:800;color:#553c9a;min-width:40px;text-align:center">${r.rating}</div>
        <div style="font-weight:800;color:${chgColor};min-width:38px;text-align:right">${chgStr}</div>
        ${r.games != null ? `<div style="font-size:11px;color:#a0aec0;min-width:26px;text-align:center">${r.games}m</div>` : ''}
      </div>`;
    }).join('');
    return `<div style="padding:4px 0">
      <div style="background:linear-gradient(160deg,#f3f0ff 0%,#faf5ff 100%);border-radius:12px;padding:14px 14px 10px;margin-bottom:14px;border:1px solid #e9d8fd">
        ${svgChart}
        <div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid #e9d8fd">
          <div style="font-size:12px;color:#a0aec0;font-weight:600">${chrono[0].date.slice(0,7).replace('-','/')} → היום</div>
          <div style="font-size:13px;font-weight:800;color:${tcColor}">${tcStr} סה"כ</div>
        </div>
      </div>
      <div style="max-height:220px;overflow-y:auto">${listItems}</div>
    </div>`;
  };

  const statsRow = allTourns.length ? `
    <div style="display:flex;gap:8px;margin-top:12px">
      <div style="flex:1;background:#f7fafc;border-radius:8px;padding:8px;text-align:center">
        <div style="font-size:16px;font-weight:800;color:#2d3748">${allTourns.length}</div>
        <div style="font-size:10px;color:#718096;font-weight:600">פעילויות</div>
      </div>
      ${totalRc !== 0 ? `<div style="flex:1;background:${totalRc>0?'#f0fff4':'#fff5f5'};border-radius:8px;padding:8px;text-align:center">
        <div style="font-size:16px;font-weight:800;color:${totalRc>0?'#276749':'#c53030'}">${totalRc>0?'+':''}${totalRc.toFixed(1)}</div>
        <div style="font-size:10px;color:#718096;font-weight:600">שינוי מד כושר</div>
      </div>` : ''}
    </div>` : '';

  const ratingHistory = p.ratingHistory || [];
  const tabsSection = (allTourns.length || leagues.length || ratingHistory.length || p.profileTs) ? `
    <div style="margin-top:14px;border-top:1px solid #f0f0f0;padding-top:12px">
      <div style="display:flex;gap:5px;margin-bottom:10px;flex-wrap:wrap">
        <button onclick="switchYouthCardTab(this,'yct-${p.fedId}')"
          style="font-size:10px;font-weight:700;padding:4px 10px;border-radius:8px;border:1px solid #e2e8f0;background:#553c9a;color:white;cursor:pointer">
          🏆 תחרויות (${buckets.tournaments.length})
        </button>
        <button onclick="switchYouthCardTab(this,'ycl-${p.fedId}')"
          style="font-size:10px;font-weight:700;padding:4px 10px;border-radius:8px;border:1px solid #e2e8f0;background:#f7fafc;color:#4a5568;cursor:pointer">
          🏅 ליגות (${buckets.leagues.length})
        </button>
        <button onclick="switchYouthCardTab(this,'yci-${p.fedId}')"
          style="font-size:10px;font-weight:700;padding:4px 10px;border-radius:8px;border:1px solid #e2e8f0;background:#f7fafc;color:#4a5568;cursor:pointer">
          🥇 אליפויות ליחידים (${buckets.individuals.length})
        </button>
        <button onclick="switchYouthCardTab(this,'ycq-${p.fedId}')"
          style="font-size:10px;font-weight:700;padding:4px 10px;border-radius:8px;border:1px solid #e2e8f0;background:#f7fafc;color:#4a5568;cursor:pointer">
          👥 אליפויות קבוצות (${buckets.teams.length})
        </button>
        <button onclick="switchYouthCardTab(this,'ycr-${p.fedId}')"
          style="font-size:10px;font-weight:700;padding:4px 10px;border-radius:8px;border:1px solid #e2e8f0;background:#f7fafc;color:#4a5568;cursor:pointer">
          📈 מד כושר (${ratingHistory.filter(r=>r.date>=YOUTH_FROM&&r.date<=today).length})
        </button>
      </div>
      <div>
        <div id="yct-${p.fedId}">${renderTabList(buckets.tournaments, 'לא נמצאו תחרויות')}</div>
        <div id="ycl-${p.fedId}" style="display:none">${renderLeagueList(buckets.leagues)}</div>
        <div id="yci-${p.fedId}" style="display:none">${renderMixedList(buckets.individuals, 'לא נמצאו אליפויות ליחידים', false)}</div>
        <div id="ycq-${p.fedId}" style="display:none">${renderMixedList(buckets.teams, 'לא נמצאו אליפויות קבוצות', true)}</div>
        <div id="ycr-${p.fedId}" style="display:none">${renderRatingTab(ratingHistory)}</div>
      </div>
    </div>` : (!p.profileTs ? '<div style="margin-top:8px;font-size:12px;color:#a0aec0">⏳ טוען נתוני תחרויות...</div>' : '');

  const genderLabel = isFemale ? 'נקבה' : 'זכר';
  const dryRows = [
    ['שם', p.name || '—'],
    p.birthYear ? ['שנת לידה', `${p.birthYear}${age != null ? ` (גיל ${age})` : ''}`] : null,
    ['מין', genderLabel],
    ['מספר שחקן', `<a href="https://www.chess.org.il/Players/Player.aspx?Id=${p.fedId}" target="_blank" style="color:#553c9a;text-decoration:none;font-weight:700">${p.fedId}</a>`],
    p.cardExpiry ? ['תוקף פנקס שחמטאי', `<span style="color:${cardExpired?'#c53030':'#276749'};font-weight:700">${p.cardExpiry}${cardExpired?' ✗':' ✓'}</span>`] : null,
    p.parentName ? ['שם הורה', p.parentName] : null,
    p.parentPhone ? ['טלפון הורה', `<a href="tel:${p.parentPhone}" style="color:#553c9a;text-decoration:none">${p.parentPhone}</a>`] : null,
    p.parentEmail ? ['אימייל הורה', `<a href="mailto:${p.parentEmail}" style="color:#553c9a;text-decoration:none">${p.parentEmail}</a>`] : null,
  ].filter(Boolean);
  const dryDataHtml = `
    <div style="margin-top:14px;background:#f8fafc;border-radius:10px;padding:12px 16px;border:1px solid #e2e8f0">
      <div style="display:flex;flex-wrap:wrap;gap:8px 24px;align-items:center;font-size:14px">
        ${dryRows.map(([label, value]) => `
          <span style="white-space:nowrap"><span style="color:#718096;font-weight:600">${label}:</span> <span style="color:#1a202c;font-weight:700">${value}</span></span>
        `).join('')}
      </div>
    </div>`


  const ci = p.clubInfo || {};
  const goals = p.goals || {};

  const motivColors = { 'גבוהה': ['#f0fff4','#276749'], 'בינונית': ['#fffbeb','#b7791f'], 'נמוכה': ['#fff5f5','#c53030'] };
  const motivBadge = m => !m ? '' : `<span style="background:${(motivColors[m]||['#f7fafc','#718096'])[0]};color:${(motivColors[m]||['#f7fafc','#718096'])[1]};padding:2px 8px;border-radius:6px;font-weight:700;font-size:11px">${m}</span>`;
  const yesNoSpan = v => v === true ? '<span style="color:#276749;font-weight:700">כן ✓</span>' : '<span style="color:#a0aec0;font-weight:600">לא</span>';
  const ciRow = (lbl, val) => `<span style="white-space:nowrap"><span style="color:#718096;font-weight:600">${lbl}:</span> <span style="color:#1a202c;font-weight:600">${val}</span></span>`;

  const ciFieldRows = [
    ci.clubGroup                          ? ciRow('חוג במועדון',       ci.clubGroup)                          : '',
    ci.personalCoach                      ? ciRow('מאמן אישי',         ci.personalCoach)                      : '',
    ci.motivation                         ? ciRow('מוטיבציה',          motivBadge(ci.motivation))             : '',
    ci.attendsFriday          != null     ? ciRow('ימי שישי',          yesNoSpan(ci.attendsFriday))           : '',
    ci.attendsClubTournaments != null     ? ciRow('תחרויות מועדון',    yesNoSpan(ci.attendsClubTournaments))  : '',
    ci.attendsNationalTournaments != null ? ciRow('תחרויות ארציות',    yesNoSpan(ci.attendsNationalTournaments)): '',
  ].filter(Boolean);
  const ciHasData = ciFieldRows.length > 0 || !!ci.notes;

  const clubInfoHtml = `
    <div style="margin-top:10px;background:#f0f9ff;border-radius:10px;padding:10px 14px;border:1px solid #bee3f8">
      <div style="display:flex;justify-content:space-between;align-items:center;${ciHasData ? 'margin-bottom:8px' : ''}">
        <div style="font-size:13px;font-weight:700;color:#2b6cb0">📝 הערות מדריך</div>
        <button onclick="window.openClubInfoEditor('${p.fedId}')"
          style="background:none;border:1px solid #90cdf4;border-radius:6px;cursor:pointer;font-size:10px;color:#2b6cb0;padding:2px 8px;font-weight:600;font-family:inherit">
          ✏️ עריכה
        </button>
      </div>
      ${ciHasData
        ? `${ciFieldRows.length ? `<div style="display:flex;flex-wrap:nowrap;overflow-x:auto;gap:6px 18px;font-size:13px;align-items:center">${ciFieldRows.join('')}</div>` : ''}
           ${ci.notes ? `<div style="margin-top:${ciFieldRows.length?'8':'0'}px;padding:7px 10px;background:#ebf8ff;border-radius:7px;font-size:12px;color:#2c5282;white-space:pre-wrap;line-height:1.5"><span style="font-weight:700">הערות: </span>${ci.notes}</div>` : ''}`
        : `<div style="font-size:11px;color:#90cdf4;text-align:center;padding:4px 0">לחץ עריכה להוספת מידע</div>`}
    </div>`;

  const goalsHasData = !!(goals.primary || goals.secondary || goals.targetRating);
  const goalsHtml = `
    <div style="margin-top:10px;background:#f0fff4;border-radius:10px;padding:10px 14px;border:1px solid #c6f6d5">
      <div style="display:flex;justify-content:space-between;align-items:center;${goalsHasData ? 'margin-bottom:8px' : ''}">
        <div style="font-size:13px;font-weight:700;color:#276749">🎯 מטרות לשנה הקרובה</div>
        <button onclick="window.openGoalsEditor('${p.fedId}')"
          style="background:none;border:1px solid #9ae6b4;border-radius:6px;cursor:pointer;font-size:10px;color:#276749;padding:2px 8px;font-weight:600;font-family:inherit">
          ✏️ עריכה
        </button>
      </div>
      ${goalsHasData
        ? `<div style="display:flex;flex-wrap:nowrap;overflow-x:auto;gap:6px 18px;font-size:13px;align-items:center">
             ${goals.primary   ? `<span style="white-space:nowrap"><span style="color:#718096;font-weight:600">מטרה ראשית:</span> <span style="color:#1a202c;font-weight:600">${goals.primary}</span></span>` : ``}
             ${goals.secondary ? `<span style="white-space:nowrap"><span style="color:#718096;font-weight:600">מטרה משנית:</span> <span style="color:#1a202c;font-weight:600">${goals.secondary}</span></span>` : ``}
             ${goals.targetRating ? `<span style="white-space:nowrap"><span style="color:#718096;font-weight:600">יעד מד כושר:</span> <span style="background:#c6f6d5;color:#276749;padding:2px 8px;border-radius:6px;font-weight:800;font-size:12px">${goals.targetRating}</span></span>` : ``}
           </div>`
        : `<div style="font-size:11px;color:#9ae6b4;text-align:center;padding:4px 0">לחץ עריכה להגדרת מטרות</div>`}
    </div>`;

  return `
    <div style="background:white;border:1.5px solid #e2e8f0;border-radius:14px;margin-bottom:14px;overflow:hidden">
      <div style="padding:16px 18px">
        <div style="display:flex;align-items:flex-start;gap:14px">
          <div style="width:50px;height:50px;border-radius:12px;background:linear-gradient(135deg,#553c9a,#805ad5);
                      display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;color:white">
            ${isFemale ? '♛' : '♟'}
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:18px;font-weight:800;color:#1a202c">${p.name || '—'}</div>
            <div style="font-size:12px;color:#a0aec0;margin-top:3px">${genderLabel} · גיל ${age ?? '?'} · פד ${p.fedId}</div>
          </div>
          <div style="text-align:center;background:#f3f0ff;border:2px solid #d6bcfa;border-radius:12px;padding:10px 16px;flex-shrink:0;min-width:66px">
            <div style="font-size:24px;font-weight:900;color:#553c9a;line-height:1">${p.rating || '—'}</div>
            <div style="font-size:10px;color:#805ad5;font-weight:700;margin-top:3px">מד כושר</div>
          </div>
        </div>
        ${dryDataHtml}
        ${clubInfoHtml}
        ${goalsHtml}
        ${statsRow}
        ${tabsSection}
      </div>
    </div>`;
}

function openCatPicker(fedId, itemKey, curCat) {
  const existing = document.getElementById('cat-picker-popup');
  if (existing) { existing.remove(); return; }
  const CATS = [
    { key: 'tournaments', label: '🏆 תחרויות' },
    { key: 'leagues',     label: '🏅 ליגות' },
    { key: 'individuals', label: '🥇 אליפויות ליחידים' },
    { key: 'teams',       label: '👥 אליפויות קבוצות' },
  ];
  const popup = document.createElement('div');
  popup.id = 'cat-picker-popup';
  popup.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;border-radius:14px;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,0.3);z-index:9999;min-width:260px;font-family:inherit;direction:rtl';
  popup.innerHTML = `
    <div style="font-size:14px;font-weight:700;color:#2d3748;margin-bottom:14px">שנה קטגוריה</div>
    ${CATS.map(c => `
      <button onclick="window.setCategoryForItem('${fedId}','${itemKey}','${c.key}')"
        style="display:block;width:100%;text-align:right;padding:10px 14px;margin-bottom:6px;
               border-radius:8px;border:2px solid ${c.key===curCat?'#553c9a':'#e2e8f0'};
               background:${c.key===curCat?'#f3f0ff':'white'};
               color:${c.key===curCat?'#553c9a':'#2d3748'};
               font-weight:${c.key===curCat?'700':'600'};cursor:pointer;font-size:13px;font-family:inherit">
        ${c.label}${c.key===curCat?' ✓':''}
      </button>`).join('')}
    <button onclick="document.getElementById('cat-picker-popup')?.remove()"
      style="display:block;width:100%;text-align:center;padding:8px;margin-top:8px;
             border-radius:8px;border:1px solid #e2e8f0;background:#f7fafc;color:#718096;
             cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">
      ביטול
    </button>`;
  document.body.appendChild(popup);
  setTimeout(() => {
    const close = e => { if (!popup.contains(e.target)) { popup.remove(); document.removeEventListener('click', close); } };
    document.addEventListener('click', close);
  }, 50);
}
window.openCatPicker = openCatPicker;

async function setCategoryForItem(fedId, itemKey, category) {
  document.getElementById('cat-picker-popup')?.remove();
  try {
    await db.ref(`youthPlayers/${fedId}/tournamentCategories/${itemKey}`).set(category);
    if (_youthPlayers[String(fedId)]) {
      if (!_youthPlayers[String(fedId)].tournamentCategories) _youthPlayers[String(fedId)].tournamentCategories = {};
      _youthPlayers[String(fedId)].tournamentCategories[itemKey] = category;
    }
    renderYouthPlayers();
  } catch(e) {
    showToast('שגיאה: ' + e.message, 'error');
  }
}
window.setCategoryForItem = setCategoryForItem;

function openBoardNumEditor(fedId, itemKey, currentNum) {
  const existing = document.getElementById('board-num-popup');
  if (existing) { existing.remove(); return; }
  const popup = document.createElement('div');
  popup.id = 'board-num-popup';
  popup.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;border-radius:14px;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,0.3);z-index:9999;min-width:220px;font-family:inherit;direction:rtl';
  popup.innerHTML = `
    <div style="font-size:14px;font-weight:700;color:#2d3748;margin-bottom:14px">מספר לוח</div>
    <input id="board-num-input" type="number" min="1" max="20" value="${currentNum != null ? currentNum : ''}"
      placeholder="מספר לוח (1, 2, 3...)"
      style="width:100%;padding:10px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit;box-sizing:border-box;text-align:center;direction:ltr">
    <div style="display:flex;gap:8px;margin-top:12px">
      <button onclick="window.saveBoardNumber('${fedId}','${itemKey}',document.getElementById('board-num-input').value)"
        style="flex:1;padding:9px;background:#553c9a;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
        שמור
      </button>
      ${currentNum != null ? `<button onclick="window.saveBoardNumber('${fedId}','${itemKey}','')"
        style="padding:9px 12px;background:#fff5f5;color:#c53030;border:1px solid #fed7d7;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">
        מחק
      </button>` : ''}
      <button onclick="document.getElementById('board-num-popup')?.remove()"
        style="padding:9px 12px;background:#f7fafc;color:#718096;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">
        ביטול
      </button>
    </div>`;
  document.body.appendChild(popup);
  popup.querySelector('#board-num-input').focus();
  setTimeout(() => {
    const close = e => { if (!popup.contains(e.target)) { popup.remove(); document.removeEventListener('click', close); } };
    document.addEventListener('click', close);
  }, 50);
}
window.openBoardNumEditor = openBoardNumEditor;

async function saveBoardNumber(fedId, itemKey, val) {
  document.getElementById('board-num-popup')?.remove();
  const num = val === '' || val == null ? null : parseInt(val, 10);
  try {
    if (num === null) {
      await db.ref(`youthPlayers/${fedId}/boardNumbers/${itemKey}`).remove();
      if (_youthPlayers[String(fedId)]?.boardNumbers) delete _youthPlayers[String(fedId)].boardNumbers[itemKey];
    } else {
      await db.ref(`youthPlayers/${fedId}/boardNumbers/${itemKey}`).set(num);
      if (_youthPlayers[String(fedId)]) {
        if (!_youthPlayers[String(fedId)].boardNumbers) _youthPlayers[String(fedId)].boardNumbers = {};
        _youthPlayers[String(fedId)].boardNumbers[itemKey] = num;
      }
    }
    renderYouthPlayers();
  } catch(e) {
    showToast('שגיאה: ' + e.message, 'error');
  }
}
window.saveBoardNumber = saveBoardNumber;

function openClubInfoEditor(fedId) {
  const existing = document.getElementById('club-info-popup');
  if (existing) { existing.remove(); return; }
  const pl = _youthPlayers[String(fedId)] || {};
  const ci = pl.clubInfo || {};
  const mv = ci.motivation || '';
  const S = 'width:100%;padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:inherit;background:white;box-sizing:border-box';
  const L = t => `<div style="font-size:11px;font-weight:700;color:#4a5568;margin-bottom:4px">${t}</div>`;
  const YN = (id, v) => `<select id="${id}" style="${S}">
    <option value="">לא ידוע</option>
    <option value="yes"${v===true?' selected':''}>כן</option>
    <option value="no"${v===false?' selected':''}>לא</option>
  </select>`;
  const popup = document.createElement('div');
  popup.id = 'club-info-popup';
  popup.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;border-radius:14px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,0.3);z-index:9999;min-width:290px;max-width:360px;width:90vw;max-height:85vh;overflow-y:auto;font-family:inherit;direction:rtl';
  popup.innerHTML = `
    <div style="font-size:14px;font-weight:700;color:#2d3748;margin-bottom:16px">📝 הערות מדריך</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <div>${L('חוג במועדון')}<input id="ci-clubGroup" type="text" value="${(ci.clubGroup||'').replace(/"/g,'&quot;')}" placeholder="לדוגמה: גיל 10 — יום ראשון 17:00" style="${S}"></div>
      <div>${L('מאמן אישי')}<input id="ci-personalCoach" type="text" value="${(ci.personalCoach||'').replace(/"/g,'&quot;')}" placeholder="שם המאמן" style="${S}"></div>
      <div>${L('מוטיבציה לשחמט')}
        <select id="ci-motivation" style="${S}">
          <option value=""${!mv?' selected':''}>לא הוגדר</option>
          <option value="גבוהה"${mv==='גבוהה'?' selected':''}>גבוהה ⬆</option>
          <option value="בינונית"${mv==='בינונית'?' selected':''}>בינונית ➡</option>
          <option value="נמוכה"${mv==='נמוכה'?' selected':''}>נמוכה ⬇</option>
        </select>
      </div>
      <div>${L('משתתף בימי שישי?')}${YN('ci-friday', ci.attendsFriday)}</div>
      <div>${L('משתתף בתחרויות מועדון?')}${YN('ci-clubTournaments', ci.attendsClubTournaments)}</div>
      <div>${L('משתתף בתחרויות ארציות?')}${YN('ci-nationalTournaments', ci.attendsNationalTournaments)}</div>
      <div>${L('הערות')}<textarea id="ci-notes" rows="3" placeholder="הערות חופשיות..." style="${S}">${(ci.notes||'').replace(/</g,'&lt;')}</textarea></div>
    </div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button onclick="window.saveClubInfo('${fedId}')"
        style="flex:1;padding:10px;background:#553c9a;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
        שמור
      </button>
      <button onclick="document.getElementById('club-info-popup')?.remove()"
        style="padding:10px 14px;background:#f7fafc;color:#718096;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">
        ביטול
      </button>
    </div>`;
  document.body.appendChild(popup);
  setTimeout(() => {
    const close = e => { if (!popup.contains(e.target)) { popup.remove(); document.removeEventListener('click', close); } };
    document.addEventListener('click', close);
  }, 50);
}
window.openClubInfoEditor = openClubInfoEditor;

async function saveClubInfo(fedId) {
  const getYN = id => { const v = document.getElementById(id)?.value; return v==='yes' ? true : v==='no' ? false : null; };
  const data = {
    clubGroup:                    document.getElementById('ci-clubGroup')?.value.trim() || null,
    personalCoach:                document.getElementById('ci-personalCoach')?.value.trim() || null,
    motivation:                   document.getElementById('ci-motivation')?.value || null,
    attendsFriday:                getYN('ci-friday'),
    attendsClubTournaments:       getYN('ci-clubTournaments'),
    attendsNationalTournaments:   getYN('ci-nationalTournaments'),
    notes:                        document.getElementById('ci-notes')?.value.trim() || null,
  };
  document.getElementById('club-info-popup')?.remove();
  const clean = JSON.parse(JSON.stringify(data, (k,v) => v===undefined ? null : v));
  try {
    await db.ref(`youthPlayers/${fedId}/clubInfo`).set(clean);
    if (_youthPlayers[String(fedId)]) _youthPlayers[String(fedId)].clubInfo = clean;
    renderYouthPlayers();
  } catch(e) {
    showToast('שגיאה: ' + e.message, 'error');
  }
}
window.saveClubInfo = saveClubInfo;

function openGoalsEditor(fedId) {
  const existing = document.getElementById('goals-popup');
  if (existing) { existing.remove(); return; }
  const pl = _youthPlayers[String(fedId)] || {};
  const g = pl.goals || {};
  const S = 'width:100%;padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:inherit;box-sizing:border-box';
  const L = t => `<div style="font-size:11px;font-weight:700;color:#4a5568;margin-bottom:4px">${t}</div>`;
  const popup = document.createElement('div');
  popup.id = 'goals-popup';
  popup.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;border-radius:14px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,0.3);z-index:9999;min-width:280px;max-width:340px;width:90vw;font-family:inherit;direction:rtl';
  popup.innerHTML = `
    <div style="font-size:14px;font-weight:700;color:#276749;margin-bottom:16px">🎯 מטרות לשנה הקרובה</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <div>${L('מטרה ראשית')}<input id="g-primary" type="text" value="${(g.primary||'').replace(/"/g,'&quot;')}" placeholder="לדוגמה: להעלות מד כושר ב-100 נקודות" style="${S}"></div>
      <div>${L('מטרה משנית')}<input id="g-secondary" type="text" value="${(g.secondary||'').replace(/"/g,'&quot;')}" placeholder="לדוגמה: להשתתף באליפות ישראל" style="${S}"></div>
      <div>${L('יעד מד כושר')}<input id="g-targetRating" type="number" min="100" max="3000" value="${g.targetRating||''}" placeholder="לדוגמה: 1500" style="${S};direction:ltr"></div>
    </div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button onclick="window.saveGoals('${fedId}')"
        style="flex:1;padding:10px;background:#276749;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
        שמור
      </button>
      <button onclick="document.getElementById('goals-popup')?.remove()"
        style="padding:10px 14px;background:#f7fafc;color:#718096;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">
        ביטול
      </button>
    </div>`;
  document.body.appendChild(popup);
  setTimeout(() => {
    const close = e => { if (!popup.contains(e.target)) { popup.remove(); document.removeEventListener('click', close); } };
    document.addEventListener('click', close);
  }, 50);
}
window.openGoalsEditor = openGoalsEditor;

async function saveGoals(fedId) {
  const primary   = document.getElementById('g-primary')?.value.trim() || null;
  const secondary = document.getElementById('g-secondary')?.value.trim() || null;
  const tr = document.getElementById('g-targetRating')?.value;
  const targetRating = tr ? parseInt(tr, 10) : null;
  document.getElementById('goals-popup')?.remove();
  const data = JSON.parse(JSON.stringify({ primary, secondary, targetRating }, (k,v) => v===undefined ? null : v));
  try {
    await db.ref(`youthPlayers/${fedId}/goals`).set(data);
    if (_youthPlayers[String(fedId)]) _youthPlayers[String(fedId)].goals = data;
    renderYouthPlayers();
  } catch(e) {
    showToast('שגיאה: ' + e.message, 'error');
  }
}
window.saveGoals = saveGoals;

window.syncAllTeamsData = syncAllTeamsData;
window.loadLeagueStars = loadLeagueStars;
window.addClubTeamManualTyped = addClubTeamManualTyped;
window.renderLeagueTypePanels = renderLeagueTypePanels;
window.openTeamDetail = openTeamDetail;
window.closeTeamDetail = closeTeamDetail;
window.switchTeamDetailTab = switchTeamDetailTab;
window.fetchAndShowTeamSchedule = fetchAndShowTeamSchedule;
window.fetchAndCacheTeamPlayers = fetchAndCacheTeamPlayers;
