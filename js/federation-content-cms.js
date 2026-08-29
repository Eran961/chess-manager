// ===== CLUB TEAMS (קבוצות המועדון) =====
// Each team: { name, type ('בוגרים'|'נוער'|'נשים'), division ('לאומית'|'ארצית'|'א'|'ב'|'ג'), teamId }
let _clubTeams = [];

const TEAM_TYPE_ORDER  = ['בוגרים', 'נשים', 'נוער'];
const TEAM_TYPE_ICONS  = { 'בוגרים': '♟', 'נשים': '♛', 'נוער': '🎓' };
const DIV_ORDER = ['לאומית', 'ארצית', 'א', 'ב', 'ג'];

async function loadClubTeams() {
  try {
    const snap = await db.ref('clubTeams').get();
    const raw = snap.val() || [];
    // Support both old format (string[]) and new format (object[])
    _clubTeams = raw.map(t => typeof t === 'string' ? { name: t, type: 'בוגרים', division: '' } : t);
  } catch(e) { console.error('loadClubTeams:', e); }
}

async function syncClubTeamsFromSite() {
  const btns = document.querySelectorAll('[onclick="syncClubTeamsFromSite()"]');
  btns.forEach(b => { b.disabled = true; b.textContent = '⏳ טוען...'; });
  try {
    const res = await fetch('https://chess-manager-7wkr.onrender.com/api/club-teams?clubId=31', { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`שגיאת שרת ${res.status}`);
    const found = await res.json();
    if (!found.length) throw new Error('לא נמצאו קבוצות פעילות');
    await db.ref('clubTeams').set(found);
    _clubTeams = found;
    showToast(`נמצאו ${found.length} קבוצות פעילות`, 'success');
  } catch(e) {
    showToast('שגיאה: ' + e.message, 'error');
  } finally {
    renderLeagueTypePanels();
  }
}

async function addClubTeamManual() {
  const inp  = document.getElementById('new-team-input');
  const typeEl = document.getElementById('new-team-type');
  const divEl  = document.getElementById('new-team-div');
  const name = inp?.value?.trim();
  if (!name) return;
  if (_clubTeams.some(t => t.name === name)) { showToast('קבוצה זו כבר קיימת', 'error'); return; }
  const entry = { name, type: typeEl?.value || 'בוגרים', division: divEl?.value || '' };
  _clubTeams = [..._clubTeams, entry];
  await db.ref('clubTeams').set(_clubTeams);
  inp.value = '';
  renderClubTeamsList();
  showToast('נוסף', 'success');
}

async function removeClubTeam(idx) {
  _clubTeams.splice(idx, 1);
  await db.ref('clubTeams').set(_clubTeams);
  renderClubTeamsList();
}

function renderClubTeamsList() {
  renderLeagueTypePanels();
}

function buildClubTeamsSection() {
  return `
    <div style="margin-top:28px;border-top:2px solid #e2e8f0;padding-top:20px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div>
          <div style="font-size:15px;font-weight:800;color:#2d3748">🏅 קבוצות המועדון</div>
          <div style="font-size:12px;color:#718096;margin-top:2px">משמשות כהצעות אוטומטיות בשיבוצי הליגה</div>
        </div>
        <button id="btn-sync-teams" onclick="syncClubTeamsFromSite()"
          style="background:#2b6cb0;color:white;border:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap">
          🔄 סנכרן מאיגוד</button>
      </div>
      <div id="club-teams-list-panel"></div>
      <details style="margin-top:10px">
        <summary style="font-size:12px;color:#718096;cursor:pointer;user-select:none">+ הוסף קבוצה ידנית</summary>
        <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
          <input id="new-team-input" type="text" placeholder='שם הקבוצה'
            style="flex:2;min-width:120px;padding:7px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:inherit"
            onkeydown="if(event.key==='Enter')addClubTeamManual()">
          <select id="new-team-type" style="flex:1;min-width:90px;padding:7px 8px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:inherit">
            ${TEAM_TYPE_ORDER.map(t=>`<option value="${t}">${t}</option>`).join('')}
          </select>
          <select id="new-team-div" style="flex:1;min-width:90px;padding:7px 8px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:inherit">
            ${DIV_ORDER.map(d=>`<option value="${d}">ליגה ${d}</option>`).join('')}
          </select>
          <button onclick="addClubTeamManual()"
            style="background:#276749;color:white;border:none;border-radius:8px;padding:7px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">הוסף</button>
        </div>
      </details>
    </div>`;
}

window.syncClubTeamsFromSite = syncClubTeamsFromSite;
window.addClubTeamManual = addClubTeamManual;
window.removeClubTeam = removeClubTeam;

// ===== MORNING PROSPECTS (מצטייני גנים) =====
let _prospects = {};

const PROSPECT_STATUSES = [
  { key: 'new',       label: 'חדש',          color: '#2b6cb0', bg: '#ebf8ff' },
  { key: 'contacted', label: 'יצרנו קשר',    color: '#b7791f', bg: '#fffbeb' },
  { key: 'invited',   label: 'הוזמן',         color: '#553c9a', bg: '#faf5ff' },
  { key: 'joined',    label: '✅ הצטרף',      color: '#276749', bg: '#f0fff4' },
  { key: 'no-answer', label: 'לא ענה',        color: '#718096', bg: '#f7fafc' },
  { key: 'declined',  label: 'לא מעוניין',   color: '#c53030', bg: '#fff5f5' },
];

function prospectStatus(key) {
  return PROSPECT_STATUSES.find(s => s.key === key) || PROSPECT_STATUSES[0];
}

async function loadProspects() {
  if (!db) return;
  try {
    const snap = await db.ref('morningProspects').get();
    _prospects = snap.val() || {};
    renderProspectsPanel();
  } catch(e) { console.error('loadProspects:', e); }
}

function renderProspectsPanel() {
  const el = document.getElementById('panel-prospects');
  if (el) el.innerHTML = buildProspectsHTML();
}

function buildProspectsHTML() {
  const filterSchool = window._prospectFilterSchool || '';
  const filterStatus = window._prospectFilterStatus || '';

  const list = Object.entries(_prospects)
    .sort((a, b) => (b[1].addedAt || 0) - (a[1].addedAt || 0));

  // Collect unique schools for filter
  const schools = [...new Set(list.map(([,p]) => p.school).filter(Boolean))].sort();

  const filtered = list.filter(([,p]) => {
    if (filterSchool && p.school !== filterSchool) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    return true;
  });

  // Summary counts per status
  const counts = {};
  PROSPECT_STATUSES.forEach(s => { counts[s.key] = 0; });
  list.forEach(([,p]) => { const k = p.status || 'new'; if (counts[k] !== undefined) counts[k]++; });

  const summaryBadges = PROSPECT_STATUSES.filter(s => counts[s.key] > 0).map(s =>
    `<span style="background:${s.bg};color:${s.color};border-radius:6px;padding:4px 10px;font-size:12px;font-weight:700;cursor:pointer;border:1px solid ${s.color}33"
      onclick="window._prospectFilterStatus=window._prospectFilterStatus==='${s.key}'?'':'${s.key}';renderProspectsPanel()">
      ${s.label} ${counts[s.key]}
    </span>`
  ).join('');

  const rows = filtered.map(([id, p]) => {
    const st = prospectStatus(p.status || 'new');
    const date = p.addedAt ? new Date(p.addedAt).toLocaleDateString('he-IL',{day:'numeric',month:'short'}) : '';
    return `<tr onclick="openProspectDetail('${id}')" style="cursor:pointer" onmouseenter="this.style.background='#fffbf0'" onmouseleave="this.style.background=''">
      <td style="padding:10px 12px;font-weight:700">${p.lastName || ''} ${p.firstName || ''}</td>
      <td style="padding:10px 12px;font-size:13px;color:#4a5568">${p.age || '—'}</td>
      <td style="padding:10px 12px;font-size:13px;color:#4a5568">${p.school || '—'}</td>
      <td style="padding:10px 12px;font-size:13px;color:#4a5568">${p.instructor || '—'}</td>
      <td style="padding:10px 12px;font-size:13px;color:#4a5568">${p.parentName || '—'}${p.parentPhone?` · <a href="tel:${p.parentPhone}" onclick="event.stopPropagation()" style="color:#2b6cb0">${p.parentPhone}</a>`:''}</td>
      <td style="padding:10px 12px">
        <span style="background:${st.bg};color:${st.color};border-radius:6px;padding:3px 9px;font-size:12px;font-weight:700;white-space:nowrap">${st.label}</span>
      </td>
      <td style="padding:10px 12px;font-size:12px;color:#718096;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.notes || ''}</td>
      <td style="padding:10px 12px;font-size:12px;color:#a0aec0">${date}</td>
    </tr>`;
  }).join('');

  return `<div style="max-width:1000px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
      <div style="font-size:20px;font-weight:800;color:#2d3748">🌟 מצטייני גנים</div>
      <button onclick="openAddProspectModal()" style="background:#c05621;color:white;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">➕ הוסף ילד</button>
    </div>

    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center">
      ${summaryBadges}
      ${filterSchool||filterStatus ? `<button onclick="window._prospectFilterSchool='';window._prospectFilterStatus='';renderProspectsPanel()" style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer;font-family:inherit">✕ נקה סינון</button>` : ''}
    </div>

    ${schools.length > 1 ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
      <span style="font-size:12px;color:#718096;padding:4px 0">בית ספר / גן:</span>
      ${schools.map(s => `<span onclick="window._prospectFilterSchool=window._prospectFilterSchool==='${s.replace(/'/g,"\\'")}' ? '' : '${s.replace(/'/g,"\\'")}';renderProspectsPanel()"
        style="background:${filterSchool===s?'#c05621':'#f7fafc'};color:${filterSchool===s?'white':'#4a5568'};border:1px solid #e2e8f0;border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer">${s}</span>`).join('')}
    </div>` : ''}

    ${filtered.length === 0
      ? `<div style="text-align:center;color:#a0aec0;padding:50px 20px">
          <div style="font-size:36px;margin-bottom:10px">🌟</div>
          <div>${list.length === 0 ? 'לחץ "הוסף ילד" להתחלה' : 'אין תוצאות לסינון הנוכחי'}</div>
        </div>`
      : `<div style="background:white;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
          <div style="padding:8px 16px;background:#fff8f0;border-bottom:1px solid #e2e8f0;font-size:13px;color:#718096">${filtered.length} ילדים</div>
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;font-size:14px;direction:rtl">
              <thead><tr style="background:#edf2f7">
                <th style="padding:9px 12px;text-align:right;font-weight:700;color:#4a5568;font-size:12px">שם</th>
                <th style="padding:9px 12px;text-align:right;font-weight:700;color:#4a5568;font-size:12px">גיל</th>
                <th style="padding:9px 12px;text-align:right;font-weight:700;color:#4a5568;font-size:12px">מוסד</th>
                <th style="padding:9px 12px;text-align:right;font-weight:700;color:#4a5568;font-size:12px">מדריך</th>
                <th style="padding:9px 12px;text-align:right;font-weight:700;color:#4a5568;font-size:12px">הורה</th>
                <th style="padding:9px 12px;text-align:right;font-weight:700;color:#4a5568;font-size:12px">סטטוס</th>
                <th style="padding:9px 12px;text-align:right;font-weight:700;color:#4a5568;font-size:12px">הערות</th>
                <th style="padding:9px 12px;text-align:right;font-weight:700;color:#4a5568;font-size:12px">נוסף</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>`}
  </div>`;
}

function openAddProspectModal(editId = null) {
  const p = editId ? (_prospects[editId] || {}) : {};
  const title = editId ? 'עריכת ילד' : '🌟 הוספת ילד מצטיין';
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:460px">
        <div class="modal-header">
          <span class="modal-title">${title}</span>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:11px">
          <div style="display:flex;gap:10px">
            <div class="modal-field" style="flex:1"><label>שם פרטי <span style="color:#e53e3e">*</span></label>
              <input type="text" id="pr-first" class="modal-input" value="${p.firstName||''}" autofocus></div>
            <div class="modal-field" style="flex:1"><label>שם משפחה <span style="color:#e53e3e">*</span></label>
              <input type="text" id="pr-last" class="modal-input" value="${p.lastName||''}"></div>
          </div>
          <div style="display:flex;gap:10px">
            <div class="modal-field" style="flex:1"><label>גיל <span style="color:#e53e3e">*</span></label>
              <input type="number" id="pr-age" class="modal-input" min="3" max="18" value="${p.age||''}"></div>
            <div class="modal-field" style="flex:2"><label>בית ספר / גן <span style="color:#e53e3e">*</span></label>
              <input type="text" id="pr-school" class="modal-input" value="${p.school||''}"></div>
          </div>
          <div class="modal-field"><label>שם מדריך <span style="color:#e53e3e">*</span></label>
            <input type="text" id="pr-instructor" class="modal-input" value="${p.instructor||''}"></div>
          <div style="display:flex;gap:10px">
            <div class="modal-field" style="flex:1"><label>שם הורה <span style="color:#e53e3e">*</span></label>
              <input type="text" id="pr-parent" class="modal-input" value="${p.parentName||''}"></div>
            <div class="modal-field" style="flex:1"><label>טלפון הורה <span style="color:#e53e3e">*</span></label>
              <input type="tel" id="pr-phone" class="modal-input" value="${p.parentPhone||''}"></div>
          </div>
          <div class="modal-field"><label>הערות</label>
            <textarea id="pr-notes" rows="2" class="modal-input" style="resize:vertical;font-family:inherit">${p.notes||''}</textarea></div>
          <button onclick="saveProspect(${editId?`'${editId}'`:'null'})" style="background:#c05621;color:white;border:none;border-radius:8px;padding:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">✅ ${editId?'שמור שינויים':'הוסף ילד'}</button>
        </div>
      </div>
    </div>`);
}
window.openAddProspectModal = openAddProspectModal;

async function saveProspect(editId) {
  const firstName   = document.getElementById('pr-first')?.value?.trim();
  const lastName    = document.getElementById('pr-last')?.value?.trim();
  const school      = document.getElementById('pr-school')?.value?.trim();
  const ageVal      = document.getElementById('pr-age')?.value?.trim();
  const instructor  = document.getElementById('pr-instructor')?.value?.trim();
  const parentName  = document.getElementById('pr-parent')?.value?.trim();
  const parentPhone = document.getElementById('pr-phone')?.value?.trim();
  if (!firstName)   { showToast('יש להזין שם פרטי', 'error'); document.getElementById('pr-first')?.focus(); return; }
  if (!lastName)    { showToast('יש להזין שם משפחה', 'error'); document.getElementById('pr-last')?.focus(); return; }
  if (!ageVal || isNaN(parseInt(ageVal))) { showToast('יש להזין גיל', 'error'); document.getElementById('pr-age')?.focus(); return; }
  if (!school)      { showToast('יש להזין בית ספר / גן', 'error'); document.getElementById('pr-school')?.focus(); return; }
  if (!instructor)  { showToast('יש להזין שם מדריך', 'error'); document.getElementById('pr-instructor')?.focus(); return; }
  if (!parentName)  { showToast('יש להזין שם הורה', 'error'); document.getElementById('pr-parent')?.focus(); return; }
  if (!parentPhone) { showToast('יש להזין טלפון הורה', 'error'); document.getElementById('pr-phone')?.focus(); return; }
  const data = {
    firstName, lastName, school, instructor, parentName, parentPhone,
    age:   parseInt(ageVal),
    notes: document.getElementById('pr-notes')?.value?.trim() || '',
  };
  try {
    if (editId) {
      await db.ref(`morningProspects/${editId}`).update(data);
      Object.assign(_prospects[editId], data);
    } else {
      data.status = 'new';
      data.addedAt = Date.now();
      const ref = await db.ref('morningProspects').push(data);
      _prospects[ref.key] = data;
    }
    document.querySelector('.friday-modal')?.remove();
    renderProspectsPanel();
    showToast(editId ? 'עודכן ✅' : `${firstName} ${lastName} נוסף ✅`);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.saveProspect = saveProspect;

function openProspectDetail(id) {
  const p = _prospects[id];
  if (!p) return;
  const st = prospectStatus(p.status || 'new');
  const statusBtns = PROSPECT_STATUSES.map(s =>
    `<button onclick="setProspectStatus('${id}','${s.key}')"
      style="background:${p.status===s.key?s.color:'#f7fafc'};color:${p.status===s.key?'white':s.color};border:1px solid ${s.color}55;border-radius:7px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">${s.label}</button>`
  ).join('');

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:480px">
        <div class="modal-header" style="background:linear-gradient(135deg,#c05621,#9c4221)">
          <span class="modal-title">${p.firstName} ${p.lastName}</span>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${p.age?`<div style="background:#fff8f0;border-radius:8px;padding:8px 16px;text-align:center"><div style="font-size:11px;color:#c05621;font-weight:700;margin-bottom:2px">גיל</div><div style="font-size:22px;font-weight:800;color:#c05621">${p.age}</div></div>`:''}
            <div style="background:#fff8f0;border-radius:8px;padding:8px 16px;display:flex;flex-direction:column;justify-content:center"><div style="font-size:12px;color:#718096">מוסד</div><div style="font-weight:700">${p.school}</div>${p.instructor?`<div style="font-size:12px;color:#718096">מדריך: ${p.instructor}</div>`:''}</div>
          </div>
          ${p.parentName||p.parentPhone?`<div class="profile-detail-row"><span class="profile-label">הורה</span><span class="profile-value">${p.parentName||''}${p.parentPhone?` · <a href="tel:${p.parentPhone}" style="color:#2b6cb0">${p.parentPhone}</a>`:''}</span></div>`:''}
          ${p.notes?`<div style="background:#f7fafc;border-radius:8px;padding:10px 14px;font-size:13px;color:#4a5568">${p.notes}</div>`:''}
          <div>
            <div style="font-size:12px;font-weight:700;color:#4a5568;margin-bottom:8px">סטטוס מעקב:</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">${statusBtns}</div>
          </div>
          <div>
            <div style="font-size:12px;font-weight:700;color:#4a5568;margin-bottom:6px">הערות פולואפ:</div>
            <textarea id="prospect-followup-${id}" rows="2" class="modal-input" style="resize:vertical;font-family:inherit;font-size:13px" placeholder="מה קרה, מה סוכם...">${p.followupNotes||''}</textarea>
            <button onclick="saveProspectFollowup('${id}')" style="margin-top:6px;background:#2b6cb0;color:white;border:none;border-radius:7px;padding:7px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">💾 שמור הערה</button>
          </div>
          <div style="display:flex;gap:8px;margin-top:4px">
            <button onclick="this.closest('.modal-overlay').remove();openAddProspectModal('${id}')" style="flex:1;background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">✏️ ערוך פרטים</button>
            <button onclick="deleteProspect('${id}')" style="background:#fff5f5;border:1px solid #fed7d7;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;color:#c53030">🗑</button>
          </div>
        </div>
      </div>
    </div>`);
}
window.openProspectDetail = openProspectDetail;

async function setProspectStatus(id, status) {
  try {
    await db.ref(`morningProspects/${id}/status`).set(status);
    _prospects[id].status = status;
    // Refresh the status buttons in open modal
    const modal = document.querySelector('.friday-modal');
    if (modal) { modal.remove(); openProspectDetail(id); }
    renderProspectsPanel();
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.setProspectStatus = setProspectStatus;

async function saveProspectFollowup(id) {
  const val = document.getElementById(`prospect-followup-${id}`)?.value?.trim() || '';
  try {
    await db.ref(`morningProspects/${id}/followupNotes`).set(val);
    _prospects[id].followupNotes = val;
    showToast('ההערה נשמרה ✅');
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.saveProspectFollowup = saveProspectFollowup;

async function deleteProspect(id) {
  const p = _prospects[id];
  if (!confirm(`למחוק את ${p?.firstName} ${p?.lastName}?`)) return;
  try {
    await db.ref(`morningProspects/${id}`).remove();
    delete _prospects[id];
    document.querySelector('.friday-modal')?.remove();
    renderProspectsPanel();
    showToast('נמחק');
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.deleteProspect = deleteProspect;

// ===== FED PLAYERS REGISTRY =====
let _fedPlayers = {};
let _fedPlayersLastSync = localStorage.getItem('fedPlayersLastSync') || null;

async function loadFedPlayers() {
  if (!db) return;
  try {
    const snap = await db.ref('fedPlayers').get();
    _fedPlayers = snap.val() || {};
    renderFedPlayersPanel();
  } catch(e) { console.error('loadFedPlayers:', e); }
}

async function syncFedPlayersFromSite(silent = false) {
  const btn = document.getElementById('btn-sync-fed-players');
  const statusEl = document.getElementById('fed-sync-status');
  if (btn) { btn.disabled = true; btn.innerHTML = '⏳ מסנכרן...'; }
  if (statusEl) { statusEl.style.color = '#718096'; statusEl.textContent = 'מסנכרן...'; }
  try {
    const res = await fetch('https://chess-manager-7wkr.onrender.com/api/club-players?clubId=31', { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`שגיאת שרת ${res.status}`);
    const list = await res.json();
    if (!list.length) throw new Error('לא נמצאו שחקנים — ייתכן שמבנה הדף השתנה');
    const parsed = {};
    for (const p of list) {
      parsed[p.fedId] = {
        name: p.name, fedId: p.fedId,
        rating: p.rating, birthYear: p.birthYear,
        cardExpiry: _fedPlayers[p.fedId]?.cardExpiry || null,
        lastSync: Date.now()
      };
    }
    const count = list.length;
    if (db) { await db.ref('fedPlayers').set(parsed); _fedPlayers = parsed; }
    localStorage.setItem('fedPlayersLastSync', String(Date.now()));
    _fedPlayersLastSync = String(Date.now());
    if (statusEl) { statusEl.style.color = '#276749'; statusEl.textContent = `✅ ${count} שחקנים`; }
    if (!silent) showToast(`✅ סונכרנו ${count} שחקני מועדון`);
    renderFedPlayersPanel();
  } catch(e) {
    if (statusEl) { statusEl.style.color = '#e53e3e'; statusEl.textContent = `❌ ${e.message}`; }
    if (!silent) showToast(`❌ ${e.message}`, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '🔄 סנכרן מהאיגוד'; }
  }
}
window.syncFedPlayersFromSite = syncFedPlayersFromSite;

function getFedPlayerGroupInfo(fedId) {
  const numId = parseInt(fedId);
  for (const g of groups) {
    for (const sg of g.subGroups) {
      const found = sg.players.find(p => p.fedId === numId && !p.hidden);
      if (found) return { groupName: g.name, subGroupName: sg.time || '' };
    }
  }
  return null;
}

function renderFedPlayersPanel() {
  const el = document.getElementById('panel-fed-players');
  if (el) el.innerHTML = buildFedPlayersHTML();
}

function buildFedPlayersHTML() {
  const currentYear = new Date().getFullYear();
  const list = Object.entries(_fedPlayers).sort((a,b) => (b[1].rating||0) - (a[1].rating||0));
  const syncDate = _fedPlayersLastSync
    ? new Date(parseInt(_fedPlayersLastSync)).toLocaleDateString('he-IL',{day:'numeric',month:'long',year:'numeric'})
    : 'טרם סונכרן';

  const cardStatus = (expiry) => {
    if (!expiry) return { dot: '⚪', label: '—', color: '#a0aec0' };
    const daysLeft = Math.floor((new Date(expiry) - new Date()) / 86400000);
    if (daysLeft < 0) return { dot: '🔴', label: 'פג תוקף', color: '#e53e3e' };
    if (daysLeft < 60) return { dot: '🟡', label: `${daysLeft} ימים`, color: '#b7791f' };
    return { dot: '🟢', label: formatDate(expiry), color: '#276749' };
  };

  const rows = list.map(([fedId, p]) => {
    const groupInfo = getFedPlayerGroupInfo(fedId);
    const age = p.birthYear ? currentYear - p.birthYear : null;
    const card = cardStatus(p.cardExpiry);
    return `<tr onclick="openFedPlayerDetail('${fedId}')" style="cursor:pointer" onmouseenter="this.style.background='#f7fafc'" onmouseleave="this.style.background=''">
      <td style="padding:9px 12px;font-weight:600">${p.name}</td>
      <td style="padding:9px 12px;font-size:13px"><a href="https://www.chess.org.il/Players/Player.aspx?Id=${fedId}" target="_blank" onclick="event.stopPropagation()" style="color:#2b6cb0">${fedId}</a></td>
      <td style="padding:9px 12px;font-size:14px;font-weight:700;color:#2d3748">${p.rating || '—'}</td>
      <td style="padding:9px 12px;font-size:13px;color:#4a5568">${age !== null ? age : '—'}</td>
      <td style="padding:9px 12px;font-size:13px;color:${card.color}">${card.dot} ${card.label}</td>
      <td style="padding:9px 12px;font-size:13px;color:${groupInfo?'#276749':'#a0aec0'}">${groupInfo ? `${groupInfo.groupName}${groupInfo.subGroupName?' · '+groupInfo.subGroupName:''}` : '—'}</td>
    </tr>`;
  }).join('');

  const inGroup = list.filter(([fid]) => getFedPlayerGroupInfo(fid)).length;

  return `<div style="max-width:900px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <div style="font-size:20px;font-weight:800;color:#2d3748">👥 שחקני מועדון</div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <span id="fed-sync-status" style="font-size:12px;color:#718096">עדכון: ${syncDate}</span>
        <button id="btn-sync-fed-players" onclick="syncFedPlayersFromSite()" style="background:#553c9a;color:white;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">🔄 סנכרן מהאיגוד</button>
      </div>
    </div>
    ${list.length === 0
      ? `<div style="text-align:center;color:#a0aec0;padding:60px 20px">
          <div style="font-size:40px;margin-bottom:12px">👥</div>
          <div style="font-size:15px">לחץ "סנכרן מהאיגוד" לטעינת רשימת שחקני המועדון</div>
        </div>`
      : `<div style="background:white;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
          <div style="padding:10px 16px;background:#f3f0ff;border-bottom:1px solid #e2e8f0;display:flex;gap:20px;font-size:13px">
            <span style="font-weight:700;color:#553c9a">${list.length} שחקנים</span>
            <span style="color:#276749">✅ ${inGroup} בחוגים</span>
            <span style="color:#718096">— ${list.length - inGroup} ללא חוג</span>
          </div>
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;font-size:14px;direction:rtl">
              <thead><tr style="background:#edf2f7">
                <th style="padding:9px 12px;text-align:right;font-weight:700;color:#4a5568;font-size:12px">שם</th>
                <th style="padding:9px 12px;text-align:right;font-weight:700;color:#4a5568;font-size:12px">מספר</th>
                <th style="padding:9px 12px;text-align:right;font-weight:700;color:#4a5568;font-size:12px">מד כושר</th>
                <th style="padding:9px 12px;text-align:right;font-weight:700;color:#4a5568;font-size:12px">גיל</th>
                <th style="padding:9px 12px;text-align:right;font-weight:700;color:#4a5568;font-size:12px">כרטיס</th>
                <th style="padding:9px 12px;text-align:right;font-weight:700;color:#4a5568;font-size:12px">חוג</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>`}
  </div>`;
}

function openFedPlayerDetail(fedId) {
  const p = _fedPlayers[fedId];
  if (!p) return;
  const groupInfo = getFedPlayerGroupInfo(fedId);
  const currentYear = new Date().getFullYear();
  const age = p.birthYear ? currentYear - p.birthYear : null;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:440px">
        <div class="modal-header">
          <span class="modal-title">👤 ${p.name}</span>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${p.rating?`<div style="background:#f3f0ff;border-radius:8px;padding:10px 18px;text-align:center"><div style="font-size:11px;color:#553c9a;font-weight:700;margin-bottom:2px">מד כושר</div><div style="font-size:22px;font-weight:800;color:#553c9a">${p.rating}</div></div>`:''}
            ${age!==null?`<div style="background:#f0fff4;border-radius:8px;padding:10px 18px;text-align:center"><div style="font-size:11px;color:#276749;font-weight:700;margin-bottom:2px">גיל</div><div style="font-size:22px;font-weight:800;color:#276749">${age}</div></div>`:''}
          </div>
          <div class="profile-detail-row"><span class="profile-label">מספר איגוד</span><span class="profile-value"><a href="https://www.chess.org.il/Players/Player.aspx?Id=${fedId}" target="_blank" style="color:#2b6cb0">${fedId}</a></span></div>
          ${p.birthYear?`<div class="profile-detail-row"><span class="profile-label">שנת לידה</span><span class="profile-value">${p.birthYear}</span></div>`:''}
          ${p.cardExpiry?`<div class="profile-detail-row"><span class="profile-label">תוקף כרטיס</span><span class="profile-value">${formatDate(p.cardExpiry)}</span></div>`:''}
          ${groupInfo?`<div class="profile-detail-row"><span class="profile-label">חוג</span><span class="profile-value" style="color:#276749">${groupInfo.groupName}${groupInfo.subGroupName?' · '+groupInfo.subGroupName:''}</span></div>`:''}
          <button onclick="syncOneFedPlayer('${fedId}');this.disabled=true;this.textContent='⏳ מעדכן...'" style="margin-top:6px;background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:9px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">🔄 עדכן פרטים מהאיגוד</button>
        </div>
      </div>
    </div>`);
}
window.openFedPlayerDetail = openFedPlayerDetail;

async function syncOneFedPlayer(fedId) {
  try {
    const url = `https://www.chess.org.il/Players/Player.aspx?Id=${fedId}`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    if (html.includes('Runtime Error') || html.includes('Object reference not set')) throw new Error('שחקן לא נמצא');
    const ratingMatch = html.match(/מד כושר ישראלי<span>:\s*(\d+)<\/span>/);
    const expiryMatch = html.match(/תוקף כרטיס שחמטאי<span>\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*<\/span>/);
    const birthMatch  = html.match(/שנת לידה[\s\S]{0,300}<span[^>]*>\s*(\d{4})\s*<\/span>/);
    const updates = { lastSync: Date.now() };
    if (ratingMatch) updates.rating = parseInt(ratingMatch[1]);
    if (expiryMatch) updates.cardExpiry = `${expiryMatch[3]}-${expiryMatch[2].padStart(2,'0')}-${expiryMatch[1].padStart(2,'0')}`;
    if (birthMatch)  updates.birthYear = parseInt(birthMatch[1]);
    Object.assign(_fedPlayers[fedId], updates);
    if (db) await db.ref(`fedPlayers/${fedId}`).update(updates);
    document.querySelector('.friday-modal')?.remove();
    renderFedPlayersPanel();
    showToast(`✅ ${_fedPlayers[fedId].name} עודכן`);
  } catch(e) { showToast(`❌ ${e.message}`, 'error'); }
}
window.syncOneFedPlayer = syncOneFedPlayer;

function showToast(msg) {
  let t = document.getElementById('toast-msg');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast-msg';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#2d3748;color:white;padding:10px 22px;border-radius:10px;font-size:14px;font-weight:600;z-index:999;box-shadow:0 4px 14px rgba(0,0,0,0.25);transition:opacity .3s';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; }, 2500);
}

async function initData() {
  // loadPlayerOverrides/loadHiddenPlayers/loadPayments/loadParentContacts index into
  // sg.players[idx] by position, so loadExtraPlayers (which pushes those players) must
  // finish first. Everything else here is independent and can run in parallel.
  await loadExtraPlayers();
  await Promise.all([
    loadSettings(),
    loadTeamPlayers(),
    loadCampPlayers(),
    loadPlayerOverrides(),
    loadHiddenPlayers(),
    loadPayments(),
    loadParentContacts(),
    loadGroupNames(),
    loadVacations(),
  ]);
  renderPlayerList({});
  loadAttendanceFromFirebase();
  loadTournaments();
  loadFedPlayers();
  loadProspects();
  // refresh dashboard after data loaded
  const hp = document.getElementById('panel-home');
  if (hp) hp.innerHTML = renderDashboard();
  // Load weekly attendance alerts async and update dashboard again
  loadWeeklyAttendanceAlerts().then(missingAtt => {
    const hp2 = document.getElementById('panel-home');
    if (hp2) hp2.innerHTML = renderDashboard(missingAtt);
  });
}

initAuth();

// Global error catcher — helps diagnose crashes
window.addEventListener('error', (e) => {
  if (!currentUser || currentUser.role !== 'admin') return;
  const msg = `שגיאה: ${e.message}\nבשורה: ${e.lineno}\nבקובץ: ${(e.filename||'').split('/').pop()}`;
  const existing = document.getElementById('_dbg_err');
  if (existing) { existing.textContent = msg; return; }
  const div = document.createElement('div');
  div.id = '_dbg_err';
  div.style.cssText = 'position:fixed;bottom:16px;left:16px;background:#c53030;color:white;padding:12px 16px;border-radius:10px;font-size:12px;font-family:monospace;z-index:9999;max-width:420px;white-space:pre-wrap;cursor:pointer';
  div.textContent = msg;
  div.title = 'לחץ להעתיק';
  div.onclick = () => { navigator.clipboard?.writeText(msg); div.style.background='#276749'; div.textContent='✅ הועתק'; setTimeout(()=>div.remove(),2000); };
  document.body.appendChild(div);
  setTimeout(() => div?.remove(), 15000);
});


// ===== NEWS POSTS =====
let _newsPosts = [], _newsIdx = 0, _newsTimer = null;

async function loadNewsCarousel() {
  if (!db) return;
  try {
    const snap = await db.ref('newsPosts').get();
    _newsPosts = [];
    if (snap.exists()) snap.forEach(c => { const v = c.val(); if (v.active !== false) _newsPosts.push({id: c.key, ...v}); });
    _newsPosts.sort((a,b) => (a.order||99) - (b.order||99));
    const sec = document.getElementById('news-section');
    if (_newsPosts.length) { renderNewsCarousel(); if (sec) sec.style.display = ''; }
    else if (sec) sec.style.display = 'none';
  } catch(e) { console.error('loadNewsCarousel:', e); }
}
window.loadNewsCarousel = loadNewsCarousel;

function renderNewsCarousel() {
  const inner = document.getElementById('news-inner');
  const dotsEl = document.getElementById('news-dots');
  if (!inner) return;
  inner.innerHTML = _newsPosts.map((p,i) => {
    const img = p.imageData
      ? `<img class="news-card-img" src="${p.imageData}" alt="">`
      : `<div class="news-card-no-img">📰</div>`;
    const date  = p.date  ? `<div class="news-card-date">${p.date}</div>` : '';
    const title = p.title ? `<div class="news-card-title">${p.title}</div>` : '';
    const body  = p.body  ? `<div class="news-card-text">${(p.body).replace(/\n/g,'<br>')}</div>` : '';
    const linkAttr = p.link ? ('data-link="' + p.link + '" style="cursor:pointer"') : '';
    const fbBadge  = p.link ? `<div style="margin-top:12px;font-size:13px;color:#4267B2;font-weight:600">&#x1F4D8; קרא עוד בפייסבוק &#x2197;</div>` : '';
    const clickAttr = p.link ? 'onclick="newsCardClick(this)"' : '';
    return `<div class="news-slide"><div class="news-card" ${linkAttr} ${clickAttr}>${img}<div class="news-card-body">${date}${title}${body}${fbBadge}</div></div></div>`;
  }).join('');
  if (dotsEl) dotsEl.innerHTML = _newsPosts.map((_,i) =>
    `<button class="news-dot${i===0?' active':''}" onclick="newsGoTo(${i})"></button>`).join('');
  newsGoTo(0);
  startNewsTimer();
}

function newsGoTo(i) {
  _newsIdx = ((i % _newsPosts.length) + _newsPosts.length) % _newsPosts.length;
  const inner = document.getElementById('news-inner');
  if (inner) inner.style.transform = `translateX(${_newsIdx * -100}%)`;
  document.querySelectorAll('.news-dot').forEach((d,j) => d.classList.toggle('active', j === _newsIdx));
}
window.newsGoTo = newsGoTo;
window.newsNav  = dir => { newsGoTo(_newsIdx + dir); restartNewsTimer(); };

function startNewsTimer()   { clearInterval(_newsTimer); if (_newsPosts.length > 1) _newsTimer = setInterval(() => newsGoTo(_newsIdx + 1), 5000); }
function restartNewsTimer() { startNewsTimer(); }
window.newsCardClick = function(el) { const lnk = el.getAttribute('data-link'); if (lnk) window.open(lnk, '_blank'); };

function compressImage(file, maxW=900, q=0.82) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(1, maxW / img.width);
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * ratio); c.height = Math.round(img.height * ratio);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', q));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function loadNewsAdmin() {
  const el = document.getElementById('news-admin-container');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:30px;opacity:.5">⏳ טוען...</div>';
  let posts = [];
  try {
    const snap = await db.ref('newsPosts').get();
    if (snap.exists()) snap.forEach(c => { posts.push({id: c.key, ...c.val()}); });
    posts.sort((a,b) => (a.order||99) - (b.order||99));
  } catch(e) {
    el.innerHTML = `<div style="text-align:center;padding:30px;color:#fc8181">❌ שגיאה: ${e.message}</div>`;
    return;
  }
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px">
      <h3 style="margin:0;font-size:18px">📰 ניהול כתבות</h3>
      <button onclick="openNewsModal(null)" style="background:#f97316;color:white;border:none;border-radius:8px;padding:9px 18px;cursor:pointer;font-weight:700;font-size:14px">+ כתבה חדשה</button>
    </div>
    ${posts.length === 0
      ? '<div style="text-align:center;padding:40px;opacity:.5">אין כתבות עדיין. צור כתבה ראשונה!</div>'
      : posts.map(p => `
      <div style="display:flex;gap:14px;align-items:center;padding:14px;background:var(--bg-card);border-radius:12px;margin-bottom:10px">
        ${p.imageData
          ? `<img src="${p.imageData}" style="width:80px;height:54px;object-fit:cover;border-radius:8px;flex-shrink:0">`
          : `<div style="width:80px;height:54px;background:rgba(255,255,255,.08);border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px">📰</div>`}
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.title||'(ללא כותרת)'}</div>
          <div style="font-size:12px;opacity:.55">${p.date||''} · ${p.active===false ? '<span style="color:#fc8181">מוסתר</span>' : '<span style="color:#68d391">פעיל</span>'}</div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0">
          <button onclick="openNewsModal('${p.id}')" style="background:rgba(255,255,255,.1);border:none;border-radius:8px;padding:7px 12px;cursor:pointer;color:inherit;font-size:13px">✏️</button>
          <button onclick="deleteNewsPost('${p.id}')" style="background:rgba(252,129,129,.15);border:none;border-radius:8px;padding:7px 12px;cursor:pointer;color:#fc8181;font-size:13px">🗑️</button>
        </div>
      </div>`).join('')}`;
}
window.loadNewsAdmin = loadNewsAdmin;

window.openNewsModal = async function(postId) {
  let post = {};
  if (postId) { const s = await db.ref('newsPosts/'+postId).get(); if (s.exists()) post = s.val(); }
  const existImg = post.imageData || '';
  const modal = document.createElement('div');
  modal.className = 'modal-overlay open'; modal.style.cssText = 'z-index:9999;padding:20px';
  modal.onclick = e => { if (e.target===modal) modal.remove(); };
  modal.innerHTML = `
    <div style="background:var(--bg-card);border-radius:16px;max-width:580px;width:100%;padding:28px;direction:rtl;max-height:90vh;overflow-y:auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px">
        <h3 style="margin:0">${postId ? 'עריכת כתבה' : 'כתבה חדשה'}</h3>
        <button onclick="this.closest('.modal-overlay').remove()" style="background:none;border:none;font-size:22px;cursor:pointer;color:inherit">✕</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div><label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">כותרת</label>
          <input id="nm-title" value="${(post.title||'').replace(/"/g,'&quot;')}" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;box-sizing:border-box"></div>
        <div><label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">תאריך</label>
          <input id="nm-date" type="date" value="${post.date||''}" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;box-sizing:border-box"></div>
        <div><label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">תוכן הכתבה</label>
          <textarea id="nm-body" rows="7" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;resize:vertical;box-sizing:border-box">${post.body||''}</textarea></div>
        <div><label style="display:block;font-size:13px;font-weight:600;margin-bottom:8px">תמונה</label>
          <div id="nm-img-wrap" style="margin-bottom:10px">
            ${existImg ? `<img src="${existImg}" style="width:100%;height:180px;object-fit:cover;border-radius:10px">` : `<div style="height:100px;background:rgba(255,255,255,.06);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:36px">📷</div>`}
          </div>
          <input type="file" accept="image/*" onchange="previewNewsImg(this)" style="font-size:13px;color:inherit">
          <input type="hidden" id="nm-img-new" value="">
          <input type="hidden" id="nm-img-keep" value="${existImg ? '1' : ''}"></div>
        <div style="display:flex;align-items:center;gap:10px">
          <input type="checkbox" id="nm-active" ${post.active===false?'':'checked'} style="width:16px;height:16px">
          <label for="nm-active" style="font-size:14px;cursor:pointer">כתבה פעילה (מוצגת בדף הבית)</label></div>
        <div><label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">סדר הצגה (0 = ראשון)</label>
          <input id="nm-order" type="number" value="${post.order||0}" min="0" style="width:80px;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px"></div>
        <div><label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">&#x1F517; קישור לפייסבוק (אופציונלי)</label>
          <input id="nm-link" value="${(post.link||'').replace(/"/g,'&quot;')}" placeholder="https://www.facebook.com/..." style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;box-sizing:border-box"></div>
      </div>
      <div style="display:flex;gap:12px;margin-top:26px;justify-content:flex-end">
        <button onclick="this.closest('.modal-overlay').remove()" style="background:rgba(255,255,255,.1);border:none;border-radius:8px;padding:10px 20px;cursor:pointer;color:inherit;font-size:14px">ביטול</button>
        <button onclick="saveNewsPost('${postId||''}')" style="background:#f97316;color:white;border:none;border-radius:8px;padding:10px 22px;cursor:pointer;font-weight:700;font-size:14px">💾 שמור</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
};

