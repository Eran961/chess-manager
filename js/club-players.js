// ===== שחקני המועדון — live lookup dashboard (no persistence) =====
// Search is restricted to the federation's own roster for our club (clubId
// 31, ראשון לציון) — fetched once per tab-open from our own Render backend
// (same server chess-teams already uses for club-teams/player-profile, no
// public CORS proxy involved). Selecting a result fetches that player's full
// profile and renders a read-only dashboard. Nothing here is ever written to
// Firebase or anywhere else — closing the tab or picking a different player
// simply discards it; re-opening a player re-fetches fresh.

const CLUB_PLAYERS_API = 'https://chess-manager-7wkr.onrender.com';
const CLUB_PLAYERS_CLUB_ID = 31;

let _clubPlayersRoster = null;      // cached [{fedId, name, rating, age}, ...]
let _clubPlayersRosterLoading = false;
let _clubPlayerSelected = null;     // full profile of the currently displayed player
let _clubPlayerChartMode = 'line';  // 'line' (rating over time) | 'bar' (monthly W/D/L)
let _clubPlayersOutsideClickBound = false;

function renderClubPlayersPanel() {
  // Deliberately NOT wrapped in .att-card (used everywhere else in the app) —
  // that class sets overflow:hidden (needed elsewhere to clip its header's
  // rounded corners), which was silently clipping the search-results dropdown
  // below, right where the card's own edge ends. Same visual look (green
  // header + white body, matching corner radii), built without the clipping.
  // .att-card also hardcodes color:#1a202c (dark text) regardless of theme —
  // without it here, text falls back to the surrounding dark-theme default
  // (--text-primary, near-white), turning it invisible on this white card;
  // restored explicitly below rather than re-adding the class.
  return `
    <div style="max-width:920px;color:#1a202c">
      <div class="att-card-header" style="border-radius:12px 12px 0 0">🎖️ שחקני המועדון</div>
      <div style="background:white;box-shadow:0 1px 4px rgba(0,0,0,0.08);border-radius:0 0 12px 12px;padding:20px">
        <div style="font-size:13px;color:#718096;margin-bottom:14px">
          חיפוש בזמן אמת מתוך שחקני מועדון השחמט ראשון לציון הרשומים באיגוד.
        </div>
        <div id="cp-search-wrap" style="position:relative;max-width:420px">
          <input id="cp-search" type="text" placeholder="🔍 חפש שחקן לפי שם..." autocomplete="off"
            oninput="onClubPlayerSearchInput(this.value)"
            style="width:100%;box-sizing:border-box;padding:11px 14px;border:2px solid #e2e8f0;border-radius:10px;font-size:15px;font-family:inherit"
            onfocus="this.style.borderColor='#553c9a'" onblur="this.style.borderColor='#e2e8f0'">
          <div id="cp-search-results" style="display:none;position:absolute;top:calc(100% + 4px);right:0;left:0;background:white;border:1px solid #e2e8f0;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.12);max-height:320px;overflow-y:auto;z-index:20"></div>
        </div>
        <div id="cp-status" style="margin-top:10px;font-size:13px;color:#718096"></div>
        <div id="cp-dashboard" style="margin-top:22px"></div>
      </div>
    </div>`;
}

async function initClubPlayersTab() {
  if (!_clubPlayersOutsideClickBound) {
    _clubPlayersOutsideClickBound = true;
    document.addEventListener('click', (e) => {
      const wrap = document.getElementById('cp-search-wrap');
      const results = document.getElementById('cp-search-results');
      if (wrap && results && !wrap.contains(e.target)) results.style.display = 'none';
    });
  }
  if (_clubPlayersRoster || _clubPlayersRosterLoading) return;
  await loadClubPlayersRoster();
}

async function loadClubPlayersRoster() {
  _clubPlayersRosterLoading = true;
  const statusEl = document.getElementById('cp-status');
  if (statusEl) { statusEl.style.color = '#718096'; statusEl.textContent = '⏳ טוען רשימת שחקני המועדון... (ייתכן עיכוב של עד דקה אם השרת נרדם)'; }
  try {
    const res = await fetch(`${CLUB_PLAYERS_API}/api/club-players?clubId=${CLUB_PLAYERS_CLUB_ID}`, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) throw new Error(`שגיאת שרת ${res.status}`);
    const list = await res.json();
    if (!Array.isArray(list) || !list.length) throw new Error('לא נמצאו שחקנים');
    _clubPlayersRoster = list;
    if (statusEl) { statusEl.style.color = '#718096'; statusEl.textContent = `${list.length} שחקני מועדון נטענו — התחל להקליד שם לחיפוש`; }
  } catch (e) {
    _clubPlayersRoster = null;
    if (statusEl) { statusEl.style.color = '#c53030'; statusEl.textContent = `❌ שגיאה בטעינת הרשימה: ${e.message}`; }
  } finally {
    _clubPlayersRosterLoading = false;
  }
}
window.initClubPlayersTab = initClubPlayersTab;

