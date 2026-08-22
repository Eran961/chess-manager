// ===== PLAYER PROFILE FUNCTIONS =====

let _profileState = { groupIdx: 0, subGroupIdx: 0, playerIdx: 0 };
let _profileVersion = 0; // incremented on every profile open to cancel stale async

function openPlayerProfile(groupIdx, subGroupIdx, playerIdx) {
  _profileState = { groupIdx, subGroupIdx, playerIdx };
  _profileVersion++;
  const g = groups[groupIdx];
  const sg = g.subGroups[subGroupIdx];
  const p = sg.players[playerIdx];
  const { first, last } = splitName(p.name);
  document.getElementById('profileTitle').textContent = `${last} ${first}`;
  document.getElementById('profileSubtitle').textContent =
    sg.time ? `${g.name} · ${sg.time}` : g.name;
  const editBtnGrp = document.getElementById('btnProfileEdit');
  editBtnGrp.style.display = '';
  editBtnGrp.onclick = enableProfileEdit; // restore group edit function
  document.getElementById('playerProfileModal').dataset.isTeam = 'false';
  // Restore group attendance title
  const modal = document.getElementById('playerProfileModal');
  const attHeader = modal?.querySelector('.profile-section:last-of-type .profile-section-header span');
  if (attHeader) attHeader.textContent = 'נוכחות בחוג';
  resetProfileFooter();
  renderProfileDetails();
  document.getElementById('profileAttendance').innerHTML =
    '<div style="color:#718096;font-size:13px">טוען...</div>';
  document.getElementById('playerProfileModal').classList.add('open');
  loadProfileAttendance();
}

function closeProfileModal(e) {
  if (e && e.target !== document.getElementById('playerProfileModal')) return;
  document.getElementById('playerProfileModal').classList.remove('open');
}

function renderProfileDetails() {
  const { groupIdx, subGroupIdx, playerIdx } = _profileState;
  const p = groups[groupIdx].subGroups[subGroupIdx].players[playerIdx];
  const { first, last } = splitName(p.name);
  const age = calcAge(p.birthYear);
  document.getElementById('profileDetails').innerHTML = `
    <div class="profile-detail-row">
      <span class="profile-label">שם משפחה</span>
      <span class="profile-value">${last || '—'}</span>
    </div>
    <div class="profile-detail-row">
      <span class="profile-label">שם פרטי</span>
      <span class="profile-value">${first || '—'}</span>
    </div>
    <div class="profile-detail-row">
      <span class="profile-label">שנת לידה</span>
      <span class="profile-value">${p.birthYear ? `${p.birthYear}${age ? ` (גיל ${age})` : ''}` : '—'}</span>
    </div>
    <div class="profile-detail-row">
      <span class="profile-label">מספר שחקן</span>
      <span class="profile-value">${p.fedId ? `<a href="https://www.chess.org.il/Players/Player.aspx?Id=${p.fedId}" target="_blank" style="color:#2b6cb0">${p.fedId}</a>` : '—'}</span>
    </div>
    <div class="profile-detail-row">
      <span class="profile-label">תשלום</span>
      <span class="profile-value">
        ${(s => `<span class="pay-badge pay-${s}">${{trial:'ניסיון',pending:'ממתין לתשלום',paid:'שילם ✓'}[s]}</span>`)(p.paymentStatus || 'trial')}
      </span>
    </div>
    ${p.parentPhone ? `<div class="profile-detail-row">
      <span class="profile-label">📞 הורה</span>
      <span class="profile-value" dir="ltr"><a href="tel:${p.parentPhone}" style="color:#2b6cb0;text-decoration:none">${p.parentPhone}</a></span>
    </div>` : ''}
    ${p.parentEmail ? `<div class="profile-detail-row">
      <span class="profile-label">✉ מייל</span>
      <span class="profile-value" dir="ltr"><a href="mailto:${p.parentEmail}" style="color:#2b6cb0;text-decoration:none;font-size:13px">${p.parentEmail}</a></span>
    </div>` : ''}`;
}

function enableProfileEdit() {
  const { groupIdx, subGroupIdx, playerIdx } = _profileState;
  const p = groups[groupIdx].subGroups[subGroupIdx].players[playerIdx];
  const { first, last } = splitName(p.name);
  const age = p.birthYear ? `גיל ${CURRENT_YEAR - p.birthYear}` : '';
  document.getElementById('btnProfileEdit').style.display = 'none';
  document.getElementById('profileDetails').innerHTML = `
    <div class="modal-field">
      <label>שם פרטי <span class="required">*</span></label>
      <input type="text" id="pe-first" value="${first}">
    </div>
    <div class="modal-field">
      <label>שם משפחה <span class="required">*</span></label>
      <input type="text" id="pe-last" value="${last}">
    </div>
    <div class="modal-field">
      <label>שנת לידה <span class="required">*</span></label>
      <input type="number" id="pe-year" value="${p.birthYear || ''}" min="1900" max="${CURRENT_YEAR - 2}"
        placeholder="לדוגמה: 2015" oninput="updatePeAge(this.value)">
      <div class="age-hint" id="pe-age">${age}</div>
    </div>
    <div class="modal-field">
      <label>מין <span class="required">*</span></label>
      <div class="pay-select">
        <button type="button" id="pe-gender-m" class="pay-btn${(p.gender||'')==='m'?' active-paid':''}" onclick="selectGender('m')">👦 זכר</button>
        <button type="button" id="pe-gender-f" class="pay-btn${(p.gender||'')==='f'?' active-pending':''}" onclick="selectGender('f')">👧 נקבה</button>
      </div>
      <input type="hidden" id="pe-gender" value="${p.gender || ''}">
    </div>
    <div class="modal-field">
      <label>📞 טלפון הורה <span class="required">*</span></label>
      <input type="tel" id="pe-phone" value="${p.parentPhone || ''}" placeholder="05X-XXXXXXX" dir="ltr">
    </div>
    <div class="modal-field">
      <label>✉ מייל הורה <span class="required">*</span></label>
      <input type="email" id="pe-email" value="${p.parentEmail || ''}" placeholder="example@mail.com" dir="ltr">
    </div>
    <div class="modal-field" style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0">
      <label>מספר שחקן</label>
      <input type="number" id="pe-fed" value="${p.fedId || ''}" placeholder="לא חובה">
    </div>
    <div class="modal-field">
      <label>סטטוס תשלום</label>
      <div class="pay-select">
        <button type="button" class="pay-btn${(p.paymentStatus||'trial')==='trial'?' active-trial':''}" onclick="selectPayStatus(this,'trial')">ניסיון</button>
        <button type="button" class="pay-btn${p.paymentStatus==='pending'?' active-pending':''}" onclick="selectPayStatus(this,'pending')">ממתין לתשלום</button>
        <button type="button" class="pay-btn${p.paymentStatus==='paid'?' active-paid':''}" onclick="selectPayStatus(this,'paid')">שילם ✓</button>
      </div>
      <input type="hidden" id="pe-pay" value="${p.paymentStatus || 'trial'}">
    </div>
    <div class="modal-actions" style="padding:0;margin-top:4px">
      <button class="btn-form-cancel" onclick="cancelProfileEdit()">ביטול</button>
      <button class="btn-form-submit" onclick="savePlayerProfile()">💾 שמור</button>
    </div>
    <div style="margin-top:16px;padding-top:14px;border-top:1px solid #e2e8f0">
      <label style="font-size:12px;color:#718096;font-weight:600;display:block;margin-bottom:6px">↔ העבר לחוג אחר</label>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <select id="pe-transfer-target" class="modal-input" style="flex:1;min-width:180px">
          <option value="">— בחר חוג יעד —</option>
          ${groups.flatMap((tg, tgi) =>
            tg.subGroups.map((sg, sgi) => {
              const isCurrent = tgi === groupIdx && sgi === subGroupIdx;
              if (isCurrent) return '';
              const label = tg.subGroups.length > 1 ? `${tg.name} · ${sg.time||sgi+1}` : tg.name;
              return `<option value="${tgi}|${sgi}">${label}</option>`;
            })
          ).join('')}
        </select>
        <button onclick="transferPlayer()" style="background:#744210;color:white;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap">↔ העבר</button>
      </div>
    </div>`;
  document.getElementById('pe-last').focus();
}

function selectGender(g) {
  document.getElementById('pe-gender-m').className = 'pay-btn' + (g==='m'?' active-paid':'');
  document.getElementById('pe-gender-f').className = 'pay-btn' + (g==='f'?' active-pending':'');
  document.getElementById('pe-gender').value = g;
}

function selectModalGender(g) {
  document.getElementById('mf-gender-m').className = 'pay-btn' + (g==='m'?' active-paid':'');
  document.getElementById('mf-gender-f').className = 'pay-btn' + (g==='f'?' active-pending':'');
  document.getElementById('mf-gender').value = g;
  document.getElementById('mf-gender-select')?.classList.remove('input-error');
}
window.selectModalGender = selectModalGender;

function selectPayStatus(btn, status) {
  btn.closest('.pay-select').querySelectorAll('.pay-btn').forEach(b => { b.className = 'pay-btn'; });
  btn.className = `pay-btn active-${status}`;
  document.getElementById('pe-pay').value = status;
}

function selectLevel(btn, level) {
  btn.closest('.pay-select').querySelectorAll('.pay-btn').forEach(b => { b.className = 'pay-btn'; });
  const classMap = { beginner: 'active-trial', intermediate: 'active-pending', advanced: 'active-paid' };
  btn.className = `pay-btn ${classMap[level]}`;
  document.getElementById('pe-level').value = level;
}
window.selectLevel = selectLevel;

function updatePeAge(val) {
  const year = parseInt(val);
  const el = document.getElementById('pe-age');
  if (el) el.textContent = (year >= 1900 && year <= CURRENT_YEAR) ? `גיל ${CURRENT_YEAR - year}` : '';
}

function cancelProfileEdit() {
  document.getElementById('btnProfileEdit').style.display = '';
  renderProfileDetails();
}

async function savePlayerProfile() {
  const lastEl  = document.getElementById('pe-last');
  const firstEl = document.getElementById('pe-first');
  const yearEl  = document.getElementById('pe-year');
  const fedEl   = document.getElementById('pe-fed');

  [lastEl, firstEl].forEach(el => el.classList.remove('input-error'));
  const lastName  = lastEl.value.trim();
  const firstName = firstEl.value.trim();
  const yearVal   = yearEl.value.trim();
  const fedVal    = fedEl.value.trim();

  let valid = true;
  if (!lastName)  { lastEl.classList.add('input-error');  lastEl.focus();  valid = false; }
  if (!firstName) { firstEl.classList.add('input-error'); if (valid) firstEl.focus(); valid = false; }
  if (!valid) return;

  const birthYear = yearVal ? parseInt(yearVal) : null;
  const fedId     = fedVal  ? parseInt(fedVal) || null : null;
  const payEl     = document.getElementById('pe-pay');
  const paymentStatus = payEl ? payEl.value : 'trial';
  const parentPhone = (document.getElementById('pe-phone')?.value || '').trim() || null;
  const parentEmail = (document.getElementById('pe-email')?.value || '').trim() || null;

  const { groupIdx, subGroupIdx, playerIdx } = _profileState;
  const g = groups[groupIdx];
  const player = g.subGroups[subGroupIdx].players[playerIdx];

  const genderVal = document.getElementById('pe-gender')?.value || null;
  player.name          = `${firstName} ${lastName}`;
  player.birthYear     = birthYear;
  player.fedId         = fedId;
  player.paymentStatus = paymentStatus;
  player.parentPhone   = parentPhone;
  player.parentEmail   = parentEmail;
  player.gender        = genderVal || null;

  if (db) {
    await Promise.all([
      db.ref(`player_overrides/${g.id}/${subGroupIdx}/${playerIdx}`)
        .set({ firstName, lastName, birthYear: birthYear || null, fedId: fedId || null }),
      db.ref(`payment/${g.id}/${subGroupIdx}/${playerIdx}`).set(paymentStatus),
      db.ref(`player_contacts/${g.id}/${subGroupIdx}/${playerIdx}`)
        .set({ parentPhone: parentPhone || null, parentEmail: parentEmail || null }),
    ]);
    logAudit('update_player', g.id, g.name, `עודכן: ${lastName} ${firstName}`);
  }

  document.getElementById('panel-' + g.id).innerHTML = renderGroup(g, groupIdx);
  document.getElementById('btnProfileEdit').style.display = '';
  document.getElementById('profileTitle').textContent = `${lastName} ${firstName}`;
  renderProfileDetails();
}

