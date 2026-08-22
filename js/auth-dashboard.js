// ===== —BOARD =====
function renderDashboard(missingAtt = { groups: [], teams: [] }) {
  // backward compat: if array passed (old callers), wrap it
  if (Array.isArray(missingAtt)) missingAtt = { groups: missingAtt, teams: [] };
  const dowHe = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
  const today = new Date();
  const todayDow = today.getDay();
  const todayStr = `יום ${dowHe[todayDow]}, ${today.toLocaleDateString('he-IL',{day:'numeric',month:'long',year:'numeric'})}`;

  // ── Stats ──────────────────────────────────────────────
  let totalPlayers = 0, totalPaid = 0, totalPending = 0, totalTrial = 0;
  groups.forEach(g => (g.subGroups || []).forEach(sg => {
    (sg.players || []).forEach(p => {
      if (p.hidden) return;
      totalPlayers++;
      const s = p.paymentStatus || 'trial';
      if (s === 'paid') totalPaid++;
      else if (s === 'pending') totalPending++;
      else totalTrial++;
    });
  }));
  const paidPct = totalPlayers ? Math.round(totalPaid / totalPlayers * 100) : 0;

  // ── Today's groups ─────────────────────────────────────
  const todayGroups = groups.map((g, gi) => ({ g, gi })).filter(({ g }) => g.dayOfWeek === todayDow);
  const todaySection = todayGroups.length === 0
    ? `<div style="padding:16px 18px;color:#718096;font-size:13px">אין חוגים היום</div>`
    : todayGroups.map(({ g, gi }) =>
        (g.subGroups || []).map((sg, si) => {
          const cnt = (sg.players || []).filter(p => !p.hidden).length;
          const color = GROUP_COLORS[gi % GROUP_COLORS.length];
          return `<div class="dash-today-row">
            <div class="dash-today-dot" style="background:${color}"></div>
            <div style="flex:1;margin-right:2px">
              <div class="dash-today-name">${g.name}${sg.time ? ' · '+sg.time : ''}</div>
              <div class="dash-today-sub">${cnt} שחקנים</div>
            </div>
            <button class="btn-dash-att" onclick="goToAttendance(${gi},${si})">🗓 נוכחות</button>
          </div>`;
        }).join('')
      ).join('');

  // ── Alerts ─────────────────────────────────────────────
  const generalAlerts = [];
  if (totalPending > 0) generalAlerts.push(`<div class="dash-alert-row"><span class="dash-alert-icon">🔴</span><span><strong>${totalPending}</strong> ממתינים לתשלום — <a href="#" onclick="switchTab('payments');return false" style="color:#2b6cb0">לתשלומים</a></span></div>`);
  if (totalTrial > 0)   generalAlerts.push(`<div class="dash-alert-row"><span class="dash-alert-icon">🟡</span><span><strong>${totalTrial}</strong> שחקנים בשיעור ניסיון</span></div>`);
  const todayIso = today.toISOString().split('T')[0];
  if (currentUser?.role === 'admin') {
    const expiredCards = Object.values(_fedPlayers||{}).filter(p => p.cardExpiry && p.cardExpiry < todayIso);
    const soonCards    = Object.values(_fedPlayers||{}).filter(p => {
      if (!p.cardExpiry || p.cardExpiry <= todayIso) return false;
      return Math.floor((new Date(p.cardExpiry) - today) / 86400000) <= 30;
    });
    if (expiredCards.length > 0) generalAlerts.push(`<div class="dash-alert-row"><span class="dash-alert-icon">🔴</span><span><strong>${expiredCards.length}</strong> כרטיסי שחמטאי פגי תוקף — <a href="#" onclick="switchTab('youth-players');return false" style="color:#2b6cb0">למאגר</a></span></div>`);
    if (soonCards.length > 0)    generalAlerts.push(`<div class="dash-alert-row"><span class="dash-alert-icon">🟡</span><span><strong>${soonCards.length}</strong> כרטיסי שחמטאי יפקעו תוך 30 יום</span></div>`);
  }

  const _attAlertRow = (m, isAdmin) => {
    const waBtn = (isAdmin && m.instructorWa)
      ? `<a href="https://wa.me/${m.instructorWa}?text=${encodeURIComponent(`שלום ${m.instructor}, תזכורת למלא נוכחות עבור ${m.groupName} לתאריך ${m.date} 🙏`)}" target="_blank" style="margin-right:8px;background:#25D366;color:white;padding:3px 10px;border-radius:8px;font-size:12px;text-decoration:none;white-space:nowrap">📲 תזכורת</a>` : '';
    return `<div class="dash-alert-row"><span class="dash-alert-icon">🟠</span><span style="flex:1">לא הוזנה נוכחות: <strong>${m.groupName}${m.subGroupName ? ' · '+m.subGroupName : ''}</strong> (${m.date})</span>${waBtn}</div>`;
  };
  const isAdm = currentUser?.role === 'admin';
  const groupAttAlerts = [...missingAtt.groups].reverse().map(m => _attAlertRow(m, isAdm));
  const teamAttAlerts  = [...missingAtt.teams].reverse().map(m => _attAlertRow(m, isAdm));

  const hasGroups = groups.length > 0;
  const hasTeams  = teams.length > 0;
  const showSplit = hasGroups && hasTeams;

  let alertsHtml;
  if (showSplit) {
    const groupCol = (groupAttAlerts.length
      ? groupAttAlerts.join('')
      : `<div class="dash-alert-row"><span class="dash-alert-icon">✅</span><span style="color:#276749">אין התראות</span></div>`);
    const teamCol = (teamAttAlerts.length
      ? teamAttAlerts.join('')
      : `<div class="dash-alert-row"><span class="dash-alert-icon">✅</span><span style="color:#276749">אין התראות</span></div>`);
    alertsHtml = `
      ${generalAlerts.join('')}
      ${generalAlerts.length ? `<div style="border-top:1px solid #e2e8f0;margin:4px 0"></div>` : ''}
      <div class="dash-alert-split">
        <div style="border-left:1px solid #e2e8f0">
          <div style="font-size:11px;font-weight:700;color:#718096;padding:8px 18px 4px;letter-spacing:0.5px">חוגים</div>
          ${groupCol}
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#718096;padding:8px 18px 4px;letter-spacing:0.5px">נבחרות</div>
          ${teamCol}
        </div>
      </div>`;
  } else {
    const allAttAlerts = hasTeams ? teamAttAlerts : groupAttAlerts;
    const combined = [...generalAlerts, ...allAttAlerts];
    if (combined.length === 0) combined.push(`<div class="dash-alert-row"><span class="dash-alert-icon">✅</span><span style="color:#276749">אין התראות פתוחות</span></div>`);
    alertsHtml = combined.join('');
  }

  // ── Prospects pipeline ─────────────────────────────────
  const pCounts = { new:0, contacted:0, invited:0, joined:0, 'no-answer':0, declined:0 };
  Object.values(_prospects||{}).forEach(p => { const k = p.status||'new'; if (k in pCounts) pCounts[k]++; });
  const totalProspects = Object.keys(_prospects||{}).length;

  // ── Tournaments ────────────────────────────────────────
  const tournList = Object.values(_tournaments||{});
  const activeTourns   = tournList.filter(t => t.status === 'active');
  const upcomingTourns = tournList.filter(t => t.status === 'upcoming').sort((a,b) => (a.date||'').localeCompare(b.date||''));
  const totalBalance   = tournList.reduce((sum, t) => sum + (typeof calcTournamentIncome==='function' ? calcTournamentIncome(t) - calcTournamentExpenses(t) : 0), 0);

  // ── Friday leagues top-3 ───────────────────────────────
  const activeLeagueData = _fridayData?.[_fridayActiveLeague];
  let fridayLeaderboard = '';
  if (activeLeagueData?.players) {
    const results = activeLeagueData.tournamentResults || {};
    const scores = {};
    Object.keys(activeLeagueData.players).forEach(pid => scores[pid] = 0);
    Object.entries(results).forEach(([wPid, row]) => {
      Object.entries(row).forEach(([bPid, val]) => {
        const r = typeof getResult==='function' ? getResult(val) : (val?.result ?? val);
        if (r === '1')   { scores[wPid] = (scores[wPid]||0) + 1; }
        else if (r==='0.5') { scores[wPid]=(scores[wPid]||0)+0.5; scores[bPid]=(scores[bPid]||0)+0.5; }
        else if (r==='0') { scores[bPid]=(scores[bPid]||0)+1; }
      });
    });
    const sorted = Object.entries(activeLeagueData.players)
      .sort((a,b)=>(scores[b[0]]||0)-(scores[a[0]]||0)).slice(0,3);
    const medals = ['🥇','🥈','🥉'];
    fridayLeaderboard = sorted.map(([pid,p],i)=>`
      <div class="dash-today-row">
        <span style="font-size:18px;margin-left:8px">${medals[i]}</span>
        <div style="flex:1"><div class="dash-today-name">${p.name}</div></div>
        <span style="font-weight:800;color:#2b6cb0">${scores[pid]||0}</span>
      </div>`).join('');
  }

  const isAdmin = currentUser?.role === 'admin';

  // ── Team player stats ───────────────────────────────────
  let totalTeamPlayers = 0, teamPaid = 0, teamPending = 0, teamTrial = 0;
  teams.forEach(t => t.subGroups.forEach(sg => sg.players.forEach(p => {
    if (p.hidden) return;
    totalTeamPlayers++;
    const s = p.paymentStatus || 'trial';
    if (s === 'paid') teamPaid++;
    else if (s === 'pending') teamPending++;
    else teamTrial++;
  })));
  const teamPaidPct = totalTeamPlayers ? Math.round(teamPaid / totalTeamPlayers * 100) : 0;

  return `
  <div style="max-width:1100px">
    <div style="margin-bottom:10px;font-size:13px;color:#718096">${todayStr}</div>

    <!-- Stats -->
    ${groups.length > 0 ? `
    <div class="dash-card" style="margin-bottom:12px">
      <div style="font-size:11px;font-weight:700;color:#718096;padding:12px 18px 4px;letter-spacing:0.5px;text-transform:uppercase">חוגים</div>
      <div class="dash-stats-row" style="grid-template-columns:repeat(${isAdmin && totalProspects>0 ? 5 : 4},1fr)">
        <div class="dash-stat"><div class="dash-stat-num" style="color:#2b6cb0">${totalPlayers}</div><div class="dash-stat-label">שחקנים</div></div>
        <div class="dash-stat"><div class="dash-stat-num" style="color:#6b46c1">${groups.length}</div><div class="dash-stat-label">חוגים</div></div>
        <div class="dash-stat"><div class="dash-stat-num" style="color:#276749">${totalPaid}</div><div class="dash-stat-label">שילמו</div></div>
        <div class="dash-stat"><div class="dash-stat-num" style="color:${(totalPending+totalTrial)>0?'#e53e3e':'#276749'}">${totalPlayers ? (100-paidPct) : 0}%</div><div class="dash-stat-label">לא שילמו</div></div>
        ${isAdmin && totalProspects>0 ? `<div class="dash-stat"><div class="dash-stat-num" style="color:#c05621">${pCounts.joined}</div><div class="dash-stat-label">הצטרפו מגנים</div></div>` : ''}
      </div>
    </div>` : ''}

    ${teams.length > 0 ? `
    <div class="dash-card" style="margin-bottom:20px">
      <div style="font-size:11px;font-weight:700;color:#718096;padding:12px 18px 4px;letter-spacing:0.5px;text-transform:uppercase">נבחרות</div>
      <div class="dash-stats-row" style="grid-template-columns:repeat(4,1fr)">
        <div class="dash-stat"><div class="dash-stat-num" style="color:#553c9a">${totalTeamPlayers}</div><div class="dash-stat-label">שחקנים</div></div>
        <div class="dash-stat"><div class="dash-stat-num" style="color:#6b46c1">${teams.length}</div><div class="dash-stat-label">נבחרות</div></div>
        <div class="dash-stat"><div class="dash-stat-num" style="color:#276749">${teamPaid}</div><div class="dash-stat-label">שילמו</div></div>
        <div class="dash-stat"><div class="dash-stat-num" style="color:${(teamPending+teamTrial)>0?'#e53e3e':'#276749'}">${totalTeamPlayers ? (100-teamPaidPct) : 0}%</div><div class="dash-stat-label">לא שילמו</div></div>
      </div>
    </div>` : ''}

    ${groups.length === 0 && teams.length === 0 ? `
    <div class="dash-card" style="margin-bottom:20px;text-align:center;padding:24px;color:#a0aec0">
      <div style="font-size:32px;margin-bottom:8px">📋</div>
      <div>אין חוגים או נבחרות מוקצים עדיין</div>
    </div>` : ''}

    <!-- Alerts (only) -->
    <div class="dash-card" style="margin-bottom:20px">
      <div class="dash-card-title">⚠️ התראות</div>
      ${alertsHtml}
    </div>

    ${isAdmin ? `
    <!-- Row 2: Today + Admin cards -->
    <div class="dash-grid" style="margin-bottom:20px">
      <div class="dash-card">
        <div class="dash-card-title">📅 חוגים היום</div>
        ${todaySection}
      </div>` : ''}

    ${isAdmin ? `
      <div class="dash-card" style="cursor:pointer" onclick="switchTab('prospects')">
        <div class="dash-card-title">🌟 מצטייני גנים</div>
        ${totalProspects===0
          ? `<div style="padding:14px 18px;color:#a0aec0;font-size:13px">לחץ להוספת ילדים</div>`
          : `<div style="padding:12px 18px;display:flex;gap:8px;flex-wrap:wrap">
              ${[['new','חדשים','#ebf8ff','#2b6cb0'],['contacted','יצרנו קשר','#fffbeb','#b7791f'],['invited','הוזמן','#faf5ff','#553c9a'],['joined','הצטרפו','#f0fff4','#276749'],['declined','לא מעוניין','#fff5f5','#c53030']]
                .filter(([k])=>pCounts[k]>0)
                .map(([k,label,bg,color])=>`<div style="background:${bg};border-radius:8px;padding:8px 12px;text-align:center;flex:1;min-width:55px">
                  <div style="font-size:20px;font-weight:800;color:${color}">${pCounts[k]}</div>
                  <div style="font-size:10px;color:${color};font-weight:700;margin-top:1px">${label}</div>
                </div>`).join('')}
            </div>`}
      </div>
    </div>
    <div class="dash-grid" style="margin-bottom:20px">
      <div class="dash-card" style="cursor:pointer" onclick="switchTab('club-tournaments')">
        <div class="dash-card-title">🏆 תחרויות</div>
        ${tournList.length===0
          ? `<div style="padding:14px 18px;color:#a0aec0;font-size:13px">לחץ לניהול תחרויות</div>`
          : `<div style="padding:10px 18px;display:flex;flex-direction:column;gap:8px">
              ${activeTourns.map(t=>`<div style="display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:13px;font-weight:600;color:#276749">🟢 ${t.name}</span>
                <span style="font-size:12px;color:#718096">${Object.keys(t.players||{}).length} שחקנים</span>
              </div>`).join('')}
              ${upcomingTourns.length>0?`<div style="display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:13px;color:#4a5568">⏳ ${upcomingTourns[0].name}</span>
                <span style="font-size:12px;color:#718096">${upcomingTourns[0].date?new Date(upcomingTourns[0].date+'T12:00:00').toLocaleDateString('he-IL',{day:'numeric',month:'short'}):''}</span>
              </div>`:''}
              <div style="border-top:1px solid #f0f4f8;padding-top:8px;display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:12px;color:#718096">יתרה כוללת</span>
                <span style="font-size:15px;font-weight:800;color:${totalBalance>=0?'#276749':'#c53030'}">${totalBalance>=0?'+':''}₪${totalBalance.toLocaleString()}</span>
              </div>
            </div>`}
      </div>
      <div class="dash-card" style="cursor:pointer" onclick="switchTab('friday')">
        <div class="dash-card-title">♟ ליגות שישי</div>
        ${!activeLeagueData
          ? `<div style="padding:14px 18px;color:#a0aec0;font-size:13px">לחץ לניהול ליגות</div>`
          : `<div>
              <div style="padding:8px 18px 2px;font-size:12px;font-weight:700;color:#2b6cb0">${activeLeagueData.name||'ליגה פעילה'}</div>
              ${fridayLeaderboard||'<div style="padding:10px 18px;color:#a0aec0;font-size:13px">טרם הוזנו תוצאות</div>'}
            </div>`}
      </div>
    </div>` : ''}

    ${isAdmin ? `
    <!-- Row 2: Prospects + Tournaments + Friday (admin only) -->
    <div class="dash-grid" style="margin-bottom:20px">
      <div class="dash-card" style="cursor:pointer" onclick="switchTab('prospects')">
        <div class="dash-card-title">🌟 מצטייני גנים</div>
        ${totalProspects===0
          ? `<div style="padding:14px 18px;color:#a0aec0;font-size:13px">לחץ להוספת ילדים</div>`
          : `<div style="padding:12px 18px;display:flex;gap:8px;flex-wrap:wrap">
              ${[['new','חדשים','#ebf8ff','#2b6cb0'],['contacted','יצרנו קשר','#fffbeb','#b7791f'],['invited','הוזמן','#faf5ff','#553c9a'],['joined','הצטרפו','#f0fff4','#276749'],['declined','לא מעוניין','#fff5f5','#c53030']]
                .filter(([k])=>pCounts[k]>0)
                .map(([k,label,bg,color])=>`<div style="background:${bg};border-radius:8px;padding:8px 12px;text-align:center;flex:1;min-width:55px">
                  <div style="font-size:20px;font-weight:800;color:${color}">${pCounts[k]}</div>
                  <div style="font-size:10px;color:${color};font-weight:700;margin-top:1px">${label}</div>
                </div>`).join('')}
            </div>`}
      </div>
      <div class="dash-card" style="cursor:pointer" onclick="switchTab('club-tournaments')">
        <div class="dash-card-title">🏆 תחרויות</div>
        ${tournList.length===0
          ? `<div style="padding:14px 18px;color:#a0aec0;font-size:13px">לחץ לניהול תחרויות</div>`
          : `<div style="padding:10px 18px;display:flex;flex-direction:column;gap:8px">
              ${activeTourns.map(t=>`<div style="display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:13px;font-weight:600;color:#276749">🟢 ${t.name}</span>
                <span style="font-size:12px;color:#718096">${Object.keys(t.players||{}).length} שחקנים</span>
              </div>`).join('')}
              ${upcomingTourns.length>0?`<div style="display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:13px;color:#4a5568">⏳ ${upcomingTourns[0].name}</span>
                <span style="font-size:12px;color:#718096">${upcomingTourns[0].date?new Date(upcomingTourns[0].date+'T12:00:00').toLocaleDateString('he-IL',{day:'numeric',month:'short'}):''}</span>
              </div>`:''}
              <div style="border-top:1px solid #f0f4f8;padding-top:8px;display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:12px;color:#718096">יתרה כוללת</span>
                <span style="font-size:15px;font-weight:800;color:${totalBalance>=0?'#276749':'#c53030'}">${totalBalance>=0?'+':''}₪${totalBalance.toLocaleString()}</span>
              </div>
            </div>`}
      </div>
      <div class="dash-card" style="cursor:pointer" onclick="switchTab('friday')">
        <div class="dash-card-title">♟ ליגות שישי</div>
        ${!activeLeagueData
          ? `<div style="padding:14px 18px;color:#a0aec0;font-size:13px">לחץ לניהול ליגות</div>`
          : `<div>
              <div style="padding:8px 18px 2px;font-size:12px;font-weight:700;color:#2b6cb0">${activeLeagueData.name||'ליגה פעילה'}</div>
              ${fridayLeaderboard||'<div style="padding:10px 18px;color:#a0aec0;font-size:13px">טרם הוזנו תוצאות</div>'}
            </div>`}
      </div>
    </div>` : ''}

    <!-- Shortcuts -->
    <div class="dash-card">
      <div class="dash-card-title">🔗 קיצורי דרך</div>
      <div class="dash-shortcut-grid" style="grid-template-columns:repeat(auto-fill,minmax(85px,1fr))">
        <button class="btn-shortcut" style="background:#f0fff4;color:#276749" onclick="switchTab('attendance')"><span>🗓</span>נוכחות</button>
        <button class="btn-shortcut" style="background:#ebf8ff;color:#2b6cb0" onclick="switchTab('reports')"><span>📊</span>דוחות</button>
        <button class="btn-shortcut" style="background:#f0f4ff;color:#6b46c1" onclick="switchTab('payments')"><span>💳</span>תשלומים</button>
        <button class="btn-shortcut" style="background:#fffbeb;color:#b7791f" onclick="switchTab('calendar')"><span>📅</span>לוח שנה</button>
        ${isAdmin ? `
        <button class="btn-shortcut" style="background:#f3f0ff;color:#553c9a" onclick="switchTab('friday')"><span>♟</span>ליגות שישי</button>
        <button class="btn-shortcut" style="background:#fff8f0;color:#c05621" onclick="switchTab('prospects')"><span>🌟</span>מצטייני גנים</button>
        <button class="btn-shortcut" style="background:#fffdf0;color:#b7791f" onclick="switchTab('club-tournaments')"><span>🏆</span>תחרויות</button>
        ` : ''}
      </div>
    </div>

    ${isAdmin ? `
    <!-- Audit widget — admin only -->
    <div class="dash-card" style="margin-top:20px">
      <div class="dash-card-title" style="display:flex;align-items:center;justify-content:space-between">
        <span>📊 פעילות מדריכים אחרונה</span>
        <a href="#" onclick="switchTab('audit');loadAuditLog();return false"
           style="font-size:12px;font-weight:600;color:#2b6cb0;text-decoration:none">לכל הפעילות ←</a>
      </div>
      <div id="dash-audit-rows" style="padding:4px 18px 8px">
        <div style="color:#a0aec0;font-size:13px;padding:10px 0">טוען...</div>
      </div>
    </div>` : ''}
  </div>`;
}