window.previewNewsImg = async function(input) {
  if (!input.files[0]) return;
  const dataUrl = await compressImage(input.files[0]);
  document.getElementById('nm-img-new').value = dataUrl;
  document.getElementById('nm-img-keep').value = '';
  const wrap = document.getElementById('nm-img-wrap');
  if (wrap) wrap.innerHTML = `<img src="${dataUrl}" style="width:100%;height:180px;object-fit:cover;border-radius:10px">`;
};

window.saveNewsPost = async function(postId) {
  const title  = (document.getElementById('nm-title').value||'').trim();
  const date   = document.getElementById('nm-date').value;
  const body   = (document.getElementById('nm-body').value||'').trim();
  const imgNew = document.getElementById('nm-img-new').value;
  const imgKeep= document.getElementById('nm-img-keep').value;
  const active = document.getElementById('nm-active').checked;
  const order  = parseInt(document.getElementById('nm-order').value)||0;
  const link   = (document.getElementById('nm-link')?.value||'').trim();
  const data   = { title, date, body, active, order, updatedAt: Date.now() };
  if (link) data.link = link; else data.link = null;
  if (imgNew)       data.imageData = imgNew;
  else if (imgKeep && postId) { const s = await db.ref('newsPosts/'+postId+'/imageData').get(); if (s.exists()) data.imageData = s.val(); }
  try {
    if (postId) await db.ref('newsPosts/'+postId).update(data);
    else { data.createdAt = Date.now(); await db.ref('newsPosts').push(data); }
    document.querySelector('.modal-overlay.open')?.remove();
    loadNewsAdmin(); loadNewsCarousel();
    showToast('✅ הכתבה נשמרה!');
  } catch(e) { showToast('❌ שגיאה: ' + e.message); }
};