async function transferPlayer() {
  const val = document.getElementById('pe-transfer-target')?.value;
  if (!val) { showToast('בחר חוג יעד', 'error'); return; }
  const [tgi, sgi] = val.split('|').map(Number);
  const { groupIdx, subGroupIdx, playerIdx } = _profileState;
  const srcG  = groups[groupIdx];
  const dstG  = groups[tgi];
  const player = srcG.subGroups[subGroupIdx]?.players[playerIdx];
  if (!player) return;
  const { first, last } = splitName(player.name);
  if (!confirm(`להעביר את ${first} ${last} מ"${srcG.name}" ל"${dstG.name}"?`)) return;

  // Build the player object to add to destination
  const newPlayer = {
    firstName: first, lastName: last,
    birthYear: player.birthYear || null,
    fedId: player.fedId || null,
    joinDate: new Date().toISOString().split('T')[0],
    ...(player.rating   != null && { rating: player.rating }),
    ...(player.cardExpiry     && { cardExpiry: player.cardExpiry }),
  };

  try {
    // 1. Hide in source group
    player.hidden = true;
    // 2. Add to destination group
    const addedPlayer = {
      name: `${first} ${last}`, birthYear: player.birthYear || null,
      fedId: player.fedId || null, joinDate: newPlayer.joinDate, added: true,
      paymentStatus: player.paymentStatus || 'trial',
      gender: player.gender || null, rating: player.rating || null,
      cardExpiry: player.cardExpiry || null,
    };
    dstG.subGroups[sgi].players.push(addedPlayer);

    if (db) {
      await Promise.all([
        db.ref(`hidden_players/${srcG.id}/${subGroupIdx}/${playerIdx}`).set(true),
        db.ref(`extra_players/${dstG.id}/${sgi}`).push(newPlayer),
        db.ref(`history/${srcG.id}/${subGroupIdx}`).push({
          type: 'left', playerName: `${last} ${first}`, timestamp: Date.now(),
          playerIdx, subGroupIdx, note: `הועבר ל"${dstG.name}"`
        }),
        db.ref(`history/${dstG.id}/${sgi}`).push({
          type: 'joined', playerName: `${last} ${first}`, timestamp: Date.now(),
          note: `הועבר מ"${srcG.name}"`
        }),
      ]);
    }

    // Refresh both panels
    const srcPanel = document.getElementById('panel-' + srcG.id);
    if (srcPanel) srcPanel.innerHTML = renderGroup(srcG, groupIdx);
    const dstPanel = document.getElementById('panel-' + dstG.id);
    if (dstPanel) dstPanel.innerHTML = renderGroup(dstG, tgi);

    logAudit('transfer_player', srcG.id, srcG.name, `${last} ${first} → ${dstG.name}`);
    document.getElementById('playerProfileModal').classList.remove('open');
    showToast(`${first} ${last} הועבר/ה ל"${dstG.name}" ✅`);
  } catch(e) {
    player.hidden = false;
    dstG.subGroups[sgi].players.pop();
    showToast('שגיאה בהעברה: ' + e.message, 'error');
  }
}
window.transferPlayer = transferPlayer;

async function loadProfileAttendance() {
  const div = document.getElementById('profileAttendance');
  if (!div || !db) { if (div) div.innerHTML = ''; return; }
  const myVersion = _profileVersion; // snapshot — if it changes we're stale

  const { groupIdx, subGroupIdx, playerIdx } = _profileState;
  const g = groups[groupIdx];
  try {
    const snap = await db.ref(`attendance/${g.id}/${subGroupIdx}`).get();
    const allAtt   = snap.val() || {};
    const allDates = Object.keys(allAtt).sort();
    const total    = allDates.length;

    if (_profileVersion !== myVersion) return; // stale — a newer profile was opened
    if (total === 0) {
      div.innerHTML = '<div style="color:#718096;font-size:13px">אין נתוני נוכחות עדיין.</div>';
      return;
    }

    const presentCount = allDates.filter(d => allAtt[d]?.[playerIdx]).length;
    const pct   = Math.round((presentCount / total) * 100);
    const color = pct >= 80 ? '#276749' : pct >= 60 ? '#d69e2e' : '#e53e3e';

    const recentDots = allDates.slice(-10).reverse().map(d => {
      const was = allAtt[d]?.[playerIdx];
      return `<span class="att-dot ${was ? 'present' : 'absent'}" title="${formatDate(d)}">${was ? '✓' : '✗'}</span>`;
    }).join('');

    if (_profileVersion !== myVersion) return; // stale check before writing
    div.innerHTML = `
      <div class="profile-att-numbers">
        <span class="profile-att-big" style="color:${color}">${presentCount}</span>
        <span class="profile-att-small">מתוך ${total} מפגשים</span>
        <span class="profile-att-pct" style="color:${color}">${pct}%</span>
      </div>
      <div class="progress-bar-wrap" style="margin:8px 0 10px">
        <div class="progress-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <div class="att-dots-row">${recentDots}</div>
      <div style="font-size:11px;color:#a0aec0;margin-top:6px">10 מפגשים אחרונים (ישן → חדש מימין לשמאל)</div>`;
  } catch(e) {
    div.innerHTML = '';
    console.error('Profile attendance error:', e);
  }
}

async function loadTeamProfileAttendance() {
  const div = document.getElementById('profileAttendance');
  if (!div || !db) { if (div) div.innerHTML = ''; return; }
  const myVersion = _profileVersion;
  const { teamIdx, subTeamIdx, playerIdx } = _teamProfileState;
  const t = teams[teamIdx];
  const p = t?.subGroups[subTeamIdx]?.players[playerIdx];
  if (!t || !p) { div.innerHTML = ''; return; }
  try {
    const snap = await db.ref(`team_attendance/${t.id}/${subTeamIdx}`).get();
    if (_profileVersion !== myVersion) return;
    const allAtt   = snap.val() || {};
    const allDates = Object.keys(allAtt).sort();
    const total    = allDates.length;
    if (total === 0) {
      div.innerHTML = '<div style="color:#718096;font-size:13px">אין נתוני נוכחות עדיין לנבחרת.</div>';
      return;
    }
    // Match by player key or by index
    const pKey = p._key;
    const presentCount = allDates.filter(d => pKey ? allAtt[d]?.[pKey] : allAtt[d]?.[playerIdx]).length;
    const pct   = Math.round((presentCount / total) * 100);
    const color = pct >= 80 ? '#276749' : pct >= 60 ? '#d69e2e' : '#e53e3e';
    const recentDots = allDates.slice(-10).reverse().map(d => {
      const was = pKey ? allAtt[d]?.[pKey] : allAtt[d]?.[playerIdx];
      return `<span class="att-dot ${was ? 'present' : 'absent'}" title="${formatDate(d)}">${was ? '✓' : '✗'}</span>`;
    }).join('');
    if (_profileVersion !== myVersion) return;
    div.innerHTML = `
      <div class="profile-att-numbers">
        <span class="profile-att-big" style="color:${color}">${presentCount}</span>
        <span class="profile-att-small">מתוך ${total} אימונים</span>
        <span class="profile-att-pct" style="color:${color}">${pct}%</span>
      </div>
      <div class="progress-bar-wrap" style="margin:8px 0 10px">
        <div class="progress-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <div class="att-dots-row">${recentDots}</div>
      <div style="font-size:11px;color:#a0aec0;margin-top:6px">10 אימונים אחרונים</div>`;
  } catch(e) {
    div.innerHTML = '';
    console.error('Team profile attendance error:', e);
  }
}

// ===== REPORTS FUNCTIONS =====

const reportsState = {
  groupIdx: 0,
  subGroupIdx: 0,
  mode: 'summary',
  date: defaultDateForGroup(ALL_GROUPS[0].dayOfWeek),
  month: new Date().toISOString().slice(0,7),
};
let _reportsCache = { attendance: {}, notes: {} };

function _repKindsAvailable() {
  const kinds = [];
  if (groups.length > 0) kinds.push({ key: 'groups', icon: '🗓', label: 'חוגים',  color: '#2b6cb0', render: renderGroupReportsContent });
  if (teams.length  > 0) kinds.push({ key: 'teams',  icon: '🏅', label: 'נבחרות', color: '#553c9a', render: renderTeamReportsContent, onOpen: loadTeamReportsData });
  if (camps.length  > 0) kinds.push({ key: 'camps',  icon: '🏕️', label: 'מחנות',  color: '#c05621', render: renderCampReportsContent, onOpen: loadCampReportsData });
  return kinds;
}

function renderReportsPanel() {
  if (!_useDbGroups && (!groups || groups.length === 0) && currentUser?.role === 'admin') groups = ALL_GROUPS.filter(g => !_deletedGroupIds.has(g.id));
  const kinds = _repKindsAvailable();
  if (kinds.length === 0) return `
    <div class="att-card" style="text-align:center;padding:40px;color:#a0aec0">
      <div style="font-size:32px;margin-bottom:8px">📊</div>
      <div>אין חוגים, נבחרות או מחנות מוקצים</div>
    </div>`;
  if (kinds.length === 1) return kinds[0].render();

  window._repKinds = kinds;
  const tabsHtml = kinds.map((k, i) => `
    <button id="rep-tab-btn-${k.key}" onclick="switchRepTab('${k.key}')"
      style="padding:10px 20px;border:none;background:none;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;border-bottom:3px solid ${i===0?k.color:'transparent'};color:${i===0?k.color:'#718096'};margin-bottom:-2px">
      ${k.icon} ${k.label}
    </button>`).join('');
  const contentHtml = kinds.map((k, i) => `<div id="rep-content-${k.key}"${i===0?'':' style="display:none"'}>${k.render()}</div>`).join('');
  return `<div style="display:flex;gap:0;border-bottom:2px solid #e2e8f0;margin-bottom:16px">${tabsHtml}</div>${contentHtml}`;
}
window.switchRepTab = function(tab) {
  const kinds = window._repKinds || _repKindsAvailable();
  kinds.forEach(k => {
    const isActive = k.key === tab;
    const content = document.getElementById('rep-content-' + k.key);
    if (content) content.style.display = isActive ? '' : 'none';
    const btn = document.getElementById('rep-tab-btn-' + k.key);
    if (btn) { btn.style.borderBottom = isActive ? '3px solid ' + k.color : '3px solid transparent'; btn.style.color = isActive ? k.color : '#718096'; }
  });
  const activeKind = kinds.find(k => k.key === tab);
  if (activeKind?.onOpen) activeKind.onOpen();
};

function renderGroupReportsContent() {
  if (!groups || groups.length === 0) return '';
  const g = groups[reportsState.groupIdx] || groups[0];
  reportsState.groupIdx = groups.indexOf(g);
  const groupOptions = groups.map((g, i) =>
    `<option value="${i}"${i === reportsState.groupIdx ? ' selected' : ''}>${g.name}</option>`
  ).join('');
  const subGroupOptions = g.subGroups.map((sg, i) =>
    `<option value="${i}"${i === reportsState.subGroupIdx ? ' selected' : ''}>${sg.time || 'קבוצה'}</option>`
  ).join('');
  const subGroupDisabled = g.subGroups.length === 1 ? 'disabled' : '';
  const dateOptions = getGroupDates(g.dayOfWeek).map(d =>
    `<option value="${d}"${d === reportsState.date ? ' selected' : ''}>${formatDate(d)}</option>`
  ).join('');

  return `
    <div class="att-card">
      <div class="att-card-header" style="display:flex;justify-content:space-between;align-items:center">
        <span>📊 דוחות נוכחות</span>
        <button class="btn-print-report" onclick="printReport()" style="background:white;color:#2b6cb0;border:1px solid #bee3f8;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">🖨️ הדפס / PDF</button>
      </div>
      <div class="att-controls">
        <div class="att-control-row">
          <label>חוג</label>
          <select onchange="onReportsGroupChange(this.value)">${groupOptions}</select>
        </div>
        <div class="att-control-row">
          <label>קבוצה</label>
          <select id="repSubGroupSel" onchange="onReportsSubGroupChange(this.value)" ${subGroupDisabled}>${subGroupOptions}</select>
        </div>
      </div>
      <div class="reports-mode-bar">
        <button class="mode-btn${reportsState.mode === 'summary' ? ' active' : ''}" onclick="onReportsModeChange('summary',this)">👥 שנתי</button>
        <button class="mode-btn${reportsState.mode === 'monthly' ? ' active' : ''}" onclick="onReportsModeChange('monthly',this)">📆 חודשי</button>
        <button class="mode-btn${reportsState.mode === 'bydate' ? ' active' : ''}" onclick="onReportsModeChange('bydate',this)">📅 לפי תאריך</button>
      </div>
      <div class="att-controls" id="repMonthRow" style="${reportsState.mode === 'monthly' ? '' : 'display:none'}">
        <div class="att-control-row">
          <label>חודש</label>
          <select id="repMonthSel" onchange="onReportsMonthChange(this.value)">${getSchoolMonths().map(m => `<option value="${m.value}"${m.value === reportsState.month ? ' selected' : ''}>${m.label}</option>`).join('')}</select>
        </div>
      </div>
      <div class="att-controls" id="repDateRow" style="${reportsState.mode === 'bydate' ? '' : 'display:none'}">
        <div class="att-control-row">
          <label>תאריך</label>
          <select id="repDateSel" onchange="onReportsDateChange(this.value)">${dateOptions}</select>
        </div>
      </div>
      <div id="reportsContent">
        <div style="padding:24px;text-align:center;color:#718096">בחר חוג ולחץ על הטאב כדי לטעון נתונים</div>
      </div>
    </div>`;
}

let _teamRepState = { teamIdx: 0, subTeamIdx: 0 };

