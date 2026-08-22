// ===== HOURS LOGGING =====
function renderHoursPanel() {
  const today = new Date().toISOString().split('T')[0];
  return `
    <div class="att-card" style="max-width:720px">
      <div class="att-card-header">⏱️ דיווח שעות</div>
      <div style="padding:20px">
        <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px">
          <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">
            <div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:130px">
              <label style="font-size:13px;font-weight:600;color:#4a5568">תאריך</label>
              <input type="date" id="hours-date" value="${today}" style="padding:8px;border:2px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit">
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:140px">
              <label style="font-size:13px;font-weight:600;color:#4a5568">סוג פעילות</label>
              <select id="hours-type" style="padding:8px;border:2px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit">
                <option value="friday">יום שישי</option>
                <option value="tournament">תחרות</option>
                <option value="league">ליגה</option>
                <option value="other">אחר</option>
              </select>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;min-width:90px">
              <label style="font-size:13px;font-weight:600;color:#4a5568">שעות</label>
              <input type="number" id="hours-count" min="0.5" max="24" step="0.5" placeholder="2.5" style="padding:8px;border:2px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit;width:90px">
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:13px;font-weight:600;color:#4a5568">תיאור</label>
            <input type="text" id="hours-desc" placeholder="לדוגמא: ליגת הנוער רמת גן" style="padding:8px;border:2px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit">
          </div>
          <button onclick="saveHoursEntry()" style="align-self:flex-start;background:#2b6cb0;color:white;border:none;border-radius:8px;padding:10px 24px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">💾 שמור דיווח</button>
        </div>
        <hr style="border:none;border-top:2px solid #e2e8f0;margin:0 0 20px">
        <div id="hours-history"><div style="text-align:center;color:#a0aec0;padding:24px">טוען היסטוריה...</div></div>
      </div>
    </div>`;
}

