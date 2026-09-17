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

function showToast(msg, type) {
  let t = document.getElementById('toast-msg');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast-msg';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);color:white;padding:10px 22px;border-radius:10px;font-size:14px;font-weight:600;z-index:10001;box-shadow:0 4px 14px rgba(0,0,0,0.25);transition:opacity .3s';
    document.body.appendChild(t);
  }
  t.style.background = type === 'error' ? '#c53030' : '#2d3748';
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

// A post with a full body and/or extra photos is a full recap — its card
// opens the recap on the site instead of (or in addition to) any external
// link. A plain post (base fields only) behaves exactly like before.
function newsPostHasFullContent(p) {
  return !!((p.fullBody && p.fullBody.trim()) || (p.photos && p.photos.length));
}

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
    const hasFull = newsPostHasFullContent(p);
    // A plain (non-recap) post can have a Facebook link, an Instagram link,
    // both, or neither — the card itself can only click through to one
    // place, so Facebook wins if both are set (matches which field existed
    // here first); the detail view (see renderActivityDetailView) shows both.
    const extLink = p.link || p.linkIg;
    const extLabel = p.link ? 'קרא עוד בפייסבוק' : 'קרא עוד באינסטגרם';
    const clickable = hasFull || extLink;
    const clickAttr = hasFull ? `onclick="showSitePage('activities');openActivityDetail('${p.id}')"`
                     : (extLink ? `data-link="${extLink}" onclick="newsCardClick(this)"` : '');
    const styleAttr = clickable ? 'style="cursor:pointer"' : '';
    const badge = hasFull
      ? `<div style="margin-top:12px;font-size:13px;color:#f97316;font-weight:600">📖 קרא את הסקירה המלאה ←</div>`
      : (extLink ? `<div style="margin-top:12px;font-size:13px;color:#4267B2;font-weight:600">&#x1F4D8; ${extLabel} &#x2197;</div>` : '');
    return `<div class="news-slide"><div class="news-card" ${styleAttr} ${clickAttr}>${img}<div class="news-card-body">${date}${title}${body}${badge}</div></div></div>`;
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

// ===== ACTIVITIES ARCHIVE (עדכוני המועדון) — public list + full-recap detail =====
// Same newsPosts data as the homepage carousel, but unfiltered by `active`
// (that flag only controls the homepage carousel — an update that rolled off
// it should still be reachable here, not vanish) and sorted by date instead
// of the carousel's manual `order`.
let _activitiesData = null; // [{id, ...}, ...] once loaded
let _activitiesView = 'list'; // 'list' | 'detail'
let _activitiesDetailId = null;
let _activitiesCatFilter = 'all'; // 'all' | a category id
let _activitiesArchiveMode = false; // false = current updates, true = archive

// A post's category — every post has one, even old ones saved before
// categories existed, via this same fallback everywhere (display, the admin
// dropdown's default, and what an uncategorized post's own field is treated
// as) — no migration of existing newsPosts needed.
const DEFAULT_NEWS_CATEGORY = { id: 'recent-news', name: 'חדשות אחרונות', order: 0 };
const DEFAULT_NEWS_SUBTITLE = 'כל מה שקורה אצלנו — כתבות קצרות וסקירות מלאות עם תמונות';
function newsEffectiveCategoryId(p) { return (p && p.categoryId) || DEFAULT_NEWS_CATEGORY.id; }

let _newsCategories = null; // [{id, name, order}, ...] — always includes the default once loaded
let _newsSettings = null;   // { subtitle }
let _newsCategoriesFetchPromise = null;
async function ensureNewsCategoriesAndSettings() {
  if (_newsCategories && _newsSettings) return;
  if (!_newsCategoriesFetchPromise) {
    _newsCategoriesFetchPromise = (async () => {
      try {
        const [catSnap, setSnap] = await Promise.all([
          db.ref('siteContent/newsCategories').get(),
          db.ref('siteContent/newsSettings').get(),
        ]);
        if (catSnap.exists()) {
          const cats = [];
          catSnap.forEach(c => { cats.push({ id: c.key, ...c.val() }); }); // block body — see the forEach note above
          cats.sort((a, b) => (a.order || 0) - (b.order || 0));
          _newsCategories = cats.length ? cats : [{ ...DEFAULT_NEWS_CATEGORY }];
        } else {
          _newsCategories = [{ ...DEFAULT_NEWS_CATEGORY }];
        }
        _newsSettings = setSnap.exists() ? setSnap.val() : {};
      } catch (e) {
        _newsCategories = _newsCategories || [{ ...DEFAULT_NEWS_CATEGORY }];
        _newsSettings = _newsSettings || {};
      }
    })().finally(() => { _newsCategoriesFetchPromise = null; });
  }
  return _newsCategoriesFetchPromise;
}
function newsCategoryName(catId) {
  const cat = (_newsCategories || []).find(c => c.id === catId);
  return cat ? cat.name : DEFAULT_NEWS_CATEGORY.name;
}
let _activitiesFetchPromise = null; // in-flight fetch, shared so two near-simultaneous
// callers (see below) await the SAME read instead of each firing their own —
// the real trigger for this is showSitePage('activities') and openActivityDetail(id)
// being called back-to-back from one onclick with neither awaiting the other; both
// used to independently check "is _activitiesData missing?" and, seeing it missing
// at the same instant, each started its own db.ref('newsPosts').get(). Whichever
// call's fetch resolved second could still overwrite a good render with an
// inconsistent one — sharing one promise makes that structurally impossible.
async function ensureActivitiesData() {
  if (_activitiesData) return _activitiesData;
  if (!_activitiesFetchPromise) {
    _activitiesFetchPromise = (async () => {
      const arr = [];
      const snap = await db.ref('newsPosts').get();
      // Block body, not a bare expression — DataSnapshot.forEach stops iterating
      // the moment its callback returns a truthy value (a documented Firebase
      // early-exit mechanism), and Array.prototype.push's return value (the
      // new length) is 1 — truthy — after the very first item. A single-
      // expression arrow `c => arr.push(...)` implicitly returns that length,
      // so this silently processed only the first child and stopped.
      if (snap.exists()) snap.forEach(c => { arr.push({ id: c.key, ...c.val() }); });
      arr.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      _activitiesData = arr;
      return arr;
    })().finally(() => { _activitiesFetchPromise = null; });
  }
  return _activitiesFetchPromise;
}

async function loadActivitiesPage() {
  const root = document.getElementById('activities-root');
  if (!root) return;
  if (!_activitiesData) root.innerHTML = '<div style="text-align:center;padding:40px;opacity:0.5">טוען עדכונים...</div>';
  try {
    await Promise.all([ensureActivitiesData(), ensureNewsCategoriesAndSettings()]);
  } catch (e) {
    root.innerHTML = `<div style="text-align:center;padding:40px;color:#fc8181">❌ שגיאה בטעינה: ${e.message}</div>`;
    return;
  }
  const subEl = document.getElementById('activities-subtitle');
  if (subEl) subEl.textContent = (_newsSettings && _newsSettings.subtitle) || DEFAULT_NEWS_SUBTITLE;
  if (_activitiesView === 'detail' && _activitiesDetailId) renderActivityDetailView();
  else renderActivitiesListView();
}
window.loadActivitiesPage = loadActivitiesPage;

window.setActivitiesCatFilter = function(catId) { _activitiesCatFilter = catId; renderActivitiesListView(); };
window.toggleActivitiesArchive = function() {
  _activitiesArchiveMode = !_activitiesArchiveMode;
  _activitiesCatFilter = 'all'; // switching views — a category selected in one doesn't necessarily exist/mean much in the other
  renderActivitiesListView();
};

function renderActivitiesListView() {
  const root = document.getElementById('activities-root');
  if (!root) return;
  _activitiesView = 'list';
  const cats = _newsCategories || [{ ...DEFAULT_NEWS_CATEGORY }];

  const tabsHtml = '<div class="activities-cat-tabs">' +
    `<button class="activities-cat-tab${_activitiesCatFilter === 'all' ? ' active' : ''}" onclick="setActivitiesCatFilter('all')">הכל</button>` +
    cats.map(c => `<button class="activities-cat-tab${_activitiesCatFilter === c.id ? ' active' : ''}" onclick="setActivitiesCatFilter('${c.id}')">${c.name}</button>`).join('') +
    '</div>';
  const archiveToggleHtml = `<button class="activities-archive-toggle" onclick="toggleActivitiesArchive()">${_activitiesArchiveMode ? '← חזרה לעדכונים נוכחיים' : '📦 ארכיון כתבות'}</button>`;
  const toolbarHtml = `<div class="activities-toolbar">${tabsHtml}${archiveToggleHtml}</div>`;

  const pool = (_activitiesData || []).filter(p => !!p.archived === _activitiesArchiveMode);
  const filtered = _activitiesCatFilter === 'all' ? pool : pool.filter(p => newsEffectiveCategoryId(p) === _activitiesCatFilter);

  if (!filtered.length) {
    const emptyMsg = _activitiesArchiveMode ? 'אין כתבות בארכיון בקטגוריה זו' : 'אין עדכונים בקטגוריה זו';
    root.innerHTML = toolbarHtml + `<div style="text-align:center;padding:40px;opacity:0.5">${emptyMsg}</div>`;
    return;
  }
  const gridHtml = '<div class="activities-grid">' + filtered.map(p => {
    const img = p.imageData ? `<img class="activity-card-img" src="${p.imageData}" alt="">` : `<div class="activity-card-noimg">📰</div>`;
    const hasFull = newsPostHasFullContent(p);
    const extLink = p.link || p.linkIg; // Facebook wins if both are set — see the identical note in renderNewsCarousel
    const extLabel = p.link ? 'קרא עוד בפייסבוק' : 'קרא עוד באינסטגרם';
    const badge = hasFull
      ? `<div class="activity-card-badge" style="color:#f97316">📖 סקירה מלאה ←</div>`
      : (extLink ? `<div class="activity-card-badge" style="color:#4267B2">📘 ${extLabel} ↗</div>` : '');
    const onclick = hasFull ? `openActivityDetail('${p.id}')` : (extLink ? `window.open('${extLink}','_blank')` : '');
    return `<div class="activity-card" ${onclick ? `onclick="${onclick}"` : ''}>${img}
      <div class="activity-card-body">
        ${p.date ? `<div class="activity-card-date">${p.date}</div>` : ''}
        <div class="activity-card-title">${p.title || ''}</div>
        ${p.body ? `<div class="activity-card-text">${p.body}</div>` : ''}
        ${badge}
      </div></div>`;
  }).join('') + '</div>';
  root.innerHTML = toolbarHtml + gridHtml;
}

