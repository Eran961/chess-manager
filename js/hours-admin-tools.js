// ===== REFEREE PAYMENT RATES (מחירון שיפוט וניהול תחרויות) =====
// Confirmed formula (per user): chief referee ("ניהלתי" only) → chiefManage;
// chief referee ("שפטתי" only) → chiefJudge; chief referee ("גם וגם") → sum
// of both. Second/third referee always gets the single secondThird rate,
// regardless of the ניהלתי/שפטתי/גם וגם choice (the table only has one
// number for that role).
const DEFAULT_REFEREE_RATES = [
  { id: 'r1',  label: 'ניהול ושיפוט סבב 7 סיבובים',                                     chiefManage: 200, chiefJudge: 400, secondThird: 200 },
  { id: 'r2',  label: 'ניהול ושיפוט תחרות לא מדורגים בשבת או חג',                         chiefManage: 100, chiefJudge: 500, secondThird: 300 },
  { id: 'r3',  label: 'ניהול ושיפוט תחרות לא מדורגים בשבת או חג (כפולה — בוקר וגם אחה"צ)', chiefManage: 100, chiefJudge: 750, secondThird: 450 },
  { id: 'r4',  label: 'ניהול ושיפוט תחרות מיוחדת בשבת או חג',                             chiefManage: 200, chiefJudge: 600, secondThird: 300 },
  { id: 'r5',  label: 'ניהול ליגה בשבת',                                                 chiefManage: 0,   chiefJudge: 500, secondThird: 250 },
  { id: 'r6',  label: 'ניהול ליגה באמצע השבוע',                                          chiefManage: 0,   chiefJudge: 350, secondThird: 0   },
  { id: 'r7',  label: 'ניהול תחרות של 50 דקות (סבב)',                                    chiefManage: 100, chiefJudge: 250, secondThird: 150 },
  { id: 'r8',  label: 'ניהול תחרות שתי בסבב בימי שישי',                                   chiefManage: 100, chiefJudge: 300, secondThird: 200 },
  { id: 'r9',  label: 'ניהול תחרות בימי שישי (15+10)',                                    chiefManage: 100, chiefJudge: 350, secondThird: 250 },
  { id: 'r10', label: 'ניהול תחרות בזק באמצע השבוע',                                      chiefManage: 100, chiefJudge: 300, secondThird: 250 },
];
// The rate table is fixed club policy, not something that changes per
// report — it's seeded here as a real value from the start (not null), so
// every screen that reads it has a real, complete table with zero waiting,
// same as the rest of the app's other hardcoded constants. loadRefereeRates()
// still exists to pick up an admin override saved in Settings → תעריף
// שופטים, but nothing outside that edit flow should ever block on it.
let _refereeRates = DEFAULT_REFEREE_RATES.slice();
let _refereeRatesLoaded = false;
async function loadRefereeRates() {
  if (_refereeRatesLoaded) return _refereeRates;
  try {
    const snap = await db.ref('refereeRates').get();
    if (snap.exists()) _refereeRates = Object.entries(snap.val()).map(([id, v]) => ({ id, ...v }));
  } catch(e) { /* keep the fixed default table */ }
  _refereeRatesLoaded = true;
  return _refereeRates;
}

function computeRefereePay(rate, role, duty) {
  if (!rate) return 0;
  if (role === 'second') return rate.secondThird || 0;
  if (duty === 'manage') return rate.chiefManage || 0;
  if (duty === 'judge')  return rate.chiefJudge  || 0;
  return (rate.chiefManage || 0) + (rate.chiefJudge || 0); // both
}

// ===== REFEREE/JUDGING REPORTING (דיווח שיפוט) =====
function renderHoursPanel() {
  const today = new Date().toISOString().split('T')[0];
  return `
    <div class="att-card" style="max-width:720px">
      <div class="att-card-header">
        <span>⚖️ דיווח שיפוט</span>
      </div>
      <div style="padding:20px">
        <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:24px">
          <div style="display:flex;flex-direction:column;gap:4px;max-width:180px">
            <label style="font-size:13px;font-weight:600;color:#4a5568">תאריך</label>
            <input type="date" id="hours-date" value="${today}" style="padding:8px;border:2px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit">
          </div>
          <div id="hours-referee-fields">${refereeFieldsHTML()}</div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:13px;font-weight:600;color:#4a5568">הערות</label>
            <input type="text" id="hours-desc" placeholder="לדוגמא: פרטים נוספים" style="padding:8px;border:2px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit">
          </div>
          <button onclick="saveHoursEntry()" style="align-self:flex-start;background:#2b6cb0;color:white;border:none;border-radius:8px;padding:10px 24px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">💾 שמור דיווח</button>
        </div>
        <hr style="border:none;border-top:2px solid #e2e8f0;margin:0 0 20px">
        <div id="hours-history"><div style="text-align:center;color:#a0aec0;padding:24px">טוען היסטוריה...</div></div>
      </div>
    </div>`;
}

// The rate table (מחירון שיפוט) is fixed club policy — editable only from
// Settings → ⚖️ תעריף שופטים, never from this screen. It's a plain, pure
// function of the already-in-memory _refereeRates/_tournaments (both real,
// complete values from the moment the app starts — see their declarations),
// so this always has something real to show immediately, with no loading
// state: only the optional "תחרות מקושרת" list can lag a moment behind on
// a first visit, filling in silently once loadTournaments() resolves.
// Admin-only "reporting for" row: lets an admin enter a report as themselves
// (default), as any other known user (so it lands in that user's own
// history exactly as if they'd entered it), or for someone with no system
// account at all (a plain name, no uid) — covers both cases the club asked
// for: referees who never get a login, and entering on behalf of someone
// who does have one.
let _allUsersForHours = null;
async function loadUsersForHoursOnBehalf() {
  if (_allUsersForHours || !db) return _allUsersForHours || [];
  try {
    const snap = await db.ref('roles').get();
    const data = snap.val() || {};
    _allUsersForHours = Object.entries(data).map(([uid, r]) => ({ uid, name: r.name || r.email || uid }))
      .sort((a, b) => a.name.localeCompare(b.name, 'he'));
  } catch(e) { _allUsersForHours = []; }
  return _allUsersForHours;
}