function renderTeamReportsContent() {
  if (!teams || teams.length === 0) return '<div style="padding:24px;text-align:center;color:#a0aec0">אין נבחרות מוקצות</div>';
  const t = teams[_teamRepState.teamIdx] || teams[0];
  _teamRepState.teamIdx = teams.indexOf(t);
  const teamOptions = teams.map((tm, i) => `<option value="${i}" ${i===_teamRepState.teamIdx?'selected':''}>${tm.name}</option>`).join('');
  const subOptions  = t.subGroups.map((sg, i) => `<option value="${i}" ${i===_teamRepState.subTeamIdx?'selected':''}>${sg.time||'שחקנים'}</option>`).join('');
  return `
    <div class="att-card">
      <div class="att-card-header">📊 דוחות נוכחות — נבחרות</div>
      <div class="att-controls">
        <div class="att-control-row"><label>נבחרת</label>
          <select onchange="onTeamRepChange(this.value)">${teamOptions}</select></div>
        <div class="att-control-row"><label>קטגוריה</label>
          <select onchange="onTeamRepSubChange(this.value)" ${t.subGroups.length===1?'disabled':''}>${subOptions}</select></div>
      </div>
      <div id="teamReportsContent">
        <div style="padding:24px;text-align:center;color:#718096">⏳ טוען נתונים...</div>
      </div>
    </div>`;
}

function onTeamRepChange(val) {
  _teamRepState.teamIdx = parseInt(val);
  _teamRepState.subTeamIdx = 0;
  const panel = document.getElementById('panel-reports');
  if (panel) { panel.innerHTML = renderReportsPanel(); window.switchRepTab('teams'); }
  loadTeamReportsData();
}
window.onTeamRepChange = onTeamRepChange;

function onTeamRepSubChange(val) {
  _teamRepState.subTeamIdx = parseInt(val);
  loadTeamReportsData();
}
window.onTeamRepSubChange = onTeamRepSubChange;

async function loadTeamReportsData() {
  const content = document.getElementById('teamReportsContent');
  if (!content || !db) return;
  content.innerHTML = '<div style="padding:24px;text-align:center;color:#718096">⏳ טוען נתונים...</div>';
  const t  = teams[_teamRepState.teamIdx];
  const sg = t?.subGroups[_teamRepState.subTeamIdx];
  if (!t || !sg) return;
  try {
    const snap = await db.ref(`team_attendance/${t.id}/${_teamRepState.subTeamIdx}`).get();
    const attData = snap.val() || {};
    const dates = Object.keys(attData).sort();
    const players = sg.players.filter(p => !p.hidden);
    if (!dates.length) { content.innerHTML = '<div style="padding:24px;text-align:center;color:#a0aec0">אין נתוני נוכחות עדיין</div>'; return; }
    const rows = players.map(p => {
      const key = p._key;
      const presentCount = dates.filter(d => key ? attData[d]?.[key] : false).length;
      const pct = Math.round(presentCount / dates.length * 100);
      const color = pct >= 80 ? '#276749' : pct >= 60 ? '#d69e2e' : '#c53030';
      const { first, last } = splitName(p.name);
      return `<tr>
        <td style="padding:8px 12px;font-weight:600">${last} ${first}</td>
        <td style="text-align:center;padding:8px">${presentCount}/${dates.length}</td>
        <td style="text-align:center;padding:8px;font-weight:700;color:${color}">${pct}%</td>
        <td style="padding:8px">${dates.slice(-5).map(d => `<span class="att-dot ${attData[d]?.[key] ? 'present' : 'absent'}" title="${formatDate(d)}">${attData[d]?.[key] ? '✓' : '✗'}</span>`).join('')}</td>
      </tr>`;
    }).join('');
    content.innerHTML = `
      <div style="font-size:12px;color:#718096;padding:8px 12px">${dates.length} אימונים מתועדים</div>
      <div class="table-scroll"><table>
        <thead><tr>
          <th>שחקן</th><th style="text-align:center">נוכחות</th>
          <th style="text-align:center">אחוז</th><th>5 אחרונים</th>
        </tr></thead>
        <tbody>${rows || '<tr><td colspan="4" style="text-align:center;padding:20px;color:#a0aec0">אין שחקנים</td></tr>'}</tbody>
      </table></div>`;
  } catch(e) { content.innerHTML = `<div style="padding:24px;color:#c53030">שגיאה: ${e.message}</div>`; }
}
window.loadTeamReportsData = loadTeamReportsData;

let _campRepState = { campId: null, levelIdx: 0 };

function renderCampReportsContent() {
  if (!camps || camps.length === 0) return '<div style="padding:24px;text-align:center;color:#a0aec0">אין מחנות מוקצים</div>';
  if (!_campRepState.campId || !camps.find(c => c.id === _campRepState.campId)) _campRepState.campId = camps[0].id;
  const c = camps.find(cc => cc.id === _campRepState.campId);
  const campOptions = camps.map(cc => `<option value="${cc.id}" ${cc.id===_campRepState.campId?'selected':''}>${cc.name}</option>`).join('');
  const levelOptions = c.levels.map((lv, i) => `<option value="${i}" ${i===_campRepState.levelIdx?'selected':''}>${lv.name||'רמה'}</option>`).join('');
  return `
    <div class="att-card">
      <div class="att-card-header">📊 דוחות נוכחות — מחנות</div>
      <div class="att-controls">
        <div class="att-control-row"><label>מחנה</label>
          <select onchange="onCampRepChange(this.value)">${campOptions}</select></div>
        <div class="att-control-row"><label>רמה</label>
          <select onchange="onCampRepLevelChange(this.value)" ${c.levels.length===1?'disabled':''}>${levelOptions}</select></div>
      </div>
      <div id="campReportsContent">
        <div style="padding:24px;text-align:center;color:#718096">⏳ טוען נתונים...</div>
      </div>
    </div>`;
}

function onCampRepChange(val) {
  _campRepState.campId = val;
  _campRepState.levelIdx = 0;
  const panel = document.getElementById('panel-reports');
  if (panel) { panel.innerHTML = renderReportsPanel(); window.switchRepTab('camps'); }
  loadCampReportsData();
}
window.onCampRepChange = onCampRepChange;

function onCampRepLevelChange(val) {
  _campRepState.levelIdx = parseInt(val);
  loadCampReportsData();
}
window.onCampRepLevelChange = onCampRepLevelChange;

async function loadCampReportsData() {
  const content = document.getElementById('campReportsContent');
  if (!content || !db) return;
  content.innerHTML = '<div style="padding:24px;text-align:center;color:#718096">⏳ טוען נתונים...</div>';
  const c  = camps.find(cc => cc.id === _campRepState.campId);
  const lv = c?.levels[_campRepState.levelIdx];
  if (!c || !lv) return;
  try {
    const snap = await db.ref(`camp_attendance/${c.id}/${_campRepState.levelIdx}`).get();
    const attData = snap.val() || {};
    const dates = Object.keys(attData).sort();
    const players = lv.players.filter(p => !p.hidden);
    if (!dates.length) { content.innerHTML = '<div style="padding:24px;text-align:center;color:#a0aec0">אין נתוני נוכחות עדיין</div>'; return; }
    const rows = players.map(p => {
      const key = p._key;
      const presentCount = dates.filter(d => key ? attData[d]?.[key] : false).length;
      const pct = Math.round(presentCount / dates.length * 100);
      const color = pct >= 80 ? '#276749' : pct >= 60 ? '#d69e2e' : '#c53030';
      const { first, last } = splitName(p.name);
      return `<tr>
        <td style="padding:8px 12px;font-weight:600">${last} ${first}</td>
        <td style="text-align:center;padding:8px">${presentCount}/${dates.length}</td>
        <td style="text-align:center;padding:8px;font-weight:700;color:${color}">${pct}%</td>
        <td style="padding:8px">${dates.slice(-5).map(d => `<span class="att-dot ${attData[d]?.[key] ? 'present' : 'absent'}" title="${formatDate(d)}">${attData[d]?.[key] ? '✓' : '✗'}</span>`).join('')}</td>
      </tr>`;
    }).join('');
    content.innerHTML = `
      <div style="font-size:12px;color:#718096;padding:8px 12px">${dates.length} ימי מחנה מתועדים</div>
      <div class="table-scroll"><table>
        <thead><tr>
          <th>שחקן</th><th style="text-align:center">נוכחות</th>
          <th style="text-align:center">אחוז</th><th>5 אחרונים</th>
        </tr></thead>
        <tbody>${rows || '<tr><td colspan="4" style="text-align:center;padding:20px;color:#a0aec0">אין שחקנים</td></tr>'}</tbody>
      </table></div>`;
  } catch(e) { content.innerHTML = `<div style="padding:24px;color:#c53030">שגיאה: ${e.message}</div>`; }
}
window.loadCampReportsData = loadCampReportsData;

async function loadReportsData() {
  const content = document.getElementById('reportsContent');
  if (!content) return;
  content.innerHTML = '<div style="padding:24px;text-align:center;color:#718096">⏳ טוען נתונים...</div>';

  if (!db) {
    content.innerHTML = '<div style="padding:24px;text-align:center;color:#e53e3e">Firebase לא מחובר</div>';
    return;
  }

  const g = groups[reportsState.groupIdx];
  try {
    const [attSnap, notesSnap] = await Promise.all([
      db.ref(`attendance/${g.id}/${reportsState.subGroupIdx}`).get(),
      db.ref(`notes/${g.id}/${reportsState.subGroupIdx}`).get(),
    ]);
    _reportsCache.attendance = attSnap.val() || {};
    _reportsCache.notes = notesSnap.val() || {};
    updateReportsDateDropdown();
    displayReports();
  } catch(e) {
    content.innerHTML = '<div style="padding:24px;text-align:center;color:#e53e3e">שגיאה בטעינת הנתונים</div>';
    console.error('Reports load error:', e);
  }
}

function updateReportsDateDropdown() {
  const sel = document.getElementById('repDateSel');
  if (!sel) return;
  const att = _reportsCache.attendance;
  Array.from(sel.options).forEach(opt => {
    const dateData = att[opt.value];
    const count = dateData ? Object.keys(dateData).length : 0;
    opt.text = count > 0
      ? `✓ ${formatDate(opt.value)} — ${count} משתתפים`
      : formatDate(opt.value);
  });
}

function getSchoolMonths() {
  const months = [
    { value: '2025-09', label: 'ספטמבר 2025' }, { value: '2025-10', label: 'אוקטובר 2025' },
    { value: '2025-11', label: 'נובמבר 2025' },  { value: '2025-12', label: 'דצמבר 2025' },
    { value: '2026-01', label: 'ינואר 2026' },   { value: '2026-02', label: 'פברואר 2026' },
    { value: '2026-03', label: 'מרץ 2026' },     { value: '2026-04', label: 'אפריל 2026' },
    { value: '2026-05', label: 'מאי 2026' },     { value: '2026-06', label: 'יוני 2026' },
  ];
  return months;
}

function displayReports() {
  const content = document.getElementById('reportsContent');
  if (!content) return;
  if (reportsState.mode === 'summary') content.innerHTML = renderSummaryTable();
  else if (reportsState.mode === 'monthly') content.innerHTML = renderMonthlyTable();
  else content.innerHTML = renderByDateTable();
}