async function saveHoursEntry() {
  const date = document.getElementById('hours-date').value;
  const type = document.getElementById('hours-type').value;
  const hoursVal = document.getElementById('hours-count').value;
  const desc = document.getElementById('hours-desc').value.trim();
  if (!date || !hoursVal || parseFloat(hoursVal) <= 0) {
    showToast('יש למלא תאריך ושעות', 'error'); return;
  }
  const typeLabels = { friday: 'יום שישי', tournament: 'תחרות', league: 'ליגה', other: 'אחר' };
  const entry = {
    instructorId: currentUser.uid,
    instructorName: currentUser.name,
    date,
    activityType: type,
    activityLabel: typeLabels[type],
    description: desc,
    hours: parseFloat(hoursVal),
    ts: Date.now()
  };
  try {
    await db.ref('hourLogs').push(entry);
    showToast('הדיווח נשמר ✅');
    document.getElementById('hours-count').value = '';
    document.getElementById('hours-desc').value = '';
    loadHoursHistory();
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}

async function loadHoursHistory() {
  const container = document.getElementById('hours-history');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;color:#a0aec0;padding:20px">טוען...</div>';
  try {
    const snap = await db.ref('hourLogs').orderByChild('ts').get();
    const entries = [];
    snap.forEach(child => { entries.push({ id: child.key, ...child.val() }); });
    entries.reverse();
    const isAdmin = currentUser?.role === 'admin';
    const filtered = isAdmin ? entries : entries.filter(e => e.instructorId === currentUser.uid);
    if (!filtered.length) {
      container.innerHTML = '<div style="text-align:center;color:#a0aec0;padding:24px">אין דיווחים עדיין</div>';
      return;
    }
    const totalHours = filtered.reduce((sum, e) => sum + (e.hours || 0), 0);
    const rows = filtered.map(e => `
      <tr style="border-bottom:1px solid #f0f4f8">
        ${isAdmin ? `<td style="padding:10px 12px;font-size:13px;font-weight:600">${e.instructorName || '—'}</td>` : ''}
        <td style="padding:10px 12px;font-size:13px">${e.date || '—'}</td>
        <td style="padding:10px 12px"><span style="background:#ebf4ff;color:#2b6cb0;padding:3px 10px;border-radius:10px;font-size:12px;font-weight:600;white-space:nowrap">${e.activityLabel || e.activityType}</span></td>
        <td style="padding:10px 12px;font-size:13px;color:#4a5568">${e.description || '<span style="color:#cbd5e0">—</span>'}</td>
        <td style="padding:10px 12px;text-align:center;font-weight:700;font-size:15px;color:#2b6cb0">${e.hours}</td>
        <td style="padding:10px 12px;font-size:12px;color:#a0aec0">${new Date(e.ts).toLocaleDateString('he-IL')}</td>
        ${isAdmin ? `<td style="padding:10px 8px;text-align:center"><button onclick="deleteHoursEntry('${e.id}')" title="מחק" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:16px;line-height:1">🗑</button></td>` : ''}
      </tr>`).join('');
    const thStyle = 'padding:10px 12px;text-align:right;font-size:12px;font-weight:700;color:#4a5568;border-bottom:2px solid #e2e8f0;background:#f7fafc';
    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">
        <span style="font-size:14px;font-weight:700;color:#2d3748">היסטוריית דיווחים (${filtered.length})</span>
        <span style="font-size:15px;font-weight:800;color:#2b6cb0">סה"כ: ${totalHours} שעות</span>
      </div>
      <div style="overflow-x:auto;border-radius:10px;border:1px solid #e2e8f0">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr>
            ${isAdmin ? `<th style="${thStyle}">מדריך</th>` : ''}
            <th style="${thStyle}">תאריך</th>
            <th style="${thStyle}">סוג</th>
            <th style="${thStyle}">תיאור</th>
            <th style="${thStyle};text-align:center">שעות</th>
            <th style="${thStyle}">הוזן ב</th>
            ${isAdmin ? `<th style="${thStyle}"></th>` : ''}
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  } catch(e) { container.innerHTML = `<div style="color:#c53030;padding:16px">שגיאה: ${e.message}</div>`; }
}

async function deleteHoursEntry(id) {
  if (!confirm('למחוק את הדיווח הזה?')) return;
  try {
    await db.ref('hourLogs/' + id).remove();
    showToast('הדיווח נמחק');
    loadHoursHistory();
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}

async function loadSubmissions() {
  const panel = document.getElementById('panel-submissions');
  if (!panel) return;
  panel.innerHTML = '<div style="padding:32px;text-align:center;color:#888;">טוען...</div>';
  try {
    const snap = await db.ref('contactSubmissions').get();
    const val = snap.val() || {};
    const items = Object.entries(val).map(([key, v]) => ({ id: key, ...v }));
    items.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    if (!items.length) {
      panel.innerHTML = '<div style="padding:32px;text-align:center;color:#888;">אין פניות עדיין</div>';
      return;
    }
    const unread = items.filter(x => !x.read).length;
    let html = `<div style="padding:24px;direction:rtl;max-width:800px;margin:0 auto;">
      <h2 style="font-size:22px;font-weight:800;margin:0 0 20px;">📩 פניות (${items.length}${unread ? ` — <span style="color:#e53e3e">${unread} חדשות</span>` : ''})</h2>
      <div style="display:flex;flex-direction:column;gap:14px;">`;
    items.forEach(item => {
      const date = new Date(item.ts).toLocaleString('he-IL');
      const bg = item.read ? '#f7fafc' : '#fffbeb';
      const border = item.read ? '#e2e8f0' : '#f6ad55';
      html += `<div style="background:${bg};border:1px solid ${border};border-radius:12px;padding:18px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
          <div>
            <span style="font-weight:800;font-size:16px;">${item.name}</span>
            <span style="color:#718096;font-size:13px;margin-right:10px;">${item.contact}</span>
            <span style="background:#ebf4ff;color:#3182ce;border-radius:20px;padding:2px 10px;font-size:12px;font-weight:700;">${item.subject}</span>
            ${!item.read ? '<span style="background:#fef3c7;color:#d97706;border-radius:20px;padding:2px 8px;font-size:11px;font-weight:700;margin-right:6px;">חדש</span>' : ''}
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <span style="color:#a0aec0;font-size:12px;">${date}</span>
            ${!item.read ? `<button onclick="markSubmissionRead('${item.id}')" style="background:#48bb78;color:white;border:none;border-radius:8px;padding:5px 12px;font-size:12px;cursor:pointer;font-family:inherit;">✓ סמן כנקרא</button>` : ''}
            <button onclick="deleteSubmission('${item.id}')" style="background:#fc8181;color:white;border:none;border-radius:8px;padding:5px 12px;font-size:12px;cursor:pointer;font-family:inherit;">🗑</button>
          </div>
        </div>
        ${item.message ? `<div style="font-size:14px;color:#4a5568;line-height:1.7;white-space:pre-wrap;">${item.message}</div>` : ''}
      </div>`;
    });
    html += '</div></div>';
    panel.innerHTML = html;
  } catch(e) {
    panel.innerHTML = `<div style="padding:32px;color:red;">שגיאה: ${e.message}</div>`;
  }
}

async function markSubmissionRead(id) {
  await db.ref('contactSubmissions/' + id + '/read').set(true);
  loadSubmissions();
}

async function deleteSubmission(id) {
  if (!confirm('למחוק פנייה זו?')) return;
  await db.ref('contactSubmissions/' + id).remove();
  loadSubmissions();
}

// Load extra players + overrides from Firebase
async function loadPlayerOverrides() {
  if (!db) return;
  try {
    const snap = await db.ref('player_overrides').get();
    if (!snap.val()) return;
    const data = snap.val();
    groups.forEach((g, groupIdx) => {
      if (!data[g.id]) return;
      g.subGroups.forEach((sg, subGroupIdx) => {
        const overrides = data[g.id][subGroupIdx];
        if (!overrides) return;
        Object.entries(overrides).forEach(([idxStr, o]) => {
          const idx = parseInt(idxStr);
          if (!sg.players[idx]) return;
          sg.players[idx].name      = `${o.firstName} ${o.lastName}`;
          if (o.birthYear) sg.players[idx].birthYear = o.birthYear;
          if (o.fedId)     sg.players[idx].fedId     = o.fedId;
        });
      });
      const op = document.getElementById('panel-' + g.id);
      if (op) op.innerHTML = renderGroup(g, groupIdx);
    });
  } catch(e) {
    console.error('Error loading player overrides:', e);
  }
}

// ===== REMOVE PLAYER =====

function confirmRemovePlayer() {
  const footer = document.getElementById('profileFooter');
  const { groupIdx, subGroupIdx, playerIdx } = _profileState;
  const p = groups[groupIdx].subGroups[subGroupIdx].players[playerIdx];
  const { first, last } = splitName(p.name);
  footer.innerHTML = `
    <span class="remove-confirm-text">להסיר את ${last} ${first}?</span>
    <button class="btn-confirm-yes" onclick="executeRemovePlayer()">כן, הסר</button>
    <button class="btn-confirm-no" onclick="resetProfileFooter()">ביטול</button>`;
}

function resetProfileFooter() {
  document.getElementById('profileFooter').innerHTML =
    '<button class="btn-remove-player" onclick="confirmRemovePlayer()">🗑 הסר משתתף</button>';
}

async function executeRemovePlayer() {
  const { groupIdx, subGroupIdx, playerIdx } = _profileState;
  const g = groups[groupIdx];
  if (!g) { showToast('שגיאה: חוג לא נמצא', 'error'); return; }
  const player = g.subGroups[subGroupIdx]?.players[playerIdx];
  if (!player) { showToast('שגיאה: שחקן לא נמצא', 'error'); return; }
  const {first, last} = splitName(player.name);

  // Update UI immediately (optimistic)
  player.hidden = true;
  document.getElementById('playerProfileModal').classList.remove('open');
  const panelEl = document.getElementById('panel-' + g.id);
  if (panelEl) panelEl.innerHTML = renderGroup(g, groupIdx);

  // Persist to Firebase
  if (db) {
    try {
      await db.ref(`history/${g.id}/${subGroupIdx}`).push({
        type: 'left', playerName: `${last} ${first}`, timestamp: Date.now(),
        playerIdx, subGroupIdx
      });
      await db.ref(`hidden_players/${g.id}/${subGroupIdx}/${playerIdx}`).set(true);
      logAudit('remove_player', g.id, g.name, `הוסר: ${last} ${first}`);
      showToast(`${first} ${last} הוסר/ה ✅`);
    } catch(e) {
      // Rollback UI if Firebase failed
      player.hidden = false;
      if (panelEl) panelEl.innerHTML = renderGroup(g, groupIdx);
      showToast('שגיאה בשמירה: ' + e.message, 'error');
      console.error('executeRemovePlayer:', e);
    }
  }
}
window.confirmRemovePlayer  = confirmRemovePlayer;
window.resetProfileFooter   = resetProfileFooter;
window.executeRemovePlayer  = executeRemovePlayer;

async function loadHiddenPlayers() {
  if (!db) return;
  try {
    const snap = await db.ref('hidden_players').get();
    if (!snap.val()) return;
    const data = snap.val();
    groups.forEach(g => {
      if (!data[g.id]) return;
      g.subGroups.forEach((sg, sgIdx) => {
        const hidden = data[g.id][sgIdx];
        if (!hidden) return;
        Object.keys(hidden).forEach(idxStr => {
          const idx = parseInt(idxStr);
          if (sg.players[idx]) sg.players[idx].hidden = true;
        });
      });
    });
  } catch(e) { console.error('Error loading hidden players:', e); }
}

// ===== GROUP / SUBGROUP NAME EDITING =====

function editGroupName(groupIdx) {
  const g = groups[groupIdx];
  const header = document.getElementById(`gname-header-${groupIdx}`);
  header.innerHTML = `
    <input class="name-edit-input" id="gname-input-${groupIdx}" value="${g.name.replace(/"/g,'&quot;')}">
    <button class="btn-name-save" onclick="saveGroupName(${groupIdx})">✓ שמור</button>
    <button class="btn-name-cancel" onclick="cancelGroupNameEdit(${groupIdx})">ביטול</button>`;
  const inp = document.getElementById(`gname-input-${groupIdx}`);
  inp.focus(); inp.select();
  inp.addEventListener('keydown', e => { if (e.key==='Enter') saveGroupName(groupIdx); if (e.key==='Escape') cancelGroupNameEdit(groupIdx); });
}

function cancelGroupNameEdit(groupIdx) {
  const g = groups[groupIdx];
  document.getElementById('panel-' + g.id).innerHTML = renderGroup(g, groupIdx);
}

async function saveGroupName(groupIdx) {
  const g = groups[groupIdx];
  const inp = document.getElementById(`gname-input-${groupIdx}`);
  const newName = inp.value.trim();
  if (!newName) return;
  g.name = newName;
  const tabBtn = document.querySelector(`[data-tab="${g.id}"]`);
  if (tabBtn) tabBtn.textContent = newName;
  if (db) await db.ref(`group_names/${g.id}`).set(newName);
  document.getElementById('panel-' + g.id).innerHTML = renderGroup(g, groupIdx);
}

function editSubGroupName(groupIdx, subGroupIdx) {
  const g = groups[groupIdx];
  const sg = g.subGroups[subGroupIdx];
  const fid = `${groupIdx}-${subGroupIdx}`;
  const header = document.getElementById(`sgname-header-${fid}`);
  header.innerHTML = `
    <input class="name-edit-input" id="sgname-input-${fid}" value="${(sg.time||'').replace(/"/g,'&quot;')}">
    <button class="btn-name-save" onclick="saveSubGroupName(${groupIdx},${subGroupIdx})">✓ שמור</button>
    <button class="btn-name-cancel" onclick="cancelSubGroupNameEdit(${groupIdx})">ביטול</button>`;
  const inp = document.getElementById(`sgname-input-${fid}`);
  inp.focus(); inp.select();
  inp.addEventListener('keydown', e => { if (e.key==='Enter') saveSubGroupName(groupIdx, subGroupIdx); if (e.key==='Escape') cancelSubGroupNameEdit(groupIdx); });
}

function cancelSubGroupNameEdit(groupIdx) {
  const g = groups[groupIdx];
  document.getElementById('panel-' + g.id).innerHTML = renderGroup(g, groupIdx);
}

async function saveSubGroupName(groupIdx, subGroupIdx) {
  const g = groups[groupIdx];
  const sg = g.subGroups[subGroupIdx];
  const fid = `${groupIdx}-${subGroupIdx}`;
  const inp = document.getElementById(`sgname-input-${fid}`);
  const newName = inp.value.trim();
  sg.time = newName;
  if (db) await db.ref(`subgroup_names/${g.id}/${subGroupIdx}`).set(newName || null);
  document.getElementById('panel-' + g.id).innerHTML = renderGroup(g, groupIdx);
}

async function loadGroupNames() {
  if (!db) return;
  try {
    const [gSnap, sgSnap] = await Promise.all([
      db.ref('group_names').get(),
      db.ref('subgroup_names').get(),
    ]);
    const gNames  = gSnap.val()  || {};
    const sgNames = sgSnap.val() || {};
    groups.forEach((g, groupIdx) => {
      if (gNames[g.id]) {
        g.name = gNames[g.id];
        const btn = document.querySelector(`[data-tab="${g.id}"]`);
        if (btn) btn.textContent = g.name;
      }
      if (sgNames[g.id]) {
        g.subGroups.forEach((sg, sgIdx) => {
          if (sgNames[g.id][sgIdx] != null) sg.time = sgNames[g.id][sgIdx];
        });
      }
      const gp = document.getElementById('panel-' + g.id);
      if (gp) gp.innerHTML = renderGroup(g, groupIdx);
    });
  } catch(e) { console.error('Error loading group names:', e); }
}

async function loadPayments() {
  if (!db) return;
  try {
    const snap = await db.ref('payment').get();
    if (!snap.val()) return;
    const data = snap.val();
    groups.forEach((g, groupIdx) => {
      if (!data[g.id]) return;
      g.subGroups.forEach((sg, subGroupIdx) => {
        const pays = data[g.id][subGroupIdx];
        if (!pays) return;
        Object.entries(pays).forEach(([idxStr, status]) => {
          const idx = parseInt(idxStr);
          if (sg.players[idx]) sg.players[idx].paymentStatus = status;
        });
      });
      const pp = document.getElementById('panel-' + g.id);
      if (pp) pp.innerHTML = renderGroup(g, groupIdx);
    });
  } catch(e) {
    console.error('Error loading payments:', e);
  }
}

function printReport() {
  const g = groups[reportsState.groupIdx];
  const sg = g.subGroups[reportsState.subGroupIdx];
  const modeLabel = reportsState.mode === 'summary' ? 'דוח שנתי'
    : reportsState.mode === 'monthly' ? `דוח חודשי — ${getSchoolMonths().find(m=>m.value===reportsState.month)?.label||reportsState.month}`
    : `לפי תאריך — ${formatDate(reportsState.date)}`;
  const subLabel = sg.time ? ` — ${sg.time}` : '';
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html lang="he" dir="rtl"><head>
    <meta charset="UTF-8">
    <title>דוח נוכחות — ${g.name}${subLabel}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #1a1a2e; padding: 24px; }
      h2 { font-size: 18px; margin-bottom: 4px; }
      .sub { font-size: 13px; color: #718096; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th { background: #2b6cb0; color: white; padding: 8px 12px; text-align: right; }
      th:nth-child(1) { width: 36px; text-align: center; }
      ${reportsState.mode === 'monthly'
        ? 'th, td { text-align: center; padding: 6px 8px; font-size: 12px; } td:nth-child(2), th:nth-child(2) { text-align: right; white-space: nowrap; }'
        : 'th:nth-child(3), th:nth-child(4), th:nth-child(5) { text-align: center; width: 60px; } th:nth-child(6) { display: none; }'}
      td { padding: 7px 12px; border-bottom: 1px solid #e2e8f0; }
      ${reportsState.mode !== 'monthly' ? 'td:nth-child(6) { display: none; }' : ''}
      tr:nth-child(even) td { background: #f7fafc; }
      .progress-bar-wrap { display: none; }
    
    /style>
  </head><body>
    <h2>דוח נוכחות — ${g.name}${subLabel}</h2>
    <div class="sub">${modeLabel} · ${new Date().toLocaleDateString('he-IL')}</div>
    ${document.getElementById('reportsContent').innerHTML}
  
</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

async function loadParentContacts() {
  if (!db) return;
  try {
    const snap = await db.ref('player_contacts').get();
    if (!snap.val()) return;
    const data = snap.val();
    groups.forEach((g) => {
      if (!data[g.id]) return;
      g.subGroups.forEach((sg, subGroupIdx) => {
        const contacts = data[g.id][subGroupIdx];
        if (!contacts) return;
        Object.entries(contacts).forEach(([idxStr, c]) => {
          const idx = parseInt(idxStr);
          if (sg.players[idx]) {
            sg.players[idx].parentPhone = c.parentPhone || null;
            sg.players[idx].parentEmail = c.parentEmail || null;
          }
        });
      });
    });
  } catch(e) { console.error('Error loading parent contacts:', e); }
}

// ===== WHATSAPP EXPORT =====

function openWhatsAppExport(groupIdx, subGroupIdx) {
  const g = groups[groupIdx];
  const sg = g.subGroups[subGroupIdx];
  const label = sg.time ? `${g.name} · ${sg.time}` : g.name;
  document.getElementById('waModalSubtitle').textContent = label;
  const lines = [`*${label}*`, ''];
  sortedPlayers(sg.players).forEach(({ p }) => {
    if (p.hidden) return;
    const { first, last } = splitName(p.name);
    const phone = p.parentPhone || '—';
    lines.push(`• ${last} ${first} — ${phone}`);
  });
  document.getElementById('waText').value = lines.join('\n');
  document.getElementById('whatsappModal').classList.add('open');
}
function closeWhatsappModal(e) {
  if (e && e.target !== document.getElementById('whatsappModal')) return;
  document.getElementById('whatsappModal').classList.remove('open');
}
function copyWaText() {
  navigator.clipboard.writeText(document.getElementById('waText').value)
    .then(() => showToast('הועתק ✓'))
    .catch(() => { document.getElementById('waText').select(); document.execCommand('copy'); showToast('הועתק ✓'); });
}

// ===== SEARCH PANEL =====

function renderSearchPanel() {
  return `<div class="att-card" style="max-width:800px">
    <div class="att-card-header">🔍 חיפוש שחקן</div>
    <div style="padding:16px 20px">
      <div style="display:flex;gap:8px;margin-bottom:16px">
        <input class="search-input" id="searchInput" type="text" placeholder="הקלד שם שחקן לחיפוש..." autocomplete="off" style="margin-bottom:0;flex:1">
        <button onclick="runSearch()" style="padding:12px 20px;background:#2b6cb0;color:white;border:none;border-radius:10px;font-size:15px;font-weight:700;font-family:inherit;cursor:pointer">🔍 חפש</button>
      </div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <span style="font-size:14px;color:#4a5568;font-weight:600">טווח גיל:</span>
        <input type="number" id="ageMin" placeholder="מגיל" min="4" max="99" style="width:80px;padding:8px;border:2px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit">
        <span style="color:#718096">—</span>
        <input type="number" id="ageMax" placeholder="עד גיל" min="4" max="99" style="width:80px;padding:8px;border:2px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit">
        <select id="genderFilter" style="padding:8px;border:2px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit">
          <option value="">כל המינים</option>
          <option value="m">זכר</option>
          <option value="f">נקבה</option>
        </select>
        <button onclick="document.getElementById('ageMin').value='';document.getElementById('ageMax').value='';document.getElementById('searchInput').value='';document.getElementById('genderFilter').value='';runSearch()" style="padding:7px 14px;background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer;font-size:13px;font-family:inherit">נקה</button>
      </div>
      <div id="searchResults"><div style="text-align:center;color:#718096;padding:20px">הקלד שם או בחר טווח גיל לחיפוש</div></div>
    </div>
  </div>`;
}

function runSearch() {
  const query = (document.getElementById('searchInput')?.value || '').trim();
  const ageMinVal = document.getElementById('ageMin')?.value;
  const ageMaxVal = document.getElementById('ageMax')?.value;
  const ageMin = ageMinVal ? parseInt(ageMinVal) : null;
  const ageMax = ageMaxVal ? parseInt(ageMaxVal) : null;
  const gender = document.getElementById('genderFilter')?.value || '';
  onSearchInput(query, ageMin, ageMax, gender);
}

function onSearchInput(query, ageMin = null, ageMax = null, gender = '') {
  const div = document.getElementById('searchResults');
  if (!div) return;
  const q = query.trim();
  const hasName = q.length >= 2;
  const hasAge = ageMin !== null || ageMax !== null;
  const hasGender = gender !== '';
  if (!hasName && !hasAge && !hasGender) {
    div.innerHTML = '<div style="text-align:center;color:#718096;padding:20px">הקלד שם או בחר טווח גיל לחיפוש</div>';
    return;
  }
  const currentYear = new Date().getFullYear();
  const results = [];
  groups.forEach((g, gi) => g.subGroups.forEach((sg, si) => {
    sg.players.forEach((p, pi) => {
      if (p.hidden) return;
      const { first, last } = splitName(p.name);
      const fullName = `${first} ${last}`.toLowerCase();
      const fullNameRev = `${last} ${first}`.toLowerCase();
      const nameMatch = !hasName || fullName.includes(q.toLowerCase()) || fullNameRev.includes(q.toLowerCase());
      const age = p.birthYear ? currentYear - p.birthYear : null;
      const ageMatch = !hasAge || (age !== null && (ageMin === null || age >= ageMin) && (ageMax === null || age <= ageMax));
      const genderMatch = !hasGender || p.gender === gender;
      if (nameMatch && ageMatch && genderMatch) {
        results.push({ p, gi, si, pi, g, sg, groupLabel: sg.time ? `${g.name} · ${sg.time}` : g.name, age });
      }
    });
  }));
  if (results.length === 0) {
    div.innerHTML = '<div style="text-align:center;color:#718096;padding:20px">לא נמצאו תוצאות</div>';
    return;
  }
  const rows = results.map((r, i) => {
    const { first, last } = splitName(r.p.name);
    const status = r.p.paymentStatus || 'trial';
    const badge = `<span class="pay-badge pay-${status}">${{trial:'ניסיון',pending:'ממתין',paid:'שילם ✓'}[status]}</span>`;
    return `<tr class="search-result-row" onclick="openPlayerProfile(${r.gi},${r.si},${r.pi})">
      <td class="idx">${i+1}</td>
      <td style="font-weight:600">${last}</td>
      <td>${first}</td>
      <td style="color:#4a5568;font-size:13px">${r.age !== null ? r.age : '—'}</td>
      <td style="color:#4a5568;font-size:13px">${r.groupLabel}</td>
      <td>${badge}</td>
    </tr>`;
  }).join('');
  div.innerHTML = `<div style="overflow-x:auto"><table class="pay-table">
    <thead><tr><th>#</th><th>שם משפחה</th><th>שם פרטי</th><th>גיל</th><th>קבוצה</th><th>תשלום</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div><div style="padding:8px 0;font-size:12px;color:#718096;text-align:center">${results.length} תוצאות</div>`;
}

