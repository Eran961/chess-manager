// ===== CREATE GROUP =====

const _SG_DAY_OPTS = `<option value="">— יום —</option><option value="0">ראשון</option><option value="1">שני</option><option value="2">שלישי</option><option value="3">רביעי</option><option value="4">חמישי</option><option value="5">שישי</option>`;

function _sgDayOpts(selected) {
  const days = ['ראשון','שני','שלישי','רביעי','חמישי','שישי'];
  return `<option value="">— יום —</option>` + days.map((d,i) => `<option value="${i}"${selected===i?' selected':''}>${d}</option>`).join('');
}

function _cgSgRow(sg) {
  return `<div class="cg-sg-row" style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;padding:6px 0;border-bottom:1px solid #f0f4f8">
    <input type="text" class="modal-input cg-sg-name" value="${sg.time||''}" placeholder="שם קבוצה" style="flex:2;min-width:90px">
    <select class="modal-input cg-sg-day" style="width:90px">${_sgDayOpts(sg.day)}</select>
    <input type="text" class="modal-input cg-sg-mtime" value="${sg.meetingTime||''}" placeholder="16:00" style="width:68px" dir="ltr">
    <input type="text" class="modal-input cg-sg-loc" value="${sg.location||''}" placeholder="מיקום" style="flex:1;min-width:70px">
    <button onclick="this.closest('.cg-sg-row').remove()" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:16px;flex-shrink:0">✕</button>
  </div>`;
}

function openCreateGroupModal() {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:460px">
        <div class="modal-header">
          <span class="modal-title">➕ יצירת חוג חדש</span>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:12px">
          <div class="modal-field"><label>שם החוג <span style="color:#e53e3e">*</span></label>
            <input type="text" id="cg-name" placeholder="לדוגמה: ירון — יום שני" class="modal-input"></div>
          <div class="modal-field"><label>מדריך</label>
            <input type="text" id="cg-instructor" placeholder="שם המדריך" class="modal-input"></div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#4a5568;display:block;margin-bottom:4px">קבוצות <span style="color:#e53e3e">*</span> <span style="font-size:11px;color:#a0aec0;font-weight:400">— לכל קבוצה ניתן להגדיר יום ושעה</span></label>
            <div id="cg-subgroups" style="display:flex;flex-direction:column">${_cgSgRow({})}</div>
            <button onclick="addCgSubgroup()" style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:7px;padding:5px 12px;font-size:12px;cursor:pointer;font-family:inherit;color:#4a5568;margin-top:6px">+ הוסף קבוצה</button>
          </div>
          <button onclick="saveNewGroup()" style="background:#2b6cb0;color:white;border:none;border-radius:8px;padding:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">💾 צור חוג</button>
        </div>
      </div>
    </div>`);
}
window.openCreateGroupModal = openCreateGroupModal;

function addCgSubgroup() {
  const cont = document.getElementById('cg-subgroups');
  if (!cont) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = _cgSgRow({});
  cont.appendChild(tmp.firstElementChild);
}
window.addCgSubgroup = addCgSubgroup;

async function saveNewGroup() {
  const name = document.getElementById('cg-name')?.value?.trim();
  if (!name) { showToast('יש להזין שם חוג', 'error'); return; }
  const instructor = document.getElementById('cg-instructor')?.value?.trim() || '';
  const sgRows = document.querySelectorAll('#cg-subgroups .cg-sg-row');
  const subGroupsRaw = [...sgRows].map(row => {
    const t = row.querySelector('.cg-sg-name')?.value?.trim() || '';
    if (!t) return null;
    const dv = row.querySelector('.cg-sg-day')?.value;
    return { time: t, day: (dv !== '' && dv != null) ? parseInt(dv) : null, meetingTime: row.querySelector('.cg-sg-mtime')?.value?.trim() || '', location: row.querySelector('.cg-sg-loc')?.value?.trim() || '' };
  }).filter(Boolean);
  if (subGroupsRaw.length === 0) { showToast('יש להוסיף לפחות קבוצה אחת', 'error'); return; }
  const dayNames = ['יום ראשון','יום שני','יום שלישי','יום רביעי','יום חמישי','יום שישי'];
  const dayOfWeek = subGroupsRaw.find(sg => sg.day != null)?.day ?? 0;
  const id = name.replace(/[^a-zA-Z0-9֐-׿]/g, '-').replace(/-+/g, '-').toLowerCase() + '-' + Date.now();
  const groupDef = { name, instructor, day: dayNames[dayOfWeek] || '', dayOfWeek, subGroups: subGroupsRaw };
  try {
    await db.ref(`dbGroups/${id}`).set(groupDef);
    _useDbGroups = true;
    groups.push({ id, ...groupDef, subGroups: subGroupsRaw.map(sg => ({ ...sg, players: [] })) });
    document.querySelector('.friday-modal')?.remove();
    showToast(`החוג "${name}" נוצר ✅`);
    // Add new tab dynamically
    const tabsBar = document.getElementById('tabsBar');
    const content = document.getElementById('content');
    const gIdx = groups.length - 1;
    const g = groups[gIdx];
    const btn = document.createElement('button');
    btn.className = 'tab-btn';
    btn.dataset.tab = g.id;
    btn.textContent = g.name;
    btn.onclick = () => switchTab(g.id);
    // Insert before the non-group tabs (attendance, reports, etc.)
    const attBtn = tabsBar.querySelector('[data-tab="attendance"]');
    tabsBar.insertBefore(btn, attBtn || null);
    const panel = document.createElement('div');
    panel.className = 'tab-panel';
    panel.id = 'panel-' + g.id;
    panel.innerHTML = renderGroup(g, gIdx);
    content.appendChild(panel);
    // Refresh groups admin page, if open
    const gp = document.getElementById('panel-groups-admin');
    if (gp) gp.innerHTML = renderGroupsAdminPanel();
    // Remove "no groups" empty state if present
    const ng = content.querySelector('#panel-home:not(#panel-home)');
    // Switch to new group
    switchTab(g.id);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.saveNewGroup = saveNewGroup;

// ===== EDIT GROUP (combined name + meetings) =====

function openEditGroupModal(groupIdx) {
  const group = groups[groupIdx];
  if (!group) return;
  const dayDisplayNames = ['יום ראשון','יום שני','יום שלישי','יום רביעי','יום חמישי','יום שישי'];
  const dayOpts = dayDisplayNames.map((d,i) => `<option value="${i}"${(group.dayOfWeek||0)===i?' selected':''}>${d}</option>`).join('');
  const sgRows = (group.subGroups||[]).map((sg, i) => `
    <div class="eg-sg-row" data-idx="${i}" style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;padding:6px 0;border-bottom:1px solid #f0f4f8">
      <input type="text" class="modal-input eg-sg-name" value="${sg.time||''}" placeholder="שם קבוצה" style="flex:2;min-width:90px">
      <select class="modal-input eg-sg-day" style="width:90px">${_sgDayOpts(sg.day)}</select>
      <input type="text" class="modal-input eg-sg-mtime" value="${sg.meetingTime||''}" placeholder="16:00" style="width:68px" dir="ltr">
      <input type="text" class="modal-input eg-sg-loc" value="${sg.location||''}" placeholder="מיקום" style="flex:1;min-width:70px">
      <button onclick="this.closest('.eg-sg-row').remove()" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:16px;flex-shrink:0">✕</button>
    </div>`).join('');

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open" id="editGroupOverlay" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:500px">
        <div class="modal-header">
          <span class="modal-title">✎ עריכת חוג — ${group.name}</span>
          <button class="modal-close" onclick="document.getElementById('editGroupOverlay').remove()">✕</button>
        </div>
        <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:14px">
          <div class="modal-field"><label>שם החוג <span style="color:#e53e3e">*</span></label>
            <input type="text" id="eg-name" value="${group.name}" class="modal-input"></div>
          <div class="modal-field"><label>מדריך</label>
            <input type="text" id="eg-instructor" value="${group.instructor||''}" class="modal-input"></div>
          <div class="modal-field"><label>יום בשבוע (לנוכחות)</label>
            <select id="eg-day" class="modal-input">${dayOpts}</select></div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#4a5568;display:block;margin-bottom:4px">קבוצות <span style="color:#e53e3e">*</span> <span style="font-size:11px;color:#a0aec0;font-weight:400">— לכל קבוצה ניתן להגדיר יום ושעה</span></label>
            <div id="eg-subgroups" style="display:flex;flex-direction:column">${sgRows}</div>
            <button onclick="addEgSubgroup()" style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:7px;padding:5px 12px;font-size:12px;cursor:pointer;font-family:inherit;color:#4a5568;margin-top:6px">+ הוסף קבוצה</button>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-form-cancel" onclick="document.getElementById('editGroupOverlay').remove()">ביטול</button>
          <button class="btn-form-submit" onclick="saveEditGroup(${groupIdx})">💾 שמור שינויים</button>
        </div>
      </div>
    </div>`);
}
window.openEditGroupModal = openEditGroupModal;

function addEgSubgroup() {
  const cont = document.getElementById('eg-subgroups');
  if (!cont) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = `<div class="eg-sg-row" style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;padding:6px 0;border-bottom:1px solid #f0f4f8">
    <input type="text" class="modal-input eg-sg-name" placeholder="שם קבוצה" style="flex:2;min-width:90px">
    <select class="modal-input eg-sg-day" style="width:90px">${_sgDayOpts(null)}</select>
    <input type="text" class="modal-input eg-sg-mtime" placeholder="16:00" style="width:68px" dir="ltr">
    <input type="text" class="modal-input eg-sg-loc" placeholder="מיקום" style="flex:1;min-width:70px">
    <button onclick="this.closest('.eg-sg-row').remove()" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:16px;flex-shrink:0">✕</button>
  </div>`;
  cont.appendChild(tmp.firstElementChild);
}
window.addEgSubgroup = addEgSubgroup;

async function saveEditGroup(groupIdx) {
  const group = groups[groupIdx];
  if (!group) return;
  const name = document.getElementById('eg-name')?.value?.trim();
  if (!name) { showToast('יש להזין שם חוג', 'error'); return; }
  const instructor = document.getElementById('eg-instructor')?.value?.trim() || '';
  const dayOfWeek = parseInt(document.getElementById('eg-day')?.value || '0');
  const dayDisplayNames = ['יום ראשון','יום שני','יום שלישי','יום רביעי','יום חמישי','יום שישי'];

  const sgDivs = document.querySelectorAll('#eg-subgroups .eg-sg-row');
  const newSubGroups = [];
  sgDivs.forEach(row => {
    const val = row.querySelector('.eg-sg-name')?.value?.trim();
    if (!val) return;
    const oldIdx = row.dataset.idx != null ? parseInt(row.dataset.idx) : -1;
    const players = (oldIdx >= 0 && group.subGroups[oldIdx]) ? group.subGroups[oldIdx].players || [] : [];
    const dv = row.querySelector('.eg-sg-day')?.value;
    const day = (dv !== '' && dv != null) ? parseInt(dv) : null;
    const meetingTime = row.querySelector('.eg-sg-mtime')?.value?.trim() || '';
    const location = row.querySelector('.eg-sg-loc')?.value?.trim() || '';
    newSubGroups.push({ time: val, day, meetingTime, location, players });
  });
  if (newSubGroups.length === 0) { showToast('יש להוסיף לפחות קבוצה אחת', 'error'); return; }

  group.name = name; group.instructor = instructor;
  group.dayOfWeek = dayOfWeek; group.day = dayDisplayNames[dayOfWeek];
  group.subGroups = newSubGroups;

  if (db && group.id) {
    try {
      await db.ref(`dbGroups/${group.id}`).update({
        name, instructor,
        day: dayDisplayNames[dayOfWeek], dayOfWeek,
        subGroups: newSubGroups.map(sg => ({ time: sg.time, day: sg.day ?? null, meetingTime: sg.meetingTime || '', location: sg.location || '' }))
      });
    } catch(e) { showToast('שגיאה בשמירה: ' + e.message, 'error'); return; }
  }

  document.getElementById('editGroupOverlay')?.remove();
  const panel = document.getElementById('panel-' + group.id);
  if (panel) panel.innerHTML = renderGroup(group, groupIdx);
  const tabBtn = document.querySelector(`[data-tab="${group.id}"]`);
  if (tabBtn) tabBtn.textContent = name;
  const gp = document.getElementById('panel-groups-admin');
  if (gp) gp.innerHTML = renderGroupsAdminPanel();
  const calP = document.getElementById('panel-calendar');
  if (calP && calP.classList.contains('active')) calP.innerHTML = renderCalendarPanel();
  showToast('החוג עודכן ✅');
}
window.saveEditGroup = saveEditGroup;