window.deleteNewsPost = async function(postId) {
  if (!confirm('למחוק את הכתבה לצמיתות?')) return;
  try {
    await db.ref('newsPosts/'+postId).remove();
    loadNewsAdmin(); loadNewsCarousel();
    showToast('🗑️ הכתבה נמחקה');
  } catch(e) { showToast('❌ שגיאה: ' + e.message); }
};
// ===== CLUB PEOPLE =====
let _allPeople = [], _peopleTab = 'management', _adminPeople = [];

async function loadPeopleSection() {
  const grid = document.getElementById('people-cards-grid');
  if (!grid) return;
  grid.innerHTML = '<div style="text-align:center;padding:40px;opacity:.5;grid-column:1/-1">טוען...</div>';
  try {
    const snap = await db.ref('clubPeople').get();
    _allPeople = [];
    if (snap.exists()) snap.forEach(c => { _allPeople.push({id: c.key, ...c.val()}); });
    _allPeople.sort((a,b) => (a.order??99) - (b.order??99));
    renderPeopleCards(_peopleTab);
  } catch(e) { grid.innerHTML = '<div style="text-align:center;padding:40px;color:#fc8181;grid-column:1/-1">שגיאה בטעינה</div>'; }
}
window.loadPeopleSection = loadPeopleSection;