function renderSummaryTable() {
  const sg = groups[reportsState.groupIdx].subGroups[reportsState.subGroupIdx];
  const att = _reportsCache.attendance;
  const notes = _reportsCache.notes;
  const allDates = Object.keys(att).sort();
  const total = allDates.length;

  if (total === 0) {
    return '<div style="padding:24px;text-align:center;color:#718096">אין נתוני נוכחות עדיין לקבוצה זו.</div>';
  }

  const g = groups[reportsState.groupIdx];
  const nonVacDates = allDates.filter(d => !_vacations[g.id]?.has(d));
  const rows = sortedPlayers(sg.players).map(({ p, i: idx }, displayNum) => {
    const { first, last } = splitName(p.name);
    const presentCount = nonVacDates.filter(d => att[d]?.[idx]).length;
    const excusedCount = nonVacDates.filter(d => !att[d]?.[idx] && notes[d]?.[idx]).length;
    const effectiveTotal = nonVacDates.length;
    const pct = effectiveTotal > 0 ? Math.round((presentCount / effectiveTotal) * 100) : 0;
    const color = pct >= 80 ? '#276749' : pct >= 60 ? '#d69e2e' : '#e53e3e';
    return `
      <tr>
        <td class="idx">${displayNum + 1}</td>
        <td style="font-weight:600">${last} ${first}</td>
        <td style="text-align:center;font-weight:700;color:#2b6cb0">${presentCount}</td>
        <td style="text-align:center;color:#718096">${effectiveTotal}</td>
        <td style="text-align:center;font-weight:700;color:${color}">${pct}%</td>
        <td style="padding-left:12px">
          <div class="progress-bar-wrap">
            <div class="progress-fill" style="width:${pct}%;background:${color}"></div>
          </div>
        </td>
        <td style="font-size:12px;color:#718096">${excusedCount > 0 ? `${excusedCount} בהצדקה` : ''}</td>
      </tr>`;
  }).join('');

  return `
    <div style="padding:10px 20px 4px;font-size:13px;color:#4a5568;font-weight:600">
      סה"כ ${nonVacDates.length} מפגשים עם נתונים${nonVacDates.length < allDates.length ? ` (${allDates.length - nonVacDates.length} חופשות לא נספרות)` : ''}
    </div>
    <table class="rep-table">
      <thead><tr>
        <th>#</th><th>שם</th><th>נוכח</th><th>מתוך</th><th>אחוז</th><th>גרף</th><th></th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderByDateTable() {
  const sg = groups[reportsState.groupIdx].subGroups[reportsState.subGroupIdx];
  const date = reportsState.date;
  const dateAtt = _reportsCache.attendance[date] || {};
  const dateNotes = _reportsCache.notes[date] || {};
  const presentCount = sg.players.filter((_, i) => dateAtt[i]).length;
  const hasData = Object.keys(dateAtt).length > 0;

  const rows = sortedPlayers(sg.players).map(({ p, i: idx }) => {
    const { first, last } = splitName(p.name);
    const isPresent = !!dateAtt[idx];
    if (isPresent) {
      return `
        <div class="bydate-row present">
          <span class="bydate-icon">✅</span>
          <span class="bydate-name">${last} ${first}</span>
        </div>`;
    }
    const note = dateNotes[idx] || '';
    return `
      <div class="bydate-row absent" id="bdrow-${idx}">
        <span class="bydate-icon">❌</span>
        <span class="bydate-name">${last} ${first}</span>
        <span class="note-area" id="noteArea-${idx}">
          ${note
            ? `<span class="note-text">${note}</span><button class="btn-edit-note" onclick="startEditNote(${idx})" title="ערוך הערה">✎</button>`
            : `<button class="btn-add-note" onclick="startEditNote(${idx})">+ הוסף הערה</button>`}
        </span>
      </div>`;
  }).join('');

  return `
    <div style="padding:10px 20px;font-size:13px;font-weight:600;color:#4a5568;border-bottom:1px solid #e2e8f0">
      נוכחו ${presentCount} מתוך ${sg.players.length} שחקנים
      ${!hasData ? ' &nbsp;·&nbsp; <span style="color:#e53e3e;font-weight:400">לא הוזנה נוכחות לתאריך זה</span>' : ''}
    </div>
    <div class="bydate-list">${rows}</div>`;
}

function renderMonthlyTable() {
  const g = groups[reportsState.groupIdx];
  const sg = g.subGroups[reportsState.subGroupIdx];
  const att = _reportsCache.attendance;
  const month = reportsState.month;
  const monthLabel = getSchoolMonths().find(m => m.value === month)?.label || month;

  // כל תאריכי הקבוצה בחודש זה (לפי יום בשבוע)
  const allGroupDates = getGroupDates(g.dayOfWeek).filter(d => d.startsWith(month));
  if (allGroupDates.length === 0) {
    return `<div style="padding:24px;text-align:center;color:#718096">אין מפגשים מתוכננים ל${monthLabel}.</div>`;
  }

  const dayNames = ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'];
  const dateHeaders = allGroupDates.map(d => {
    const dt = new Date(d);
    const hasData = !!att[d];
    const dd = String(dt.getDate()).padStart(2,'0');
    const mm = String(dt.getMonth()+1).padStart(2,'0');
    return `<th style="text-align:center;font-size:12px;min-width:48px${hasData ? '' : ';opacity:.5'}">${dd}.${mm}<br><span style="font-weight:400;opacity:.8">${dayNames[dt.getDay()]}</span></th>`;
  }).join('');

  const rows = sortedPlayers(sg.players).map(({ p, i: idx }, displayNum) => {
    const { first, last } = splitName(p.name);
    // סה"כ רק לפי תאריכים שהוזנה בהם נוכחות
    const enteredDates = allGroupDates.filter(d => !!att[d]);
    const presentCount = enteredDates.filter(d => att[d]?.[idx]).length;
    const total = enteredDates.length;
    const pct = total > 0 ? Math.round((presentCount / total) * 100) : null;
    const color = pct === null ? '#718096' : pct >= 80 ? '#276749' : pct >= 60 ? '#d69e2e' : '#e53e3e';

    const cells = allGroupDates.map(d => {
      if (!att[d]) return `<td style="text-align:center;color:#cbd5e0">—</td>`;
      const present = !!att[d][idx];
      return `<td style="text-align:center;font-size:15px">${present ? '✅' : '❌'}</td>`;
    }).join('');

    return `
      <tr>
        <td class="idx">${displayNum + 1}</td>
        <td style="font-weight:600;white-space:nowrap">${last} ${first}</td>
        ${cells}
        <td style="text-align:center;font-weight:700;color:${color};padding-right:8px;white-space:nowrap">
          ${pct !== null ? `${presentCount}/${total}` : '—'}
        </td>
      </tr>`;
  }).join('');

  return `
    <div style="padding:10px 20px 4px;font-size:13px;color:#4a5568;font-weight:600">
      ${monthLabel} — ${allGroupDates.length} מפגשים מתוכננים
    </div>
    <div style="overflow-x:auto">
    <table class="rep-table" style="min-width:max-content">
      <thead><tr>
        <th>#</th><th style="white-space:nowrap">שם</th>${dateHeaders}<th style="text-align:center">סה"כ</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    </div>`;
}

function startEditNote(playerIdx) {
  const noteArea = document.getElementById(`noteArea-${playerIdx}`);
  if (!noteArea) return;
  const existing = (_reportsCache.notes[reportsState.date] || {})[playerIdx] || '';
  noteArea.innerHTML = `
    <div class="note-input-wrap">
      <input type="text" id="noteInput-${playerIdx}" value="${existing.replace(/"/g,'&quot;')}"
        placeholder='סיבה: חולה, חו"ל, אירוע...'
        onkeydown="if(event.key==='Enter')saveNoteForPlayer(${playerIdx});if(event.key==='Escape')cancelNote(${playerIdx})">
      <button class="btn-note-save" onclick="saveNoteForPlayer(${playerIdx})">שמור</button>
      <button class="btn-note-cancel" onclick="cancelNote(${playerIdx})">✕</button>
    </div>`;
  document.getElementById(`noteInput-${playerIdx}`).focus();
}

async function saveNoteForPlayer(playerIdx) {
  const input = document.getElementById(`noteInput-${playerIdx}`);
  if (!input) return;
  const note = input.value.trim();
  const date = reportsState.date;
  const g = groups[reportsState.groupIdx];

  if (db) {
    await db.ref(`notes/${g.id}/${reportsState.subGroupIdx}/${date}/${playerIdx}`).set(note || null);
  }

  if (!_reportsCache.notes[date]) _reportsCache.notes[date] = {};
  if (note) _reportsCache.notes[date][playerIdx] = note;
  else delete _reportsCache.notes[date][playerIdx];

  const noteArea = document.getElementById(`noteArea-${playerIdx}`);
  if (noteArea) {
    noteArea.innerHTML = note
      ? `<span class="note-text">${note}</span><button class="btn-edit-note" onclick="startEditNote(${playerIdx})" title="ערוך הערה">✎</button>`
      : `<button class="btn-add-note" onclick="startEditNote(${playerIdx})">+ הוסף הערה</button>`;
  }
}

function cancelNote(playerIdx) {
  const note = (_reportsCache.notes[reportsState.date] || {})[playerIdx] || '';
  const noteArea = document.getElementById(`noteArea-${playerIdx}`);
  if (noteArea) {
    noteArea.innerHTML = note
      ? `<span class="note-text">${note}</span><button class="btn-edit-note" onclick="startEditNote(${playerIdx})" title="ערוך הערה">✎</button>`
      : `<button class="btn-add-note" onclick="startEditNote(${playerIdx})">+ הוסף הערה</button>`;
  }
}

function onReportsGroupChange(val) {
  reportsState.groupIdx = parseInt(val);
  reportsState.subGroupIdx = 0;
  const g = groups[reportsState.groupIdx];
  reportsState.date = g ? defaultDateForGroup(g.dayOfWeek) : '';
  document.getElementById('panel-reports').innerHTML = renderReportsPanel();
  loadReportsData();
}

function onReportsSubGroupChange(val) {
  reportsState.subGroupIdx = parseInt(val);
  loadReportsData();
}

function onReportsModeChange(mode, btn) {
  reportsState.mode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const dr = document.getElementById('repDateRow');
  const mr = document.getElementById('repMonthRow');
  if (dr) dr.style.display = mode === 'bydate' ? '' : 'none';
  if (mr) mr.style.display = mode === 'monthly' ? '' : 'none';
  displayReports();
}

function onReportsMonthChange(val) {
  reportsState.month = val;
  displayReports();
}

function onReportsDateChange(val) {
  reportsState.date = val;
  displayReports();
}

// ===== PAYMENTS PANEL =====
const GROUP_COLORS = ['#3182ce','#2c5282','#276749','#c05621','#6b46c1','#b7791f'];
let _payFilter = 'all';
let _payGroupFilter = 'all';

function _payKindsAvailable() {
  const kinds = [];
  if (groups.length > 0) kinds.push({ key: 'groups', icon: '🗓', label: 'חוגים',  color: '#2b6cb0', render: renderGroupPaymentsContent });
  if (teams.length  > 0) kinds.push({ key: 'teams',  icon: '🏅', label: 'נבחרות', color: '#553c9a', render: renderTeamPaymentsContent });
  if (camps.length  > 0) kinds.push({ key: 'camps',  icon: '🏕️', label: 'מחנות',  color: '#c05621', render: renderCampPaymentsContent });
  return kinds;
}

function renderPaymentsPanel() {
  const kinds = _payKindsAvailable();
  if (kinds.length === 0) return `
    <div class="att-card" style="text-align:center;padding:40px;color:#a0aec0">
      <div style="font-size:32px;margin-bottom:8px">💳</div>
      <div>אין חוגים, נבחרות או מחנות מוקצים</div>
    </div>`;
  if (kinds.length === 1) return kinds[0].render();

  window._payKinds = kinds;
  const tabsHtml = kinds.map((k, i) => `
    <button id="pay-tab-btn-${k.key}" onclick="switchPayTab('${k.key}')"
      style="padding:10px 20px;border:none;background:none;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;border-bottom:3px solid ${i===0?k.color:'transparent'};color:${i===0?k.color:'#718096'};margin-bottom:-2px">
      ${k.icon} ${k.label}
    </button>`).join('');
  const contentHtml = kinds.map((k, i) => `<div id="pay-content-${k.key}"${i===0?'':' style="display:none"'}>${k.render()}</div>`).join('');
  return `<div style="display:flex;gap:0;border-bottom:2px solid #e2e8f0;margin-bottom:16px">${tabsHtml}</div>${contentHtml}`;
}
window.switchPayTab = function(tab) {
  const kinds = window._payKinds || _payKindsAvailable();
  kinds.forEach(k => {
    const isActive = k.key === tab;
    const content = document.getElementById('pay-content-' + k.key);
    if (content) content.style.display = isActive ? '' : 'none';
    const btn = document.getElementById('pay-tab-btn-' + k.key);
    if (btn) { btn.style.borderBottom = isActive ? '3px solid ' + k.color : '3px solid transparent'; btn.style.color = isActive ? k.color : '#718096'; }
  });
};

