// ===== MONTHLY ACTIVITY CALENDAR =====

// State for public calendar
let _pubCalYear = new Date().getFullYear();
let _pubCalMonth = new Date().getMonth() + 1; // 1-based

async function loadAndRenderPublicCal() {
  const el = document.getElementById('pub-cal-container');
  if (!el) return;
  if (typeof db !== 'undefined' && db) {
    try {
      const visSnap = await db.ref('monthlyCalendar/_settings').get();
      const vis = visSnap.val() || {};
      if (vis.hidden) {
        const msg = vis.message || 'לוח הפעילויות יתעדכן בקרוב — נשמח לראותכם!';
        el.innerHTML = `
          <div style="text-align:center;padding:60px 24px;direction:rtl">
            <div style="font-size:48px;margin-bottom:16px">🚧</div>
            <div style="font-size:18px;font-weight:700;color:var(--text-primary);margin-bottom:10px;white-space:pre-wrap;line-height:1.6">${msg}</div>
          </div>`;
        return;
      }
    } catch(e) { console.warn('calendar visibility check error', e); }
  }
  const key = `${_pubCalYear}-${String(_pubCalMonth).padStart(2,'0')}`;
  let data = {};
  if (typeof db !== 'undefined' && db) {
    try {
      const snap = await db.ref(`monthlyCalendar/${key}`).get();
      data = snap.val() || {};
    } catch(e) { console.warn('calendar load error', e); }
  }
  el.innerHTML = renderPublicCalendar(_pubCalYear, _pubCalMonth, data);
}
window.loadAndRenderPublicCal = loadAndRenderPublicCal;

// ===== HOME PAGE "UPCOMING ACTIVITIES" ROW =====
// Pulls the next 3 dated events from the same monthlyCalendar ("לוח פעילויות") data
// the public calendar page reads, so anything entered there shows up here too.
const UPCOMING_HE_MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

async function loadUpcomingActivities() {
  const section = document.getElementById('upcoming-section');
  const grid = document.getElementById('upcoming-grid');
  if (!section || !grid || typeof db === 'undefined' || !db) return;
  try {
    const visSnap = await db.ref('monthlyCalendar/_settings').get();
    const vis = visSnap.val() || {};
    if (vis.hidden) { section.style.display = 'none'; return; }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const upcoming = [];
    // Scan the current month plus up to 2 months ahead, stopping once we have enough candidates
    for (let offset = 0; offset < 3 && upcoming.length < 3; offset++) {
      const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      const snap = await db.ref('monthlyCalendar/' + key + '/events').get();
      const events = snap.val() ? Object.values(snap.val()) : [];
      events.forEach(function(ev) { if (ev.date && ev.date >= todayStr) upcoming.push(ev); });
    }
    upcoming.sort(function(a, b) { return a.date.localeCompare(b.date); });
    const next3 = upcoming.slice(0, 3);

    if (!next3.length) { section.style.display = 'none'; return; }

    grid.innerHTML = next3.map(function(ev) {
      const parts = ev.date.split('-').map(Number);
      const dateLabel = parts[2] + ' ב' + UPCOMING_HE_MONTHS[parts[1] - 1];
      return '<div class="upcoming-card" style="border-right-color:' + (ev.color || '#f97316') + '">' +
        '<div class="upcoming-date">📅 ' + dateLabel + '</div>' +
        '<div class="upcoming-title">' + (ev.title || '') + '</div>' +
        '</div>';
    }).join('');
    section.style.display = '';
  } catch(e) { console.warn('loadUpcomingActivities:', e); section.style.display = 'none'; }
}
window.loadUpcomingActivities = loadUpcomingActivities;