async function deleteDbGroup(groupId) {
  if (!confirm('למחוק את החוג לצמיתות? כל השחקנים והנתונים שלו יימחקו.')) return;
  try {
    await db.ref(`dbGroups/${groupId}`).remove();
    await db.ref(`extra_players/${groupId}`).remove();
    await db.ref(`deletedGroupIds/${groupId}`).set(true);
    _deletedGroupIds.add(groupId);
    groups = groups.filter(g => g.id !== groupId);
    const btn = document.querySelector(`[data-tab="${groupId}"]`);
    if (btn) btn.remove();
    const panel = document.getElementById('panel-' + groupId);
    if (panel) panel.remove();
    const gp = document.getElementById('panel-groups-admin');
    if (gp) gp.innerHTML = renderGroupsAdminPanel();
    showToast('החוג נמחק');
    switchTab('groups-admin');
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.deleteDbGroup = deleteDbGroup;

// ===== INSTRUCTOR MANAGEMENT =====

async function loadInstructorsList() {
  const el = document.getElementById('instructors-list');
  if (!el || !db) return;
  el.innerHTML = '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:12px">טוען...</div>';
  try {
    const snap = await db.ref('roles').get();
    const allRoles = snap.val() || {};
    const instructors = Object.entries(allRoles)
      .filter(([uid, r]) => r.role === 'instructor')
      .map(([uid, r]) => ({ uid, ...r }));
    if (instructors.length === 0) {
      el.innerHTML = '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:12px">אין מדריכים רשומים עדיין</div>';
      return;
    }
    el.innerHTML = instructors.map(inst => buildInstructorRow(inst)).join('');
  } catch(e) { el.innerHTML = `<div style="color:#c53030;font-size:13px">שגיאה: ${e.message}</div>`; }
}
window.loadInstructorsList = loadInstructorsList;

function buildInstructorRow(inst) {
  const assignedGroups = Object.keys(inst.groups || {}).length;
  const assignedTeams  = Object.keys(inst.teams  || {}).length;
  const safeName = (inst.name || inst.email || inst.uid).replace(/'/g, "\\'");
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:8px;background:var(--bg-subtle);margin-bottom:6px">
      <div style="flex:1;min-width:0">
        <span style="font-weight:600;font-size:14px;color:var(--text-primary)">${inst.name || inst.email || inst.uid}</span>
        ${inst.email ? `<span style="font-size:12px;color:var(--text-muted);margin-right:8px"> · ${inst.email}</span>` : ''}
        <span style="font-size:12px;color:#2b6cb0;margin-right:6px">${assignedGroups} חוגים</span>
        <span style="font-size:12px;color:#553c9a">${assignedTeams} נבחרות</span>
      </div>
      <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
        <button onclick="openInstructorDetailModal('${inst.uid}')" style="background:var(--bg-card);border:1px solid var(--border);color:var(--text-primary);border-radius:6px;padding:4px 10px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">✎ ניהול</button>
        <button onclick="removeInstructor('${inst.uid}','${safeName}')" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:16px">🗑</button>
      </div>
    </div>`;
}
window.buildInstructorRow = buildInstructorRow;

async function openInstructorDetailModal(uid) {
  document.getElementById('instDetailOverlay')?.remove();
  let inst = { uid };
  let groupOwners = {}, teamOwners = {};
  try {
    const [instSnap, allSnap] = await Promise.all([db.ref('roles/' + uid).get(), db.ref('roles').get()]);
    inst = { uid, ...(instSnap.val() || {}) };
    const allRoles = allSnap.val() || {};
    Object.entries(allRoles).filter(([id, r]) => r.role === 'instructor').forEach(([id, r]) => {
      Object.keys(r.groups || {}).forEach(gid => { if (!groupOwners[gid]) groupOwners[gid] = r.name || r.username || id; });
      Object.keys(r.teams  || {}).forEach(tid => { if (!teamOwners[tid])  teamOwners[tid]  = r.name || r.username || id; });
    });
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); return; }

  const assignedGroups = Object.keys(inst.groups || {});
  const assignedTeams  = Object.keys(inst.teams  || {});
  const myName = inst.name || inst.username;

  function isGroupAssigned(g) {
    if (assignedGroups.includes(g.id)) return true;
    const legacy = ALL_GROUPS.find(ag => ag.name === g.name);
    return legacy ? assignedGroups.includes(legacy.id) : false;
  }
  function groupTakenBy(g) { const o = groupOwners[g.id]; return (!o || o === myName) ? null : o; }
  function teamTakenBy(t)  { const o = teamOwners[t.id];  return (!o || o === myName) ? null : o; }

  const groupCheckboxes = groups.map(g => {
    const mine  = isGroupAssigned(g);
    const taken = !mine && groupTakenBy(g);
    return `
      <label style="display:flex;align-items:center;gap:6px;font-size:13px;padding:3px 0;cursor:${taken ? 'not-allowed' : 'pointer'};opacity:${taken ? '0.5' : '1'};color:#2d3748"
             title="${taken ? `משויך ל${taken}` : ''}">
        <input type="checkbox" data-id="${g.id}" ${mine ? 'checked' : ''} ${taken ? 'disabled' : ''}>
        ${g.name}
        ${taken ? `<span style="font-size:11px;color:#e53e3e">(${taken})</span>` : ''}
      </label>`;
  }).join('');

  const regions = [...new Set(teams.map(t => t.region || ''))].filter(Boolean);
  const noRegionTeams = teams.filter(t => !t.region);
  const teamCheckboxes = [
    ...regions.map(region => {
      const regionTeams = teams.filter(t => t.region === region);
      return `
        <div style="font-size:11px;font-weight:700;color:#4a5568;letter-spacing:0.8px;text-transform:uppercase;padding:6px 0 2px">― ${region} ―</div>
        ${regionTeams.map(t => {
          const mine  = assignedTeams.includes(t.id);
          const taken = !mine && teamTakenBy(t);
          return `
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;padding:3px 0;cursor:${taken ? 'not-allowed' : 'pointer'};opacity:${taken ? '0.5' : '1'};color:#2d3748"
                   title="${taken ? `משויך ל${taken}` : ''}">
              <input type="checkbox" data-id="${t.id}" ${mine ? 'checked' : ''} ${taken ? 'disabled' : ''}>
              <span style="font-weight:600">${t.name || t.teamName || t.id}</span>
              ${taken ? `<span style="font-size:11px;color:#e53e3e">(${taken})</span>` : ''}
            </label>`;
        }).join('')}`;
    }),
    ...noRegionTeams.map(t => {
      const mine  = assignedTeams.includes(t.id);
      const taken = !mine && teamTakenBy(t);
      return `
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;padding:3px 0;cursor:${taken ? 'not-allowed' : 'pointer'};opacity:${taken ? '0.5' : '1'};color:#2d3748">
          <input type="checkbox" data-id="${t.id}" ${mine ? 'checked' : ''} ${taken ? 'disabled' : ''}>
          <span style="font-weight:600">${t.name || t.teamName || t.id}</span>
          ${taken ? `<span style="font-size:11px;color:#e53e3e">(${taken})</span>` : ''}
        </label>`;
    })
  ].join('');

  const safeName = (inst.name || '').replace(/'/g, "\\'");
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" id="instDetailOverlay" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:520px">
        <div class="modal-header">
          <span class="modal-title">👤 ניהול מדריך — ${inst.name || inst.email || uid}</span>
          <button class="modal-close" onclick="document.getElementById('instDetailOverlay').remove()">✕</button>
        </div>
        <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:16px;max-height:70vh;overflow-y:auto">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button onclick="openChangePasswordModal('${uid}','${safeName}')" style="background:#f7fafc;border:1px solid #e2e8f0;color:#2d3748;border-radius:7px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">🔑 שנה סיסמה</button>
            <button onclick="openChangeUsernameModal('${uid}','${safeName}','${inst.email||''}')" style="background:#f7fafc;border:1px solid #e2e8f0;color:#2d3748;border-radius:7px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">👤 שנה שם משתמש</button>
          </div>
          <div class="modal-field">
            <label>שם מלא</label>
            <input type="text" id="inst-name-${uid}" value="${inst.name||''}" class="modal-input" placeholder="שם המדריך">
          </div>
          <div class="modal-field">
            <label>טלפון (לתזכורות WhatsApp)</label>
            <input type="text" id="inst-phone-${uid}" value="${inst.phone||''}" class="modal-input" dir="ltr" placeholder="972501234567">
          </div>
          <div id="inst-groups-${uid}">
            <div style="font-size:12px;font-weight:700;color:#2b6cb0;margin-bottom:8px">🏫 חוגים</div>
            ${groupCheckboxes || '<div style="color:#a0aec0;font-size:12px">אין חוגים</div>'}
          </div>
          <div id="inst-teams-${uid}">
            <div style="font-size:12px;font-weight:700;color:#553c9a;margin-bottom:8px">🏅 נבחרות</div>
            ${teamCheckboxes || '<div style="color:#a0aec0;font-size:12px">אין נבחרות</div>'}
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0;padding-top:14px">
            <button onclick="clearInstructorAssignments('${uid}')"
              style="background:#fff5f5;color:#c53030;border:1px solid #fed7d7;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">
              🗑 נקה הכל
            </button>
            <button onclick="saveInstructorAssignments('${uid}')"
              style="background:#276749;color:white;border:none;border-radius:8px;padding:8px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
              💾 שמור שינויים
            </button>
          </div>
        </div>
      </div>
    </div>`);
}
window.openInstructorDetailModal = openInstructorDetailModal;

async function clearInstructorAssignments(uid) {
  if (!confirm('לנקות את כל ההקצאות של מדריך זה?')) return;
  try {
    await db.ref(`roles/${uid}/groups`).set(null);
    await db.ref(`roles/${uid}/teams`).set(null);
    showToast('ההקצאות נוקו ✅');
    document.getElementById('instDetailOverlay')?.remove();
    loadInstructorsList();
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.clearInstructorAssignments = clearInstructorAssignments;

async function saveInstructorAssignments(uid) {
  if (!db) return;
  const groupMap = {};
  document.querySelectorAll(`#inst-groups-${uid} input[type=checkbox]:checked`).forEach(cb => {
    groupMap[cb.dataset.id] = true;
  });
  const teamMap = {};
  document.querySelectorAll(`#inst-teams-${uid} input[type=checkbox]:checked`).forEach(cb => {
    teamMap[cb.dataset.id] = true;
  });
  const phone = document.getElementById(`inst-phone-${uid}`)?.value?.trim().replace(/[^\d]/g,'') || null;
  const name  = document.getElementById(`inst-name-${uid}`)?.value?.trim();
  try {
    if (name) await db.ref(`roles/${uid}/name`).set(name);
    // Overwrite completely — fixes duplicates from legacy IDs
    await db.ref(`roles/${uid}/groups`).set(Object.keys(groupMap).length > 0 ? groupMap : null);
    await db.ref(`roles/${uid}/teams`).set(Object.keys(teamMap).length  > 0 ? teamMap  : null);
    await db.ref(`roles/${uid}/phone`).set(phone);
    showToast('השינויים נשמרו ✅');
    loadInstructorsList();
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.saveInstructorAssignments = saveInstructorAssignments;

function openAddInstructorModal() {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:420px">
        <div class="modal-header">
          <span class="modal-title">➕ הוספת מדריך חדש</span>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:12px">
          <div class="modal-field">
            <label>שם מלא <span style="color:#e53e3e">*</span></label>
            <input type="text" id="new-inst-name" class="modal-input" placeholder="לדוגמה: אריק כהן">
          </div>
          <div class="modal-field">
            <label>שם משתמש <span style="color:#e53e3e">*</span></label>
            <input type="text" id="new-inst-email" class="modal-input" placeholder="לדוגמה: arik123" dir="ltr">
            <div style="font-size:11px;color:#a0aec0;margin-top:3px">אותיות ומספרים בלבד, ללא רווחים</div>
          </div>
          <div class="modal-field">
            <label>סיסמה זמנית <span style="color:#e53e3e">*</span></label>
            <div style="display:flex;gap:8px">
              <input type="text" id="new-inst-pass" class="modal-input" style="flex:1" placeholder="לפחות 6 תווים" dir="ltr">
              <button onclick="document.getElementById('new-inst-pass').value=Math.random().toString(36).slice(2,10)"
                style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px;font-size:12px;cursor:pointer;white-space:nowrap;font-family:inherit">🎲 צור</button>
            </div>
            <div style="font-size:11px;color:#a0aec0;margin-top:4px">שלח את הסיסמה למדריך — הם יוכלו לשנות אותה מאוחר יותר</div>
          </div>
          <div id="add-inst-error" style="color:#c53030;font-size:13px;display:none"></div>
          <button onclick="submitAddInstructor()" style="background:#276749;color:white;border:none;border-radius:8px;padding:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">
            ✅ צור מדריך
          </button>
        </div>
      </div>
    </div>`);
  setTimeout(() => document.getElementById('new-inst-name')?.focus(), 50);
}
window.openAddInstructorModal = openAddInstructorModal;

async function submitAddInstructor() {
  const name     = document.getElementById('new-inst-name')?.value?.trim();
  const username = document.getElementById('new-inst-email')?.value?.trim().replace(/\s+/g,'');
  const pass     = document.getElementById('new-inst-pass')?.value?.trim();
  const email    = toFirebaseEmail(username);
  const errEl    = document.getElementById('add-inst-error');
  if (!name || !username || !pass) {
    errEl.textContent = 'יש למלא את כל השדות'; errEl.style.display = ''; return;
  }
  if (pass.length < 6) {
    errEl.textContent = 'הסיסמה חייבת להכיל לפחות 6 תווים'; errEl.style.display = ''; return;
  }
  errEl.style.display = 'none';
  const btn = document.querySelector('.friday-modal .btn-form-submit, .friday-modal button[onclick="submitAddInstructor()"]');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ יוצר...'; }
  try {
    // Create user via secondary Firebase app — doesn't affect admin session
    const secondaryApp = firebase.initializeApp(FIREBASE_CONFIG, 'inst-create-' + Date.now());
    const secondaryAuth = secondaryApp.auth();
    let newUid;
    try {
      const cred = await secondaryAuth.createUserWithEmailAndPassword(email, pass);
      newUid = cred.user.uid;
    } catch(createErr) {
      if (createErr.code === 'auth/email-already-in-use') {
        // User already exists in Auth — sign in to get their UID
        const cred = await secondaryAuth.signInWithEmailAndPassword(email, pass);
        newUid = cred.user.uid;
      } else {
        throw createErr;
      }
    }
    await secondaryAuth.signOut();
    await secondaryApp.delete();
    // Save role to database (overwrite any partial/missing entry)
    await db.ref(`roles/${newUid}`).set({ name, username, email, role: 'instructor', groups: {}, teams: {}, tempPassword: pass });
    document.querySelector('.friday-modal')?.remove();
    showToast(`המדריך "${name}" נוסף ✅`);
    loadInstructorsList();
    loadAllUsersList();
  } catch(e) {
    const msgs = {
      'auth/invalid-email':   'כתובת אימייל לא תקינה',
      'auth/weak-password':   'הסיסמה חלשה מדי',
      'auth/wrong-password':  'סיסמה שגויה — לא ניתן לאמת משתמש קיים',
      'auth/invalid-credential': 'סיסמה שגויה — לא ניתן לאמת משתמש קיים',
    };
    errEl.textContent = msgs[e.code] || e.message;
    errEl.style.display = '';
    if (btn) { btn.disabled = false; btn.textContent = '✅ צור מדריך'; }
  }
}
window.submitAddInstructor = submitAddInstructor;

function toggleShowPassword(uid, pass) {
  const el  = document.getElementById('inst-pass-' + uid);
  const btn = el?.nextElementSibling;
  if (!el) return;
  const showing = el.dataset.showing === '1';
  el.textContent = showing ? '••••••••' : pass;
  el.style.letterSpacing = showing ? '2px' : '0';
  el.dataset.showing = showing ? '0' : '1';
  if (btn) btn.textContent = showing ? '👁 הצג' : '🙈 הסתר';
}
window.toggleShowPassword = toggleShowPassword;

function openChangePasswordModal(uid, name) {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:380px">
        <div class="modal-header">
          <span class="modal-title">🔑 שינוי סיסמה — ${name}</span>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:12px">
          <div class="modal-field">
            <label>סיסמה חדשה <span style="color:#e53e3e">*</span></label>
            <div style="display:flex;gap:8px">
              <input type="text" id="chpass-input" class="modal-input" style="flex:1" dir="ltr" placeholder="לפחות 6 תווים">
              <button onclick="document.getElementById('chpass-input').value=Math.random().toString(36).slice(2,10)"
                style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px;font-size:12px;cursor:pointer;font-family:inherit">🎲</button>
            </div>
          </div>
          <div id="chpass-error" style="color:#c53030;font-size:13px;display:none"></div>
          <button onclick="submitChangePassword('${uid}')"
            style="background:#2b6cb0;color:white;border:none;border-radius:8px;padding:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">
            💾 שמור סיסמה חדשה
          </button>
        </div>
      </div>
    </div>`);
  setTimeout(() => document.getElementById('chpass-input')?.focus(), 50);
}
window.openChangePasswordModal = openChangePasswordModal;

async function submitChangePassword(uid) {
  const pass  = document.getElementById('chpass-input')?.value?.trim();
  const errEl = document.getElementById('chpass-error');
  if (!pass || pass.length < 6) {
    errEl.textContent = 'הסיסמה חייבת להכיל לפחות 6 תווים'; errEl.style.display = ''; return;
  }
  errEl.style.display = 'none';
  const btn = document.querySelector('.friday-modal button[onclick*="submitChangePassword"]');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ שומר...'; }
  try {
    // Use secondary app to change the password
    const secondaryApp = firebase.initializeApp(FIREBASE_CONFIG, 'pass-change-' + Date.now());
    // Re-auth the instructor — we need their email
    const roleSnap = await db.ref(`roles/${uid}`).get();
    const roleData = roleSnap.val();
    const email    = roleData?.tempPassword
      ? roleData.email
      : roleData?.email;
    if (!email || !roleData?.tempPassword) {
      errEl.textContent = 'לא ניתן לשנות — אין סיסמה קודמת שמורה';
      errEl.style.display = ''; if (btn) { btn.disabled=false; btn.textContent='💾 שמור'; } return;
    }
    const secAuth = secondaryApp.auth();
    const cred = await secAuth.signInWithEmailAndPassword(email, roleData.tempPassword);
    await cred.user.updatePassword(pass);
    await secAuth.signOut();
    await secondaryApp.delete();
    // Save new password in DB
    await db.ref(`roles/${uid}/tempPassword`).set(pass);
    document.getElementById('chpass-input')?.closest('.modal-overlay')?.remove();
    showToast('הסיסמה עודכנה ✅');
    loadInstructorsList();
  } catch(e) {
    const msgs = { 'auth/weak-password': 'סיסמה חלשה מדי' };
    errEl.textContent = msgs[e.code] || e.message;
    errEl.style.display = '';
    if (btn) { btn.disabled = false; btn.textContent = '💾 שמור סיסמה חדשה'; }
  }
}
window.submitChangePassword = submitChangePassword;

function openChangeUsernameModal(uid, name, currentEmail) {
  const currentUsername = currentEmail.replace(CLUB_EMAIL_DOMAIN, '');
  const hasStoredPass = true; // will be checked dynamically
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:400px">
        <div class="modal-header">
          <span class="modal-title">👤 שינוי שם משתמש — ${name}</span>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:12px">
          <div class="modal-field">
            <label>שם משתמש נוכחי</label>
            <div style="font-size:14px;color:#718096;padding:8px 0;direction:ltr">${currentUsername}</div>
          </div>
          <div class="modal-field">
            <label>שם משתמש חדש <span style="color:#e53e3e">*</span></label>
            <input type="text" id="chuser-new" class="modal-input" dir="ltr" placeholder="אותיות ומספרים בלבד">
          </div>
          <div class="modal-field">
            <label>סיסמה נוכחית של המדריך <span style="color:#e53e3e">*</span></label>
            <div style="display:flex;gap:8px">
              <input type="text" id="chuser-pass" class="modal-input" dir="ltr" style="flex:1" placeholder="נדרש לאימות">
              <button onclick="fillStoredPassword('${uid}')"
                style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px;font-size:11px;cursor:pointer;font-family:inherit;white-space:nowrap">
                📋 מהשמור
              </button>
            </div>
          </div>
          <div id="chuser-error" style="color:#c53030;font-size:13px;display:none"></div>
          <button onclick="submitChangeUsername('${uid}','${currentEmail}')"
            style="background:#2b6cb0;color:white;border:none;border-radius:8px;padding:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">
            💾 עדכן שם משתמש
          </button>
        </div>
      </div>
    </div>`);
  setTimeout(() => document.getElementById('chuser-new')?.focus(), 50);
}
window.openChangeUsernameModal = openChangeUsernameModal;

async function fillStoredPassword(uid) {
  const inp = document.getElementById('chuser-pass');
  if (!inp || !db) return;
  try {
    const snap = await db.ref(`roles/${uid}/tempPassword`).get();
    const stored = snap.val();
    if (stored) inp.value = stored;
    else showToast('אין סיסמה שמורה — הזן ידנית', 'error');
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.fillStoredPassword = fillStoredPassword;

async function submitChangeUsername(uid, currentEmail) {
  const newUsername = document.getElementById('chuser-new')?.value?.trim().replace(/\s+/g,'');
  const pass        = document.getElementById('chuser-pass')?.value?.trim();
  const errEl       = document.getElementById('chuser-error');
  if (!newUsername) { errEl.textContent = 'יש להזין שם משתמש חדש'; errEl.style.display=''; return; }
  if (!pass)        { errEl.textContent = 'יש להזין את הסיסמה הנוכחית'; errEl.style.display=''; return; }
  errEl.style.display = 'none';
  const btn = document.querySelector('.friday-modal button[onclick*="submitChangeUsername"]');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ מעדכן...'; }
  const newEmail = toFirebaseEmail(newUsername);
  try {
    // Re-auth via secondary app and update email
    const secApp  = firebase.initializeApp(FIREBASE_CONFIG, 'usr-change-' + Date.now());
    const secAuth = secApp.auth();
    const cred    = await secAuth.signInWithEmailAndPassword(currentEmail, pass);
    await cred.user.updateEmail(newEmail);
    await secAuth.signOut();
    await secApp.delete();
    // Update roles in DB
    await db.ref(`roles/${uid}/username`).set(newUsername);
    await db.ref(`roles/${uid}/email`).set(newEmail);
    document.getElementById('chuser-new')?.closest('.modal-overlay')?.remove();
    showToast(`שם המשתמש עודכן ל-"${newUsername}" ✅`);
    loadInstructorsList();
  } catch(e) {
    const msgs = {
      'auth/wrong-password':    'סיסמה שגויה',
      'auth/invalid-credential':'סיסמה שגויה',
      'auth/email-already-in-use': 'שם משתמש זה כבר תפוס',
      'auth/invalid-email':     'שם משתמש לא תקין',
    };
    errEl.textContent = msgs[e.code] || e.message;
    errEl.style.display = '';
    if (btn) { btn.disabled = false; btn.textContent = '💾 עדכן שם משתמש'; }
  }
}
window.submitChangeUsername = submitChangeUsername;

async function removeInstructor(uid, name) {
  if (!confirm(`להסיר את "${name}" מרשימת המדריכים?\n\nהמשתמש לא יוכל יותר להתחבר לאתר.`)) return;
  try {
    await db.ref(`roles/${uid}`).remove();
    showToast(`${name} הוסר ✅`);
    document.getElementById('instDetailOverlay')?.remove();
    loadInstructorsList();
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.removeInstructor = removeInstructor;

// ===== SUPER ADMIN — ALL USERS =====

async function loadAllUsersList() {
  const el = document.getElementById('all-users-list');
  if (!el || !db) return;
  el.onclick = e => {
    const btn = e.target.closest('[data-edit-uid]');
    if (btn) openSaEditModal(btn.dataset.editUid).catch(err => showToast('שגיאה: ' + err.message, 'error'));
  };
  el.innerHTML = '<div style="color:#a0aec0;font-size:13px;text-align:center;padding:12px">טוען...</div>';
  try {
    const snap = await db.ref('roles').get();
    const allRoles = snap.val() || {};
    const users = Object.entries(allRoles).map(([uid, r]) => ({ uid, ...r }))
      .sort((a, b) => (a.role === 'admin' ? -1 : 1));
    if (!users.length) { el.innerHTML = '<div style="color:#a0aec0;font-size:13px;text-align:center;padding:12px">אין משתמשים</div>'; return; }
    el.innerHTML = users.map(u => buildUserCredRow(u)).join('');
  } catch(e) { el.innerHTML = `<div style="color:#c53030;font-size:13px">שגיאה: ${e.message}</div>`; }
}
window.loadAllUsersList = loadAllUsersList;

async function changeUserRole(uid, currentRole, name) {
  const newRole = currentRole === 'admin' ? 'instructor' : 'admin';
  const label   = newRole === 'admin' ? 'מנהל' : 'מדריך';
  if (!confirm(`לשנות את "${name}" ל${label}?`)) return;
  try {
    await db.ref(`roles/${uid}/role`).set(newRole);
    showToast(`${name} עודכן ל${label} ✅`);
    loadAllUsersList();
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.changeUserRole = changeUserRole;

function openAddAdminModal() {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:420px">
        <div class="modal-header">
          <span class="modal-title">➕ הוסף מנהל חדש</span>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:12px">
          <div class="modal-field">
            <label>שם מלא <span style="color:#e53e3e">*</span></label>
            <input type="text" id="new-admin-name" class="modal-input" placeholder="שם המנהל">
          </div>
          <div class="modal-field">
            <label>שם משתמש <span style="color:#e53e3e">*</span></label>
            <input type="text" id="new-admin-user" class="modal-input" dir="ltr" placeholder="username (ללא @)">
          </div>
          <div class="modal-field">
            <label>סיסמה <span style="color:#e53e3e">*</span></label>
            <div style="display:flex;gap:8px">
              <input type="text" id="new-admin-pass" class="modal-input" dir="ltr" style="flex:1" placeholder="לפחות 6 תווים">
              <button onclick="document.getElementById('new-admin-pass').value=Math.random().toString(36).slice(2,10)"
                style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px;font-size:12px;cursor:pointer;font-family:inherit">🎲</button>
            </div>
          </div>
          <div id="add-admin-error" style="color:#c53030;font-size:13px;display:none"></div>
          <button onclick="submitAddAdmin()" style="background:#553c9a;color:white;border:none;border-radius:8px;padding:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">
            👑 צור מנהל
          </button>
        </div>
      </div>
    </div>`);
  setTimeout(() => document.getElementById('new-admin-name')?.focus(), 50);
}
window.openAddAdminModal = openAddAdminModal;

async function submitAddAdmin() {
  const name     = document.getElementById('new-admin-name')?.value?.trim();
  const username = document.getElementById('new-admin-user')?.value?.trim().replace(/\s+/g,'');
  const pass     = document.getElementById('new-admin-pass')?.value?.trim();
  const errEl    = document.getElementById('add-admin-error');
  if (!name || !username || !pass) { errEl.textContent = 'יש למלא את כל השדות'; errEl.style.display = ''; return; }
  if (pass.length < 6) { errEl.textContent = 'הסיסמה חייבת להכיל לפחות 6 תווים'; errEl.style.display = ''; return; }
  const email = toFirebaseEmail(username);
  errEl.style.display = 'none';
  const btn = document.querySelector('.friday-modal button[onclick="submitAddAdmin()"]');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ יוצר...'; }
  try {
    const secondaryApp  = firebase.initializeApp(FIREBASE_CONFIG, 'admin-create-' + Date.now());
    const secondaryAuth = secondaryApp.auth();
    const cred = await secondaryAuth.createUserWithEmailAndPassword(email, pass);
    const newUid = cred.user.uid;
    await secondaryAuth.signOut();
    await secondaryApp.delete();
    await db.ref(`roles/${newUid}`).set({ name, username, email, role: 'admin', groups: {}, teams: {}, tempPassword: pass });
    await db.ref(`loginIndex/${loginKey(username)}`).set(email);
    document.querySelector('.friday-modal')?.remove();
    showToast(`המנהל "${name}" נוצר ✅`);
    loadAllUsersList();
  } catch(e) {
    const msgs = { 'auth/email-already-in-use':'שם המשתמש כבר קיים','auth/invalid-email':'שם משתמש לא תקין','auth/weak-password':'הסיסמה חלשה מדי' };
    errEl.textContent = msgs[e.code] || e.message;
    errEl.style.display = '';
    if (btn) { btn.disabled = false; btn.textContent = '👑 צור מנהל'; }
  }
}
window.submitAddAdmin = submitAddAdmin;

const _userEditCache = {};

function buildUserCredRow(u) {
  const roleLabel = u.role === 'admin' ? '👑 מנהל' : '👤 מדריך';
  const username  = u.username || u.email?.replace(CLUB_EMAIL_DOMAIN,'') || '—';
  const pass      = u.tempPassword || null;
  _userEditCache[u.uid] = { ...u, _username: username };
  const safeName = (u.name||username).replace(/'/g,"\\'");
  return `
    <div style="border:1px solid #e2e8f0;border-radius:10px;background:#f7fafc;margin-bottom:8px;overflow:hidden">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:white;border-bottom:1px solid #e2e8f0;gap:10px">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:12px;font-weight:700;background:${u.role==='admin'?'#faf5ff':'#f0fff4'};color:${u.role==='admin'?'#553c9a':'#276749'};border:1px solid ${u.role==='admin'?'#d6bcfa':'#9ae6b4'};border-radius:6px;padding:3px 9px">${roleLabel}</span>
          <span style="font-size:15px;font-weight:700;color:#2d3748">${u.name || '—'}</span>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0">
          <button data-edit-uid="${u.uid}"
            style="background:#ebf8ff;border:1px solid #bee3f8;border-radius:7px;padding:5px 12px;font-size:13px;cursor:pointer;font-family:inherit;color:#2b6cb0;font-weight:600">✏️ ערוך</button>
          ${u.uid !== currentUser?.uid ? `
            <button onclick="changeUserRole('${u.uid}','${u.role}','${safeName}')"
              style="background:${u.role==='admin'?'#f0fff4':'#faf5ff'};border:1px solid ${u.role==='admin'?'#9ae6b4':'#d6bcfa'};border-radius:7px;padding:5px 12px;font-size:13px;cursor:pointer;font-family:inherit;color:${u.role==='admin'?'#276749':'#553c9a'};font-weight:600">${u.role==='admin'?'👤 למדריך':'👑 למנהל'}</button>
            <button onclick="deleteUser('${u.uid}','${safeName}')"
              style="background:#fff5f5;border:1px solid #fed7d7;border-radius:7px;padding:5px 12px;font-size:13px;cursor:pointer;font-family:inherit;color:#c53030;font-weight:600">🗑 מחק</button>` : ''}
        </div>
      </div>
      <div style="display:flex;gap:0;padding:10px 14px">
        <div style="flex:1;min-width:0;padding-left:16px;border-left:1px solid #e2e8f0">
          <div style="font-size:11px;color:#a0aec0;margin-bottom:4px">שם משתמש</div>
          <span id="sa-user-${u.uid}" style="font-size:14px;direction:ltr;color:#2d3748;word-break:break-all">${username}</span>
        </div>
        <div style="flex:1;min-width:0;padding-right:16px">
          <div style="font-size:11px;color:#a0aec0;margin-bottom:4px">סיסמה</div>
          <div style="display:flex;align-items:center;gap:6px">
            <span id="sa-pass-${u.uid}" style="font-size:14px;letter-spacing:2px;direction:ltr;color:#2d3748">${pass ? '••••••••' : '<span style="color:#a0aec0;font-size:13px;letter-spacing:0">לא שמורה</span>'}</span>
            ${pass ? `<button onclick="toggleSaPass('${u.uid}','${pass}')" style="background:none;border:1px solid #e2e8f0;border-radius:5px;padding:2px 8px;font-size:12px;cursor:pointer;font-family:inherit;color:#718096">👁</button>` : ''}
          </div>
        </div>
      </div>
      ${u.role !== 'admin' ? `
      <details style="border-top:1px solid #e2e8f0" id="user-perms-${u.uid}">
        <summary style="display:flex;align-items:center;gap:8px;padding:10px 14px;cursor:pointer;font-size:12px;font-weight:700;color:#6b46c1;list-style:none;background:#faf5ff">
          🔐 הרשאות גישה לטאבים
          <span style="font-size:11px;font-weight:400;color:#805ad5;margin-right:4px">(לחץ להרחבה)</span>
        </summary>
        <div style="padding:12px 14px;background:#fefcff;color:#2d3748">
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:5px;margin-bottom:12px">
            ${PERMISSION_TABS.map(tab => {
              const uPerms = u.permissions || {};
              const enabled = tab.key in uPerms ? !!uPerms[tab.key] : tab.instructorDefault;
              return '<label style="display:flex;align-items:center;gap:6px;font-size:12px;padding:4px 8px;border-radius:6px;background:rgba(107,70,193,0.05);cursor:pointer;color:#2d3748">' +
                '<input type="checkbox" data-perm="'+tab.key+'" id="perm-'+u.uid+'-'+tab.key+'" '+(enabled?'checked':'')+'>'+
                tab.label + '</label>';
            }).join('')}
          </div>
          <button onclick="saveUserPermissions('${u.uid}')"
            style="background:#6b46c1;color:white;border:none;border-radius:8px;padding:8px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
            💾 שמור הרשאות
          </button>
        </div>
      </details>` : ''}
    </div>`;
}
window.buildUserCredRow = buildUserCredRow;

async function saveUserPermissions(uid) {
  if (!db) return;
  const permMap = {};
  document.querySelectorAll(`#user-perms-${uid} input[data-perm]`).forEach(cb => {
    permMap[cb.dataset.perm] = cb.checked;
  });
  try {
    await db.ref(`roles/${uid}/permissions`).set(Object.keys(permMap).length > 0 ? permMap : null);
    showToast('הרשאות נשמרו ✅');
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.saveUserPermissions = saveUserPermissions;

function toggleSaPass(uid, pass) {
  const el  = document.getElementById('sa-pass-' + uid);
  const btn = el?.nextElementSibling;
  if (!el) return;
  const showing = el.dataset.showing === '1';
  el.textContent    = showing ? '••••••••' : pass;
  el.style.letterSpacing = showing ? '2px' : '0';
  el.dataset.showing = showing ? '0' : '1';
  if (btn) btn.textContent = showing ? '👁' : '🙈';
}
window.toggleSaPass = toggleSaPass;

async function openSaEditModal(uid) {
  let u = _userEditCache[uid] || {};
  if (!u.email && db) {
    try { const s = await db.ref('roles/' + uid).get(); u = s.val() || {}; } catch(e) {}
  }
  const name = u.name || '';
  const currentEmail = u.email || '';
  const currentUsername = u.username || u.email?.replace(CLUB_EMAIL_DOMAIN,'') || '';
  const currentPass = u.tempPassword || '';
  const hasStored = !!currentPass;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:400px">
        <div class="modal-header">
          <span class="modal-title">✏️ עריכת פרטי כניסה — ${name}</span>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:12px">
          <div class="modal-field">
            <label>שם מלא</label>
            <input type="text" id="sa-edit-name" class="modal-input" value="${name}" placeholder="שם מלא">
          </div>
          <div style="border-top:1px solid #e2e8f0;padding-top:12px">
            <div style="font-size:12px;color:#718096;margin-bottom:8px">שינוי שם משתמש/סיסמה דורש אימות</div>
          </div>
          <div class="modal-field">
            <label>סיסמה נוכחית לאימות</label>
            <input type="text" id="sa-edit-current-pass" class="modal-input" dir="ltr"
              value="${currentPass}" placeholder="נדרש רק אם משנים שם משתמש/סיסמה">
            ${!hasStored ? `<div style="font-size:11px;color:#e53e3e;margin-top:3px">לא נשמרה סיסמה — יש להזין ידנית</div>` : ''}
          </div>
          <div class="modal-field">
            <label>שם משתמש חדש</label>
            <input type="text" id="sa-edit-user" class="modal-input" dir="ltr" value="${currentUsername}" placeholder="השאר ריק לא לשנות">
          </div>
          <div class="modal-field">
            <label>סיסמה חדשה</label>
            <div style="display:flex;gap:8px">
              <input type="text" id="sa-edit-pass" class="modal-input" dir="ltr" style="flex:1" placeholder="השאר ריק לא לשנות">
              <button onclick="document.getElementById('sa-edit-pass').value=Math.random().toString(36).slice(2,10)"
                style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px;font-size:12px;cursor:pointer;font-family:inherit">🎲</button>
            </div>
          </div>
          <div id="sa-edit-error" style="color:#c53030;font-size:13px;display:none"></div>
          <button onclick="submitSaEdit('${uid}','${currentEmail}','${currentUsername}','${name.replace(/'/g,"\\'")}')"
            style="background:#553c9a;color:white;border:none;border-radius:8px;padding:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">
            💾 שמור
          </button>
        </div>
      </div>
    </div>`);
  setTimeout(() => document.getElementById(currentPass ? 'sa-edit-user' : 'sa-edit-current-pass')?.focus(), 50);
}
window.openSaEditModal = openSaEditModal;

async function submitSaEdit(uid, currentEmail, oldUsername, oldName) {
  const currentPass = document.getElementById('sa-edit-current-pass')?.value?.trim();
  const newName     = document.getElementById('sa-edit-name')?.value?.trim();
  const newUsername = document.getElementById('sa-edit-user')?.value?.trim().replace(/\s+/g,'');
  const newPass     = document.getElementById('sa-edit-pass')?.value?.trim();
  const errEl       = document.getElementById('sa-edit-error');
  errEl.style.display = 'none';
  const nameChanged = newName && newName !== oldName;
  const usernameChanged = newUsername && newUsername !== oldUsername;
  const needsAuth = usernameChanged || newPass;
  if (needsAuth && !currentPass) { errEl.textContent = 'יש להזין סיסמה נוכחית לאימות כדי לשנות שם משתמש/סיסמה'; errEl.style.display=''; return; }
  if (!nameChanged && !usernameChanged && !newPass) { errEl.textContent = 'לא הוזנו שינויים'; errEl.style.display=''; return; }
  if (newPass && newPass.length < 6) { errEl.textContent = 'הסיסמה חייבת להכיל לפחות 6 תווים'; errEl.style.display=''; return; }
  const btn = document.querySelector('.friday-modal button[onclick*="submitSaEdit"]');
  if (btn) { btn.disabled=true; btn.textContent='⏳ שומר...'; }
  try {
    if (nameChanged) await db.ref(`roles/${uid}/name`).set(newName);
    if (needsAuth) {
      const authEmail = currentEmail.includes('@') ? currentEmail : toFirebaseEmail(oldUsername);
      const secApp  = firebase.initializeApp(FIREBASE_CONFIG, 'sa-edit-' + Date.now());
      const secAuth = secApp.auth();
      const cred    = await secAuth.signInWithEmailAndPassword(authEmail, currentPass);
      if (usernameChanged) {
        await db.ref(`roles/${uid}/username`).set(newUsername);
        await db.ref(`loginIndex/${loginKey(newUsername)}`).set(authEmail);
        if (oldUsername) await db.ref(`loginIndex/${loginKey(oldUsername)}`).remove();
      }
      if (newPass) {
        await cred.user.updatePassword(newPass);
        await db.ref(`roles/${uid}/tempPassword`).set(newPass);
      }
      await secAuth.signOut();
      await secApp.delete();
    }
    document.querySelector('.friday-modal')?.remove();
    showToast('הפרטים עודכנו ✅');
    loadAllUsersList();
  } catch(e) {
    const msgs = { 'auth/wrong-password':'סיסמה שגויה','auth/invalid-credential':'סיסמה שגויה','auth/email-already-in-use':'שם משתמש תפוס' };
    errEl.textContent = msgs[e.code] || e.message;
    errEl.style.display='';
    if (btn) { btn.disabled=false; btn.textContent='💾 שמור'; }
  }
}
window.submitSaEdit = submitSaEdit;

async function deleteUser(uid, name) {
  if (!confirm(`למחוק את "${name}"?\n\nהמשתמש לא יוכל להתחבר. הנתונים שלו (חוגים/נבחרות) יישמרו.`)) return;
  try {
    await db.ref(`roles/${uid}`).remove();
    showToast(`${name} נמחק ✅`);
    loadAllUsersList();
    loadInstructorsList();
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.deleteUser = deleteUser;

// ===== CREATE / DELETE TEAM =====

function _ctSgRow(sg) {
  return `<div class="ct-sg-row" style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;padding:6px 0;border-bottom:1px solid #f0f4f8">
    <input type="text" class="modal-input ct-sg-name" value="${sg.time||''}" placeholder="שם קטגוריה (לדוגמה: בנים)" style="flex:2;min-width:90px">
    <select class="modal-input ct-sg-day" style="width:90px">${_sgDayOpts(sg.day)}</select>
    <input type="text" class="modal-input ct-sg-mtime" value="${sg.meetingTime||''}" placeholder="16:00" style="width:68px" dir="ltr">
    <input type="text" class="modal-input ct-sg-loc" value="${sg.location||''}" placeholder="מיקום" style="flex:1;min-width:70px">
    <button onclick="this.closest('.ct-sg-row').remove()" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:16px;flex-shrink:0">✕</button>
  </div>`;
}

function openEditTeamModal(teamId) {
  const team = teams.find(t => t.id === teamId);
  if (!team) return;
  const teamIdx = teams.indexOf(team);

  const sgRows = () => document.getElementById('et-subgroups')?.querySelectorAll('.et-sg-row') || [];
  const dayDisplayNames = ['יום ראשון','יום שני','יום שלישי','יום רביעי','יום חמישי','יום שישי'];
  const dayOpts = dayDisplayNames.map((d,i) => `<option value="${i}"${(team.dayOfWeek||0)===i?' selected':''}>${d}</option>`).join('');

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open" id="editTeamOverlay" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:480px">
        <div class="modal-header">
          <span class="modal-title">✎ עריכת נבחרת — ${team.name}</span>
          <button class="modal-close" onclick="document.getElementById('editTeamOverlay').remove()">✕</button>
        </div>
        <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:14px">

          <div style="display:flex;gap:10px">
            <div class="modal-field" style="flex:2">
              <label>שם הנבחרת <span style="color:#e53e3e">*</span></label>
              <input type="text" id="et-name" value="${team.name}" class="modal-input">
            </div>
            <div class="modal-field" style="flex:1">
              <label>אזור</label>
              <select id="et-region" class="modal-input">
                <option value="">ללא</option>
                <option value="מערב"${team.region==='מערב'?' selected':''}>מערב</option>
                <option value="מזרח"${team.region==='מזרח'?' selected':''}>מזרח</option>
              </select>
            </div>
          </div>

          <div class="modal-field">
            <label>מאמן</label>
            <input type="text" id="et-coach" value="${team.coach||''}" class="modal-input" placeholder="שם המאמן">
          </div>

          <div class="modal-field">
            <label>יום בשבוע (לנוכחות)</label>
            <select id="et-day" class="modal-input">${dayOpts}</select>
          </div>

          <div>
            <label style="font-size:13px;font-weight:600;color:#4a5568;display:block;margin-bottom:4px">
              קטגוריות
              <span style="font-size:11px;color:#a0aec0;font-weight:400;margin-right:4px">— לכל קטגוריה ניתן להגדיר יום ושעה</span>
            </label>
            <div id="et-subgroups" style="display:flex;flex-direction:column">
              ${team.subGroups.map((sg, i) => {
                const playerCount = sg.players?.length || 0;
                return `<div class="et-sg-row" data-idx="${i}" style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;padding:6px 0;border-bottom:1px solid #f0f4f8">
                  <input type="text" class="modal-input et-sg-name" value="${sg.time||''}" placeholder="שם קטגוריה" style="flex:2;min-width:90px">
                  <select class="modal-input et-sg-day" style="width:90px">${_sgDayOpts(sg.day)}</select>
                  <input type="text" class="modal-input et-sg-mtime" value="${sg.meetingTime||''}" placeholder="16:00" style="width:68px" dir="ltr">
                  <input type="text" class="modal-input et-sg-loc" value="${sg.location||''}" placeholder="מיקום" style="flex:1;min-width:70px">
                  <span style="font-size:11px;color:#718096;white-space:nowrap;flex-shrink:0">${playerCount > 0 ? playerCount + ' שח׳' : ''}</span>
                  <button onclick="removeEtRow(this,${playerCount})" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:16px;line-height:1;padding:2px;flex-shrink:0" title="מחק קטגוריה">✕</button>
                </div>`;
              }).join('')}
            </div>
            <button onclick="addEtRow()" style="width:100%;margin-top:8px;padding:8px;background:#f7fafc;border:1px dashed #cbd5e0;border-radius:8px;cursor:pointer;font-size:13px;font-family:inherit;color:#4a5568">+ הוסף קטגוריה</button>
          </div>
          <div style="background:#fffbeb;border-radius:8px;padding:10px 14px;font-size:12px;color:#744210;border-right:3px solid #f6ad55">
            ⚠️ מחיקת קטגוריה שיש בה שחקנים תסיר גם את השחקנים. לא ניתן לשחזר.
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-form-cancel" onclick="document.getElementById('editTeamOverlay').remove()">ביטול</button>
          <button class="btn-form-submit" onclick="saveEditedTeam('${teamId}')">💾 שמור שינויים</button>
        </div>
      </div>
    </div>`);
}
window.openEditTeamModal = openEditTeamModal;

function addEtRow() {
  const cont = document.getElementById('et-subgroups');
  if (!cont) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = `<div class="et-sg-row" style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;padding:6px 0;border-bottom:1px solid #f0f4f8">
    <input type="text" class="modal-input et-sg-name" placeholder="שם קטגוריה" style="flex:2;min-width:90px">
    <select class="modal-input et-sg-day" style="width:90px">${_sgDayOpts(null)}</select>
    <input type="text" class="modal-input et-sg-mtime" placeholder="16:00" style="width:68px" dir="ltr">
    <input type="text" class="modal-input et-sg-loc" placeholder="מיקום" style="flex:1;min-width:70px">
    <button onclick="removeEtRow(this,0)" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:16px;line-height:1;padding:2px;flex-shrink:0">✕</button>
  </div>`;
  cont.appendChild(tmp.firstElementChild);
}
window.addEtRow = addEtRow;

function removeEtRow(btn, playerCount) {
  if (playerCount > 0 && !confirm(`לקטגוריה זו יש ${playerCount} שחקנים. למחוק בכל זאת?`)) return;
  btn.closest('.et-sg-row').remove();
}
window.removeEtRow = removeEtRow;

async function saveEditedTeam(teamId) {
  const team = teams.find(t => t.id === teamId);
  if (!team) return;
  const teamIdx = teams.indexOf(team);

  const name  = document.getElementById('et-name')?.value?.trim();
  const coach = document.getElementById('et-coach')?.value?.trim() || '';
  const region = document.getElementById('et-region')?.value || '';
  const dayOfWeek = parseInt(document.getElementById('et-day')?.value || '0');

  if (!name) { showToast('יש להזין שם נבחרת', 'error'); return; }

  const rows = document.querySelectorAll('#et-subgroups .et-sg-row');
  const newSubGroups = [];
  rows.forEach((row, i) => {
    const nameVal = row.querySelector('.et-sg-name')?.value?.trim() || `נבחרת ${String.fromCharCode(1488+i)}`;
    const oldIdx = row.dataset.idx != null ? parseInt(row.dataset.idx) : -1;
    const players = (oldIdx >= 0 && team.subGroups[oldIdx]) ? team.subGroups[oldIdx].players || [] : [];
    const dv = row.querySelector('.et-sg-day')?.value;
    const day = (dv !== '' && dv != null) ? parseInt(dv) : null;
    const meetingTime = row.querySelector('.et-sg-mtime')?.value?.trim() || '';
    const location = row.querySelector('.et-sg-loc')?.value?.trim() || '';
    newSubGroups.push({ time: nameVal, day, meetingTime, location, players });
  });

  if (newSubGroups.length === 0) { showToast('חייבת להיות לפחות קטגוריה אחת', 'error'); return; }

  team.name = name; team.coach = coach; team.region = region; team.dayOfWeek = dayOfWeek;
  team.subGroups = newSubGroups;

  if (db && teamId) {
    try {
      await db.ref(`dbTeams/${teamId}`).update({
        name, coach, region, dayOfWeek,
        subGroups: newSubGroups.map(sg => ({ time: sg.time, day: sg.day ?? null, meetingTime: sg.meetingTime || '', location: sg.location || '' }))
      });
    } catch(e) { showToast('שגיאה בשמירה: ' + e.message, 'error'); return; }
  }

  document.getElementById('editTeamOverlay')?.remove();

  const panel = document.getElementById('panel-team-' + teamId);
  if (panel) panel.innerHTML = renderTeamGroup(team, teamIdx);
  const btn = document.querySelector(`[data-tab="team-${teamId}"]`);
  if (btn) btn.textContent = '🏅 ' + name + (coach ? ' — ' + coach : '');
  const tp = document.getElementById('panel-teams-admin');
  if (tp) tp.innerHTML = renderTeamsAdminPanel();
  const calP = document.getElementById('panel-calendar');
  if (calP && calP.classList.contains('active')) calP.innerHTML = renderCalendarPanel();

  showToast('נבחרת עודכנה ✅');
}
window.saveEditedTeam = saveEditedTeam;

function openCreateTeamModal() {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:460px">
        <div class="modal-header">
          <span class="modal-title">➕ יצירת נבחרת חדשה</span>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:12px">
          <div class="modal-field"><label>שם הנבחרת <span style="color:#e53e3e">*</span></label>
            <input type="text" id="ct-name" placeholder='לדוגמה: נבחרת עירונית נוער' class="modal-input"></div>
          <div style="display:flex;gap:10px">
            <div class="modal-field" style="flex:1"><label>מאמן</label>
              <input type="text" id="ct-coach" placeholder="שם המאמן" class="modal-input"></div>
            <div class="modal-field" style="flex:1"><label>אזור</label>
              <select id="ct-region" class="modal-input">
                <option value="">― ללא אזור ―</option>
                <option value="מערב">מערב</option>
                <option value="מזרח">מזרח</option>
              </select>
            </div>
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#4a5568;display:block;margin-bottom:4px">קטגוריות <span style="font-size:11px;color:#a0aec0;font-weight:400">— לכל קטגוריה ניתן להגדיר יום ושעה</span></label>
            <div id="ct-subgroups" style="display:flex;flex-direction:column">${_ctSgRow({})}</div>
            <button onclick="addCtSubgroup()" style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:7px;padding:5px 12px;font-size:12px;cursor:pointer;font-family:inherit;color:#4a5568;margin-top:6px">+ הוסף קטגוריה</button>
          </div>
          <button onclick="saveNewTeam()" style="background:#553c9a;color:white;border:none;border-radius:8px;padding:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">💾 צור נבחרת</button>
        </div>
      </div>
    </div>`);
}
window.openCreateTeamModal = openCreateTeamModal;

function addCtSubgroup() {
  const cont = document.getElementById('ct-subgroups');
  if (!cont) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = _ctSgRow({});
  cont.appendChild(tmp.firstElementChild);
}
window.addCtSubgroup = addCtSubgroup;

async function saveNewTeam() {
  const name  = document.getElementById('ct-name')?.value?.trim();
  if (!name) { showToast('יש להזין שם נבחרת', 'error'); return; }
  const coach  = document.getElementById('ct-coach')?.value?.trim()  || '';
  const region = document.getElementById('ct-region')?.value         || '';
  const ctRows = document.querySelectorAll('#ct-subgroups .ct-sg-row');
  let subGroups = [...ctRows].map(row => {
    const t = row.querySelector('.ct-sg-name')?.value?.trim() || '';
    if (!t) return null;
    const dv = row.querySelector('.ct-sg-day')?.value;
    return { time: t, day: (dv !== '' && dv != null) ? parseInt(dv) : null, meetingTime: row.querySelector('.ct-sg-mtime')?.value?.trim() || '', location: row.querySelector('.ct-sg-loc')?.value?.trim() || '' };
  }).filter(Boolean);
  if (subGroups.length === 0) subGroups = [{ time: 'שחקנים', day: null, meetingTime: '', location: '' }];
  const dayOfWeek = subGroups.find(sg => sg.day != null)?.day ?? 0;
  const id = 'team-' + name.replace(/[^a-zA-Z0-9א-ת]/g, '-').replace(/-+/g, '-').toLowerCase() + '-' + Date.now();
  const teamDef = { name, coach, region, dayOfWeek, subGroups };
  try {
    await db.ref(`dbTeams/${id}`).set(teamDef);
    _useDbTeams = true;
    const newTeam = { id, ...teamDef, region, subGroups: subGroups.map(sg => ({ ...sg, players: [] })) };
    teams.push(newTeam);
    document.querySelector('.friday-modal')?.remove();
    showToast(`הנבחרת "${name}" נוצרה ✅`);
    // Add tab dynamically
    const tabsBar = document.getElementById('tabsBar');
    const content = document.getElementById('content');
    const tIdx = teams.length - 1;
    // Remove "אין נבחרות" placeholder if present
    document.querySelector('[data-tab="teams-empty"]')?.remove();
    const btn = document.createElement('button');
    btn.className = 'tab-btn'; btn.dataset.tab = 'team-' + id;
    btn.textContent = '🏅 ' + name + (coach ? ' — ' + coach : '');
    btn.onclick = () => switchTab('team-' + id);
    // Insert before the "ניהול" section label (end of נבחרות section)
    const mgmtLabel = [...tabsBar.querySelectorAll('.sidebar-section-label')]
      .find(el => el.textContent.trim() === 'ניהול');
    tabsBar.insertBefore(btn, mgmtLabel || null);
    const panel = document.createElement('div');
    panel.className = 'tab-panel'; panel.id = 'panel-team-' + id;
    panel.innerHTML = renderTeamGroup(newTeam, tIdx);
    content.appendChild(panel);
    const tp = document.getElementById('panel-teams-admin');
    if (tp) tp.innerHTML = renderTeamsAdminPanel();
    switchTab('team-' + id);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.saveNewTeam = saveNewTeam;

async function deleteDbTeam(teamId) {
  if (!confirm('למחוק את הנבחרת לצמיתות? כל השחקנים שלה יימחקו.')) return;
  try {
    await db.ref(`dbTeams/${teamId}`).remove();
    await db.ref(`team_players/${teamId}`).remove();
    teams = teams.filter(t => t.id !== teamId);
    document.querySelector(`[data-tab="team-${teamId}"]`)?.remove();
    document.getElementById('panel-team-' + teamId)?.remove();
    const tp = document.getElementById('panel-teams-admin');
    if (tp) tp.innerHTML = renderTeamsAdminPanel();
    showToast('הנבחרת נמחקה');
    switchTab('teams-admin');
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.deleteDbTeam = deleteDbTeam;

// ===== ARCHIVE PLAYER PICKER =====

async function openArchivePlayerPicker(groupIdx, subGroupIdx) {
  try {
    const snap = await db.ref('yearArchive').get();
    const archive = snap.val();
    if (!archive) { showToast('אין ארכיון עדיין'); return; }
    // Collect all players from all archived years
    const allPlayers = [];
    Object.entries(archive).forEach(([yearKey, yearData]) => {
      const yearLabel = yearData.name || yearKey;
      // From group definitions (base players)
      if (yearData.groupDefinitions) {
        yearData.groupDefinitions.forEach(gd => {
          gd.subGroups?.forEach(sg => {
            sg.players?.forEach(p => {
              if (p.hidden) return;
              allPlayers.push({ ...p, _year: yearLabel, _group: gd.name });
            });
          });
        });
      }
      // From extra_players
      if (yearData.extra_players) {
        Object.entries(yearData.extra_players).forEach(([gid, subs]) => {
          const gDef = yearData.groupDefinitions?.find(g => g.id === gid);
          Object.values(subs).forEach(sub => {
            Object.values(sub || {}).forEach(p => {
              allPlayers.push({ name: `${p.firstName} ${p.lastName}`, birthYear: p.birthYear, fedId: p.fedId, _year: yearLabel, _group: gDef?.name || gid });
            });
          });
        });
      }
    });
    // Deduplicate by name
    const seen = new Set();
    const unique = allPlayers.filter(p => { const k = p.name?.trim(); if (!k || seen.has(k)) return false; seen.add(k); return true; });
    unique.sort((a,b) => (a.name||'').localeCompare(b.name||'', 'he'));
    const rows = unique.map(p => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 10px;border-radius:7px;cursor:pointer;hover:background:#f7fafc"
        onmouseenter="this.style.background='#f7fafc'" onmouseleave="this.style.background=''"
        onclick="pickArchivePlayer(${JSON.stringify(p).replace(/"/g,'&quot;')})">
        <div>
          <span style="font-weight:600;font-size:14px">${p.name||'?'}</span>
          ${p.birthYear ? `<span style="font-size:12px;color:#718096"> · ${p.birthYear}</span>` : ''}
          ${p.fedId ? `<span style="font-size:12px;color:#2b6cb0"> · ${p.fedId}</span>` : ''}
        </div>
        <span style="font-size:11px;color:#a0aec0">${p._group||''} · ${p._year||''}</span>
      </div>`).join('');
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
        <div class="modal-box" style="max-width:500px">
          <div class="modal-header">
            <span class="modal-title">📂 בחר שחקן מהארכיון</span>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
          </div>
          <div style="padding:12px 16px;border-bottom:1px solid #e2e8f0">
            <input type="text" id="archive-search" placeholder="חפש שם..." oninput="filterArchivePlayers(this.value)"
              style="width:100%;box-sizing:border-box;border:1px solid #e2e8f0;border-radius:8px;padding:8px 12px;font-size:14px;font-family:inherit">
          </div>
          <div id="archive-player-list" class="modal-body" style="padding:8px;max-height:360px;overflow-y:auto">${rows}</div>
        </div>
      </div>`);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.openArchivePlayerPicker = openArchivePlayerPicker;

function filterArchivePlayers(q) {
  const list = document.getElementById('archive-player-list');
  if (!list) return;
  const lq = q.trim().toLowerCase();
  list.querySelectorAll('div[onclick]').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(lq) ? '' : 'none';
  });
}
window.filterArchivePlayers = filterArchivePlayers;

function pickArchivePlayer(p) {
  document.querySelector('.friday-modal')?.remove();
  const fill = (id, val) => { const el = document.getElementById(id); if (el && val != null) el.value = val; };
  const [first, ...rest] = (p.name || '').split(' ');
  fill('mf-first', first || '');
  fill('mf-last', rest.join(' ') || '');
  fill('mf-year', p.birthYear || '');
  fill('mf-fed', p.fedId || '');
  if (p.fedId) { document.getElementById('mf-fed')?.dispatchEvent(new Event('change')); }
}
window.pickArchivePlayer = pickArchivePlayer;

// ===== CAMPS (מחנות) =====

function renderCampsPanel() {
  const rows = camps.map(c => {
    const levelCount = c.levels.length;
    const playerCount = c.levels.reduce((s, lv) => s + lv.players.filter(p => !p.hidden).length, 0);
    const instructors = [...new Set(c.levels.map(lv => lv.instructor).filter(Boolean))];
    const dates = c.startDate ? `${formatDate(c.startDate)}${c.endDate ? ' – ' + formatDate(c.endDate) : ''}` : '';
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:8px;background:var(--bg-subtle);margin-bottom:6px">
        <div style="flex:1;min-width:0">
          <span style="font-weight:600;font-size:14px;color:var(--text-primary)">🏕️ ${c.name}</span>
          ${dates ? `<span style="font-size:12px;color:var(--text-muted);margin-right:8px"> · ${dates}</span>` : ''}
          <span style="font-size:12px;color:var(--text-muted)"> · ${levelCount} רמ${levelCount===1?'ה':'ות'} · ${playerCount} ילדים</span>
          ${instructors.length ? `<span style="font-size:11px;color:#4a90d9;margin-right:6px">${instructors.join(', ')}</span>` : ''}
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
          <button onclick="openEditCampModal('${c.id}')" style="background:var(--bg-card);border:1px solid var(--border);color:var(--text-primary);border-radius:6px;padding:4px 10px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">✎ ערוך</button>
          <button onclick="deleteDbCamp('${c.id}')" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:16px">🗑</button>
        </div>
      </div>`;
  }).join('');
  return `
    <div style="direction:rtl;max-width:900px">
      <button onclick="switchTab('settings')" style="background:none;border:none;color:#4a90d9;font-size:13px;cursor:pointer;padding:0 0 14px;font-family:inherit">‹ חזרה להגדרות</button>
      <h3 style="font-size:20px;font-weight:800;margin:0 0 20px;color:var(--text-primary)">🏕️ ניהול מחנות</h3>
      <div>${rows || '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:16px">אין מחנות עדיין — צור את המחנה הראשון (מחנה קיץ, סוכות, פסח...)</div>'}</div>
      <div style="margin-top:14px">
        <button onclick="openCreateCampModal()" style="background:#2b6cb0;color:white;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">➕ צור מחנה חדש</button>
      </div>
    </div>`;
}
window.renderCampsPanel = renderCampsPanel;

// The operational page for one camp — reached via its own top-nav tab (like a group/team page)
function renderCampOwnPage(camp) {
  const dates = camp.startDate ? `${formatDate(camp.startDate)}${camp.endDate ? ' – ' + formatDate(camp.endDate) : ''}` : '';
  const levelsHtml = camp.levels.map((lv, li) => renderCampLevelCard(camp, lv, li)).join('');
  return `
    <div style="direction:rtl;max-width:900px;padding:20px">
      <div style="margin-bottom:20px">
        <h3 style="font-size:20px;font-weight:800;margin:0;color:var(--text-primary)">🏕️ ${camp.name}</h3>
        ${dates ? `<div style="font-size:13px;color:var(--text-muted);margin-top:4px">${dates}</div>` : ''}
      </div>
      ${levelsHtml}
    </div>`;
}
window.renderCampOwnPage = renderCampOwnPage;

// Refreshes whichever camp UI is currently on screen after a data change
function refreshCampPanel(campId) {
  const camp = camps.find(c => c.id === campId);
  const ownPanel = document.getElementById('panel-camp-' + campId);
  if (ownPanel && camp) ownPanel.innerHTML = renderCampOwnPage(camp);
  const settingsPanel = document.getElementById('panel-camps');
  if (settingsPanel) settingsPanel.innerHTML = renderCampsPanel();
}
window.refreshCampPanel = refreshCampPanel;

function renderCampLevelCard(camp, lv, li) {
  const players = sortedPlayers(lv.players);
  const rows = players.map(({p}) => {
    const { first, last } = splitName(p.name);
    const age = p.birthYear ? `${p.birthYear} (גיל ${CURRENT_YEAR - p.birthYear})` : '—';
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-radius:6px;background:var(--bg-subtle);margin-bottom:4px">
        <div style="font-size:13px;color:var(--text-primary)">${last} ${first} <span style="color:var(--text-muted);font-size:11px">· ${age}</span></div>
        <button onclick="removeCampPlayer('${camp.id}',${li},'${p._key}')" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:14px">🗑</button>
      </div>`;
  }).join('');
  return `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">
        <div>
          <span style="font-weight:700;font-size:15px;color:var(--text-primary)">${lv.name || 'רמה'}</span>
          <span style="font-size:12px;color:var(--text-muted);margin-right:8px">${lv.instructor ? '· מדריך: ' + lv.instructor : '· ⚠️ אין מדריך משוייך'}</span>
        </div>
        <button onclick="openAddCampPlayerModal('${camp.id}',${li})" style="background:#276749;color:white;border:none;border-radius:6px;padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">➕ הוסף ילד</button>
      </div>
      <div>
        ${rows || '<div style="color:var(--text-muted);font-size:12px;padding:6px 0">אין שחקנים ברמה זו</div>'}
      </div>
    </div>`;
}

// ── Create / edit camp ──────────────────────────

function _campLevelRow(lv) {
  return `<div class="camp-lv-row" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:6px 0;border-bottom:1px solid #f0f4f8">
    <input type="text" class="modal-input camp-lv-name" value="${lv.name||''}" placeholder="שם הרמה (למשל: מתחילים)" style="flex:1;min-width:110px">
    <input type="text" class="modal-input camp-lv-instructor" value="${lv.instructor||''}" placeholder="מדריך אחראי" style="flex:1;min-width:110px">
    <button onclick="this.closest('.camp-lv-row').remove()" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:16px">✕</button>
  </div>`;
}
window._campLevelRow = _campLevelRow;

function addCampLevelRow() {
  const cont = document.getElementById('camp-levels');
  if (!cont) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = _campLevelRow({});
  cont.appendChild(tmp.firstElementChild);
}
window.addCampLevelRow = addCampLevelRow;

function addCampLevelRowTo(containerId) {
  const cont = document.getElementById(containerId);
  if (!cont) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = _campLevelRow({});
  cont.appendChild(tmp.firstElementChild);
}
window.addCampLevelRowTo = addCampLevelRowTo;

function openCreateCampModal() {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:480px">
        <div class="modal-header">
          <span class="modal-title">➕ יצירת מחנה חדש</span>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:12px">
          <div class="modal-field"><label>שם המחנה <span style="color:#e53e3e">*</span></label>
            <input type="text" id="cc-name" placeholder='לדוגמה: מחנה סוכות 2026' class="modal-input"></div>
          <div style="display:flex;gap:10px">
            <div class="modal-field" style="flex:1"><label>תאריך התחלה</label><input type="date" id="cc-start" class="modal-input"></div>
            <div class="modal-field" style="flex:1"><label>תאריך סיום</label><input type="date" id="cc-end" class="modal-input"></div>
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#4a5568;display:block;margin-bottom:4px">רמות <span style="font-size:11px;color:#a0aec0;font-weight:400">— לכל רמה מדריך אחראי משלה</span></label>
            <div id="camp-levels" style="display:flex;flex-direction:column">${_campLevelRow({})}</div>
            <button onclick="addCampLevelRow()" style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:7px;padding:5px 12px;font-size:12px;cursor:pointer;font-family:inherit;color:#4a5568;margin-top:6px">+ הוסף רמה</button>
          </div>
          <button onclick="saveNewCamp()" style="background:#2b6cb0;color:white;border:none;border-radius:8px;padding:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">💾 צור מחנה</button>
        </div>
      </div>
    </div>`);
}
window.openCreateCampModal = openCreateCampModal;

function _readCampLevelRows(containerId) {
  const rows = document.querySelectorAll(`#${containerId} .camp-lv-row`);
  return [...rows].map(row => {
    const name = row.querySelector('.camp-lv-name')?.value?.trim() || '';
    const instructor = row.querySelector('.camp-lv-instructor')?.value?.trim() || '';
    if (!name) return null;
    return { name, instructor };
  }).filter(Boolean);
}

async function saveNewCamp() {
  const name = document.getElementById('cc-name')?.value?.trim();
  if (!name) { showToast('יש להזין שם מחנה', 'error'); return; }
  const startDate = document.getElementById('cc-start')?.value || null;
  const endDate = document.getElementById('cc-end')?.value || null;
  let levels = _readCampLevelRows('camp-levels');
  if (levels.length === 0) levels = [{ name: 'שחקנים', instructor: '' }];
  const id = 'camp-' + name.replace(/[^a-zA-Z0-9א-ת]/g, '-').replace(/-+/g, '-').toLowerCase() + '-' + Date.now();
  const campDef = { name, startDate, endDate, levels };
  try {
    await db.ref(`dbCamps/${id}`).set(campDef);
    _useDbCamps = true;
    const newCamp = { id, ...campDef, levels: levels.map(lv => ({ ...lv, players: [] })) };
    camps.push(newCamp);
    document.querySelector('.friday-modal')?.remove();
    showToast(`המחנה "${name}" נוצר ✅`);

    // Create its own tab/panel, same as a new group/team gets
    const btnHost = document.getElementById('_tab-btn-store') || document.getElementById('tabsBar');
    const btn = document.createElement('button');
    btn.className = 'tab-btn'; btn.dataset.tab = 'camp-' + id;
    btn.textContent = '🏕️ ' + name;
    btn.onclick = () => switchTab('camp-' + id);
    btnHost?.appendChild(btn);
    const panel = document.createElement('div');
    panel.className = 'tab-panel'; panel.id = 'panel-camp-' + id;
    panel.innerHTML = renderCampOwnPage(newCamp);
    document.getElementById('content')?.appendChild(panel);
    if (window._tabCatMap) window._tabCatMap['camp-' + id] = 'cat-camps';

    refreshCampsHubPanel();
    refreshCampPanel(id);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.saveNewCamp = saveNewCamp;

function openEditCampModal(campId) {
  const camp = camps.find(c => c.id === campId);
  if (!camp) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:480px">
        <div class="modal-header">
          <span class="modal-title">✎ עריכת מחנה</span>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:12px">
          <div class="modal-field"><label>שם המחנה <span style="color:#e53e3e">*</span></label>
            <input type="text" id="ec-name" value="${camp.name}" class="modal-input"></div>
          <div style="display:flex;gap:10px">
            <div class="modal-field" style="flex:1"><label>תאריך התחלה</label><input type="date" id="ec-start" value="${camp.startDate||''}" class="modal-input"></div>
            <div class="modal-field" style="flex:1"><label>תאריך סיום</label><input type="date" id="ec-end" value="${camp.endDate||''}" class="modal-input"></div>
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#4a5568;display:block;margin-bottom:4px">רמות <span style="font-size:11px;color:#a0aec0;font-weight:400">— הסרת רמה לא מוחקת שחקנים שכבר נרשמו אליה</span></label>
            <div id="camp-levels-edit" style="display:flex;flex-direction:column">${camp.levels.map(_campLevelRow).join('')}</div>
            <button onclick="addCampLevelRowTo('camp-levels-edit')" style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:7px;padding:5px 12px;font-size:12px;cursor:pointer;font-family:inherit;color:#4a5568;margin-top:6px">+ הוסף רמה</button>
          </div>
          <button onclick="saveEditCamp('${campId}')" style="background:#2b6cb0;color:white;border:none;border-radius:8px;padding:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">💾 שמור שינויים</button>
        </div>
      </div>
    </div>`);
}
window.openEditCampModal = openEditCampModal;

async function saveEditCamp(campId) {
  const camp = camps.find(c => c.id === campId);
  if (!camp) return;
  const name = document.getElementById('ec-name')?.value?.trim();
  if (!name) { showToast('יש להזין שם מחנה', 'error'); return; }
  const startDate = document.getElementById('ec-start')?.value || null;
  const endDate = document.getElementById('ec-end')?.value || null;
  let levels = _readCampLevelRows('camp-levels-edit');
  if (levels.length === 0) levels = [{ name: 'שחקנים', instructor: '' }];
  try {
    await db.ref(`dbCamps/${campId}`).update({ name, startDate, endDate, levels });
    camp.name = name; camp.startDate = startDate; camp.endDate = endDate;
    // Preserve players for levels that still exist by matching name; new/renamed levels start empty
    const oldLevels = camp.levels;
    camp.levels = levels.map(lv => {
      const match = oldLevels.find(ol => ol.name === lv.name);
      return { ...lv, players: match ? match.players : [] };
    });
    document.querySelector('.friday-modal')?.remove();
    showToast('המחנה עודכן ✅');
    const tabBtn = document.querySelector(`[data-tab="camp-${campId}"]`);
    if (tabBtn) tabBtn.textContent = '🏕️ ' + name;
    refreshCampsHubPanel();
    refreshCampPanel(campId);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.saveEditCamp = saveEditCamp;

async function deleteDbCamp(campId) {
  const camp = camps.find(c => c.id === campId);
  if (!camp) return;
  if (!confirm(`למחוק את המחנה "${camp.name}" לצמיתות? כל השחקנים והנוכחות שלו יימחקו.`)) return;
  try {
    await db.ref(`dbCamps/${campId}`).remove();
    await db.ref(`camp_players/${campId}`).remove();
    await db.ref(`camp_attendance/${campId}`).remove();
    camps = camps.filter(c => c.id !== campId);
    document.querySelector(`[data-tab="camp-${campId}"]`)?.remove();
    document.getElementById('panel-camp-' + campId)?.remove();
    refreshCampsHubPanel();
    showToast('המחנה נמחק');
    switchTab('camps');
    const panel = document.getElementById('panel-camps');
    if (panel) panel.innerHTML = renderCampsPanel();
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.deleteDbCamp = deleteDbCamp;

// ── Add / remove camp players ───────────────────

function openAddCampPlayerModal(campId, li) {
  const camp = camps.find(c => c.id === campId);
  const lv = camp?.levels[li];
  if (!camp || !lv) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:440px">
        <div class="modal-header">
          <span class="modal-title">➕ הוספת ילד — ${lv.name}</span>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:12px">
          <div style="background:#ebf8ff;border:1px solid #bee3f8;border-radius:10px;padding:14px">
            <label style="font-size:13px;font-weight:700;color:#2b6cb0;display:block;margin-bottom:2px">מספר שחקן באיגוד</label>
            <div style="font-size:11px;color:#4a5568;margin-bottom:8px">לא חובה — רק אם כבר רשום/ה באיגוד. שליפה תמלא אוטומטית את הפרטים למטה.</div>
            <div style="display:flex;gap:8px;align-items:center">
              <input type="text" id="cp-fed" placeholder="לדוגמה: 123456" inputmode="numeric" class="modal-input" style="flex:1">
              <button type="button" id="cp-fed-btn" onclick="lookupFedPlayer('cp')"
                style="padding:9px 14px;background:#2b6cb0;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;white-space:nowrap;font-family:inherit">
                🔍 שלוף
              </button>
            </div>
            <div id="cp-fed-status" style="font-size:12px;margin-top:6px;min-height:16px"></div>
          </div>
          <div style="display:flex;gap:10px">
            <div class="modal-field" style="flex:1"><label>שם פרטי <span style="color:#e53e3e">*</span></label><input type="text" id="cp-first" class="modal-input"></div>
            <div class="modal-field" style="flex:1"><label>שם משפחה</label><input type="text" id="cp-last" class="modal-input"></div>
          </div>
          <div class="modal-field">
            <label>שנת לידה</label>
            <input type="number" id="cp-year" class="modal-input" placeholder="2015" oninput="updateModalAge(this.value,'cp')">
            <div class="age-hint" id="cp-age"></div>
          </div>
          <div class="modal-field">
            <label>מין</label>
            <div class="pay-select" id="cp-gender-select">
              <button type="button" class="pay-btn" id="cp-gender-m" onclick="selectModalGender('m','cp')">👦 זכר</button>
              <button type="button" class="pay-btn" id="cp-gender-f" onclick="selectModalGender('f','cp')">👧 נקבה</button>
            </div>
            <input type="hidden" id="cp-gender" value="">
          </div>
          <div style="display:flex;gap:10px">
            <div class="modal-field" style="flex:1"><label>מד כושר ישראלי</label><input type="text" id="cp-rating" class="modal-input" placeholder="ממולא אוטומטית בשליפה" inputmode="numeric"></div>
            <div class="modal-field" style="flex:1"><label>תוקף כרטיס שחמטאי</label><input type="date" id="cp-card-expiry" class="modal-input" placeholder="ממולא אוטומטית בשליפה"></div>
          </div>
          <div style="margin-top:6px;padding-top:14px;border-top:1px dashed #e2e8f0">
            <div style="font-size:13px;font-weight:700;color:#4a5568;margin-bottom:2px">👪 פרטי הורים של הילד/ה</div>
            <div style="font-size:11px;color:#a0aec0;margin-bottom:14px">לא קיימים באתר האיגוד — נא למלא</div>
            <div class="modal-field"><label>שם הורה</label><input type="text" id="cp-parent-name" class="modal-input" placeholder="שם ההורה"></div>
            <div class="modal-field"><label>טלפון הורה</label><input type="text" id="cp-phone" class="modal-input" dir="ltr" placeholder="05X-XXXXXXX"></div>
          </div>
          <button onclick="saveCampPlayer('${campId}',${li})" style="background:#276749;color:white;border:none;border-radius:8px;padding:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">💾 הוסף</button>
        </div>
      </div>
    </div>`);
}
window.openAddCampPlayerModal = openAddCampPlayerModal;

async function saveCampPlayer(campId, li) {
  const firstName = document.getElementById('cp-first')?.value?.trim();
  if (!firstName) { showToast('יש להזין שם פרטי', 'error'); return; }
  const lastName     = document.getElementById('cp-last')?.value?.trim()  || '';
  const birthYear    = parseInt(document.getElementById('cp-year')?.value) || null;
  const fedIdRaw     = document.getElementById('cp-fed')?.value?.trim()   || '';
  const fedId        = fedIdRaw ? (parseInt(fedIdRaw) || null) : null;
  const gender       = document.getElementById('cp-gender')?.value       || null;
  const ratingRaw    = document.getElementById('cp-rating')?.value?.trim() || '';
  const rating       = ratingRaw ? (parseInt(ratingRaw) || null) : null;
  const cardExpiry   = document.getElementById('cp-card-expiry')?.value  || null;
  const parentPhone  = document.getElementById('cp-phone')?.value?.trim() || null;
  const parentName   = document.getElementById('cp-parent-name')?.value?.trim() || null;
  const playerDef = { firstName, lastName, birthYear, fedId, gender, rating, cardExpiry, parentPhone, parentName, paymentStatus: 'trial' };
  try {
    const ref = await db.ref(`camp_players/${campId}/${li}`).push(playerDef);
    const camp = camps.find(c => c.id === campId);
    camp.levels[li].players.push({ name: `${firstName} ${lastName}`.trim(), ...playerDef, hidden: false, _key: ref.key });
    document.querySelector('.friday-modal')?.remove();
    showToast('השחקן נוסף ✅');
    refreshCampPanel(campId);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.saveCampPlayer = saveCampPlayer;

async function removeCampPlayer(campId, li, playerKey) {
  if (!confirm('להסיר את השחקן מהמחנה?')) return;
  try {
    await db.ref(`camp_players/${campId}/${li}/${playerKey}/hidden`).set(true);
    const camp = camps.find(c => c.id === campId);
    const p = camp?.levels[li]?.players.find(pl => pl._key === playerKey);
    if (p) p.hidden = true;
    showToast('השחקן הוסר');
    refreshCampPanel(campId);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.removeCampPlayer = removeCampPlayer;