function renderGroupPaymentsContent() {
  // Build full list with group info
  const all = [];
  groups.forEach((g, gi) => g.subGroups.forEach((sg, si) => {
    sortedPlayers(sg.players).forEach(({ p }) => {
      if (p.hidden) return;
      all.push({ p, g, gi, si, groupName: g.name, subName: sg.time || '' });
    });
  }));

  // Global counts (all groups)
  const globalCounts = { trial: 0, pending: 0, paid: 0 };
  all.forEach(({ p }) => globalCounts[p.paymentStatus || 'trial']++);

  // Per-sub-group summary cards
  const subGroupCards = [];
  groups.forEach((g, gi) => {
    g.subGroups.forEach((sg, si) => {
      const key = `${gi}-${si}`;
      const sgPlayers = all.filter(x => x.gi === gi && x.si === si);
      const c = { trial: 0, pending: 0, paid: 0 };
      sgPlayers.forEach(({ p }) => c[p.paymentStatus || 'trial']++);
      const isActive = _payGroupFilter === key;
      const color = GROUP_COLORS[gi % GROUP_COLORS.length];
      const paidPct = sgPlayers.length ? Math.round(c.paid / sgPlayers.length * 100) : 0;
      const label = g.subGroups.length > 1 ? `${g.name} · ${sg.time}` : g.name;
      subGroupCards.push(`
        <div onclick="setPayGroupFilter('${isActive ? 'all' : key}')" style="cursor:pointer;background:white;border:2px solid ${isActive ? color : '#e2e8f0'};border-radius:10px;padding:12px 14px;min-width:150px;flex:1;transition:border .15s">
          <div style="font-size:12px;font-weight:700;color:${color};margin-bottom:8px">${label}</div>
          <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
            <div style="flex:1;background:#e2e8f0;border-radius:4px;height:6px">
              <div style="width:${paidPct}%;background:${color};height:6px;border-radius:4px"></div>
            </div>
            <span style="font-size:11px;color:#718096;white-space:nowrap">${c.paid}/${sgPlayers.length}</span>
          </div>
          <div style="display:flex;gap:6px;font-size:11px;flex-wrap:wrap">
            ${c.paid ? `<span style="background:#f0fff4;color:#276749;padding:1px 7px;border-radius:8px">שילם: ${c.paid}</span>` : ''}
            ${c.pending ? `<span style="background:#fff5f5;color:#e53e3e;padding:1px 7px;border-radius:8px">ממתין: ${c.pending}</span>` : ''}
            ${c.trial ? `<span style="background:#fffbeb;color:#b7791f;padding:1px 7px;border-radius:8px">ניסיון: ${c.trial}</span>` : ''}
          </div>
        </div>`);
    });
  });
  const groupSummaries = subGroupCards.join('');

  // Filter by sub-group + status
  let filtered = all;
  if (_payGroupFilter !== 'all') {
    const [fgi, fsi] = _payGroupFilter.split('-').map(Number);
    filtered = all.filter(x => x.gi === fgi && x.si === fsi);
  }
  filtered = _payFilter === 'all' ? filtered : filtered.filter(({ p }) => (p.paymentStatus || 'trial') === _payFilter);

  const filteredCounts = { trial: 0, pending: 0, paid: 0 };
  filtered.forEach(({ p }) => filteredCounts[p.paymentStatus || 'trial']++);

  const showGroupCol = _payGroupFilter === 'all';
  const rows = filtered.map(({ p, groupName, subName }, i) => {
    const { first, last } = splitName(p.name);
    const status = p.paymentStatus || 'trial';
    const badge = `<span class="pay-badge pay-${status}">${{trial:'ניסיון',pending:'ממתין לתשלום',paid:'שילם ✓'}[status]}</span>`;
    return `<tr>
      <td class="idx">${i+1}</td>
      <td style="font-weight:600">${last} ${first}</td>
      ${showGroupCol ? `<td style="color:#4a5568;font-size:13px">${groupName}${subName ? ' · '+subName : ''}</td>` : ''}
      <td>${badge}</td>
    </tr>`;
  }).join('');

  return `<div class="pay-panel-card">
    <div style="padding:16px 20px;font-size:16px;font-weight:700;border-bottom:1px solid #e2e8f0">💳 מעקב תשלומים</div>

    <div style="padding:14px 20px;border-bottom:1px solid #e2e8f0">
      <div style="font-size:12px;font-weight:600;color:#718096;margin-bottom:10px">סיכום לפי קבוצה — לחץ לסינון:</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">${groupSummaries}</div>
    </div>

    <div class="pay-summary-bar">
      <div class="pay-summary-box"><div class="psb-num" style="color:#d69e2e">${globalCounts.trial}</div><div class="psb-label">ניסיון</div></div>
      <div class="pay-summary-box"><div class="psb-num" style="color:#e53e3e">${globalCounts.pending}</div><div class="psb-label">ממתין לתשלום</div></div>
      <div class="pay-summary-box"><div class="psb-num" style="color:#276749">${globalCounts.paid}</div><div class="psb-label">שילם</div></div>
      <div class="pay-summary-box"><div class="psb-num" style="color:#2b6cb0">${all.length}</div><div class="psb-label">סה"כ שחקנים</div></div>
    </div>

    <div class="pay-filter-bar">
      <button class="pay-filter-btn${_payFilter==='all'?' active':''}" onclick="setPayFilter('all')">הכל (${filtered.length})</button>
      <button class="pay-filter-btn${_payFilter==='trial'?' active':''}" onclick="setPayFilter('trial')">ניסיון (${filteredCounts.trial})</button>
      <button class="pay-filter-btn${_payFilter==='pending'?' active':''}" onclick="setPayFilter('pending')">ממתין (${filteredCounts.pending})</button>
      <button class="pay-filter-btn${_payFilter==='paid'?' active':''}" onclick="setPayFilter('paid')">שילם (${filteredCounts.paid})</button>
    </div>

    <div style="overflow-x:auto">
    <table class="pay-table">
      <thead><tr><th>#</th><th>שם</th>${showGroupCol ? '<th>קבוצה</th>' : ''}<th>סטטוס</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="${showGroupCol?4:3}" style="text-align:center;padding:20px;color:#718096">אין שחקנים</td></tr>`}</tbody>
    </table></div>
  </div>`;
}

let _teamPayFilter = 'all';
let _teamPayGroupFilter = 'all';

function setTeamPayFilter(f) {
  _teamPayFilter = f;
  const panel = document.getElementById('panel-payments');
  if (panel) {
    if (groups.length > 0 && teams.length > 0) {
      document.getElementById('pay-content-teams').innerHTML = renderTeamPaymentsContent();
    } else {
      panel.innerHTML = renderPaymentsPanel();
    }
  }
}
window.setTeamPayFilter = setTeamPayFilter;

function setTeamPayGroupFilter(f) {
  _teamPayGroupFilter = f;
  _teamPayFilter = 'all';
  setTeamPayFilter('all');
}
window.setTeamPayGroupFilter = setTeamPayGroupFilter;

function renderTeamPaymentsContent() {
  if (!teams || teams.length === 0) return '<div style="padding:24px;text-align:center;color:#a0aec0">אין נבחרות מוקצות</div>';

  // Build full list
  const all = [];
  teams.forEach((t, ti) => t.subGroups.forEach((sg, si) => {
    sortedPlayers(sg.players).forEach(({ p }) => {
      if (p.hidden) return;
      all.push({ p, t, ti, si, teamName: t.name, subName: sg.time || '' });
    });
  }));

  // Global counts
  const globalCounts = { trial: 0, pending: 0, paid: 0 };
  all.forEach(({ p }) => globalCounts[p.paymentStatus || 'trial']++);

  // Per-sub-group cards
  const subGroupCards = [];
  teams.forEach((t, ti) => {
    t.subGroups.forEach((sg, si) => {
      const key = `${ti}-${si}`;
      const sgPlayers = all.filter(x => x.ti === ti && x.si === si);
      const c = { trial: 0, pending: 0, paid: 0 };
      sgPlayers.forEach(({ p }) => c[p.paymentStatus || 'trial']++);
      const isActive = _teamPayGroupFilter === key;
      const color = GROUP_COLORS[ti % GROUP_COLORS.length];
      const paidPct = sgPlayers.length ? Math.round(c.paid / sgPlayers.length * 100) : 0;
      const label = t.subGroups.length > 1 ? `${t.name} · ${sg.time}` : t.name;
      subGroupCards.push(`
        <div onclick="setTeamPayGroupFilter('${isActive ? 'all' : key}')" style="cursor:pointer;background:white;border:2px solid ${isActive ? color : '#e2e8f0'};border-radius:10px;padding:12px 14px;min-width:150px;flex:1;transition:border .15s">
          <div style="font-size:12px;font-weight:700;color:${color};margin-bottom:8px">${label}</div>
          <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
            <div style="flex:1;background:#e2e8f0;border-radius:4px;height:6px">
              <div style="width:${paidPct}%;background:${color};height:6px;border-radius:4px"></div>
            </div>
            <span style="font-size:11px;color:#718096;white-space:nowrap">${c.paid}/${sgPlayers.length}</span>
          </div>
          <div style="display:flex;gap:6px;font-size:11px;flex-wrap:wrap">
            ${c.paid    ? `<span style="background:#f0fff4;color:#276749;padding:1px 7px;border-radius:8px">שילם: ${c.paid}</span>`    : ''}
            ${c.pending ? `<span style="background:#fff5f5;color:#e53e3e;padding:1px 7px;border-radius:8px">ממתין: ${c.pending}</span>` : ''}
            ${c.trial   ? `<span style="background:#fffbeb;color:#b7791f;padding:1px 7px;border-radius:8px">ניסיון: ${c.trial}</span>`   : ''}
          </div>
        </div>`);
    });
  });

  // Filter
  let filtered = all;
  if (_teamPayGroupFilter !== 'all') {
    const [fti, fsi] = _teamPayGroupFilter.split('-').map(Number);
    filtered = all.filter(x => x.ti === fti && x.si === fsi);
  }
  filtered = _teamPayFilter === 'all' ? filtered : filtered.filter(({ p }) => (p.paymentStatus || 'trial') === _teamPayFilter);

  const filteredCounts = { trial: 0, pending: 0, paid: 0 };
  filtered.forEach(({ p }) => filteredCounts[p.paymentStatus || 'trial']++);

  const showTeamCol = _teamPayGroupFilter === 'all';
  const rows = filtered.map(({ p, teamName, subName }, i) => {
    const { first, last } = splitName(p.name);
    const status = p.paymentStatus || 'trial';
    const badge = `<span class="pay-badge pay-${status}">${{trial:'ניסיון',pending:'ממתין לתשלום',paid:'שילם ✓'}[status]}</span>`;
    return `<tr>
      <td class="idx">${i+1}</td>
      <td style="font-weight:600">${last} ${first}</td>
      ${showTeamCol ? `<td style="color:#4a5568;font-size:13px">${teamName}${subName ? ' · '+subName : ''}</td>` : ''}
      <td>${badge}</td>
    </tr>`;
  }).join('');

  return `<div class="pay-panel-card">
    <div style="padding:16px 20px;font-size:16px;font-weight:700;border-bottom:1px solid #e2e8f0">🏅 מעקב תשלומים — נבחרות</div>

    <div style="padding:14px 20px;border-bottom:1px solid #e2e8f0">
      <div style="font-size:12px;font-weight:600;color:#718096;margin-bottom:10px">סיכום לפי נבחרת — לחץ לסינון:</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">${subGroupCards.join('')}</div>
    </div>

    <div class="pay-summary-bar">
      <div class="pay-summary-box"><div class="psb-num" style="color:#d69e2e">${globalCounts.trial}</div><div class="psb-label">ניסיון</div></div>
      <div class="pay-summary-box"><div class="psb-num" style="color:#e53e3e">${globalCounts.pending}</div><div class="psb-label">ממתין לתשלום</div></div>
      <div class="pay-summary-box"><div class="psb-num" style="color:#276749">${globalCounts.paid}</div><div class="psb-label">שילם</div></div>
      <div class="pay-summary-box"><div class="psb-num" style="color:#2b6cb0">${all.length}</div><div class="psb-label">סה"כ שחקנים</div></div>
    </div>

    <div class="pay-filter-bar">
      <button class="pay-filter-btn${_teamPayFilter==='all'?' active':''}" onclick="setTeamPayFilter('all')">הכל (${filtered.length})</button>
      <button class="pay-filter-btn${_teamPayFilter==='trial'?' active':''}" onclick="setTeamPayFilter('trial')">ניסיון (${filteredCounts.trial})</button>
      <button class="pay-filter-btn${_teamPayFilter==='pending'?' active':''}" onclick="setTeamPayFilter('pending')">ממתין (${filteredCounts.pending})</button>
      <button class="pay-filter-btn${_teamPayFilter==='paid'?' active':''}" onclick="setTeamPayFilter('paid')">שילם (${filteredCounts.paid})</button>
    </div>

    <div style="overflow-x:auto">
    <table class="pay-table">
      <thead><tr><th>#</th><th>שם</th>${showTeamCol ? '<th>נבחרת</th>' : ''}<th>סטטוס</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="${showTeamCol?4:3}" style="text-align:center;padding:20px;color:#718096">אין שחקנים</td></tr>`}</tbody>
    </table></div>
  </div>`;
}
window.renderTeamPaymentsContent = renderTeamPaymentsContent;

let _campPayFilter = 'all';
let _campPayGroupFilter = 'all';

function setCampPayFilter(f) {
  _campPayFilter = f;
  const panel = document.getElementById('panel-payments');
  if (panel) {
    if (_payKindsAvailable().length > 1) {
      const el = document.getElementById('pay-content-camps');
      if (el) el.innerHTML = renderCampPaymentsContent();
    } else {
      panel.innerHTML = renderPaymentsPanel();
    }
  }
}
window.setCampPayFilter = setCampPayFilter;

function setCampPayGroupFilter(f) {
  _campPayGroupFilter = f;
  _campPayFilter = 'all';
  setCampPayFilter('all');
}
window.setCampPayGroupFilter = setCampPayGroupFilter;

function renderCampPaymentsContent() {
  if (!camps || camps.length === 0) return '<div style="padding:24px;text-align:center;color:#a0aec0">אין מחנות מוקצים</div>';

  const all = [];
  camps.forEach((c, ci) => c.levels.forEach((lv, li) => {
    sortedPlayers(lv.players).forEach(({ p }) => {
      if (p.hidden) return;
      all.push({ p, c, ci, li, campName: c.name, levelName: lv.name || '' });
    });
  }));

  const globalCounts = { trial: 0, pending: 0, paid: 0 };
  all.forEach(({ p }) => globalCounts[p.paymentStatus || 'trial']++);

  const levelCards = [];
  camps.forEach((c, ci) => {
    c.levels.forEach((lv, li) => {
      const key = `${ci}-${li}`;
      const lvPlayers = all.filter(x => x.ci === ci && x.li === li);
      const cnt = { trial: 0, pending: 0, paid: 0 };
      lvPlayers.forEach(({ p }) => cnt[p.paymentStatus || 'trial']++);
      const isActive = _campPayGroupFilter === key;
      const color = GROUP_COLORS[ci % GROUP_COLORS.length];
      const paidPct = lvPlayers.length ? Math.round(cnt.paid / lvPlayers.length * 100) : 0;
      const label = c.levels.length > 1 ? `${c.name} · ${lv.name}` : c.name;
      levelCards.push(`
        <div onclick="setCampPayGroupFilter('${isActive ? 'all' : key}')" style="cursor:pointer;background:white;border:2px solid ${isActive ? color : '#e2e8f0'};border-radius:10px;padding:12px 14px;min-width:150px;flex:1;transition:border .15s">
          <div style="font-size:12px;font-weight:700;color:${color};margin-bottom:8px">${label}</div>
          <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
            <div style="flex:1;background:#e2e8f0;border-radius:4px;height:6px">
              <div style="width:${paidPct}%;background:${color};height:6px;border-radius:4px"></div>
            </div>
            <span style="font-size:11px;color:#718096;white-space:nowrap">${cnt.paid}/${lvPlayers.length}</span>
          </div>
          <div style="display:flex;gap:6px;font-size:11px;flex-wrap:wrap">
            ${cnt.paid    ? `<span style="background:#f0fff4;color:#276749;padding:1px 7px;border-radius:8px">שילם: ${cnt.paid}</span>`    : ''}
            ${cnt.pending ? `<span style="background:#fff5f5;color:#e53e3e;padding:1px 7px;border-radius:8px">ממתין: ${cnt.pending}</span>` : ''}
            ${cnt.trial   ? `<span style="background:#fffbeb;color:#b7791f;padding:1px 7px;border-radius:8px">ניסיון: ${cnt.trial}</span>`   : ''}
          </div>
        </div>`);
    });
  });

  let filtered = all;
  if (_campPayGroupFilter !== 'all') {
    const [fci, fli] = _campPayGroupFilter.split('-').map(Number);
    filtered = all.filter(x => x.ci === fci && x.li === fli);
  }
  filtered = _campPayFilter === 'all' ? filtered : filtered.filter(({ p }) => (p.paymentStatus || 'trial') === _campPayFilter);

  const filteredCounts = { trial: 0, pending: 0, paid: 0 };
  filtered.forEach(({ p }) => filteredCounts[p.paymentStatus || 'trial']++);

  const showCampCol = _campPayGroupFilter === 'all';
  const rows = filtered.map(({ p, campName, levelName }, i) => {
    const { first, last } = splitName(p.name);
    const status = p.paymentStatus || 'trial';
    const badge = `<span class="pay-badge pay-${status}">${{trial:'ניסיון',pending:'ממתין לתשלום',paid:'שילם ✓'}[status]}</span>`;
    return `<tr>
      <td class="idx">${i+1}</td>
      <td style="font-weight:600">${last} ${first}</td>
      ${showCampCol ? `<td style="color:#4a5568;font-size:13px">${campName}${levelName ? ' · '+levelName : ''}</td>` : ''}
      <td>${badge}</td>
    </tr>`;
  }).join('');

  return `<div class="pay-panel-card">
    <div style="padding:16px 20px;font-size:16px;font-weight:700;border-bottom:1px solid #e2e8f0">🏕️ מעקב תשלומים — מחנות</div>

    <div style="padding:14px 20px;border-bottom:1px solid #e2e8f0">
      <div style="font-size:12px;font-weight:600;color:#718096;margin-bottom:10px">סיכום לפי רמה — לחץ לסינון:</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">${levelCards.join('')}</div>
    </div>

    <div class="pay-summary-bar">
      <div class="pay-summary-box"><div class="psb-num" style="color:#d69e2e">${globalCounts.trial}</div><div class="psb-label">ניסיון</div></div>
      <div class="pay-summary-box"><div class="psb-num" style="color:#e53e3e">${globalCounts.pending}</div><div class="psb-label">ממתין לתשלום</div></div>
      <div class="pay-summary-box"><div class="psb-num" style="color:#276749">${globalCounts.paid}</div><div class="psb-label">שילם</div></div>
      <div class="pay-summary-box"><div class="psb-num" style="color:#2b6cb0">${all.length}</div><div class="psb-label">סה"כ שחקנים</div></div>
    </div>

    <div class="pay-filter-bar">
      <button class="pay-filter-btn${_campPayFilter==='all'?' active':''}" onclick="setCampPayFilter('all')">הכל (${filtered.length})</button>
      <button class="pay-filter-btn${_campPayFilter==='trial'?' active':''}" onclick="setCampPayFilter('trial')">ניסיון (${filteredCounts.trial})</button>
      <button class="pay-filter-btn${_campPayFilter==='pending'?' active':''}" onclick="setCampPayFilter('pending')">ממתין (${filteredCounts.pending})</button>
      <button class="pay-filter-btn${_campPayFilter==='paid'?' active':''}" onclick="setCampPayFilter('paid')">שילם (${filteredCounts.paid})</button>
    </div>

    <div style="overflow-x:auto">
    <table class="pay-table">
      <thead><tr><th>#</th><th>שם</th>${showCampCol ? '<th>מחנה</th>' : ''}<th>סטטוס</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="${showCampCol?4:3}" style="text-align:center;padding:20px;color:#718096">אין שחקנים</td></tr>`}</tbody>
    </table></div>
  </div>`;
}
window.renderCampPaymentsContent = renderCampPaymentsContent;

function setPayFilter(f) {
  _payFilter = f;
  document.getElementById('panel-payments').innerHTML = renderPaymentsPanel();
}

function setPayGroupFilter(f) {
  _payGroupFilter = f;
  _payFilter = 'all';
  document.getElementById('panel-payments').innerHTML = renderPaymentsPanel();
}

// ===== COMBINED CALENDAR PANEL =====

function _buildWeeklyGrid(entries, hint) {
  const dayNames = ['ראשון','שני','שלישי','רביעי','חמישי'];
  const byDay = {};
  [0,1,2,3,4].forEach(d => byDay[d] = []);
  entries.forEach(e => { const d = Number(e.day); if (d >= 0 && d <= 4) byDay[d].push(e); });
  [0,1,2,3,4].forEach(d => byDay[d].sort((a,b) => (a.time||'').localeCompare(b.time||'')));

  const cols = [0,1,2,3,4].map(d => {
    const items = byDay[d];

    // Group items into time-slots: same time → same row, different time → new row
    const slots = [];
    const slotMap = {};
    items.forEach(item => {
      const key = item.time || '_';
      if (!slotMap[key]) { slotMap[key] = []; slots.push(slotMap[key]); }
      slotMap[key].push(item);
    });

    // Column flex = widest concurrent row (so multi-item days get proportionally more space)
    const maxPerRow = slots.reduce((m, s) => Math.max(m, s.length), 1);

    const rows = slots.map(slot => {
      const cards = slot.map(item => `
        <div style="flex:1;min-width:0;overflow:hidden;background:${item.color}18;border-right:3px solid ${item.color};border-radius:6px;padding:6px 8px">
          ${item.time ? `<div style="font-size:11px;font-weight:700;color:${item.color};white-space:nowrap">${item.time}</div>` : ''}
          <div style="font-size:12px;font-weight:600;color:#1a202c;${item.time?'margin-top:2px':''}overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.name}</div>
          ${item.sublabel ? `<div style="font-size:11px;color:#4a5568;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">👤 ${item.sublabel}</div>` : ''}
          ${item.location ? `<div style="font-size:11px;color:#718096;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">📍 ${item.location}</div>` : ''}
        </div>`).join('');
      return `<div style="display:flex;gap:4px;margin-bottom:6px">${cards}</div>`;
    }).join('');

    return `
      <div style="flex:${maxPerRow};min-width:0;border-right:1px solid #e2e8f0;padding:10px 8px">
        <div style="font-size:13px;font-weight:700;color:#2b6cb0;margin-bottom:8px;text-align:center;border-bottom:2px solid #2b6cb0;padding-bottom:4px">יום ${dayNames[d]}</div>
        ${rows || '<div style="color:#cbd5e0;font-size:12px;text-align:center;padding-top:8px">—</div>'}
      </div>`;
  }).join('');

  return `<div class="weekly-grid-wrap"><div class="weekly-grid">${cols}</div></div>
    ${hint ? `<div style="padding:10px 16px;background:#f7fafc;border-top:1px solid #e2e8f0;font-size:11px;color:#718096">${hint}</div>` : ''}`;
}

function renderCalendarPanel() {
  const hasGroups = groups.filter(g => g.name).length > 0;
  const hasTeams  = (teams||[]).length > 0;

  // Groups: color by subgroup level label (same label = same color across groups)
  const sgLevelColorMap = {};
  let sgLevelIdx = 0;
  const groupEntries = [];
  groups.forEach((g, gi) => {
    if (!g.name) return;
    const sgWithDay = (g.subGroups||[]).filter(sg => sg.day != null && sg.day >= 0 && sg.day <= 4);
    if (sgWithDay.length > 0) {
      sgWithDay.forEach(sg => {
        const levelKey = (sg.time||'').trim().toLowerCase();
        if (!sgLevelColorMap[levelKey]) sgLevelColorMap[levelKey] = GROUP_COLORS[sgLevelIdx++ % GROUP_COLORS.length];
        groupEntries.push({ day: sg.day, color: sgLevelColorMap[levelKey], time: sg.meetingTime||'', name: g.name, sublabel: sg.time||g.instructor||'', location: sg.location||'' });
      });
    } else if (g.meetings && g.meetings.length > 0) {
      const color = GROUP_COLORS[gi % GROUP_COLORS.length];
      g.meetings.forEach(m => { const d = Number(m.day); if (d >= 0 && d <= 4) groupEntries.push({ day:d, color, time:m.time||'', name:g.name, sublabel:g.instructor||'', location:m.location||'' }); });
    } else if (g.dayOfWeek >= 0 && g.dayOfWeek <= 4) {
      const color = GROUP_COLORS[gi % GROUP_COLORS.length];
      groupEntries.push({ day:g.dayOfWeek, color, time:'', name:g.name, sublabel:g.instructor||'', location:'' });
    }
  });

  // Teams: color by coach (same coach = same color)
  const coachColorMap = {};
  let coachColorIdx = 0;
  const teamEntries = [];
  (teams||[]).forEach((team, ti) => {
    const coachKey = (team.coach||'').trim() || team.name;
    if (!coachColorMap[coachKey]) coachColorMap[coachKey] = TEAM_COLORS[coachColorIdx++ % TEAM_COLORS.length];
    const color = coachColorMap[coachKey];
    const sgWithDay = (team.subGroups||[]).filter(sg => sg.day != null && sg.day >= 0 && sg.day <= 4);
    if (sgWithDay.length > 0) {
      sgWithDay.forEach(sg => teamEntries.push({ day: sg.day, color, time: sg.meetingTime||'', name: team.name, sublabel: team.coach||'', location: sg.location||'' }));
    } else {
      (team.meetings||[]).forEach(m => { const d = Number(m.day); if (d >= 0 && d <= 4) teamEntries.push({ day:d, color, time:m.time||'', name:team.name, sublabel:team.coach||'', location:m.location||'' }); });
    }
  });

  const isAdmin = currentUser?.role === 'admin';
  const groupsGrid = _buildWeeklyGrid(groupEntries, isAdmin ? 'עבור ל⚙️ הגדרות ולחץ ✎ ערוך לצד החוג לעריכה' : '');
  const teamsGrid  = _buildWeeklyGrid(teamEntries,  isAdmin ? 'עבור ל⚙️ הגדרות ולחץ ✎ ערוך לצד הנבחרת לעריכה' : '');
  const tabBtn = (id, label, active) => `<button id="${id}" onclick="switchCalTab('${active?'groups':'teams'}')" style="padding:10px 20px;border:none;background:none;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;border-bottom:3px solid ${active?'#2b6cb0':'transparent'};color:${active?'#2b6cb0':'#718096'};margin-bottom:-2px">${label}</button>`;

  if (hasGroups && !hasTeams) return `<div class="cal-card" style="overflow:hidden"><div class="cal-header"><span style="font-size:16px;font-weight:700">📅 לוח שנה שבועי — חוגים</span></div>${groupsGrid}</div>`;
  if (hasTeams  && !hasGroups) return `<div class="cal-card" style="overflow:hidden"><div class="cal-header"><span style="font-size:16px;font-weight:700">📅 לוח שנה שבועי — נבחרות</span></div>${teamsGrid}</div>`;

  return `<div class="cal-card" style="overflow:hidden">
    <div style="display:flex;border-bottom:2px solid #e2e8f0;padding:0 16px">
      ${tabBtn('cal-tab-btn-groups','🗓 חוגים',true)}
      ${tabBtn('cal-tab-btn-teams','🏅 נבחרות',false)}
    </div>
    <div id="cal-content-groups">${groupsGrid}</div>
    <div id="cal-content-teams" style="display:none">${teamsGrid}</div>
  </div>`;
}
window.renderCalendarPanel = renderCalendarPanel;

function switchCalTab(tab) {
  const isGroups = tab === 'groups';
  const gc = document.getElementById('cal-content-groups');
  const tc = document.getElementById('cal-content-teams');
  if (gc) gc.style.display = isGroups ? '' : 'none';
  if (tc) tc.style.display = isGroups ? 'none' : '';
  const gb = document.getElementById('cal-tab-btn-groups');
  const tb = document.getElementById('cal-tab-btn-teams');
  if (gb) { gb.style.borderBottom = isGroups ? '3px solid #2b6cb0' : '3px solid transparent'; gb.style.color = isGroups ? '#2b6cb0' : '#718096'; gb.onclick = () => switchCalTab('groups'); }
  if (tb) { tb.style.borderBottom = isGroups ? '3px solid transparent' : '3px solid #2b6cb0'; tb.style.color = isGroups ? '#718096' : '#2b6cb0'; tb.onclick = () => switchCalTab('teams'); }
}
window.switchCalTab = switchCalTab;

// ===== GUIDE PANEL =====
function renderGuidePanel() {
  const section = (icon, title, color, steps, tips = []) => `
    <div style="background:white;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,0.08);margin-bottom:20px;overflow:hidden">
      <div style="background:${color};padding:14px 20px;display:flex;align-items:center;gap:10px">
        <span style="font-size:22px">${icon}</span>
        <span style="font-size:16px;font-weight:700;color:white">${title}</span>
      </div>
      <div style="padding:18px 20px">
        <ol style="margin:0;padding-right:20px;display:flex;flex-direction:column;gap:10px">
          ${steps.map(s => `<li style="font-size:14px;color:#2d3748;line-height:1.6">${s}</li>`).join('')}
        </ol>
        ${tips.length ? `<div style="margin-top:14px;background:#fffbeb;border-right:3px solid #f6ad55;border-radius:6px;padding:10px 14px">
          <div style="font-size:12px;font-weight:700;color:#744210;margin-bottom:4px">💡 טיפים</div>
          ${tips.map(t => `<div style="font-size:13px;color:#744210;margin-top:3px">• ${t}</div>`).join('')}
        </div>` : ''}
      </div>
    </div>`;

  return `
    <div style="max-width:720px;margin:0 auto;padding:24px 16px">
      <div style="text-align:center;margin-bottom:28px">
        <div style="font-size:36px;margin-bottom:8px">📖</div>
        <h2 style="font-size:22px;font-weight:800;color:#1a202c;margin:0 0 6px">מדריך למדריך</h2>
        <p style="color:#718096;font-size:14px;margin:0">כל מה שצריך לדעת כדי לנהל את הנבחרת / החוג שלך במערכת</p>
      </div>

      <!-- מבנה המערכת -->
      <div style="background:#ebf8ff;border-radius:12px;padding:16px 20px;margin-bottom:20px;border-right:4px solid #2b6cb0">
        <div style="font-size:14px;font-weight:700;color:#2c5282;margin-bottom:8px">🗺️ מבנה המערכת</div>
        <div style="display:flex;flex-wrap:wrap;gap:10px">
          ${[['🗓 חוגים','ניהול קבוצות לימוד שבועיות'],['🏅 נבחרות','קבוצות תחרותיות'],['📋 נוכחות','רישום נוכחות לפי תאריך'],['👤 שחקנים','פרטים אישיים + הישגים'],['📅 לוח שנה','מפגשים לפי ימים']].map(([i,d]) =>
            `<div style="background:white;border-radius:8px;padding:8px 12px;font-size:13px;min-width:120px;flex:1">
              <div style="font-weight:700;color:#2b6cb0">${i}</div>
              <div style="color:#718096;font-size:12px;margin-top:2px">${d}</div>
            </div>`).join('')}
        </div>
      </div>

      ${section('➕','הוספת משתתף חדש','linear-gradient(135deg,#2b6cb0,#2c5282)',[
        'עבור ללשונית החוג או הנבחרת הרלוונטית מהתפריט הצדדי',
        'לחץ על כפתור <strong>➕ הוסף משתתף</strong> (בפינה הימנית של הקבוצה)',
        'מלא את שם פרטי, שם משפחה, שנת לידה, מין (שדות חובה מסומנים *)',
        'הכנס טלפון ומייל הורה (חובה)',
        'אם יש מספר שחקן באיגוד — הכנס אותו ולחץ <strong>🔍 שלוף</strong> למילוי אוטומטי',
        'לחץ <strong>➕ הוסף</strong>'
      ],[
        'לחיצה על "🔍 שלוף" ממלאת אוטומטית מד כושר ותוקף כרטיס מאתר האיגוד',
        'ניתן לשלוף נתונים גם בעריכה מאוחר יותר'
      ])}

      ${section('📋','רישום נוכחות','linear-gradient(135deg,#276749,#2f855a)',[
        'עבור ללשונית <strong>📋 נוכחות</strong> מהתפריט',
        'בחר חוג / נבחרת מהרשימה הנפתחת',
        'בחר תאריך — <em>המערכת מציגה רק תאריכים של ימי הפגישה</em>',
        'סמן ✓ לידי כל משתתף שנוכח (לחיצה על השורה מסמנת/מבטלת)',
        'לחץ <strong>💾 שמור נוכחות</strong>',
        'אם הייתה חופשה — לחץ על <strong>🚫 חופשה</strong> במקום לסמן נוכחות'
      ],[
        'ניתן לסמן הכל / לנקה הכל בכפתורים המהירים',
        'הנוכחות נשמרת בענן — ניתן לחזור ולערוך בכל עת'
      ])}

      ${section('✏️','עריכת פרטי משתתף','linear-gradient(135deg,#553c9a,#44337a)',[
        'לחץ על שם המשתתף בטבלה — יפתח חלון הפרופיל',
        'לחץ על <strong>✎ ערוך</strong> בפינה הימנית של חלון הפרופיל',
        'ערוך את הפרטים הנדרשים (שדות חובה מסומנים *)',
        'לחץ <strong>💾 שמור</strong>'
      ],[
        'ניתן להעביר משתתף לחוג / נבחרת אחרת ישירות מחלון העריכה',
        'סטטוס תשלום (ניסיון / ממתין / שילם) מתעדכן כאן'
      ])}

      ${section('🖨️','הדפסת רשימת משתתפים','linear-gradient(135deg,#744210,#975a16)',[
        'גלול לקבוצה הרצויה בתוך החוג / הנבחרת',
        'לחץ על <strong>🖨️ הדפס</strong> בפינה הימנית של הכותרת',
        'ייפתח חלון הדפסה עם הרשימה — שמור כ-PDF או הדפס'
      ])}