function onBehalfHTML() {
  if (currentUser?.role !== 'admin') return '';
  const options = (_allUsersForHours || [])
    .filter(u => u.uid !== currentUser.uid)
    .map(u => `<option value="${u.uid}">${u.name}</option>`).join('');
  return `
    <div style="display:flex;flex-direction:column;gap:4px;max-width:320px">
      <label style="font-size:13px;font-weight:600;color:#4a5568">מדווח עבור</label>
      <select id="ref-on-behalf" onchange="onRefOnBehalfChange()" style="padding:8px;border:2px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit">
        <option value="">עצמי</option>
        ${options}
        <option value="__other__">אדם ללא משתמש במערכת...</option>
      </select>
      <input type="text" id="ref-on-behalf-name" placeholder="שם מלא" hidden
        style="margin-top:4px;padding:8px;border:2px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit">
    </div>`;
}

function onRefOnBehalfChange() {
  const sel = document.getElementById('ref-on-behalf');
  const nameInput = document.getElementById('ref-on-behalf-name');
  if (nameInput) nameInput.hidden = sel.value !== '__other__';
}
window.onRefOnBehalfChange = onRefOnBehalfChange;

function refereeFieldsHTML() {
  const tournOptions = Object.entries(_tournaments || {})
    .sort((a, b) => (b[1].startDate || '').localeCompare(a[1].startDate || ''))
    .map(([id, t]) => `<option value="${id}">${t.name}</option>`).join('');
  const typeOptions = _refereeRates.map(r => `<option value="${r.id}">${r.label}</option>`).join('');
  return `
    <div style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:12px">
      ${onBehalfHTML()}
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <div style="display:flex;flex-direction:column;gap:4px;flex:2;min-width:200px">
          <label style="font-size:13px;font-weight:600;color:#4a5568">סוג תחרות (לפי מחירון)</label>
          <select id="ref-type" onchange="updateRefereeSalary()" style="padding:8px;border:2px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit">${typeOptions}</select>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:140px">
          <label style="font-size:13px;font-weight:600;color:#4a5568">תפקיד</label>
          <select id="ref-role" onchange="updateRefereeSalary()" style="padding:8px;border:2px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit">
            <option value="chief">שופט ראשי</option>
            <option value="second">שופט שני/שלישי</option>
          </select>
        </div>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">
        <div id="ref-duty-wrap" style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:160px">
          <label style="font-size:13px;font-weight:600;color:#4a5568">תפקיד בפועל</label>
          <select id="ref-duty" onchange="updateRefereeSalary()" style="padding:8px;border:2px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit">
            <option value="manage">ניהול</option>
            <option value="judge">שיפוט</option>
            <option value="both">ניהול ושיפוט</option>
          </select>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;flex:2;min-width:200px">
          <label style="font-size:13px;font-weight:600;color:#4a5568">תחרות מקושרת (לא חובה)</label>
          <select id="ref-tournament" style="padding:8px;border:2px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit">
            <option value="">— ללא קישור —</option>
            ${tournOptions}
          </select>
        </div>
      </div>
      <div style="background:#e6fffa;border:1px solid #b2f5ea;border-radius:8px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;font-weight:600;color:#234e52">שכר מחושב</span>
        <span id="ref-salary-display" style="font-size:20px;font-weight:800;color:#2c7a7b">0 ₪</span>
      </div>
    </div>`;
}

// Re-renders the referee fields into the live DOM (unlike refereeFieldsHTML()
// above, which just returns markup) and kicks off the two background
// refreshes that can silently improve it after the fact — an admin-saved
// rate override, and the club-tournament list for the optional link field —
// without ever blocking the form or showing a loading state.
function renderRefereeFields() {
  const wrap = document.getElementById('hours-referee-fields');
  if (!wrap) return;
  wrap.innerHTML = refereeFieldsHTML();
  updateRefereeSalary();
  loadRefereeRates().then(() => {
    if (document.getElementById('hours-referee-fields')) { wrap.innerHTML = refereeFieldsHTML(); updateRefereeSalary(); }
  });
  if (typeof loadTournaments === 'function' && Object.keys(_tournaments || {}).length === 0) {
    loadTournaments().then(() => {
      if (document.getElementById('hours-referee-fields')) { wrap.innerHTML = refereeFieldsHTML(); updateRefereeSalary(); }
    }).catch(() => {});
  }
  if (currentUser?.role === 'admin' && !_allUsersForHours) {
    loadUsersForHoursOnBehalf().then(() => {
      if (document.getElementById('hours-referee-fields')) { wrap.innerHTML = refereeFieldsHTML(); updateRefereeSalary(); }
    });
  }
}
window.renderRefereeFields = renderRefereeFields;

function updateRefereeSalary() {
  const rates = _refereeRates;
  const typeId = document.getElementById('ref-type')?.value;
  const role = document.getElementById('ref-role')?.value;
  const duty = document.getElementById('ref-duty')?.value;
  const dutyWrap = document.getElementById('ref-duty-wrap');
  const rate = rates.find(r => r.id === typeId);
  // The ניהלתי/שפטתי/גם וגם split only applies to the chief referee —
  // second/third has one flat rate per type regardless of duty.
  if (dutyWrap) dutyWrap.style.opacity = role === 'second' ? '0.4' : '1';
  const disp = document.getElementById('ref-salary-display');
  if (disp) disp.textContent = computeRefereePay(rate, role, duty).toLocaleString() + ' ₪';
}
window.updateRefereeSalary = updateRefereeSalary;