function renderPeopleCards(cat) {
  const grid = document.getElementById('people-cards-grid');
  if (!grid) return;
  const filtered = _allPeople.filter(p => p.category === cat);
  if (!filtered.length) {
    grid.innerHTML = '<div style="text-align:center;padding:40px;opacity:.5;grid-column:1/-1">אין אנשים בקטגוריה זו עדיין</div>';
    return;
  }
  grid.innerHTML = filtered.map(p => {
    const photo = p.photoData
      ? `<img class="person-photo" src="${p.photoData}" alt="${p.name||''}">`
      : `<div class="person-photo-placeholder">👤</div>`;
    return `<div class="person-card">
      <div class="person-photo-wrap">${photo}</div>
      <div class="person-name">${p.name||''}</div>
      <div class="person-role">${p.role||''}</div>
      ${p.bio ? `<div class="person-bio">${p.bio}</div>` : ''}
    </div>`;
  }).join('');
}

window.switchPeopleTab = function(cat) {
  _peopleTab = cat;
  document.querySelectorAll('.people-subtab').forEach(b => b.classList.toggle('active', b.getAttribute('onclick').includes("'"+cat+"'")));
  renderPeopleCards(cat);
};

// ---- Admin ----
window.loadPeopleAdmin = async function() {
  const el = document.getElementById('people-admin-container');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:30px;opacity:.5">⏳ טוען...</div>';
  let people = [];
  try {
    const snap = await db.ref('clubPeople').get();
    if (snap.exists()) snap.forEach(c => { people.push({id:c.key,...c.val()}); });
    people.sort((a,b)=>(a.order??0)-(b.order??0));
  } catch(e) { el.innerHTML = '<div style="color:#fc8181">שגיאה: '+e.message+'</div>'; return; }

  const cats = [
    { key: 'management', label: '🏛️ חברי הנהלה' },
    { key: 'instructors', label: '♟️ מדריכים' },
    { key: 'staff',       label: '⭐ בעלי תפקידים' },
  ];

  // Heal legacy/gappy order values into clean sequential order per category,
  // so move-up/move-down always has distinct adjacent values to swap.
  const updates = {};
  cats.forEach(cat => {
    people.filter(p => p.category === cat.key).forEach((p, i) => {
      if (p.order !== i) { p.order = i; updates['clubPeople/'+p.id+'/order'] = i; }
    });
  });
  if (Object.keys(updates).length) { try { await db.ref().update(updates); } catch(e) { console.warn('order heal failed:', e); } }
  _adminPeople = people;

  const personRow = (p, posInCat, catLen) => `
    <div style="display:flex;align-items:center;gap:14px;padding:12px 14px;border-radius:10px;background:var(--bg-subtle);margin-bottom:8px;direction:rtl">
      <div style="display:flex;flex-direction:column;gap:2px">
        <button onclick="movePerson('${p.id}','${p.category}','up')" ${posInCat===0?'disabled':''} style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;width:26px;height:22px;cursor:${posInCat===0?'default':'pointer'};opacity:${posInCat===0?'.3':'1'};color:inherit;font-size:11px;line-height:1">▲</button>
        <button onclick="movePerson('${p.id}','${p.category}','down')" ${posInCat===catLen-1?'disabled':''} style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;width:26px;height:22px;cursor:${posInCat===catLen-1?'default':'pointer'};opacity:${posInCat===catLen-1?'.3':'1'};color:inherit;font-size:11px;line-height:1">▼</button>
      </div>
      <div style="width:48px;height:48px;border-radius:50%;overflow:hidden;flex-shrink:0;background:var(--border)">
        ${p.photoData?`<img src="${p.photoData}" style="width:100%;height:100%;object-fit:cover">`:'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:22px">👤</div>'}
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;color:var(--text-primary)">${p.name||''}</div>
        <div style="font-size:12px;color:#f97316">${p.role||''}</div>
      </div>
      <div style="display:flex;gap:8px">
        <button onclick="openPersonModal('${p.id}')" style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:7px 12px;cursor:pointer;color:inherit;font-size:13px">✏️</button>
        <button onclick="deletePerson('${p.id}')" style="background:rgba(252,129,129,.15);border:none;border-radius:8px;padding:7px 12px;cursor:pointer;color:#fc8181;font-size:13px">🗑️</button>
      </div>
    </div>`;

  const sectionsHtml = cats.map(cat => {
    const group = people.filter(p => p.category === cat.key);
    return `
      <div style="margin-bottom:32px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border)">
          <h4 style="margin:0;font-size:16px;font-weight:800;color:var(--text-primary)">${cat.label}</h4>
          <button onclick="openPersonModal(null,'${cat.key}')" style="background:#f97316;color:white;border:none;border-radius:8px;padding:6px 14px;cursor:pointer;font-weight:700;font-size:13px">+ הוסף</button>
        </div>
        ${group.length===0
          ? `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px">אין אנשים בקטגוריה זו</div>`
          : group.map((p,i) => personRow(p, i, group.length)).join('')}
      </div>`;
  }).join('');

  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:10px">
      <h3 style="margin:0;font-size:18px;color:var(--text-primary)">👥 ניהול אנשי המועדון</h3>
    </div>
    ${sectionsHtml}`;
};

window.movePerson = async function(personId, cat, direction) {
  const group = _adminPeople.filter(p => p.category === cat).sort((a,b) => (a.order??0)-(b.order??0));
  const idx = group.findIndex(p => p.id === personId);
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= group.length) return;
  const a = group[idx], b = group[swapIdx];
  try {
    await db.ref().update({
      ['clubPeople/'+a.id+'/order']: b.order,
      ['clubPeople/'+b.id+'/order']: a.order,
    });
    loadPeopleAdmin();
  } catch(e) { showToast('❌ שגיאה: '+e.message); }
};