// ===== SETTINGS =====

async function loadSettings() {
  if (!db) return;
  try {
    const snap = await db.ref('settings').get();
    const data = snap.val();
    if (data && data.yearStart) YEAR_START = data.yearStart;
    if (data && data.yearEnd)   YEAR_END   = data.yearEnd;
  } catch(e) { console.error('loadSettings error:', e); }
}

function renderSettingsPanel() {
  const isAdmin = currentUser?.role === 'admin';
  const cards = [
    { icon: '⚙️', label: 'הגדרות שנה',    key: 'year' },
    { icon: '🏫', label: 'ניהול חוגים',   key: 'groups' },
    { icon: '🏅', label: 'ניהול נבחרות',  key: 'teams' },
    { icon: '👥', label: 'ניהול מדריכים', key: 'instructors' },
    ...(isAdmin ? [{ icon: '🔐', label: 'ניהול משתמשים', key: 'users' }] : []),
    { icon: '🚧', label: 'לוח החוגים',    key: 'schedule-visibility' },
    { icon: '📂', label: 'ארכיון שנים קודמות', key: 'viewarchive' },
    { icon: '🏁', label: 'סיום שנה',      key: 'endyear', danger: true },
  ];
  return `
    <div style="direction:rtl;max-width:700px">
      <h3 style="font-size:20px;font-weight:800;margin:0 0 24px;color:var(--text-primary)">⚙️ הגדרות</h3>
      <div class="hub-grid">
        ${cards.map(c => `
          <button class="hub-card" onclick="openSettingsSection('${c.key}')"
            ${c.danger ? 'style="border-color:rgba(197,48,48,0.35)"' : ''}>
            <div class="hub-card-icon">${c.icon}</div>
            <div class="hub-card-title" ${c.danger ? 'style="color:#fc8181"' : ''}>${c.label}</div>
          </button>`).join('')}
      </div>
    </div>`;
}