${section('📊','צפייה בנוכחות וסטטיסטיקות','linear-gradient(135deg,#c53030,#9b2c2c)',[
        'לחץ על שם משתתף לפתיחת הפרופיל',
        'בחלק התחתון של הפרופיל תוצג <strong>היסטוריית נוכחות</strong>',
        'לסיכום כלל הקבוצה — עבור ל<strong>📊 דוחות</strong> בתפריט',
        'לסיכום תשלומים — עבור ל<strong>💳 תשלומים</strong>'
      ])}

      <div style="background:#f0fff4;border-radius:12px;padding:16px 20px;border-right:4px solid #38a169;margin-top:8px">
        <div style="font-size:14px;font-weight:700;color:#276749;margin-bottom:8px">✅ שים לב</div>
        <div style="font-size:13px;color:#276749;line-height:1.8">
          • כל השינויים נשמרים <strong>אוטומטית בענן</strong> — אין צורך ב"שמור" לכל פעולה (חוץ מנוכחות)<br>
          • המערכת עובדת <strong>מכל מכשיר</strong> — מחשב, טאבלט, טלפון<br>
          • בעיה? פנה למנהל המערכת
        </div>
      </div>
    </div>`;
}
window.renderGuidePanel = renderGuidePanel;

// ===== TEAM CALENDAR COLORS =====
const TEAM_COLORS = ['#2b6cb0','#276749','#744210','#553c9a','#c53030','#285e61','#7b341e','#1a365d','#2d3748','#6b46c1','#2c7a7b','#9c4221'];

function renderTeamCalendarPanel() { return renderCalendarPanel(); }
window.renderTeamCalendarPanel = renderTeamCalendarPanel;

// ===== TEAM MEETINGS MODAL =====
function openTeamMeetingsModal(teamIdx) {
  const team = teams[teamIdx];
  if (!team) return;
  const dayNames = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
  const rows = (team.meetings || []).map((m, i) => `
    <div id="tm-row-${i}" style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #f0f4f8;flex-wrap:wrap">
      <select id="tm-day-${i}" class="modal-input" style="width:100px">
        ${dayNames.map((d,di) => `<option value="${di}"${m.day===di?' selected':''}>${d}</option>`).join('')}
      </select>
      <input type="text" id="tm-time-${i}" value="${m.time||''}" placeholder="12:50" class="modal-input" style="width:80px" dir="ltr">
      <input type="text" id="tm-loc-${i}" value="${m.location||''}" placeholder="שם ביה&quot;ס / מרכז" class="modal-input" style="flex:1;min-width:120px">
      <button onclick="removeTmRow(${i})" style="background:#fff5f5;border:1px solid #fed7d7;color:#c53030;border-radius:6px;padding:5px 10px;cursor:pointer;font-size:13px;white-space:nowrap;font-family:inherit">✕ הסר</button>
    </div>`).join('');

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.id = 'teamMeetingsOverlay';
  overlay.innerHTML = `
    <div class="modal-box" style="width:520px">
      <div class="modal-header">
        <div><h3>⚙️ מפגשים — ${team.name}</h3><div style="font-size:12px;opacity:0.8;margin-top:2px">👤 ${team.coach||''}</div></div>
        <button class="modal-close" onclick="document.getElementById('teamMeetingsOverlay').remove()">✕</button>
      </div>
      <div class="modal-body">
        <div id="tm-rows">${rows}</div>
        <button onclick="addTmRow()" style="width:100%;margin-top:10px;padding:9px;background:#ebf8ff;border:1px dashed #63b3ed;color:#2b6cb0;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">+ הוסף מפגש</button>
      </div>
      <div class="modal-actions">
        <button class="btn-form-cancel" onclick="document.getElementById('teamMeetingsOverlay').remove()">ביטול</button>
        <button class="btn-form-submit" onclick="saveTeamMeetings(${teamIdx})">💾 שמור</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  window._tmTeamIdx = teamIdx;
  window._tmRowCount = (team.meetings || []).length;
}
window.openTeamMeetingsModal = openTeamMeetingsModal;