function renderPublicCalendar(year, month, data) {
  const HE_MONTHS = ['','ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
  const HE_DAYS   = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
  const monthStr  = String(month).padStart(2,'0');

  // Parse club days (0=Sun..6=Sat)
  const clubDaysSet = new Set((data.clubDays||'').split(',').map(Number).filter(d=>!isNaN(d)&&d>=0));
  const noClubDates = data.noClubDates || {};
  const events      = data.events ? Object.values(data.events) : [];
  const sidebarNotes      = data.sidebarNotes || [];
  const internationalEvents = data.internationalEvents || [];

  // Group events by date
  const eventsByDate = {};
  events.forEach(ev => {
    if (!eventsByDate[ev.date]) eventsByDate[ev.date] = [];
    eventsByDate[ev.date].push(ev);
  });

  // Build calendar grid
  const firstDay = new Date(year, month-1, 1);
  const lastDay  = new Date(year, month, 0);
  let startPad = firstDay.getDay(); // 0=Sun..6=Sat

  const cells = [];
  // Previous month padding
  for (let i = 0; i < startPad; i++) {
    const d = new Date(year, month-1, -startPad+1+i);
    cells.push({ date: null, num: d.getDate(), isOther: true });
  }
  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dt   = new Date(year, month-1, d);
    const iso  = `${year}-${monthStr}-${String(d).padStart(2,'0')}`;
    const dow  = dt.getDay(); // 0=Sun
    const isClub = clubDaysSet.has(dow) && !noClubDates[iso];
    cells.push({ date: iso, num: d, isClub, dow, evs: eventsByDate[iso] || [] });
  }
  // Pad end to complete row
  while (cells.length % 7 !== 0) cells.push({ date: null, num: null, isOther: true });

  // Render day headers (RTL: right=Sun, left=Sat)
  // We reverse so Sat is leftmost (first in LTR grid = rightmost visually in RTL)
  const dowHeaders = [...HE_DAYS].reverse()
    .map(d => `<div class="pub-cal-dow">${d}</div>`).join('');

  // Render cells — each week row reversed so Sat is first col, Sun is last col
  const rows = [];
  for (let r = 0; r < cells.length; r += 7) {
    const week = cells.slice(r, r+7);
    const reversed = [...week].reverse();
    const cellsHtml = reversed.map(c => {
      if (c.isOther) return `<div class="pub-cal-cell other-month"></div>`;
      const cls = c.isClub ? 'club-day' : 'no-club';
      const hasEv = c.evs.length > 0;
      const evHtml = c.evs.map(ev =>
        `<span class="pub-cal-event" style="background:${ev.color||'#f97316'}">${ev.title}</span>`
      ).join('');
      return `<div class="pub-cal-cell ${cls}${hasEv?' has-event':''}">
        <div class="pub-cal-day-num">${c.num}</div>
        ${evHtml}
      </div>`;
    }).join('');
    rows.push(cellsHtml);
  }

  // Sidebar
  const legendHtml = `
    <div class="pub-cal-legend-item"><div class="pub-cal-legend-dot" style="background:#fef3c7;border-color:#f59e0b"></div>יש חוגים במועדון</div>
    <div class="pub-cal-legend-item"><div class="pub-cal-legend-dot" style="background:white"></div>אין חוגים במועדון</div>`;

  const notesHtml = sidebarNotes.map(n => {
    if (n.bold) {
      const lines = n.text.split('\n');
      const rest = lines.slice(1).join('\n');
      return `<div class="pub-cal-note"><strong>${lines[0]}</strong>${rest ? '\n' + rest : ''}</div>`;
    }
    return `<div class="pub-cal-note">${n.text}</div>`;
  }).join('');

  // International events
  const intlHtml = internationalEvents.length ? `
    <div class="pub-cal-intl">
      <h4>אירועים בינלאומיים</h4>
      ${internationalEvents.map(ev => `
        <div class="pub-cal-intl-row">
          <span>${ev.flag||'🌍'}</span>
          <div><div>${ev.title}</div><div class="pub-cal-intl-dates">${ev.dateRange||''}</div></div>
        </div>`).join('')}
    </div>` : '';

  return `
    <div class="pub-cal-wrap">
      <div class="pub-cal-header">
        <div class="pub-cal-nav">
          <button onclick="pubCalNav(-1)">◀</button>
          <button onclick="pubCalNav(1)">▶</button>
        </div>
        <div class="pub-cal-title">${HE_MONTHS[month]} ${monthStr}/${year}</div>
      </div>
      <div class="pub-cal-body">
        <div class="pub-cal-sidebar">
          ${intlHtml}
          ${legendHtml}
          ${notesHtml}
        </div>
        <div class="pub-cal-grid-wrap">
          <div class="pub-cal-grid">
            ${dowHeaders}
            ${rows.join('')}
          </div>
        </div>
      </div>
    </div>`;
}
window.renderPublicCalendar = renderPublicCalendar;