// Opens (or switches to) the full-recap detail view for one post, updating
// the URL to a shareable ?activity=<id> link without a page reload — so
// visiting the same link later (e.g. pasted into Facebook/Instagram) lands
// straight here (see the initAuth bootstrap in auth-dashboard.js).
window.openActivityDetail = async function(id) {
  try { await Promise.all([ensureActivitiesData(), ensureNewsCategoriesAndSettings()]); } catch (e) { _activitiesData = _activitiesData || []; }
  _activitiesDetailId = id;
  _activitiesView = 'detail';
  renderActivityDetailView();
  try {
    const url = new URL(location.href);
    url.searchParams.set('activity', id);
    history.replaceState(null, '', url);
  } catch (e) {}
};

function renderActivityDetailView() {
  const root = document.getElementById('activities-root');
  if (!root) return;
  const post = (_activitiesData || []).find(p => p.id === _activitiesDetailId);
  if (!post) {
    root.innerHTML = '<div style="text-align:center;padding:40px;opacity:0.5">העדכון לא נמצא — ייתכן שהוסר</div>' +
      '<div style="text-align:center"><button onclick="backToActivitiesList()" style="background:#f97316;color:white;border:none;border-radius:8px;padding:9px 20px;cursor:pointer;font-weight:700">→ חזרה לרשימה</button></div>';
    return;
  }
  const photos = post.photos || [];
  const allImages = [post.imageData, ...photos.map(p => p.imageData)].filter(Boolean);
  root.innerHTML = `
    <div class="activity-detail">
      <button onclick="backToActivitiesList()" style="background:none;border:none;color:#f97316;font-size:14px;font-weight:700;cursor:pointer;padding:0;margin-bottom:16px">→ חזרה לכל העדכונים</button>
      ${post.imageData ? `<img class="activity-detail-cover" src="${post.imageData}" alt="" onclick="openActivityLightbox(0)">` : ''}
      <div class="activity-detail-title">${post.title || ''}</div>
      ${post.date ? `<div class="activity-detail-date">${post.date}</div>` : ''}
      ${post.fullBody ? `<div class="activity-detail-body">${post.fullBody}</div>` : (post.body ? `<div class="activity-detail-body">${post.body}</div>` : '')}
      ${photos.length ? `<div class="activity-detail-photos">${photos.map((ph, i) =>
        `<img src="${ph.imageData}" alt="${ph.caption || ''}" onclick="openActivityLightbox(${i + (post.imageData ? 1 : 0)})" title="${ph.caption || ''}">`
      ).join('')}</div>` : ''}
      ${(post.link || post.linkIg) ? `<div style="display:flex;gap:20px;flex-wrap:wrap">
        ${post.link ? `<a href="${post.link}" target="_blank" style="display:inline-block;color:#4267B2;font-weight:700;font-size:14px;text-decoration:none">&#x1F4D8; קישור לפוסט בפייסבוק ↗</a>` : ''}
        ${post.linkIg ? `<a href="${post.linkIg}" target="_blank" style="display:inline-block;color:#c13584;font-weight:700;font-size:14px;text-decoration:none">&#x1F4F7; קישור לפוסט באינסטגרם ↗</a>` : ''}
      </div>` : ''}
    </div>`;
  window._activityLightboxImages = allImages;
}

window.backToActivitiesList = function() {
  _activitiesView = 'list';
  _activitiesDetailId = null;
  try {
    const url = new URL(location.href);
    url.searchParams.delete('activity');
    history.replaceState(null, '', url);
  } catch (e) {}
  renderActivitiesListView();
};

// ── Lightbox for recap photos — dynamic image set (cover + extra photos),
// unlike the fixed 2-slot season-launch one, but the same on-site overlay. ──
let _activityLightboxIdx = 0;
window.openActivityLightbox = function(idx) {
  const images = window._activityLightboxImages || [];
  if (!images.length) return;
  _activityLightboxIdx = idx;
  const img = document.getElementById('activity-lightbox-img');
  if (img) img.src = images[_activityLightboxIdx];
  const box = document.getElementById('activity-lightbox');
  if (box) box.classList.add('open');
};
window.activityLightboxNav = function(dir) {
  const images = window._activityLightboxImages || [];
  if (!images.length) return;
  _activityLightboxIdx = (_activityLightboxIdx + dir + images.length) % images.length;
  const img = document.getElementById('activity-lightbox-img');
  if (img) img.src = images[_activityLightboxIdx];
};
window.closeActivityLightbox = function() {
  const box = document.getElementById('activity-lightbox');
  if (box) box.classList.remove('open');
};

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
    await ensureNewsCategoriesAndSettings();
  } catch(e) {
    el.innerHTML = `<div style="text-align:center;padding:30px;color:#fc8181">❌ שגיאה: ${e.message}</div>`;
    return;
  }
  _nsCatDraft = (_newsCategories || [{ ...DEFAULT_NEWS_CATEGORY }]).map(c => ({ ...c }));
  el.innerHTML = renderNewsSettingsAdmin() +
    `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px">
      <h3 style="margin:0;font-size:18px">📢 כל העדכונים</h3>
      <button onclick="openNewsModal(null)" style="background:#f97316;color:white;border:none;border-radius:8px;padding:9px 18px;cursor:pointer;font-weight:700;font-size:14px">+ עדכון חדש</button>
    </div>
    ${posts.length === 0
      ? '<div style="text-align:center;padding:40px;opacity:.5">אין עדכונים עדיין. צור עדכון ראשון!</div>'
      : posts.map(p => `
      <div style="display:flex;gap:14px;align-items:center;padding:14px;background:var(--bg-card);border-radius:12px;margin-bottom:10px;${p.archived ? 'opacity:.6' : ''}">
        ${p.imageData
          ? `<img src="${p.imageData}" style="width:80px;height:54px;object-fit:cover;border-radius:8px;flex-shrink:0">`
          : `<div style="width:80px;height:54px;background:rgba(255,255,255,.08);border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px">📰</div>`}
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.title||'(ללא כותרת)'}</div>
          <div style="font-size:12px;opacity:.55">${p.date||''} · ${p.active===false ? '<span style="color:#fc8181">מוסתר בדף הבית</span>' : '<span style="color:#68d391">פעיל בדף הבית</span>'}${newsPostHasFullContent(p) ? ' · <span style="color:#f97316">📖 סקירה מלאה</span>' : ''} · <span style="opacity:.8">🏷️ ${newsCategoryName(newsEffectiveCategoryId(p))}</span>${p.archived ? ' · <span style="color:#a0aec0">📦 בארכיון</span>' : ''}</div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0">
          <button onclick="toggleNewsArchived('${p.id}', ${!p.archived})" title="${p.archived ? 'החזר מהארכיון' : 'העבר לארכיון'}" style="background:rgba(255,255,255,.1);border:none;border-radius:8px;padding:7px 12px;cursor:pointer;color:inherit;font-size:13px">${p.archived ? '↩️' : '📦'}</button>
          <button onclick="openNewsModal('${p.id}')" style="background:rgba(255,255,255,.1);border:none;border-radius:8px;padding:7px 12px;cursor:pointer;color:inherit;font-size:13px">✏️</button>
          <button onclick="deleteNewsPost('${p.id}')" style="background:rgba(252,129,129,.15);border:none;border-radius:8px;padding:7px 12px;cursor:pointer;color:#fc8181;font-size:13px">🗑️</button>
        </div>
      </div>`).join('')}`;
  renderNewsCategoriesList();
}
window.loadNewsAdmin = loadNewsAdmin;

// ── עמוד העדכונים settings: subtitle text + category list ───────────────────
let _nsCatDraft = []; // staged categories for this editor — saved as one batch

function renderNewsSettingsAdmin() {
  const subtitle = (_newsSettings && _newsSettings.subtitle) || DEFAULT_NEWS_SUBTITLE;
  return `
    <div style="border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:16px;margin-bottom:20px">
      <h4 style="margin:0 0 14px">⚙️ הגדרות עמוד "עדכוני המועדון"</h4>
      <label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">כותרת משנה</label>
      <input id="news-subtitle-input" value="${subtitle.replace(/"/g,'&quot;')}" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;box-sizing:border-box;margin-bottom:16px">
      <label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px">קטגוריות (נושאים)</label>
      <div id="news-categories-list"></div>
      <button onclick="addNewsCategory()" style="margin-top:6px;background:none;border:1px dashed rgba(255,255,255,.3);color:inherit;border-radius:8px;padding:7px 14px;font-size:12px;cursor:pointer;font-family:inherit">+ הוסף קטגוריה</button>
      <div style="margin-top:14px"><button onclick="saveNewsSettings()" style="background:#f97316;color:white;border:none;border-radius:8px;padding:9px 20px;font-weight:700;cursor:pointer;font-family:inherit;font-size:13px">💾 שמור הגדרות</button></div>
    </div>`;
}