function goToAttendance(groupIdx, subGroupIdx) {
  switchTab('attendance');
  // pre-select the right group/subgroup
  setTimeout(() => {
    const gSel = document.getElementById('attGroupSel');
    const sgSel = document.getElementById('attSubGroupSel');
    if (gSel) { gSel.value = groupIdx; gSel.dispatchEvent(new Event('change')); }
    if (sgSel) { sgSel.value = subGroupIdx; sgSel.dispatchEvent(new Event('change')); }
  }, 50);
}

// ===== AUTH =====
let currentUser = null;




async function handleContactSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('contact-submit-btn');
  const form = document.getElementById('contact-form');
  btn.disabled = true;
  btn.textContent = '⏳ שולח...';
  try {
    if (!db) throw new Error('Firebase לא זמין');
    const data = {
      name:    form.querySelector('[name="name"]').value.trim(),
      contact: form.querySelector('[name="contact"]').value.trim(),
      subject: form.querySelector('[name="subject"]').value,
      message: form.querySelector('[name="message"]').value.trim(),
      ts:      Date.now(),
      read:    false
    };
    await db.ref('contactSubmissions').push(data);
    form.style.display = 'none';
    document.getElementById('contact-form-success').style.display = 'block';
  } catch(err) {
    btn.disabled = false;
    btn.textContent = '📩 שלח פנייה';
    alert('שגיאה בשליחה — נסה שנית או פנה ב-WhatsApp\n' + err.message);
  }
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');
  const btn = document.getElementById('theme-toggle');
  btn.textContent = isLight ? '🌙 מצב כהה' : '☀️ מצב בהיר';
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}
(function() {
  const btn = document.getElementById('theme-toggle');
  if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    if (btn) btn.textContent = '🌙 מצב כהה';
  } else {
    if (btn) btn.textContent = '☀️ מצב בהיר';
  }
})();


// ════════════════════════════════════════════════════════════
// PUBLIC SCHEDULE — loads from Firebase clubSchedule
// ════════════════════════════════════════════════════════════
window.loadPublicSchedule = async function() {
  const container = document.getElementById('clubs-schedule-container');
  const catTabs   = document.getElementById('clubs-cat-tabs');
  if (!container || !catTabs) return;
  container.innerHTML = '<div style="text-align:center;padding:32px;color:rgba(255,255,255,0.45)">⏳ טוען...</div>';
  catTabs.innerHTML = '';
  try {
    const snap = await db.ref('clubSchedule').once('value');
    const data = snap.val() || {};
    // Check if schedule is hidden by admin (stored inside clubSchedule to allow public read)
    if (data.scheduleHidden) {
      const msg = data.scheduleMessage || 'לוח החוגים יתעדכן בקרוב — נשמח לראותכם!';
      container.innerHTML = `
        <div style="text-align:center;padding:60px 24px;direction:rtl">
          <div style="font-size:48px;margin-bottom:16px">🚧</div>
          <div style="font-size:18px;font-weight:700;color:var(--text-primary);margin-bottom:10px;white-space:pre-wrap;line-height:1.6">${msg}</div>
        </div>`;
      return;
    }
    const cats = Object.entries(data.categories || {})
      .map(([id,v]) => ({id,...v}))
      .sort((a,b) => (a.order||0)-(b.order||0));
    const allClasses = Object.entries(data.classes || {})
      .map(([id,v]) => ({id,...v}));
    const allFilters = Object.entries(data.filters || {})
      .map(([id,v]) => ({id,...v}))
      .sort((a,b) => (a.order||0)-(b.order||0));

    window._pubScheduleClasses = allClasses;
    window._pubScheduleFilters = allFilters;

    if (cats.length === 0 && allClasses.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.4)">לוח החוגים יתעדכן בקרוב</div>';
      return;
    }

    let activeCatId = cats.length ? cats[0].id : null;

    const viewToggle =
      '<div style="display:flex;background:var(--bg-subtle);border-radius:8px;padding:3px;gap:2px;flex-shrink:0">' +
      '<button id="pub-view-detail" onclick="window._setPubView(\'detail\')" style="background:var(--bg-card);color:var(--text-primary);border:none;border-radius:6px;padding:5px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">📋 פירוט</button>' +
      '<button id="pub-view-weekly" onclick="window._setPubView(\'weekly\')" style="background:none;color:var(--text-muted);border:none;border-radius:6px;padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">📅 לוח שבועי</button>' +
      '</div>';

    function renderTable(catId) {
      const cat  = cats.find(c => c.id === catId);
      const notesHtml = (cat?.notes||'').trim()
        ? '<div style="padding:10px 0 18px;font-size:14px;color:var(--text-muted);line-height:1.6;white-space:pre-wrap;direction:rtl">'+cat.notes+'</div>'
        : '';
      const rows = allClasses.filter(c => c.categoryId===catId).sort((a,b) => (a.order||0)-(b.order||0));
      if (!rows.length) return notesHtml + '<div style="text-align:center;padding:32px;color:rgba(255,255,255,0.35)">אין חוגים בקטגוריה זו</div>';
      return notesHtml + '<table class="schedule-table"><thead><tr>' +
        '<th>יום</th><th>שעות</th><th>גיל</th><th>רמה</th><th>מדריך</th><th>מחיר/חודש</th>' +
        '</tr></thead><tbody>' +
        rows.map(c => '<tr>' +
          '<td>'+(c.day||'')+'</td>' +
          '<td>'+(c.timeStart||'')+'–'+(c.timeEnd||'')+'</td>' +
          '<td style="font-size:12px">'+(c.ageLabel||'')+'</td>' +
          '<td><span class="level-badge level-'+(c.levelType||'beginner')+'">'+(c.levelLabel||'')+'</span></td>' +
          '<td>'+(c.instructor||'')+'</td>' +
          '<td class="price-cell">'+(c.price?c.price+' ₪':'–')+'</td>' +
          '</tr>').join('') +
        '</tbody></table>';
    }

    function renderCatTabs() {
      const onSt  = 'background:var(--bg-card);color:var(--text-primary);border:none;border-radius:6px;padding:5px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit';
      const offSt = 'background:none;color:var(--text-muted);border:none;border-radius:6px;padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit';
      catTabs.innerHTML = viewToggle + cats.map(c =>
        '<button onclick="window._pubClubTab(\''+c.id+'\')" id="pubcat-'+c.id+'" style="padding:6px 16px;border:none;border-radius:20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.2s;' +
        (c.id===activeCatId?'background:#f97316;color:white':'background:var(--bg-subtle);color:var(--text-primary)') +
        '">'+c.name+'</button>'
      ).join('');
      const pvd = document.getElementById('pub-view-detail');
      const pvw = document.getElementById('pub-view-weekly');
      if (pvd) pvd.style.cssText = onSt;
      if (pvw) pvw.style.cssText = offSt;
      container.innerHTML = activeCatId ? renderTable(activeCatId) : '<div style="text-align:center;padding:32px;color:rgba(255,255,255,0.35)">אין חוגים</div>';
    }

    function renderWeeklyView() {
      const onSt  = 'background:var(--bg-card);color:var(--text-primary);border:none;border-radius:6px;padding:5px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit';
      const offSt = 'background:none;color:var(--text-muted);border:none;border-radius:6px;padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit';
      catTabs.innerHTML = viewToggle;
      const pvd = document.getElementById('pub-view-detail');
      const pvw = document.getElementById('pub-view-weekly');
      if (pvd) pvd.style.cssText = offSt;
      if (pvw) pvw.style.cssText = onSt;
      container.innerHTML = _renderWeeklyPublicSection(allClasses, allFilters);
    }

    window._pubClubTab = function(catId) {
      activeCatId = catId;
      renderCatTabs();
    };
    window._setPubView = function(view) {
      window._pubScheduleView = view;
      if (view==='weekly') renderWeeklyView(); else renderCatTabs();
    };

    if ((window._pubScheduleView||'detail')==='weekly') renderWeeklyView(); else renderCatTabs();
  } catch(e) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#fc8181">שגיאה בטעינת לוח החוגים: ' + e.message + '</div>';
  }
};