window.openSettingsSection = function(key) {
  if (key === 'endyear') { openEndYearModal(); return; }
  if (key === 'viewarchive') { openArchiveBrowser(); return; }

  const titles = {
    year:                 '⚙️ הגדרות שנה',
    groups:               '🏫 ניהול חוגים',
    teams:                '🏅 ניהול נבחרות',
    instructors:          '👥 ניהול מדריכים',
    users:                '🔐 ניהול משתמשים',
    'schedule-visibility':'🚧 לוח החוגים באתר',
  };

  function getBody() {
    if (key === 'year') {
      return `
        <div style="display:flex;flex-direction:column;gap:14px">
          <div class="modal-field"><label>תחילת שנה</label><input type="date" id="set-year-start" value="${YEAR_START}"></div>
          <div class="modal-field"><label>סוף שנה</label><input type="date" id="set-year-end" value="${YEAR_END}"></div>
          <div style="margin-top:4px"><button class="btn-form-submit" onclick="saveSettings()">💾 שמור הגדרות</button></div>
        </div>`;
    }
    if (key === 'groups') {
      const rows = groups.map((g, i) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:8px;background:var(--bg-subtle);margin-bottom:6px">
          <div style="flex:1;min-width:0">
            <span style="font-weight:600;font-size:14px;color:var(--text-primary)">${g.name}</span>
            ${g.instructor ? `<span style="font-size:12px;color:var(--text-muted);margin-right:8px"> · ${g.instructor}</span>` : ''}
            <span style="font-size:12px;color:var(--text-muted)"> · ${g.subGroups.length} קבוצות</span>
            ${(g.meetings||[]).length > 0 ? `<span style="font-size:11px;color:#4a90d9;margin-right:6px">${formatTeamMeetingsSummary(g.meetings)}</span>` : ''}
          </div>
          <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
            <button onclick="openEditGroupModal(${i})" style="background:var(--bg-card);border:1px solid var(--border);color:var(--text-primary);border-radius:6px;padding:4px 10px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">✎ ערוך</button>
            <button onclick="deleteDbGroup('${g.id}')" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:16px">🗑</button>
          </div>
        </div>`).join('');
      return `
        <div>${rows || '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:16px">אין חוגים — צור את הראשון</div>'}</div>
        <div style="margin-top:14px">
          <button onclick="openCreateGroupModal()" style="background:#2b6cb0;color:white;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">➕ צור חוג חדש</button>
        </div>`;
    }
    if (key === 'teams') {
      let teamsHtml = '';
      if (teams.length === 0) {
        teamsHtml = '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:16px">אין נבחרות — צור את הראשונה</div>';
      } else {
        const regions = [...new Set(teams.map(t => t.region || ''))];
        teamsHtml = regions.map(region => {
          const regionTeams = teams.filter(t => (t.region || '') === region);
          const header = region ? `<div style="font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:0.8px;text-transform:uppercase;padding:8px 4px 4px">― ${region} ―</div>` : '';
          return header + regionTeams.map(t => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:8px;background:var(--bg-subtle);margin-bottom:4px">
              <div style="flex:1;min-width:0">
                <span style="font-weight:600;font-size:14px;color:var(--text-primary)">🏅 ${t.name}</span>
                ${t.coach ? `<span style="font-size:12px;color:var(--text-muted);margin-right:8px"> · ${t.coach}</span>` : ''}
                <span style="font-size:11px;color:var(--text-muted);margin-right:6px">${t.subGroups.length} קטגורי${t.subGroups.length===1?'ה':'ות'}</span>
                ${(t.meetings||[]).length > 0 ? `<span style="font-size:11px;color:#4a90d9;margin-right:6px">${formatTeamMeetingsSummary(t.meetings)}</span>` : ''}
              </div>
              <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
                <button onclick="openEditTeamModal('${t.id}')" style="background:var(--bg-card);border:1px solid var(--border);color:var(--text-primary);border-radius:6px;padding:4px 10px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">✎ ערוך</button>
                <button onclick="deleteDbTeam('${t.id}')" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:16px">🗑</button>
              </div>
            </div>`).join('');
        }).join('');
      }
      return `
        <div>${teamsHtml}</div>
        <div style="margin-top:14px">
          <button onclick="openCreateTeamModal()" style="background:#553c9a;color:white;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">➕ צור נבחרת חדשה</button>
        </div>`;
    }
    if (key === 'instructors') {
      return `
        <div id="instructors-list">
          <div style="color:var(--text-muted);font-size:13px;text-align:center;padding:12px">טוען מדריכים...</div>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button onclick="openAddInstructorModal()" style="background:#276749;color:white;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">➕ הוסף מדריך</button>
          <button onclick="loadInstructorsList()" style="background:var(--bg-subtle);border:1px solid var(--border);color:var(--text-primary);border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">🔄 רענן</button>
        </div>`;
    }
    if (key === 'users') {
      return `
        <div id="all-users-list">
          <div style="color:var(--text-muted);font-size:13px;text-align:center;padding:12px">טוען...</div>
        </div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button onclick="openAddAdminModal()" style="background:#553c9a;color:white;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">➕ הוסף מנהל</button>
          <button onclick="loadAllUsersList()" style="background:var(--bg-subtle);border:1px solid var(--border);color:var(--text-primary);border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">🔄 רענן</button>
        </div>`;
    }
    if (key === 'schedule-visibility') {
      return '<div id="sched-vis-body"><div style="text-align:center;padding:20px;color:var(--text-muted)">⏳ טוען...</div></div>';
    }
    return '';
  }

  document.getElementById('settings-section-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'settings-section-modal';
  modal.className = 'modal-overlay open';
  modal.style.cssText = 'z-index:9999;padding:20px';
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
  modal.innerHTML = `
    <div style="background:var(--bg-card);border-radius:16px;max-width:620px;width:100%;padding:28px;direction:rtl;max-height:85vh;overflow-y:auto">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px">
        <h3 style="margin:0;font-size:18px;font-weight:800;color:var(--text-primary)">${titles[key]||''}</h3>
        <button onclick="document.getElementById('settings-section-modal')?.remove()" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--text-muted)">✕</button>
      </div>
      <div id="settings-section-body">${getBody()}</div>
    </div>`;
  document.body.appendChild(modal);

  window._refreshSettingsModal = () => {
    const body = document.getElementById('settings-section-body');
    if (body) body.innerHTML = getBody();
    if (key === 'instructors') loadInstructorsList();
    if (key === 'users') loadAllUsersList();
  };

  if (key === 'instructors') loadInstructorsList();
  if (key === 'users') loadAllUsersList();
  if (key === 'schedule-visibility') _loadSchedVisModal();
};

