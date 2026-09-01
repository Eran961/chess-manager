// ===== CLUB TOURNAMENTS =====

let _tournaments = {};
let _tournamentSubTab = {};

const TOURNAMENT_TYPES = ['קצב מלא', 'אקטיבי', 'בזק'];
const EXPENSE_CATEGORIES = ['שופטים', 'כיבוד', 'גביעים', 'קרן פרסים', 'ציוד', 'הדפסות', 'שכירות', 'פרסום', 'אחר'];
const EXPENSE_ICONS = { 'שופטים':'⚖️', 'כיבוד':'🍫', 'גביעים':'🏆', 'קרן פרסים':'🥇', 'ציוד':'♟', 'הדפסות':'🖨', 'שכירות':'🏛', 'פרסום':'📢', 'אחר':'📌' };

async function loadTournaments() {
  if (!db) return;
  try {
    const snap = await db.ref('clubTournaments').get();
    _tournaments = snap.val() || {};
    renderTournamentsPanel();
  } catch(e) { console.error('loadTournaments:', e); }
}

function renderTournamentsPanel() {
  const el = document.getElementById('panel-club-tournaments');
  if (el) el.innerHTML = buildTournamentsHTML();
}

function getTournamentStatus(t) {
  const today = new Date().toISOString().split('T')[0];
  if (!t.startDate) return 'upcoming';
  if (today < t.startDate) return 'upcoming';
  if (today > (t.endDate||t.startDate)) return 'finished';
  return 'active';
}

function calcTournamentParticipants(t) {
  let total = 0;
  if (t.feeCategories) Object.values(t.feeCategories).forEach(c => total += c.count || 0);
  return total;
}

function calcTournamentIncome(t) {
  let total = 0;
  if (t.feeCategories) Object.values(t.feeCategories).forEach(c => total += (c.fee||0) * (c.count||0));
  if (t.income) Object.values(t.income).forEach(e => total += e.amount || 0);
  return total;
}

function calcTournamentExpenses(t) {
  let total = 0;
  if (t.expenses) Object.values(t.expenses).forEach(e => total += e.amount || 0);
  return total;
}

const TOURNAMENT_FORMATS = { single: 'חד יומית', weekly: 'שבועית' };

function formatTournamentDate(t, style) {
  if (!t.startDate) return style==='short' ? '' : '—';
  const opts = style==='short' ? {day:'numeric',month:'short'} : {day:'numeric',month:'long',year:'numeric'};
  const start = new Date(t.startDate+'T12:00:00').toLocaleDateString('he-IL',opts);
  if (!t.endDate || t.endDate === t.startDate) return start;
  const end = new Date(t.endDate+'T12:00:00').toLocaleDateString('he-IL',opts);
  return `${start} – ${end}`;
}

const TOURNAMENT_STATUS_META = {
  upcoming: { label: 'עתידי',   color: '#3b82f6' },
  active:   { label: 'פעיל',    color: '#4ade80' },
  finished: { label: 'הסתיים',  color: 'var(--text-muted)' },
};

function renderTournamentCard(id, t) {
  const participants = calcTournamentParticipants(t);
  const income = calcTournamentIncome(t);
  const expenses = calcTournamentExpenses(t);
  const balance = income - expenses;
  const sm = TOURNAMENT_STATUS_META[getTournamentStatus(t)];
  const date = formatTournamentDate(t);
  const balColor = balance >= 0 ? '#4ade80' : '#f87171';
  return `
    <div onclick="openTournamentDetail('${id}')" style="border:1px solid var(--border);border-radius:14px;padding:18px 22px;cursor:pointer;background:var(--bg-card);transition:transform .15s,box-shadow .15s"
      onmouseenter="this.style.boxShadow='0 6px 18px rgba(0,0,0,0.12)';this.style.transform='translateY(-2px)'" onmouseleave="this.style.boxShadow='';this.style.transform=''">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;gap:10px">
        <div style="min-width:0">
          <div style="font-size:16px;font-weight:800;color:var(--text-primary)">${t.name}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:3px">🗓 ${date}${t.format?' · '+TOURNAMENT_FORMATS[t.format]:''}${t.type?' · '+t.type:''}</div>
        </div>
        <span style="background:${sm.color}22;color:${sm.color};border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;white-space:nowrap">${sm.label}</span>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <span style="background:var(--bg-subtle);color:var(--text-muted);border-radius:8px;padding:4px 10px;font-size:12px;font-weight:600">👥 ${participants} משתתפים</span>
        ${income>0||expenses>0 ? `
          <span style="background:rgba(74,222,128,.14);color:#4ade80;border-radius:8px;padding:4px 10px;font-size:12px;font-weight:700">💰 ₪${income.toLocaleString()}</span>
          <span style="background:rgba(248,113,113,.14);color:#f87171;border-radius:8px;padding:4px 10px;font-size:12px;font-weight:700">📤 ₪${expenses.toLocaleString()}</span>
          <span style="background:${balColor}22;color:${balColor};border-radius:8px;padding:4px 10px;font-size:12px;font-weight:800">${balance>=0?'+':''}₪${balance.toLocaleString()}</span>` : ''}
      </div>
    </div>`;
}

const HEBREW_MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

function tournamentMonthLabel(monthKey, currentKey, nextKey) {
  if (monthKey === currentKey) return 'החודש';
  if (monthKey === nextKey) return 'חודש הבא';
  const [y, m] = monthKey.split('-').map(Number);
  return `${HEBREW_MONTHS[m-1]} ${y}`;
}

function buildTournamentsHTML() {
  const list = Object.entries(_tournaments);
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth()+1, 1);
  const nextKey = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth()+1).padStart(2,'0')}`;

  // Group by the month the tournament starts in
  const groups = {};
  list.forEach(([id, t]) => {
    const monthKey = t.startDate ? t.startDate.slice(0,7) : 'ללא תאריך';
    if (!groups[monthKey]) groups[monthKey] = [];
    groups[monthKey].push([id, t]);
  });

  // Current/future months first (chronological), then past months (most recent first)
  const monthKeys = Object.keys(groups).filter(k => k !== 'ללא תאריך');
  const futureKeys = monthKeys.filter(k => k >= currentKey).sort();
  const pastKeys = monthKeys.filter(k => k < currentKey).sort().reverse();
  const orderedKeys = [...futureKeys, ...pastKeys];
  if (groups['ללא תאריך']) orderedKeys.push('ללא תאריך');

  const sectionsHtml = orderedKeys.map(key => {
    const items = groups[key].sort((a,b) => (a[1].startDate||'').localeCompare(b[1].startDate||''));
    const label = key === 'ללא תאריך' ? 'ללא תאריך' : tournamentMonthLabel(key, currentKey, nextKey);
    return `
      <div style="margin-bottom:22px">
        <div style="font-size:13px;font-weight:800;color:var(--text-muted);margin-bottom:10px;padding-right:2px">${label}</div>
        <div style="display:flex;flex-direction:column;gap:12px">${items.map(([id,t]) => renderTournamentCard(id,t)).join('')}</div>
      </div>`;
  }).join('');

  return `
    <div style="max-width:760px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px">
        <div style="font-size:21px;font-weight:800;color:var(--text-primary)">🏆 תחרויות המועדון</div>
        <button onclick="openCreateTournamentModal()" style="background:#f97316;color:white;border:none;border-radius:8px;padding:10px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">➕ תחרות חדשה</button>
      </div>
      ${list.length===0 ? `<div style="text-align:center;color:var(--text-muted);padding:60px 20px">
        <div style="font-size:40px;margin-bottom:12px">🏆</div>
        <div style="font-size:15px">אין תחרויות עדיין — לחץ "תחרות חדשה"</div>
      </div>` : sectionsHtml}
    </div>`;
}

function openCreateTournamentModal() {
  const today = new Date().toISOString().split('T')[0];
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:440px">
        <div class="modal-header"><span class="modal-title">➕ תחרות חדשה</span>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div>
        <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:12px">
          <div class="modal-field"><label>שם התחרות <span style="color:#e53e3e">*</span></label>
            <input type="text" id="ct-name" placeholder='לדוגמה: אליפות ראשל"צ 2026' class="modal-input" autofocus></div>
          <div style="display:flex;gap:10px">
            <div class="modal-field" style="flex:1"><label>תאריך התחלה <span style="color:#e53e3e">*</span></label>
              <input type="date" id="ct-start-date" value="${today}" class="modal-input"></div>
            <div class="modal-field" style="flex:1"><label>תאריך סיום</label>
              <input type="date" id="ct-end-date" class="modal-input"></div>
          </div>
          <div style="display:flex;gap:10px">
            <div class="modal-field" style="flex:1"><label>סוג</label>
              <select id="ct-type" class="modal-input">${TOURNAMENT_TYPES.map(t=>`<option>${t}</option>`).join('')}</select></div>
            <div class="modal-field" style="flex:1"><label>מבנה</label>
              <select id="ct-format" class="modal-input">${Object.entries(TOURNAMENT_FORMATS).map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></div>
          </div>
          <div class="modal-field"><label>הערות</label>
            <textarea id="ct-notes" rows="2" class="modal-input" style="resize:vertical;font-family:inherit"></textarea></div>
          <button onclick="saveNewTournament()" style="background:#2b6cb0;color:white;border:none;border-radius:8px;padding:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">✅ צור תחרות</button>
        </div>
      </div>
    </div>`);
}
window.openCreateTournamentModal = openCreateTournamentModal;