function addTmRow() {
  const dayNames = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
  const i = window._tmRowCount++;
  const div = document.createElement('div');
  div.id = `tm-row-${i}`;
  div.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #f0f4f8;flex-wrap:wrap';
  div.innerHTML = `
    <select id="tm-day-${i}" class="modal-input" style="width:100px">
      ${dayNames.map((d,di) => `<option value="${di}">${d}</option>`).join('')}
    </select>
    <input type="text" id="tm-time-${i}" placeholder="12:50" class="modal-input" style="width:80px" dir="ltr">
    <input type="text" id="tm-loc-${i}" placeholder="שם ביה&quot;ס / מרכז" class="modal-input" style="flex:1;min-width:120px">
    <button onclick="removeTmRow(${i})" style="background:#fff5f5;border:1px solid #fed7d7;color:#c53030;border-radius:6px;padding:5px 10px;cursor:pointer;font-size:13px;white-space:nowrap;font-family:inherit">✕ הסר</button>`;
  document.getElementById('tm-rows').appendChild(div);
}
window.addTmRow = addTmRow;

function removeTmRow(i) {
  document.getElementById(`tm-row-${i}`)?.remove();
}
window.removeTmRow = removeTmRow;

async function saveTeamMeetings(teamIdx) {
  const team = teams[teamIdx];
  if (!team) return;
  const meetings = [];
  for (let i = 0; i < window._tmRowCount; i++) {
    const row = document.getElementById(`tm-row-${i}`);
    if (!row) continue;
    const day  = parseInt(document.getElementById(`tm-day-${i}`)?.value ?? -1);
    const time = document.getElementById(`tm-time-${i}`)?.value?.trim() || '';
    const loc  = document.getElementById(`tm-loc-${i}`)?.value?.trim() || '';
    if (day >= 0 && (time || loc)) meetings.push({ day, time, location: loc });
  }
  team.meetings = meetings;
  if (db && team.id) {
    try {
      await db.ref(`dbTeams/${team.id}/meetings`).set(meetings.length ? meetings : null);
    } catch(e) { showToast('שגיאה בשמירה: ' + e.message, 'error'); return; }
  }
  document.getElementById('teamMeetingsOverlay')?.remove();
  const panel = document.getElementById('panel-team-' + team.id);
  if (panel) panel.innerHTML = renderTeamGroup(team, teamIdx);
  const tcPanel = document.getElementById('panel-calendar');
  if (tcPanel && tcPanel.classList.contains('active')) tcPanel.innerHTML = renderCalendarPanel();
  // refresh attendance date selector if this team is currently selected
  if (teamAttState.teamIdx === teamIdx) {
    teamAttState.date = defaultDateForTeam(team);
    rebuildTeamDateSelect();
  }
  showToast(`מפגשים עודכנו ✅`);
}
window.saveTeamMeetings = saveTeamMeetings;

// ===== SHARED MEETING ROW HELPERS =====
window._mtCounts = {};