async function saveHoursEntry() {
  const date = document.getElementById('hours-date').value;
  const desc = document.getElementById('hours-desc').value.trim();
  if (!date) { showToast('יש למלא תאריך', 'error'); return; }

  const rates = _refereeRates || DEFAULT_REFEREE_RATES;
  const typeId = document.getElementById('ref-type')?.value;
  const role = document.getElementById('ref-role')?.value;
  const duty = document.getElementById('ref-duty')?.value;
  const tournamentId = document.getElementById('ref-tournament')?.value || null;
  const rate = rates.find(r => r.id === typeId);
  if (!rate) { showToast('יש לבחור סוג תחרות', 'error'); return; }

  // Admin-only: who this report is actually attributed to. Left on "עצמי"
  // (no #ref-on-behalf element for non-admins at all), it's the person
  // saving the report, same as always.
  let instructorId = currentUser.uid;
  let instructorName = currentUser.name;
  let enteredByAdmin = null;
  const onBehalfSel = document.getElementById('ref-on-behalf');
  if (onBehalfSel && onBehalfSel.value) {
    if (onBehalfSel.value === '__other__') {
      const name = document.getElementById('ref-on-behalf-name')?.value?.trim();
      if (!name) { showToast('יש להזין שם', 'error'); return; }
      instructorId = null; // no system account — nothing to link the report to
      instructorName = name;
    } else {
      const u = (_allUsersForHours || []).find(u => u.uid === onBehalfSel.value);
      instructorId = onBehalfSel.value;
      instructorName = u?.name || instructorName;
    }
    enteredByAdmin = currentUser.name;
  }

  const entry = {
    instructorId,
    instructorName,
    enteredByAdmin,
    date,
    activityType: 'refereeing',
    activityLabel: 'שיפוט/ניהול תחרות',
    description: desc,
    refereeTypeId: typeId,
    refereeTypeLabel: rate.label,
    refereeRole: role,
    refereeDuty: duty,
    tournamentId,
    tournamentName: tournamentId ? (_tournaments?.[tournamentId]?.name || '') : '',
    amount: computeRefereePay(rate, role, duty),
    ts: Date.now()
  };

  try {
    await db.ref('hourLogs').push(entry);
    showToast('הדיווח נשמר ✅');
    document.getElementById('hours-desc').value = '';
    loadHoursHistory();
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}

const HOURS_HISTORY_MONTH_NAMES = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
let _hoursHistoryEntries = null;   // full (already role-filtered) list from the last Firebase load
let _hoursHistoryMonth = null;     // currently viewed 'YYYY-MM', or '__undated__' for legacy rows with no date

async function loadHoursHistory() {
  const container = document.getElementById('hours-history');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;color:#a0aec0;padding:20px">טוען...</div>';
  try {
    const snap = await db.ref('hourLogs').orderByChild('ts').get();
    const entries = [];
    snap.forEach(child => { entries.push({ id: child.key, ...child.val() }); });
    const isAdmin = currentUser?.role === 'admin';
    _hoursHistoryEntries = isAdmin ? entries : entries.filter(e => e.instructorId === currentUser.uid);
    renderHoursHistoryUI();
  } catch(e) { container.innerHTML = `<div style="color:#c53030;padding:16px">שגיאה: ${e.message}</div>`; }
}

function onHoursHistoryMonthChange(val) {
  _hoursHistoryMonth = val;
  renderHoursHistoryUI();
}
window.onHoursHistoryMonthChange = onHoursHistoryMonthChange;

// One month at a time, picked from a dropdown — instead of one long list of
// every report ever made. The dropdown spans every month from the first
// one anyone ever reported for through the current month (so a month with
// zero reports is still visible and selectable — the point is to be able
// to confirm nothing was entered for it, not just skip it), and defaults to
// the current month.
function renderHoursHistoryUI() {
  const container = document.getElementById('hours-history');
  if (!container) return;
  const isAdmin = currentUser?.role === 'admin';
  const all = _hoursHistoryEntries || [];
  if (!all.length) {
    container.innerHTML = '<div style="text-align:center;color:#a0aec0;padding:24px">אין דיווחים עדיין</div>';
    return;
  }

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const dated = all.filter(e => e.date);
  const undated = all.filter(e => !e.date); // very old, pre-migration rows with no date at all
  const monthKeys = dated.map(e => e.date.slice(0, 7));
  let minMonth = monthKeys.length ? monthKeys.reduce((a, b) => a < b ? a : b) : currentMonthKey;
  let maxMonth = monthKeys.length ? monthKeys.reduce((a, b) => a > b ? a : b) : currentMonthKey;
  if (currentMonthKey > maxMonth) maxMonth = currentMonthKey; // always include the current month, even with nothing in it yet
  if (currentMonthKey < minMonth) minMonth = currentMonthKey;

  const months = [];
  let [y, m] = minMonth.split('-').map(Number);
  const [ey, em] = maxMonth.split('-').map(Number);
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m++; if (m > 12) { m = 1; y++; }
  }

  if (!_hoursHistoryMonth || (_hoursHistoryMonth !== '__undated__' && !months.includes(_hoursHistoryMonth))) {
    _hoursHistoryMonth = months.includes(currentMonthKey) ? currentMonthKey : months[months.length - 1];
  }

  const countForMonth = (mk) => dated.filter(e => e.date.slice(0, 7) === mk).length;
  const monthOptions = months.map(mk => {
    const [my, mm] = mk.split('-');
    const label = `${HOURS_HISTORY_MONTH_NAMES[parseInt(mm, 10) - 1]} ${my}`;
    const count = countForMonth(mk);
    return `<option value="${mk}"${mk === _hoursHistoryMonth ? ' selected' : ''}>${label}${count ? ` (${count})` : ' — ריק'}</option>`;
  }).join('') + (undated.length ? `<option value="__undated__"${_hoursHistoryMonth === '__undated__' ? ' selected' : ''}>ללא תאריך (${undated.length})</option>` : '');

  const entriesForMonth = (_hoursHistoryMonth === '__undated__' ? undated : dated.filter(e => e.date.slice(0, 7) === _hoursHistoryMonth))
    .slice().sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.ts || 0) - (a.ts || 0));
  const monthTotal = entriesForMonth.reduce((sum, e) => sum + (e.amount || 0), 0);

  const selectorHTML = `
    <select id="hours-history-month" onchange="onHoursHistoryMonthChange(this.value)"
      style="padding:8px 10px;border:2px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit;font-weight:700;color:#2d3748">
      ${monthOptions}
    </select>`;

  if (!entriesForMonth.length) {
    container.innerHTML = `
      <div style="margin-bottom:14px">${selectorHTML}</div>
      <div style="text-align:center;color:#a0aec0;padding:24px">אין דיווחים בחודש זה</div>`;
    return;
  }

  const thStyle = 'padding:10px 12px;text-align:right;font-size:12px;font-weight:700;color:#4a5568;border-bottom:2px solid #e2e8f0;background:#f7fafc';
  const rows = entriesForMonth.map(e => {
    const isRef = e.activityType === 'refereeing';
    const detail = isRef ? [e.refereeTypeLabel, e.tournamentName].filter(Boolean).join(' · ') : '';
    const valueCell = isRef ? `${(e.amount || 0).toLocaleString()} ₪` : (e.hours != null ? `${e.hours} ש׳` : '—');
    return `
      <tr style="border-bottom:1px solid #f0f4f8">
        ${isAdmin ? `<td style="padding:10px 12px;font-size:13px;font-weight:600">${e.instructorName || '—'}${e.enteredByAdmin ? `<div style="font-size:11px;font-weight:400;color:#a0aec0">הוזן ע"י ${e.enteredByAdmin}</div>` : ''}</td>` : ''}
        <td style="padding:10px 12px;font-size:13px">${e.date || '—'}</td>
        <td style="padding:10px 12px;font-size:13px;color:#4a5568">${detail || '<span style="color:#cbd5e0">—</span>'}</td>
        <td style="padding:10px 12px;font-size:13px;color:#718096">${e.description || '<span style="color:#cbd5e0">—</span>'}</td>
        <td style="padding:10px 12px;text-align:center;font-weight:700;font-size:15px;color:#553c9a">${valueCell}</td>
        <td style="padding:10px 12px;font-size:12px;color:#a0aec0">${new Date(e.ts).toLocaleDateString('he-IL')}</td>
        ${isAdmin ? `<td style="padding:10px 8px;text-align:center"><button onclick="deleteHoursEntry('${e.id}')" title="מחק" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:16px;line-height:1">🗑</button></td>` : ''}
      </tr>`;
  }).join('');

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">
      ${selectorHTML}
      <span style="font-size:14px;font-weight:700;color:#2d3748">דיווחים: ${entriesForMonth.length}${monthTotal > 0 ? ` &nbsp;·&nbsp; <span style="color:#553c9a;font-weight:800">סה"כ: ${monthTotal.toLocaleString()} ₪</span>` : ''}</span>
    </div>
    <div style="overflow-x:auto;border-radius:10px;border:1px solid #e2e8f0">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr>
          ${isAdmin ? `<th style="${thStyle}">שופט</th>` : ''}
          <th style="${thStyle}">תאריך</th>
          <th style="${thStyle}">פירוט</th>
          <th style="${thStyle}">הערות</th>
          <th style="${thStyle};text-align:center">שכר</th>
          <th style="${thStyle}">הוזן ב</th>
          ${isAdmin ? `<th style="${thStyle}"></th>` : ''}
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

async function deleteHoursEntry(id) {
  if (!confirm('למחוק את הדיווח הזה?')) return;
  try {
    await db.ref('hourLogs/' + id).remove();
    showToast('הדיווח נמחק');
    loadHoursHistory();
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}

async function openRefereeRatesModal() {
  await loadRefereeRates();
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" id="refRatesOverlay" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:760px">
        <div class="modal-header">
          <span class="modal-title">✏️ מחירון שיפוט וניהול תחרויות</span>
          <button class="modal-close" onclick="document.getElementById('refRatesOverlay').remove()">✕</button>
        </div>
        <div class="modal-body" style="padding:20px;max-height:70vh;overflow-y:auto">
          <div style="font-size:12px;color:#718096;margin-bottom:14px;line-height:1.6">
            "ניהול (ראשי)" = השכר כשבוחרים "ניהול" בלבד · "שיפוט (ראשי)" = השכר כשבוחרים "שיפוט" בלבד ·
            "ניהול ושיפוט" משלם את סכום שני העמודות יחד · "שני/שלישי" = שכר קבוע לתפקיד שני/שלישי, ללא קשר לבחירת ניהול/שיפוט.
          </div>
          <div id="ref-rates-rows" style="display:flex;flex-direction:column;gap:10px"></div>
          <button onclick="addRefereeRateRow()" style="margin-top:10px;background:none;border:1px dashed #cbd5e0;border-radius:8px;padding:8px 16px;font-size:13px;cursor:pointer;font-family:inherit;color:#4a5568">+ הוסף סוג</button>
        </div>
        <div class="modal-actions">
          <button class="btn-form-cancel" onclick="document.getElementById('refRatesOverlay').remove()">ביטול</button>
          <button class="btn-form-submit" onclick="saveRefereeRates()">💾 שמור מחירון</button>
        </div>
      </div>
    </div>`);
  renderRefereeRateRows();
}
window.openRefereeRatesModal = openRefereeRatesModal;

function renderRefereeRateRows() {
  const wrap = document.getElementById('ref-rates-rows');
  if (!wrap) return;
  wrap.innerHTML = _refereeRates.map((r, i) => `
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;border-bottom:1px solid #f0f4f8;padding-bottom:8px">
      <input value="${(r.label || '').replace(/"/g,'&quot;')}" oninput="updateRefRateField(${i},'label',this.value)" placeholder="סוג תחרות"
        style="flex:2;min-width:180px;padding:7px 10px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:inherit">
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
        <label style="font-size:10px;color:#a0aec0">ניהול (ראשי)</label>
        <input type="number" value="${r.chiefManage || 0}" oninput="updateRefRateField(${i},'chiefManage',parseFloat(this.value)||0)"
          style="width:70px;padding:6px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;text-align:center;font-family:inherit">
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
        <label style="font-size:10px;color:#a0aec0">שיפוט (ראשי)</label>
        <input type="number" value="${r.chiefJudge || 0}" oninput="updateRefRateField(${i},'chiefJudge',parseFloat(this.value)||0)"
          style="width:70px;padding:6px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;text-align:center;font-family:inherit">
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
        <label style="font-size:10px;color:#a0aec0">שני/שלישי</label>
        <input type="number" value="${r.secondThird || 0}" oninput="updateRefRateField(${i},'secondThird',parseFloat(this.value)||0)"
          style="width:70px;padding:6px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;text-align:center;font-family:inherit">
      </div>
      <button onclick="removeRefereeRateRow(${i})" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:16px">🗑</button>
    </div>`).join('');
}

function updateRefRateField(i, field, value) {
  if (_refereeRates[i]) _refereeRates[i][field] = value;
}
window.updateRefRateField = updateRefRateField;

function addRefereeRateRow() {
  _refereeRates.push({ id: 'r' + Date.now(), label: '', chiefManage: 0, chiefJudge: 0, secondThird: 0 });
  renderRefereeRateRows();
}
window.addRefereeRateRow = addRefereeRateRow;

function removeRefereeRateRow(i) {
  _refereeRates.splice(i, 1);
  renderRefereeRateRows();
}
window.removeRefereeRateRow = removeRefereeRateRow;

async function saveRefereeRates() {
  try {
    const obj = {};
    _refereeRates.forEach(r => {
      if (r.label?.trim()) obj[r.id] = { label: r.label.trim(), chiefManage: r.chiefManage || 0, chiefJudge: r.chiefJudge || 0, secondThird: r.secondThird || 0 };
    });
    await db.ref('refereeRates').set(Object.keys(obj).length ? obj : null);
    _refereeRates = Object.entries(obj).map(([id, v]) => ({ id, ...v }));
    showToast('המחירון נשמר ✅');
    document.getElementById('refRatesOverlay')?.remove();
    if (document.getElementById('hours-referee-fields')) renderRefereeFields();
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.saveRefereeRates = saveRefereeRates;

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

// A child registered more than once (e.g. two sessions a week) is, under the
// hood, two completely separate player records — one per group/sub-group —
// with no shared identity at all. player_links/{groupId}/{subGroupIdx}/
// {playerIdx} = <linkedId> ties confirmed-duplicate registrations together
// (see leagues-audit.js's loadDuplicatesAdmin/linkDuplicateCluster, which is
// what writes these) without touching the underlying registrations
// themselves — attendance/history per session stays exactly as it was.
async function loadPlayerLinks() {
  if (!db) return;
  try {
    const snap = await db.ref('player_links').get();
    if (!snap.val()) return;
    const data = snap.val();
    groups.forEach(g => {
      if (!data[g.id]) return;
      g.subGroups.forEach((sg, si) => {
        const links = data[g.id][si];
        if (!links) return;
        Object.entries(links).forEach(([idxStr, linkedId]) => {
          const idx = parseInt(idxStr);
          if (sg.players[idx]) sg.players[idx].linkedId = linkedId;
        });
      });
    });
  } catch(e) { console.error('Error loading player links:', e); }
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
          if (o.gender)    sg.players[idx].gender    = o.gender;
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

// Shared by printReport() (groups) and printCampReport() (camps) — only the
// title/subtitle/mode-label and which content div to grab differ per kind.
function printAttendanceReport({ title, subLabel, mode, modeLabel, contentElId }) {
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html lang="he" dir="rtl"><head>
    <meta charset="UTF-8">
    <title>דוח נוכחות — ${title}${subLabel}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #1a1a2e; padding: 24px; }
      h2 { font-size: 18px; margin-bottom: 4px; }
      .sub { font-size: 13px; color: #718096; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th { background: #2b6cb0; color: white; padding: 8px 12px; text-align: right; }
      th:nth-child(1) { width: 36px; text-align: center; }
      ${mode === 'monthly'
        ? 'th, td { text-align: center; padding: 6px 8px; font-size: 12px; } td:nth-child(2), th:nth-child(2) { text-align: right; white-space: nowrap; }'
        : 'th:nth-child(3), th:nth-child(4), th:nth-child(5) { text-align: center; width: 60px; } th:nth-child(6) { display: none; }'}
      td { padding: 7px 12px; border-bottom: 1px solid #e2e8f0; }
      ${mode !== 'monthly' ? 'td:nth-child(6) { display: none; }' : ''}
      tr:nth-child(even) td { background: #f7fafc; }
      .progress-bar-wrap { display: none; }

    /style>
  </head><body>
    <h2>דוח נוכחות — ${title}${subLabel}</h2>
    <div class="sub">${modeLabel} · ${new Date().toLocaleDateString('he-IL')}</div>
    ${document.getElementById(contentElId).innerHTML}

</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

function printReport() {
  const g = groups[reportsState.groupIdx];
  const sg = g.subGroups[reportsState.subGroupIdx];
  const modeLabel = reportsState.mode === 'summary' ? 'דוח שנתי'
    : reportsState.mode === 'monthly' ? `דוח חודשי — ${getSchoolMonths().find(m=>m.value===reportsState.month)?.label||reportsState.month}`
    : `לפי תאריך — ${formatDate(reportsState.date)}`;
  printAttendanceReport({
    title: g.name, subLabel: sg.time ? ` — ${sg.time}` : '',
    mode: reportsState.mode, modeLabel, contentElId: 'reportsContent',
  });
}

function printCampReport() {
  const c = camps.find(cc => cc.id === _campRepState.campId);
  const lv = c?.levels[_campRepState.levelIdx];
  if (!c) return;
  const modeLabel = _campRepState.mode === 'summary' ? 'דוח שנתי'
    : _campRepState.mode === 'monthly' ? `דוח חודשי — ${getCampMonths(c).find(m=>m.value===_campRepState.month)?.label||_campRepState.month}`
    : `לפי תאריך — ${formatDate(_campRepState.date)}`;
  printAttendanceReport({
    title: c.name, subLabel: lv?.name ? ` — ${lv.name}` : '',
    mode: _campRepState.mode, modeLabel, contentElId: 'campReportsContent',
  });
}
window.printCampReport = printCampReport;

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
    { icon: '🏕️', label: 'ניהול מחנות',   key: 'camps' },
    ...(isAdmin ? [{ icon: '⚖️', label: 'תעריף שופטים', key: 'refereeRates' }] : []),
    { icon: '👥', label: 'ניהול מדריכים', key: 'instructors' },
    ...(isAdmin ? [{ icon: '🔐', label: 'ניהול משתמשים', key: 'users' }] : []),
    { icon: '📊', label: 'פעילות מדריכים', key: 'audit' },
    ...(isAdmin ? [{ icon: '🔍', label: 'כפילויות', key: 'duplicates' }] : []),
    { icon: '📂', label: 'ארכיון שנים קודמות', key: 'viewarchive' },
    { icon: '🏁', label: 'סיום שנה',      key: 'endyear', danger: true },
  ];
  return `
    <div style="direction:rtl">
      <div style="font-size:22px;font-weight:800;color:var(--text-primary);direction:rtl;margin-bottom:16px">⚙️ הגדרות</div>
      <div class="hub-grid" style="padding-top:10px">
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
  if (key === 'audit') {
    document.getElementById('settings-section-modal')?.remove();
    if (window._tabCatMap) window._tabCatMap['audit'] = 'settings';
    switchTab('audit');
    loadAuditLog();
    return;
  }
  if (key === 'duplicates') {
    document.getElementById('settings-section-modal')?.remove();
    if (window._tabCatMap) window._tabCatMap['duplicates'] = 'settings';
    switchTab('duplicates');
    loadDuplicatesAdmin();
    return;
  }
  if (key === 'refereeRates') {
    document.getElementById('settings-section-modal')?.remove();
    openRefereeRatesModal();
    return;
  }
  if (key === 'camps') {
    switchTab('camps');
    loadDbCamps().then(loadCampPlayers).then(() => { document.getElementById('panel-camps').innerHTML = renderCampsPanel(); });
    return;
  }
  if (key === 'groups') {
    document.getElementById('settings-section-modal')?.remove();
    if (window._tabCatMap) window._tabCatMap['groups-admin'] = 'settings';
    let gp = document.getElementById('panel-groups-admin');
    if (!gp) { gp = document.createElement('div'); gp.className = 'tab-panel'; gp.id = 'panel-groups-admin'; document.getElementById('content').appendChild(gp); }
    gp.innerHTML = renderGroupsAdminPanel();
    switchTab('groups-admin');
    return;
  }
  if (key === 'teams') {
    document.getElementById('settings-section-modal')?.remove();
    if (window._tabCatMap) window._tabCatMap['teams-admin'] = 'settings';
    let tp = document.getElementById('panel-teams-admin');
    if (!tp) { tp = document.createElement('div'); tp.className = 'tab-panel'; tp.id = 'panel-teams-admin'; document.getElementById('content').appendChild(tp); }
    tp.innerHTML = renderTeamsAdminPanel();
    switchTab('teams-admin');
    return;
  }
  if (key === 'instructors') {
    document.getElementById('settings-section-modal')?.remove();
    if (window._tabCatMap) window._tabCatMap['instructors-admin'] = 'settings';
    let ip = document.getElementById('panel-instructors-admin');
    if (!ip) { ip = document.createElement('div'); ip.className = 'tab-panel'; ip.id = 'panel-instructors-admin'; document.getElementById('content').appendChild(ip); }
    ip.innerHTML = renderInstructorsAdminPanel();
    switchTab('instructors-admin');
    loadInstructorsList();
    return;
  }
  if (key === 'users') {
    document.getElementById('settings-section-modal')?.remove();
    if (window._tabCatMap) window._tabCatMap['users-admin'] = 'settings';
    let up = document.getElementById('panel-users-admin');
    if (!up) { up = document.createElement('div'); up.className = 'tab-panel'; up.id = 'panel-users-admin'; document.getElementById('content').appendChild(up); }
    up.innerHTML = renderUsersAdminPanel();
    switchTab('users-admin');
    loadAllUsersList();
    return;
  }

  const titles = {
    year: '⚙️ הגדרות שנה',
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
  };
};

function renderGroupsAdminPanel() {
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
    <div style="direction:rtl;max-width:900px">
      <button onclick="switchTab('settings')" style="background:none;border:none;color:#4a90d9;font-size:13px;cursor:pointer;padding:0 0 14px;font-family:inherit">‹ חזרה להגדרות</button>
      <h3 style="font-size:20px;font-weight:800;margin:0 0 20px;color:var(--text-primary)">🏫 ניהול חוגים</h3>
      <div>${rows || '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:16px">אין חוגים — צור את הראשון</div>'}</div>
      <div style="margin-top:14px">
        <button onclick="openCreateGroupModal()" style="background:#2b6cb0;color:white;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">➕ צור חוג חדש</button>
      </div>
    </div>`;
}
window.renderGroupsAdminPanel = renderGroupsAdminPanel;

function renderTeamsAdminPanel() {
  let teamsHtml = '';
  if (teams.length === 0) {
    teamsHtml = '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:16px">אין נבחרות — צור את הראשונה</div>';
  } else {
    // Fixed display order (מערב, then מזרח, then unassigned) — deriving this from
    // teams.map() instead flips section order on every delete, since Firebase
    // returns dbTeams' children key-sorted (essentially alphabetical by team
    // name), not grouped by region, so whichever region the current first-in-
    // array team happens to belong to would "win" the top spot each render.
    const REGION_ORDER = ['מערב', 'מזרח', ''];
    const presentRegions = new Set(teams.map(t => t.region || ''));
    const regions = REGION_ORDER.filter(r => presentRegions.has(r))
      .concat([...presentRegions].filter(r => !REGION_ORDER.includes(r))); // any custom region falls back after the fixed ones
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
    <div style="direction:rtl;max-width:900px">
      <button onclick="switchTab('settings')" style="background:none;border:none;color:#4a90d9;font-size:13px;cursor:pointer;padding:0 0 14px;font-family:inherit">‹ חזרה להגדרות</button>
      <h3 style="font-size:20px;font-weight:800;margin:0 0 20px;color:var(--text-primary)">🏅 ניהול נבחרות</h3>
      <div>${teamsHtml}</div>
      <div style="margin-top:14px">
        <button onclick="openCreateTeamModal()" style="background:#553c9a;color:white;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">➕ צור נבחרת חדשה</button>
      </div>
    </div>`;
}
window.renderTeamsAdminPanel = renderTeamsAdminPanel;

function renderInstructorsAdminPanel() {
  return `
    <div style="direction:rtl;max-width:900px">
      <button onclick="switchTab('settings')" style="background:none;border:none;color:#4a90d9;font-size:13px;cursor:pointer;padding:0 0 14px;font-family:inherit">‹ חזרה להגדרות</button>
      <h3 style="font-size:20px;font-weight:800;margin:0 0 20px;color:var(--text-primary)">👥 ניהול מדריכים</h3>
      <div id="instructors-list">
        <div style="color:var(--text-muted);font-size:13px;text-align:center;padding:12px">טוען מדריכים...</div>
      </div>
      <div style="margin-top:14px">
        <button onclick="openAddInstructorModal()" style="background:#276749;color:white;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">➕ הוסף מדריך</button>
      </div>
    </div>`;
}
window.renderInstructorsAdminPanel = renderInstructorsAdminPanel;

function renderUsersAdminPanel() {
  return `
    <div style="direction:rtl;max-width:900px">
      <button onclick="switchTab('settings')" style="background:none;border:none;color:#4a90d9;font-size:13px;cursor:pointer;padding:0 0 14px;font-family:inherit">‹ חזרה להגדרות</button>
      <h3 style="font-size:20px;font-weight:800;margin:0 0 20px;color:var(--text-primary)">🔐 ניהול משתמשים</h3>
      <div id="all-users-list">
        <div style="color:var(--text-muted);font-size:13px;text-align:center;padding:12px">טוען...</div>
      </div>
      <div style="margin-top:14px">
        <button onclick="openAddAdminModal()" style="background:#553c9a;color:white;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">➕ הוסף מנהל</button>
      </div>
    </div>`;
}
window.renderUsersAdminPanel = renderUsersAdminPanel;

function _renderSchedVisInline(data) {
  const el = document.getElementById('sched-vis-inline');
  if (!el) return;
  const hidden  = !!data.scheduleHidden;
  const message = data.scheduleMessage || 'לוח החוגים יתעדכן בקרוב — נשמח לראותכם!';
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:20px;padding:16px;border-radius:10px;background:var(--bg-subtle);border:1px solid var(--border)">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div>
          <div style="font-weight:700;font-size:14px;color:var(--text-primary)">🚧 הסתר לוח חוגים באתר</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px">במקומו יוצג הכיתוב שתבחר למטה</div>
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
        <textarea id="sched-msg-input" rows="2"
          style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg-card);
                 color:var(--text-primary);font-family:inherit;font-size:14px;resize:vertical;box-sizing:border-box;direction:rtl"
          placeholder="לדוגמה: לוח החוגים בבנייה — נחזור בקרוב!">${message}</textarea>
      </div>
      <button onclick="_saveSchedVisSettings()"
        style="background:#f97316;color:white;border:none;border-radius:8px;padding:9px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;align-self:flex-start">
        💾 שמור
      </button>
    </div>`;
}
window._renderSchedVisInline = _renderSchedVisInline;

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
            ✓ ${camps.length} מחנות עם כל השחקנים<br>
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
    const paths = ['extra_players','player_overrides','hidden_players','attendance','notes','payment','player_contacts','group_names','subgroup_names','history','vacations','dbGroups','dbTeams','team_players','team_attendance','teamVacations','dbCamps','camp_players','camp_attendance'];
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
    // Also archive the camp definitions (instructor is per level, not per camp)
    archiveData.campDefinitions = camps.map(c => ({
      id: c.id, name: c.name, startDate: c.startDate, endDate: c.endDate,
      subGroups: c.levels.map(lv => ({ time: lv.name, instructor: lv.instructor, players: lv.players || [] }))
    }));
    await db.ref(`yearArchive/${yearKey}`).set(archiveData);
    // Clear all active data
    await Promise.all(paths.map(p => db.ref(p).remove()));
    document.querySelector('.friday-modal')?.remove();
    showToast(`השנה הועברה לארכיון ✅ — ניתן לצור חוגים, נבחרות ומחנות חדשים`);
    // Rebuild app fresh
    _useDbGroups = true;
    groups = [];
    _useDbTeams = true;
    teams = [];
    _useDbCamps = true;
    camps = [];
    document.getElementById('tabsBar').innerHTML = '';
    document.getElementById('content').innerHTML = '';
    buildApp();
    setTimeout(() => switchTab('settings'), 100);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); if (btn) { btn.disabled = false; btn.textContent = '🏁 אשר סיום שנה ופתח שנה חדשה'; } }
}
window.doEndYear = doEndYear;

async function openArchiveBrowser() {
  document.getElementById('settings-section-modal')?.remove();
  if (window._tabCatMap) window._tabCatMap['archive'] = 'settings';
  let panel = document.getElementById('panel-archive');
  if (!panel) {
    panel = document.createElement('div');
    panel.className = 'tab-panel'; panel.id = 'panel-archive';
    document.getElementById('content').appendChild(panel);
  }
  panel.innerHTML = '<div style="padding:32px;text-align:center;color:var(--text-muted)">⏳ טוען ארכיון...</div>';
  switchTab('archive');
  try {
    const snap = await db.ref('yearArchive').get();
    const archive = snap.val();
    if (!archive) {
      panel.innerHTML = `
        <div style="direction:rtl;max-width:900px">
          <button onclick="switchTab('settings')" style="background:none;border:none;color:#4a90d9;font-size:13px;cursor:pointer;padding:0 0 14px;font-family:inherit">‹ חזרה להגדרות</button>
          <div style="color:var(--text-muted);font-size:14px;text-align:center;padding:40px 20px">אין ארכיון עדיין</div>
        </div>`;
      return;
    }
    const years = Object.entries(archive).sort((a, b) => (b[1].archivedAt || '').localeCompare(a[1].archivedAt || ''));
    const liveTeamsCount = teams.length;
    const esc = s => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

    const renderUnit = (name, roleLabel, roleName, subGroups, icon) => {
      const subGroupsArr = subGroups || [];
      const allEmpty = subGroupsArr.length === 0 || subGroupsArr.every(sg => (sg.players || []).filter(p => !p.hidden).length === 0);
      const subHtml = subGroupsArr.map(sg => {
        const players = (sg.players || []).filter(p => !p.hidden);
        const sgInstructorLine = sg.instructor !== undefined
          ? `<div style="font-size:11px;color:var(--text-muted);margin-bottom:3px">מדריך: ${sg.instructor ? esc(sg.instructor) : '<span style="color:#c53030">— לא משוייך</span>'}</div>` : '';
        if (players.length === 0) {
          return `<div style="margin-top:8px">
            <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:4px">${esc(sg.time || 'קבוצה')}</div>
            ${sgInstructorLine}
            <div style="font-size:12px;color:#c53030;background:rgba(197,48,48,0.08);border:1px dashed #feb2b2;border-radius:6px;padding:6px 10px">⚠️ אין רשימת שחקנים</div>
          </div>`;
        }
        const rows = players.map((p,i) => `<tr><td style="padding:4px 10px;border-bottom:1px solid var(--border)">${i+1}</td><td style="padding:4px 10px;border-bottom:1px solid var(--border)">${esc(p.name || `${p.firstName||''} ${p.lastName||''}`.trim() || '?')}</td><td style="padding:4px 10px;border-bottom:1px solid var(--border)">${esc(p.birthYear||'—')}</td></tr>`).join('');
        return `<div style="margin-top:8px">
          <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:4px">${esc(sg.time || 'קבוצה')} <span style="font-weight:400;color:var(--text-muted)">(${players.length})</span></div>
          ${sgInstructorLine}
          <table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th style="background:#2b6cb0;color:white;padding:5px 10px;text-align:right;font-size:11px">#</th><th style="background:#2b6cb0;color:white;padding:5px 10px;text-align:right;font-size:11px">שם</th><th style="background:#2b6cb0;color:white;padding:5px 10px;text-align:right;font-size:11px">שנת לידה</th></tr></thead><tbody>${rows}</tbody></table>
        </div>`;
      }).join('');
      const roleLine = roleLabel ? `<span style="font-size:12px;color:var(--text-muted);background:var(--bg-subtle);border-radius:6px;padding:2px 8px">${roleLabel}: ${roleName ? esc(roleName) : '—'}</span>` : '';
      return `<div style="background:var(--bg-card);border:1px solid ${allEmpty ? '#feb2b2' : 'var(--border)'};border-radius:10px;padding:14px 16px;margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <span style="font-size:16px">${icon}</span>
          <span style="font-weight:700;font-size:15px;color:var(--text-primary)">${esc(name)}</span>
          ${roleLine}
          ${allEmpty ? '<span style="font-size:11px;font-weight:700;color:#c53030;background:#fed7d7;border-radius:6px;padding:2px 8px">⚠️ אין רשימת שחקנים כלל</span>' : ''}
        </div>
        ${subHtml}
      </div>`;
    };

    const yearSections = years.map(([yearKey, y]) => {
      const groupsHtml = (y.groupDefinitions || []).map(g => renderUnit(g.name, 'מדריך', g.instructor, g.subGroups, '🏫')).join('') || '<div style="color:var(--text-muted);font-size:13px;padding:8px 0">אין חוגים בארכיון זה</div>';
      const teamsHtml = (y.teamDefinitions || []).map(t => renderUnit(t.name, 'מאמן', t.coach, t.subGroups, '🏅')).join('') || '<div style="color:var(--text-muted);font-size:13px;padding:8px 0">אין נבחרות בארכיון זה</div>';
      const campsHtml = (y.campDefinitions || []).map(c => renderUnit(c.name, '', null, c.subGroups, '🏕️')).join('') || '<div style="color:var(--text-muted);font-size:13px;padding:8px 0">אין מחנות בארכיון זה</div>';
      const dateStr = y.archivedAt ? new Date(y.archivedAt).toLocaleDateString('he-IL') : '';
      const missingTeams = !y.teamDefinitions || y.teamDefinitions.length === 0;
      const migrateBtn = (missingTeams && liveTeamsCount > 0) ? `
        <button onclick="
          if(confirm('להעביר את ${liveTeamsCount} הנבחרות הנוכחיות (עם כל השחקנים) לארכיון? הנתונים הפעילים של הנבחרות יימחקו לאחר מכן. פעולה זו אינה הפיכה.')){
            this.disabled=true; this.textContent='⏳ מעביר...';
            _doArchiveTeamsMerge('${yearKey}').then(()=>{ openArchiveBrowser(); }).catch(e=>{ alert('שגיאה: '+e.message); this.disabled=false; this.textContent='🗄 השלם — העבר את ${liveTeamsCount} הנבחרות הנוכחיות לשנה זו'; });
          }" style="background:#553c9a;color:white;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;margin:8px 0 4px;font-family:inherit">🗄 השלם — העבר את ${liveTeamsCount} הנבחרות הנוכחיות לשנה זו</button>` : '';
      return `
        <section id="year-${esc(yearKey)}" style="margin-bottom:36px">
          <h2 style="font-size:19px;border-bottom:2px solid #2b6cb0;padding-bottom:6px;margin-bottom:4px;color:var(--text-primary)">📁 ${esc(y.name || yearKey)} <span style="font-size:12px;color:var(--text-muted);font-weight:400;margin-right:8px">${dateStr}</span></h2>
          ${migrateBtn}
          <h3 style="font-size:14px;color:var(--text-muted);margin:18px 0 8px">חוגים</h3>
          ${groupsHtml}
          <h3 style="font-size:14px;color:var(--text-muted);margin:18px 0 8px">נבחרות</h3>
          ${teamsHtml}
          <h3 style="font-size:14px;color:var(--text-muted);margin:18px 0 8px">מחנות</h3>
          ${campsHtml}
        </section>`;
    }).join('');

    const toc = years.length > 1 ? `<nav style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:10px 14px;margin-bottom:24px;font-size:13px;color:var(--text-primary)">קפצו לשנה: ${years.map(([yearKey,y]) => `<a href="#year-${esc(yearKey)}" style="color:#4a90d9;text-decoration:none;margin:0 4px">${esc(y.name || yearKey)}</a>`).join(' · ')}</nav>` : '';

    panel.innerHTML = `
      <div style="direction:rtl;max-width:900px">
        <button onclick="switchTab('settings')" style="background:none;border:none;color:#4a90d9;font-size:13px;cursor:pointer;padding:0 0 14px;font-family:inherit">‹ חזרה להגדרות</button>
        <h3 style="font-size:20px;font-weight:800;margin:0 0 4px;color:var(--text-primary)">📂 ארכיון שנים קודמות</h3>
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:20px">${years.length} שנים בארכיון</div>
        ${toc}
        ${yearSections}
      </div>`;
  } catch(e) { panel.innerHTML = `<div style="padding:24px;color:#c53030">שגיאה: ${e.message}</div>`; }
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