async function saveNewTournament() {
  const name = document.getElementById('ct-name')?.value?.trim();
  const startDate = document.getElementById('ct-start-date')?.value;
  const endDate = document.getElementById('ct-end-date')?.value || startDate;
  if (!name) { showToast('יש להזין שם תחרות', 'error'); return; }
  if (!startDate) { showToast('יש לבחור תאריך התחלה', 'error'); return; }
  const data = { name, startDate, endDate,
    type: document.getElementById('ct-type')?.value||TOURNAMENT_TYPES[0],
    format: document.getElementById('ct-format')?.value||'single',
    notes: document.getElementById('ct-notes')?.value?.trim()||'',
    createdAt: new Date().toISOString() };
  try {
    const ref = await db.ref('clubTournaments').push(data);
    _tournaments[ref.key] = data;
    document.querySelector('.friday-modal')?.remove();
    showToast(`"${name}" נוצרה ✅`);
    renderTournamentsPanel();
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.saveNewTournament = saveNewTournament;

function openTournamentDetail(id) {
  const t = _tournaments[id];
  if (!t) return;
  if (!_tournamentSubTab[id]) _tournamentSubTab[id] = 'details';
  const sub = _tournamentSubTab[id];
  const income = calcTournamentIncome(t), expenses = calcTournamentExpenses(t);
  const tabs = [{key:'details',label:'📋 פרטים'},{key:'finance',label:'💰 כספים'}];
  const tabBar = tabs.map(tb => `
    <button onclick="switchTournamentTab('${id}','${tb.key}')"
      style="padding:12px 18px;border:none;background:none;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;border-bottom:3px solid ${sub===tb.key?'#f97316':'transparent'};color:${sub===tb.key?'#f97316':'#a0aec0'};margin-bottom:-2px;transition:color .15s">
      ${tb.label}</button>`).join('');
  const date = formatTournamentDate(t);
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="profile-modal-box" style="width:640px;max-width:calc(100vw - 24px)">
        <div style="background:linear-gradient(135deg,#1e3a5f,#0d2137);color:white;padding:20px 24px;border-radius:14px 14px 0 0;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:19px;font-weight:800">🏆 ${t.name}</div>
            <div style="font-size:12px;opacity:0.75;margin-top:3px">${date}${t.type?' · '+t.type:''}</div>
          </div>
          <button onclick="this.closest('.modal-overlay').remove()" style="background:rgba(255,255,255,0.15);border:none;color:white;border-radius:8px;padding:6px 12px;cursor:pointer;font-size:14px">✕</button>
        </div>
        <div style="border-bottom:1px solid #e2e8f0;padding:0 20px;display:flex;background:#fafbfc">${tabBar}</div>
        <div class="profile-modal-body" style="padding:22px;background:white" id="tournament-tab-content-${id}">
          ${sub==='details'?renderTournamentDetails(id,t):renderTournamentFinance(id,t,income,expenses,income-expenses)}
        </div>
      </div>
    </div>`);
}
window.openTournamentDetail = openTournamentDetail;

function switchTournamentTab(id, tab) {
  _tournamentSubTab[id] = tab;
  const t = _tournaments[id]; if (!t) return;
  const income = calcTournamentIncome(t), expenses = calcTournamentExpenses(t);
  const modal = document.querySelector('.friday-modal:last-of-type');
  if (modal) {
    modal.querySelectorAll('[onclick*="switchTournamentTab"]').forEach(btn => {
      const active = btn.getAttribute('onclick').includes(`'${tab}'`);
      btn.style.borderBottomColor = active ? '#f97316' : 'transparent';
      btn.style.color = active ? '#f97316' : '#a0aec0';
    });
  }
  const el = document.getElementById(`tournament-tab-content-${id}`);
  if (el) el.innerHTML = tab==='details'?renderTournamentDetails(id,t):renderTournamentFinance(id,t,income,expenses,income-expenses);
}
window.switchTournamentTab = switchTournamentTab;

function renderTournamentDetails(id, t) {
  const statusLabels = { upcoming:'🔵 עתידי', active:'🟢 פעיל', finished:'⚪ הסתיים' };
  return `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div class="modal-field" style="grid-column:1/-1"><label style="font-size:12px;color:#718096;font-weight:600">שם</label>
          <input type="text" id="te-name" value="${t.name||''}" class="modal-input"></div>
        <div class="modal-field"><label style="font-size:12px;color:#718096;font-weight:600">תאריך התחלה</label>
          <input type="date" id="te-start-date" value="${t.startDate||''}" class="modal-input"></div>
        <div class="modal-field"><label style="font-size:12px;color:#718096;font-weight:600">תאריך סיום</label>
          <input type="date" id="te-end-date" value="${t.endDate||''}" class="modal-input"></div>
        <div class="modal-field"><label style="font-size:12px;color:#718096;font-weight:600">סוג</label>
          <select id="te-type" class="modal-input">${TOURNAMENT_TYPES.map(tp=>`<option ${t.type===tp?'selected':''}>${tp}</option>`).join('')}</select></div>
        <div class="modal-field"><label style="font-size:12px;color:#718096;font-weight:600">מבנה</label>
          <select id="te-format" class="modal-input">${Object.entries(TOURNAMENT_FORMATS).map(([v,l])=>`<option value="${v}" ${(t.format||'single')===v?'selected':''}>${l}</option>`).join('')}</select></div>
        <div class="modal-field" style="grid-column:1/-1"><label style="font-size:12px;color:#718096;font-weight:600">סטטוס (אוטומטי לפי תאריכים)</label>
          <div style="padding:9px 12px;font-size:13px;font-weight:700">${statusLabels[getTournamentStatus(t)]}</div></div>
      </div>
      <div class="modal-field"><label style="font-size:12px;color:#718096;font-weight:600">הערות</label>
        <textarea id="te-notes" rows="3" class="modal-input" style="resize:vertical;font-family:inherit">${t.notes||''}</textarea></div>
      <div style="display:flex;gap:10px;padding-top:4px;border-top:1px solid #edf2f7">
        <button onclick="saveTournamentDetails('${id}')" style="background:#f97316;color:white;border:none;border-radius:8px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:14px">💾 שמור</button>
        <button onclick="deleteTournament('${id}')" style="background:#fff5f5;border:1px solid #fed7d7;border-radius:8px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;color:#c53030;margin-top:14px">🗑 מחק תחרות</button>
      </div>
    </div>`;
}

async function saveTournamentDetails(id) {
  const startDate = document.getElementById('te-start-date')?.value||_tournaments[id].startDate;
  const updates = { name: document.getElementById('te-name')?.value?.trim()||_tournaments[id].name,
    startDate,
    endDate: document.getElementById('te-end-date')?.value||startDate,
    type: document.getElementById('te-type')?.value||_tournaments[id].type,
    format: document.getElementById('te-format')?.value||_tournaments[id].format||'single',
    notes: document.getElementById('te-notes')?.value?.trim()||'' };
  try {
    await db.ref(`clubTournaments/${id}`).update(updates);
    Object.assign(_tournaments[id], updates);
    showToast('נשמר ✅');
    renderTournamentsPanel();
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.saveTournamentDetails = saveTournamentDetails;

async function deleteTournament(id) {
  if (!confirm('למחוק את התחרות לצמיתות?')) return;
  try {
    await db.ref(`clubTournaments/${id}`).remove();
    delete _tournaments[id];
    document.querySelector('.friday-modal')?.remove();
    showToast('התחרות נמחקה');
    renderTournamentsPanel();
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.deleteTournament = deleteTournament;

function renderTournamentFinance(id, t, income, expenses, balance) {
  const feeCategories = t.feeCategories ? Object.entries(t.feeCategories) : [];
  const entryFeeIncome = feeCategories.reduce((s,[,c]) => s + (c.fee||0)*(c.count||0), 0);
  const totalParticipants = feeCategories.reduce((s,[,c]) => s + (c.count||0), 0);
  const manualIncome = t.income ? Object.entries(t.income) : [];
  const expensesList = t.expenses ? Object.entries(t.expenses) : [];
  const balColor = balance >= 0 ? '#4ade80' : '#f87171';

  // Fee-category rows (label + fee + participant count, editable inline)
  const feeCategoryRows = feeCategories.map(([cid, c]) => `
    <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #edf2f7">
      <input type="text" value="${(c.label||'').replace(/"/g,'&quot;')}" onchange="updateFeeCategory('${id}','${cid}','label',this.value)"
        style="flex:2;min-width:0;border:1px solid transparent;background:none;font-size:13px;font-weight:600;color:#2d3748;padding:4px 6px;border-radius:6px;font-family:inherit" onfocus="this.style.borderColor='#e2e8f0'" onblur="this.style.borderColor='transparent'">
      <div style="display:flex;align-items:center;gap:3px;color:#718096;font-size:12px;flex-shrink:0">
        <input type="number" value="${c.fee||0}" min="0" onchange="updateFeeCategory('${id}','${cid}','fee',this.value)"
          style="width:56px;border:1px solid #e2e8f0;border-radius:6px;padding:4px 6px;font-size:13px;text-align:center;font-family:inherit">
        <span>₪ ×</span>
        <input type="number" value="${c.count||0}" min="0" onchange="updateFeeCategory('${id}','${cid}','count',this.value)"
          style="width:48px;border:1px solid #e2e8f0;border-radius:6px;padding:4px 6px;font-size:13px;text-align:center;font-family:inherit">
      </div>
      <span style="width:70px;text-align:left;font-size:13px;font-weight:700;color:#2f855a;flex-shrink:0">₪${((c.fee||0)*(c.count||0)).toLocaleString()}</span>
      <button onclick="deleteFeeCategory('${id}','${cid}')" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:14px;flex-shrink:0">✕</button>
    </div>`).join('');

  // Manual income entries
  const manualIncomeRows = manualIncome.map(([eid, e]) => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 12px;border-bottom:1px solid #edf2f7;font-size:13px">
      <span style="color:#4a5568">📌 ${e.description}</span>
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-weight:700;color:#2f855a">₪${(e.amount||0).toLocaleString()}</span>
        <button onclick="deleteTournamentEntry('${id}','income','${eid}')" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:13px" title="מחק">✕</button>
      </div>
    </div>`).join('');

  // Expenses grouped by category
  const byCategory = {};
  expensesList.forEach(([eid, e]) => {
    const cat = e.category || 'אחר';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push([eid, e]);
  });
  const expenseGroupsHTML = Object.entries(byCategory).map(([cat, entries]) => {
    const catTotal = entries.reduce((s, [,e]) => s + (e.amount || 0), 0);
    const icon = EXPENSE_ICONS[cat] || '📌';
    const rows = entries.map(([eid, e]) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 14px;font-size:13px;border-bottom:1px solid #f7fafc">
        <span style="color:#4a5568">${e.description}</span>
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-weight:700;color:#c53030">₪${(e.amount||0).toLocaleString()}</span>
          <button onclick="deleteTournamentEntry('${id}','expenses','${eid}')" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:13px" title="מחק">✕</button>
        </div>
      </div>`).join('');
    return `
      <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:10px;background:white">
        <div style="display:flex;justify-content:space-between;align-items:center;background:#fff5f5;padding:8px 14px;border-bottom:1px solid #fed7d7">
          <span style="font-size:13px;font-weight:700;color:#2d3748">${icon} ${cat}</span>
          <span style="font-size:13px;font-weight:800;color:#c53030">₪${catTotal.toLocaleString()}</span>
        </div>
        ${rows}
      </div>`;
  }).join('');

  const emptyRow = (text) => `<div style="color:#a0aec0;font-size:13px;padding:14px;text-align:center">${text}</div>`;

  return `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px">
      <div style="background:rgba(74,222,128,.1);border-radius:12px;padding:14px;text-align:center">
        <div style="font-size:11px;color:#2f855a;font-weight:700;margin-bottom:4px">הכנסות</div>
        <div style="font-size:22px;font-weight:800;color:#2f855a">₪${income.toLocaleString()}</div>
      </div>
      <div style="background:rgba(248,113,113,.1);border-radius:12px;padding:14px;text-align:center">
        <div style="font-size:11px;color:#c53030;font-weight:700;margin-bottom:4px">הוצאות</div>
        <div style="font-size:22px;font-weight:800;color:#c53030">₪${expenses.toLocaleString()}</div>
      </div>
      <div style="background:${balance>=0?'rgba(74,222,128,.1)':'rgba(248,113,113,.1)'};border-radius:12px;padding:14px;text-align:center">
        <div style="font-size:11px;color:${balance>=0?'#2f855a':'#c53030'};font-weight:700;margin-bottom:4px">יתרה</div>
        <div style="font-size:22px;font-weight:800;color:${balance>=0?'#2f855a':'#c53030'}">${balance>=0?'+':''}₪${balance.toLocaleString()}</div>
      </div>
    </div>

    <div style="background:#f8fafc;border:1px solid #edf2f7;border-radius:14px;padding:16px;margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <span style="font-size:14px;font-weight:800;color:#2f855a">🎟 קטגוריות תשלום</span>
        <span style="font-size:12px;font-weight:700;color:#2f855a;background:rgba(74,222,128,.15);padding:4px 10px;border-radius:20px">${totalParticipants} משתתפים · ₪${entryFeeIncome.toLocaleString()}</span>
      </div>
      <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:12px;background:white">
        ${feeCategoryRows || emptyRow('אין קטגוריות תשלום עדיין')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:10px">
        <div><div style="font-size:11px;color:#718096;font-weight:600;margin-bottom:4px">שם קטגוריה</div>
          <input type="text" id="new-fee-cat-label" placeholder='לדוגמה: בוגרים' class="modal-input" style="width:100%"></div>
        <div><div style="font-size:11px;color:#718096;font-weight:600;margin-bottom:4px">מחיר ₪</div>
          <input type="number" id="new-fee-cat-fee" placeholder="0" min="0" class="modal-input" style="width:100%"></div>
      </div>
      <button onclick="addFeeCategory('${id}')" style="width:100%;background:#2f855a;color:white;border:none;border-radius:7px;padding:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">+ הוסף קטגוריה</button>
    </div>

    <div style="background:#f8fafc;border:1px solid #edf2f7;border-radius:14px;padding:16px;margin-bottom:14px">
      <div style="font-size:14px;font-weight:800;color:#4a5568;margin-bottom:12px">📌 הכנסות נוספות (תרומות וכד׳)</div>
      <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:12px;background:white">
        ${manualIncomeRows || emptyRow('אין הכנסות נוספות')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:10px">
        <div><div style="font-size:11px;color:#718096;font-weight:600;margin-bottom:4px">תיאור</div>
          <input type="text" id="new-income-desc" placeholder="לדוגמה: תרומה" class="modal-input" style="width:100%"></div>
        <div><div style="font-size:11px;color:#718096;font-weight:600;margin-bottom:4px">סכום ₪</div>
          <input type="number" id="new-income-amount" placeholder="0" min="0" class="modal-input" style="width:100%"></div>
      </div>
      <button onclick="addTournamentEntry('${id}','income')" style="width:100%;background:#4a5568;color:white;border:none;border-radius:7px;padding:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">+ הוסף</button>
    </div>

    <div style="background:#f8fafc;border:1px solid #edf2f7;border-radius:14px;padding:16px">
      <div style="font-size:14px;font-weight:800;color:#c53030;margin-bottom:12px">📤 הוצאות</div>
      ${expenseGroupsHTML || `<div style="border:1px solid #e2e8f0;border-radius:10px;background:white;margin-bottom:12px">${emptyRow('אין הוצאות רשומות עדיין')}</div>`}
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-top:${expenseGroupsHTML?'12px':'0'};margin-bottom:10px">
        <div><div style="font-size:11px;color:#718096;font-weight:600;margin-bottom:4px">קטגוריה</div>
          <select id="new-expense-cat" class="modal-input" style="width:100%">
            ${EXPENSE_CATEGORIES.map(c=>`<option value="${c}">${EXPENSE_ICONS[c]||'📌'} ${c}</option>`).join('')}
          </select></div>
        <div><div style="font-size:11px;color:#718096;font-weight:600;margin-bottom:4px">תיאור</div>
          <input type="text" id="new-expense-desc" placeholder="פירוט (לדוגמה: שופט ראשי)" class="modal-input" style="width:100%"></div>
        <div><div style="font-size:11px;color:#718096;font-weight:600;margin-bottom:4px">סכום ₪</div>
          <input type="number" id="new-expense-amount" placeholder="0" min="0" class="modal-input" style="width:100%"></div>
      </div>
      <button onclick="addTournamentEntry('${id}','expenses')" style="width:100%;background:#c53030;color:white;border:none;border-radius:7px;padding:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">+ הוסף</button>
    </div>`;
}

async function updateFeeCategory(id, catId, field, value) {
  const t = _tournaments[id];
  if (field === 'label' && !value.trim()) {
    showToast('יש להזין שם קטגוריה', 'error');
    const inc = calcTournamentIncome(t), exp = calcTournamentExpenses(t);
    document.getElementById(`tournament-tab-content-${id}`).innerHTML = renderTournamentFinance(id,t,inc,exp,inc-exp);
    return;
  }
  const val = field === 'label' ? value.trim() : (parseFloat(value)||0);
  try {
    await db.ref(`clubTournaments/${id}/feeCategories/${catId}/${field}`).set(val);
    t.feeCategories[catId][field] = val;
    const inc = calcTournamentIncome(t), exp = calcTournamentExpenses(t);
    document.getElementById(`tournament-tab-content-${id}`).innerHTML = renderTournamentFinance(id,t,inc,exp,inc-exp);
    renderTournamentsPanel();
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.updateFeeCategory = updateFeeCategory;

async function addFeeCategory(id) {
  const label = document.getElementById('new-fee-cat-label')?.value?.trim();
  const fee = parseFloat(document.getElementById('new-fee-cat-fee')?.value)||0;
  if (!label) { showToast('יש להזין שם קטגוריה', 'error'); return; }
  try {
    const ref = await db.ref(`clubTournaments/${id}/feeCategories`).push({label, fee, count: 0});
    if (!_tournaments[id].feeCategories) _tournaments[id].feeCategories = {};
    _tournaments[id].feeCategories[ref.key] = {label, fee, count: 0};
    const t = _tournaments[id], inc = calcTournamentIncome(t), exp = calcTournamentExpenses(t);
    document.getElementById(`tournament-tab-content-${id}`).innerHTML = renderTournamentFinance(id,t,inc,exp,inc-exp);
    renderTournamentsPanel();
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.addFeeCategory = addFeeCategory;

async function deleteFeeCategory(id, catId) {
  try {
    await db.ref(`clubTournaments/${id}/feeCategories/${catId}`).remove();
    delete _tournaments[id].feeCategories[catId];
    const t = _tournaments[id], inc = calcTournamentIncome(t), exp = calcTournamentExpenses(t);
    document.getElementById(`tournament-tab-content-${id}`).innerHTML = renderTournamentFinance(id,t,inc,exp,inc-exp);
    renderTournamentsPanel();
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.deleteFeeCategory = deleteFeeCategory;

async function addTournamentEntry(id, type) {
  const isIncome = type==='income';
  const desc = document.getElementById(`new-${isIncome?'income':'expense'}-desc`)?.value?.trim();
  const amount = parseFloat(document.getElementById(`new-${isIncome?'income':'expense'}-amount`)?.value)||0;
  if (!desc) { showToast('יש להזין תיאור', 'error'); return; }
  if (!amount) { showToast('יש להזין סכום', 'error'); return; }
  const entry = {description:desc, amount, date:new Date().toISOString().split('T')[0]};
  if (!isIncome) entry.category = document.getElementById('new-expense-cat')?.value||'אחר';
  try {
    const ref = await db.ref(`clubTournaments/${id}/${type}`).push(entry);
    if (!_tournaments[id][type]) _tournaments[id][type] = {};
    _tournaments[id][type][ref.key] = entry;
    const t = _tournaments[id], inc = calcTournamentIncome(t), exp = calcTournamentExpenses(t);
    document.getElementById(`tournament-tab-content-${id}`).innerHTML = renderTournamentFinance(id,t,inc,exp,inc-exp);
    renderTournamentsPanel();
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.addTournamentEntry = addTournamentEntry;

async function deleteTournamentEntry(id, type, eid) {
  try {
    await db.ref(`clubTournaments/${id}/${type}/${eid}`).remove();
    delete _tournaments[id][type][eid];
    const t = _tournaments[id], inc = calcTournamentIncome(t), exp = calcTournamentExpenses(t);
    document.getElementById(`tournament-tab-content-${id}`).innerHTML = renderTournamentFinance(id,t,inc,exp,inc-exp);
    renderTournamentsPanel();
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.deleteTournamentEntry = deleteTournamentEntry;

async function toggleHistory(groupIdx) {
  const g = groups[groupIdx];
  const contentDiv = document.getElementById(`historyContent-${groupIdx}`);
  if (contentDiv.style.display !== 'none') { contentDiv.style.display = 'none'; return; }
  contentDiv.style.display = 'block';
  contentDiv.innerHTML = '<div style="padding:12px;color:#718096;font-size:13px">טוען...</div>';
  if (!db) { contentDiv.innerHTML = ''; return; }
  try {
    const entries = [];
    for (let si = 0; si < g.subGroups.length; si++) {
      const snap = await db.ref(`history/${g.id}/${si}`).get();
      if (snap.val()) Object.entries(snap.val()).forEach(([histKey, e]) =>
        entries.push({ ...e, histKey, si, subName: g.subGroups[si]?.time || '' })
      );
    }
    entries.sort((a,b) => b.timestamp - a.timestamp);
    if (entries.length === 0) {
      contentDiv.innerHTML = '<div style="padding:12px;color:#718096;font-size:13px;text-align:center">אין היסטוריה עדיין</div>';
      return;
    }
    const rows = entries.slice(0, 50).map(e => {
      const isLeft  = e.type === 'left' || e.type === 'removed';
      const icon    = isLeft ? '➖' : '➕';
      const color   = isLeft ? '#e53e3e' : '#276749';
      const label   = isLeft ? 'עזב/ה' : 'הצטרף/ה';
      const date    = new Date(e.timestamp).toLocaleDateString('he-IL');
      // Show restore button only for removed entries that have playerIdx
      const canRestore = isLeft && e.playerIdx != null;
      const restoreBtn = canRestore
        ? `<button onclick="restorePlayer(${groupIdx},${e.si ?? e.subGroupIdx ?? 0},${e.playerIdx},'${e.histKey}')"
             style="background:#ebf8ff;border:1px solid #bee3f8;color:#2b6cb0;border-radius:6px;padding:3px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">
             ↩ שחזר</button>`
        : '';
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 16px;border-bottom:1px solid #f0f4f8;font-size:13px">
          <span>${icon}</span>
          <span style="font-weight:600;color:${color}">${label}</span>
          <span style="flex:1">${e.playerName}${e.subName ? ' · '+e.subName : ''}</span>
          <span style="color:#718096;font-size:12px">${date}</span>
          ${restoreBtn}
        </div>`;
    }).join('');
    contentDiv.innerHTML = `<div style="background:white;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">${rows}</div>`;
  } catch(err) { console.error('toggleHistory:', err); contentDiv.innerHTML = ''; }
}
window.toggleHistory = toggleHistory;

async function restorePlayer(groupIdx, subGroupIdx, playerIdx, histKey) {
  const g = groups[groupIdx];
  if (!g) return;
  const player = g.subGroups[subGroupIdx]?.players[playerIdx];
  if (!player) { showToast('לא ניתן לשחזר — שחקן לא נמצא', 'error'); return; }
  const { first, last } = splitName(player.name);
  try {
    player.hidden = false;
    if (db) {
      await db.ref(`hidden_players/${g.id}/${subGroupIdx}/${playerIdx}`).remove();
      await db.ref(`history/${g.id}/${subGroupIdx}`).push({
        type: 'joined', playerName: `${last} ${first}`, timestamp: Date.now(),
        playerIdx, subGroupIdx, note: 'שוחזר'
      });
      logAudit('restore_player', g.id, g.name, `שוחזר: ${last} ${first}`);
    }
    const panelEl = document.getElementById('panel-' + g.id);
    if (panelEl) panelEl.innerHTML = renderGroup(g, groupIdx);
    showToast(`${first} ${last} שוחזר/ה ✅`);
    // Refresh history view
    const histDiv = document.getElementById(`historyContent-${groupIdx}`);
    if (histDiv) { histDiv.style.display = 'none'; toggleHistory(groupIdx); }
  } catch(e) {
    player.hidden = true;
    showToast('שגיאה בשחזור: ' + e.message, 'error');
  }
}
window.restorePlayer = restorePlayer;

function printTeamPlayerList(teamIdx, subTeamIdx) {
  const t = teams[teamIdx];
  const sg = t.subGroups[subTeamIdx];
  const label = sg.time ? `${t.name} · ${sg.time}` : t.name;
  const rows = sortedPlayers(sg.players).filter(({p}) => !p.hidden).map(({p}, num) => {
    const {first, last} = splitName(p.name);
    const age = p.birthYear ? `${p.birthYear} (גיל ${CURRENT_YEAR - p.birthYear})` : '—';
    const rating = p.rating || '—';
    return `<tr><td>${num+1}</td><td>${last}</td><td>${first}</td><td>${age}</td><td>${p.fedId ? `<a href="https://www.chess.org.il/Players/Player.aspx?Id=${p.fedId}" target="_blank" style="color:#2b6cb0">${p.fedId}</a>` : '—'}</td><td>${rating}</td></tr>`;
  }).join('');
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="UTF-8">
    <title>רשימת שחקנים — ${label}</title>
    <style>body{font-family:Arial,sans-serif;padding:24px;color:#1a1a2e}h2{font-size:18px;margin-bottom:4px}.sub{font-size:13px;color:#718096;margin-bottom:16px}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#2b6cb0;color:white;padding:8px 12px;text-align:right}td{padding:7px 12px;border-bottom:1px solid #e2e8f0}tr:nth-child(even) td{background:#f7fafc}</style>
    </head><body>
    <h2>רשימת שחקנים — ${label}</h2>
    <div class="sub">${new Date().toLocaleDateString('he-IL')} · ${sg.players.filter(p=>!p.hidden).length} שחקנים</div>
    <table><thead><tr><th>#</th><th>שם משפחה</th><th>שם פרטי</th><th>שנת לידה</th><th>מספר שחקן</th><th>מד כושר</th></tr></thead>
    <tbody>${rows}</tbody></table>
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}
window.printTeamPlayerList = printTeamPlayerList;

function printPlayerList(groupIdx, subGroupIdx) {
  const g = groups[groupIdx];
  const sg = g.subGroups[subGroupIdx];
  const label = sg.time ? `${g.name} · ${sg.time}` : g.name;
  const rows = sortedPlayers(sg.players).filter(({p}) => !p.hidden).map(({p}, num) => {
    const {first, last} = splitName(p.name);
    const age = p.birthYear ? `${p.birthYear} (גיל ${CURRENT_YEAR - p.birthYear})` : '—';
    const status = p.paymentStatus || 'trial';
    const statusLabel = {trial:'ניסיון', pending:'ממתין', paid:'שילם ✓'}[status];
    return `<tr><td>${num+1}</td><td>${last}</td><td>${first}</td><td>${age}</td><td>${p.fedId ? `<a href="https://www.chess.org.il/Players/Player.aspx?Id=${p.fedId}" target="_blank" style="color:#2b6cb0">${p.fedId}</a>` : '—'}</td><td>${statusLabel}</td></tr>`;
  }).join('');
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="UTF-8">
    <title>רשימת שחקנים — ${label}</title>
    <style>body{font-family:Arial,sans-serif;padding:24px;color:#1a1a2e}h2{font-size:18px;margin-bottom:4px}.sub{font-size:13px;color:#718096;margin-bottom:16px}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#2b6cb0;color:white;padding:8px 12px;text-align:right}td{padding:7px 12px;border-bottom:1px solid #e2e8f0}tr:nth-child(even) td{background:#f7fafc}
    /* ========/style>
    </head><body>
    <h2>רשימת שחקנים — ${label}</h2>
    <div class="sub">${new Date().toLocaleDateString('he-IL')} · ${sg.players.filter(p=>!p.hidden).length} שחקנים</div>
    <table><thead><tr><th>#</th><th>שם משפחה</th><th>שם פרטי</th><th>שנת לידה</th><th>מספר שחקן</th><th>תשלום</th></tr></thead>
    <tbody>${rows}</tbody></table>
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

// ===== SATURDAY LEAGUES (ליגות שבת) =====
// _satDates: cached match data per date, loaded from Firebase satDates/
// _satDates: { 'YYYY-MM-DD': { dateDisplay, matches: [...] } }
let _satDates = {};

const SAT_DIVISIONS = ['לאומית', 'עילית', 'ארצית', 'מחוזית', 'א', 'ב', 'ג'];
const SAT_DIV_COLORS = {
  'לאומית': { bg: '#fefcbf', border: '#d69e2e', text: '#744210' },
  'עילית':  { bg: '#ccfbf1', border: '#0d9488', text: '#134e4a' },
  'ארצית':  { bg: '#e9d8fd', border: '#805ad5', text: '#322659' },
  'מחוזית': { bg: '#fed7aa', border: '#c2410c', text: '#7c2d12' },
  'א':      { bg: '#bee3f8', border: '#3182ce', text: '#1a365d' },
  'ב':      { bg: '#c6f6d5', border: '#38a169', text: '#1c4532' },
  'ג':      { bg: '#feebc8', border: '#dd6b20', text: '#7b341e' },
};

// Returns the coming Saturday as YYYY-MM-DD
function nextSaturday() {
  const d = new Date();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
  return d.toISOString().split('T')[0];
}

async function loadSatSchedule() {
  try {
    const snap = await db.ref('satDates').get();
    _satDates = snap.val() || {};
  } catch(e) { console.error('loadSatSchedule:', e); }
  const el = document.getElementById('panel-saturday');
  if (el) { el.innerHTML = buildSatLeaguesHTML(); renderClubTeamsList(); }
}

async function syncSatDate() {
  const dateInput = document.getElementById('sat-date-picker');
  const targetDate = dateInput?.value;
  if (!targetDate) { showToast('יש לבחור תאריך', 'error'); return; }

  const teamsWithId = _clubTeams.filter(t => t.teamId);
  if (!teamsWithId.length) { showToast('יש לסנכרן קבוצות מהאיגוד תחילה', 'error'); return; }

  const [y, mo, d] = targetDate.split('-');
  const fedDate = `${d}/${mo}/${y}`;

  const btn = document.getElementById('btn-sync-date');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ בודק מטמון...'; }

  // ── 1. Load Firebase cache in ONE read ──────────────────────────────────────
  const CACHE_TTL_MS = 3 * 3600 * 1000; // 3 hours
  const now = Date.now();
  let allCache = {};
  try { const snap = await db.ref('teamRoundsCache').get(); allCache = snap.val() || {}; } catch(e) {}

  // ── 2. Split: fresh (local filter) vs stale (need backend) ─────────────────
  const allMatches = [];
  const teamStatuses = {};
  const staleTeams = [];

  for (const team of teamsWithId) {
    const cached = allCache[team.teamId];
    if (cached && (now - (cached.ts || 0)) < CACHE_TTL_MS) {
      const matches = (cached.rounds || []).filter(r => r.matchDate === fedDate);
      teamStatuses[team.name] = matches.length > 0 ? 'ok' : 'nodate';
      allMatches.push(...matches);
    } else {
      staleTeams.push(team);
    }
  }

  // ── 3. Fetch only stale teams from backend ──────────────────────────────────
  if (staleTeams.length > 0) {
    if (btn) btn.textContent = `⏳ 0/${staleTeams.length}`;
    let completed = 0;
    const newRoundsCache = {}; // batch Firebase writes

    try {
      const res = await fetch('https://chess-manager-7wkr.onrender.com/api/team-rounds-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teams: staleTeams }),
        signal: AbortSignal.timeout(120000),
      });
      if (!res.ok) throw new Error(`שגיאת שרת ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop();
        for (const event of events) {
          if (!event.startsWith('data: ')) continue;
          const data = JSON.parse(event.slice(6));
          if (data.done) break;
          completed++;
          if (btn) btn.textContent = `⏳ ${completed}/${staleTeams.length}`;
          const team = staleTeams.find(t => t.name === data.teamName);
          if (team && data.status !== 'fail') {
            newRoundsCache[team.teamId] = { rounds: data.rounds || [], ts: now };
          }
          const matches = (data.rounds || []).filter(r => r.matchDate === fedDate);
          teamStatuses[data.teamName] = data.status === 'fail' ? 'fail' : (matches.length ? 'ok' : 'nodate');
          allMatches.push(...matches);
        }
      }
    } catch(e) {
      if (btn) { btn.disabled = false; btn.textContent = '📥 טען'; }
      showToast('❌ שגיאה: ' + e.message, 'error'); return;
    }

    // Batch-write new rounds to Firebase cache
    if (Object.keys(newRoundsCache).length) {
      try { await db.ref('teamRoundsCache').update(newRoundsCache); } catch(e) {}
    }
  }

  // ── 4. Show results ─────────────────────────────────────────────────────────
  if (btn) { btn.disabled = false; btn.textContent = '📥 טען'; }

  const ok     = Object.entries(teamStatuses).filter(([,v])=>v==='ok').map(([k])=>k);
  const noDate = Object.entries(teamStatuses).filter(([,v])=>v==='nodate').map(([k])=>k);
  const failed = Object.entries(teamStatuses).filter(([,v])=>v==='fail').map(([k])=>k);
  const fromCache = teamsWithId.length - staleTeams.length;
  const lines = [];
  if (fromCache > 0) lines.push(`⚡ ${fromCache} קבוצות ממטמון`);
  if (ok.length)     lines.push(`✅ נטענו: ${ok.join(', ')}`);
  if (noDate.length) lines.push(`📅 אין משחק: ${noDate.length} קבוצות`);
  if (failed.length) lines.push(`❌ נכשל: ${failed.join(', ')}`);

  const dateDisplay = new Date(targetDate + 'T12:00:00')
    .toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  lines.unshift(allMatches.length > 0 ? `📋 נמצאו ${allMatches.length} משחקים` : '📋 לא נמצאו משחקים');
  showToast(lines.join('\n'), allMatches.length > 0 ? 'success' : 'error');
  if (!allMatches.length) return;

  _satDates[targetDate] = { dateDisplay, matches: allMatches };
  await db.ref(`satDates/${targetDate}`).set({ dateDisplay, matches: allMatches });
  showToast(`נטענו ${allMatches.length} משחקים לתאריך ${dateDisplay}`, 'success');

  const el = document.getElementById('panel-saturday');
  if (el) { el.innerHTML = buildSatLeaguesHTML(); renderClubTeamsList(); }
}
window.syncSatDate = syncSatDate;

async function deleteSatDate(dateKey) {
  delete _satDates[dateKey];
  await db.ref(`satDates/${dateKey}`).remove();
  const el = document.getElementById('panel-saturday');
  if (el) { el.innerHTML = buildSatLeaguesHTML(); renderClubTeamsList(); }
}
window.deleteSatDate = deleteSatDate;

function openMatchEditModal(dateKey, matchIdx) {
  const match = _satDates[dateKey]?.matches?.[matchIdx];
  if (!match) return;
  const c = SAT_DIV_COLORS[match.division] || { bg: '#f7fafc', border: '#a0aec0', text: '#4a5568' };
  const curTime = match.timeSlot || '10:00';
  const curBoard = match.boardNumber ?? '';
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:360px">
        <div class="modal-header">
          <span class="modal-title">✏️ עריכת משחק</span>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:16px">
          <div style="background:#f7fafc;border-radius:10px;padding:12px 14px;border-right:4px solid ${c.border}">
            <div style="font-size:11px;font-weight:700;color:${c.text};margin-bottom:6px">
              ${match.type || ''} — ליגה ${match.division || ''}
            </div>
            <div style="font-size:13px;font-weight:700;color:#2d3748;margin-bottom:3px">🖤 ${match.homeTeam}</div>
            <div style="font-size:13px;font-weight:700;color:#2d3748">⬜ ${match.awayTeam}</div>
          </div>
          <div class="modal-field">
            <label style="font-weight:700;font-size:13px;color:#4a5568">מספר לוח</label>
            <input type="number" id="edit-match-board" min="1" value="${curBoard}"
              placeholder="מספר לוח"
              style="margin-top:6px;padding:10px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:16px;font-weight:700;text-align:center;width:100%;font-family:inherit;color:#1a2744">
          </div>
          <div class="modal-field">
            <label style="font-weight:700;font-size:13px;color:#4a5568;display:block;margin-bottom:8px">שעת המשחק</label>
            <div style="display:flex;gap:10px">
              <button id="time-btn-10" onclick="selectMatchTime('10:00')"
                style="flex:1;padding:10px;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;border:2px solid ${curTime==='10:00'?'#2b6cb0':'#e2e8f0'};background:${curTime==='10:00'?'#ebf8ff':'white'};color:${curTime==='10:00'?'#2b6cb0':'#718096'}">
                ⏰ 10:00</button>
              <button id="time-btn-15" onclick="selectMatchTime('15:00')"
                style="flex:1;padding:10px;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;border:2px solid ${curTime==='15:00'?'#2b6cb0':'#e2e8f0'};background:${curTime==='15:00'?'#ebf8ff':'white'};color:${curTime==='15:00'?'#2b6cb0':'#718096'}">
                ⏰ 15:00</button>
            </div>
          </div>
          <button onclick="saveMatchEdit('${dateKey}',${matchIdx})"
            style="background:#2b6cb0;color:white;border:none;border-radius:8px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">
            ✅ שמור שינויים</button>
        </div>
      </div>
    </div>`);
  document.getElementById('edit-match-board').focus();
}
window.openMatchEditModal = openMatchEditModal;

let _editSelectedTime = null;
function selectMatchTime(t) {
  _editSelectedTime = t;
  ['10:00','15:00'].forEach(s => {
    const btn = document.getElementById(`time-btn-${s.replace(':','')}`);
    if (!btn) return;
    const active = s === t;
    btn.style.borderColor   = active ? '#2b6cb0' : '#e2e8f0';
    btn.style.background    = active ? '#ebf8ff' : 'white';
    btn.style.color         = active ? '#2b6cb0' : '#718096';
  });
}
window.selectMatchTime = selectMatchTime;

async function saveMatchEdit(dateKey, matchIdx) {
  const match = _satDates[dateKey]?.matches?.[matchIdx];
  if (!match) return;
  const boardVal = parseInt(document.getElementById('edit-match-board')?.value) || null;
  const timeVal  = _editSelectedTime || match.timeSlot || '10:00';
  match.boardNumber = boardVal;
  match.timeSlot    = timeVal;
  _editSelectedTime = null;
  await db.ref(`satDates/${dateKey}/matches/${matchIdx}`).update({ boardNumber: boardVal, timeSlot: timeVal });
  document.querySelector('.friday-modal')?.remove();
  const el = document.getElementById('panel-saturday');
  if (el) { el.innerHTML = buildSatLeaguesHTML(); renderClubTeamsList(); }
}
window.saveMatchEdit = saveMatchEdit;

// ===== AUDIT LOG =====
const AUDIT_LABELS = {
  add_player:        { label: 'הוספת שחקן',    color: '#276749', bg: '#f0fff4', icon: '➕' },
  remove_player:     { label: 'הסרת שחקן',     color: '#c53030', bg: '#fff5f5', icon: '➖' },
  restore_player:    { label: 'שחזור שחקן',    color: '#2b6cb0', bg: '#ebf8ff', icon: '↩' },
  transfer_player:   { label: 'העברת שחקן',    color: '#744210', bg: '#fffaf0', icon: '↔' },
  update_player:     { label: 'עדכון נתונים',  color: '#553c9a', bg: '#faf5ff', icon: '✏️' },
  update_attendance: { label: 'עדכון נוכחות',  color: '#086f83', bg: '#e3fafc', icon: '📋' },
};

async function logAudit(action, groupId, groupName, details) {
  if (!db || !currentUser) return;
  try {
    await db.ref('auditLog').push({
      ts: Date.now(),
      uid:       currentUser.uid,
      name:      currentUser.name  || currentUser.email || 'לא ידוע',
      action,
      groupId:   groupId   || '',
      groupName: groupName || '',
      details:   details   || '',
    });
  } catch(e) { console.warn('logAudit failed:', e.message); }
}

async function loadAuditLog() {
  const el = document.getElementById('panel-audit');
  if (!el) return;
  el.innerHTML = buildAuditPanelHTML([], true);
  try {
    const snap = await db.ref('auditLog').orderByChild('ts').limitToLast(300).get();
    const raw = snap.val() || {};
    const entries = Object.values(raw).sort((a, b) => b.ts - a.ts);
    el.innerHTML = buildAuditPanelHTML(entries, false);
  } catch(e) { el.innerHTML = `<div style="padding:24px;color:#c53030">שגיאה: ${e.message}</div>`; }
}
window.loadAuditLog = loadAuditLog;

async function loadAuditWidget() {
  if (currentUser?.role !== 'admin') return;
  const el = document.getElementById('dash-audit-rows');
  if (!el) return;
  try {
    const snap = await db.ref('auditLog').orderByChild('ts').limitToLast(6).get();
    const raw = snap.val() || {};
    const entries = Object.values(raw).sort((a, b) => b.ts - a.ts).slice(0, 6);
    if (!entries.length) {
      el.innerHTML = '<div style="color:#a0aec0;font-size:13px;padding:10px 0">אין פעילות עדיין</div>';
      return;
    }
    const now = Date.now();
    el.innerHTML = entries.map(e => {
      const meta = AUDIT_LABELS[e.action] || { label: e.action, color: '#718096', bg: '#f7fafc', icon: '•' };
      const diff = now - e.ts;
      const mins = Math.floor(diff / 60000);
      const hrs  = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      const ago  = days > 0 ? `לפני ${days} יום${days > 1 ? 'ות' : ''}`
                 : hrs  > 0 ? `לפני ${hrs} שעה${hrs > 1 ? 'ות' : ''}`
                 : mins > 0 ? `לפני ${mins} דק'`
                 : 'כרגע';
      const detail = e.details ? ` · ${e.details}` : '';
      return `<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f0f4f8">
        <div style="width:30px;height:30px;border-radius:50%;background:${meta.bg};display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0">${meta.icon}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:700;color:#2d3748">${e.name}</div>
          <div style="font-size:12px;color:#718096;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${meta.label}${detail}</div>
        </div>
        <div style="font-size:11px;color:#a0aec0;flex-shrink:0;white-space:nowrap">${ago}</div>
      </div>`;
    }).join('');
  } catch(err) {
    const el2 = document.getElementById('dash-audit-rows');
    if (el2) el2.innerHTML = '<div style="color:#c53030;font-size:12px;padding:10px 0">שגיאה בטעינה</div>';
  }
}
window.loadAuditWidget = loadAuditWidget;

function buildAuditPanelHTML(entries, loading) {
  const instructors = [...new Set(entries.map(e => e.name))].sort();
  const instrOpts = instructors.map(n => `<option value="${n}">${n}</option>`).join('');
  const actionOpts = Object.entries(AUDIT_LABELS).map(([k,v]) =>
    `<option value="${k}">${v.icon} ${v.label}</option>`).join('');

  const rows = loading
    ? `<tr><td colspan="5" style="text-align:center;padding:32px;color:#a0aec0">⏳ טוען...</td></tr>`
    : entries.length === 0
    ? `<tr><td colspan="5" style="text-align:center;padding:32px;color:#a0aec0">אין רשומות עדיין</td></tr>`
    : entries.map(e => {
        const meta = AUDIT_LABELS[e.action] || { label: e.action, color: '#718096', bg: '#f7fafc', icon: '•' };
        const d = new Date(e.ts);
        const dateStr = d.toLocaleDateString('he-IL');
        const timeStr = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
        return `
          <tr class="audit-row" data-instructor="${e.name||''}" data-action="${e.action||''}">
            <td style="padding:9px 12px;white-space:nowrap;font-size:12px;color:#718096">${dateStr}<br><span style="font-size:11px">${timeStr}</span></td>
            <td style="padding:9px 12px;font-size:13px;font-weight:600;color:#2d3748">${e.name||'—'}</td>
            <td style="padding:9px 8px">
              <span style="background:${meta.bg};color:${meta.color};border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;white-space:nowrap">${meta.icon} ${meta.label}</span>
            </td>
            <td style="padding:9px 12px;font-size:13px;color:#4a5568">${e.groupName||'—'}</td>
            <td style="padding:9px 12px;font-size:13px;color:#4a5568">${e.details||''}</td>
          </tr>`;
      }).join('');

  return `
    <div style="max-width:960px">
      <div style="font-size:20px;font-weight:800;color:#2d3748;margin-bottom:16px">📊 פעילות מדריכים</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;align-items:center">
        <select id="audit-filter-inst" onchange="filterAudit()" class="modal-input" style="min-width:160px">
          <option value="">כל המדריכים</option>${instrOpts}
        </select>
        <select id="audit-filter-action" onchange="filterAudit()" class="modal-input" style="min-width:160px">
          <option value="">כל הפעולות</option>${actionOpts}
        </select>
        <button onclick="loadAuditLog()" style="background:#e2e8f0;border:none;border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">🔄 רענן</button>
        <span style="font-size:12px;color:#a0aec0;margin-right:auto">${entries.length} רשומות אחרונות</span>
      </div>
      <div style="overflow-x:auto;border-radius:10px;border:1px solid #e2e8f0;background:white">
        <table style="width:100%;border-collapse:collapse;font-size:13px;min-width:600px">
          <thead>
            <tr style="background:#f7fafc;border-bottom:2px solid #e2e8f0">
              <th style="padding:10px 12px;text-align:right;font-size:12px;color:#718096;font-weight:700">תאריך ושעה</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;color:#718096;font-weight:700">מדריך</th>
              <th style="padding:10px 8px;text-align:right;font-size:12px;color:#718096;font-weight:700">פעולה</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;color:#718096;font-weight:700">חוג</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;color:#718096;font-weight:700">פרטים</th>
            </tr>
          </thead>
          <tbody id="audit-tbody">${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function filterAudit() {
  const inst   = document.getElementById('audit-filter-inst')?.value   || '';
  const action = document.getElementById('audit-filter-action')?.value || '';
  document.querySelectorAll('.audit-row').forEach(row => {
    const show = (!inst   || row.dataset.instructor === inst)
              && (!action || row.dataset.action     === action);
    row.style.display = show ? '' : 'none';
  });
}
window.filterAudit = filterAudit;

function openFullscreenSlot(dateKey, slotTime) {
  const group = _satDates[dateKey];
  if (!group) return;
  const slotMatches = (group.matches || [])
    .filter(m => (m.timeSlot || '10:00') === slotTime)
    .sort((a, b) => (a.boardNumber ?? 999) - (b.boardNumber ?? 999));

  const DIV_ACCENT = {
    'לאומית': '#d69e2e', 'עילית': '#2dd4bf', 'ארצית': '#805ad5', 'מחוזית': '#fb923c',
    'א': '#3182ce', 'ב': '#38a169', 'ג': '#dd6b20'
  };
  const typeIcon = { 'בוגרים':'♟', 'נשים':'♛', 'נוער':'🎓' };

  const cards = slotMatches.map((m, i) => {
    const boardNum  = m.boardNumber ?? (i + 1);
    const accent    = DIV_ACCENT[m.division] || '#718096';
    const icon      = typeIcon[m.type] || '🏅';
    const divLabel  = `${icon} ליגה ${m.division || ''}`;
    const hasScore  = m.isPlayed;
    const scoreHTML = hasScore
      ? `<div style="font-size:28px;font-weight:900;color:#68d391;letter-spacing:1px;line-height:1">${m.homeScore}–${m.awayScore}</div>`
      : `<div style="font-size:15px;font-weight:600;color:rgba(255,255,255,0.25);letter-spacing:2px">נ.ש</div>`;
    return `
      <div style="display:grid;grid-template-columns:64px 120px 1fr auto 1fr;align-items:center;gap:0;background:rgba(255,255,255,0.04);border-radius:12px;border-right:4px solid ${accent};margin-bottom:8px;overflow:hidden">
        <div style="padding:18px 8px;text-align:center;border-left:1px solid rgba(255,255,255,0.06)">
          <div style="width:42px;height:42px;border-radius:50%;background:rgba(99,179,237,0.15);border:2px solid rgba(99,179,237,0.35);display:flex;align-items:center;justify-content:center;margin:0 auto;font-size:20px;font-weight:900;color:#63b3ed">${boardNum}</div>
        </div>
        <div style="padding:18px 12px;border-left:1px solid rgba(255,255,255,0.06)">
          <span style="display:inline-block;background:${accent}22;border:1.5px solid ${accent}88;color:${accent};border-radius:20px;padding:4px 12px;font-size:12px;font-weight:800;white-space:nowrap">${divLabel}</span>
        </div>
        <div style="padding:18px 20px;text-align:right;font-size:19px;font-weight:700;color:white;line-height:1.3">${m.homeTeam}</div>
        <div style="padding:18px 16px;text-align:center;min-width:96px;border-right:1px solid rgba(255,255,255,0.06);border-left:1px solid rgba(255,255,255,0.06)">${scoreHTML}</div>
        <div style="padding:18px 20px;text-align:right;font-size:19px;font-weight:700;color:rgba(255,255,255,0.75);line-height:1.3">${m.awayTeam}</div>
      </div>`;
  }).join('');

  document.body.insertAdjacentHTML('beforeend', `
    <div id="sat-fullscreen" tabindex="0"
         style="position:fixed;inset:0;z-index:9999;background:linear-gradient(160deg,#090f1e 0%,#0d1f3c 100%);color:white;overflow-y:auto;font-family:inherit;outline:none"
         onkeydown="if(event.key==='Escape')closeSatFullscreen()">
      <div style="max-width:1140px;margin:0 auto;padding:28px 32px 48px;position:relative">

        <button onclick="closeSatFullscreen()"
          style="position:absolute;top:0;left:0;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.7);border-radius:8px;padding:7px 16px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;transition:background .15s"
          onmouseenter="this.style.background='rgba(255,255,255,0.15)'" onmouseleave="this.style.background='rgba(255,255,255,0.08)'">
          ✕ סגור
        </button>

        <div style="text-align:center;padding:8px 0 32px">
          <div style="font-size:12px;letter-spacing:4px;color:rgba(255,255,255,0.3);margin-bottom:10px">מועדון השחמט ראשון לציון</div>
          <div style="font-size:30px;font-weight:800;color:white;margin-bottom:14px">${group.dateDisplay}</div>
          <div style="display:inline-flex;align-items:center;gap:12px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:50px;padding:10px 28px">
            <span style="font-size:32px;font-weight:900;letter-spacing:1px">⏰ ${slotTime}</span>
            <span style="width:1px;height:24px;background:rgba(255,255,255,0.15);display:inline-block"></span>
            <span style="font-size:15px;color:rgba(255,255,255,0.45)">${slotMatches.length} משחקים</span>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:64px 120px 1fr auto 1fr;gap:0;padding:8px 0 4px;margin-bottom:6px">
          <div></div><div></div>
          <div style="padding:0 20px;text-align:right;font-size:11px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.35);text-transform:uppercase">🖤 מארחת — שחור בלוח 1</div>
          <div style="min-width:96px;text-align:center;font-size:11px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.35);text-transform:uppercase">תוצאה</div>
          <div style="padding:0 20px;text-align:right;font-size:11px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.35);text-transform:uppercase">⬜ אורחת — לבן בלוח 1</div>
        </div>

        ${cards}
      </div>
    </div>`);
  document.getElementById('sat-fullscreen')?.focus();
}
window.openFullscreenSlot = openFullscreenSlot;

function closeSatFullscreen() {
  document.getElementById('sat-fullscreen')?.remove();
}
window.closeSatFullscreen = closeSatFullscreen;

function buildSatLeaguesHTML() {
  const today = new Date().toISOString().split('T')[0];
  const defDate = nextSaturday();

  const divSortIndex = d => {
    if (!d) return 99;
    const exact = SAT_DIVISIONS.indexOf(d.trim());
    if (exact !== -1) return exact;
    // Partial match for values like 'ליגה לאומית' or extra whitespace
    for (let i = 0; i < SAT_DIVISIONS.length; i++) {
      if (d.includes(SAT_DIVISIONS[i]) || SAT_DIVISIONS[i].includes(d.trim())) return i;
    }
    return 99;
  };
  const TYPE_ORDER = ['בוגרים', 'נשים', 'נוער'];
  const typeIdx = t => { const i = TYPE_ORDER.indexOf(t); return i === -1 ? 99 : i; };

  function renderTimeSlot(dateKey, slotMatches, slotTime, allMatches) {
    const sorted = [...slotMatches].sort((a, b) => (a.boardNumber ?? 999) - (b.boardNumber ?? 999));
    const rows = sorted.map((m, i) => {
      const c = SAT_DIV_COLORS[m.division] || { bg: '#f7fafc', border: '#a0aec0', text: '#4a5568' };
      const typeIcon = { 'בוגרים':'♟', 'נשים':'♛', 'נוער':'🎓' }[m.type] || '🏅';
      let scoreCell;
      if (m.isPlayed) {
        scoreCell = `<strong style="font-size:16px;color:#1a2744;letter-spacing:.5px">${m.homeScore}–${m.awayScore}</strong>`;
      } else {
        // Determine if match date is in the future or past
        const [dd, mm, yyyy] = (m.matchDate || '').split('/');
        const matchIso = yyyy ? `${yyyy}-${mm}-${dd}` : '';
        const isPast = matchIso && matchIso < new Date().toISOString().split('T')[0];
        scoreCell = isPast
          ? `<span style="background:#fff5f5;color:#c53030;border:1px solid #fed7d7;border-radius:6px;padding:3px 7px;font-size:10px;font-weight:700;white-space:nowrap">טרם הוזנה תוצאה</span>`
          : `<span style="background:#fffff0;color:#b7791f;border:1px solid #fefcbf;border-radius:6px;padding:3px 7px;font-size:10px;font-weight:700;white-space:nowrap">טרם שוחק</span>`;
      }
      const globalIdx = allMatches.findIndex(x => x === m);
      const boardNum  = m.boardNumber ?? (i + 1);
      return `<tr style="background:${i%2===0?'white':'#fafbfc'};cursor:pointer"
          onclick="openMatchEditModal('${dateKey}',${globalIdx})"
          onmouseenter="this.style.background='#f0f7ff'" onmouseleave="this.style.background='${i%2===0?'white':'#fafbfc'}'">
        <td style="text-align:center;width:52px;padding:12px 6px">
          <span style="font-size:16px;font-weight:900;color:#2b6cb0">${boardNum}</span>
        </td>
        <td style="width:130px;padding:12px 8px">
          <span class="sat-div-badge" style="background:${c.bg};border-color:${c.border};color:${c.text};font-size:11px;white-space:nowrap">
            ${typeIcon} ${m.division||''}
          </span>
        </td>
        <td style="padding:12px 14px;font-weight:600;color:#2d3748;font-size:13px">${m.homeTeam}</td>
        <td style="text-align:center;width:80px;padding:12px 6px">${scoreCell}</td>
        <td style="padding:12px 14px;font-weight:600;color:#2d3748;font-size:13px">${m.awayTeam}</td>
      </tr>`;
    }).join('');

    return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px 8px;background:#2d3748;border-top:1px solid rgba(255,255,255,0.08)">
        <div>
          <span style="font-size:22px;font-weight:900;color:white;letter-spacing:1px">⏰ ${slotTime}</span>
          <span style="font-size:12px;color:rgba(255,255,255,0.5);margin-right:10px">${slotMatches.length} משחקים</span>
        </div>
        <button onclick="openFullscreenSlot('${dateKey}','${slotTime}')"
          style="background:rgba(255,255,255,0.12);border:1.5px solid rgba(255,255,255,0.25);color:white;border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit"
          title="תצוגת מסך מלאה">⛶ מסך מלא</button>
      </div>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:13px;min-width:500px">
          <thead>
            <tr style="background:#edf2f7;border-bottom:2px solid #e2e8f0">
              <th style="padding:8px 6px;text-align:center;color:#718096;font-size:11px;font-weight:700;width:52px">לוח</th>
              <th style="padding:8px 6px;text-align:right;color:#718096;font-size:11px;font-weight:700;width:130px">ליגה</th>
              <th style="padding:8px 14px;text-align:right;color:#4a5568;font-size:12px;font-weight:700">🖤 מארחת — שחור בלוח 1</th>
              <th style="padding:8px 6px;text-align:center;color:#718096;font-size:11px;font-weight:700;width:80px">תוצאה</th>
              <th style="padding:8px 14px;text-align:right;color:#4a5568;font-size:12px;font-weight:700">⬜ אורחת — לבן בלוח 1</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  const sorted = Object.entries(_satDates).sort((a, b) => a[0].localeCompare(b[0]));
  const upcoming = sorted.filter(([d]) => d >= today);
  const past     = sorted.filter(([d]) => d <  today).reverse();

  function renderDateCard([dateKey, group]) {
    const allMatches = [...group.matches]
      .sort((a,b) => divSortIndex(a.division) - divSortIndex(b.division) || typeIdx(a.type) - typeIdx(b.type));

    const slot10 = allMatches.filter(m => (m.timeSlot || '10:00') === '10:00');
    const slot15 = allMatches.filter(m => m.timeSlot === '15:00');

    const totalRounds = [...new Set(allMatches.map(m=>m.roundNumber).filter(Boolean))];
    const roundLabel = totalRounds.length === 1 ? `סיבוב ${totalRounds[0]}` : '';

    return `
      <div class="sat-round-card" style="margin-bottom:24px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#0d1f3c,#1a4a8a);padding:22px 20px 20px;text-align:center;position:relative">
          <button class="btn-sat-sm" onclick="deleteSatDate('${dateKey}')"
            style="position:absolute;left:14px;top:14px;opacity:.55;font-size:13px" title="מחק תאריך">🗑</button>
          <div style="font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">יום משחקים</div>
          <div style="font-size:26px;font-weight:900;color:white;letter-spacing:.5px">${group.dateDisplay}</div>
          <div style="margin-top:8px;display:flex;justify-content:center;gap:16px">
            <span style="background:rgba(255,255,255,0.12);border-radius:20px;padding:3px 14px;font-size:12px;color:rgba(255,255,255,0.8);font-weight:600">
              ${group.matches.length} משחקים
            </span>
            ${roundLabel ? `<span style="background:rgba(255,255,255,0.12);border-radius:20px;padding:3px 14px;font-size:12px;color:rgba(255,255,255,0.8);font-weight:600">${roundLabel}</span>` : ''}
          </div>
        </div>
        ${slot10.length ? renderTimeSlot(dateKey, slot10, '10:00', allMatches) : ''}
        ${slot15.length ? renderTimeSlot(dateKey, slot15, '15:00', allMatches) : ''}
      </div>`;
  }

  const upcomingHTML = upcoming.length
    ? `<div style="font-size:11px;font-weight:700;color:#276749;letter-spacing:.8px;text-transform:uppercase;margin-bottom:10px">⏳ קרובים</div>
       ${upcoming.map(renderDateCard).join('')}`
    : '';
  const pastHTML = past.length
    ? `<div style="font-size:11px;font-weight:700;color:#718096;letter-spacing:.8px;text-transform:uppercase;margin:20px 0 10px">✅ תוצאות</div>
       ${past.map(renderDateCard).join('')}`
    : '';
  const emptyState = !upcoming.length && !past.length
    ? `<div style="text-align:center;color:#a0aec0;padding:32px 20px">
        <div style="font-size:40px;margin-bottom:10px">♟</div>
        <div style="font-size:14px">בחר תאריך ולחץ "טען" לשליפת המשחקים מהאיגוד</div>
      </div>`
    : '';

  return `
    <div class="sat-panel">
      <div style="margin-bottom:20px">
        <div style="font-size:20px;font-weight:800;color:#2d3748;margin-bottom:14px">🏅 ליגות שבת</div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <input type="date" id="sat-date-picker" value="${defDate}"
            style="padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit;color:#2d3748">
          <button id="btn-sync-date" onclick="syncSatDate()" class="btn-sat-add">📥 טען</button>
        </div>
      </div>
      ${emptyState}${upcomingHTML}${pastHTML}
    </div>`;
}