async function _loadSchedVisModal() {
  const el = document.getElementById('sched-vis-body');
  if (!el) return;
  const snap = await db.ref('clubSchedule').get();
  const s = snap.val() || {};
  const hidden  = !!s.scheduleHidden;
  const message = s.scheduleMessage || 'לוח החוגים יתעדכן בקרוב — נשמח לראותכם!';
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:18px">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-radius:10px;background:var(--bg-subtle);border:1px solid var(--border)">
        <div>
          <div style="font-weight:700;font-size:14px;color:var(--text-primary)">הסתר לוח חוגים</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px">במקומו יוצג הכיתוב שתבחר</div>
        </div>
        <label style="position:relative;display:inline-block;width:46px;height:26px;flex-shrink:0">
          <input type="checkbox" id="sched-hidden-toggle" ${hidden ? 'checked' : ''} onchange="_onSchedHiddenToggle()"
            style="opacity:0;width:0;height:0;position:absolute">
          <span id="sched-toggle-track" style="position:absolute;inset:0;border-radius:13px;transition:.2s;cursor:pointer;
            background:${hidden ? '#f97316' : 'rgba(160,174,192,0.4)'}"></span>
          <span id="sched-toggle-thumb" style="position:absolute;top:3px;width:20px;height:20px;border-radius:50%;background:white;
            transition:.2s;box-shadow:0 1px 3px rgba(0,0,0,.3);
            left:${hidden ? '23px' : '3px'}"></span>
        </label>
      </div>
      <div id="sched-msg-wrap" style="display:${hidden ? 'flex' : 'none'};flex-direction:column;gap:8px">
        <label style="font-size:13px;font-weight:600;color:var(--text-primary)">כיתוב שיופיע במקום לוח החוגים</label>
        <textarea id="sched-msg-input" rows="3"
          style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg-subtle);
                 color:var(--text-primary);font-family:inherit;font-size:14px;resize:vertical;box-sizing:border-box;direction:rtl"
          placeholder="לדוגמה: לוח החוגים בבנייה — נחזור בקרוב!">${message}</textarea>
      </div>
      <button onclick="_saveSchedVisSettings()"
        style="background:#f97316;color:white;border:none;border-radius:8px;padding:10px 22px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;align-self:flex-start">
        💾 שמור
      </button>
    </div>`;
}

window._onSchedHiddenToggle = function() {
  const hidden = document.getElementById('sched-hidden-toggle').checked;
  document.getElementById('sched-toggle-track').style.background  = hidden ? '#f97316' : 'rgba(160,174,192,0.4)';
  document.getElementById('sched-toggle-thumb').style.left         = hidden ? '23px' : '3px';
  document.getElementById('sched-msg-wrap').style.display          = hidden ? 'flex' : 'none';
};

window._saveSchedVisSettings = async function() {
  const hidden  = document.getElementById('sched-hidden-toggle').checked;
  const message = (document.getElementById('sched-msg-input')?.value || '').trim();
  await db.ref('clubSchedule').update({ scheduleHidden: hidden, scheduleMessage: message });
  showToast(hidden ? '🚧 לוח החוגים מוסתר באתר' : '✅ לוח החוגים גלוי באתר');
  document.getElementById('settings-section-modal')?.remove();
};

async function saveSettings() {
  const startEl = document.getElementById('set-year-start');
  const endEl   = document.getElementById('set-year-end');
  if (!startEl || !endEl) return;
  const newStart = startEl.value;
  const newEnd   = endEl.value;
  if (!newStart || !newEnd) return;
  YEAR_START = newStart;
  YEAR_END   = newEnd;
  if (db) {
    await db.ref('settings/yearStart').set(newStart);
    await db.ref('settings/yearEnd').set(newEnd);
  }
  // Re-render attendance and reports panels
  const attPanel = document.getElementById('panel-attendance');
  if (attPanel) {
    attPanel.innerHTML = renderAttendancePanel();
    if (teams.length > 0 && groups.length === 0) loadTeamAttendance();
  }
  const repPanel = document.getElementById('panel-reports');
  if (repPanel) { repPanel.innerHTML = renderReportsPanel(); }
  showToast('ההגדרות נשמרו ✓');
}

// ===== YEAR-END ARCHIVE =====

function openEndYearModal() {
  const yearLabel = `${YEAR_START.slice(0,4)}–${YEAR_END.slice(0,4)}`;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:440px">
        <div class="modal-header">
          <span class="modal-title">🏁 סיום שנה ${yearLabel}</span>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:14px">
          <div style="background:#fff5f5;border:1px solid #fed7d7;border-radius:8px;padding:12px;font-size:13px;color:#c53030">
            ⚠️ כל נתוני השנה יועברו לארכיון ויימחקו מהנתונים הפעילים. פעולה זו אינה הפיכה.
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#4a5568;display:block;margin-bottom:6px">שם הארכיון</label>
            <input type="text" id="end-year-name" value="שנה ${yearLabel}"
              style="width:100%;box-sizing:border-box;border:1px solid #e2e8f0;border-radius:8px;padding:9px 12px;font-size:14px;font-family:inherit">
          </div>
          <div style="font-size:13px;color:#4a5568">
            <b>מה יועבר לארכיון:</b><br>
            ✓ ${groups.length} חוגים עם כל השחקנים<br>
            ✓ ${teams.length} נבחרות עם כל השחקנים<br>
            ✓ נוכחות, תשלומים, הערות<br>
            ✓ היסטוריה ושעות
          </div>
          <button onclick="doEndYear()" style="background:#c53030;color:white;border:none;border-radius:8px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">
            🏁 אשר סיום שנה ופתח שנה חדשה
          </button>
        </div>
      </div>
    </div>`);
}
window.openEndYearModal = openEndYearModal;