// ════════════════════════════════════════════════════════════
// ADMIN: SCHEDULE EDITOR
// ════════════════════════════════════════════════════════════
function renderScheduleEditorPanel() {
  return '<div style="padding:24px;max-width:960px;margin:0 auto;direction:rtl">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;gap:12px;flex-wrap:wrap">' +
    '<h2 style="margin:0;font-size:22px;font-weight:800">📅 עורך לוח חוגים</h2>' +
    '<div style="display:flex;gap:8px;align-items:center">' +
    '<div style="display:flex;background:var(--bg-subtle);border-radius:8px;padding:3px;gap:2px">' +
    '<button id="sch-view-detail" onclick="window._schSetView(\'detail\')" style="background:var(--bg-card);color:var(--text-primary);border:none;border-radius:6px;padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">📋 פירוט</button>' +
    '<button id="sch-view-weekly" onclick="window._schSetView(\'weekly\')" style="background:none;color:var(--text-muted);border:none;border-radius:6px;padding:6px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">📅 לוח שבועי</button>' +
    '</div>' +
    '<button id="sch-add-cat-btn" onclick="window.addScheduleCategory()" style="background:#f97316;color:white;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">+ קטגוריה</button>' +
    '</div></div>' +
    '<div id="schedule-editor-content"><div style="text-align:center;padding:40px;color:#a0aec0">⏳ טוען...</div></div>' +
    '</div>';
}

async function loadScheduleEditor() {
  const el = document.getElementById('schedule-editor-content');
  if (!el) return;
  try {
    const snap = await db.ref('clubSchedule').once('value');
    const data = snap.val() || {};
    const cats = Object.entries(data.categories || {})
      .map(([id,v]) => ({id,...v}))
      .sort((a,b) => (a.order||0)-(b.order||0));
    const allClasses = Object.entries(data.classes || {})
      .map(([id,v]) => ({id,...v}));
    const allFilters = Object.entries(data.filters || {})
      .map(([id,v]) => ({id,...v}))
      .sort((a,b) => (a.order||0)-(b.order||0));

    window._schedCats    = cats;
    window._schedClasses = allClasses;
    window._schedFilters = allFilters;

    if ((window._schedView || 'detail') === 'weekly') {
      el.innerHTML = _renderWeeklyAdminSection(allClasses, allFilters);
      const onStyle  = 'background:var(--bg-card);color:var(--text-primary);border:none;border-radius:6px;padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit';
      const offStyle = 'background:none;color:var(--text-muted);border:none;border-radius:6px;padding:6px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit';
      const detBtn = document.getElementById('sch-view-detail');
      const wkBtn  = document.getElementById('sch-view-weekly');
      if (detBtn) detBtn.style.cssText = offStyle;
      if (wkBtn)  wkBtn.style.cssText  = onStyle;
      const addCatBtn = document.getElementById('sch-add-cat-btn');
      if (addCatBtn) addCatBtn.style.display = 'none';
    } else {
      el.innerHTML = renderDetailViewHtml(cats, allClasses);
    }
  } catch(e) {
    el.innerHTML = '<div style="color:#fc8181;padding:20px">שגיאה: ' + e.message + '</div>';
  }
}

// --- Category CRUD ---
window.openCategoryModal = function(catId) {
  const existing = catId ? (window._schedCats||[]).find(c=>c.id===catId) : null;
  document.querySelector('.cat-edit-modal')?.remove();
  const modal = document.createElement('div');
  modal.className = 'cat-edit-modal friday-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;direction:rtl';
  modal.innerHTML =
    '<div style="background:#1e2a45;border-radius:16px;padding:28px;width:420px;max-width:92vw;color:white">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">' +
    '<h3 style="margin:0;font-size:18px;font-weight:800">'+(catId?'עריכת קטגוריה':'קטגוריה חדשה')+'</h3>' +
    '<button onclick="this.closest(\'.cat-edit-modal\').remove()" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:22px;cursor:pointer;line-height:1">✕</button>' +
    '</div>' +
    '<div style="display:flex;flex-direction:column;gap:14px">' +
    '<div>' +
    '<label style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.75);display:block;margin-bottom:6px">שם הקטגוריה</label>' +
    '<input id="cat-modal-name" type="text" value="'+(existing?.name||'')+'" placeholder="לדוגמא: ילדים ונוער, מבוגרים" ' +
    'style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);color:white;font-size:14px;font-family:inherit;box-sizing:border-box">' +
    '</div>' +
    '<div>' +
    '<label style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.75);display:block;margin-bottom:6px">הערות (יוצג באתר מתחת לכותרת הקטגוריה)</label>' +
    '<textarea id="cat-modal-notes" rows="3" placeholder="מלל חופשי שיופיע מתחת לשם הקטגוריה..." ' +
    'style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);color:white;font-size:13px;font-family:inherit;box-sizing:border-box;resize:vertical">' +
    (existing?.notes||'') +
    '</textarea>' +
    '</div>' +
    '<div id="cat-modal-err" style="color:#fc8181;font-size:13px;display:none"></div>' +
    '<button onclick="window._saveCategoryModal(\''+(catId||'')+'\')" ' +
    'style="background:#f97316;color:white;border:none;border-radius:8px;padding:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">' +
    (catId?'💾 שמור שינויים':'+ הוסף קטגוריה') +
    '</button></div></div>';
  document.body.appendChild(modal);
  setTimeout(()=>document.getElementById('cat-modal-name')?.focus(),50);
};

window._saveCategoryModal = async function(catId) {
  const name  = (document.getElementById('cat-modal-name')?.value||'').trim();
  const notes = (document.getElementById('cat-modal-notes')?.value||'').trim();
  const errEl = document.getElementById('cat-modal-err');
  if (!name) { errEl.textContent='נדרש שם לקטגוריה'; errEl.style.display=''; return; }
  errEl.style.display = 'none';
  if (catId) {
    await db.ref('clubSchedule/categories/'+catId).update({ name, notes });
  } else {
    const snap = await db.ref('clubSchedule/categories').once('value');
    const order = Object.keys(snap.val()||{}).length;
    await db.ref('clubSchedule/categories').push({ name, notes, order });
  }
  document.querySelector('.cat-edit-modal')?.remove();
  loadScheduleEditor();
};

window.addScheduleCategory = function() { window.openCategoryModal(null); };
window.editScheduleCategory = function(catId) { window.openCategoryModal(catId); };

window.deleteScheduleCategory = async function(catId) {
  if (!confirm('למחוק קטגוריה זו וכל החוגים שבה?')) return;
  await db.ref('clubSchedule/categories/' + catId).remove();
  const snap = await db.ref('clubSchedule/classes').once('value');
  const classes = snap.val() || {};
  const deletions = Object.entries(classes)
    .filter(([,v]) => v.categoryId === catId)
    .map(([id]) => db.ref('clubSchedule/classes/' + id).remove());
  await Promise.all(deletions);
  loadScheduleEditor();
};

// --- Class CRUD ---
function getScheduleClassModal(cls, catId) {
  // Build instructor options from _instructors if available
  let instrOptions = '<option value="">-- בחר מדריך --</option>';
  const instrs = window._instructors || [];
  if (instrs.length > 0) {
    instrs.forEach(ins => {
      const sel = cls && cls.instructor === ins.name ? ' selected' : '';
      instrOptions += '<option value="' + ins.name + '"' + sel + '>' + ins.name + '</option>';
    });
    instrOptions += '<option value="__custom__">אחר (הקלד ידנית)</option>';
  }

  const days = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
  const dayOpts = days.map(d => '<option value="' + d + '"' + (cls&&cls.day===d?' selected':'') + '>' + d + '</option>').join('');

  return '<div id="sch-class-modal" style="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9000;display:flex;align-items:center;justify-content:center;padding:20px">' +
    '<div style="background:#0d2137;border:1px solid rgba(255,255,255,0.15);border-radius:16px;padding:28px;width:480px;max-width:100%;max-height:90vh;overflow-y:auto;direction:rtl">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">' +
    '<h3 style="margin:0;font-size:18px;font-weight:800">' + (cls ? 'עריכת חוג' : 'הוספת חוג חדש') + '</h3>' +
    '<button onclick="document.getElementById(\'sch-class-modal\').remove()" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:22px;cursor:pointer">×</button>' +
    '</div>' +

    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">' +

    '<div style="display:flex;flex-direction:column;gap:6px">' +
    '<label style="font-size:12px;color:rgba(255,255,255,0.6);font-weight:700">יום</label>' +
    '<select id="sch-day" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:9px 12px;color:white;font-size:14px;font-family:inherit">' +
    dayOpts + '</select></div>' +

    '<div style="display:flex;flex-direction:column;gap:6px">' +
    '<label style="font-size:12px;color:rgba(255,255,255,0.6);font-weight:700">גיל (אופציונלי)</label>' +
    '<input id="sch-age" type="text" placeholder="למשל: 8–12, עד 18" value="' + (cls&&cls.ageLabel||'') + '" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:9px 12px;color:white;font-size:14px;font-family:inherit">' +
    '</div>' +

    '<div style="display:flex;flex-direction:column;gap:6px">' +
    '<label style="font-size:12px;color:rgba(255,255,255,0.6);font-weight:700">שעת התחלה</label>' +
    '<input id="sch-start" type="time" value="' + (cls&&cls.timeStart||'') + '" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:9px 12px;color:white;font-size:14px;font-family:inherit">' +
    '</div>' +

    '<div style="display:flex;flex-direction:column;gap:6px">' +
    '<label style="font-size:12px;color:rgba(255,255,255,0.6);font-weight:700">שעת סיום</label>' +
    '<input id="sch-end" type="time" value="' + (cls&&cls.timeEnd||'') + '" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:9px 12px;color:white;font-size:14px;font-family:inherit">' +
    '</div>' +

    '</div>' +

    '<div style="display:flex;flex-direction:column;gap:6px;margin-top:14px">' +
    '<label style="font-size:12px;color:rgba(255,255,255,0.6);font-weight:700">שם הרמה (כפי שיוצג)</label>' +
    '<input id="sch-level-label" type="text" placeholder="למשל: מתחילים, 1200–1400, מבוגרים מתקדמים" value="' + (cls&&cls.levelLabel||'') + '" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:9px 12px;color:white;font-size:14px;font-family:inherit;width:100%;box-sizing:border-box">' +
    '</div>' +

    '<div style="display:flex;flex-direction:column;gap:6px;margin-top:14px">' +
    '<label style="font-size:12px;color:rgba(255,255,255,0.6);font-weight:700">סוג רמה (לצבע התג)</label>' +
    '<select id="sch-level-type" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:9px 12px;color:white;font-size:14px;font-family:inherit">' +
    '<option value="beginner"' + (cls&&cls.levelType==='beginner'?' selected':'') + '>ירוק — מתחילים/ממשיכים</option>' +
    '<option value="intermediate"' + (cls&&cls.levelType==='intermediate'?' selected':'') + '>כחול — ביניים</option>' +
    '<option value="advanced"' + (cls&&cls.levelType==='advanced'?' selected':'') + '>כתום — מתקדמים</option>' +
    '</select></div>' +

    '<div style="display:flex;flex-direction:column;gap:6px;margin-top:14px">' +
    '<label style="font-size:12px;color:rgba(255,255,255,0.6);font-weight:700">מדריך</label>' +
    (instrs.length > 0
      ? '<select id="sch-instructor-sel" onchange="window._schInstrChange()" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:9px 12px;color:white;font-size:14px;font-family:inherit">' + instrOptions + '</select>'
      : '') +
    '<input id="sch-instructor" type="text" placeholder="שם המדריך" value="' + (cls&&cls.instructor||'') + '" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:9px 12px;color:white;font-size:14px;font-family:inherit;' + (instrs.length>0?'margin-top:6px':'') + ';width:100%;box-sizing:border-box">' +
    '</div>' +

    '<div style="display:flex;flex-direction:column;gap:6px;margin-top:14px">' +
    '<label style="font-size:12px;color:rgba(255,255,255,0.6);font-weight:700">מחיר (₪ לחודש — ללא סימן ₪)</label>' +
    '<input id="sch-price" type="text" placeholder="למשל: 195 או 235/355" value="' + (cls&&cls.price||'') + '" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:9px 12px;color:white;font-size:14px;font-family:inherit;width:100%;box-sizing:border-box">' +
    '</div>' +

    (() => {
      const allF = window._schedFilters || [];
      if (!allF.length) return '';
      return '<div style="display:flex;flex-direction:column;gap:8px;margin-top:14px">' +
        '<label style="font-size:12px;color:rgba(255,255,255,0.6);font-weight:700">פילטרים</label>' +
        '<div style="display:flex;flex-wrap:wrap;gap:10px">' +
        allF.map(f => {
          const checked = cls && cls.filters && cls.filters[f.id];
          return '<label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:13px">' +
            '<input type="checkbox" id="sch-filter-cb-'+f.id+'" '+(checked?'checked':'')+' style="accent-color:'+f.color+';width:14px;height:14px">' +
            '<span style="width:10px;height:10px;border-radius:50%;background:'+f.color+';display:inline-block;flex-shrink:0"></span>' +
            f.name+'</label>';
        }).join('') +
        '</div></div>';
    })() +
    '<div style="margin-top:22px;display:flex;gap:10px">' +
    '<button onclick="window._saveScheduleClass(\'' + (cls?cls.id:'') + '\',\'' + (catId||'') + '\')" style="flex:1;background:#f97316;color:white;border:none;border-radius:10px;padding:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit">💾 שמור</button>' +
    '<button onclick="document.getElementById(\'sch-class-modal\').remove()" style="background:rgba(255,255,255,0.08);color:white;border:none;border-radius:10px;padding:12px 20px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit">ביטול</button>' +
    '</div>' +
    '</div></div>';
}

window._schInstrChange = function() {
  const sel = document.getElementById('sch-instructor-sel');
  const inp = document.getElementById('sch-instructor');
  if (!sel || !inp) return;
  if (sel.value === '__custom__') { inp.style.display=''; inp.value=''; inp.focus(); }
  else { inp.style.display = sel.value ? 'none' : ''; if (sel.value) inp.value = sel.value; }
};

window.addScheduleClass = function(catId) {
  const existing = document.getElementById('sch-class-modal');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', getScheduleClassModal(null, catId));
  // hide manual input if instructors list exists
  const sel = document.getElementById('sch-instructor-sel');
  const inp = document.getElementById('sch-instructor');
  if (sel && inp) inp.style.display = 'none';
};

window.editScheduleClass = async function(classId) {
  const snap = await db.ref('clubSchedule/classes/' + classId).once('value');
  const cls = snap.val();
  if (!cls) return;
  cls.id = classId;
  const existing = document.getElementById('sch-class-modal');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', getScheduleClassModal(cls, cls.categoryId));
  // Set selector if found
  const sel = document.getElementById('sch-instructor-sel');
  const inp = document.getElementById('sch-instructor');
  if (sel && inp && cls.instructor) {
    let found = false;
    Array.from(sel.options).forEach(o => { if (o.value === cls.instructor) { o.selected=true; found=true; } });
    if (found) { inp.style.display='none'; }
    else { sel.value='__custom__'; inp.style.display=''; inp.value=cls.instructor; }
  }
};

window.deleteScheduleClass = async function(classId, catId) {
  if (!confirm('למחוק חוג זה?')) return;
  await db.ref('clubSchedule/classes/' + classId).remove();
  loadScheduleEditor();
};