function _meetingsSection(meetings, prefix) {
  window._mtCounts[prefix] = meetings.length;
  const dayNames = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
  const rows = meetings.map((m, i) => _meetingRow(m, i, prefix, dayNames)).join('');
  return `<div>
    <label style="font-size:13px;font-weight:600;color:#4a5568;display:block;margin-bottom:6px">מפגשים שבועיים</label>
    <div id="${prefix}-rows" style="min-height:4px">${rows}</div>
    <button onclick="addMeetingRow('${prefix}')" style="width:100%;margin-top:8px;padding:8px;background:#ebf8ff;border:1px dashed #63b3ed;color:#2b6cb0;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">+ הוסף מפגש</button>
  </div>`;
}

function _meetingRow(m, i, prefix, dayNames) {
  dayNames = dayNames || ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
  return `<div id="${prefix}-row-${i}" style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #f0f4f8;flex-wrap:wrap">
    <select id="${prefix}-day-${i}" class="modal-input" style="width:100px">
      ${dayNames.map((d,di) => `<option value="${di}"${(m&&m.day===di)?' selected':''}>${d}</option>`).join('')}
    </select>
    <input type="text" id="${prefix}-time-${i}" value="${m&&m.time||''}" placeholder="16:00" class="modal-input" style="width:80px" dir="ltr">
    <input type="text" id="${prefix}-loc-${i}" value="${m&&m.location||''}" placeholder="מיקום (אופציונלי)" class="modal-input" style="flex:1;min-width:120px">
    <button onclick="removeMeetingRow('${prefix}',${i})" style="background:#fff5f5;border:1px solid #fed7d7;color:#c53030;border-radius:6px;padding:5px 10px;cursor:pointer;font-size:13px;white-space:nowrap;font-family:inherit">✕ הסר</button>
  </div>`;
}

window.addMeetingRow = function(prefix) {
  const dayNames = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
  const i = window._mtCounts[prefix]++;
  const tmp = document.createElement('div');
  tmp.innerHTML = _meetingRow({}, i, prefix, dayNames);
  document.getElementById(`${prefix}-rows`)?.appendChild(tmp.firstElementChild);
};
window.removeMeetingRow = function(prefix, i) {
  document.getElementById(`${prefix}-row-${i}`)?.remove();
};

function readMeetingRows(prefix) {
  const meetings = [];
  const count = window._mtCounts[prefix] || 0;
  for (let i = 0; i < count; i++) {
    const row = document.getElementById(`${prefix}-row-${i}`);
    if (!row) continue;
    const day = parseInt(document.getElementById(`${prefix}-day-${i}`)?.value ?? '-1');
    const time = document.getElementById(`${prefix}-time-${i}`)?.value?.trim() || '';
    const loc  = document.getElementById(`${prefix}-loc-${i}`)?.value?.trim() || '';
    if (day >= 0 && (time || loc)) meetings.push({ day, time, location: loc });
  }
  return meetings;
}

// ===== GROUP MEETINGS MODAL =====
function openGroupMeetingsModal(groupIdx) {
  const group = groups[groupIdx];
  if (!group) return;
  const dayNames = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
  const rows = (group.meetings || []).map((m, i) => `
    <div id="gm-row-${i}" style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #f0f4f8;flex-wrap:wrap">
      <select id="gm-day-${i}" class="modal-input" style="width:100px">
        ${dayNames.map((d,di) => `<option value="${di}"${m.day===di?' selected':''}>${d}</option>`).join('')}
      </select>
      <input type="text" id="gm-time-${i}" value="${m.time||''}" placeholder="12:50" class="modal-input" style="width:80px" dir="ltr">
      <input type="text" id="gm-loc-${i}" value="${m.location||''}" placeholder="מיקום (אופציונלי)" class="modal-input" style="flex:1;min-width:120px">
      <button onclick="removeGmRow(${i})" style="background:#fff5f5;border:1px solid #fed7d7;color:#c53030;border-radius:6px;padding:5px 10px;cursor:pointer;font-size:13px;white-space:nowrap;font-family:inherit">✕ הסר</button>
    </div>`).join('');

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.id = 'groupMeetingsOverlay';
  overlay.innerHTML = `
    <div class="modal-box" style="width:520px">
      <div class="modal-header">
        <div><h3>⚙️ מפגשים — ${group.name}</h3><div style="font-size:12px;opacity:0.8;margin-top:2px">👤 ${group.instructor||''}</div></div>
        <button class="modal-close" onclick="document.getElementById('groupMeetingsOverlay').remove()">✕</button>
      </div>
      <div class="modal-body">
        <div id="gm-rows">${rows}</div>
        <button onclick="addGmRow()" style="width:100%;margin-top:10px;padding:9px;background:#ebf8ff;border:1px dashed #63b3ed;color:#2b6cb0;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">+ הוסף מפגש</button>
      </div>
      <div class="modal-actions">
        <button class="btn-form-cancel" onclick="document.getElementById('groupMeetingsOverlay').remove()">ביטול</button>
        <button class="btn-form-submit" onclick="saveGroupMeetings(${groupIdx})">💾 שמור</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  window._gmGroupIdx = groupIdx;
  window._gmRowCount = (group.meetings || []).length;
}
window.openGroupMeetingsModal = openGroupMeetingsModal;

function addGmRow() {
  const dayNames = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
  const i = window._gmRowCount++;
  const div = document.createElement('div');
  div.id = `gm-row-${i}`;
  div.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #f0f4f8;flex-wrap:wrap';
  div.innerHTML = `
    <select id="gm-day-${i}" class="modal-input" style="width:100px">
      ${dayNames.map((d,di) => `<option value="${di}">${d}</option>`).join('')}
    </select>
    <input type="text" id="gm-time-${i}" placeholder="12:50" class="modal-input" style="width:80px" dir="ltr">
    <input type="text" id="gm-loc-${i}" placeholder="מיקום (אופציונלי)" class="modal-input" style="flex:1;min-width:120px">
    <button onclick="removeGmRow(${i})" style="background:#fff5f5;border:1px solid #fed7d7;color:#c53030;border-radius:6px;padding:5px 10px;cursor:pointer;font-size:13px;white-space:nowrap;font-family:inherit">✕ הסר</button>`;
  document.getElementById('gm-rows').appendChild(div);
}
window.addGmRow = addGmRow;

function removeGmRow(i) { document.getElementById(`gm-row-${i}`)?.remove(); }
window.removeGmRow = removeGmRow;

async function saveGroupMeetings(groupIdx) {
  const group = groups[groupIdx];
  if (!group) return;
  const meetings = [];
  for (let i = 0; i < window._gmRowCount; i++) {
    const row = document.getElementById(`gm-row-${i}`);
    if (!row) continue;
    const day  = parseInt(document.getElementById(`gm-day-${i}`)?.value ?? -1);
    const time = document.getElementById(`gm-time-${i}`)?.value?.trim() || '';
    const loc  = document.getElementById(`gm-loc-${i}`)?.value?.trim() || '';
    if (day >= 0 && (time || loc)) meetings.push({ day, time, location: loc });
  }
  group.meetings = meetings;
  if (db && group.id) {
    try {
      await db.ref(`dbGroups/${group.id}/meetings`).set(meetings.length ? meetings : null);
    } catch(e) { showToast('שגיאה בשמירה: ' + e.message, 'error'); return; }
  }
  document.getElementById('groupMeetingsOverlay')?.remove();
  // refresh the group panel
  const panel = document.getElementById('panel-' + group.id);
  if (panel) panel.innerHTML = renderGroup(group, groupIdx);
  // refresh calendar if visible
  const calP = document.getElementById('panel-calendar');
  if (calP && calP.classList.contains('active')) calP.innerHTML = renderCalendarPanel();
  // refresh attendance date selector if this group is selected
  if (attState.groupIdx === groupIdx) {
    attState.date = defaultDateForGroup(group);
    rebuildDateSelect();
    loadAttendance();
  }
  showToast('מפגשים עודכנו ✅');
}
window.saveGroupMeetings = saveGroupMeetings;


// ===== BACKUP =====
async function exportBackup() {
  if (!db) { alert('Firebase לא מחובר'); return; }
  const btn = event.target;
  btn.textContent = '⏳ מוריד...';
  btn.disabled = true;
  try {
    const paths = ['extra_players','player_overrides','hidden_players','attendance','notes','payment','player_contacts','group_names','subgroup_names'];
    const results = await Promise.all(paths.map(p => db.ref(p).get()));
    const backup = {};
    paths.forEach((p, i) => backup[p] = results[i].val());
    backup._exported = new Date().toISOString();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch(e) { alert('שגיאה בגיבוי: ' + e.message); }
  finally { btn.textContent = '💾 גיבוי'; btn.disabled = false; }
}

// ===== VACATION MANAGEMENT =====
async function loadVacations() {
  if (!db) return;
  try {
    const snap = await db.ref('vacations').get();
    if (snap.val()) Object.entries(snap.val()).forEach(([gid, dates]) => {
      _vacations[gid] = new Set(Object.keys(dates).filter(k => dates[k]));
    });
  } catch(e) { console.error(e); }
  try {
    const snap2 = await db.ref('teamVacations').get();
    if (snap2.val()) Object.entries(snap2.val()).forEach(([tid, dates]) => {
      _teamVacations[tid] = new Set(Object.keys(dates).filter(k => dates[k]));
    });
  } catch(e) { console.error(e); }
}

async function toggleVacation() {
  const g = groups[attState.groupIdx];
  const date = attState.date;
  if (!_vacations[g.id]) _vacations[g.id] = new Set();
  const isVac = _vacations[g.id].has(date);
  if (isVac) {
    _vacations[g.id].delete(date);
    if (db) await db.ref(`vacations/${g.id}/${date}`).remove();
    showToast('החופשה בוטלה');
  } else {
    _vacations[g.id].add(date);
    if (db) await db.ref(`vacations/${g.id}/${date}`).set(true);
    showToast('סומן כחופשה 🚫');
  }
  applyDateMarkers();
}

async function toggleTeamVacation() {
  const t = teams[teamAttState.teamIdx];
  if (!t) return;
  const date = teamAttState.date;
  if (!_teamVacations[t.id]) _teamVacations[t.id] = new Set();
  const isVac = _teamVacations[t.id].has(date);
  if (isVac) {
    _teamVacations[t.id].delete(date);
    if (db) await db.ref(`teamVacations/${t.id}/${date}`).remove();
    showToast('החופשה בוטלה');
  } else {
    _teamVacations[t.id].add(date);
    if (db) await db.ref(`teamVacations/${t.id}/${date}`).set(true);
    showToast('סומן כחופשה 🚫');
  }
  applyTeamDateMarkers();
}

function applyTeamDateMarkers() {
  const sel = document.getElementById('teamAttDate');
  if (!sel || sel.tagName !== 'SELECT') return;
  const t = teams[teamAttState.teamIdx];
  if (!t) return;
  Array.from(sel.options).forEach(opt => {
    const isVac = _teamVacations[t.id]?.has(opt.value);
    opt.text = (isVac ? '🚫 ' : '') + formatDate(opt.value);
    opt.style.color = isVac ? '#e53e3e' : '';
  });
}
window.toggleTeamVacation = toggleTeamVacation;

// ===== WEEKLY ATTENDANCE ALERTS =====
async function loadWeeklyAttendanceAlerts() {
  if (!db) return { groups: [], teams: [] };
  const today = new Date();
  const dow = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dow);
  weekStart.setHours(0,0,0,0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23,59,59,999);
  const toISO = d => d.toISOString().split('T')[0];
  const todayISO = toISO(today);

  const missingGroups = [];
  try {
    for (let gi = 0; gi < groups.length; gi++) {
      const g = groups[gi];
      const weekDates = getGroupDates(g.dayOfWeek).filter(d => {
        const dt = new Date(d); return dt >= weekStart && dt <= weekEnd && d <= todayISO;
      });
      for (const date of weekDates) {
        for (let si = 0; si < g.subGroups.length; si++) {
          try {
            const snap = await db.ref(`attendance/${g.id}/${si}/${date}`).get();
            if (!snap.val()) missingGroups.push({ groupName: g.name, subGroupName: g.subGroups[si].time || '', date: formatDate(date), instructor: g.instructor || '', instructorWa: g.instructorWa || '' });
          } catch(e) { /* skip */ }
        }
      }
    }
  } catch(e) { console.error('loadWeeklyAttendanceAlerts groups error:', e); }

  const missingTeams = [];
  try {
    for (let ti = 0; ti < teams.length; ti++) {
      const t = teams[ti];
      for (let si = 0; si < t.subGroups.length; si++) {
        const sg = t.subGroups[si];
        if (sg.day == null) continue;
        const weekDates = getGroupDates(sg.day).filter(d => {
          const dt = new Date(d); return dt >= weekStart && dt <= weekEnd && d <= todayISO;
        });
        for (const date of weekDates) {
          try {
            const snap = await db.ref(`team_attendance/${t.id}/${si}/${date}`).get();
            if (!snap.val()) missingTeams.push({ groupName: t.name, subGroupName: sg.time || '', date: formatDate(date), instructor: t.coach || '', instructorWa: '' });
          } catch(e) { /* skip */ }
        }
      }
    }
  } catch(e) { console.error('loadWeeklyAttendanceAlerts teams error:', e); }

  return { groups: missingGroups, teams: missingTeams };
}