function renderNewsCategoriesList() {
  const wrap = document.getElementById('news-categories-list');
  if (!wrap) return;
  wrap.innerHTML = _nsCatDraft.map((c, i) => `
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
      <input value="${(c.name||'').replace(/"/g,'&quot;')}" oninput="_nsCatDraft[${i}].name=this.value" style="flex:1;padding:7px 9px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:13px;box-sizing:border-box">
      ${c.id === DEFAULT_NEWS_CATEGORY.id
        ? '<span style="font-size:11px;opacity:.5;padding:0 6px;white-space:nowrap">ברירת מחדל</span>'
        : `<button onclick="removeNewsCategory(${i})" title="מחיקה" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:16px">✕</button>`}
    </div>`).join('');
}
window.addNewsCategory = function() {
  _nsCatDraft.push({ id: 'cat' + Date.now(), name: '', order: _nsCatDraft.length });
  renderNewsCategoriesList();
};
window.removeNewsCategory = function(i) {
  if (!confirm('למחוק את הקטגוריה? עדכונים תחתיה יעברו ל"' + DEFAULT_NEWS_CATEGORY.name + '"')) return;
  _nsCatDraft.splice(i, 1);
  renderNewsCategoriesList();
};

window.saveNewsSettings = async function() {
  const subtitle = (document.getElementById('news-subtitle-input').value || '').trim();
  const catsObj = {};
  _nsCatDraft.forEach((c, i) => {
    const name = (c.name || '').trim() || (c.id === DEFAULT_NEWS_CATEGORY.id ? DEFAULT_NEWS_CATEGORY.name : '');
    if (name) catsObj[c.id] = { name, order: i };
  });
  if (!catsObj[DEFAULT_NEWS_CATEGORY.id]) catsObj[DEFAULT_NEWS_CATEGORY.id] = { name: DEFAULT_NEWS_CATEGORY.name, order: 0 }; // never fully removable — posts fall back to it
  try {
    await db.ref('siteContent/newsSettings').set(subtitle ? { subtitle } : null);
    await db.ref('siteContent/newsCategories').set(catsObj);
    // Any post whose category no longer exists (deleted just now) falls back
    // to the default category rather than becoming invisible/uncategorized.
    const validIds = new Set(Object.keys(catsObj));
    const postsSnap = await db.ref('newsPosts').get();
    const updates = {};
    if (postsSnap.exists()) postsSnap.forEach(c => { // block body — see the forEach note on ensureActivitiesData
      const cid = newsEffectiveCategoryId(c.val());
      if (!validIds.has(cid)) updates[c.key + '/categoryId'] = DEFAULT_NEWS_CATEGORY.id;
    });
    if (Object.keys(updates).length) await db.ref('newsPosts').update(updates);
    _newsCategories = null; _newsSettings = null; _activitiesData = null;
    showToast('✅ ההגדרות נשמרו!');
    loadNewsAdmin();
  } catch (e) { showToast('❌ שגיאה: ' + e.message); }
};

window.toggleNewsArchived = async function(postId, archived) {
  try {
    await db.ref('newsPosts/'+postId+'/archived').set(archived);
    _activitiesData = null;
    loadNewsAdmin();
    showToast(archived ? '📦 הועבר לארכיון' : '↩️ הוחזר מהארכיון');
  } catch (e) { showToast('❌ שגיאה: ' + e.message); }
};

// Photos staged for whichever עדכון modal is currently open — kept out of
// the DOM (not round-tripped through a hidden input's value) since a set of
// compressed photos as inline HTML would be a very large attribute. Same
// reasoning as _slImg1/_slImg2 for the season-launch section.
let _nmPhotos = [];

window.openNewsModal = async function(postId) {
  await ensureNewsCategoriesAndSettings();
  let post = {};
  if (postId) { const s = await db.ref('newsPosts/'+postId).get(); if (s.exists()) post = s.val(); }
  const existImg = post.imageData || '';
  const hasFull = newsPostHasFullContent(post);
  const currentCat = newsEffectiveCategoryId(post);
  const catOptionsHtml = (_newsCategories || [{ ...DEFAULT_NEWS_CATEGORY }])
    .map(c => `<option value="${c.id}"${c.id === currentCat ? ' selected' : ''}>${c.name}</option>`).join('');
  _nmPhotos = post.photos ? post.photos.slice() : [];
  const modal = document.createElement('div');
  modal.className = 'modal-overlay open'; modal.style.cssText = 'z-index:9999;padding:20px';
  modal.onclick = e => { if (e.target===modal) modal.remove(); };
  modal.innerHTML = `
    <div style="background:var(--bg-card);border-radius:16px;max-width:580px;width:100%;padding:28px;direction:rtl;max-height:90vh;overflow-y:auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px">
        <h3 style="margin:0">${postId ? 'עריכת עדכון' : 'עדכון חדש'}</h3>
        <button onclick="this.closest('.modal-overlay').remove()" style="background:none;border:none;font-size:22px;cursor:pointer;color:inherit">✕</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div><label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">כותרת</label>
          <input id="nm-title" value="${(post.title||'').replace(/"/g,'&quot;')}" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;box-sizing:border-box"></div>
        <div><label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">תאריך</label>
          <input id="nm-date" type="date" value="${post.date||''}" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;box-sizing:border-box"></div>
        <div><label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">טקסט קצר (מוצג בדף הבית)</label>
          <textarea id="nm-body" rows="4" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;resize:vertical;box-sizing:border-box">${post.body||''}</textarea></div>
        <div><label style="display:block;font-size:13px;font-weight:600;margin-bottom:8px">תמונת שער</label>
          <div id="nm-img-wrap" style="margin-bottom:10px">
            ${existImg ? `<img src="${existImg}" style="width:100%;height:180px;object-fit:cover;border-radius:10px">` : `<div style="height:100px;background:rgba(255,255,255,.06);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:36px">📷</div>`}
          </div>
          <input type="file" accept="image/*" onchange="previewNewsImg(this)" style="font-size:13px;color:inherit">
          <input type="hidden" id="nm-img-new" value="">
          <input type="hidden" id="nm-img-keep" value="${existImg ? '1' : ''}"></div>
        <div><label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">🏷️ קטגוריה</label>
          <select id="nm-category" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;box-sizing:border-box">${catOptionsHtml}</select></div>
        <div style="display:flex;align-items:center;gap:10px">
          <input type="checkbox" id="nm-active" ${post.active===false?'':'checked'} style="width:16px;height:16px">
          <label for="nm-active" style="font-size:14px;cursor:pointer">מוצג בקרוסלת עדכוני דף הבית</label></div>
        <div style="display:flex;align-items:center;gap:10px">
          <input type="checkbox" id="nm-archived" ${post.archived?'checked':''} style="width:16px;height:16px">
          <label for="nm-archived" style="font-size:14px;cursor:pointer">📦 בארכיון (לא מוצג ברשימת העדכונים השוטפת)</label></div>
        <div><label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">סדר הצגה בקרוסלה (0 = ראשון)</label>
          <input id="nm-order" type="number" value="${post.order||0}" min="0" style="width:80px;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px"></div>
        <div><label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">&#x1F517; קישור לפוסט בפייסבוק (אופציונלי)</label>
          <input id="nm-link" value="${(post.link||'').replace(/"/g,'&quot;')}" placeholder="https://www.facebook.com/..." style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;box-sizing:border-box"></div>
        <div><label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">&#x1F517; קישור לפוסט באינסטגרם (אופציונלי)</label>
          <input id="nm-link-ig" value="${(post.linkIg||'').replace(/"/g,'&quot;')}" placeholder="https://www.instagram.com/..." style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;box-sizing:border-box"></div>

        <div style="border-top:1px dashed rgba(255,255,255,.2);padding-top:16px;margin-top:4px">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;font-weight:700;margin-bottom:14px">
            <input type="checkbox" id="nm-expand-toggle" ${hasFull ? 'checked' : ''} onchange="document.getElementById('nm-expanded-fields').style.display=this.checked?'flex':'none'" style="width:16px;height:16px">
            📖 הוסף פרטים מלאים ותמונות — הופך לסקירה מלאה באתר
          </label>
          <div id="nm-expanded-fields" style="display:${hasFull ? 'flex' : 'none'};flex-direction:column;gap:14px">
            <div><label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">טקסט מלא</label>
              <textarea id="nm-fullbody" rows="8" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;resize:vertical;box-sizing:border-box">${post.fullBody||''}</textarea></div>
            <div><label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">תמונות נוספות</label>
              <div id="nm-photos-list"></div>
            </div>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:12px;margin-top:26px;justify-content:flex-end">
        <button onclick="this.closest('.modal-overlay').remove()" style="background:rgba(255,255,255,.1);border:none;border-radius:8px;padding:10px 20px;cursor:pointer;color:inherit;font-size:14px">ביטול</button>
        <button onclick="saveNewsPost('${postId||''}')" style="background:#f97316;color:white;border:none;border-radius:8px;padding:10px 22px;cursor:pointer;font-weight:700;font-size:14px">💾 שמור</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  renderNmPhotosList();
};

window.previewNewsImg = async function(input) {
  if (!input.files[0]) return;
  const dataUrl = await compressImage(input.files[0]);
  document.getElementById('nm-img-new').value = dataUrl;
  document.getElementById('nm-img-keep').value = '';
  const wrap = document.getElementById('nm-img-wrap');
  if (wrap) wrap.innerHTML = `<img src="${dataUrl}" style="width:100%;height:180px;object-fit:cover;border-radius:10px">`;
};

function renderNmPhotosList() {
  const wrap = document.getElementById('nm-photos-list');
  if (!wrap) return;
  wrap.innerHTML = _nmPhotos.map((p, i) => `
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
      <img src="${p.imageData}" style="width:56px;height:40px;object-fit:cover;border-radius:6px;flex-shrink:0">
      <input value="${(p.caption||'').replace(/"/g,'&quot;')}" oninput="_nmPhotos[${i}].caption=this.value" placeholder="כיתוב (אופציונלי)" style="flex:1;padding:7px 9px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:12px;box-sizing:border-box">
      <button onclick="removeNmPhoto(${i})" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:16px;flex-shrink:0">✕</button>
    </div>`).join('') +
    '<input type="file" accept="image/*" onchange="addNmPhoto(this)" style="font-size:12px;color:inherit">';
}
window.addNmPhoto = async function(input) {
  if (!input.files[0]) return;
  const data = await compressImage(input.files[0], 1100, 0.85);
  _nmPhotos.push({ imageData: data, caption: '' });
  renderNmPhotosList();
};
window.removeNmPhoto = function(i) { _nmPhotos.splice(i, 1); renderNmPhotosList(); };