window._saveScheduleClass = async function(classId, catId) {
  const day        = document.getElementById('sch-day')?.value || '';
  const timeStart  = document.getElementById('sch-start')?.value || '';
  const timeEnd    = document.getElementById('sch-end')?.value || '';
  const ageLabel   = document.getElementById('sch-age')?.value?.trim() || '';
  const levelLabel = document.getElementById('sch-level-label')?.value?.trim() || '';
  const levelType  = document.getElementById('sch-level-type')?.value || 'beginner';
  const instrSel   = document.getElementById('sch-instructor-sel');
  const instrInp   = document.getElementById('sch-instructor');
  let instructor = '';
  if (instrSel && instrSel.value && instrSel.value !== '__custom__') instructor = instrSel.value;
  else if (instrInp) instructor = instrInp.value.trim();
  const price = document.getElementById('sch-price')?.value?.trim() || '';

  if (!day || !timeStart || !timeEnd || !levelLabel) {
    alert('יש למלא: יום, שעות, ושם רמה');
    return;
  }

  const filterObj = {};
  (window._schedFilters||[]).forEach(f => {
    const cb = document.getElementById('sch-filter-cb-'+f.id);
    if (cb && cb.checked) filterObj[f.id] = true;
  });
  const obj = { categoryId: catId, day, timeStart, timeEnd, ageLabel, levelLabel, levelType, instructor, price };
  if (Object.keys(filterObj).length > 0) obj.filters = filterObj;
  // Set order
  if (!classId) {
    const snap = await db.ref('clubSchedule/classes').orderByChild('categoryId').equalTo(catId).once('value');
    obj.order = Object.keys(snap.val()||{}).length;
    await db.ref('clubSchedule/classes').push(obj);
  } else {
    const snap = await db.ref('clubSchedule/classes/' + classId).once('value');
    obj.order = snap.val()?.order || 0;
    await db.ref('clubSchedule/classes/' + classId).set(obj);
  }
  document.getElementById('sch-class-modal')?.remove();
  loadScheduleEditor();
};

// ════════════════════════════════════════════════════════════
// SCHEDULE: DETAIL VIEW RENDERER (extracted from loadScheduleEditor)
// ════════════════════════════════════════════════════════════
function renderDetailViewHtml(cats, allClasses) {
  if (cats.length === 0) {
    return '<div style="text-align:center;padding:48px;color:#a0aec0">' +
      '<div style="font-size:36px;margin-bottom:12px">📋</div>' +
      '<div style="font-weight:700;font-size:16px;margin-bottom:8px">אין קטגוריות עדיין</div>' +
      '<div style="font-size:14px;margin-bottom:20px">לחץ על "קטגוריה חדשה" כדי להתחיל לבנות את לוח החוגים</div>' +
      '</div>';
  }
  return cats.map(cat => {
    const catClasses = allClasses.filter(c => c.categoryId === cat.id).sort((a,b) => (a.order||0)-(b.order||0));
    const rows = catClasses.map(c =>
      '<tr>' +
      '<td style="padding:8px 10px">' + (c.day||'') + '</td>' +
      '<td style="padding:8px 10px">' + (c.timeStart||'') + '–' + (c.timeEnd||'') + '</td>' +
      '<td style="padding:8px 10px;font-size:12px">' + (c.ageLabel||'–') + '</td>' +
      '<td style="padding:8px 10px"><span class="level-badge level-' + (c.levelType||'beginner') + '">' + (c.levelLabel||'') + '</span></td>' +
      '<td style="padding:8px 10px">' + (c.instructor||'–') + '</td>' +
      '<td style="padding:8px 10px;font-weight:700;color:#f97316">' + (c.price ? c.price+' ₪' : '–') + '</td>' +
      '<td style="padding:8px 6px;white-space:nowrap">' +
      '<button onclick="window.editScheduleClass(\'' + c.id + '\')" style="background:rgba(59,130,246,0.15);color:#60a5fa;border:none;border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer;font-family:inherit;margin-left:4px">✏️ עריכה</button>' +
      '<button onclick="window.deleteScheduleClass(\'' + c.id + '\',\'' + cat.id + '\')" style="background:rgba(239,68,68,0.12);color:#fc8181;border:none;border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer;font-family:inherit">🗑 מחק</button>' +
      '</td></tr>'
    ).join('');
    return '<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:20px;margin-bottom:20px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:10px;flex-wrap:wrap">' +
      '<div style="display:flex;flex-direction:column;gap:4px">' +
      '<div style="display:flex;align-items:center;gap:10px">' +
      '<span style="font-size:17px;font-weight:800">' + cat.name + '</span>' +
      '<button onclick="window.editScheduleCategory(\'' + cat.id + '\')" style="background:none;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.6);border-radius:6px;padding:3px 10px;font-size:12px;cursor:pointer;font-family:inherit">✏️ ערוך</button>' +
      '<button onclick="window.deleteScheduleCategory(\'' + cat.id + '\')" style="background:none;border:1px solid rgba(239,68,68,0.3);color:#fc8181;border-radius:6px;padding:3px 10px;font-size:12px;cursor:pointer;font-family:inherit">🗑 מחק קטגוריה</button>' +
      '</div>' +
      (cat.notes ? '<div style="font-size:13px;color:rgba(255,255,255,0.55);white-space:pre-wrap;line-height:1.5">' + cat.notes + '</div>' : '') +
      '</div>' +
      '<button onclick="window.addScheduleClass(\'' + cat.id + '\')" style="background:#1e3a6e;color:white;border:none;border-radius:8px;padding:7px 14px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">+ הוסף חוג</button>' +
      '</div>' +
      (catClasses.length > 0
        ? '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">' +
          '<thead><tr style="color:rgba(255,255,255,0.5);font-size:11px;text-transform:uppercase">' +
          '<th style="padding:6px 10px;text-align:right">יום</th><th style="padding:6px 10px;text-align:right">שעות</th>' +
          '<th style="padding:6px 10px;text-align:right">גיל</th><th style="padding:6px 10px;text-align:right">רמה</th>' +
          '<th style="padding:6px 10px;text-align:right">מדריך</th><th style="padding:6px 10px;text-align:right">מחיר</th>' +
          '<th style="padding:6px 10px;text-align:right">פעולות</th>' +
          '</tr></thead><tbody>' + rows + '</tbody></table></div>'
        : '<div style="text-align:center;padding:20px;color:rgba(255,255,255,0.35);font-size:13px">אין חוגים בקטגוריה זו — לחץ על "הוסף חוג"</div>'
      ) + '</div>';
  }).join('');
}