function clubPlayerNameMatches(name, query) {
  const words = query.trim().split(/\s+/).filter(Boolean);
  return words.every(w => name.includes(w));
}

function onClubPlayerSearchInput(val) {
  const resultsEl = document.getElementById('cp-search-results');
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
  resultsEl.innerHTML = matches.map(p => `
    <div onclick="selectClubPlayer(${p.fedId})"
      style="padding:10px 14px;cursor:pointer;border-bottom:1px solid #f0f4f8;display:flex;justify-content:space-between;align-items:center;gap:10px"
      onmouseenter="this.style.background='#f7fafc'" onmouseleave="this.style.background=''">
      <span style="font-weight:600;color:#2d3748">${p.name}</span>
      <span style="font-size:12px;color:#718096;white-space:nowrap">${p.rating ? 'מד כושר ' + p.rating : ''}${p.age != null ? ' · גיל ' + p.age : ''}</span>
    </div>`).join('');
}
window.onClubPlayerSearchInput = onClubPlayerSearchInput;

async function selectClubPlayer(fedId) {
  const searchInput = document.getElementById('cp-search');
  const resultsEl = document.getElementById('cp-search-results');
  if (searchInput) searchInput.value = '';
  if (resultsEl) { resultsEl.style.display = 'none'; resultsEl.innerHTML = ''; }
  const dash = document.getElementById('cp-dashboard');
  if (!dash) return;
  dash.innerHTML = '<div style="text-align:center;padding:50px;color:#a0aec0">⏳ טוען נתוני שחקן... (ייתכן עיכוב של עד דקה אם השרת נרדם)</div>';
  try {
    const res = await fetch(`${CLUB_PLAYERS_API}/api/player-profile?fedId=${fedId}`, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) throw new Error(`שגיאת שרת ${res.status}`);
    const data = await res.json();
    if (!data.name) throw new Error('שחקן לא נמצא');
    _clubPlayerSelected = data;
    _clubPlayerChartMode = 'line';
    _clubPlayerTournPage = 1;
    dash.innerHTML = renderClubPlayerDashboard(data);
  } catch (e) {
    dash.innerHTML = `<div style="text-align:center;padding:50px;color:#c53030">❌ שגיאה בשליפת נתוני השחקן: ${e.message}</div>`;
  }
}
window.selectClubPlayer = selectClubPlayer;

function refreshClubPlayer() {
  if (_clubPlayerSelected?.fedId != null) selectClubPlayer(_clubPlayerSelected.fedId);
}
window.refreshClubPlayer = refreshClubPlayer;