async function doEndYear() {
  const archiveName = document.getElementById('end-year-name')?.value?.trim() || `שנה ${YEAR_START.slice(0,4)}–${YEAR_END.slice(0,4)}`;
  const yearKey = `${YEAR_START}_${YEAR_END}`;
  const btn = document.querySelector('.friday-modal button[onclick="doEndYear()"]');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ שומר...'; }
  try {
    const paths = ['extra_players','player_overrides','hidden_players','attendance','notes','payment','player_contacts','group_names','subgroup_names','history','vacations','dbGroups','dbTeams','team_players','team_attendance','teamVacations'];
    const results = await Promise.all(paths.map(p => db.ref(p).get()));
    const archiveData = { name: archiveName, archivedAt: new Date().toISOString(), yearStart: YEAR_START, yearEnd: YEAR_END };
    paths.forEach((p, i) => { if (results[i].val()) archiveData[p] = results[i].val(); });
    // Also archive the group definitions (from ALL_GROUPS or current groups)
    archiveData.groupDefinitions = groups.map(g => ({
      id: g.id, name: g.name, instructor: g.instructor, day: g.day,
      subGroups: g.subGroups.map(sg => ({ time: sg.time, players: sg.players || [] }))
    }));
    // Also archive the team definitions
    archiveData.teamDefinitions = teams.map(t => ({
      id: t.id, name: t.name, coach: t.coach, region: t.region,
      subGroups: t.subGroups.map(sg => ({ time: sg.time, players: sg.players || [] }))
    }));
    await db.ref(`yearArchive/${yearKey}`).set(archiveData);
    // Clear all active data
    await Promise.all(paths.map(p => db.ref(p).remove()));
    document.querySelector('.friday-modal')?.remove();
    showToast(`השנה הועברה לארכיון ✅ — ניתן לצור חוגים ונבחרות חדשות`);
    // Rebuild app fresh
    _useDbGroups = true;
    groups = [];
    _useDbTeams = true;
    teams = [];
    document.getElementById('tabsBar').innerHTML = '';
    document.getElementById('content').innerHTML = '';
    buildApp();
    setTimeout(() => switchTab('settings'), 100);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); if (btn) { btn.disabled = false; btn.textContent = '🏁 אשר סיום שנה ופתח שנה חדשה'; } }
}
window.doEndYear = doEndYear;