function pubCalNav(dir) {
  _pubCalMonth += dir;
  if (_pubCalMonth > 12) { _pubCalMonth = 1; _pubCalYear++; }
  if (_pubCalMonth < 1)  { _pubCalMonth = 12; _pubCalYear--; }
  loadAndRenderPublicCal();
}
window.pubCalNav = pubCalNav;

// Admin calendar state
let _adminCalYear  = new Date().getFullYear();
let _adminCalMonth = new Date().getMonth() + 1;

async function loadAdminCalendarPanel() {
  const panel = document.getElementById('panel-monthly-cal');
  if (!panel) return;
  const key  = `${_adminCalYear}-${String(_adminCalMonth).padStart(2,'0')}`;
  let data = {};
  try { const s = await db.ref(`monthlyCalendar/${key}`).get(); data = s.val() || {}; } catch(e) {}
  panel.innerHTML = renderAdminCalPanel(data);
  let visData = {};
  try { const vs = await db.ref('monthlyCalendar/_settings').get(); visData = vs.val() || {}; } catch(e) {}
  _renderMonthlyCalVisInline(visData);
}
window.loadAdminCalendarPanel = loadAdminCalendarPanel;

function _renderMonthlyCalVisInline(data) {
  const el = document.getElementById('monthly-cal-vis-inline');
  if (!el) return;
  const hidden  = !!data.hidden;
  const message = data.message || 'לוח הפעילויות יתעדכן בקרוב — נשמח לראותכם!';
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:20px;padding:16px;border-radius:10px;background:var(--bg-subtle);border:1px solid var(--border)">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div>
          <div style="font-weight:700;font-size:14px;color:var(--text-primary)">🚧 הסתר לוח פעילויות באתר</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px">במקומו יוצג הכיתוב שתבחר למטה</div>
        </div>
        <label style="position:relative;display:inline-block;width:46px;height:26px;flex-shrink:0">
          <input type="checkbox" id="monthly-cal-hidden-toggle" ${hidden ? 'checked' : ''} onchange="_onMonthlyCalHiddenToggle()"
            style="opacity:0;width:0;height:0;position:absolute">
          <span id="monthly-cal-toggle-track" style="position:absolute;inset:0;border-radius:13px;transition:.2s;cursor:pointer;
            background:${hidden ? '#f97316' : 'rgba(160,174,192,0.4)'}"></span>
          <span id="monthly-cal-toggle-thumb" style="position:absolute;top:3px;width:20px;height:20px;border-radius:50%;background:white;
            transition:.2s;box-shadow:0 1px 3px rgba(0,0,0,.3);
            left:${hidden ? '23px' : '3px'}"></span>
        </label>
      </div>
      <div id="monthly-cal-msg-wrap" style="display:${hidden ? 'flex' : 'none'};flex-direction:column;gap:8px">
        <label style="font-size:13px;font-weight:600;color:var(--text-primary)">כיתוב שיופיע במקום לוח הפעילויות</label>
        <textarea id="monthly-cal-msg-input" rows="2"
          style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg-card);
                 color:var(--text-primary);font-family:inherit;font-size:14px;resize:vertical;box-sizing:border-box;direction:rtl"
          placeholder="לדוגמה: לוח הפעילויות בבנייה — נחזור בקרוב!">${message}</textarea>
      </div>
      <button onclick="_saveMonthlyCalVisSettings()"
        style="background:#f97316;color:white;border:none;border-radius:8px;padding:9px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;align-self:flex-start">
        💾 שמור
      </button>
    </div>`;
}
window._renderMonthlyCalVisInline = _renderMonthlyCalVisInline;

window._onMonthlyCalHiddenToggle = function() {
  const hidden = document.getElementById('monthly-cal-hidden-toggle').checked;
  document.getElementById('monthly-cal-toggle-track').style.background = hidden ? '#f97316' : 'rgba(160,174,192,0.4)';
  document.getElementById('monthly-cal-toggle-thumb').style.left       = hidden ? '23px' : '3px';
  document.getElementById('monthly-cal-msg-wrap').style.display        = hidden ? 'flex' : 'none';
};

window._saveMonthlyCalVisSettings = async function() {
  const hidden  = document.getElementById('monthly-cal-hidden-toggle').checked;
  const message = (document.getElementById('monthly-cal-msg-input')?.value || '').trim();
  await db.ref('monthlyCalendar/_settings').update({ hidden, message });
  showToast(hidden ? '🚧 לוח הפעילויות מוסתר באתר' : '✅ לוח הפעילויות גלוי באתר');
};

function renderAdminCalPanel(data) {
  const HE_MONTHS = ['','ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
  const HE_DAYS = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
  const clubDaysArr = (data.clubDays||'').split(',').map(Number).filter(d=>!isNaN(d)&&d>=0);
  const events = data.events ? Object.values(data.events).sort((a,b)=>a.date.localeCompare(b.date)) : [];
  const noClubDates = Object.keys(data.noClubDates||{}).sort().join(', ');
  const sidebarNotes = data.sidebarNotes || [];
  const intlEvents   = data.internationalEvents || [];

  const checkboxes = HE_DAYS.map((d,i) =>
    `<label style="display:flex;align-items:center;gap:4px;font-size:13px;cursor:pointer">
       <input type="checkbox" value="${i}" ${clubDaysArr.includes(i)?'checked':''} class="admin-cal-clubday"> ${d}
     </label>`).join('');

  const evRows = events.length
    ? events.map((ev,i) => `
        <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #f0f4f8">
          <span style="width:10px;height:10px;border-radius:50%;background:${ev.color||'#f97316'};flex-shrink:0"></span>
          <span style="font-size:13px;color:#718096;min-width:90px">${ev.date}</span>
          <span style="flex:1;font-size:13px;font-weight:600">${ev.title}</span>
          <button onclick="deleteCalEvent('${(ev.date||'').replace(/'/g,"\\'")}','${(ev.title||'').replace(/'/g,"\\'")}')"
            style="background:none;border:none;color:#e53e3e;cursor:pointer;font-size:14px">🗑</button>
        </div>`)
      .join('')
    : `<div style="color:#a0aec0;font-size:13px;padding:12px 0">אין אירועים לחודש זה</div>`;

  const noteRows = sidebarNotes.map((n,i) => `
    <div style="display:flex;gap:6px;align-items:flex-start;margin-bottom:6px">
      <textarea class="admin-cal-note modal-input" data-idx="${i}" style="flex:1;height:60px;font-size:12px">${n.text||''}</textarea>
      <label style="display:flex;align-items:center;gap:3px;font-size:11px;white-space:nowrap"><input type="checkbox" class="admin-cal-note-bold" data-idx="${i}" ${n.bold?'checked':''}> מודגש</label>
      <button onclick="removeCalNote(${i})" style="background:none;border:none;color:#e53e3e;cursor:pointer;font-size:14px;flex-shrink:0">✕</button>
    </div>`).join('');

  const intlRows = intlEvents.map((ev,i) => `
    <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;flex-wrap:wrap">
      <input type="text" class="modal-input admin-cal-intl-flag" data-idx="${i}" value="${ev.flag||'🌍'}" style="width:44px;text-align:center">
      <input type="text" class="modal-input admin-cal-intl-range" data-idx="${i}" value="${ev.dateRange||''}" placeholder="29.10 – 7.11" style="width:110px">
      <input type="text" class="modal-input admin-cal-intl-title" data-idx="${i}" value="${ev.title||''}" placeholder="שם האירוע" style="flex:1;min-width:120px">
      <button onclick="removeCalIntl(${i})" style="background:none;border:none;color:#e53e3e;cursor:pointer;font-size:14px">✕</button>
    </div>`).join('');

  return `
    <div style="max-width:900px">
      <div id="monthly-cal-vis-inline"></div>
      <!-- Month navigation -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
        <button onclick="adminCalNav(-1)" style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 14px;font-size:16px;cursor:pointer">◀</button>
        <span style="font-size:20px;font-weight:800;color:#2d3748">${HE_MONTHS[_adminCalMonth]} ${String(_adminCalMonth).padStart(2,'0')}/${_adminCalYear}</span>
        <button onclick="adminCalNav(1)" style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 14px;font-size:16px;cursor:pointer">▶</button>
        <button onclick="previewAdminCal()" style="background:#ebf8ff;border:1px solid #bee3f8;border-radius:8px;padding:7px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;color:#2b6cb0;margin-right:auto">👁 תצוגה מקדימה</button>
        <button onclick="saveAdminCal()" style="background:#276749;color:white;border:none;border-radius:8px;padding:8px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">💾 שמור הכל</button>
      </div>

      <!-- Club days -->
      <div class="att-card" style="margin-bottom:14px">
        <div class="att-card-header">📅 ימי חוג קבועים</div>
        <div style="padding:14px 18px;display:flex;gap:12px;flex-wrap:wrap">${checkboxes}</div>
      </div>

      <!-- Events -->
      <div class="att-card" style="margin-bottom:14px">
        <div class="att-card-header">🗓 אירועים לחודש</div>
        <div style="padding:14px 18px">
          ${evRows}
          <button onclick="openAddCalEvent()" style="margin-top:10px;background:#f0fff4;border:1px solid #c6f6d5;border-radius:8px;padding:7px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;color:#276749">➕ הוסף אירוע</button>
        </div>
      </div>

      <!-- No-club dates -->
      <div class="att-card" style="margin-bottom:14px">
        <div class="att-card-header">🚫 תאריכים ללא חוג (חגים וכד׳)</div>
        <div style="padding:14px 18px">
          <div style="font-size:12px;color:#718096;margin-bottom:6px">הזן תאריכים מופרדים בפסיקים (YYYY-MM-DD)</div>
          <input type="text" id="admin-cal-noclubdates" class="modal-input" value="${noClubDates}" placeholder="2025-11-15, 2025-11-22" dir="ltr">
        </div>
      </div>

      <!-- Sidebar notes -->
      <div class="att-card" style="margin-bottom:14px">
        <div class="att-card-header">📝 הערות סייד-בר</div>
        <div style="padding:14px 18px">
          <div id="admin-cal-notes">${noteRows}</div>
          <button onclick="addCalNote()" style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:12px;cursor:pointer;font-family:inherit;margin-top:6px">➕ הוסף הערה</button>
        </div>
      </div>

      <!-- International events -->
      <div class="att-card" style="margin-bottom:14px">
        <div class="att-card-header">🌍 אירועים בינלאומיים / חיצוניים</div>
        <div style="padding:14px 18px">
          <div id="admin-cal-intl">${intlRows}</div>
          <button onclick="addCalIntl()" style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:12px;cursor:pointer;font-family:inherit;margin-top:6px">➕ הוסף אירוע</button>
        </div>
      </div>
    </div>`;
}
window.renderAdminCalPanel = renderAdminCalPanel;

function adminCalNav(dir) {
  _adminCalMonth += dir;
  if (_adminCalMonth > 12) { _adminCalMonth = 1; _adminCalYear++; }
  if (_adminCalMonth < 1)  { _adminCalMonth = 12; _adminCalYear--; }
  loadAdminCalendarPanel();
}
window.adminCalNav = adminCalNav;

function openAddCalEvent() {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:400px">
        <div class="modal-header">
          <span class="modal-title">➕ הוסף אירוע</span>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:12px">
          <div class="modal-field">
            <label>תאריך <span style="color:#e53e3e">*</span></label>
            <input type="date" id="cal-ev-date" class="modal-input" value="${_adminCalYear}-${String(_adminCalMonth).padStart(2,'0')}-01">
          </div>
          <div class="modal-field">
            <label>כותרת האירוע <span style="color:#e53e3e">*</span></label>
            <input type="text" id="cal-ev-title" class="modal-input" placeholder="שם האירוע">
          </div>
          <div class="modal-field">
            <label>צבע תווית</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
              ${['#f97316','#2b6cb0','#276749','#553c9a','#e53e3e','#0d9488','#718096'].map(c=>
                `<div onclick="document.querySelectorAll('.cal-color-swatch').forEach(s=>s.style.outline='none');this.style.outline='3px solid #2d3748';document.getElementById('cal-ev-color').value='${c}'"
                  class="cal-color-swatch" style="width:28px;height:28px;border-radius:6px;background:${c};cursor:pointer;border:2px solid rgba(0,0,0,0.1)"></div>`
              ).join('')}
            </div>
            <input type="hidden" id="cal-ev-color" value="#f97316">
          </div>
          <div id="cal-ev-error" style="color:#c53030;font-size:13px;display:none"></div>
          <button onclick="submitAddCalEvent()" style="background:#2b6cb0;color:white;border:none;border-radius:8px;padding:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">✅ הוסף</button>
        </div>
      </div>
    </div>`);
  setTimeout(() => document.querySelector('.cal-color-swatch')?.click(), 50);
}
window.openAddCalEvent = openAddCalEvent;

