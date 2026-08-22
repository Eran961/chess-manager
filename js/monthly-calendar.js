// ===== MONTHLY ACTIVITY CALENDAR =====

// State for public calendar
let _pubCalYear = new Date().getFullYear();
let _pubCalMonth = new Date().getMonth() + 1; // 1-based

async function loadAndRenderPublicCal() {
  const key = `${_pubCalYear}-${String(_pubCalMonth).padStart(2,'0')}`;
  let data = {};
  if (typeof db !== 'undefined' && db) {
    try {
      const snap = await db.ref(`monthlyCalendar/${key}`).get();
      data = snap.val() || {};
    } catch(e) { console.warn('calendar load error', e); }
  }
  const el = document.getElementById('pub-cal-container');
  if (el) el.innerHTML = renderPublicCalendar(_pubCalYear, _pubCalMonth, data);
}
window.loadAndRenderPublicCal = loadAndRenderPublicCal;

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
}
window.loadAdminCalendarPanel = loadAdminCalendarPanel;

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