async function openArchiveBrowser() {
  try {
    const snap = await db.ref('yearArchive').get();
    const archive = snap.val();
    if (!archive) { showToast('אין ארכיון עדיין'); return; }
    const years = Object.entries(archive).sort((a, b) => (b[1].archivedAt || '').localeCompare(a[1].archivedAt || ''));
    const liveTeamsCount = teams.length;
    const esc = s => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

    const renderUnit = (name, roleLabel, roleName, subGroups, icon) => {
      const subGroupsArr = subGroups || [];
      const allEmpty = subGroupsArr.length === 0 || subGroupsArr.every(sg => (sg.players || []).filter(p => !p.hidden).length === 0);
      const subHtml = subGroupsArr.map(sg => {
        const players = (sg.players || []).filter(p => !p.hidden);
        if (players.length === 0) {
          return `<div class="subgroup"><div class="subgroup-title">${esc(sg.time || 'קבוצה')}</div><div class="empty-note">⚠️ אין רשימת שחקנים</div></div>`;
        }
        const rows = players.map((p,i) => `<tr><td>${i+1}</td><td>${esc(p.name || `${p.firstName||''} ${p.lastName||''}`.trim() || '?')}</td><td>${esc(p.birthYear||'—')}</td></tr>`).join('');
        return `<div class="subgroup"><div class="subgroup-title">${esc(sg.time || 'קבוצה')} <span class="count">(${players.length})</span></div>
          <table><thead><tr><th>#</th><th>שם</th><th>שנת לידה</th></tr></thead><tbody>${rows}</tbody></table></div>`;
      }).join('');
      return `<div class="unit-card${allEmpty ? ' unit-empty' : ''}">
        <div class="unit-head">
          <span class="unit-icon">${icon}</span>
          <span class="unit-name">${esc(name)}</span>
          <span class="unit-role${roleName ? '' : ' unit-role-missing'}">${roleLabel}: ${roleName ? esc(roleName) : '—'}</span>
          ${allEmpty ? '<span class="badge-empty">⚠️ אין רשימת שחקנים כלל</span>' : ''}
        </div>
        ${subHtml}
      </div>`;
    };

    const yearSections = years.map(([yearKey, y]) => {
      const groupsHtml = (y.groupDefinitions || []).map(g => renderUnit(g.name, 'מדריך', g.instructor, g.subGroups, '🏫')).join('') || '<div class="none-note">אין חוגים בארכיון זה</div>';
      const teamsHtml = (y.teamDefinitions || []).map(t => renderUnit(t.name, 'מאמן', t.coach, t.subGroups, '🏅')).join('') || '<div class="none-note">אין נבחרות בארכיון זה</div>';
      const dateStr = y.archivedAt ? new Date(y.archivedAt).toLocaleDateString('he-IL') : '';
      const missingTeams = !y.teamDefinitions || y.teamDefinitions.length === 0;
      const migrateBtn = (missingTeams && liveTeamsCount > 0) ? `
        <button class="migrate-btn" onclick="
          if(confirm('להעביר את ${liveTeamsCount} הנבחרות הנוכחיות (עם כל השחקנים) לארכיון? הנתונים הפעילים של הנבחרות יימחקו לאחר מכן. פעולה זו אינה הפיכה.')){
            this.disabled=true; this.textContent='⏳ מעביר...';
            window.opener._doArchiveTeamsMerge('${yearKey}').then(()=>{ alert('✅ הנבחרות הועברו בהצלחה. הטאב ייסגר — פתח את הארכיון מחדש כדי לראות את העדכון.'); window.close(); }).catch(e=>{ alert('שגיאה: '+e.message); this.disabled=false; this.textContent='🗄 השלם — העבר את ${liveTeamsCount} הנבחרות הנוכחיות לשנה זו'; });
          }">🗄 השלם — העבר את ${liveTeamsCount} הנבחרות הנוכחיות לשנה זו</button>` : '';
      return `
        <section class="year-section" id="year-${esc(yearKey)}">
          <h2>📁 ${esc(y.name || yearKey)} <span class="year-date">${dateStr}</span></h2>
          ${migrateBtn}
          <h3>חוגים</h3>
          ${groupsHtml}
          <h3>נבחרות</h3>
          ${teamsHtml}
        </section>`;
    }).join('');

    const toc = years.length > 1 ? `<nav class="toc">קפצו לשנה: ${years.map(([yearKey,y]) => `<a href="#year-${esc(yearKey)}">${esc(y.name || yearKey)}</a>`).join(' · ')}</nav>` : '';

    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="UTF-8">
      <title>ארכיון שנים קודמות — מועדון השחמט ראשל"צ</title>
      <style>
        body{font-family:Arial,sans-serif;padding:28px;max-width:900px;margin:0 auto;color:#1a1a2e;background:#f7fafc}
        h1{font-size:24px;margin-bottom:4px}
        .sub{font-size:13px;color:#718096;margin-bottom:20px}
        .toc{background:white;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;margin-bottom:24px;font-size:13px}
        .toc a{color:#2b6cb0;text-decoration:none;margin:0 4px}
        .year-section{margin-bottom:36px}
        .year-section h2{font-size:19px;border-bottom:2px solid #2b6cb0;padding-bottom:6px;margin-bottom:4px}
        .year-date{font-size:12px;color:#718096;font-weight:400;margin-right:8px}
        .year-section h3{font-size:14px;color:#4a5568;margin:18px 0 8px}
        .migrate-btn{background:#553c9a;color:white;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;margin:8px 0 4px}
        .unit-card{background:white;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;margin-bottom:10px}
        .unit-empty{border-color:#feb2b2;background:#fff5f5}
        .unit-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px}
        .unit-icon{font-size:16px}
        .unit-name{font-weight:700;font-size:15px}
        .unit-role{font-size:12px;color:#4a5568;background:#edf2f7;border-radius:6px;padding:2px 8px}
        .unit-role-missing{color:#a0aec0}
        .badge-empty{font-size:11px;font-weight:700;color:#c53030;background:#fed7d7;border-radius:6px;padding:2px 8px}
        .subgroup{margin-top:8px}
        .subgroup-title{font-size:12px;font-weight:600;color:#4a5568;margin-bottom:4px}
        .subgroup-title .count{font-weight:400;color:#a0aec0}
        .empty-note{font-size:12px;color:#c53030;background:#fff5f5;border:1px dashed #feb2b2;border-radius:6px;padding:6px 10px}
        table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:4px}
        th{background:#2b6cb0;color:white;padding:5px 10px;text-align:right;font-size:11px}
        td{padding:4px 10px;border-bottom:1px solid #edf2f7}
        tr:nth-child(even) td{background:#f7fafc}
        .none-note{color:#a0aec0;font-size:13px;padding:8px 0}
      </style>
      </head><body>
      <h1>📂 ארכיון שנים קודמות</h1>
      <div class="sub">מועדון השחמט ראשון לציון · ${years.length} שנים בארכיון</div>
      ${toc}
      ${yearSections}
      </body></html>`);
    win.document.close();
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.openArchiveBrowser = openArchiveBrowser;

async function _doArchiveTeamsMerge(yearKey) {
  const teamPaths = ['dbTeams','team_players','team_attendance','teamVacations'];
  const results = await Promise.all(teamPaths.map(p => db.ref(p).get()));
  const teamDefinitions = teams.map(t => ({
    id: t.id, name: t.name, coach: t.coach, region: t.region,
    subGroups: t.subGroups.map(sg => ({ time: sg.time, players: sg.players || [] }))
  }));
  const updates = { teamDefinitions };
  teamPaths.forEach((p, i) => { if (results[i].val()) updates[p] = results[i].val(); });
  await db.ref(`yearArchive/${yearKey}`).update(updates);
  await Promise.all(teamPaths.map(p => db.ref(p).remove()));
  showToast('הנבחרות הועברו לארכיון ✅');
  _useDbTeams = true;
  teams = [];
  document.getElementById('tabsBar').innerHTML = '';
  document.getElementById('content').innerHTML = '';
  buildApp();
  setTimeout(() => switchTab('settings'), 100);
}
window._doArchiveTeamsMerge = _doArchiveTeamsMerge;