async function submitAddCalEvent() {
  const date  = document.getElementById('cal-ev-date')?.value;
  const title = document.getElementById('cal-ev-title')?.value?.trim();
  const color = document.getElementById('cal-ev-color')?.value || '#f97316';
  const errEl = document.getElementById('cal-ev-error');
  if (!date || !title) { errEl.textContent = 'יש למלא תאריך וכותרת'; errEl.style.display=''; return; }
  const key = `${_adminCalYear}-${String(_adminCalMonth).padStart(2,'0')}`;
  try {
    await db.ref(`monthlyCalendar/${key}/events`).push({ date, title, color });
    document.querySelector('.friday-modal')?.remove();
    showToast('האירוע נוסף ✅');
    loadAdminCalendarPanel();
  } catch(e) { errEl.textContent = e.message; errEl.style.display=''; }
}
window.submitAddCalEvent = submitAddCalEvent;

async function deleteCalEvent(date, title) {
  if (!confirm(`למחוק: "${title}" (${date})?`)) return;
  const key = `${_adminCalYear}-${String(_adminCalMonth).padStart(2,'0')}`;
  try {
    const snap = await db.ref(`monthlyCalendar/${key}/events`).get();
    const allEvs = snap.val() || {};
    const pushKey = Object.entries(allEvs).find(([k,v]) => v.date===date && v.title===title)?.[0];
    if (pushKey) await db.ref(`monthlyCalendar/${key}/events/${pushKey}`).remove();
    showToast('האירוע נמחק');
    loadAdminCalendarPanel();
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.deleteCalEvent = deleteCalEvent;

function readAdminCalState() {
  const clubDays = [...document.querySelectorAll('.admin-cal-clubday:checked')].map(cb=>cb.value).join(',');
  const noClubRaw = document.getElementById('admin-cal-noclubdates')?.value || '';
  const noClubDates = {};
  noClubRaw.split(',').map(s=>s.trim()).filter(Boolean).forEach(d => { noClubDates[d] = true; });

  const noteEls   = document.querySelectorAll('.admin-cal-note');
  const boldEls   = document.querySelectorAll('.admin-cal-note-bold');
  const sidebarNotes = [...noteEls].map((el,i) => ({ text: el.value.trim(), bold: boldEls[i]?.checked||false })).filter(n=>n.text);

  const flagEls  = document.querySelectorAll('.admin-cal-intl-flag');
  const rangeEls = document.querySelectorAll('.admin-cal-intl-range');
  const titleEls = document.querySelectorAll('.admin-cal-intl-title');
  const internationalEvents = [...flagEls].map((el,i) => ({
    flag: el.value, dateRange: rangeEls[i]?.value||'', title: titleEls[i]?.value||''
  })).filter(ev=>ev.title);

  return { clubDays, noClubDates, sidebarNotes, internationalEvents };
}

async function saveAdminCal() {
  const key  = `${_adminCalYear}-${String(_adminCalMonth).padStart(2,'0')}`;
  const { clubDays, noClubDates, sidebarNotes, internationalEvents } = readAdminCalState();
  try {
    await db.ref(`monthlyCalendar/${key}/clubDays`).set(clubDays);
    await db.ref(`monthlyCalendar/${key}/noClubDates`).set(Object.keys(noClubDates).length ? noClubDates : null);
    await db.ref(`monthlyCalendar/${key}/sidebarNotes`).set(sidebarNotes.length ? sidebarNotes : null);
    await db.ref(`monthlyCalendar/${key}/internationalEvents`).set(internationalEvents.length ? internationalEvents : null);
    showToast('הלוח נשמר ✅');
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.saveAdminCal = saveAdminCal;

function addCalNote() {
  const container = document.getElementById('admin-cal-notes');
  if (!container) return;
  const i = container.querySelectorAll('.admin-cal-note').length;
  container.insertAdjacentHTML('beforeend', `
    <div style="display:flex;gap:6px;align-items:flex-start;margin-bottom:6px">
      <textarea class="admin-cal-note modal-input" data-idx="${i}" style="flex:1;height:60px;font-size:12px"></textarea>
      <label style="display:flex;align-items:center;gap:3px;font-size:11px;white-space:nowrap"><input type="checkbox" class="admin-cal-note-bold" data-idx="${i}"> מודגש</label>
      <button onclick="this.closest('div').remove()" style="background:none;border:none;color:#e53e3e;cursor:pointer;font-size:14px;flex-shrink:0">✕</button>
    </div>`);
}
window.addCalNote = addCalNote;

function removeCalNote(i) {
  document.querySelectorAll('#admin-cal-notes > div')[i]?.remove();
}
window.removeCalNote = removeCalNote;

function addCalIntl() {
  const container = document.getElementById('admin-cal-intl');
  if (!container) return;
  container.insertAdjacentHTML('beforeend', `
    <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;flex-wrap:wrap">
      <input type="text" class="modal-input admin-cal-intl-flag" value="🌍" style="width:44px;text-align:center">
      <input type="text" class="modal-input admin-cal-intl-range" placeholder="29.10 – 7.11" style="width:110px">
      <input type="text" class="modal-input admin-cal-intl-title" placeholder="שם האירוע" style="flex:1;min-width:120px">
      <button onclick="this.closest('div').remove()" style="background:none;border:none;color:#e53e3e;cursor:pointer;font-size:14px">✕</button>
    </div>`);
}
window.addCalIntl = addCalIntl;

function removeCalIntl(i) {
  document.querySelectorAll('#admin-cal-intl > div')[i]?.remove();
}
window.removeCalIntl = removeCalIntl;

function previewAdminCal() {
  saveAdminCal().then(() => {
    _pubCalYear  = _adminCalYear;
    _pubCalMonth = _adminCalMonth;
    const key = `${_adminCalYear}-${String(_adminCalMonth).padStart(2,'0')}`;
    db.ref(`monthlyCalendar/${key}`).get().then(snap => {
      const html = renderPublicCalendar(_adminCalYear, _adminCalMonth, snap.val()||{});
      document.body.insertAdjacentHTML('beforeend', `
        <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()" style="padding:20px">
          <div style="background:white;border-radius:14px;max-width:1100px;width:100%;max-height:90vh;overflow-y:auto">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid #e2e8f0">
              <span style="font-weight:700;font-size:16px">👁 תצוגה מקדימה</span>
              <button onclick="this.closest('.modal-overlay').remove()" style="background:none;border:none;font-size:20px;cursor:pointer">✕</button>
            </div>
            ${html}
          </div>
        </div>`);
    });
  });
}
window.previewAdminCal = previewAdminCal;

// ===== END MONTHLY ACTIVITY CALENDAR =====


// Load news carousel on initial page load
window.addEventListener('load', function() {
  setTimeout(function() { if (db) loadNewsCarousel(); }, 1200);
});