window.openPersonModal = async function(personId, defaultCat) {
  let person = {};
  if (personId) { const s = await db.ref('clubPeople/'+personId).get(); if (s.exists()) person = s.val(); }
  if (!personId && defaultCat && !person.category) person.category = defaultCat;
  const existPhoto = person.photoData || '';
  const modal = document.createElement('div');
  modal.className = 'modal-overlay open'; modal.style.cssText = 'z-index:9999;padding:20px';
  modal.onclick = e => { if (e.target===modal) modal.remove(); };
  modal.innerHTML = `
    <div style="background:var(--bg-card);border-radius:16px;max-width:560px;width:100%;padding:28px;direction:rtl;max-height:90vh;overflow-y:auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px">
        <h3 style="margin:0">${personId?'עריכת איש מועדון':'הוספת איש מועדון'}</h3>
        <button onclick="this.closest('.modal-overlay').remove()" style="background:none;border:none;font-size:22px;cursor:pointer;color:inherit">✕</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div><label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">שם מלא</label>
          <input id="pm-name" value="${(person.name||'').replace(/"/g,'&quot;')}" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;box-sizing:border-box"></div>
        <div><label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">תפקיד</label>
          <input id="pm-role" value="${(person.role||'').replace(/"/g,'&quot;')}" placeholder="לדוגמה: יו&quot;ר המועדון" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;box-sizing:border-box"></div>
        <div><label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">קטגוריה</label>
          <select id="pm-cat" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:var(--bg-card);color:inherit;font-family:inherit;font-size:14px">
            <option value="management" ${person.category==='management'?'selected':''}>🏛️ חברי הנהלה</option>
            <option value="staff" ${person.category==='staff'?'selected':''}>⭐ בעלי תפקידים</option>
            <option value="instructors" ${person.category==='instructors'?'selected':''}>♟️ מדריכים</option>
          </select></div>
        <div><label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">תיאור קצר / ביוגרפיה</label>
          <textarea id="pm-bio" rows="4" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;resize:vertical;box-sizing:border-box">${person.bio||''}</textarea></div>
        <div><label style="display:block;font-size:13px;font-weight:600;margin-bottom:8px">תמונה</label>
          <div id="pm-img-wrap" style="margin-bottom:10px">
            ${existPhoto?`<img src="${existPhoto}" style="width:96px;height:96px;object-fit:cover;border-radius:50%">`:`<div style="width:96px;height:96px;border-radius:50%;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center;font-size:36px">👤</div>`}
          </div>
          <input type="file" accept="image/*" onchange="previewPersonImg(this)" style="font-size:13px;color:inherit">
          <input type="hidden" id="pm-img-new" value="">
          <input type="hidden" id="pm-img-keep" value="${existPhoto?'1':''}"></div>
      </div>
      <div style="display:flex;gap:12px;margin-top:26px;justify-content:flex-end">
        <button onclick="this.closest('.modal-overlay').remove()" style="background:rgba(255,255,255,.1);border:none;border-radius:8px;padding:10px 20px;cursor:pointer;color:inherit;font-size:14px">ביטול</button>
        <button onclick="savePersonData('${personId||''}')" style="background:#f97316;color:white;border:none;border-radius:8px;padding:10px 22px;cursor:pointer;font-weight:700;font-size:14px">💾 שמור</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
};

window.previewPersonImg = async function(input) {
  if (!input.files[0]) return;
  const dataUrl = await compressImage(input.files[0]);
  document.getElementById('pm-img-new').value = dataUrl;
  document.getElementById('pm-img-keep').value = '';
  const wrap = document.getElementById('pm-img-wrap');
  if (wrap) wrap.innerHTML = `<img src="${dataUrl}" style="width:96px;height:96px;object-fit:cover;border-radius:50%">`;
};

window.savePersonData = async function(personId) {
  const name  = (document.getElementById('pm-name').value||'').trim();
  const role  = (document.getElementById('pm-role').value||'').trim();
  const cat   = document.getElementById('pm-cat').value;
  const bio   = (document.getElementById('pm-bio').value||'').trim();
  const imgNew  = document.getElementById('pm-img-new').value;
  const imgKeep = document.getElementById('pm-img-keep').value;
  if (!name) { showToast('⚠️ יש להזין שם'); return; }
  const data = { name, role, category: cat, bio, updatedAt: Date.now() };
  if (imgNew) data.photoData = imgNew;
  else if (imgKeep && personId) { const s = await db.ref('clubPeople/'+personId+'/photoData').get(); if (s.exists()) data.photoData = s.val(); }
  try {
    if (personId) {
      await db.ref('clubPeople/'+personId).update(data);
    } else {
      // New person: append to the end of their category's order instead of asking for a number.
      const snap = await db.ref('clubPeople').get();
      let maxOrder = -1;
      if (snap.exists()) snap.forEach(c => { if (c.val().category === cat && (c.val().order??0) > maxOrder) maxOrder = c.val().order??0; });
      data.order = maxOrder + 1;
      data.createdAt = Date.now();
      await db.ref('clubPeople').push(data);
    }
    document.querySelector('.modal-overlay.open')?.remove();
    loadPeopleAdmin();
    showToast('✅ נשמר!');
  } catch(e) { showToast('❌ שגיאה: '+e.message); }
};

window.deletePerson = async function(personId) {
  if (!confirm('למחוק לצמיתות?')) return;
  try {
    await db.ref('clubPeople/'+personId).remove();
    loadPeopleAdmin();
    showToast('🗑️ נמחק');
  } catch(e) { showToast('❌ שגיאה: '+e.message); }
};
// ===== SITE CONTENT CMS =====
async function loadSiteContent() {
  if (!db) return;
  try {
    const snap = await db.ref('siteContent').get();
    if (!snap.exists()) return;
    const d = snap.val();
    if (d.about) renderAboutContent(d.about);
    if (d.achievements) renderAchievementsContent(d.achievements);
    if (d.testimonials) renderTestimonialsContent(d.testimonials);
    if (d.gallery) renderGalleryContent(d.gallery);
  } catch(e) { console.warn('loadSiteContent:', e); }
}
window.loadSiteContent = loadSiteContent;

function renderAboutContent(data) {
  const el = document.getElementById('home-about-text');
  if (!el) return;
  const h3 = el.querySelector('h3');
  const links = el.nextElementSibling;
  el.innerHTML = '';
  if (h3) el.appendChild(h3);
  (data.paragraphs || []).forEach(function(p) {
    if (!p) return;
    const tag = document.createElement('p');
    tag.innerHTML = p;
    el.appendChild(tag);
  });
  if (links) el.parentElement.appendChild(links);
}

function renderAchievementsContent(data) {
  const el = document.getElementById('home-achievements-grid');
  if (!el) return;
  const items = Object.values(data).filter(function(a){ return a.active !== false; });
  items.sort(function(a,b){ return (a.order||99)-(b.order||99); });
  el.innerHTML = items.map(function(a) {
    return '<div class="ach-card">' +
      '<div class="ach-icon">' + (a.icon||'🏆') + '</div>' +
      '<div class="ach-num">' + (a.num||'') + '</div>' +
      '<div class="ach-label">' + (a.label||'') + '</div>' +
      '<div class="ach-desc">' + (a.desc||'') + '</div>' +
      '</div>';
  }).join('');
}

function renderTestimonialsContent(data) {
  const el = document.getElementById('home-testimonials-grid');
  if (!el) return;
  const items = Object.values(data).filter(function(t){ return t.active !== false; });
  items.sort(function(a,b){ return (a.order||99)-(b.order||99); });
  el.innerHTML = items.map(function(t) {
    const initial = (t.name||'?').charAt(0);
    return '<div class="testimonial-card">' +
      '<div class="testimonial-quote">“</div>' +
      '<div class="testimonial-text">' + (t.text||'') + '</div>' +
      '<div class="testimonial-author">' +
        '<div class="testimonial-avatar">' + initial + '</div>' +
        '<div><div class="testimonial-name">' + (t.name||'') + '</div>' +
        '<div class="testimonial-role">' + (t.role||'') + '</div></div>' +
      '</div></div>';
  }).join('');
}

function renderGalleryContent(data) {
  const el = document.getElementById('home-gallery-grid');
  if (!el) return;
  const items = Object.values(data).filter(function(g){ return g.imageData; });
  items.sort(function(a,b){ return (a.order||99)-(b.order||99); });
  el.innerHTML = items.map(function(g) {
    const colSpan = g.span2 ? 'grid-column:span 2;' : '';
    const imgRatio = g.span2 ? 'aspect-ratio:2/1;' : 'aspect-ratio:1/1;';
    return '<div class="gallery-item" style="' + colSpan + '">'+
      '<div class="gallery-item-img" style="' + imgRatio + '">'+
      '<img src="' + g.imageData + '" alt="' + (g.caption||'') + '" loading="lazy">'+
      '</div>'+
      (g.caption ? '<div class="gallery-caption">' + g.caption + '</div>' : '')+
      '</div>';
  }).join('');
}

// ---- Admin ----
window.loadSiteContentAdmin = async function() {
  const el = document.getElementById('site-content-admin-container');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:30px;opacity:.5">⏳ טוען...</div>';
  let d = {};
  try { const s = await db.ref('siteContent').get(); if (s.exists()) d = s.val(); } catch(e) {}

  el.innerHTML = '<h3 style="margin:0 0 20px;font-size:18px">📝 ניהול עמוד הבית</h3>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px">' +
    ['about','achievements','testimonials','gallery'].map(function(sec) {
      const labels = {about:'על המועדון',achievements:'הישגים',testimonials:'המלצות',gallery:'גלריה'};
      const icons  = {about:'📖',achievements:'🏆',testimonials:'💬',gallery:'📸'};
      return '<button onclick="showSiteSec(\'' + sec + '\')" id="sec-btn-' + sec + '" style="padding:9px 18px;border-radius:8px;border:2px solid rgba(255,255,255,.2);background:transparent;color:inherit;cursor:pointer;font-family:inherit;font-size:14px;font-weight:600">' +
        icons[sec] + ' ' + labels[sec] + '</button>';
    }).join('') +
    '</div>' +
    '<div id="sec-about" class="site-sec-panel" style="display:none">' + renderAboutAdmin(d.about) + '</div>' +
    '<div id="sec-achievements" class="site-sec-panel" style="display:none">' + renderAchievementsAdmin(d.achievements) + '</div>' +
    '<div id="sec-testimonials" class="site-sec-panel" style="display:none">' + renderTestimonialsAdmin(d.testimonials) + '</div>' +
    '<div id="sec-gallery" class="site-sec-panel" style="display:none">' + renderGalleryAdmin(d.gallery) + '</div>';

  showSiteSec('about');
};

window.showSiteSec = function(sec) {
  document.querySelectorAll('.site-sec-panel').forEach(function(p){ p.style.display='none'; });
  const panel = document.getElementById('sec-' + sec);
  if (panel) panel.style.display = '';
  document.querySelectorAll('[id^="sec-btn-"]').forEach(function(b){
    b.style.background = b.id === 'sec-btn-' + sec ? '#f97316' : 'transparent';
    b.style.borderColor = b.id === 'sec-btn-' + sec ? '#f97316' : 'rgba(255,255,255,.2)';
    b.style.color = b.id === 'sec-btn-' + sec ? 'white' : 'inherit';
  });
};

function renderAboutAdmin(data) {
  const p = data && data.paragraphs ? data.paragraphs : [
    'מועדון השחמט ראשון לציון, הפועל ברחוב בן גוריון 44, הוא אחד ממועדוני השחמט הוותיקים והגדולים בישראל — פעיל מאז <strong>1882</strong>. המועדון מציע חוגים לכל הגילאים והרמות, מגן חובה ועד שחקנים בעלי דרגות בינלאומיות.',
    'הצוות שלנו מורכב ממדריכים מנוסים ומוסמכים ברמה הבינלאומית: רב אמן בינלאומי (GM), אמן בינלאומי (IM), אמן פידה (FM) ומאמנים מוסמכים — כל אחד מביא עמו שיטות הוראה מתקדמות ותשוקה אמיתית לשחמט.',
    'בוגרי המועדון זכו באליפויות ארץ לנוער, השתתפו בתחרויות בינלאומיות והגיעו לדרגות פידה יוקרתיות. אנחנו גאים בכל שחקן שגדל אצלנו — בין אם ממשיך לתחרויות ברמה גבוהה ובין אם פשוט נהנה לשחק שחמט בחברה טובה.'
  ];
  return '<h4 style="margin:0 0 14px">על המועדון — עריכת פסקאות</h4>' +
    '<div id="about-paras-list">' +
    p.map(function(para, i) {
      return '<div style="margin-bottom:10px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
        '<label style="font-size:12px;font-weight:600;opacity:.7">פסקה ' + (i+1) + '</label>' +
        '<button onclick="removeAboutPara(' + i + ')" style="background:none;border:none;cursor:pointer;color:#fc8181;font-size:13px">✕ הסר</button>' +
        '</div>' +
        '<textarea id="about-para-' + i + '" rows="3" style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:inherit;font-family:inherit;font-size:14px;resize:vertical;box-sizing:border-box">' +
        para.replace(/<[^>]+>/g,'') + '</textarea></div>';
    }).join('') +
    '</div>' +
    '<button onclick="addAboutPara()" style="margin-top:8px;background:rgba(255,255,255,.08);border:1px dashed rgba(255,255,255,.3);border-radius:8px;padding:8px 16px;cursor:pointer;color:inherit;font-size:13px;width:100%">+ הוסף פסקה</button>' +
    '<button onclick="saveAboutContent()" style="margin-top:16px;background:#f97316;color:white;border:none;border-radius:8px;padding:11px 26px;cursor:pointer;font-weight:700;font-size:14px">💾 שמור</button>';
}

window.addAboutPara = function() {
  const list = document.getElementById('about-paras-list');
  if (!list) return;
  const idx = list.querySelectorAll('textarea').length;
  const div = document.createElement('div');
  div.style.marginBottom = '10px';
  div.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
    '<label style="font-size:12px;font-weight:600;opacity:.7">פסקה ' + (idx+1) + '</label>' +
    '<button onclick="this.closest(\'div[style]\').remove()" style="background:none;border:none;cursor:pointer;color:#fc8181;font-size:13px">✕ הסר</button>' +
    '</div>' +
    '<textarea id="about-para-' + idx + '" rows="3" style="width:100%;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:inherit;font-family:inherit;font-size:14px;resize:vertical;box-sizing:border-box"></textarea>';
  list.appendChild(div);
};

window.removeAboutPara = function(i) {
  const ta = document.getElementById('about-para-' + i);
  if (ta) ta.closest('div[style]').remove();
};

window.saveAboutContent = async function() {
  const paras = [];
  document.querySelectorAll('[id^="about-para-"]').forEach(function(ta) { if (ta.value.trim()) paras.push(ta.value.trim()); });
  try {
    await db.ref('siteContent/about').set({ paragraphs: paras });
    renderAboutContent({ paragraphs: paras });
    showToast('✅ "על המועדון" נשמר!');
  } catch(e) { showToast('❌ ' + e.message); }
};

function renderAchievementsAdmin(data) {
  const defaults = [
    { icon:'👑', num:'6', label:'אליפויות ליגת נשים ברצף', desc:'קבוצת הנשים שלנו — מהחזקות בישראל עם 10 אליפויות ב-12 שנים האחרונות', active:true, order:0 },
    { icon:'🥉', num:'מדליית ארד', label:'ליגת העל הגברים', desc:'קבוצת הגברים עם גרנד מאסטרים בליגה הלאומית הגבוהה ביותר', active:true, order:1 },
    { icon:'🏫', num:'58', label:'גנים ובתי ספר', desc:'תוכנית "מסע לעולם השחמט" — חינוך שחמט ב-40 גנים ו-18 בתי ספר בראשון לציון', active:true, order:2 },
    { icon:'⭐', num:'GM, IM, FM', label:'בוגרים בעלי דרגות', desc:'בוגרי המועדון הגיעו לדרגות הבינלאומיות היוקרתיות ביותר בשחמט', active:true, order:3 },
    { icon:'📅', num:'1882', label:'שנת ייסוד', desc:'אחד ממועדוני השחמט הוותיקים בישראל — מסורת ארוכה של מצוינות שחמטאית', active:true, order:4 },
    { icon:'🌍', num:'3', label:'קבוצות בליגת העל', desc:'מועדוני בית אחד עם שלוש קבוצות בדיביזיה הגבוהה ביותר בו זמנית', active:true, order:5 }
  ];
  const items = data ? Object.entries(data).map(function(e){ return Object.assign({_id:e[0]},e[1]); }) : defaults.map(function(d,i){ return Object.assign({_id:'d'+i},d); });
  items.sort(function(a,b){ return (a.order||99)-(b.order||99); });
  return '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
    '<h4 style="margin:0">🏆 הישגי המועדון</h4>' +
    '<button onclick="openAchModal(null)" style="background:#f97316;color:white;border:none;border-radius:8px;padding:8px 16px;cursor:pointer;font-weight:700;font-size:13px">+ הוסף הישג</button>' +
    '</div>' +
    '<div id="ach-admin-list">' +
    items.map(function(a) {
      return '<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:8px;background:rgba(255,255,255,.05);margin-bottom:6px">' +
        '<span style="font-size:20px">' + (a.icon||'🏆') + '</span>' +
        '<div style="flex:1">' +
          '<div style="font-weight:700">' + (a.num||'') + ' · ' + (a.label||'') + '</div>' +
          '<div style="font-size:12px;opacity:.65">' + (a.desc||'') + '</div>' +
        '</div>' +
        '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">' +
          '<input type="checkbox" ' + (a.active!==false?'checked':'') + ' onchange="toggleAch(\'' + (a._id||'') + '\',this.checked)" style="width:15px;height:15px"> פעיל</label>' +
        '<button onclick="openAchModal(\'' + (a._id||'') + '\')" style="background:rgba(255,255,255,.1);border:none;border-radius:6px;padding:6px 10px;cursor:pointer;color:inherit;font-size:12px">✏️</button>' +
        '<button onclick="deleteAch(\'' + (a._id||'') + '\')" style="background:rgba(252,129,129,.15);border:none;border-radius:6px;padding:6px 10px;cursor:pointer;color:#fc8181;font-size:12px">🗑️</button>' +
        '</div>';
    }).join('') +
    '</div>';
}

window.toggleAch = async function(id, val) {
  if (!id) return;
  try { await db.ref('siteContent/achievements/' + id + '/active').set(val); loadSiteContent(); }
  catch(e) { showToast('❌ ' + e.message); }
};
window.deleteAch = async function(id) {
  if (!id || !confirm('למחוק?')) return;
  try { await db.ref('siteContent/achievements/' + id).remove(); loadSiteContentAdmin(); loadSiteContent(); showToast('🗑️ נמחק'); }
  catch(e) { showToast('❌ ' + e.message); }
};
window.openAchModal = async function(id) {
  let a = {};
  if (id && id[0]!=='d') { const s = await db.ref('siteContent/achievements/'+id).get(); if(s.exists()) a=s.val(); }
  const modal = document.createElement('div');
  modal.className='modal-overlay open'; modal.style.cssText='z-index:9999;padding:20px';
  modal.onclick=function(e){ if(e.target===modal) modal.remove(); };
  modal.innerHTML='<div style="background:var(--bg-card);border-radius:16px;max-width:480px;width:100%;padding:28px;direction:rtl;max-height:90vh;overflow-y:auto">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><h3 style="margin:0">' + (id&&id[0]!=='d'?'עריכת הישג':'הישג חדש') + '</h3>' +
    '<button onclick="this.closest(\'.modal-overlay\').remove()" style="background:none;border:none;font-size:22px;cursor:pointer;color:inherit">✕</button></div>' +
    '<div style="display:flex;flex-direction:column;gap:12px">' +
    ['icon:אייקון (אמוג\'י):🏆','num:מספר / כותרת:0','label:תווית:','desc:תיאור:'].map(function(f){
      const p=f.split(':'); return '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">'+p[1]+'</label>' +
      '<input id="ach-'+p[0]+'" value="'+(a[p[0]]||p[2]||'').replace(/"/g,'&quot;')+'" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;box-sizing:border-box"></div>';
    }).join('') +
    '<div><label style="font-size:12px;font-weight:600;margin-bottom:4px;display:flex;align-items:center;gap:8px;cursor:pointer">' +
    '<input type="checkbox" id="ach-active" '+(a.active!==false?'checked':'')+' style="width:15px;height:15px"> פעיל (מוצג)</label></div>' +
    '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">סדר</label>' +
    '<input id="ach-order" type="number" value="'+(a.order||0)+'" style="width:70px;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px"></div>' +
    '</div><div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end">' +
    '<button onclick="this.closest(\'.modal-overlay\').remove()" style="background:rgba(255,255,255,.1);border:none;border-radius:8px;padding:9px 18px;cursor:pointer;color:inherit">ביטול</button>' +
    '<button onclick="saveAch(\''+(id&&id[0]!=='d'?id:'')+'\')" style="background:#f97316;color:white;border:none;border-radius:8px;padding:9px 20px;cursor:pointer;font-weight:700">💾 שמור</button>' +
    '</div></div>';
  document.body.appendChild(modal);
};
window.saveAch = async function(id) {
  const data = {
    icon: document.getElementById('ach-icon').value.trim()||'🏆',
    num: document.getElementById('ach-num').value.trim(),
    label: document.getElementById('ach-label').value.trim(),
    desc: document.getElementById('ach-desc').value.trim(),
    active: document.getElementById('ach-active').checked,
    order: parseInt(document.getElementById('ach-order').value)||0
  };
  try {
    if (id) await db.ref('siteContent/achievements/'+id).update(data);
    else await db.ref('siteContent/achievements').push(data);
    document.querySelector('.modal-overlay.open')?.remove();
    loadSiteContentAdmin(); loadSiteContent(); showToast('✅ נשמר!');
  } catch(e) { showToast('❌ '+e.message); }
};

function renderTestimonialsAdmin(data) {
  const items = data ? Object.entries(data).map(function(e){ return Object.assign({_id:e[0]},e[1]); }) : [];
  items.sort(function(a,b){ return (a.order||99)-(b.order||99); });
  return '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
    '<h4 style="margin:0">💬 המלצות</h4>' +
    '<button onclick="openTestimonialModal(null)" style="background:#f97316;color:white;border:none;border-radius:8px;padding:8px 16px;cursor:pointer;font-weight:700;font-size:13px">+ הוסף המלצה</button>' +
    '</div>' +
    (items.length===0 ? '<div style="text-align:center;padding:30px;opacity:.5">אין המלצות — לחץ "הוסף" להתחיל</div>' :
    items.map(function(t) {
      return '<div style="display:flex;align-items:flex-start;gap:12px;padding:10px 12px;border-radius:8px;background:rgba(255,255,255,.05);margin-bottom:6px">' +
        '<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#f97316,#ea580c);display:flex;align-items:center;justify-content:center;font-weight:800;color:white;font-size:14px;flex-shrink:0">' + (t.name||'?').charAt(0) + '</div>' +
        '<div style="flex:1"><div style="font-weight:700">' + (t.name||'') + ' · <span style="opacity:.6;font-weight:400">' + (t.role||'') + '</span></div>' +
        '<div style="font-size:12px;opacity:.65;margin-top:3px">' + (t.text||'').substring(0,80) + '...</div></div>' +
        '<button onclick="openTestimonialModal(\'' + t._id + '\')" style="background:rgba(255,255,255,.1);border:none;border-radius:6px;padding:6px 10px;cursor:pointer;color:inherit;font-size:12px">✏️</button>' +
        '<button onclick="deleteTestimonial(\'' + t._id + '\')" style="background:rgba(252,129,129,.15);border:none;border-radius:6px;padding:6px 10px;cursor:pointer;color:#fc8181;font-size:12px">🗑️</button>' +
        '</div>';
    }).join(''));
}

window.openTestimonialModal = async function(id) {
  let t = {};
  if (id) { const s = await db.ref('siteContent/testimonials/'+id).get(); if(s.exists()) t=s.val(); }
  const modal = document.createElement('div');
  modal.className='modal-overlay open'; modal.style.cssText='z-index:9999;padding:20px';
  modal.onclick=function(e){ if(e.target===modal) modal.remove(); };
  modal.innerHTML='<div style="background:var(--bg-card);border-radius:16px;max-width:500px;width:100%;padding:28px;direction:rtl;max-height:90vh;overflow-y:auto">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><h3 style="margin:0">' + (id?'עריכת המלצה':'המלצה חדשה') + '</h3>' +
    '<button onclick="this.closest(\'.modal-overlay\').remove()" style="background:none;border:none;font-size:22px;cursor:pointer;color:inherit">✕</button></div>' +
    '<div style="display:flex;flex-direction:column;gap:12px">' +
    '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">שם</label><input id="test-name" value="'+(t.name||'').replace(/"/g,'&quot;')+'" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;box-sizing:border-box"></div>' +
    '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">תפקיד / זיקה למועדון</label><input id="test-role" value="'+(t.role||'').replace(/"/g,'&quot;')+'" placeholder="לדוגמה: הורה של שחקן" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;box-sizing:border-box"></div>' +
    '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">טקסט ההמלצה</label><textarea id="test-text" rows="5" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;resize:vertical;box-sizing:border-box">'+(t.text||'')+'</textarea></div>' +
    '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">סדר</label><input id="test-order" type="number" value="'+(t.order||0)+'" style="width:70px;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px"></div>' +
    '</div><div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end">' +
    '<button onclick="this.closest(\'.modal-overlay\').remove()" style="background:rgba(255,255,255,.1);border:none;border-radius:8px;padding:9px 18px;cursor:pointer;color:inherit">ביטול</button>' +
    '<button onclick="saveTestimonial(\''+(id||'')+'\')" style="background:#f97316;color:white;border:none;border-radius:8px;padding:9px 20px;cursor:pointer;font-weight:700">💾 שמור</button>' +
    '</div></div>';
  document.body.appendChild(modal);
};
window.deleteTestimonial = async function(id) {
  if (!confirm('למחוק?')) return;
  try { await db.ref('siteContent/testimonials/'+id).remove(); loadSiteContentAdmin(); loadSiteContent(); showToast('🗑️ נמחק'); }
  catch(e) { showToast('❌ '+e.message); }
};
window.saveTestimonial = async function(id) {
  const data = {
    name: document.getElementById('test-name').value.trim(),
    role: document.getElementById('test-role').value.trim(),
    text: document.getElementById('test-text').value.trim(),
    active: true,
    order: parseInt(document.getElementById('test-order').value)||0
  };
  if (!data.name || !data.text) { showToast('⚠️ שם וטקסט הם שדות חובה'); return; }
  try {
    if (id) await db.ref('siteContent/testimonials/'+id).update(data);
    else await db.ref('siteContent/testimonials').push(data);
    document.querySelector('.modal-overlay.open')?.remove();
    loadSiteContentAdmin(); loadSiteContent(); showToast('✅ נשמר!');
  } catch(e) { showToast('❌ '+e.message); }
};

function renderGalleryAdmin(data) {
  const items = data ? Object.entries(data).map(function(e){ return Object.assign({_id:e[0]},e[1]); }) : [];
  items.sort(function(a,b){ return (a.order||99)-(b.order||99); });
  return '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
    '<h4 style="margin:0">📸 גלריה</h4>' +
    '<button onclick="openGalleryUpload()" style="background:#f97316;color:white;border:none;border-radius:8px;padding:8px 16px;cursor:pointer;font-weight:700;font-size:13px">+ הוסף תמונה</button>' +
    '</div>' +
    '<p style="font-size:12px;opacity:.6;margin-bottom:16px">כשתשמור תמונות כאן הן יחליפו את תמונות ברירת המחדל בגלריה</p>' +
    (items.length===0 ? '<div style="text-align:center;padding:30px;opacity:.5">אין תמונות — הגלריה מציגה ברירות מחדל</div>' :
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px">' +
    items.map(function(g) {
      return '<div style="position:relative;border-radius:10px;overflow:hidden;aspect-ratio:1;background:#000">' +
        '<img src="'+g.imageData+'" style="width:100%;height:100%;object-fit:cover;cursor:pointer" onclick="openGalleryEdit(\''+g._id+'\')">' +
        '<div style="position:absolute;top:4px;right:4px;display:flex;gap:4px">' +
        '<button onclick="openGalleryEdit(\''+g._id+'\')" title="ערוך כיתוב" style="background:rgba(0,0,0,.6);border:none;border-radius:4px;padding:4px 6px;cursor:pointer;color:white;font-size:10px">✏️</button>' +
        '<button onclick="toggleGallerySpan(\''+g._id+'\','+(!g.span2)+')" title="'+(g.span2?'הצג רגיל':'הצג רחב')+'" style="background:rgba(0,0,0,.6);border:none;border-radius:4px;padding:4px 6px;cursor:pointer;color:white;font-size:10px">'+(g.span2?'⬛':'⬜⬜')+'</button>' +
        '<button onclick="deleteGalleryItem(\''+g._id+'\')" style="background:rgba(180,0,0,.7);border:none;border-radius:4px;padding:4px 6px;cursor:pointer;color:white;font-size:10px">✕</button></div>' +
        (g.caption?'<div style="position:absolute;bottom:0;left:0;right:0;padding:4px 6px;background:rgba(0,0,0,.6);font-size:11px;color:white">'+g.caption+'</div>':'') +
        '</div>';
    }).join('') + '</div>');
}

window.openGalleryUpload = function() {
  const modal = document.createElement('div');
  modal.className='modal-overlay open'; modal.style.cssText='z-index:9999;padding:20px';
  modal.onclick=function(e){ if(e.target===modal) modal.remove(); };
  modal.innerHTML='<div style="background:var(--bg-card);border-radius:16px;max-width:440px;width:100%;padding:28px;direction:rtl">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><h3 style="margin:0">הוספת תמונה לגלריה</h3>' +
    '<button onclick="this.closest(\'.modal-overlay\').remove()" style="background:none;border:none;font-size:22px;cursor:pointer;color:inherit">✕</button></div>' +
    '<div style="display:flex;flex-direction:column;gap:14px">' +
    '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px">תמונה</label>' +
    '<input type="file" accept="image/*" onchange="previewGalleryImg(this)" style="font-size:13px;color:inherit"><input type="hidden" id="gal-img-data" value=""></div>' +
    '<div id="gal-preview" style="height:160px;background:rgba(255,255,255,.06);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:36px">📷</div>' +
    '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">כיתוב (אופציונלי)</label>' +
    '<input id="gal-caption" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;box-sizing:border-box"></div>' +
    '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px"><input type="checkbox" id="gal-span2" style="width:15px;height:15px"> תמונה רחבה (תופסת שתי עמודות)</label>' +
    '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">סדר</label><input id="gal-order" type="number" value="99" style="width:70px;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px"></div>' +
    '</div><div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end">' +
    '<button onclick="this.closest(\'.modal-overlay\').remove()" style="background:rgba(255,255,255,.1);border:none;border-radius:8px;padding:9px 18px;cursor:pointer;color:inherit">ביטול</button>' +
    '<button onclick="saveGalleryItem()" style="background:#f97316;color:white;border:none;border-radius:8px;padding:9px 20px;cursor:pointer;font-weight:700">💾 שמור</button>' +
    '</div></div>';
  document.body.appendChild(modal);
};
window.previewGalleryImg = async function(input) {
  if (!input.files[0]) return;
  const data = await compressImage(input.files[0]);
  document.getElementById('gal-img-data').value = data;
  const prev = document.getElementById('gal-preview');
  if (prev) prev.innerHTML = '<img src="'+data+'" style="width:100%;height:100%;object-fit:cover;border-radius:10px">';
};
window.saveGalleryItem = async function() {
  const img = document.getElementById('gal-img-data').value;
  if (!img) { showToast('⚠️ יש לבחור תמונה'); return; }
  const data = {
    imageData: img,
    caption: document.getElementById('gal-caption').value.trim(),
    span2: document.getElementById('gal-span2').checked,
    order: parseInt(document.getElementById('gal-order').value)||99
  };
  try {
    await db.ref('siteContent/gallery').push(data);
    document.querySelector('.modal-overlay.open')?.remove();
    loadSiteContentAdmin(); loadSiteContent(); showToast('✅ תמונה נוספה!');
  } catch(e) { showToast('❌ '+e.message); }
};
window.openGalleryEdit = async function(id) {
  let caption = '';
  try { const s = await db.ref('siteContent/gallery/'+id+'/caption').get(); caption = s.val() || ''; } catch(e) {}
  const modal = document.createElement('div');
  modal.className = 'modal-overlay open'; modal.style.cssText = 'z-index:9999;padding:20px';
  modal.onclick = function(e) { if (e.target===modal) modal.remove(); };
  const safeCaption = caption.replace(/"/g,'&quot;');
  modal.innerHTML = '<div style="background:var(--bg-card);border-radius:16px;max-width:400px;width:100%;padding:24px;direction:rtl">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
    '<h3 style="margin:0">✏️ ערוך כיתוב תמונה</h3>' +
    '<button onclick="this.closest(\'.modal-overlay\').remove()" style="background:none;border:none;font-size:22px;cursor:pointer;color:inherit">✕</button></div>' +
    '<input id="edit-gal-caption" value="' + safeCaption + '" placeholder="כיתוב לתמונה (אופציונלי)" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;box-sizing:border-box;margin-bottom:16px">' +
    '<div style="display:flex;gap:10px;justify-content:flex-end">' +
    '<button onclick="this.closest(\'.modal-overlay\').remove()" style="background:rgba(255,255,255,.1);border:none;border-radius:8px;padding:9px 18px;cursor:pointer;color:inherit">ביטול</button>' +
    '<button onclick="saveGalleryCaption(\'' + id + '\')" style="background:#f97316;color:white;border:none;border-radius:8px;padding:9px 20px;cursor:pointer;font-weight:700">💾 שמור</button>' +
    '</div></div>';
  document.body.appendChild(modal);
};
window.saveGalleryCaption = async function(id) {
  const caption = (document.getElementById('edit-gal-caption').value||'').trim();
  try {
    await db.ref('siteContent/gallery/'+id+'/caption').set(caption||null);
    document.querySelector('.modal-overlay.open')?.remove();
    loadSiteContentAdmin(); loadSiteContent(); showToast('✅ כיתוב עודכן!');
  } catch(e) { showToast('❌ '+e.message); }
};
window.deleteGalleryItem = async function(id) {
  if (!confirm('למחוק תמונה?')) return;
  try { await db.ref('siteContent/gallery/'+id).remove(); loadSiteContentAdmin(); loadSiteContent(); showToast('🗑️ נמחק'); }
  catch(e) { showToast('❌ '+e.message); }
};
window.toggleGallerySpan = async function(id, val) {
  try { await db.ref('siteContent/gallery/'+id+'/span2').set(val); loadSiteContentAdmin(); loadSiteContent(); }
  catch(e) { showToast('❌ '+e.message); }
};
// ===== END SITE CONTENT CMS =====
// ===== END CLUB PEOPLE =====
// ===== END NEWS POSTS =====