// ════════════════════════════════════════════════════════════
// SCHEDULE: FILTER MANAGEMENT (admin)
// ════════════════════════════════════════════════════════════
function renderFilterManagementSection(allFilters) {
  const items = allFilters.map(f =>
    '<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:rgba(255,255,255,0.05);border-radius:8px">' +
    '<span style="width:12px;height:12px;border-radius:50%;background:' + f.color + ';flex-shrink:0;display:inline-block"></span>' +
    '<span style="flex:1;font-size:13px">' + f.name + '</span>' +
    '<button onclick="window.editScheduleFilter(\'' + f.id + '\',\'' + f.name.replace(/'/g,"\\'") + '\',\'' + f.color + '\')" style="background:none;border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.6);border-radius:5px;padding:2px 8px;font-size:11px;cursor:pointer;font-family:inherit">✏️</button>' +
    '<button onclick="window.deleteScheduleFilter(\'' + f.id + '\')" style="background:none;border:1px solid rgba(239,68,68,0.3);color:#fc8181;border-radius:5px;padding:2px 8px;font-size:11px;cursor:pointer;font-family:inherit">🗑</button>' +
    '</div>'
  ).join('');
  return '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:14px 16px;margin-bottom:18px">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;' + (allFilters.length ? 'margin-bottom:10px' : '') + '">' +
    '<span style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.75)">🏷️ פילטרים</span>' +
    '<button onclick="window.addScheduleFilter()" style="background:#6366f1;color:white;border:none;border-radius:6px;padding:4px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">+ פילטר חדש</button>' +
    '</div>' +
    (allFilters.length > 0
      ? '<div style="display:flex;flex-wrap:wrap;gap:6px">' + items + '</div>'
      : '<div style="font-size:12px;color:rgba(255,255,255,0.3);padding-top:2px">הוסף פילטרים כדי לסנן את הלוח השבועי</div>'
    ) + '</div>';
}

function getFilterModal(f) {
  const COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#ec4899','#f97316','#84cc16','#64748b'];
  const cur = f ? f.color : '#3b82f6';
  return '<div id="sch-filter-modal" style="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9500;display:flex;align-items:center;justify-content:center;padding:20px">' +
    '<div style="background:#0d2137;border:1px solid rgba(255,255,255,0.15);border-radius:14px;padding:24px;width:320px;max-width:100%;direction:rtl">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">' +
    '<h3 style="margin:0;font-size:16px;font-weight:800">' + (f ? 'עריכת פילטר' : 'פילטר חדש') + '</h3>' +
    '<button onclick="document.getElementById(\'sch-filter-modal\').remove()" style="background:none;border:none;color:rgba(255,255,255,0.5);font-size:22px;cursor:pointer;line-height:1">×</button>' +
    '</div>' +
    '<div style="display:flex;flex-direction:column;gap:14px">' +
    '<div style="display:flex;flex-direction:column;gap:6px">' +
    '<label style="font-size:12px;color:rgba(255,255,255,0.6);font-weight:700">שם הפילטר</label>' +
    '<input id="sch-filter-name" type="text" placeholder="למשל: ילדים, מבוגרים, שישי בוקר" value="' + (f ? f.name : '') + '" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:9px 12px;color:white;font-size:14px;font-family:inherit;width:100%;box-sizing:border-box">' +
    '</div>' +
    '<div style="display:flex;flex-direction:column;gap:8px">' +
    '<label style="font-size:12px;color:rgba(255,255,255,0.6);font-weight:700">צבע</label>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
    COLORS.map(c =>
      '<div onclick="window._schPickFilterColor(\'' + c + '\')" id="fclr' + c.replace('#','') + '" ' +
      'style="width:26px;height:26px;border-radius:50%;background:' + c + ';cursor:pointer;box-sizing:border-box;border:' + (c===cur?'3px solid white':'2px solid transparent') + '"></div>'
    ).join('') +
    '</div><input id="sch-filter-color" type="hidden" value="' + cur + '">' +
    '</div></div>' +
    '<div style="margin-top:20px;display:flex;gap:10px">' +
    '<button onclick="window._saveScheduleFilter(\'' + (f?f.id:'') + '\',' + (f?f.order||0:0) + ')" style="flex:1;background:#6366f1;color:white;border:none;border-radius:10px;padding:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">💾 שמור</button>' +
    '<button onclick="document.getElementById(\'sch-filter-modal\').remove()" style="background:rgba(255,255,255,0.08);color:white;border:none;border-radius:10px;padding:11px 18px;font-size:14px;cursor:pointer;font-family:inherit">ביטול</button>' +
    '</div></div></div>';
}

window.addScheduleFilter = function() {
  document.getElementById('sch-filter-modal')?.remove();
  document.body.insertAdjacentHTML('beforeend', getFilterModal(null));
};
window.editScheduleFilter = function(filterId, name, color) {
  document.getElementById('sch-filter-modal')?.remove();
  document.body.insertAdjacentHTML('beforeend', getFilterModal({id:filterId, name, color}));
};
window.deleteScheduleFilter = async function(filterId) {
  if (!confirm('למחוק פילטר זה?')) return;
  await db.ref('clubSchedule/filters/'+filterId).remove();
  loadScheduleEditor();
};
window._schPickFilterColor = function(color) {
  const inp = document.getElementById('sch-filter-color');
  if (inp) inp.value = color;
  document.querySelectorAll('[id^="fclr"]').forEach(el => {
    el.style.border = el.id === 'fclr'+color.replace('#','') ? '3px solid white' : '2px solid transparent';
  });
};
window._saveScheduleFilter = async function(filterId, order) {
  const name  = document.getElementById('sch-filter-name')?.value?.trim();
  const color = document.getElementById('sch-filter-color')?.value || '#3b82f6';
  if (!name) { alert('יש להזין שם לפילטר'); return; }
  if (filterId) {
    await db.ref('clubSchedule/filters/'+filterId).set({ name, color, order: +order });
  } else {
    const snap = await db.ref('clubSchedule/filters').once('value');
    const cnt  = Object.keys(snap.val()||{}).length;
    await db.ref('clubSchedule/filters').push({ name, color, order: cnt });
  }
  document.getElementById('sch-filter-modal')?.remove();
  loadScheduleEditor();
};

// ════════════════════════════════════════════════════════════
// SCHEDULE: WEEKLY GRID RENDERER (shared admin + public)
// ════════════════════════════════════════════════════════════
function _buildScheduleWeeklyGrid(classes, allFilters, activeFilters) {
  const DAYS  = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
  const toMin = t => { if (!t) return 0; const p=(t+':00').split(':'); return +p[0]*60+(+p[1]||0); };
  const fmtH  = m => String(Math.floor(m/60)).padStart(2,'0')+':00';
  const active = activeFilters instanceof Set ? activeFilters : new Set(Array.isArray(activeFilters)?activeFilters:[]);

  let shown = classes;
  if (active.size > 0) {
    shown = classes.filter(c => {
      const cf = c.filters || {};
      for (const fid of active) { if (cf[fid]) return true; }
      return false;
    });
  }
  if (!shown.length) return '<div style="text-align:center;padding:48px;color:rgba(255,255,255,0.4)">אין חוגים להצגה</div>';

  const colorMap = {};
  (allFilters||[]).forEach(f => { colorMap[f.id] = f.color||'#3b82f6'; });
  const CAT_COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#ec4899','#f97316'];
  const catColors = {};
  let ci = 0;
  shown.forEach(c => { if (c.categoryId && !catColors[c.categoryId]) catColors[c.categoryId]=CAT_COLORS[ci++%CAT_COLORS.length]; });

  const activeDays = DAYS.filter(d => shown.some(c => c.day===d));
  if (!activeDays.length) return '<div style="text-align:center;padding:48px;color:rgba(255,255,255,0.4)">אין חוגים להצגה</div>';

  const starts = shown.map(c => toMin(c.timeStart)).filter(Boolean);
  const ends   = shown.map(c => toMin(c.timeEnd)).filter(Boolean);
  if (!starts.length) return '<div style="text-align:center;padding:48px;color:rgba(255,255,255,0.4)">אין שעות להצגה</div>';

  const startMin = Math.floor(Math.min(...starts)/60)*60;
  const endMin   = Math.ceil(Math.max(...ends)/60)*60;
  const PX       = 1.2;
  const GRID_H   = (endMin-startMin)*PX;
  const HOUR_H   = 60*PX;

  let hourHtml = '<div style="flex-shrink:0;width:40px;padding-top:36px;box-sizing:border-box;border-left:1px solid rgba(255,255,255,0.08)">';
  for (let m=startMin; m<=endMin; m+=60) {
    hourHtml += '<div style="height:'+HOUR_H+'px;position:relative"><span style="position:absolute;top:-8px;left:0;right:4px;font-size:10px;color:rgba(255,255,255,0.4);text-align:left">'+fmtH(m)+'</span></div>';
  }
  hourHtml += '</div>';

  let daysHtml = '';
  activeDays.forEach(day => {
    const dayCls = shown.filter(c => c.day===day);
    const sorted = [...dayCls].sort((a,b) => toMin(a.timeStart)-toMin(b.timeStart));

    // Cluster-based lane assignment: each overlapping group is handled independently
    // so non-overlapping classes always get full width
    const laneOf = {}, numLanesOf = {};
    const visited = new Set();
    sorted.forEach(c => {
      if (visited.has(c.id)) return;
      // BFS to collect all classes in this overlap cluster
      const cluster = [], queue = [c];
      while (queue.length) {
        const curr = queue.shift();
        if (visited.has(curr.id)) continue;
        visited.add(curr.id);
        cluster.push(curr);
        dayCls.forEach(o => {
          if (!visited.has(o.id) && toMin(o.timeStart)<toMin(curr.timeEnd) && toMin(o.timeEnd)>toMin(curr.timeStart))
            queue.push(o);
        });
      }
      // Assign lanes within this cluster
      const cLanes = [];
      [...cluster].sort((a,b)=>toMin(a.timeStart)-toMin(b.timeStart)).forEach(cls => {
        let placed=false;
        for (let li=0;li<cLanes.length;li++) {
          if (toMin(cLanes[li][cLanes[li].length-1].timeEnd)<=toMin(cls.timeStart)) {
            cLanes[li].push(cls); laneOf[cls.id]=li; placed=true; break;
          }
        }
        if (!placed) { laneOf[cls.id]=cLanes.length; cLanes.push([cls]); }
      });
      cluster.forEach(cls => { numLanesOf[cls.id]=cLanes.length; });
    });

    daysHtml += '<div style="flex:1;min-width:120px;border-left:1px solid rgba(255,255,255,0.08)">';
    daysHtml += '<div style="height:36px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border-bottom:1px solid rgba(255,255,255,0.1)">'+day+'</div>';
    daysHtml += '<div style="position:relative;height:'+GRID_H+'px">';
    for (let m=startMin; m<=endMin; m+=60) {
      daysHtml += '<div style="position:absolute;top:'+(m-startMin)*PX+'px;left:0;right:0;border-top:1px solid rgba(255,255,255,0.05)"></div>';
    }
    dayCls.forEach(c => {
      const top      = (toMin(c.timeStart)-startMin)*PX;
      const height   = Math.max((toMin(c.timeEnd)-toMin(c.timeStart))*PX-2,16);
      const lane     = laneOf[c.id]||0;
      const numLanes = numLanesOf[c.id]||1;
      const cFilts   = Object.keys(c.filters||{}).filter(fid=>(c.filters||{})[fid]);
      const color    = (cFilts.length&&colorMap[cFilts[0]])||catColors[c.categoryId]||'#3b82f6';
      const catName  = (window._schedCats||[]).find(cat=>cat.id===c.categoryId)?.name||'';
      const fs = numLanes > 1 ? '9.5' : '11';
      const lbl = (label,val) => val ? '<span style="opacity:0.75;font-size:'+(+fs-1)+'px">'+label+': </span>'+val : '';
      const lines = [];
      if (catName)                lines.push('<div style="font-weight:800;line-height:1.35">'+catName+'</div>');
      if (c.levelLabel)           lines.push('<div style="line-height:1.35">'+lbl('רמה',c.levelLabel)+'</div>');
      if (c.ageLabel)             lines.push('<div style="line-height:1.35">'+lbl('גיל',c.ageLabel)+'</div>');
      if (c.instructor)           lines.push('<div style="line-height:1.35">'+lbl('מדריך',c.instructor)+'</div>');
      if (c.timeStart&&c.timeEnd) lines.push('<div style="line-height:1.35">'+lbl('שעות',c.timeStart+'–'+c.timeEnd)+'</div>');
      daysHtml += '<div onclick="window._weeklyClassPopup(\''+c.id+'\')" ' +
        'style="position:absolute;top:'+top+'px;left:calc('+(lane/numLanes*100)+'% + 2px);' +
        'width:calc('+(100/numLanes)+'% - 4px);height:'+height+'px;background:'+color+';' +
        'border-radius:6px;padding:3px 5px;font-size:'+fs+'px;cursor:pointer;box-sizing:border-box;overflow:hidden;' +
        'display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:white;word-break:break-word">' +
        lines.join('') +
        '</div>';
    });
    daysHtml += '</div></div>';
  });

  return '<div style="overflow-x:auto"><div style="display:flex;min-width:max-content">'+hourHtml+daysHtml+'</div></div>';
}

function _buildFilterRow(allFilters, activeFilters, toggleFn, activeColor) {
  if (!allFilters || !allFilters.length) return '';
  const active = activeFilters instanceof Set ? activeFilters : new Set();
  const allBtn = '<button onclick="'+toggleFn+'(null)" style="' +
    (active.size===0?'background:white;color:#0d2137':'background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.75)') +
    ';border:none;border-radius:20px;padding:5px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">הכל</button>';
  const btns = allFilters.map(f => {
    const on = active.has(f.id);
    return '<button onclick="'+toggleFn+'(\''+f.id+'\')" style="' +
      (on?'background:'+f.color+';color:white':'background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.75)') +
      ';border:none;border-radius:20px;padding:5px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:5px">' +
      '<span style="width:8px;height:8px;border-radius:50%;background:'+f.color+';display:inline-block;flex-shrink:0"></span>' +
      f.name+'</button>';
  }).join('');
  return '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">'+allBtn+btns+'</div>';
}

function _renderWeeklyAdminSection(allClasses, allFilters) {
  return _buildScheduleWeeklyGrid(allClasses, allFilters, new Set());
}
window._renderWeeklyAdminSection = _renderWeeklyAdminSection;

function _renderWeeklyPublicSection(allClasses, allFilters) {
  return _buildScheduleWeeklyGrid(allClasses, allFilters, new Set());
}
window._renderWeeklyPublicSection = _renderWeeklyPublicSection;

window._toggleSchFilter = function(filterId) {
  if (!window._activeSchFilters) window._activeSchFilters = new Set();
  if (filterId===null) { window._activeSchFilters.clear(); }
  else if (window._activeSchFilters.has(filterId)) { window._activeSchFilters.delete(filterId); }
  else { window._activeSchFilters.add(filterId); }
  const el = document.getElementById('schedule-editor-content');
  if (el) el.innerHTML = _renderWeeklyAdminSection(window._schedClasses||[], window._schedFilters||[]);
};

window._togglePubFilter = function(filterId) {
  if (!window._activePubFilters) window._activePubFilters = new Set();
  if (filterId===null) { window._activePubFilters.clear(); }
  else if (window._activePubFilters.has(filterId)) { window._activePubFilters.delete(filterId); }
  else { window._activePubFilters.add(filterId); }
  const el = document.getElementById('clubs-schedule-container');
  if (el) el.innerHTML = _renderWeeklyPublicSection(window._pubScheduleClasses||[], window._pubScheduleFilters||[]);
};

window._schSetView = function(view) {
  window._schedView = view;
  const onSt  = 'background:var(--bg-card);color:var(--text-primary);border:none;border-radius:6px;padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit';
  const offSt = 'background:none;color:var(--text-muted);border:none;border-radius:6px;padding:6px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit';
  const detBtn = document.getElementById('sch-view-detail');
  const wkBtn  = document.getElementById('sch-view-weekly');
  const addCatBtn = document.getElementById('sch-add-cat-btn');
  if (detBtn) detBtn.style.cssText = view==='detail'?onSt:offSt;
  if (wkBtn)  wkBtn.style.cssText  = view==='weekly'?onSt:offSt;
  if (addCatBtn) addCatBtn.style.display = view==='detail'?'':'none';
  const el = document.getElementById('schedule-editor-content');
  if (!el) return;
  if (view==='weekly') {
    el.innerHTML = _renderWeeklyAdminSection(window._schedClasses||[], window._schedFilters||[]);
  } else {
    el.innerHTML = renderDetailViewHtml(window._schedCats||[], window._schedClasses||[]);
  }
};

window._weeklyClassPopup = function(classId) {
  const all = (window._schedClasses||[]).concat(window._pubScheduleClasses||[]);
  const c = all.find(x => x.id===classId);
  if (!c) return;
  document.getElementById('weekly-popup')?.remove();
  document.body.insertAdjacentHTML('beforeend',
    '<div id="weekly-popup" onclick="if(event.target===this)this.remove()" ' +
    'style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px">' +
    '<div style="background:#0d2137;border:1px solid rgba(255,255,255,0.15);border-radius:14px;padding:24px;max-width:320px;width:100%;direction:rtl">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
    '<span style="font-size:15px;font-weight:800">'+(c.levelLabel||'חוג')+'</span>' +
    '<button onclick="document.getElementById(\'weekly-popup\').remove()" style="background:none;border:none;color:rgba(255,255,255,0.5);font-size:22px;cursor:pointer;line-height:1">×</button>' +
    '</div>' +
    '<div style="display:flex;flex-direction:column;gap:7px;font-size:13px">' +
    '<div>📅 <b>יום:</b> '+(c.day||'–')+'</div>' +
    '<div>🕐 <b>שעות:</b> '+(c.timeStart||'')+'–'+(c.timeEnd||'')+'</div>' +
    (c.ageLabel?'<div>👦 <b>גיל:</b> '+c.ageLabel+'</div>':'') +
    (c.instructor?'<div>👤 <b>מדריך:</b> '+c.instructor+'</div>':'') +
    (c.price?'<div>💰 <b>מחיר:</b> '+c.price+' ₪ לחודש</div>':'') +
    '</div></div></div>'
  );
};

function showSitePage(page) {
  document.querySelectorAll('.site-page').forEach(function(el){ el.classList.remove('active'); });
  document.querySelectorAll('.nav-tab').forEach(function(el){ el.classList.remove('active'); });
  var target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');
  var allTabs = document.querySelectorAll('.nav-tab');
  allTabs.forEach(function(tab){
    if (tab.getAttribute('onclick') && tab.getAttribute('onclick').indexOf("'" + page + "'") !== -1) {
      tab.classList.add('active');
    }
  });
  window.scrollTo(0,0);
  if (page === 'calendar') {
    _pubCalYear  = new Date().getFullYear();
    _pubCalMonth = new Date().getMonth() + 1;
    loadAndRenderPublicCal();
  }
  if (page === 'clubs') { if (window.loadPublicSchedule) loadPublicSchedule(); }
  if (page === 'home') { if (window.loadNewsCarousel) loadNewsCarousel(); }
  if (page === 'people') { if (window.loadPeopleSection) loadPeopleSection(); }
  if (page === 'home') { if (window.loadSiteContent) loadSiteContent(); }
}

function showWeeklyModal() { document.getElementById("weekly-modal").classList.add("visible"); }
function hideWeeklyModal() { document.getElementById("weekly-modal").classList.remove("visible"); }

function showInstructorsModal() {
  document.getElementById('instructors-modal').classList.add('visible');
}
function hideInstructorsModal() {
  document.getElementById('instructors-modal').classList.remove('visible');
}
function showLoginModal() {
  document.getElementById('login-error').textContent = '';
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('login-modal').classList.add('visible');
  setTimeout(() => document.getElementById('login-email').focus(), 50);
}

function hideLoginModal() {
  document.getElementById('login-modal').classList.remove('visible');
}

const CLUB_EMAIL_DOMAIN = '@chess-rishon.app';
function toFirebaseEmail(input) {
  if (!input) return '';
  return input.includes('@') ? input : input + CLUB_EMAIL_DOMAIN;
}
function loginKey(u) { return (u||'').replace(/\./g,',').replace(/#/g,'-').replace(/\$/g,'_').replace(/\[/g,'(').replace(/\]/g,')'); }

async function doLogin() {
  const raw   = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;
  let email = toFirebaseEmail(raw);
  if (!raw.includes('@')) {
    try { const snap = await db.ref('loginIndex/' + loginKey(raw)).get(); if (snap.exists()) email = snap.val(); } catch(e) {}
  }
  const errEl = document.getElementById('login-error');
  const btn   = document.getElementById('btn-login-submit');
  if (!raw || !pass) { errEl.textContent = 'יש למלא שם משתמש וסיסמה'; return; }
  btn.disabled = true;
  btn.textContent = '⏳ מתחבר...';
  errEl.textContent = '';
  try {
    await auth.signInWithEmailAndPassword(email, pass);
    hideLoginModal();
  } catch(e) {
    const msgs = {
      'auth/user-not-found': 'משתמש לא קיים',
      'auth/wrong-password': 'סיסמה שגויה',
      'auth/invalid-email': 'שם משתמש לא תקין',
      'auth/too-many-requests': 'יותר מדי ניסיונות, נסה שוב מאוחר יותר',
      'auth/invalid-credential': 'אימייל או סיסמה שגויים',
    };
    errEl.textContent = msgs[e.code] || 'שגיאת כניסה: ' + e.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'כניסה';
  }
}

async function logoutUser() {
  localStorage.removeItem('ccm_loggedIn');
  await auth.signOut();
}

async function loadUserRole(uid) {
  if (!db) { console.error('loadUserRole: db is null'); return null; }
  try {
    const snap = await db.ref(`roles/${uid}`).get();
    const val = snap.val();
    if (!val) return null;
    const normalized = {};
    Object.keys(val).forEach(k => normalized[k.trim()] = val[k]);
    return normalized;
  } catch(e) { console.error('loadUserRole error:', e); return null; }
}

function renderLandingSchedule() {
  const levels = [
    {
      icon: '♟',
      title: 'מתחילים',
      subtitle: 'לילדי גן, כיתות א–ב ומבוגרים מתחילים',
      color: '#4ade80',
      sessions: [
        { label: 'גן–א', day: 'יום ראשון', instructor: 'מאיה' },
        { label: 'מבוגרים', day: 'יום ראשון', instructor: 'ירון' },
        { label: 'גן–א מתחילים', day: 'יום חמישי', instructor: 'ירון' },
        { label: 'גן–א ממשיכים', day: 'יום חמישי', instructor: 'ירון' },
      ]
    },
    {
      icon: '♞',
      title: 'מתקדמים',
      subtitle: '1200–1600',
      color: '#60a5fa',
      sessions: [
        { label: '1200–1400', day: 'יום ראשון', instructor: 'ירון' },
        { label: '1200–1400', day: 'יום שני', instructor: 'גלב' },
        { label: '1200–1400', day: 'יום רביעי', instructor: 'גלב' },
        { label: '1400–1600', day: 'יום שני', instructor: 'גלב' },
        { label: '1400–1600', day: 'יום רביעי', instructor: 'גלב' },
      ]
    },
    {
      icon: '♛',
      title: 'מקצוענים',
      subtitle: '1600+',
      color: '#f97316',
      sessions: [
        { label: '1600–1800', day: 'יום שני', instructor: 'ויטלי' },
        { label: 'מבוגרים 1800+', day: 'יום רביעי', instructor: 'אור ברונשטיין' },
      ]
    },
  ];

  const cards = levels.map(lv => {
    const rows = lv.sessions.map(s =>
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:13px">' +
        '<span style="font-weight:600">' + s.label + '</span>' +
        '<span style="color:rgba(255,255,255,0.55);font-size:12px">' + (s.day ? s.day + ' · ' : '') + s.instructor + '</span>' +
      '</div>'
    ).join('');
    return '<div class="sched-card" style="min-width:240px;max-width:300px;flex:1">' +
      '<div style="font-size:28px;margin-bottom:8px">' + lv.icon + '</div>' +
      '<div class="sched-name" style="color:' + lv.color + ';margin-bottom:4px">' + lv.title + '</div>' +
      '<div class="sched-sub" style="color:rgba(255,255,255,0.5);font-size:12px;margin-bottom:14px">' + lv.subtitle + '</div>' +
      rows +
    '</div>';
  }).join('');

  const el = document.getElementById('landingSchedule');
  if (el) el.innerHTML = cards;
}

function initAuth() {
  if (!initFirebase()) {
    groups = ALL_GROUPS;
    currentUser = { role: 'admin', name: 'מקומי', uid: 'local', groups: {} };
    buildApp();
    return;
  }
  renderLandingSchedule();
  loadNewsCarousel();
  loadSiteContent();
  auth.onAuthStateChanged(async (firebaseUser) => {
    if (!firebaseUser) {
      // Not logged in — show landing page
      document.body.classList.remove('auto-login');
      document.getElementById('landing-page').classList.add('visible');
      document.body.classList.add('landing-active');
      document.getElementById('headerUserArea').style.display = 'none';
      document.querySelector('header').style.display = 'none';
      document.getElementById('app-layout').style.display = 'none';
      currentUser = null;
      return;
    }
    // Logged in
    let roleData = await loadUserRole(firebaseUser.uid);
    if (!roleData && db) {
      // User exists in Auth but has no roles entry — auto-create as instructor
      roleData = { role: 'instructor', email: firebaseUser.email, name: firebaseUser.email.split('@')[0] };
      try { await db.ref(`roles/${firebaseUser.uid}`).set(roleData); } catch(e) { console.warn('Could not create roles entry:', e); }
    }
    currentUser = {
      uid:        firebaseUser.uid,
      email:      firebaseUser.email,
      name:       roleData?.name       || firebaseUser.email,
      role:       roleData?.role       || 'admin',
      groups:     roleData?.groups     || {},
      teams:      roleData?.teams      || {},
      superAdmin: roleData?.superAdmin || false,
      permissions: roleData?.permissions || {},
    };
    // Filter groups by role
    console.log('role:', currentUser.role, 'groups:', JSON.stringify(currentUser.groups));
    // Show app, hide landing
    document.getElementById('landing-page').classList.remove('visible');
    document.body.classList.remove('landing-active');
    document.querySelector('header').style.display = '';
    localStorage.setItem('ccm_loggedIn', '1');
    document.body.classList.remove('auto-login');
    document.getElementById('headerUserArea').style.display = 'flex';
    document.getElementById('headerUserName').textContent = `שלום, ${currentUser.name}`;
    document.getElementById('app-layout').style.display = 'flex';
    // Build or rebuild app
    document.getElementById('tabsBar').innerHTML = '';
    document.getElementById('content').innerHTML = '';
    await initializeApp();
  });
}

function switchTab(id) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('panel-' + id);
  if (panel) panel.classList.add('active');
  const tabBtn = document.querySelector('.tab-btn[data-tab="' + id + '"]');
  if (tabBtn) tabBtn.classList.add('active');
  const catId = (window._tabCatMap && window._tabCatMap[id]) || id;
  const catBtn = document.querySelector('.cat-btn[data-tab="' + catId + '"]');
  if (catBtn) catBtn.classList.add('active');
}

function toggleSidebar(forceOpen) {
  const sidebar = document.getElementById('tabsBar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!sidebar) return;
  const isOpen = sidebar.classList.contains('sidebar-open');
  const open = forceOpen !== undefined ? forceOpen : !isOpen;
  sidebar.classList.toggle('sidebar-open', open);
  overlay?.classList.toggle('visible', open);
}
window.toggleSidebar = toggleSidebar;

function buildApp() {
if (!_useDbGroups && (!groups || groups.length === 0)) {
  groups = ALL_GROUPS.filter(g => !_deletedGroupIds.has(g.id));
}
// Filter groups for non-admin users (both Firebase and ALL_GROUPS)
if (currentUser?.role !== 'admin') {
  const allowedIds = Object.keys(currentUser?.groups || {});
  groups = groups.filter(g => {
    if (allowedIds.includes(g.id)) return true;
    // Legacy fallback: match by name via ALL_GROUPS IDs
    const legacy = ALL_GROUPS.find(ag => ag.name === g.name);
    return legacy ? allowedIds.includes(legacy.id) : false;
  });
  console.info('[ChessManager] Groups for', currentUser.name, '→', groups.map(g => g.name), '| allowedIds:', allowedIds);
}
if (!_useDbTeams && teams.length === 0) {
  teams = ALL_TEAMS.map((t, i) => ({
    id: 'default-team-' + i,
    name: t.name,
    coach: t.coach,
    coachWa: '',
    region: t.region,
    subGroups: [{ time: 'נבחרת א', players: [] }, { time: 'נבחרת ב', players: [] }]
  }));
}
// Filter teams for non-admin users
if (currentUser?.role !== 'admin') {
  const allowedTeamIds = Object.keys(currentUser?.teams || {});
  teams = teams.filter(t => allowedTeamIds.includes(t.id));
  console.info('[ChessManager] Teams for', currentUser.name, '→', teams.map(t => t.name), '| allowedTeamIds:', allowedTeamIds);
}
// Build tabs
const tabsBar = document.getElementById('tabsBar');
const content = document.getElementById('content');

// Helper: add sidebar section label
function addSidebarLabel(text) {
  const d = document.createElement('div');
  d.className = 'sidebar-section-label';
  d.textContent = text;
  tabsBar.appendChild(d);
}

// Sidebar logo area
const logoArea = document.createElement('div');
logoArea.className = 'sidebar-logo-area';
logoArea.innerHTML = '♟ מועדון שחמט ראשל"צ';
tabsBar.appendChild(logoArea);

// Home tab — first and active
const homeBtn = document.createElement('button');
homeBtn.className = 'tab-btn active';
homeBtn.dataset.tab = 'home';
homeBtn.textContent = '🏠 בית';
homeBtn.onclick = () => { switchTab('home'); document.getElementById('panel-home').innerHTML = renderDashboard(); loadAuditWidget(); loadWeeklyAttendanceAlerts().then(m => { const hp = document.getElementById('panel-home'); if(hp) { hp.innerHTML = renderDashboard(m); loadAuditWidget(); } }); };
tabsBar.appendChild(homeBtn);
const homePanel = document.createElement('div');
homePanel.className = 'tab-panel active';
homePanel.id = 'panel-home';
try { homePanel.innerHTML = renderDashboard(); } catch(e) { homePanel.innerHTML = `<div style="padding:24px;color:#c53030">שגיאה בדשבורד: ${e.message}</div>`; console.error('renderDashboard failed:', e); }
content.appendChild(homePanel);
setTimeout(() => loadAuditWidget(), 500);

if (groups.length > 0 || currentUser?.role === 'admin') {
  addSidebarLabel('חוגים');
  if (_useDbGroups && groups.length === 0) {
    // New year — no groups yet (admin only reaches here)
    const noGroupsPanel = document.createElement('div');
    noGroupsPanel.className = 'tab-panel active';
    noGroupsPanel.id = 'panel-home';
    noGroupsPanel.innerHTML = `<div style="text-align:center;padding:60px 20px;color:#a0aec0">
      <div style="font-size:48px;margin-bottom:16px">🏫</div>
      <div style="font-size:18px;font-weight:700;color:#2d3748;margin-bottom:8px">שנה חדשה — אין חוגים עדיין</div>
      <div style="font-size:14px;margin-bottom:24px">צור את החוגים לשנה החדשה בלשונית ⚙️ הגדרות</div>
      <button onclick="switchTab('settings')" style="background:#2b6cb0;color:white;border:none;border-radius:8px;padding:10px 24px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">⚙️ עבור להגדרות</button>
    </div>`;
    const existingHome = content.querySelector('#panel-home');
    if (existingHome) existingHome.remove();
    content.appendChild(noGroupsPanel);
  } else {
    groups.forEach((group, i) => {
      if (!group.id || !group.name) return; // skip corrupted entries
      const btn = document.createElement('button');
      btn.className = 'tab-btn';
      btn.dataset.tab = group.id;
      btn.textContent = group.name;
      btn.onclick = () => switchTab(group.id);
      tabsBar.appendChild(btn);

      const panel = document.createElement('div');
      panel.className = 'tab-panel';
      panel.id = 'panel-' + group.id;
      try { panel.innerHTML = renderGroup(group, i); }
      catch(e) { panel.innerHTML = `<div style="padding:24px;color:#c53030">שגיאה בטעינת החוג: ${e.message}</div>`; console.error('renderGroup failed:', group, e); }
      content.appendChild(panel);
    });
  }
}

// ── נבחרות ──────────────────────────────────────
if (teams.length > 0 || currentUser.role === 'admin') {
  addSidebarLabel('נבחרות');
  if (teams.length === 0) {
    const emptyBtn = document.createElement('button');
    emptyBtn.className = 'tab-btn'; emptyBtn.dataset.tab = 'teams-empty';
    emptyBtn.style.cssText = 'color:#a0aec0;font-size:12px;cursor:default;font-style:italic';
    emptyBtn.textContent = 'אין נבחרות עדיין';
    tabsBar.appendChild(emptyBtn);
  } else {
    // Group by region
    const regions = [...new Set(teams.map(t => t.region || ''))].filter(Boolean);
    const noRegion = teams.filter(t => !t.region);
    const addTeamTabs = (teamList) => {
      teamList.forEach((team, _) => {
        const i = teams.indexOf(team);
        const btn = document.createElement('button');
        btn.className = 'tab-btn'; btn.dataset.tab = 'team-' + team.id;
        btn.textContent = '🏅 ' + team.name + (team.coach ? ' — ' + team.coach : '');
        btn.onclick = () => switchTab('team-' + team.id);
        tabsBar.appendChild(btn);
        const panel = document.createElement('div');
        panel.className = 'tab-panel'; panel.id = 'panel-team-' + team.id;
        panel.innerHTML = renderTeamGroup(team, i);
        content.appendChild(panel);
      });
    };
    regions.forEach(region => {
      // Sub-label for each region
      const regionLabel = document.createElement('div');
      regionLabel.style.cssText = 'padding:10px 16px 3px;font-size:10px;font-weight:700;letter-spacing:0.8px;color:var(--text-muted);text-transform:uppercase';
      regionLabel.textContent = '― ' + region + ' ―';
      tabsBar.appendChild(regionLabel);
      addTeamTabs(teams.filter(t => t.region === region));
    });
    if (noRegion.length > 0) addTeamTabs(noRegion);
  }
}

// ── ניהול ──────────────────────────────────────
addSidebarLabel('ניהול');

if (hasTabPerm('attendance')) {
const attBtn = document.createElement('button');
attBtn.className = 'tab-btn'; attBtn.dataset.tab = 'attendance'; attBtn.textContent = '🗓 נוכחות';
attBtn.onclick = () => {
  switchTab('attendance');
  if (groups.length > 0) { loadAttendanceDates(); loadAttendanceFromFirebase(); }
  if (groups.length > 0 && teams.length > 0) {
    document.getElementById('att-content-groups').style.display='';
    document.getElementById('att-content-teams').style.display='none';
  }
  if (teams.length > 0 && groups.length === 0) loadTeamAttendance();
};
tabsBar.appendChild(attBtn);
const attPanel = document.createElement('div');
attPanel.className = 'tab-panel'; attPanel.id = 'panel-attendance'; attPanel.innerHTML = renderAttendancePanel();
content.appendChild(attPanel);
}

if (hasTabPerm('payments')) {
const payBtn = document.createElement('button');
payBtn.className = 'tab-btn'; payBtn.dataset.tab = 'payments'; payBtn.textContent = '💳 תשלומים';
payBtn.onclick = () => { switchTab('payments'); document.getElementById('panel-payments').innerHTML = renderPaymentsPanel(); };
tabsBar.appendChild(payBtn);
const payPanel = document.createElement('div');
payPanel.className = 'tab-panel'; payPanel.id = 'panel-payments'; payPanel.innerHTML = renderPaymentsPanel();
content.appendChild(payPanel);
}

if (hasTabPerm('reports')) {
const repBtn = document.createElement('button');
repBtn.className = 'tab-btn'; repBtn.dataset.tab = 'reports'; repBtn.textContent = '📊 דוחות';
repBtn.onclick = () => { switchTab('reports'); if (groups.length > 0) loadReportsData(); else loadTeamReportsData(); };
tabsBar.appendChild(repBtn);
const repPanel = document.createElement('div');
repPanel.className = 'tab-panel'; repPanel.id = 'panel-reports'; repPanel.innerHTML = renderReportsPanel();
content.appendChild(repPanel);
}

if (hasTabPerm('calendar')) {
const calBtn = document.createElement('button');
calBtn.className = 'tab-btn'; calBtn.dataset.tab = 'calendar'; calBtn.textContent = '📅 לוח שנה';
calBtn.onclick = () => { switchTab('calendar'); document.getElementById('panel-calendar').innerHTML = renderCalendarPanel(); };
tabsBar.appendChild(calBtn);
const calPanel = document.createElement('div');
calPanel.className = 'tab-panel'; calPanel.id = 'panel-calendar'; calPanel.innerHTML = renderCalendarPanel();
content.appendChild(calPanel);
}

// ── מדריך ────────────────────────────────────────
addSidebarLabel('עזרה');
const guideBtn = document.createElement('button');
guideBtn.className = 'tab-btn'; guideBtn.dataset.tab = 'guide'; guideBtn.textContent = '❓ מדריך למדריך';
guideBtn.onclick = () => switchTab('guide');
tabsBar.appendChild(guideBtn);
const guidePanel = document.createElement('div');
guidePanel.className = 'tab-panel'; guidePanel.id = 'panel-guide';
guidePanel.innerHTML = renderGuidePanel();
content.appendChild(guidePanel);

if (currentUser?.role === 'admin') {
  // ── ליגות ─────────────────────────────────────
  addSidebarLabel('ליגות');

  const leagueAdultsBtn = document.createElement('button');
  leagueAdultsBtn.className = 'tab-btn'; leagueAdultsBtn.dataset.tab = 'league-adults'; leagueAdultsBtn.textContent = '♟ בוגרים';
  leagueAdultsBtn.onclick = () => { switchTab('league-adults'); loadClubTeams().then(renderLeagueTypePanels); };
  tabsBar.appendChild(leagueAdultsBtn);
  const leagueAdultsPanel = document.createElement('div');
  const makeSyncBar = (type, suffix) => `
    <div id="sync-bar-${suffix}" style="margin-bottom:16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <button id="btn-sync-${suffix}" onclick="syncAllTeamsData('${type}')"
        style="background:#2b6cb0;color:white;border:none;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
        🔄 סנכרן קבוצות ${type} מהאיגוד
      </button>
      <span id="sync-status-${suffix}" style="font-size:12px;color:#718096"></span>
    </div>`;

  leagueAdultsPanel.className = 'tab-panel'; leagueAdultsPanel.id = 'panel-league-adults';
  leagueAdultsPanel.innerHTML = `<div style="padding:20px">${makeSyncBar('בוגרים','adults')}<div id="lteams-בוגרים"><div style="color:#a0aec0;font-size:13px;padding:8px 0">טוען...</div></div></div>`;
  content.appendChild(leagueAdultsPanel);

  const leagueWomenBtn = document.createElement('button');
  leagueWomenBtn.className = 'tab-btn'; leagueWomenBtn.dataset.tab = 'league-women'; leagueWomenBtn.textContent = '♛ נשים';
  leagueWomenBtn.onclick = () => { switchTab('league-women'); loadClubTeams().then(renderLeagueTypePanels); };
  tabsBar.appendChild(leagueWomenBtn);
  const leagueWomenPanel = document.createElement('div');
  leagueWomenPanel.className = 'tab-panel'; leagueWomenPanel.id = 'panel-league-women';
  leagueWomenPanel.innerHTML = `<div style="padding:20px">${makeSyncBar('נשים','women')}<div id="lteams-נשים"><div style="color:#a0aec0;font-size:13px;padding:8px 0">טוען...</div></div></div>`;
  content.appendChild(leagueWomenPanel);

  const leagueYouthBtn = document.createElement('button');
  leagueYouthBtn.className = 'tab-btn'; leagueYouthBtn.dataset.tab = 'league-youth'; leagueYouthBtn.textContent = '🎓 נוער';
  leagueYouthBtn.onclick = () => { switchTab('league-youth'); loadClubTeams().then(renderLeagueTypePanels); };
  tabsBar.appendChild(leagueYouthBtn);
  const leagueYouthPanel = document.createElement('div');
  leagueYouthPanel.className = 'tab-panel'; leagueYouthPanel.id = 'panel-league-youth';
  leagueYouthPanel.innerHTML = `<div style="padding:20px">${makeSyncBar('נוער','youth')}<div id="lteams-נוער"><div style="color:#a0aec0;font-size:13px;padding:8px 0">טוען...</div></div></div>`;
  content.appendChild(leagueYouthPanel);


  const leagueStarsBtn = document.createElement('button');
  leagueStarsBtn.className = 'tab-btn'; leagueStarsBtn.dataset.tab = 'league-stars'; leagueStarsBtn.textContent = '⭐ מצטייני הליגות';
  leagueStarsBtn.onclick = () => { switchTab('league-stars'); loadLeagueStars(); };
  tabsBar.appendChild(leagueStarsBtn);
  const leagueStarsPanel = document.createElement('div');
  leagueStarsPanel.className = 'tab-panel'; leagueStarsPanel.id = 'panel-league-stars';
  leagueStarsPanel.innerHTML = '<div style="padding:20px" id="league-stars-content"><div style="color:#a0aec0;font-size:13px;padding:8px 0">טוען...</div></div>';
  content.appendChild(leagueStarsPanel);
  const satBtn = document.createElement('button');
  satBtn.className = 'tab-btn'; satBtn.dataset.tab = 'saturday'; satBtn.textContent = '🏅 מפגשי ליגה';
  satBtn.onclick = () => { switchTab('saturday'); loadClubTeams().then(renderLeagueTypePanels); loadSatSchedule(); };
  tabsBar.appendChild(satBtn);
  const satPanel = document.createElement('div');
  satPanel.className = 'tab-panel'; satPanel.id = 'panel-saturday'; satPanel.innerHTML = buildSatLeaguesHTML();
  content.appendChild(satPanel);

  // ── תחרויות ─────────────────────────────────────
  addSidebarLabel('תחרויות');

  const fridayBtn = document.createElement('button');
  fridayBtn.className = 'tab-btn'; fridayBtn.dataset.tab = 'friday'; fridayBtn.textContent = '♟ ליגות שישי';
  fridayBtn.onclick = () => { switchTab('friday'); loadFridayLeague(_fridayActiveLeague); };
  tabsBar.appendChild(fridayBtn);
  const fridayPanel = document.createElement('div');
  fridayPanel.className = 'tab-panel'; fridayPanel.id = 'panel-friday'; fridayPanel.innerHTML = renderFridayPanel();
  content.appendChild(fridayPanel);

  const tournBtn = document.createElement('button');
  tournBtn.className = 'tab-btn'; tournBtn.dataset.tab = 'club-tournaments'; tournBtn.textContent = '🏆 תחרויות';
  tournBtn.onclick = () => { switchTab('club-tournaments'); loadTournaments(); };
  tabsBar.appendChild(tournBtn);
  const tournPanel = document.createElement('div');
  tournPanel.className = 'tab-panel'; tournPanel.id = 'panel-club-tournaments'; tournPanel.innerHTML = buildTournamentsHTML();
  content.appendChild(tournPanel);

  // ── גנים ──────────────────────────────────────
  addSidebarLabel('גנים');

  const prospectsBtn = document.createElement('button');
  prospectsBtn.className = 'tab-btn'; prospectsBtn.dataset.tab = 'prospects'; prospectsBtn.textContent = '🌟 מצטייני גנים';
  prospectsBtn.onclick = () => { switchTab('prospects'); loadProspects(); };
  tabsBar.appendChild(prospectsBtn);
  const prospectsPanel = document.createElement('div');
  prospectsPanel.className = 'tab-panel'; prospectsPanel.id = 'panel-prospects'; prospectsPanel.innerHTML = buildProspectsHTML();
  content.appendChild(prospectsPanel);

  // ── שחקנים ──────────────────────────────────────
  addSidebarLabel('שחקנים');

  const youthBtn = document.createElement('button');
  youthBtn.className = 'tab-btn'; youthBtn.dataset.tab = 'youth-players'; youthBtn.textContent = '👦 שחקני נוער';
  youthBtn.onclick = () => { switchTab('youth-players'); loadYouthPlayers(); };
  tabsBar.appendChild(youthBtn);
  const youthPanel = document.createElement('div');
  youthPanel.className = 'tab-panel'; youthPanel.id = 'panel-youth-players';
  youthPanel.innerHTML = buildYouthPlayersHTML();
  content.appendChild(youthPanel);
}

if (currentUser?.role === 'admin') {
// ── כלים ────────────────────────────────────────
addSidebarLabel('כלים');

const campsBtn = document.createElement('button');
campsBtn.className = 'tab-btn'; campsBtn.dataset.tab = 'camps'; campsBtn.textContent = '🏕️ מחנות';
campsBtn.onclick = () => { switchTab('camps'); loadDbCamps().then(loadCampPlayers).then(() => { document.getElementById('panel-camps').innerHTML = renderCampsPanel(); }); };
tabsBar.appendChild(campsBtn);
const campsPanel = document.createElement('div');
campsPanel.className = 'tab-panel'; campsPanel.id = 'panel-camps'; campsPanel.innerHTML = '<div style="padding:32px;text-align:center;color:#888;">לחץ על הלשונית לטעינת הנתונים</div>';
content.appendChild(campsPanel);

const hoursBtn = document.createElement('button');
hoursBtn.className = 'tab-btn'; hoursBtn.dataset.tab = 'hours'; hoursBtn.textContent = '⏱️ שעות';
hoursBtn.onclick = () => { switchTab('hours'); loadHoursHistory(); };
tabsBar.appendChild(hoursBtn);
const hoursPanel = document.createElement('div');
hoursPanel.className = 'tab-panel'; hoursPanel.id = 'panel-hours'; hoursPanel.innerHTML = renderHoursPanel();
content.appendChild(hoursPanel);
}

if (currentUser?.role === 'admin') {
  addSidebarLabel('מערכת');


  const auditBtn = document.createElement('button');
  auditBtn.className = 'tab-btn'; auditBtn.dataset.tab = 'audit'; auditBtn.textContent = '📊 פעילות מדריכים';
  auditBtn.onclick = () => { switchTab('audit'); loadAuditLog(); };
  tabsBar.appendChild(auditBtn);
  const auditPanel = document.createElement('div');
  auditPanel.className = 'tab-panel'; auditPanel.id = 'panel-audit';
  auditPanel.innerHTML = '<div style="padding:32px;text-align:center;color:#888;">לחץ על הלשונית לטעינת הנתונים</div>';
  content.appendChild(auditPanel);

  
  // Schedule editor tab
  const scheduleEditorBtn = document.createElement('button');
  scheduleEditorBtn.className = 'tab-btn'; scheduleEditorBtn.dataset.tab = 'schedule-editor';
  scheduleEditorBtn.textContent = '📅 לוח חוגים';
  scheduleEditorBtn.onclick = () => { switchTab('schedule-editor'); loadScheduleEditor(); };
  tabsBar.appendChild(scheduleEditorBtn);
  const scheduleEditorPanel = document.createElement('div');
  scheduleEditorPanel.className = 'tab-panel'; scheduleEditorPanel.id = 'panel-schedule-editor';
  scheduleEditorPanel.innerHTML = renderScheduleEditorPanel();
  content.appendChild(scheduleEditorPanel);
  const siteContentBtn = document.createElement('button');
  siteContentBtn.className = 'tab-btn'; siteContentBtn.dataset.tab = 'site-content';
  siteContentBtn.textContent = '📝 עמוד הבית';
  siteContentBtn.onclick = () => { switchTab('site-content'); loadSiteContentAdmin(); };
  tabsBar.appendChild(siteContentBtn);
  const siteContentPanel = document.createElement('div');
  siteContentPanel.className = 'tab-panel'; siteContentPanel.id = 'panel-site-content';
  siteContentPanel.innerHTML = '<div id="site-content-admin-container" style="padding:20px;direction:rtl;max-width:900px"></div>';
  content.appendChild(siteContentPanel);
  const newsAdminBtn = document.createElement('button');
  newsAdminBtn.className = 'tab-btn'; newsAdminBtn.dataset.tab = 'news-posts';
  newsAdminBtn.textContent = '📰 כתבות';
  newsAdminBtn.onclick = () => { switchTab('news-posts'); loadNewsAdmin(); };
  tabsBar.appendChild(newsAdminBtn);
  const newsAdminPanel = document.createElement('div');
  newsAdminPanel.className = 'tab-panel'; newsAdminPanel.id = 'panel-news-posts';
  newsAdminPanel.innerHTML = '<div id="news-admin-container" style="padding:20px;direction:rtl;max-width:800px"></div>';
  content.appendChild(newsAdminPanel);
  const peopleAdminBtn = document.createElement('button');
  peopleAdminBtn.className = 'tab-btn'; peopleAdminBtn.dataset.tab = 'club-people';
  peopleAdminBtn.textContent = '👥 אנשי המועדון';
  peopleAdminBtn.onclick = () => { switchTab('club-people'); loadPeopleAdmin(); };
  tabsBar.appendChild(peopleAdminBtn);
  const peopleAdminPanel = document.createElement('div');
  peopleAdminPanel.className = 'tab-panel'; peopleAdminPanel.id = 'panel-club-people';
  peopleAdminPanel.innerHTML = '<div id="people-admin-container" style="padding:20px;direction:rtl;max-width:900px"></div>';
  content.appendChild(peopleAdminPanel);
const settingsBtn = document.createElement('button');
  settingsBtn.className = 'tab-btn'; settingsBtn.dataset.tab = 'settings'; settingsBtn.textContent = '⚙️ הגדרות';
  settingsBtn.onclick = () => { switchTab('settings'); };
  tabsBar.appendChild(settingsBtn);
  const settingsPanel = document.createElement('div');
  settingsPanel.className = 'tab-panel'; settingsPanel.id = 'panel-settings'; settingsPanel.innerHTML = renderSettingsPanel();
  content.appendChild(settingsPanel);

  // Monthly calendar tab (admin only)
  if (currentUser?.role === 'admin') {
    const calBtn = document.createElement('button');
    calBtn.className = 'tab-btn';
    calBtn.dataset.tab = 'monthly-cal';
    calBtn.textContent = '📅 לוח חודשי';
    calBtn.onclick = () => { switchTab('monthly-cal'); loadAdminCalendarPanel(); };
    tabsBar.appendChild(calBtn);
    const calPanel = document.createElement('div');
    calPanel.className = 'tab-panel';
    calPanel.id = 'panel-monthly-cal';
    calPanel.innerHTML = '<div style="padding:20px;color:#a0aec0">טוען...</div>';
    content.appendChild(calPanel);
  const tcBtn = document.createElement('button');
  tcBtn.className = 'tab-btn'; tcBtn.dataset.tab = 'tourn-cal';
  tcBtn.textContent = '📅 גאנט תחרויות';
  tcBtn.onclick = () => { switchTab('tourn-cal'); initTournCal(); };
  tabsBar.appendChild(tcBtn);
  const tcPanel = document.createElement('div');
  tcPanel.className = 'tab-panel'; tcPanel.id = 'panel-tourn-cal';
  tcPanel.innerHTML = '<div id="tourn-cal-root" style="padding:20px;direction:rtl;max-width:1100px;margin:0 auto"></div>';
  content.appendChild(tcPanel);
  }
}

  initData();
} // end buildApp

function buildTopNav() {
  const tabsBar = document.getElementById('tabsBar');
  const content = document.getElementById('content');
  if (!tabsBar || !content) return;
  const isAdmin = currentUser?.role === 'admin';

  // Move existing tabsBar children (tab-btns + labels) to a hidden store so
  // their onclick handlers remain callable, but they don't appear in the top bar
  let store = document.getElementById('_tab-btn-store');
  if (!store) {
    store = document.createElement('div');
    store.id = '_tab-btn-store';
    store.style.display = 'none';
    document.body.appendChild(store);
  } else {
    store.innerHTML = '';
  }
  while (tabsBar.firstChild) store.appendChild(tabsBar.firstChild);

  // Helper to fire a tab's existing init logic via its hidden tab-btn onclick
  window._firTabInit = function(id) {
    const btn = document.querySelector('.tab-btn[data-tab="' + id + '"]');
    if (btn && btn.onclick) btn.onclick.call(btn);
    else switchTab(id);
  };

  // Build tab→category map
  window._tabCatMap = {};
  const mapCat = (tabIds, catKey) => tabIds.forEach(id => { window._tabCatMap[id] = catKey; });
  window._tabCatMap['home'] = 'home';
  window._tabCatMap['settings'] = 'settings';
  window._tabCatMap['guide'] = 'cat-management';

  const catDefs = [];

  // Home (direct)
  catDefs.push({ key: 'home', label: '🏠 בית', direct: 'home' });

  // Groups hub
  if (groups.length > 0 || isAdmin) {
    const groupCards = groups.map(g => ({ icon: '🏫', label: g.name, tab: g.id }));
    groups.forEach(g => { window._tabCatMap[g.id] = 'cat-groups'; });
    catDefs.push({ key: 'groups', label: '🏫 חוגים', cards: groupCards });
  }

  // Teams hub — grouped by coach
  if (teams.length > 0 || isAdmin) {
    teams.forEach(t => { window._tabCatMap['team-' + t.id] = 'cat-nteams'; });
    if (isAdmin) {
      // Group by coach name
      const coachMap = {};
      const noCoach = [];
      teams.forEach(t => {
        const card = { icon: '🏅', label: t.name, tab: 'team-' + t.id };
        const coach = (t.coach || '').trim();
        if (coach) {
          if (!coachMap[coach]) coachMap[coach] = [];
          coachMap[coach].push(card);
        } else {
          noCoach.push(card);
        }
      });
      const cardGroups = Object.entries(coachMap).map(([coach, cards]) => ({ label: coach, cards }));
      if (noCoach.length > 0) cardGroups.push({ label: '', cards: noCoach });
      catDefs.push({ key: 'nteams', label: '🏅 נבחרות', cardGroups });
    } else {
      const teamCards = teams.map(t => ({ icon: '🏅', label: t.name, tab: 'team-' + t.id }));
      catDefs.push({ key: 'nteams', label: '🏅 נבחרות', cards: teamCards });
    }
  }

  // Management hub
  const managCards = [];
  if (hasTabPerm('attendance')) managCards.push({ icon: '🗓', label: 'נוכחות', tab: 'attendance' });
  if (hasTabPerm('payments')) managCards.push({ icon: '💳', label: 'תשלומים', tab: 'payments' });
  if (hasTabPerm('reports')) managCards.push({ icon: '📊', label: 'דוחות', tab: 'reports' });
  if (hasTabPerm('calendar')) managCards.push({ icon: '📅', label: 'לוח שנה', tab: 'calendar' });
  if (isAdmin) managCards.push({ icon: '⏱️', label: 'שעות', tab: 'hours' });
  managCards.push({ icon: '❓', label: 'מדריך', tab: 'guide' });
  mapCat(managCards.map(c => c.tab), 'cat-management');
  catDefs.push({ key: 'management', label: '⚙️ ניהול שוטף', cards: managCards });

  // Leagues/Tournaments hub
  const leagueCards = [];
  if (isAdmin || hasTabPerm('club-tournaments')) leagueCards.push({ icon: '🏆', label: 'תחרויות', tab: 'club-tournaments' });
  if (isAdmin || hasTabPerm('friday')) leagueCards.push({ icon: '♟', label: 'ליגות שישי', tab: 'friday' });
  if (isAdmin || hasTabPerm('league-adults')) leagueCards.push({ icon: '♟', label: 'ליגות בוגרים', tab: 'league-adults' });
  if (isAdmin || hasTabPerm('league-women')) leagueCards.push({ icon: '♛', label: 'ליגות נשים', tab: 'league-women' });
  if (isAdmin || hasTabPerm('league-youth')) leagueCards.push({ icon: '🎓', label: 'ליגות נוער', tab: 'league-youth' });
  if (isAdmin || hasTabPerm('league-stars')) leagueCards.push({ icon: '⭐', label: 'מצטיינים', tab: 'league-stars' });
  if (isAdmin || hasTabPerm('saturday')) leagueCards.push({ icon: '🏅', label: 'מפגשי ליגה', tab: 'saturday' });
  if (leagueCards.length > 0) {
    mapCat(leagueCards.map(c => c.tab), 'cat-leagues');
    catDefs.push({ key: 'leagues', label: '🏆 תחרויות', cards: leagueCards });
  }

  // Players hub
  const playerCards = [];
  if (isAdmin || hasTabPerm('youth-players')) playerCards.push({ icon: '👦', label: 'שחקני נוער', tab: 'youth-players' });
  if (isAdmin || hasTabPerm('prospects')) playerCards.push({ icon: '🌟', label: 'מצטייני גנים', tab: 'prospects' });
  if (playerCards.length > 0) {
    mapCat(playerCards.map(c => c.tab), 'cat-players');
    catDefs.push({ key: 'players', label: '👦 שחקנים', cards: playerCards });
  }

  // System hub
  const systemCards = [];
  if (isAdmin || hasTabPerm('schedule-editor')) systemCards.push({ icon: '📅', label: 'לוח חוגים', tab: 'schedule-editor' });
  if (isAdmin || hasTabPerm('site-content')) systemCards.push({ icon: '📝', label: 'עמוד הבית', tab: 'site-content' });
  if (isAdmin || hasTabPerm('news-posts')) systemCards.push({ icon: '📰', label: 'כתבות', tab: 'news-posts' });
  if (isAdmin || hasTabPerm('club-people')) systemCards.push({ icon: '👥', label: 'אנשי המועדון', tab: 'club-people' });
  if (isAdmin || hasTabPerm('audit')) systemCards.push({ icon: '📊', label: 'פעילות מדריכים', tab: 'audit' });
  if (isAdmin || hasTabPerm('tourn-cal')) systemCards.push({ icon: '📅', label: 'גאנט תחרויות', tab: 'tourn-cal' });
  if (isAdmin || hasTabPerm('monthly-cal')) systemCards.push({ icon: '📅', label: 'לוח חודשי', tab: 'monthly-cal' });
  if (systemCards.length > 0) {
    mapCat(systemCards.map(c => c.tab), 'cat-system');
    catDefs.push({ key: 'system', label: '🖥 מערכת', cards: systemCards });
  }

  // Settings (direct) — admin only
  if (isAdmin) catDefs.push({ key: 'settings', label: '⚙️ הגדרות', direct: 'settings' });

  // Map hub panels to their own cat key for self-highlighting
  catDefs.filter(c => !c.direct).forEach(c => { window._tabCatMap['cat-' + c.key] = 'cat-' + c.key; });

  // Build category buttons in tabsBar
  catDefs.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-btn';
    btn.textContent = cat.label;
    if (cat.direct) {
      btn.dataset.tab = cat.direct;
      btn.onclick = () => {
        switchTab(cat.direct);
        // settings sections are opened via modals; no pre-load needed
      };
    } else {
      btn.dataset.tab = 'cat-' + cat.key;
      btn.onclick = () => switchTab('cat-' + cat.key);
    }
    tabsBar.appendChild(btn);
  });

  // Theme toggle button — pinned to left end of top nav
  const themeBtn = document.createElement('button');
  themeBtn.id = 'portal-theme-toggle';
  const isLight = document.body.classList.contains('light-mode');
  themeBtn.textContent = isLight ? '🌙' : '☀️';
  themeBtn.title = isLight ? 'מצב כהה' : 'מצב בהיר';
  themeBtn.style.cssText = 'margin-right:auto;background:none;border:none;cursor:pointer;font-size:18px;padding:4px 8px;border-radius:8px;line-height:1;flex-shrink:0;opacity:0.7;transition:opacity 0.15s';
  themeBtn.onmouseenter = () => { themeBtn.style.opacity = '1'; };
  themeBtn.onmouseleave = () => { themeBtn.style.opacity = '0.7'; };
  themeBtn.onclick = () => {
    const light = document.body.classList.toggle('light-mode');
    themeBtn.textContent = light ? '🌙' : '☀️';
    themeBtn.title = light ? 'מצב כהה' : 'מצב בהיר';
    localStorage.setItem('theme', light ? 'light' : 'dark');
    const pubBtn = document.getElementById('theme-toggle');
    if (pubBtn) pubBtn.textContent = light ? '🌙 מצב כהה' : '☀️ מצב בהיר';
  };
  tabsBar.appendChild(themeBtn);

  // Helper: render cards grid HTML
  const renderCards = (cards) =>
    '<div class="hub-grid" style="padding-top:10px">' +
    cards.map(card =>
      '<button class="hub-card" onclick="window._firTabInit(\'' + card.tab + '\')">' +
      '<div class="hub-card-icon">' + card.icon + '</div>' +
      '<div class="hub-card-title">' + card.label + '</div>' +
      '</button>'
    ).join('') +
    '</div>';

  // Build hub panels and append to content
  catDefs.filter(c => !c.direct).forEach(cat => {
    if (document.getElementById('panel-cat-' + cat.key)) return;
    const hubPanel = document.createElement('div');
    hubPanel.className = 'tab-panel';
    hubPanel.id = 'panel-cat-' + cat.key;
    let bodyHtml;
    if (cat.cardGroups) {
      bodyHtml = cat.cardGroups.map(g =>
        '<div style="margin-bottom:28px">' +
        (g.label ? '<div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:4px;direction:rtl">🧑‍🏫 ' + g.label + '</div>' : '') +
        renderCards(g.cards) +
        '</div>'
      ).join('');
    } else {
      bodyHtml = renderCards(cat.cards || []);
    }
    hubPanel.innerHTML =
      '<div style="font-size:22px;font-weight:800;color:var(--text-primary);direction:rtl;margin-bottom:16px">' + cat.label + '</div>' +
      bodyHtml;
    content.appendChild(hubPanel);
  });

  // Start on home
  switchTab('home');
}

function injectPermissionTabs() {
  if (!currentUser || currentUser.role === 'admin') return;
  const perms = currentUser.permissions || {};
  const grantedExtras = PERMISSION_TABS.filter(t => !t.instructorDefault && hasTabPerm(t.key)).map(t => t.key);
  if (grantedExtras.length === 0) return;

  const tabsBar = document.getElementById('tabsBar');
  const content = document.getElementById('content');

  function addTab(key, text, onclick, panelHtml) {
    const btn = document.createElement('button');
    btn.className = 'tab-btn'; btn.dataset.tab = key; btn.textContent = text;
    btn.onclick = onclick;
    tabsBar.appendChild(btn);
    const panel = document.createElement('div');
    panel.className = 'tab-panel'; panel.id = 'panel-' + key;
    panel.innerHTML = panelHtml || '<div style="padding:20px;color:#a0aec0">טוען...</div>';
    content.appendChild(panel);
  }

  const addLabel = (lbl) => {
    const d = document.createElement('div');
    d.style.cssText = 'padding:20px 16px 6px;font-size:10px;font-weight:700;letter-spacing:0.8px;color:var(--text-muted);text-transform:uppercase;user-select:none';
    d.textContent = lbl; tabsBar.appendChild(d);
  };

  const makeSyncBar = (type, suffix) =>
    `<div id="sync-bar-${suffix}" style="margin-bottom:16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <button id="btn-sync-${suffix}" onclick="syncAllTeamsData('${type}')" style="background:#2b6cb0;color:white;border:none;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">🔄 סנכרן קבוצות ${type} מהאיגוד</button>
      <span id="sync-status-${suffix}" style="font-size:12px;color:#718096"></span></div>`;

  const hasLeague = ['league-adults','league-women','league-youth','league-stars','saturday'].some(k => grantedExtras.includes(k));
  const hasTourn  = ['friday','club-tournaments'].some(k => grantedExtras.includes(k));
  const hasGanim  = grantedExtras.includes('prospects');
  const hasShach  = grantedExtras.includes('youth-players');
  const hasKlim   = grantedExtras.includes('hours');
  const hasCamps  = grantedExtras.includes('camps');
  const hasMaarechet = ['audit','schedule-editor','site-content','news-posts','club-people','tourn-cal','monthly-cal'].some(k => grantedExtras.includes(k));

  if (hasLeague) {
    addLabel('ליגות');
    if (grantedExtras.includes('league-adults')) {
      addTab('league-adults','♟ בוגרים', () => { switchTab('league-adults'); loadClubTeams().then(renderLeagueTypePanels); },
        `<div style="padding:20px">${makeSyncBar('בוגרים','adults')}<div id="lteams-בוגרים"><div style="color:#a0aec0;font-size:13px">טוען...</div></div></div>`);
    }
    if (grantedExtras.includes('league-women')) {
      addTab('league-women','♛ נשים', () => { switchTab('league-women'); loadClubTeams().then(renderLeagueTypePanels); },
        `<div style="padding:20px">${makeSyncBar('נשים','women')}<div id="lteams-נשים"><div style="color:#a0aec0;font-size:13px">טוען...</div></div></div>`);
    }
    if (grantedExtras.includes('league-youth')) {
      addTab('league-youth','🎓 נוער', () => { switchTab('league-youth'); loadClubTeams().then(renderLeagueTypePanels); },
        `<div style="padding:20px">${makeSyncBar('נוער','youth')}<div id="lteams-נוער"><div style="color:#a0aec0;font-size:13px">טוען...</div></div></div>`);
    }
    if (grantedExtras.includes('league-stars')) {
      addTab('league-stars','⭐ מצטייני הליגות', () => { switchTab('league-stars'); loadLeagueStars(); },
        '<div style="padding:20px" id="league-stars-content"><div style="color:#a0aec0;font-size:13px">טוען...</div></div>');
    }
    if (grantedExtras.includes('saturday')) {
      addTab('saturday','🏅 מפגשי ליגה', () => { switchTab('saturday'); loadClubTeams().then(renderLeagueTypePanels); loadSatSchedule(); }, buildSatLeaguesHTML());
    }
  }

  if (hasTourn) {
    addLabel('תחרויות');
    if (grantedExtras.includes('friday')) {
      addTab('friday','♟ ליגות שישי', () => { switchTab('friday'); loadFridayLeague(_fridayActiveLeague); }, renderFridayPanel());
    }
    if (grantedExtras.includes('club-tournaments')) {
      addTab('club-tournaments','🏆 תחרויות', () => { switchTab('club-tournaments'); loadTournaments(); }, buildTournamentsHTML());
    }
  }

  if (hasGanim) {
    addLabel('גנים');
    addTab('prospects','🌟 מצטייני גנים', () => { switchTab('prospects'); loadProspects(); }, buildProspectsHTML());
  }

  if (hasShach) {
    addLabel('שחקנים');
    addTab('youth-players','👦 שחקני נוער', () => { switchTab('youth-players'); loadYouthPlayers(); }, buildYouthPlayersHTML());
  }

  if (hasKlim || hasCamps) {
    addLabel('כלים');
    if (hasCamps) {
      addTab('camps','🏕️ מחנות', () => { switchTab('camps'); loadDbCamps().then(loadCampPlayers).then(() => { document.getElementById('panel-camps').innerHTML = renderCampsPanel(); }); }, '<div style="padding:32px;text-align:center;color:#888;">לחץ על הלשונית לטעינת הנתונים</div>');
    }
    if (hasKlim) {
      addTab('hours','⏱️ שעות', () => { switchTab('hours'); loadHoursHistory(); }, renderHoursPanel());
    }
  }

  if (hasMaarechet) {
    addLabel('מערכת');
    if (grantedExtras.includes('audit')) {
      addTab('audit','📊 פעילות מדריכים', () => { switchTab('audit'); loadAuditLog(); },
        '<div style="padding:32px;text-align:center;color:#888;">לחץ על הלשונית לטעינת הנתונים</div>');
    }
    if (grantedExtras.includes('schedule-editor')) {
      addTab('schedule-editor','📅 לוח חוגים', () => { switchTab('schedule-editor'); loadScheduleEditor(); }, renderScheduleEditorPanel());
    }
    if (grantedExtras.includes('site-content')) {
      addTab('site-content','📝 עמוד הבית', () => { switchTab('site-content'); loadSiteContentAdmin(); },
        '<div id="site-content-admin-container" style="padding:20px;direction:rtl;max-width:900px"></div>');
    }
    if (grantedExtras.includes('news-posts')) {
      addTab('news-posts','📰 כתבות', () => { switchTab('news-posts'); loadNewsAdmin(); },
        '<div id="news-admin-container" style="padding:20px;direction:rtl;max-width:800px"></div>');
    }
    if (grantedExtras.includes('club-people')) {
      addTab('club-people','👥 אנשי המועדון', () => { switchTab('club-people'); loadPeopleAdmin(); },
        '<div id="people-admin-container" style="padding:20px;direction:rtl;max-width:900px"></div>');
    }
    if (grantedExtras.includes('tourn-cal')) {
      addTab('tourn-cal','📅 גאנט תחרויות', () => { switchTab('tourn-cal'); initTournCal(); },
        '<div id="tourn-cal-root" style="padding:20px;direction:rtl;max-width:1100px;margin:0 auto"></div>');
    }
    if (grantedExtras.includes('monthly-cal')) {
      addTab('monthly-cal','📅 לוח חודשי', () => { switchTab('monthly-cal'); loadAdminCalendarPanel(); },
        '<div style="padding:20px;color:#a0aec0">טוען...</div>');
    }
  }
}