window.saveNewsPost = async function(postId) {
  const title  = (document.getElementById('nm-title').value||'').trim();
  const date   = document.getElementById('nm-date').value;
  const body   = (document.getElementById('nm-body').value||'').trim();
  const imgNew = document.getElementById('nm-img-new').value;
  const imgKeep= document.getElementById('nm-img-keep').value;
  const active = document.getElementById('nm-active').checked;
  const archived = document.getElementById('nm-archived').checked;
  const categoryId = document.getElementById('nm-category').value || DEFAULT_NEWS_CATEGORY.id;
  const order  = parseInt(document.getElementById('nm-order').value)||0;
  const link   = (document.getElementById('nm-link')?.value||'').trim();
  const linkIg = (document.getElementById('nm-link-ig')?.value||'').trim();
  const expanded = document.getElementById('nm-expand-toggle').checked;
  const data   = { title, date, body, active, archived, categoryId, order, updatedAt: Date.now() };
  data.link = link || null;
  data.linkIg = linkIg || null;
  // Unchecking "add full details" demotes an existing recap back to a plain
  // short post, regardless of whatever text/photos are still sitting in the
  // (now hidden) expanded fields — the checkbox is the single source of truth.
  data.fullBody = expanded ? ((document.getElementById('nm-fullbody').value||'').trim() || null) : null;
  data.photos = expanded && _nmPhotos.length ? _nmPhotos.slice() : null;
  if (imgNew)       data.imageData = imgNew;
  else if (imgKeep && postId) { const s = await db.ref('newsPosts/'+postId+'/imageData').get(); if (s.exists()) data.imageData = s.val(); }
  try {
    if (postId) await db.ref('newsPosts/'+postId).update(data);
    else { data.createdAt = Date.now(); await db.ref('newsPosts').push(data); }
    document.querySelector('.modal-overlay.open')?.remove();
    _activitiesData = null; // stale — force a refetch next time the archive page opens
    loadNewsAdmin(); loadNewsCarousel();
    showToast('✅ העדכון נשמר!');
  } catch(e) { showToast('❌ שגיאה: ' + e.message); }
};

window.deleteNewsPost = async function(postId) {
  if (!confirm('למחוק את העדכון לצמיתות?')) return;
  try {
    await db.ref('newsPosts/'+postId).remove();
    _activitiesData = null;
    loadNewsAdmin(); loadNewsCarousel();
    showToast('🗑️ העדכון נמחק');
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
    if (d.tournaments) renderTournamentsContent(d.tournaments);
    if (d.contact) renderContactContent(d.contact);
    if (d.seasonLaunch) renderSeasonLaunchContent(d.seasonLaunch);
  } catch(e) { console.warn('loadSiteContent:', e); }
}
window.loadSiteContent = loadSiteContent;