// ── Small date helper: backend tournament dates are DD/MM/YYYY ──────────────
function cpDdmmyyyyToIso(raw) {
  const m = (raw || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

const CP_MONTH_NAMES_FULL = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

// The rating-history chart (both line and bar view) only ever shows the last
// two years, counted back from today — a player with several years of
// history otherwise crams dozens of points/bars into one small chart,
// unreadable regardless of view. First day of the month, 24 months back
// (e.g. viewed in 2026-09 -> cutoff 2024-09-01), so the caption's "from
// <month>" always names a clean, real calendar month.
function cpTwoYearCutoff() {
  const now = new Date();
  const year = now.getFullYear() - 2;
  const month = now.getMonth(); // 0-indexed, unchanged
  return {
    iso: `${year}-${String(month + 1).padStart(2, '0')}-01`,
    label: `${CP_MONTH_NAMES_FULL[month]} ${year}`,
  };
}

// Every number/list in this dashboard (metric cards, donut, both charts, the
// tournament table) is scoped to the last two years — one shared filter so
// none of them can quietly disagree with each other about the time range.
function cpFilteredTournaments(tournaments) {
  const cutoff = cpTwoYearCutoff();
  return (tournaments || []).filter(t => {
    const iso = cpDdmmyyyyToIso(t.updateDate) || cpDdmmyyyyToIso(t.date);
    return iso && iso >= cutoff.iso;
  });
}

// Every month from the cutoff month through the current one, inclusive —
// the fixed X-axis grid both charts are built on, so they always start at
// exactly the same place (the cutoff) regardless of where each one's real
// data happens to begin, and the line chart always has one point per month
// (see cpMonthlyRatingSeries) rather than only months with an actual update.
function cpMonthGrid() {
  const cutoff = cpTwoYearCutoff();
  const now = new Date();
  const months = [];
  let y = parseInt(cutoff.iso.slice(0, 4), 10);
  let m = parseInt(cutoff.iso.slice(5, 7), 10);
  const endY = now.getFullYear(), endM = now.getMonth() + 1;
  while (y < endY || (y === endY && m <= endM)) {
    months.push({ year: y, month: m, iso: `${y}-${String(m).padStart(2, '0')}-01` });
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

// One entry per grid month: a real rating update that month if there is one,
// else the most recently known rating carried forward (isReal:false) — so
// hovering any month in the window always shows "that month's rating", not
// just the months chess.org.il happened to report a change in. A month
// before the player's very first known rating is left out entirely (nothing
// to carry forward from).
function cpMonthlyRatingSeries(ratingHistoryAll) {
  const months = cpMonthGrid();
  const sorted = (ratingHistoryAll || []).filter(r => r && r.date).slice().sort((a, b) => a.date.localeCompare(b.date));
  const byMonth = {};
  sorted.forEach(r => { byMonth[r.date.slice(0, 7)] = r; }); // last entry per month wins
  let lastKnown = null;
  for (const r of sorted) { if (r.date < months[0].iso) lastKnown = r; else break; }

  const series = [];
  months.forEach(mo => {
    const key = `${mo.year}-${String(mo.month).padStart(2, '0')}`;
    const real = byMonth[key];
    if (real) { lastKnown = real; series.push({ date: mo.iso, rating: real.rating, isReal: true }); }
    else if (lastKnown) { series.push({ date: mo.iso, rating: lastKnown.rating, isReal: false }); }
  });
  return series;
}

function cpMonthLabel(iso) {
  const [y, m] = iso.split('-');
  return `${CP_MONTH_NAMES_FULL[+m - 1]} ${y}`;
}

const CP_MONTH_NAMES_SHORT = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יוני', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];
function cpMonthLabelShort(iso) {
  const [y, m] = iso.split('-');
  return `${CP_MONTH_NAMES_SHORT[+m - 1]} '${y.slice(2)}`;
}

function setClubPlayerChartMode(mode) {
  _clubPlayerChartMode = mode;
  const holder = document.getElementById('cp-history-chart');
  if (holder && _clubPlayerSelected) holder.innerHTML = renderClubPlayerHistoryChart(_clubPlayerSelected);
}
window.setClubPlayerChartMode = setClubPlayerChartMode;

// ── Dashboard ─────────────────────────────────────────────────────────────
function renderClubPlayerDashboard(p) {
  const cutoff = cpTwoYearCutoff();
  const tournaments = cpFilteredTournaments(p.tournaments);
  const totalGames = tournaments.reduce((s, t) => s + (parseInt(t.games) || 0), 0);
  const totalWins = tournaments.reduce((s, t) => s + (t.wins || 0), 0);
  const totalLosses = tournaments.reduce((s, t) => s + (t.losses || 0), 0);
  const totalDraws = tournaments.reduce((s, t) => s + (t.draws || 0), 0);
  const history = (p.ratingHistory || []).filter(r => r && r.date >= cutoff.iso).sort((a, b) => a.date.localeCompare(b.date));
  const cumulativeChange = history.length >= 2 ? history[history.length - 1].rating - history[0].rating : null;

  return `
    ${renderClubPlayerHeader(p)}
    ${renderClubPlayerMetricCards(p, totalGames, tournaments.length, cumulativeChange)}
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px">
      <div style="flex:1;min-width:240px">${renderClubPlayerWldDonut(totalWins, totalDraws, totalLosses)}</div>
      <div style="flex:2;min-width:320px" id="cp-history-chart">${renderClubPlayerHistoryChart(p)}</div>
    </div>
    <div id="cp-tourn-table">${renderClubPlayerTournamentTable(tournaments)}</div>`;
}

function renderClubPlayerHeader(p) {
  return `
    <div style="background:white;border:1px solid #e2e8f0;border-radius:14px;padding:18px 20px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
      <div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <span style="font-size:20px;font-weight:800;color:#1a202c">${p.name}</span>
          ${p.grade ? `<span style="background:#ebf8ff;color:#2b6cb0;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700">${p.grade}</span>` : ''}
          <span style="font-size:13px;color:#a0aec0">#${p.fedId}</span>
        </div>
        <div style="margin-top:6px;font-size:13px;color:#718096">
          מועדון השחמט ראשון לציון${p.birthYear ? ' · שנת לידה: ' + p.birthYear : ''}
        </div>
        <div style="margin-top:8px;display:flex;gap:16px;flex-wrap:wrap;align-items:center">
          ${p.fideId ? `<a href="https://ratings.fide.com/profile/${p.fideId}" target="_blank" style="font-size:13px;color:#2b6cb0;text-decoration:none">🔗 FIDE${p.fide ? ' (' + p.fide + ')' : ''}</a>` : (p.fide ? `<span style="font-size:13px;color:#718096">FIDE ${p.fide}</span>` : '')}
          <a href="https://www.chess.org.il/Players/Player.aspx?Id=${p.fedId}" target="_blank" style="font-size:13px;color:#2b6cb0;text-decoration:none">🔗 chess.org.il</a>
        </div>
      </div>
      <button onclick="refreshClubPlayer()" title="רענן נתונים" style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 12px;cursor:pointer;font-size:16px">🔄</button>
    </div>`;
}

function renderClubPlayerMetricCards(p, totalGames, totalTournaments, cumulativeChange) {
  const sinceLabel = `מאז ${cpTwoYearCutoff().label}`;
  const cards = [
    { label: 'שינוי מצטבר', value: cumulativeChange == null ? '—' : (cumulativeChange > 0 ? `+${cumulativeChange}` : `${cumulativeChange}`),
      color: cumulativeChange > 0 ? '#276749' : cumulativeChange < 0 ? '#c53030' : '#4a5568', icon: '↕️', sub: sinceLabel },
    { label: 'משחקים', value: totalGames || '—', color: '#2b6cb0', icon: '⚔️', sub: sinceLabel },
    { label: 'טורנירים', value: totalTournaments || '—', color: '#2b6cb0', icon: '📅', sub: sinceLabel },
    { label: 'דירוג ארצי', value: p.rank ? `#${p.rank}` : '—', color: '#553c9a', icon: '🏅' },
    { label: 'דירוג נוכחי', value: p.rating || '—', color: '#276749', icon: '📈',
      sub: p.ratingExpected ? `צפוי: ${p.ratingExpected}` : null, subColor: '#b7791f' },
  ];
  return `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:16px">
      ${cards.map(c => `
        <div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:14px;text-align:center">
          <div style="font-size:16px;margin-bottom:4px">${c.icon}</div>
          <div style="font-size:22px;font-weight:800;color:${c.color}">${c.value}</div>
          <div style="font-size:11px;color:#a0aec0;font-weight:600;margin-top:2px">${c.label}</div>
          ${c.sub ? `<div style="font-size:10px;color:${c.subColor || '#cbd5e0'};font-weight:600;margin-top:2px">${c.sub}</div>` : ''}
        </div>`).join('')}
    </div>`;
}

function renderClubPlayerWldDonut(wins, draws, losses) {
  const total = wins + draws + losses;
  if (!total) {
    return `<div style="background:white;border:1px solid #e2e8f0;border-radius:14px;padding:18px;text-align:center;color:#a0aec0;font-size:13px;height:100%;display:flex;align-items:center;justify-content:center">אין נתוני משחקים</div>`;
  }
  const R = 50, CX = 60, CY = 60, SW = 16;
  const circumference = 2 * Math.PI * R;
  const segs = [
    { key: 'wins', n: wins, color: '#38a169' },
    { key: 'draws', n: draws, color: '#a0aec0' },
    { key: 'losses', n: losses, color: '#e53e3e' },
  ];
  let offset = 0;
  const circles = segs.filter(s => s.n > 0).map(s => {
    const len = (s.n / total) * circumference;
    const dash = `${len} ${circumference - len}`;
    const circle = `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${s.color}" stroke-width="${SW}" stroke-dasharray="${dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${CX} ${CY})"/>`;
    offset += len;
    return circle;
  }).join('');
  const pct = n => Math.round((n / total) * 100);
  return `
    <div style="background:white;border:1px solid #e2e8f0;border-radius:14px;padding:18px;height:100%;box-sizing:border-box">
      <div style="font-size:14px;font-weight:700;color:#2d3748;margin-bottom:10px">ניצחונות / תיקו / הפסדים</div>
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;justify-content:center">
        <svg viewBox="0 0 120 120" width="130" height="130">
          <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="#f0f4f8" stroke-width="${SW}"/>
          ${circles}
          <text x="${CX}" y="${CY + 6}" text-anchor="middle" font-size="22" font-weight="800" fill="#2d3748">${total}</text>
        </svg>
        <div style="font-size:13px;display:flex;flex-direction:column;gap:6px">
          <div><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#38a169;margin-left:6px"></span>ניצחונות ${wins} (${pct(wins)}%)</div>
          <div><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#a0aec0;margin-left:6px"></span>תיקו ${draws} (${pct(draws)}%)</div>
          <div><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#e53e3e;margin-left:6px"></span>הפסדים ${losses} (${pct(losses)}%)</div>
        </div>
      </div>
    </div>`;
}

function renderClubPlayerHistoryChart(p) {
  const cutoff = cpTwoYearCutoff();
  const toggle = `
    <div style="display:flex;gap:4px">
      <button onclick="setClubPlayerChartMode('line')" title="גרף קו" style="background:${_clubPlayerChartMode === 'line' ? '#553c9a' : '#f7fafc'};color:${_clubPlayerChartMode === 'line' ? 'white' : '#4a5568'};border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:13px">📈</button>
      <button onclick="setClubPlayerChartMode('bar')" title="גרף עמודות" style="background:${_clubPlayerChartMode === 'bar' ? '#553c9a' : '#f7fafc'};color:${_clubPlayerChartMode === 'bar' ? 'white' : '#4a5568'};border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:13px">📊</button>
    </div>`;
  // Both views are built on the same fixed month grid (cpMonthGrid) so they
  // always start at the same cutoff month regardless of where each one's
  // real data happens to begin — passing the full (unfiltered) history/
  // tournaments in lets each one do its own grid-based windowing, the line
  // chart's needing to look further back to seed carry-forward correctly.
  const body = _clubPlayerChartMode === 'line' ? clubPlayerRatingLineSvg(p.ratingHistory || []) : clubPlayerMonthlyBarSvg(p.tournaments || []);
  return `
    <div style="background:white;border:1px solid #e2e8f0;border-radius:14px;padding:18px;height:100%;box-sizing:border-box">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
        <div style="font-size:14px;font-weight:700;color:#2d3748">היסטוריית דירוג</div>
        ${toggle}
      </div>
      <div style="font-size:12px;font-weight:700;color:#553c9a;margin-bottom:10px">נתוני השנתיים האחרונות (מ-${cutoff.label})</div>
      <div dir="ltr">${body}</div>
    </div>`;
}

// One shared, module-level record of the currently-rendered line chart's
// point positions/values, in the SVG's own coordinate space — read by
// cpChartHover() below on every pointer move so it doesn't have to
// recompute chart geometry on each event, just look up the nearest point.
let _cpLineChartData = null;

function clubPlayerRatingLineSvg(ratingHistoryAll) {
  const chrono = cpMonthlyRatingSeries(ratingHistoryAll);
  if (!chrono.length) { _cpLineChartData = null; return `<div style="padding:30px;text-align:center;color:#a0aec0;font-size:13px">אין נתוני היסטוריית דירוג</div>`; }
  const ratings = chrono.map(r => r.rating);
  const pad = 25;
  const minR = Math.min(...ratings) - pad, maxR = Math.max(...ratings) + pad;
  const W = 480, H = 210, PL = 50, PR = 14, PT = 14, PB = 30;
  const cW = W - PL - PR, cH = H - PT - PB;
  const n = chrono.length;
  const xPos = i => PL + (n < 2 ? cW / 2 : (i / (n - 1)) * cW);
  const yPos = r => PT + (1 - (r - minR) / (maxR - minR)) * cH;
  const pts = chrono.map((r, i) => [xPos(i), yPos(r.rating)]);
  let linePath = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const cx = (x1 - x0) * 0.4;
    linePath += ` C${(x0 + cx).toFixed(1)},${y0.toFixed(1)} ${(x1 - cx).toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  const areaPath = linePath + ` L${pts[n - 1][0].toFixed(1)},${(PT + cH).toFixed(1)} L${PL},${(PT + cH).toFixed(1)} Z`;
  const rRange = maxR - minR;
  const gStep = rRange > 150 ? 50 : rRange > 60 ? 25 : 20;
  const firstG = Math.ceil(minR / gStep) * gStep;
  let grids = `<line x1="${PL}" y1="${PT}" x2="${PL}" y2="${PT + cH}" stroke="#e9d8fd" stroke-width="1"/>`;
  for (let g = firstG; g <= maxR; g += gStep) {
    const gy = yPos(g);
    if (gy < PT - 2 || gy > PT + cH + 2) continue;
    grids += `<line x1="${PL}" y1="${gy.toFixed(1)}" x2="${W - PR}" y2="${gy.toFixed(1)}" stroke="#ede9ff" stroke-width="0.8"/>`;
    grids += `<text x="${PL - 8}" y="${(gy + 4).toFixed(1)}" font-size="10" fill="#9f7aea" text-anchor="end" font-weight="700">${g}</text>`;
  }
  // Horizontal, evenly-spaced month labels (not rotated) — needs more room
  // per label than the old rotated version, so fewer of them show at once.
  const labelEvery = Math.max(1, Math.ceil(n / 7));
  let xLabels = '';
  chrono.forEach((r, i) => {
    if (i % labelEvery !== 0 && i !== n - 1) return;
    const x = xPos(i).toFixed(1);
    xLabels += `<text x="${x}" y="${(PT + cH + 18).toFixed(1)}" font-size="10" fill="#9f7aea" text-anchor="middle" font-weight="600">${cpMonthLabelShort(r.date)}</text>`;
  });
  let dots = '';
  pts.forEach(([x, y], i) => {
    const r = chrono[i];
    const isLatest = i === n - 1;
    // Carried-forward months (no real update that month — see
    // cpMonthlyRatingSeries) get a smaller, lighter dot so it's visually
    // clear which months are real vs. "still the same rating as before",
    // while every month is still a real hoverable point either way.
    const radius = isLatest ? 5.5 : (r.isReal ? 3.8 : 2.6);
    const color = isLatest ? '#553c9a' : (r.isReal ? '#805ad5' : '#c4b5e0');
    dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${radius}" fill="${color}" stroke="white" stroke-width="1.6"/>`;
  });

  _cpLineChartData = {
    W, H, plotTop: PT, plotBottom: PT + cH,
    points: chrono.map((r, i) => ({ x: pts[i][0], y: pts[i][1], date: r.date, rating: r.rating, isReal: r.isReal })),
  };

  return `<svg id="cp-line-svg" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" preserveAspectRatio="xMidYMid meet"
      style="display:block;overflow:visible;max-width:100%;height:auto;touch-action:none">
    <defs><linearGradient id="cp-rg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#805ad5" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="#805ad5" stop-opacity="0.02"/>
    </linearGradient></defs>
    ${grids}
    <path d="${areaPath}" fill="url(#cp-rg)" stroke="none"/>
    <path d="${linePath}" fill="none" stroke="#6b46c1" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    ${dots}${xLabels}
    <line id="cp-line-crosshair" x1="0" y1="${PT}" x2="0" y2="${PT + cH}" stroke="#805ad5" stroke-width="1" stroke-dasharray="3,3" opacity="0" pointer-events="none"/>
    <circle id="cp-line-active-dot" r="5.5" fill="#553c9a" stroke="white" stroke-width="2" opacity="0" pointer-events="none"/>
    <g id="cp-line-tooltip" opacity="0" pointer-events="none">
      <rect id="cp-line-tooltip-bg" width="76" height="38" rx="7" fill="#2d3748"/>
      <text id="cp-line-tooltip-rating" text-anchor="middle" font-size="13" font-weight="800" fill="white"></text>
      <text id="cp-line-tooltip-month" text-anchor="middle" font-size="9.5" fill="#cbd5e0"></text>
    </g>
    <rect x="0" y="0" width="${W}" height="${H}" fill="transparent" style="cursor:crosshair"
      onmousemove="cpChartHover(event)" onmouseleave="cpChartHoverEnd()"
      ontouchstart="cpChartHover(event)" ontouchmove="cpChartHover(event)" ontouchend="cpChartHoverEnd()"/>
  </svg>`;
}

// Real interactive hover/touch, matching a normal charting library instead
// of a native browser <title> tooltip (which doesn't work on touch at all,
// and gives no visual crosshair): finds the month nearest the pointer,
// regardless of exactly where over the chart it is, and moves a crosshair
// line + highlighted dot + floating tooltip box there. getScreenCTM() does
// the CSS-pixel-to-SVG-viewBox-unit conversion so this stays correct at any
// rendered size.
function cpChartHover(event) {
  if (!_cpLineChartData) return;
  const svg = document.getElementById('cp-line-svg');
  if (!svg) return;
  const touch = event.touches && event.touches[0];
  if (touch && event.cancelable) event.preventDefault(); // block page scroll while dragging across the chart
  const clientX = touch ? touch.clientX : event.clientX;
  const clientY = touch ? touch.clientY : event.clientY;
  if (clientX == null) return;

  const pt = svg.createSVGPoint();
  pt.x = clientX; pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return;
  const svgP = pt.matrixTransform(ctm.inverse());

  const { points, W, plotTop, plotBottom } = _cpLineChartData;
  let nearest = points[0], minDist = Infinity;
  for (const p of points) {
    const d = Math.abs(p.x - svgP.x);
    if (d < minDist) { minDist = d; nearest = p; }
  }

  const crosshair = document.getElementById('cp-line-crosshair');
  const dot = document.getElementById('cp-line-active-dot');
  const tooltipG = document.getElementById('cp-line-tooltip');
  const tooltipBg = document.getElementById('cp-line-tooltip-bg');
  const tooltipRating = document.getElementById('cp-line-tooltip-rating');
  const tooltipMonth = document.getElementById('cp-line-tooltip-month');
  if (!crosshair || !dot || !tooltipG || !tooltipBg || !tooltipRating || !tooltipMonth) return;

  crosshair.setAttribute('x1', nearest.x); crosshair.setAttribute('x2', nearest.x); crosshair.setAttribute('opacity', '1');
  dot.setAttribute('cx', nearest.x); dot.setAttribute('cy', nearest.y); dot.setAttribute('opacity', '1');

  const boxW = 76, boxH = 38, gap = 12;
  let boxX = nearest.x - boxW / 2;
  boxX = Math.max(2, Math.min(W - 2 - boxW, boxX));
  let boxY = nearest.y - boxH - gap;
  if (boxY < plotTop) boxY = Math.min(plotBottom - boxH, nearest.y + gap); // flip below if no room above

  tooltipBg.setAttribute('x', boxX); tooltipBg.setAttribute('y', boxY);
  tooltipRating.setAttribute('x', boxX + boxW / 2); tooltipRating.setAttribute('y', boxY + 17);
  tooltipMonth.setAttribute('x', boxX + boxW / 2); tooltipMonth.setAttribute('y', boxY + 30);
  tooltipRating.textContent = nearest.isReal ? nearest.rating : `${nearest.rating} (ק)`;
  tooltipMonth.textContent = cpMonthLabelShort(nearest.date);
  tooltipG.setAttribute('opacity', '1');
}
window.cpChartHover = cpChartHover;

function cpChartHoverEnd() {
  const crosshair = document.getElementById('cp-line-crosshair');
  const dot = document.getElementById('cp-line-active-dot');
  const tooltipG = document.getElementById('cp-line-tooltip');
  if (crosshair) crosshair.setAttribute('opacity', '0');
  if (dot) dot.setAttribute('opacity', '0');
  if (tooltipG) tooltipG.setAttribute('opacity', '0');
}
window.cpChartHoverEnd = cpChartHoverEnd;

function clubPlayerMonthlyBarSvg(tournamentsAll) {
  const byMonth = {};
  (tournamentsAll || []).forEach(t => {
    const iso = cpDdmmyyyyToIso(t.updateDate) || cpDdmmyyyyToIso(t.date);
    if (!iso) return;
    const key = iso.slice(0, 7);
    if (!byMonth[key]) byMonth[key] = { wins: 0, draws: 0, losses: 0 };
    byMonth[key].wins += t.wins || 0;
    byMonth[key].draws += t.draws || 0;
    byMonth[key].losses += t.losses || 0;
  });
  // Every month in the window, not just months with a tournament in them —
  // same reason as the line chart: without this, the chart silently starts
  // wherever this player's first tournament in the window happens to fall
  // (e.g. April) instead of the real cutoff month, disagreeing with both the
  // caption above it and the line view right next to it.
  const months = cpMonthGrid().map(mo => `${mo.year}-${String(mo.month).padStart(2, '0')}`);
  const monthShort = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יוני', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];
  const totals = months.map(m => { const b = byMonth[m]; return b ? b.wins + b.draws + b.losses : 0; });
  const maxTotal = Math.max(...totals, 1);
  const W = 480, H = 200, PL = 30, PR = 10, PT = 14, PB = 42;
  const cW = W - PL - PR, cH = H - PT - PB;
  const n = months.length;
  const gap = 6;
  const barW = Math.max(6, cW / n - gap);
  // Same overlap risk the line chart already guards against (D-01): with the
  // two-year cap this rarely exceeds ~24 bars, but a label per bar, upright
  // and centered, still crowds well before that — skip + rotate exactly like
  // the line chart's X labels, which tolerate density far better upright text
  // can't.
  const labelEvery = Math.max(1, Math.ceil(n / 10));
  let bars = '', labels = '';
  months.forEach((m, i) => {
    const x = PL + i * (cW / n) + ((cW / n) - barW) / 2;
    const { wins, draws, losses } = byMonth[m] || { wins: 0, draws: 0, losses: 0 };
    let y = PT + cH;
    [{ n: losses, color: '#e53e3e' }, { n: draws, color: '#a0aec0' }, { n: wins, color: '#38a169' }].forEach(seg => {
      if (!seg.n) return;
      const h = (seg.n / maxTotal) * cH;
      y -= h;
      bars += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" fill="${seg.color}"><title>${cpMonthLabel(m + '-01')}: ${seg.n}</title></rect>`;
    });
    if (i % labelEvery !== 0 && i !== n - 1) return;
    const [yr, mo] = m.split('-');
    const lx = (x + barW / 2).toFixed(1), ly = (PT + cH + 8).toFixed(1);
    labels += `<text x="${lx}" y="${ly}" font-size="9" fill="#9f7aea" text-anchor="end" font-weight="600" transform="rotate(-40,${lx},${ly})">${monthShort[+mo - 1]} ${yr.slice(2)}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" preserveAspectRatio="xMidYMid meet" style="display:block;overflow:visible;max-width:100%;height:auto">
    <line x1="${PL}" y1="${PT + cH}" x2="${W - PR}" y2="${PT + cH}" stroke="#e2e8f0" stroke-width="1"/>
    ${bars}${labels}
  </svg>`;
}

let _clubPlayerTournPage = 1;
const CP_TOURN_PAGE_SIZE = 10;

function setClubPlayerTournPage(page) {
  _clubPlayerTournPage = page;
  const holder = document.getElementById('cp-tourn-table');
  if (holder && _clubPlayerSelected) holder.innerHTML = renderClubPlayerTournamentTable(cpFilteredTournaments(_clubPlayerSelected.tournaments));
}
window.setClubPlayerTournPage = setClubPlayerTournPage;

function renderClubPlayerTournamentTable(tournaments) {
  if (!tournaments.length) {
    return `<div style="background:white;border:1px solid #e2e8f0;border-radius:14px;padding:24px;text-align:center;color:#a0aec0;font-size:13px">אין תחרויות בשנתיים האחרונות</div>`;
  }
  const sorted = tournaments.slice().sort((a, b) => (cpDdmmyyyyToIso(b.date) || '').localeCompare(cpDdmmyyyyToIso(a.date) || ''));
  const totalPages = Math.max(1, Math.ceil(sorted.length / CP_TOURN_PAGE_SIZE));
  if (_clubPlayerTournPage > totalPages) _clubPlayerTournPage = totalPages;
  if (_clubPlayerTournPage < 1) _clubPlayerTournPage = 1;
  const startIdx = (_clubPlayerTournPage - 1) * CP_TOURN_PAGE_SIZE;
  const pageItems = sorted.slice(startIdx, startIdx + CP_TOURN_PAGE_SIZE);

  const rows = pageItems.map((t, i) => {
    const isFirstOverall = (startIdx + i) === 0;
    const changeNum = t.ratingChange;
    const changeColor = changeNum > 0 ? '#276749' : changeNum < 0 ? '#c53030' : '#718096';
    const changeStr = t.ratingChangeRaw || (changeNum != null ? String(changeNum) : '—');
    const badges = [
      t.wins ? `<span style="background:#f0fff4;color:#276749;padding:1px 7px;border-radius:10px;font-size:11px;font-weight:700">${t.wins}נ</span>` : '',
      t.draws ? `<span style="background:#f7fafc;color:#4a5568;padding:1px 7px;border-radius:10px;font-size:11px;font-weight:700">${t.draws}ת</span>` : '',
      t.losses ? `<span style="background:#fff5f5;color:#c53030;padding:1px 7px;border-radius:10px;font-size:11px;font-weight:700">${t.losses}ה</span>` : '',
    ].filter(Boolean).join(' ');
    const pendingBadge = t.isPending ? `<span style="background:#fefcbf;color:#744210;padding:1px 8px;border-radius:10px;font-size:11px;font-weight:700;margin-inline-start:6px">בעדכון הבא</span>` : '';
    const newBadge = isFirstOverall ? `<span style="background:#ebf8ff;color:#2b6cb0;padding:1px 8px;border-radius:10px;font-size:11px;font-weight:700;margin-inline-start:6px">חדש</span>` : '';
    return `
      <tr style="border-bottom:1px solid #f0f4f8">
        <td style="padding:9px 12px;font-size:12px;color:#718096;white-space:nowrap">${t.date}</td>
        <td style="padding:9px 12px;font-size:13px">${t.name || '—'}${newBadge}${pendingBadge}</td>
        <td style="padding:9px 12px;text-align:center;font-size:13px">${t.games || '—'}</td>
        <td style="padding:9px 12px;text-align:center;white-space:nowrap">${badges || '—'}</td>
        <td style="padding:9px 12px;text-align:center;font-weight:700;color:${changeColor};font-size:13px">${changeStr}</td>
      </tr>`;
  }).join('');

  const pagerHtml = totalPages > 1 ? `
    <div style="display:flex;justify-content:center;align-items:center;gap:12px;padding:10px;border-top:1px solid #f0f4f8">
      <button onclick="setClubPlayerTournPage(${_clubPlayerTournPage - 1})" ${_clubPlayerTournPage === 1 ? 'disabled' : ''}
        style="background:${_clubPlayerTournPage === 1 ? '#f7fafc' : '#553c9a'};color:${_clubPlayerTournPage === 1 ? '#cbd5e0' : 'white'};border:none;border-radius:6px;padding:5px 14px;cursor:${_clubPlayerTournPage === 1 ? 'default' : 'pointer'};font-size:13px;font-weight:600">הקודם</button>
      <span style="font-size:13px;color:#718096">עמוד ${_clubPlayerTournPage} מתוך ${totalPages}</span>
      <button onclick="setClubPlayerTournPage(${_clubPlayerTournPage + 1})" ${_clubPlayerTournPage === totalPages ? 'disabled' : ''}
        style="background:${_clubPlayerTournPage === totalPages ? '#f7fafc' : '#553c9a'};color:${_clubPlayerTournPage === totalPages ? '#cbd5e0' : 'white'};border:none;border-radius:6px;padding:5px 14px;cursor:${_clubPlayerTournPage === totalPages ? 'default' : 'pointer'};font-size:13px;font-weight:600">הבא</button>
    </div>` : '';

  return `
    <div style="background:white;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden">
      <div style="padding:12px 16px;font-size:14px;font-weight:700;color:#2d3748;border-bottom:1px solid #e2e8f0">תוצאות טורנירים — שנתיים אחרונות (${sorted.length})</div>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f7fafc">
            <th style="padding:8px 12px;text-align:right;font-size:11px;font-weight:700;color:#a0aec0">תאריך</th>
            <th style="padding:8px 12px;text-align:right;font-size:11px;font-weight:700;color:#a0aec0">טורניר</th>
            <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:700;color:#a0aec0">משחקים</th>
            <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:700;color:#a0aec0">נ/ת/ה</th>
            <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:700;color:#a0aec0">שינוי</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${pagerHtml}
    </div>`;
}