function renderAboutContent(data) {
  if (data.stats) {
    const bar = document.getElementById('home-stats-bar');
    if (bar) {
      bar.innerHTML = data.stats.map(function(s) {
        return '<div class="stat-item"><div class="stat-num">' + (s.num||'') + '</div><div class="stat-label">' + (s.label||'') + '</div></div>';
      }).join('');
    }
  }
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

let _testiPages = [], _testiIdx = 0, _testiTimer = null;
const TESTI_PER_PAGE = 3;

function renderTestimonialsContent(data) {
  const inner = document.getElementById('home-testimonials-grid');
  const dotsEl = document.getElementById('testi-dots');
  const wrap = inner ? inner.closest('.testi-wrap') : null;
  if (!inner) return;
  const items = Object.values(data).filter(function(t){ return t.active !== false; });
  items.sort(function(a,b){ return (a.order||99)-(b.order||99); });

  _testiPages = [];
  for (let i = 0; i < items.length; i += TESTI_PER_PAGE) _testiPages.push(items.slice(i, i + TESTI_PER_PAGE));

  inner.innerHTML = _testiPages.map(function(page) {
    return '<div class="testi-page testimonials-grid">' + page.map(function(t) {
      const initial = (t.name||'?').charAt(0);
      return '<div class="testimonial-card">' +
        '<div class="testimonial-quote">“</div>' +
        '<div class="testimonial-text">' + (t.text||'') + '</div>' +
        '<div class="testimonial-author">' +
          '<div class="testimonial-avatar">' + initial + '</div>' +
          '<div><div class="testimonial-name">' + (t.name||'') + '</div>' +
          '<div class="testimonial-role">' + (t.role||'') + '</div></div>' +
        '</div></div>';
    }).join('') + '</div>';
  }).join('');

  const multiPage = _testiPages.length > 1;
  if (wrap) wrap.querySelectorAll('.testi-arrow').forEach(function(b) { b.style.display = multiPage ? '' : 'none'; });
  if (dotsEl) {
    dotsEl.innerHTML = multiPage ? _testiPages.map(function(_, i) {
      return '<button class="testi-dot' + (i===0?' active':'') + '" onclick="testiGoTo(' + i + ')"></button>';
    }).join('') : '';
  }
  testiGoTo(0);
  startTestiTimer();
}

function testiGoTo(i) {
  if (!_testiPages.length) return;
  _testiIdx = ((i % _testiPages.length) + _testiPages.length) % _testiPages.length;
  const inner = document.getElementById('home-testimonials-grid');
  if (inner) inner.style.transform = 'translateX(' + (_testiIdx * -100) + '%)';
  document.querySelectorAll('.testi-dot').forEach(function(d, j) { d.classList.toggle('active', j === _testiIdx); });
}
window.testiGoTo = testiGoTo;
window.testiNav  = function(dir) { testiGoTo(_testiIdx + dir); restartTestiTimer(); };

function startTestiTimer()   { clearInterval(_testiTimer); if (_testiPages.length > 1) _testiTimer = setInterval(function(){ testiGoTo(_testiIdx + 1); }, 6000); }
function restartTestiTimer() { startTestiTimer(); }

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

// "עונת החוגים" homepage banner. The section's raw HTML already ships with
// real default title/subtitle/images (the two flyer JPEGs converted from the
// club's PDF) — this only overrides them once actual siteContent/seasonLaunch
// data exists, and toggles the whole section on/off, exactly like every other
// homepage section here.
function renderSeasonLaunchContent(data) {
  const sec = document.getElementById('season-launch-section');
  if (!sec) return;
  if (data.active === false) { sec.style.display = 'none'; return; }
  sec.style.display = '';
  const titleEl = document.getElementById('season-launch-title');
  if (titleEl && data.title) titleEl.textContent = data.title;
  const subEl = document.getElementById('season-launch-subtitle');
  if (subEl && data.subtitle) subEl.textContent = data.subtitle;
  const ctaEl = document.getElementById('season-launch-cta');
  if (ctaEl) {
    if (data.ctaText) ctaEl.textContent = data.ctaText;
    // Same club WhatsApp number the site's other wa.me links use (see
    // applyWaMessage in auth-dashboard.js) — only the message text differs,
    // and is specific to this button rather than the per-page floating one.
    const waMsg = data.waMessage || SEASON_LAUNCH_DEFAULTS.waMessage;
    ctaEl.href = 'https://wa.me/972559573758?text=' + encodeURIComponent(waMsg);
  }
  [1, 2].forEach(function(n) {
    const key = 'image' + n;
    if (!data[key]) return;
    const img = document.getElementById('season-launch-img' + n);
    if (img) img.src = data[key];
  });
}

// ── Full-site lightbox for the two flyer images (see index.html for the
// overlay markup) — reads whatever is currently in the #season-launch-imgN
// <img> tags, so it automatically reflects an admin-uploaded replacement
// image too, with nothing to keep in sync separately. ──
let _slLightboxIdx = 0;
window.openSeasonLightbox = function(n) {
  _slLightboxIdx = n - 1;
  _updateSeasonLightboxImg();
  const box = document.getElementById('season-lightbox');
  if (box) box.classList.add('open');
};
window.seasonLightboxNav = function(dir) {
  _slLightboxIdx = (_slLightboxIdx + dir + 2) % 2;
  _updateSeasonLightboxImg();
};
window.closeSeasonLightbox = function() {
  const box = document.getElementById('season-lightbox');
  if (box) box.classList.remove('open');
};
function _updateSeasonLightboxImg() {
  const src = document.getElementById('season-launch-img' + (_slLightboxIdx + 1))?.src;
  const img = document.getElementById('season-lightbox-img');
  if (img && src) img.src = src;
}

function renderTournamentsContent(data) {
  const grid = document.getElementById('tourn-cards-grid');
  if (grid && data.cards) {
    const items = Object.values(data.cards).filter(function(c){ return c.active !== false; });
    items.sort(function(a,b){ return (a.order||99)-(b.order||99); });
    grid.innerHTML = items.map(function(c) {
      return '<div class="tourn-card">' +
        '<div class="tourn-card-icon">' + (c.icon||'♟️') + '</div>' +
        '<div class="tourn-card-name">' + (c.name||'') + '</div>' +
        '<div class="tourn-card-when">' + (c.when||'') + '</div>' +
        '<div class="tourn-card-desc">' + (c.desc||'') + '</div>' +
        '<span class="tourn-card-badge badge-' + (c.badgeType||'open') + '">' + (c.badge||'') + '</span>' +
        '</div>';
    }).join('');
  }
  const linkText = document.getElementById('tourn-fed-link-text');
  if (linkText && data.fedLinkText) linkText.textContent = data.fedLinkText;
  const linkBtn = document.getElementById('tourn-fed-link-btn');
  if (linkBtn && data.fedLinkLabel) linkBtn.textContent = '🔗 ' + data.fedLinkLabel;
  if (linkBtn && data.fedLinkUrl) linkBtn.href = data.fedLinkUrl;

  // Hidden until a real WhatsApp invite link is set from the portal — no
  // placeholder link, so nothing broken/fake ever shows on the public site.
  const waSection = document.getElementById('tourn-wa-link-section');
  if (waSection) {
    if (data.waLinkUrl) {
      waSection.style.display = '';
      const waText = document.getElementById('tourn-wa-link-text');
      if (waText && data.waLinkText) waText.textContent = data.waLinkText;
      const waBtn = document.getElementById('tourn-wa-link-btn');
      if (waBtn) {
        waBtn.href = data.waLinkUrl;
        if (data.waLinkLabel) waBtn.textContent = '💬 ' + data.waLinkLabel;
      }
    } else {
      waSection.style.display = 'none';
    }
  }
}

function renderContactContent(data) {
  if (data.waPhone) {
    const link = document.getElementById('cc-wa-link');
    if (link) link.href = 'https://wa.me/' + data.waPhone + (data.waMessage ? '?text=' + encodeURIComponent(data.waMessage) : '');
  }
  if (data.waDisplayPhone) {
    const el = document.getElementById('cc-wa-display-phone');
    if (el) el.textContent = data.waDisplayPhone;
  }
  if (data.address) {
    const addrEl = document.getElementById('cc-address');
    if (addrEl) addrEl.textContent = data.address;
    const wazeLink = document.getElementById('cc-waze-link');
    if (wazeLink) wazeLink.href = 'https://waze.com/ul?q=' + encodeURIComponent(data.address) + '&navigate=yes';
    const mapFrame = document.getElementById('cc-map-iframe');
    if (mapFrame) mapFrame.src = 'https://maps.google.com/maps?q=' + encodeURIComponent(data.address) + '&output=embed&hl=he&z=16';
  }
  if (data.hours) {
    const hoursEl = document.getElementById('cc-hours');
    if (hoursEl) hoursEl.textContent = data.hours;
  }
  if (data.facebookUrl) {
    const fb = document.getElementById('cc-fb-link');
    if (fb) fb.href = data.facebookUrl;
  }
  if (data.instagramUrl) {
    const ig = document.getElementById('cc-ig-link');
    if (ig) ig.href = data.instagramUrl;
  }
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
    ['about','achievements','testimonials','gallery','seasonLaunch'].map(function(sec) {
      const labels = {about:'על המועדון',achievements:'הישגים',testimonials:'המלצות',gallery:'גלריה',seasonLaunch:'עונת החוגים'};
      const icons  = {about:'📖',achievements:'🏆',testimonials:'💬',gallery:'📸',seasonLaunch:'🎉'};
      return '<button onclick="showSiteSec(\'' + sec + '\')" id="sec-btn-' + sec + '" style="padding:9px 18px;border-radius:8px;border:2px solid rgba(255,255,255,.2);background:transparent;color:inherit;cursor:pointer;font-family:inherit;font-size:14px;font-weight:600">' +
        icons[sec] + ' ' + labels[sec] + '</button>';
    }).join('') +
    '</div>' +
    '<div id="sec-about" class="site-sec-panel" style="display:none">' + renderAboutAdmin(d.about) + '</div>' +
    '<div id="sec-achievements" class="site-sec-panel" style="display:none">' + renderAchievementsAdmin(d.achievements) + '</div>' +
    '<div id="sec-testimonials" class="site-sec-panel" style="display:none">' + renderTestimonialsAdmin(d.testimonials) + '</div>' +
    '<div id="sec-gallery" class="site-sec-panel" style="display:none">' + renderGalleryAdmin(d.gallery) + '</div>' +
    '<div id="sec-seasonLaunch" class="site-sec-panel" style="display:none">' + renderSeasonLaunchAdmin(d.seasonLaunch) + '</div>';

  showSiteSec('about');
};

// ---- Tournaments admin (own top-level portal card, not nested under "עמוד הבית") ----
window.loadSiteTournamentsAdmin = async function() {
  const el = document.getElementById('site-tournaments-admin-container');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:30px;opacity:.5">⏳ טוען...</div>';
  let data = {};
  try { const s = await db.ref('siteContent/tournaments').get(); if (s.exists()) data = s.val(); } catch(e) {}
  el.innerHTML = '<h3 style="margin:0 0 20px;font-size:18px">🏆 ניהול תחרויות במועדון</h3>' + renderTournamentsAdmin(data);
};

// ---- Contact admin (own top-level portal card, not nested under "עמוד הבית") ----
window.loadSiteContactAdmin = async function() {
  const el = document.getElementById('site-contact-admin-container');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:30px;opacity:.5">⏳ טוען...</div>';
  let data = {};
  try { const s = await db.ref('siteContent/contact').get(); if (s.exists()) data = s.val(); } catch(e) {}
  el.innerHTML = '<h3 style="margin:0 0 20px;font-size:18px">☎️ ניהול פרטי יצירת קשר</h3>' + renderContactAdmin(data);
};

// ---- WhatsApp messages admin (per public page + free-form extras) ----
const WA_BUILTIN_PAGES = [
  { key: 'home',        label: 'עמוד הבית' },
  { key: 'clubs',       label: 'חוגים במועדון' },
  { key: 'tournaments', label: 'תחרויות במועדון' },
  { key: 'calendar',    label: 'לוח פעילויות' },
  { key: 'people',      label: 'אנשי המועדון' },
  { key: 'contact',     label: 'צרו קשר' },
];
let _waCustomList = []; // [{id, label, message}] — extra named messages not tied to a page yet

window.loadSiteWhatsappAdmin = async function() {
  const el = document.getElementById('site-whatsapp-admin-container');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:30px;opacity:.5">⏳ טוען...</div>';
  let msgs = {}, custom = {};
  try {
    const [s1, s2] = await Promise.all([
      db.ref('siteContent/whatsappMessages').get(),
      db.ref('siteContent/whatsappCustom').get(),
    ]);
    if (s1.exists()) msgs = s1.val();
    if (s2.exists()) custom = s2.val();
  } catch(e) {}
  _waCustomList = Object.entries(custom).map(([id, c]) => ({ id, ...c }));
  el.innerHTML = '<h3 style="margin:0 0 6px;font-size:18px">💬 ניהול הודעות WhatsApp</h3>' +
    '<div style="font-size:12px;opacity:.65;margin-bottom:18px;line-height:1.6">' +
    'ההודעה שנשלחת בלחיצה על כפתור הוואטסאפ באתר משתנה לפי העמוד בו הגולש נמצא. ' +
    'עמוד שתשאיר ריק ישתמש בהודעת "עמוד הבית".' +
    '</div>' +
    renderWhatsappAdmin(msgs);
  renderWaCustomList();
};

function renderWhatsappAdmin(msgs) {
  msgs = msgs || {};
  const rows = WA_BUILTIN_PAGES.map(p => (
    '<div style="margin-bottom:14px">' +
    '<label style="font-size:13px;font-weight:700;display:block;margin-bottom:4px">' + p.label + '</label>' +
    '<textarea id="wa-msg-' + p.key + '" rows="2" placeholder="' + (p.key === 'home' ? DEFAULT_WA_MESSAGE_ADMIN_HINT : 'ריק = ישתמש בהודעת עמוד הבית') + '" ' +
    'style="width:100%;box-sizing:border-box;border-radius:8px;padding:8px 10px;font-family:inherit;font-size:13px;resize:vertical">' +
    (msgs[p.key] || '') + '</textarea>' +
    '</div>'
  )).join('');

  return rows +
    '<div style="margin:6px 0 26px"><button onclick="saveWaMessages()" style="background:#25d366;color:white;border:none;border-radius:8px;padding:9px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">💾 שמור הודעות עמודים</button></div>' +
    '<h4 style="margin:0 0 4px;font-size:14px">➕ הודעות נוספות</h4>' +
    '<div style="font-size:12px;opacity:.6;margin-bottom:10px;line-height:1.6">' +
    'למקרים שאינם עמוד קיים באתר (למשל כפתור עתידי או אירוע מיוחד) — נשמרות כאן לעריכה, אך כל שימוש חדש בהן דורש חיווט קטן בקוד.' +
    '</div>' +
    '<div id="wa-custom-list"></div>' +
    '<button onclick="addWaCustom()" style="background:none;border:1px dashed rgba(255,255,255,.3);color:inherit;border-radius:8px;padding:8px 16px;font-size:13px;cursor:pointer;font-family:inherit;margin-top:6px">+ הוסף הודעה נוספת</button>' +
    '<div style="margin-top:14px"><button onclick="saveWaCustom()" style="background:#553c9a;color:white;border:none;border-radius:8px;padding:9px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">💾 שמור הודעות נוספות</button></div>';
}
const DEFAULT_WA_MESSAGE_ADMIN_HINT = 'ריק = "שלום, אני מעוניין לשמוע עוד על מועדון השחמט"';

function renderWaCustomList() {
  const wrap = document.getElementById('wa-custom-list');
  if (!wrap) return;
  wrap.innerHTML = _waCustomList.length ? _waCustomList.map(c => (
    '<div style="margin-bottom:14px;border-top:1px dashed rgba(255,255,255,.15);padding-top:12px">' +
    '<div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">' +
    '<input value="' + (c.label||'').replace(/"/g,'&quot;') + '" oninput="updateWaCustomField(\'' + c.id + '\',\'label\',this.value)" ' +
    'placeholder="שם (לדוגמה: מחנות קיץ)" style="flex:1;border-radius:8px;padding:6px 10px;font-family:inherit;font-size:13px">' +
    '<button onclick="removeWaCustom(\'' + c.id + '\')" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:16px">🗑</button>' +
    '</div>' +
    '<textarea rows="2" oninput="updateWaCustomField(\'' + c.id + '\',\'message\',this.value)" ' +
    'style="width:100%;box-sizing:border-box;border-radius:8px;padding:8px 10px;font-family:inherit;font-size:13px;resize:vertical">' + (c.message||'') + '</textarea>' +
    '</div>'
  )).join('') : '<div style="font-size:12px;opacity:.5">אין הודעות נוספות עדיין</div>';
}

window.updateWaCustomField = function(id, field, value) {
  const item = _waCustomList.find(c => c.id === id);
  if (item) item[field] = value;
};

window.addWaCustom = function() {
  _waCustomList.push({ id: 'wa' + Date.now(), label: '', message: '' });
  renderWaCustomList();
};

window.removeWaCustom = function(id) {
  _waCustomList = _waCustomList.filter(c => c.id !== id);
  renderWaCustomList();
};

window.saveWaMessages = async function() {
  const obj = {};
  WA_BUILTIN_PAGES.forEach(p => {
    const v = document.getElementById('wa-msg-' + p.key)?.value?.trim();
    if (v) obj[p.key] = v;
  });
  try {
    await db.ref('siteContent/whatsappMessages').set(Object.keys(obj).length ? obj : null);
    if (window.invalidateWaMessagesCache) window.invalidateWaMessagesCache();
    showToast('הודעות ה-WhatsApp נשמרו ✅');
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
};

window.saveWaCustom = async function() {
  const obj = {};
  _waCustomList.forEach(c => { if ((c.label||'').trim() || (c.message||'').trim()) obj[c.id] = { label: c.label||'', message: c.message||'' }; });
  try {
    await db.ref('siteContent/whatsappCustom').set(Object.keys(obj).length ? obj : null);
    showToast('הודעות נוספות נשמרו ✅');
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
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
    'מועדון השחמט ראשון לציון, הפועל ברחוב בן גוריון 44, הוא אחד ממועדוני השחמט הוותיקים והגדולים בישראל — פעיל מאז <strong>1938</strong>. המועדון מציע חוגים לכל הגילאים והרמות, מגן חובה ועד שחקנים בעלי דרגות בינלאומיות.',
    'הצוות שלנו מורכב ממדריכים מנוסים ומוסמכים ברמה הארצית והבינלאומית — החל מרב אומן בכיר, אומנים בכירים ועד למדריכי נוער צעירים. כל אחד מביא עמו שיטות הוראה מתקדמות ותשוקה אמיתית לשחמט.',
    'בוגרי המועדון זכו באליפויות ארץ לנוער, השתתפו בתחרויות בינלאומיות והגיעו לדרגות פידה יוקרתיות. אנחנו גאים בכל שחקן שגדל אצלנו — בין אם ממשיך לתחרויות ברמה גבוהה ובין אם פשוט נהנה לשחק שחמט בחברה טובה.'
  ];
  const stats = data && data.stats ? data.stats : [
    { num:'1938', label:'שנת ייסוד' },
    { num:'45',   label:'קבוצות פעילות' },
    { num:'60+',  label:'בתי ספר וגנים בתוכניות בוקר' },
    { num:'100+', label:'תלמידים בחוגי המועדון' }
  ];
  return '<h4 style="margin:0 0 14px">המספרים בראש העמוד</h4>' +
    '<div id="about-stats-list" style="display:flex;flex-direction:column;gap:8px;margin-bottom:10px">' +
    stats.map(function(s) { return aboutStatRowHTML(s.num, s.label); }).join('') +
    '</div>' +
    '<button onclick="addAboutStat()" style="margin-bottom:20px;background:rgba(255,255,255,.08);border:1px dashed rgba(255,255,255,.3);border-radius:8px;padding:8px 16px;cursor:pointer;color:inherit;font-size:13px;width:100%">+ הוסף מספר</button>' +
    '<h4 style="margin:0 0 14px">על המועדון — עריכת פסקאות</h4>' +
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

function aboutStatRowHTML(num, label) {
  return '<div class="about-stat-row" style="display:flex;gap:8px;align-items:center">' +
    '<input class="about-stat-num" value="' + (num||'').replace(/"/g,'&quot;') + '" placeholder="מספר, למשל 45" style="width:110px;padding:9px 11px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;box-sizing:border-box">' +
    '<input class="about-stat-label" value="' + (label||'').replace(/"/g,'&quot;') + '" placeholder="תווית, למשל קבוצות פעילות" style="flex:1;padding:9px 11px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;box-sizing:border-box">' +
    '<button onclick="this.closest(\'.about-stat-row\').remove()" style="background:none;border:none;cursor:pointer;color:#fc8181;font-size:16px;padding:4px 8px" title="הסר">✕</button>' +
    '</div>';
}
window.addAboutStat = function() {
  const list = document.getElementById('about-stats-list');
  if (!list) return;
  list.insertAdjacentHTML('beforeend', aboutStatRowHTML('', ''));
};

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
  const stats = [];
  document.querySelectorAll('#about-stats-list .about-stat-row').forEach(function(row) {
    const numEl = row.querySelector('.about-stat-num');
    const labelEl = row.querySelector('.about-stat-label');
    const num = numEl ? numEl.value.trim() : '';
    const label = labelEl ? labelEl.value.trim() : '';
    if (num || label) stats.push({ num: num, label: label });
  });
  try {
    await db.ref('siteContent/about').set({ paragraphs: paras, stats: stats });
    renderAboutContent({ paragraphs: paras, stats: stats });
    showToast('✅ "על המועדון" נשמר!');
  } catch(e) { showToast('❌ ' + e.message); }
};

function renderAchievementsAdmin(data) {
  const defaults = [
    { icon:'👑', num:'6', label:'אליפויות ליגת נשים ברצף', desc:'קבוצת הנשים שלנו — מהחזקות בישראל עם 10 אליפויות ב-12 שנים האחרונות', active:true, order:0 },
    { icon:'🥉', num:'מדליית ארד', label:'ליגת העל הגברים', desc:'קבוצת הגברים עם גרנד מאסטרים בליגה הלאומית הגבוהה ביותר', active:true, order:1 },
    { icon:'🏫', num:'58', label:'גנים ובתי ספר', desc:'תוכנית "מסע לעולם השחמט" — חינוך שחמט ב-40 גנים ו-18 בתי ספר בראשון לציון', active:true, order:2 },
    { icon:'⭐', num:'GM, IM, FM', label:'בוגרים בעלי דרגות', desc:'בוגרי המועדון הגיעו לדרגות הבינלאומיות היוקרתיות ביותר בשחמט', active:true, order:3 },
    { icon:'📅', num:'1938', label:'שנת ייסוד', desc:'אחד ממועדוני השחמט הוותיקים בישראל — מסורת ארוכה של מצוינות שחמטאית', active:true, order:4 },
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
    '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">אייקון</label>' + iconPickerHTML('ach-icon', a.icon, '🏆') + '</div>' +
    ['num:מספר / כותרת:0','label:תווית:','desc:תיאור:'].map(function(f){
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

// ---- Season launch admin (single settings object, not a list — closer to
// "about" than to "gallery") ----
const SEASON_LAUNCH_DEFAULTS = {
  title: 'עונת החוגים 2026–2027 יוצאת לדרך!',
  subtitle: 'מיד לאחר חופשת הסוכות — בואו להיות חלק מהמשחק',
  ctaText: '📞 לפרטים נוספים ורישום',
  waMessage: 'שלום, אני מעוניין/ת לשמוע עוד על עונת החוגים החדשה ולהירשם',
};
// Holds whatever image is currently staged for slot 1/2 (from Firebase on
// open, or freshly picked via the file input) — kept out of the DOM entirely
// rather than round-tripped through a hidden input's value attribute, since a
// compressed flyer photo as inline HTML would be a very large attribute.
let _slImg1 = null, _slImg2 = null;

function renderSeasonLaunchAdmin(data) {
  data = data || {};
  _slImg1 = data.image1 || null;
  _slImg2 = data.image2 || null;
  const active = data.active !== false;
  const title = data.title || SEASON_LAUNCH_DEFAULTS.title;
  const subtitle = data.subtitle || SEASON_LAUNCH_DEFAULTS.subtitle;
  const ctaText = data.ctaText || SEASON_LAUNCH_DEFAULTS.ctaText;
  const waMessage = data.waMessage || SEASON_LAUNCH_DEFAULTS.waMessage;
  const inputStyle = 'width:100%;padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;box-sizing:border-box';
  return '<h4 style="margin:0 0 4px">🎉 עונת החוגים — קטע בעמוד הבית</h4>' +
    '<p style="font-size:12px;opacity:.6;margin:0 0 16px">מופיע מיד אחרי "הפעילויות הקרובות". בלי שמירה כאן, הקטע מוצג עם התוכן וברירת המחדל של הפלייר.</p>' +
    '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;margin-bottom:18px;font-weight:600">' +
    '<input type="checkbox" id="sl-active"' + (active ? ' checked' : '') + ' style="width:16px;height:16px"> הצג את הקטע בעמוד הבית</label>' +
    '<div style="display:flex;flex-direction:column;gap:14px;margin-bottom:20px">' +
    '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">כותרת</label>' +
    '<input id="sl-title" value="' + title.replace(/"/g, '&quot;') + '" style="' + inputStyle + '"></div>' +
    '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">שורת משנה</label>' +
    '<input id="sl-subtitle" value="' + subtitle.replace(/"/g, '&quot;') + '" style="' + inputStyle + '"></div>' +
    '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">טקסט כפתור</label>' +
    '<input id="sl-cta" value="' + ctaText.replace(/"/g, '&quot;') + '" style="' + inputStyle + '"></div>' +
    '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">💬 הודעת WhatsApp שתיפתח בלחיצה על הכפתור</label>' +
    '<textarea id="sl-wa-message" rows="2" style="' + inputStyle + ';resize:vertical">' + waMessage.replace(/</g, '&lt;') + '</textarea></div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px">' +
    _slImageSlotHTML(1, _slImg1) +
    _slImageSlotHTML(2, _slImg2) +
    '</div>' +
    '<button onclick="saveSeasonLaunchContent()" style="background:#f97316;color:white;border:none;border-radius:8px;padding:11px 26px;cursor:pointer;font-weight:700;font-size:14px">💾 שמור</button>';
}

function _slImageSlotHTML(n, imgData) {
  const previewSrc = imgData || ('images/flyer-hogim-' + n + '.jpg');
  return '<div>' +
    '<label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px">תמונה ' + n + (imgData ? '' : ' (ברירת מחדל)') + '</label>' +
    '<div style="aspect-ratio:4/3;border-radius:10px;overflow:hidden;background:#000;margin-bottom:8px">' +
    '<img id="sl-preview-' + n + '" src="' + previewSrc + '" style="width:100%;height:100%;object-fit:cover">' +
    '</div>' +
    '<input type="file" accept="image/*" onchange="previewSeasonLaunchImg(this,' + n + ')" style="font-size:12px;color:inherit">' +
    '</div>';
}

window.previewSeasonLaunchImg = async function(input, n) {
  if (!input.files[0]) return;
  const data = await compressImage(input.files[0], 1400, 0.85); // flyers carry small schedule text — matches the default images' resolution
  if (n === 1) _slImg1 = data; else _slImg2 = data;
  const prev = document.getElementById('sl-preview-' + n);
  if (prev) prev.src = data;
};

window.saveSeasonLaunchContent = async function() {
  const data = {
    active: document.getElementById('sl-active').checked,
    title: document.getElementById('sl-title').value.trim(),
    subtitle: document.getElementById('sl-subtitle').value.trim(),
    ctaText: document.getElementById('sl-cta').value.trim(),
    waMessage: document.getElementById('sl-wa-message').value.trim(),
    image1: _slImg1 || null,
    image2: _slImg2 || null,
  };
  try {
    await db.ref('siteContent/seasonLaunch').set(data);
    renderSeasonLaunchContent(data);
    showToast('✅ נשמר!');
  } catch (e) { showToast('❌ ' + e.message); }
};

// ---- Shared icon picker (used in achievements + tournaments card modals) ----
const ICON_PICKER_EMOJIS = ['🏆','🥇','🥈','🥉','🎖️','🏅','⭐','🌟','♟️','♞','♛','♚','♜','♝','⚔️','🎯','🔥','📈','👑','🎓','🎉','💪','🧩','📅'];
function iconPickerHTML(inputId, currentVal, defaultVal) {
  return '<input id="' + inputId + '" value="' + (currentVal || defaultVal || '').replace(/"/g,'&quot;') + '" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:16px;box-sizing:border-box;margin-bottom:8px">' +
    '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
    ICON_PICKER_EMOJIS.map(function(e) {
      return '<button type="button" onclick="document.getElementById(\'' + inputId + '\').value=\'' + e + '\'" title="' + e + '" style="width:34px;height:34px;font-size:18px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0">' + e + '</button>';
    }).join('') +
    '</div>';
}

// ---- Tournaments (עמוד "תחרויות במועדון") ----
const TOURN_BADGE_LABELS = { open:'פתוח (ירוק)', free:'ללא דירוג (כתום)', rated:'מדורג (כחול)' };

function renderTournamentsAdmin(data) {
  const defaultCards = [
    { icon:'♟️', name:'תחרות סבב שבועית', when:'כל שלישי | 18:30–22:30', desc:'תחרות פנימית קבועה בפורמט שוויצרי. פתוחה לכל שחקני המועדון.', badge:'פתוח לכל', badgeType:'open', active:true, order:0 },
    { icon:'🌟', name:'תחרות לבלתי מדורגים', when:'כל שישי | 13:30–15:00', desc:'תחרות מדורגת לשחקנים ללא דירוג FIDE. הזדמנות מצוינת לקבל דירוג רשמי ראשון.', badge:'ללא דירוג', badgeType:'free', active:true, order:1 },
    { icon:'🏅', name:'תחרות למדורגים', when:'כל שישי | 15:00–17:00', desc:'תחרות FIDE מדורגת לשחקנים בעלי דירוג. מצוין לשיפור מד הכושר הרשמי.', badge:'FIDE מדורג', badgeType:'rated', active:true, order:2 },
    { icon:'🏆', name:'ליגת ישראל', when:'כל חמישי | 18:30–22:30', desc:'משחקי ליגה רשמית מטעם איגוד השחמט הישראלי. המועדון משתתף במספר ליגות.', badge:'ליגה רשמית', badgeType:'rated', active:true, order:3 },
    { icon:'⚔️', name:'משחקי ליגה', when:'שבת | 10:00–15:00', desc:'משחקי ליגה בשבת. אווירה נהדרת של שחמט תחרותי ברמה גבוהה.', badge:'ליגה רשמית', badgeType:'rated', active:true, order:4 },
    { icon:'🎯', name:'תחרויות מיוחדות', when:'לפי לוח שנה', desc:'אליפויות מועדון, תחרויות נוער, אירועים חגיגיים ותחרויות אורחים לאורך השנה.', badge:'משתנה', badgeType:'open', active:true, order:5 },
  ];
  const cardsData = data && data.cards;
  const items = cardsData ? Object.entries(cardsData).map(function(e){ return Object.assign({_id:e[0]},e[1]); }) : defaultCards.map(function(c,i){ return Object.assign({_id:'d'+i},c); });
  items.sort(function(a,b){ return (a.order||99)-(b.order||99); });
  const fedLinkText  = (data && data.fedLinkText)  || 'לתוצאות חיות, לוחות ומידע על תחרויות רשמיות — היכנסו לאתר איגוד השחמט הישראלי';
  const fedLinkLabel = (data && data.fedLinkLabel) || 'תחרויות המועדון באיגוד';
  const fedLinkUrl   = (data && data.fedLinkUrl)   || 'https://www.chess.org.il/Clubs/Club.aspx?Id=31&View=TournamentsNow';
  // No fallback URL here on purpose — unlike the federation link above, there's
  // no real default to show until the admin actually pastes a group invite
  // link; the public box stays hidden (see renderTournamentsContent) until then.
  const waLinkText  = (data && data.waLinkText)  || 'מוזמנים להצטרף לקהילת התחרויות שלנו בוואטסאפ ולקבל עדכונים שוטפים';
  const waLinkLabel = (data && data.waLinkLabel) || 'הצטרפו לקהילת הווטסאפ';
  const waLinkUrl   = (data && data.waLinkUrl)   || '';

  return '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
    '<h4 style="margin:0">🏆 כרטיסי תחרויות</h4>' +
    '<button onclick="openTournCardModal(null)" style="background:#f97316;color:white;border:none;border-radius:8px;padding:8px 16px;cursor:pointer;font-weight:700;font-size:13px">+ הוסף תחרות</button>' +
    '</div>' +
    '<div id="tourn-admin-list" style="margin-bottom:24px">' +
    items.map(function(c) {
      return '<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:8px;background:rgba(255,255,255,.05);margin-bottom:6px">' +
        '<span style="font-size:20px">' + (c.icon||'♟️') + '</span>' +
        '<div style="flex:1">' +
          '<div style="font-weight:700">' + (c.name||'') + ' <span style="opacity:.6;font-weight:400">· ' + (c.when||'') + '</span></div>' +
          '<div style="font-size:12px;opacity:.65">' + (c.desc||'') + '</div>' +
          '<div style="font-size:11px;margin-top:3px;opacity:.8">🏷 ' + (c.badge||'') + ' (' + (TOURN_BADGE_LABELS[c.badgeType]||c.badgeType) + ')</div>' +
        '</div>' +
        '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px">' +
          '<input type="checkbox" ' + (c.active!==false?'checked':'') + ' onchange="toggleTournCard(\'' + (c._id||'') + '\',this.checked)" style="width:15px;height:15px"> פעיל</label>' +
        '<button onclick="openTournCardModal(\'' + (c._id||'') + '\')" style="background:rgba(255,255,255,.1);border:none;border-radius:6px;padding:6px 10px;cursor:pointer;color:inherit;font-size:12px">✏️</button>' +
        '<button onclick="deleteTournCard(\'' + (c._id||'') + '\')" style="background:rgba(252,129,129,.15);border:none;border-radius:6px;padding:6px 10px;cursor:pointer;color:#fc8181;font-size:12px">🗑️</button>' +
        '</div>';
    }).join('') +
    '</div>' +
    '<h4 style="margin:0 0 12px">🔗 קופסת קישור לאיגוד</h4>' +
    '<div style="display:flex;flex-direction:column;gap:12px;max-width:500px">' +
    '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">טקסט</label>' +
    '<textarea id="tourn-fedlink-text" rows="2" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;resize:vertical;box-sizing:border-box">' + fedLinkText + '</textarea></div>' +
    '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">כיתוב הכפתור</label>' +
    '<input id="tourn-fedlink-label" value="' + fedLinkLabel.replace(/"/g,'&quot;') + '" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;box-sizing:border-box"></div>' +
    '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">כתובת הקישור (URL)</label>' +
    '<input id="tourn-fedlink-url" value="' + fedLinkUrl.replace(/"/g,'&quot;') + '" dir="ltr" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;box-sizing:border-box"></div>' +
    '<button onclick="saveTournFedLink()" style="background:#f97316;color:white;border:none;border-radius:8px;padding:10px 22px;cursor:pointer;font-weight:700;font-size:14px;align-self:flex-start">💾 שמור</button>' +
    '</div>' +
    '<h4 style="margin:24px 0 4px">💬 קופסת קישור לקהילת הווטסאפ</h4>' +
    '<p style="font-size:12px;opacity:.6;margin:0 0 12px">כל עוד לא תמלא כתובת קישור, הקופסה הזו לא תוצג באתר.</p>' +
    '<div style="display:flex;flex-direction:column;gap:12px;max-width:500px">' +
    '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">טקסט</label>' +
    '<textarea id="tourn-walink-text" rows="2" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;resize:vertical;box-sizing:border-box">' + waLinkText + '</textarea></div>' +
    '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">כיתוב הכפתור</label>' +
    '<input id="tourn-walink-label" value="' + waLinkLabel.replace(/"/g,'&quot;') + '" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;box-sizing:border-box"></div>' +
    '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">קישור ההצטרפות לקבוצה (chat.whatsapp.com/...)</label>' +
    '<input id="tourn-walink-url" value="' + waLinkUrl.replace(/"/g,'&quot;') + '" placeholder="https://chat.whatsapp.com/..." dir="ltr" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;box-sizing:border-box"></div>' +
    '<button onclick="saveTournWaLink()" style="background:#25d366;color:white;border:none;border-radius:8px;padding:10px 22px;cursor:pointer;font-weight:700;font-size:14px;align-self:flex-start">💾 שמור</button>' +
    '</div>';
}

window.toggleTournCard = async function(id, val) {
  if (!id) return;
  try { await db.ref('siteContent/tournaments/cards/' + id + '/active').set(val); loadSiteContent(); }
  catch(e) { showToast('❌ ' + e.message); }
};
window.deleteTournCard = async function(id) {
  if (!id || !confirm('למחוק את התחרות?')) return;
  try { await db.ref('siteContent/tournaments/cards/' + id).remove(); loadSiteTournamentsAdmin(); loadSiteContent(); showToast('🗑️ נמחק'); }
  catch(e) { showToast('❌ ' + e.message); }
};
window.openTournCardModal = async function(id) {
  let c = {};
  if (id && id[0]!=='d') { const s = await db.ref('siteContent/tournaments/cards/'+id).get(); if(s.exists()) c=s.val(); }
  const modal = document.createElement('div');
  modal.className='modal-overlay open'; modal.style.cssText='z-index:9999;padding:20px';
  modal.onclick=function(e){ if(e.target===modal) modal.remove(); };
  modal.innerHTML='<div style="background:var(--bg-card);border-radius:16px;max-width:480px;width:100%;padding:28px;direction:rtl;max-height:90vh;overflow-y:auto">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><h3 style="margin:0">' + (id&&id[0]!=='d'?'עריכת תחרות':'תחרות חדשה') + '</h3>' +
    '<button onclick="this.closest(\'.modal-overlay\').remove()" style="background:none;border:none;font-size:22px;cursor:pointer;color:inherit">✕</button></div>' +
    '<div style="display:flex;flex-direction:column;gap:12px">' +
    '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">אייקון</label>' + iconPickerHTML('tourn-icon', c.icon, '♟️') + '</div>' +
    ['name:שם התחרות:','when:מתי (יום ושעה):','badge:כיתוב התגית:'].map(function(f){
      const p=f.split(':'); return '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">'+p[1]+'</label>' +
      '<input id="tourn-'+p[0]+'" value="'+(c[p[0]]||p[2]||'').replace(/"/g,'&quot;')+'" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;box-sizing:border-box"></div>';
    }).join('') +
    '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">תיאור</label>' +
    '<textarea id="tourn-desc" rows="3" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;resize:vertical;box-sizing:border-box">'+(c.desc||'')+'</textarea></div>' +
    '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">צבע התגית</label>' +
    '<select id="tourn-badgeType" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:var(--bg-card);color:inherit;font-family:inherit;font-size:14px">' +
    Object.keys(TOURN_BADGE_LABELS).map(function(bt){ return '<option value="'+bt+'" '+(c.badgeType===bt?'selected':'')+'>'+TOURN_BADGE_LABELS[bt]+'</option>'; }).join('') +
    '</select></div>' +
    '<div><label style="font-size:12px;font-weight:600;margin-bottom:4px;display:flex;align-items:center;gap:8px;cursor:pointer">' +
    '<input type="checkbox" id="tourn-active" '+(c.active!==false?'checked':'')+' style="width:15px;height:15px"> פעיל (מוצג)</label></div>' +
    '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">סדר</label>' +
    '<input id="tourn-order" type="number" value="'+(c.order||0)+'" style="width:70px;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px"></div>' +
    '</div><div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end">' +
    '<button onclick="this.closest(\'.modal-overlay\').remove()" style="background:rgba(255,255,255,.1);border:none;border-radius:8px;padding:9px 18px;cursor:pointer;color:inherit">ביטול</button>' +
    '<button onclick="saveTournCard(\''+(id&&id[0]!=='d'?id:'')+'\')" style="background:#f97316;color:white;border:none;border-radius:8px;padding:9px 20px;cursor:pointer;font-weight:700">💾 שמור</button>' +
    '</div></div>';
  document.body.appendChild(modal);
};
window.saveTournCard = async function(id) {
  const data = {
    icon: document.getElementById('tourn-icon').value.trim()||'♟️',
    name: document.getElementById('tourn-name').value.trim(),
    when: document.getElementById('tourn-when').value.trim(),
    badge: document.getElementById('tourn-badge').value.trim(),
    desc: document.getElementById('tourn-desc').value.trim(),
    badgeType: document.getElementById('tourn-badgeType').value,
    active: document.getElementById('tourn-active').checked,
    order: parseInt(document.getElementById('tourn-order').value)||0,
  };
  try {
    if (id) await db.ref('siteContent/tournaments/cards/'+id).update(data);
    else await db.ref('siteContent/tournaments/cards').push(data);
    document.querySelector('.modal-overlay.open')?.remove();
    loadSiteTournamentsAdmin(); loadSiteContent(); showToast('✅ נשמר!');
  } catch(e) { showToast('❌ '+e.message); }
};
// A URL typed/pasted without "http(s)://" (e.g. someone drops the "https://"
// off a WhatsApp/Facebook link) isn't a broken link on this site's end — but
// as an <a href>, the browser treats it as a path RELATIVE to the current
// page instead of an absolute address, silently pointing at a nonexistent
// local file/page instead of the real external site. Normalizing on save
// means this can't happen regardless of what gets pasted.
function normalizeExternalUrl(url) {
  url = (url || '').trim();
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : 'https://' + url;
}

window.saveTournFedLink = async function() {
  const fedLinkText  = document.getElementById('tourn-fedlink-text').value.trim();
  const fedLinkLabel = document.getElementById('tourn-fedlink-label').value.trim();
  const fedLinkUrl   = normalizeExternalUrl(document.getElementById('tourn-fedlink-url').value);
  document.getElementById('tourn-fedlink-url').value = fedLinkUrl;
  try {
    await db.ref('siteContent/tournaments').update({ fedLinkText, fedLinkLabel, fedLinkUrl });
    loadSiteContent();
    showToast('✅ נשמר!');
  } catch(e) { showToast('❌ '+e.message); }
};
window.saveTournWaLink = async function() {
  const waLinkText  = document.getElementById('tourn-walink-text').value.trim();
  const waLinkLabel = document.getElementById('tourn-walink-label').value.trim();
  const waLinkUrl   = normalizeExternalUrl(document.getElementById('tourn-walink-url').value);
  document.getElementById('tourn-walink-url').value = waLinkUrl; // shows exactly what got saved, in case it was auto-corrected
  try {
    await db.ref('siteContent/tournaments').update({ waLinkText, waLinkLabel, waLinkUrl: waLinkUrl || null });
    loadSiteContent();
    showToast(waLinkUrl ? '✅ נשמר! הקופסה תוצג באתר' : '✅ נשמר — הקופסה מוסתרת עד שתמלא קישור');
  } catch(e) { showToast('❌ '+e.message); }
};

// ---- Contact (עמוד "צרו קשר") ----
function renderContactAdmin(data) {
  const d = data || {};
  const fields = [
    { id:'waPhone',        label:'מספר וואטסאפ (בפורמט בינלאומי, ללא + או רווחים)', def:'972559573758', placeholder:'972501234567' },
    { id:'waDisplayPhone', label:'טלפון כפי שיוצג בטקסט', def:'055-957-3758' },
    { id:'address',        label:'כתובת (מעדכן גם את המפה ואת Waze אוטומטית)', def:'בן גוריון 44, ראשון לציון' },
    { id:'facebookUrl',    label:'קישור לפייסבוק', def:'https://www.facebook.com/Rishonchess' },
    { id:'instagramUrl',   label:'קישור לאינסטגרם', def:'https://www.instagram.com/rishonchess' },
  ];
  return '<h4 style="margin:0 0 16px">☎️ פרטי יצירת קשר</h4>' +
    '<div style="display:flex;flex-direction:column;gap:14px;max-width:520px">' +
    fields.map(function(f){
      return '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">'+f.label+'</label>' +
        '<input id="cc-admin-'+f.id+'" value="'+((d[f.id]!=null?d[f.id]:f.def)||'').toString().replace(/"/g,'&quot;')+'" placeholder="'+(f.placeholder||'')+'" dir="'+(f.id==='waPhone'?'ltr':'auto')+'" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;box-sizing:border-box"></div>';
    }).join('') +
    '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">הודעת וואטסאפ מוכנה מראש</label>' +
    '<textarea id="cc-admin-waMessage" rows="2" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;resize:vertical;box-sizing:border-box">'+((d.waMessage!=null?d.waMessage:'שלום, אני מעוניין לשמוע עוד על המועדון'))+'</textarea></div>' +
    '<div><label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">שעות פעילות (שורה לכל טווח)</label>' +
    '<textarea id="cc-admin-hours" rows="2" style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);color:inherit;font-family:inherit;font-size:14px;resize:vertical;box-sizing:border-box">'+((d.hours!=null?d.hours:'ראשון–שישי: 16:00–22:30\nשבת: 10:00–15:00'))+'</textarea></div>' +
    '<button onclick="saveContactContent()" style="background:#f97316;color:white;border:none;border-radius:8px;padding:10px 22px;cursor:pointer;font-weight:700;font-size:14px;align-self:flex-start">💾 שמור</button>' +
    '</div>';
}
window.saveContactContent = async function() {
  const data = {
    waPhone:        document.getElementById('cc-admin-waPhone').value.trim(),
    waDisplayPhone: document.getElementById('cc-admin-waDisplayPhone').value.trim(),
    waMessage:      document.getElementById('cc-admin-waMessage').value.trim(),
    address:        document.getElementById('cc-admin-address').value.trim(),
    hours:          document.getElementById('cc-admin-hours').value.trim(),
    facebookUrl:    document.getElementById('cc-admin-facebookUrl').value.trim(),
    instagramUrl:   document.getElementById('cc-admin-instagramUrl').value.trim(),
  };
  try {
    await db.ref('siteContent/contact').set(data);
    renderContactContent(data);
    showToast('✅ פרטי הקשר נשמרו!');
  } catch(e) { showToast('❌ '+e.message); }
};
// ===== END SITE CONTENT CMS =====
// ===== END CLUB PEOPLE =====
// ===== END NEWS POSTS =====
