// ========== TOURNAMENT CALENDAR ==========
const TC_MONTHS=[{y:2026,m:7,label:'אוגוסט 2026'},{y:2026,m:8,label:'ספטמבר 2026'},{y:2026,m:9,label:'אוקטובר 2026'},{y:2026,m:10,label:'נובמבר 2026'},{y:2026,m:11,label:'דצמבר 2026'},{y:2027,m:0,label:'ינואר 2027'},{y:2027,m:1,label:'פברואר 2027'},{y:2027,m:2,label:'מרץ 2027'},{y:2027,m:3,label:'אפריל 2027'},{y:2027,m:4,label:'מאי 2027'},{y:2027,m:5,label:'יוני 2027'},{y:2027,m:6,label:'יולי 2027'},{y:2027,m:7,label:'אוגוסט 2027'}];
const TC_WEEK=['א','ב','ג','ד','ה','ו','ש'];
const TC_DEFAULT_CATS=[{id:'cat1',color:'#5b6fa8',label:'ליגה נוער ע+א'},{id:'cat2',color:'#4a8fb8',label:'ליגה נוער מ'},{id:'cat3',color:'#c98a2b',label:'ימי שלישי / פסטיבל'},{id:'cat4',color:'#2f7d6c',label:'חג'},{id:'cat5',color:'#a8503f',label:'תחרות / אליפות'},{id:'cat6',color:'#8a5ba8',label:'מוקדמות'},{id:'cat7',color:'#6a8a3f',label:'כללי'}];
const TC_DEF={'2026-08-08':[{id:'tc0a',text:'בזק - לזכר שי מיכאלי',color:'#c98a2b'}],'2026-08-15':[{id:'tc0b',text:'אופציה לתחרות בלתי מזורגים',color:'#c98a2b'}],'2026-08-22':[{id:'tc0c',text:'אירוע סיום ליגות',color:'#c98a2b'}],'2026-08-23':[{id:'tc0d',text:'פסטיבל - יום ראשון',color:'#c98a2b'}],'2026-08-24':[{id:'tc0e',text:'פסטיבל - יום שני',color:'#c98a2b'}],'2026-08-25':[{id:'tc0f',text:'פסטיבל - יום שלישי',color:'#c98a2b'}],'2026-08-26':[{id:'tc0g',text:'פסטיבל - יום רביעי',color:'#c98a2b'}],'2026-08-27':[{id:'tc0h',text:'פסטיבל - יום חמישי',color:'#c98a2b'}],'2026-09-01':[{id:'tc1',text:'סיום פסטיבל',color:'#6a8a3f'}],'2026-09-03':[{id:'tc2',text:'לבדוק לוח משחקים - תחרויות 1500+',color:'#6a8a3f'}],'2026-09-05':[{id:'tc3',text:'ליגת נוער (ע+א) - סיבוב 1',color:'#5b6fa8'},{id:'tc4',text:'לבדוק לוח - תחרויות',color:'#6a8a3f'}],'2026-09-08':[{id:'tc5',text:'ימי שלישי - סיבוב 1',color:'#c98a2b'}],'2026-09-10':[{id:'tc6',text:'ליגת נוער (ע+א) - סיבוב 1',color:'#5b6fa8'}],'2026-09-11':[{id:'tc7',text:'אליפות עד גיל 9 ו-13',color:'#a8503f'},{id:'tc8',text:'חג - ערב ראש השנה',color:'#2f7d6c'}],'2026-09-12':[{id:'tc9',text:'חג - ראש השנה',color:'#2f7d6c'},{id:'tc10',text:'תחרות משפחות לזכר סבא',color:'#a8503f'}],'2026-09-15':[{id:'tc11',text:'ימי שלישי - סיבוב שני',color:'#c98a2b'}],'2026-09-17':[{id:'tc12',text:'ליגת נוער (ע+א) - סיבוב 2',color:'#5b6fa8'}],'2026-09-19':[{id:'tc13',text:'ליגת נוער (ע+א) - סיבוב 2',color:'#5b6fa8'}],'2026-09-20':[{id:'tc14',text:'חג - ערב יום כיפור',color:'#2f7d6c'}],'2026-09-21':[{id:'tc15',text:'חג - יום כיפור',color:'#2f7d6c'}],'2026-09-22':[{id:'tc16',text:'ימי שלישי - סיבוב 3',color:'#c98a2b'}],'2026-09-24':[{id:'tc17',text:'חלון לתחרויות 1500+',color:'#c98a2b'}],'2026-09-26':[{id:'tc18',text:'חג - סוכות',color:'#2f7d6c'}],'2026-09-29':[{id:'tc19',text:'ימי שלישי - סיבוב השלמות',color:'#c98a2b'}],'2026-10-02':[{id:'tc20',text:'סבב סתיו במועדון - גיל 6',color:'#6a8a3f'}],'2026-10-03':[{id:'tc21',text:'שלמה צליל',color:'#6a8a3f'}],'2026-10-06':[{id:'tc22',text:'ימי שלישי - סיבוב 4',color:'#c98a2b'}],'2026-10-08':[{id:'tc23',text:'ליגת נוער (ע+א) - סיבוב 3',color:'#5b6fa8'},{id:'tc24',text:'ליגת נוער מ - סיבוב 1',color:'#4a8fb8'}],'2026-10-10':[{id:'tc25',text:'ליגת נוער (ע+א) - סיבוב 3',color:'#5b6fa8'},{id:'tc26',text:'ליגת נוער מ - סיבוב 1',color:'#4a8fb8'}],'2026-10-13':[{id:'tc27',text:'ימי שלישי - סיבוב 5',color:'#c98a2b'}],'2026-10-15':[{id:'tc28',text:'ליגת נוער (ע+א) - סיבוב 4',color:'#5b6fa8'},{id:'tc29',text:'ליגת נוער מ - סיבוב 2',color:'#4a8fb8'}],'2026-10-17':[{id:'tc30',text:'ליגת נוער (ע+א) - סיבוב 4',color:'#5b6fa8'},{id:'tc31',text:'ליגת נוער מ - סיבוב 2',color:'#4a8fb8'}],'2026-10-20':[{id:'tc32',text:'ימי שלישי - סיבוב 6',color:'#c98a2b'}],'2026-10-22':[{id:'tc33',text:'חלון לתחרויות 1500+',color:'#c98a2b'}],'2026-10-24':[{id:'tc34',text:'שי זרמי',color:'#6a8a3f'}],'2026-10-27':[{id:'tc35',text:'ימי שלישי - סיבוב 7',color:'#c98a2b'},{id:'tc36',text:'יום בחירות',color:'#6a8a3f'}],'2026-10-29':[{id:'tc37',text:'ליגת נוער (ע+א) - סיבוב 5',color:'#5b6fa8'},{id:'tc38',text:'ליגת נוער מ - סיבוב 3',color:'#4a8fb8'}],'2026-10-31':[{id:'tc39',text:'ליגת נוער ע+א - סיבוב 5',color:'#5b6fa8'},{id:'tc40',text:'ליגת נוער מ - סיבוב 3',color:'#4a8fb8'}],'2026-11-03':[{id:'tc41',text:'אקטיבי סיום סבב',color:'#6a8a3f'}],'2026-11-07':[{id:'tc42',text:'גיבוש לילדי גן',color:'#6a8a3f'}],'2026-11-10':[{id:'tc43',text:'ימי שלישי חורף - סיבוב 1',color:'#c98a2b'}],'2026-11-12':[{id:'tc44',text:'ליגת נוער מ - סיבוב 4',color:'#4a8fb8'}],'2026-11-14':[{id:'tc45',text:'ליגת נוער מ - סיבוב 4',color:'#4a8fb8'}],'2026-11-17':[{id:'tc46',text:'ימי שלישי חורף - סיבוב 2',color:'#c98a2b'}],'2026-11-19':[{id:'tc47',text:'ליגת נוער ע+א - סיבוב 6',color:'#5b6fa8'},{id:'tc48',text:'ליגת נוער מ - סיבוב 5',color:'#4a8fb8'}],'2026-11-21':[{id:'tc49',text:'ליגת נוער ע+א - סיבוב 6',color:'#5b6fa8'},{id:'tc50',text:'ליגת נוער מ - סיבוב 5',color:'#4a8fb8'}],'2026-11-24':[{id:'tc51',text:'ימי שלישי חורף - סיבוב 3',color:'#c98a2b'}],'2026-11-28':[{id:'tc52',text:'חצאי גמר נבחרות',color:'#a8503f'}],'2026-12-01':[{id:'tc53',text:'ימי שלישי חורף - סיבוב 4',color:'#c98a2b'}],'2026-12-03':[{id:'tc54',text:'ליגת נוער ע+א - סיבוב 7 אחרון',color:'#5b6fa8'},{id:'tc55',text:'ליגת נוער מ - סיבוב 6',color:'#4a8fb8'}],'2026-12-05':[{id:'tc56',text:'ליגת נוער ע+א ואחרון - סיבוב 7',color:'#5b6fa8'},{id:'tc57',text:'ליגת נוער מ - סיבוב 6',color:'#4a8fb8'}],'2026-12-06':[{id:'tc58',text:'מוקדמות נוער - 1',color:'#8a5ba8'}],'2026-12-07':[{id:'tc59',text:'מוקדמות נוער - 2',color:'#8a5ba8'}],'2026-12-08':[{id:'tc60',text:'ימי שלישי חורף - סיבוב השלמות',color:'#c98a2b'},{id:'tc61',text:'מוקדמות נוער - 3',color:'#8a5ba8'}],'2026-12-11':[{id:'tc62',text:'אליפות נערות ארצית',color:'#a8503f'}],'2026-12-12':[{id:'tc63',text:'גמר נבחרות',color:'#a8503f'}],'2026-12-15':[{id:'tc64',text:'ימי שלישי חורף - סיבוב 5',color:'#c98a2b'}],'2026-12-17':[{id:'tc65',text:'ליגת נוער מ - סיבוב 7 אחרון',color:'#4a8fb8'}],'2026-12-19':[{id:'tc66',text:'ליגת נוער מ - סיבוב 7 ואחרון',color:'#4a8fb8'}],'2026-12-22':[{id:'tc67',text:'ימי שלישי חורף - סיבוב 6',color:'#c98a2b'}],'2026-12-24':[{id:'tc68',text:'ליגת נוער ע+א - מבחנים',color:'#5b6fa8'}],'2026-12-26':[{id:'tc69',text:'ליגת נוער ע+א - מבחנים',color:'#5b6fa8'}],'2026-12-29':[{id:'tc70',text:'ימי שלישי חורף - סיבוב 7',color:'#c98a2b'}]};
let _tcEvents={},_tcCats=TC_DEFAULT_CATS.map(c=>({...c})),_tcMonth=0,_tcLoaded=false,_tcOpenDate=null,_tcEditId=null,_tcSelColor=TC_DEFAULT_CATS[0].color;
function tcKey(y,m,d){return y+'-'+(m+1).toString().padStart(2,'0')+'-'+d.toString().padStart(2,'0');}
function tcUid(){return 'tc'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);}
async function initTournCal(){
  const root=document.getElementById('tourn-cal-root'); if(!root) return;
  if(!_tcLoaded){
    root.innerHTML='<div style="text-align:center;padding:40px;opacity:.5">טוען...</div>';
    try{
      const catSnap=await db.ref('tcCategories').get();
      if(catSnap.exists()&&Array.isArray(catSnap.val())) _tcCats=catSnap.val();
      const snap=await db.ref('tournamentCalendar').get();
      if(snap.exists()&&snap.val()){
        const data=snap.val();
        Object.keys(data).forEach(k=>{ const v=data[k]; _tcEvents[k]=Array.isArray(v)?v:Object.values(v); });
      }
      let merged=false;
      Object.keys(TC_DEF).forEach(k=>{ if(!_tcEvents[k]){ _tcEvents[k]=JSON.parse(JSON.stringify(TC_DEF[k])); merged=true; } });
      if(merged||!snap.exists()) await db.ref('tournamentCalendar').set(_tcEvents);
      // Overlay Israeli holidays (auto-fetched, never persisted here) so they always
      // show up without anyone having to add them by hand.
      try {
        if (typeof getIsraeliHolidays === 'function') {
          const tcYears = [...new Set(TC_MONTHS.map(mo => mo.y))];
          const holidays = await getIsraeliHolidays(Math.min(...tcYears), Math.max(...tcYears));
          holidays.forEach(h => {
            if (!_tcEvents[h.date]) _tcEvents[h.date] = [];
            const alreadyThere = _tcEvents[h.date].some(ev => ev.text && ev.text.includes(h.title));
            // Holidays first, then club-added events/tournaments, on days that have both.
            if (!alreadyThere) _tcEvents[h.date].unshift({ id: 'hol-' + h.date + '-' + h.title, text: h.title, color: h.color });
          });
        }
      } catch(e) { console.warn('tournament calendar holiday overlay failed', e); }
      _tcLoaded=true;
    }catch(e){ root.innerHTML='<div style="color:#fc8181;padding:20px">שגיאה: '+e.message+'</div>'; return; }
  }
  renderTournCal();
}
function renderTournCal(){
  const root=document.getElementById('tourn-cal-root'); if(!root) return;
  const td=new Date(),todayKey=tcKey(td.getFullYear(),td.getMonth(),td.getDate());
  let tabsHtml='<div class="tc-month-tabs">';
  TC_MONTHS.forEach((mo,i)=>{ tabsHtml+='<button class="tc-month-tab'+(i===_tcMonth?' active':'')+'" onclick="window.tcGoMonth('+i+')">'+mo.label+'</button>'; });
  tabsHtml+='</div>';
  const mo=TC_MONTHS[_tcMonth];
  const navHtml='<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">'+
    '<button onclick="window.tcGoMonth('+(_tcMonth-1)+')" '+(_tcMonth===0?'disabled':'')+' style="background:rgba(255,255,255,.1);border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;font-size:20px;color:white;display:flex;align-items:center;justify-content:center">‹</button>'+
    '<h2 style="margin:0;font-size:22px;font-weight:800">'+mo.label+'</h2>'+
    '<button onclick="window.tcGoMonth('+(_tcMonth+1)+')" '+(_tcMonth===12?'disabled':'')+' style="background:rgba(255,255,255,.1);border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;font-size:20px;color:white;display:flex;align-items:center;justify-content:center">›</button>'+
  '</div>';
  let wkHtml='<div class="tc-grid" style="margin-bottom:6px">';
  TC_WEEK.forEach(d=>{ wkHtml+='<div class="tc-week-hdr">'+d+'</div>'; });
  wkHtml+='</div>';
  const firstDay=new Date(mo.y,mo.m,1).getDay();
  const daysInMonth=new Date(mo.y,mo.m+1,0).getDate();
  const prevDays=new Date(mo.y,mo.m,0).getDate();
  let grid='<div class="tc-grid">';
  for(let i=0;i<firstDay;i++) grid+='<div class="tc-day outside"><div class="tc-day-num" style="opacity:.25">'+(prevDays-firstDay+i+1)+'</div></div>';
  for(let d=1;d<=daysInMonth;d++){
    const key=tcKey(mo.y,mo.m,d);
    const dow=new Date(mo.y,mo.m,d).getDay();
    const evts=_tcEvents[key]||[];
    const wkBg=(dow===6||dow===5)?'background:rgba(249,115,22,.05);':'';
    grid+='<div class="tc-day'+(key===todayKey?' today':'')+'" style="'+wkBg+'" onclick="window.openTCDay(\''+key+'\')">';
    grid+='<div class="tc-day-num">'+d+'</div>';
    evts.slice(0,3).forEach(ev=>{ grid+='<div class="tc-chip" style="background:'+ev.color+'">'+ev.text+'</div>'; });
    if(evts.length>3) grid+='<div style="font-size:9px;opacity:.45;padding:1px 2px">+עוד '+(evts.length-3)+'</div>';
    grid+='</div>';
  }
  const trail=(7-(firstDay+daysInMonth)%7)%7;
  for(let i=1;i<=trail;i++) grid+='<div class="tc-day outside"><div class="tc-day-num" style="opacity:.25">'+i+'</div></div>';
  grid+='</div>';
  const legend='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:18px;padding-top:14px;border-top:1px solid rgba(255,255,255,.08);align-items:center">'+
    _tcCats.map(c=>'<span style="display:flex;align-items:center;gap:5px;font-size:11px;opacity:.8"><span style="width:11px;height:11px;border-radius:3px;background:'+c.color+';flex-shrink:0"></span>'+c.label+'</span>').join('')+
    '<button onclick="window.openCatManager()" style="margin-right:auto;background:rgba(255,255,255,.1);border:none;border-radius:8px;padding:4px 10px;cursor:pointer;color:white;font-size:11px;font-family:inherit">⚙️ קטגוריות</button>'+
  '</div>';
  root.innerHTML=tabsHtml+navHtml+wkHtml+grid+legend;
}
window.tcGoMonth=function(i){ if(i<0||i>12)return; _tcMonth=i; renderTournCal(); };
window.openTCDay=function(dateKey){
  _tcOpenDate=dateKey; _tcEditId=null; _tcSelColor=_tcCats[0]?.color||'#5b6fa8';
  const parts=dateKey.split('-');
  const mNames=['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
  const label=parseInt(parts[2])+' ב'+mNames[parseInt(parts[1])-1]+' '+parts[0];
  function buildOv(){
    document.querySelector('.tc-ov')?.remove();
    const evts=_tcEvents[_tcOpenDate]||[];
    const editEv=_tcEditId?evts.find(e=>e.id===_tcEditId):null;
    const selCol=editEv?editEv.color:_tcSelColor;
    const ov=document.createElement('div');
    ov.className='tc-ov';
    ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px';
    ov.onclick=e=>{if(e.target===ov)ov.remove();};
    const evHtml=evts.map(e=>'<div style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.07);border-radius:8px;padding:7px 10px;margin-bottom:6px">'+
      '<span style="width:11px;height:11px;border-radius:3px;background:'+e.color+';flex-shrink:0"></span>'+
      '<span style="flex:1;font-size:13px">'+e.text+'</span>'+
      '<button onclick="window.tcStartEdit(\''+e.id+'\')" style="background:none;border:none;cursor:pointer;font-size:12px;opacity:.7;padding:2px 4px">✏️</button>'+
      '<button onclick="window.tcDelEv(\''+e.id+'\')" style="background:none;border:none;cursor:pointer;color:#fc8181;font-size:13px;padding:2px 4px">✕</button>'+
    '</div>').join('');
    const catPills=_tcCats.map(c=>'<button onclick="window.tcPickCol(\''+c.color+'\')" style="display:flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;border:2px solid '+(c.color===selCol?'white':'transparent')+';background:'+c.color+';color:white;font-size:11px;cursor:pointer;font-family:inherit;margin:2px;white-space:nowrap">'+c.label+'</button>').join('');
    const inputVal=editEv?editEv.text.replace(/&/g,'&amp;').replace(/"/g,'&quot;'):'';
    const btnRow=_tcEditId
      ?'<button onclick="window.tcSaveEdit()" style="flex:1;background:#f97316;color:white;border:none;border-radius:8px;padding:9px;cursor:pointer;font-weight:700;font-family:inherit;font-size:14px">💾 עדכן</button><button onclick="window.tcCancelEdit()" style="background:rgba(255,255,255,.1);color:inherit;border:none;border-radius:8px;padding:9px 14px;cursor:pointer;font-family:inherit">ביטול</button>'
      :'<button onclick="window.tcAddEv()" style="flex:1;background:#f97316;color:white;border:none;border-radius:8px;padding:9px;cursor:pointer;font-weight:700;font-family:inherit;font-size:14px">➕ הוסף</button>';
    ov.innerHTML='<div style="background:#1e2736;border-radius:16px;width:400px;max-width:96vw;padding:22px;direction:rtl;color:white;max-height:88vh;overflow-y:auto">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">'+
        '<h3 style="margin:0;font-size:16px;font-weight:800">📅 '+label+'</h3>'+
        '<button onclick="document.querySelector(\'.tc-ov\').remove()" style="background:none;border:none;cursor:pointer;font-size:22px;opacity:.5;color:white;line-height:1">✕</button>'+
      '</div>'+
      '<div style="margin-bottom:12px">'+(evHtml||'<div style="opacity:.4;font-size:13px;text-align:center;padding:8px">אין אירועים</div>')+'</div>'+
      '<div style="font-size:12px;opacity:.6;margin-bottom:6px">'+(_tcEditId?'✏️ ערוך אירוע':'➕ הוסף אירוע חדש')+'</div>'+
      '<input id="tc-inp" value="'+inputVal+'" placeholder="שם האירוע..." style="width:100%;padding:9px 11px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:white;font-family:inherit;font-size:14px;box-sizing:border-box;direction:rtl;margin-bottom:10px">'+
      '<div style="display:flex;flex-wrap:wrap;margin-bottom:14px">'+catPills+'</div>'+
      '<div style="display:flex;gap:8px">'+btnRow+'</div>'+
    '</div>';
    document.body.appendChild(ov);
    setTimeout(()=>document.getElementById('tc-inp')?.focus(),40);
    window._tcRebuildOv=buildOv;
  }
  buildOv();
};
window.tcPickCol=function(c){ _tcSelColor=c; if(_tcEditId){ const ev=(_tcEvents[_tcOpenDate]||[]).find(e=>e.id===_tcEditId); if(ev) ev.color=c; } window._tcRebuildOv&&window._tcRebuildOv(); };
window.tcAddEv=async function(){
  const t=(document.getElementById('tc-inp')?.value||'').trim(); if(!t) return;
  if(!_tcEvents[_tcOpenDate]) _tcEvents[_tcOpenDate]=[];
  const ev={id:tcUid(),text:t,color:_tcSelColor};
  _tcEvents[_tcOpenDate].push(ev);
  try{ await db.ref('tournamentCalendar/'+_tcOpenDate).set(_tcEvents[_tcOpenDate]); }catch(e){ showToast('❌ '+e.message); return; }
  renderTournCal(); window._tcRebuildOv&&window._tcRebuildOv();
};
window.tcDelEv=async function(id){
  if(!_tcEvents[_tcOpenDate]) return;
  _tcEvents[_tcOpenDate]=(_tcEvents[_tcOpenDate]||[]).filter(e=>e.id!==id);
  try{
    if(!_tcEvents[_tcOpenDate].length){ await db.ref('tournamentCalendar/'+_tcOpenDate).remove(); delete _tcEvents[_tcOpenDate]; }
    else await db.ref('tournamentCalendar/'+_tcOpenDate).set(_tcEvents[_tcOpenDate]);
  }catch(e){ showToast('❌ '+e.message); return; }
  renderTournCal(); window._tcRebuildOv&&window._tcRebuildOv();
};
window.tcStartEdit=function(id){ _tcEditId=id; const ev=(_tcEvents[_tcOpenDate]||[]).find(e=>e.id===id); if(ev) _tcSelColor=ev.color; window._tcRebuildOv&&window._tcRebuildOv(); };
window.tcCancelEdit=function(){ _tcEditId=null; window._tcRebuildOv&&window._tcRebuildOv(); };
window.tcSaveEdit=async function(){
  const t=(document.getElementById('tc-inp')?.value||'').trim(); if(!t) return;
  const evts=_tcEvents[_tcOpenDate]||[]; const ev=evts.find(e=>e.id===_tcEditId); if(!ev) return;
  ev.text=t; ev.color=_tcSelColor;
  try{ await db.ref('tournamentCalendar/'+_tcOpenDate).set(evts); }catch(e){ showToast('❌ '+e.message); return; }
  _tcEditId=null; renderTournCal(); window._tcRebuildOv&&window._tcRebuildOv();
};
window.openCatManager=function(){
  document.querySelector('.tc-catmgr')?.remove();
  function buildCatOv(){
    document.querySelector('.tc-catmgr')?.remove();
    const ov=document.createElement('div');
    ov.className='tc-catmgr';
    ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:10000;padding:20px';
    ov.onclick=e=>{if(e.target===ov)ov.remove();};
    const catRows=_tcCats.map((c,i)=>'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'+
      '<input type="color" value="'+c.color+'" onchange="window.tcCatColor('+i+',this.value)" style="width:32px;height:32px;border:none;border-radius:6px;cursor:pointer;padding:2px;background:none;flex-shrink:0">'+
      '<input type="text" value="'+c.label.replace(/"/g,'&quot;')+'" onchange="window.tcCatLabel('+i+',this.value)" placeholder="שם קטגוריה" style="flex:1;padding:7px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:white;font-family:inherit;font-size:13px;direction:rtl">'+
      '<button onclick="window.tcDelCat('+i+')" style="background:rgba(252,129,129,.15);border:none;border-radius:8px;padding:6px 10px;cursor:pointer;color:#fc8181;font-size:13px">✕</button>'+
    '</div>').join('');
    ov.innerHTML='<div style="background:#1e2736;border-radius:16px;width:420px;max-width:96vw;padding:22px;direction:rtl;color:white;max-height:88vh;overflow-y:auto">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">'+
        '<h3 style="margin:0;font-size:16px;font-weight:800">⚙️ ניהול קטגוריות</h3>'+
        '<button onclick="document.querySelector(\'.tc-catmgr\').remove()" style="background:none;border:none;cursor:pointer;font-size:22px;opacity:.5;color:white">✕</button>'+
      '</div>'+
      '<div id="tc-cat-list">'+catRows+'</div>'+
      '<div style="border-top:1px solid rgba(255,255,255,.1);margin-top:14px;padding-top:14px">'+
        '<div style="font-size:12px;opacity:.6;margin-bottom:8px">➕ קטגוריה חדשה</div>'+
        '<div style="display:flex;gap:8px;align-items:center">'+
          '<input type="color" id="tc-new-cat-color" value="#5b6fa8" style="width:32px;height:32px;border:none;border-radius:6px;cursor:pointer;padding:2px;background:none;flex-shrink:0">'+
          '<input type="text" id="tc-new-cat-label" placeholder="שם הקטגוריה..." style="flex:1;padding:7px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:white;font-family:inherit;font-size:13px;direction:rtl">'+
          '<button onclick="window.tcAddCat()" style="background:#f97316;color:white;border:none;border-radius:8px;padding:7px 14px;cursor:pointer;font-family:inherit;font-weight:700">הוסף</button>'+
        '</div>'+
      '</div>'+
    '</div>';
    document.body.appendChild(ov);
    window._tcRebuildCatOv=buildCatOv;
  }
  buildCatOv();
};
window.tcCatColor=function(i,c){ _tcCats[i].color=c; window.tcSaveCats(); };
window.tcCatLabel=function(i,v){ _tcCats[i].label=v; window.tcSaveCats(); };
window.tcDelCat=function(i){ _tcCats.splice(i,1); window.tcSaveCats(); window._tcRebuildCatOv&&window._tcRebuildCatOv(); renderTournCal(); };
window.tcAddCat=async function(){
  const label=(document.getElementById('tc-new-cat-label')?.value||'').trim(); if(!label) return;
  const color=document.getElementById('tc-new-cat-color')?.value||'#5b6fa8';
  _tcCats.push({id:'cat'+Date.now(),color,label});
  await window.tcSaveCats();
  window._tcRebuildCatOv&&window._tcRebuildCatOv();
  renderTournCal();
};
window.tcSaveCats=async function(){
  try{ await db.ref('tcCategories').set(_tcCats); }catch(e){ showToast('❌ '+e.message); }
};

// ===== FRIDAY LEAGUES =====
function getFridaysBetween(start, end) {
  const dates = [];
  const d = new Date(start);
  while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
  const endDate = new Date(end);
  while (d <= endDate) {
    dates.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 7);
  }
  return dates;
}

function getLastFriday() {
  const d = new Date();
  while (d.getDay() !== 5) d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}
const FRIDAY_LEAGUES = [
  { id: 'fourth', name: 'ליגה רביעית', color: '#276749' },
  { id: 'third',  name: 'ליגה שלישית', color: '#2b6cb0' },
  { id: 'second', name: 'ליגה שנייה',  color: '#6b46c1' },
  { id: 'first',  name: 'ליגה ראשונה', color: '#c05621' },
];
let _fridayActiveLeague = 'fourth';
let _fridayData = {};
let _fridaySubTab = {}; // { leagueId: 'players' | 'tournament' }

function renderFridayPanel() {
  return `
    <div class="att-card" style="max-width:100%">
      <div class="att-card-header">🏆 ימי שישי — ליגות בלתי מדורגות</div>
      <div style="display:flex;gap:0;border-bottom:2px solid #e2e8f0;overflow-x:auto;justify-content:space-between;align-items:flex-end">
        <div style="display:flex;gap:0">
          ${FRIDAY_LEAGUES.map(l => `
            <button onclick="switchFridayLeague('${l.id}')" id="fl-tab-${l.id}"
              style="padding:12px 20px;border:none;background:none;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;border-bottom:3px solid ${l.id===_fridayActiveLeague?l.color:'transparent'};color:${l.id===_fridayActiveLeague?l.color:'#718096'};margin-bottom:-2px">
              ${l.name}
            </button>`).join('')}
        </div>
        <button onclick="switchFridayLeague('reports')" id="fl-tab-reports"
          style="padding:12px 20px;border:none;background:none;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;border-bottom:3px solid ${'reports'===_fridayActiveLeague?'#6b46c1':'transparent'};color:${'reports'===_fridayActiveLeague?'#6b46c1':'#718096'};margin-bottom:-2px">
          📊 דוחות
        </button>
      </div>
      <div id="friday-league-content" style="padding:20px">
        <div style="text-align:center;color:#a0aec0;padding:20px">טוען...</div>
      </div>
    </div>`;
}

function switchFridayLeague(id) {
  _fridayActiveLeague = id;
  const allTabs = [...FRIDAY_LEAGUES.map(l => ({ id: l.id, color: l.color })), { id: 'reports', color: '#6b46c1' }];
  allTabs.forEach(t => {
    const tab = document.getElementById('fl-tab-' + t.id);
    if (!tab) return;
    tab.style.borderBottomColor = t.id === id ? t.color : 'transparent';
    tab.style.color = t.id === id ? t.color : '#718096';
  });
  if (id === 'reports') { loadFridayReports(); return; }
  loadFridayLeague(id);
}

async function loadFridayLeague(leagueId) {
  const content = document.getElementById('friday-league-content');
  if (!content) return;
  content.innerHTML = '<div style="text-align:center;color:#a0aec0;padding:20px">טוען...</div>';
  try {
    const snap = await db.ref('fridayLeagues/' + leagueId).get();
    _fridayData[leagueId] = snap.val() || {};
    renderFridayLeagueContent(leagueId, _fridayData[leagueId]);
  } catch(e) { content.innerHTML = `<div style="color:#c53030;padding:16px">שגיאה: ${e.message}</div>`; }
}

function getResult(v) { return v == null ? null : (typeof v === 'object' ? v.result : String(v)); }
function getGameDate(v) { return v != null && typeof v === 'object' ? v.date : null; }

function renderFridayLeagueContent(leagueId, data) {
  const content = document.getElementById('friday-league-content');
  if (!content) return;
  const league = FRIDAY_LEAGUES.find(l => l.id === leagueId);
  const subTab = _fridaySubTab[leagueId] || 'players';
  const subTabBar = `
    <div style="display:flex;gap:0;border-bottom:2px solid #e2e8f0;margin-bottom:16px">
      <button onclick="switchFridaySubTab('${leagueId}','players')" style="padding:10px 18px;border:none;background:none;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;border-bottom:3px solid ${subTab==='players'?league.color:'transparent'};color:${subTab==='players'?league.color:'#718096'};margin-bottom:-2px">👥 משתתפים</button>
      <button onclick="switchFridaySubTab('${leagueId}','tournament')" style="padding:10px 18px;border:none;background:none;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;border-bottom:3px solid ${subTab==='tournament'?league.color:'transparent'};color:${subTab==='tournament'?league.color:'#718096'};margin-bottom:-2px">♟️ טבלת ליגה</button>
    </div>`;
  if (subTab === 'tournament') {
    content.innerHTML = subTabBar + renderFridayTournamentView(leagueId, data);
    return;
  }
  const players = data.players ? Object.entries(data.players).map(([id,p]) => ({id,...p})) : [];
  const dates = data.dates ? Object.values(data.dates).sort() : [];

  const dateHeaders = dates.map(d => {
    const dd = new Date(d);
    return `<th style="text-align:center;min-width:46px;font-size:11px;padding:4px 2px;border-bottom:2px solid #e2e8f0;background:#f7fafc;font-weight:700;color:#4a5568">
      <div>${dd.getDate()}/${dd.getMonth()+1}</div>
      <button onclick="removeFridayDate('${leagueId}','${d}')" title="הסר תאריך" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:10px;padding:0;line-height:1">✕</button>
    </th>`;
  }).join('');

  const playerRows = players.map(p => {
    const att = p.attendance || {};
    const presentCount = dates.filter(d => att[d]).length;
    const payments = p.payments ? Object.values(p.payments) : [];
    const totalPaid = payments.reduce((s,pay) => s+(pay.amount||0), 0);
    const attCells = dates.map(d => `
      <td style="text-align:center;padding:6px 4px" onclick="event.stopPropagation()">
        <button onclick="toggleFridayAttendance('${leagueId}','${p.id}','${d}')"
          style="width:28px;height:28px;border-radius:50%;border:none;cursor:pointer;font-size:13px;background:${att[d]?'#c6f6d5':'#fed7d7'};color:${att[d]?'#276749':'#c53030'}">
          ${att[d]?'✓':'✗'}
        </button>
      </td>`).join('');
    return `<tr style="border-bottom:1px solid #f0f4f8;cursor:pointer" onclick="openFridayPlayerProfile('${leagueId}','${p.id}')">
      <td style="padding:10px 12px">
        <div style="font-size:14px;font-weight:600">${p.name}</div>
        <div style="font-size:11px;color:#718096;margin-top:2px">${[p.age?`גיל ${p.age}`:'', p.grade?`כיתה ${p.grade}`:''].filter(Boolean).join(' · ')}</div>
        ${p.parent||p.phone ? `<div style="font-size:11px;color:#a0aec0">${p.parent||''}${p.parent&&p.phone?' · ':''}${p.phone||''}</div>` : ''}
      </td>
      ${attCells}
      <td style="padding:8px 10px;text-align:center;font-size:13px;color:#718096">${presentCount}/${dates.length}</td>
      <td style="padding:8px 10px;text-align:center;font-weight:700;color:${totalPaid>0?'#276749':'#a0aec0'}">${totalPaid>0?'₪'+totalPaid:'—'}</td>
      <td style="padding:8px 8px;text-align:center;white-space:nowrap" onclick="event.stopPropagation()">
        <button onclick="openFridayPaymentModal('${leagueId}','${p.id}')" title="הוסף תשלום" style="background:#ebf4ff;border:none;border-radius:6px;padding:4px 9px;cursor:pointer;font-size:12px;color:#2b6cb0;font-family:inherit">💳</button>
        <button onclick="openFridayPaymentHistory('${leagueId}','${p.id}')" title="היסטוריית תשלומים" style="background:#f0fff4;border:none;border-radius:6px;padding:4px 9px;cursor:pointer;font-size:12px;color:#276749;font-family:inherit">📋</button>
        <button onclick="openFridayNotes('${leagueId}','${p.id}')" title="הערות" style="background:${p.notes?'#fefcbf':'#f7fafc'};border:none;border-radius:6px;padding:4px 9px;cursor:pointer;font-size:12px;color:#744210;font-family:inherit">📝${p.notes?'·':''}</button>
        <button onclick="removeFridayPlayer('${leagueId}','${p.id}')" title="הסר שחקן" style="background:none;border:none;cursor:pointer;font-size:14px;color:#fc8181">🗑</button>
      </td>
    </tr>`;
  }).join('');

  const thS = 'padding:10px 12px;text-align:right;font-size:12px;font-weight:700;color:#4a5568;border-bottom:2px solid #e2e8f0;background:#f7fafc';
  content.innerHTML = subTabBar + `
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
      <button onclick="openAddFridayPlayerModal('${leagueId}')" style="background:${league.color};color:white;border:none;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">➕ הוסף שחקן</button>
      <button onclick="openAddFridayDateModal('${leagueId}')" style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;color:#4a5568">📅 הוסף תאריך</button>
      ${dates.length > 0 ? `<button onclick="clearAllFridayDates('${leagueId}')" style="background:#fff5f5;border:1px solid #fed7d7;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;color:#c53030">🗑 נקה תאריכים</button>` : ''}
    </div>
    ${players.length===0&&dates.length===0 ? `
      <div style="text-align:center;color:#a0aec0;padding:48px 20px">
        <div style="font-size:40px;margin-bottom:12px">🏆</div>
        <div style="font-size:15px">אין שחקנים עדיין — לחץ "הוסף שחקן" להתחלה</div>
      </div>` : `
    <div style="overflow-x:auto;border-radius:10px;border:1px solid #e2e8f0">
      <table style="width:100%;border-collapse:collapse;min-width:320px">
        <thead><tr>
          <th style="${thS}">שם</th>
          ${dateHeaders}
          <th style="${thS};text-align:center">נוכחות</th>
          <th style="${thS};text-align:center">שולם</th>
          <th style="${thS}"></th>
        </tr></thead>
        <tbody>${playerRows||'<tr><td colspan="20" style="text-align:center;padding:24px;color:#a0aec0">אין שחקנים</td></tr>'}</tbody>
      </table>
    </div>`}`;
}

async function toggleFridayAttendance(leagueId, playerId, date) {
  const cur = _fridayData[leagueId]?.players?.[playerId]?.attendance?.[date];
  try {
    await db.ref(`fridayLeagues/${leagueId}/players/${playerId}/attendance/${date}`).set(!cur);
    if (!_fridayData[leagueId].players[playerId].attendance) _fridayData[leagueId].players[playerId].attendance = {};
    _fridayData[leagueId].players[playerId].attendance[date] = !cur;
    renderFridayLeagueContent(leagueId, _fridayData[leagueId]);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}

function openAddFridayPlayerModal(leagueId) {
  const league = FRIDAY_LEAGUES.find(l => l.id === leagueId);
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:420px">
        <div class="modal-header"><span class="modal-title">➕ הוסף שחקן — ${league.name}</span>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div>
        <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;gap:10px">
            <div class="modal-field" style="flex:1"><label>שם פרטי <span style="color:#e53e3e">*</span></label>
              <input type="text" id="fp-first" placeholder="שם פרטי" class="modal-input" autofocus></div>
            <div class="modal-field" style="flex:1"><label>שם משפחה <span style="color:#e53e3e">*</span></label>
              <input type="text" id="fp-last" placeholder="שם משפחה" class="modal-input"></div>
          </div>
          <div style="display:flex;gap:10px">
            <div class="modal-field" style="flex:1"><label>גיל <span style="color:#e53e3e">*</span></label>
              <input type="number" id="fp-age" placeholder="10" min="4" max="20" class="modal-input"></div>
            <div class="modal-field" style="flex:1"><label>כיתה <span style="color:#e53e3e">*</span></label>
              <input type="text" id="fp-grade" placeholder="ד׳" class="modal-input"></div>
          </div>
          <div class="modal-field"><label>שם הורה <span style="color:#e53e3e">*</span></label>
            <input type="text" id="fp-parent" placeholder="שם ההורה" class="modal-input"></div>
          <div class="modal-field"><label>טלפון הורה <span style="color:#e53e3e">*</span></label>
            <input type="tel" id="fp-phone" placeholder="050-0000000" class="modal-input"></div>
          <button onclick="saveFridayPlayer('${leagueId}')" style="background:${league.color};color:white;border:none;border-radius:8px;padding:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">שמור</button>
        </div>
      </div>
    </div>`);
  setTimeout(() => document.getElementById('fp-first')?.focus(), 50);
}

async function saveFridayPlayer(leagueId) {
  const first  = document.getElementById('fp-first')?.value.trim();
  const last   = document.getElementById('fp-last')?.value.trim();
  const age    = document.getElementById('fp-age')?.value.trim();
  const grade  = document.getElementById('fp-grade')?.value.trim();
  const parent = document.getElementById('fp-parent')?.value.trim();
  const phone  = document.getElementById('fp-phone')?.value.trim();
  if (!first || !last)   { showToast('יש להזין שם פרטי ושם משפחה', 'error'); return; }
  if (!age)              { showToast('יש להזין גיל', 'error'); return; }
  if (!grade)            { showToast('יש להזין כיתה', 'error'); return; }
  if (!parent)           { showToast('יש להזין שם הורה', 'error'); return; }
  if (!phone)            { showToast('יש להזין טלפון הורה', 'error'); return; }
  const name = `${first} ${last}`;
  try {
    await db.ref('fridayLeagues/' + leagueId + '/players').push({ name, first, last, age: parseInt(age), grade, parent, phone });
    // Auto-add: last Friday + all future Fridays until YEAR_END
    const lastFriday = getLastFriday();
    const fridays = getFridaysBetween(lastFriday, YEAR_END);
    const existing = new Set(Object.values(_fridayData[leagueId]?.dates || {}));
    const toAdd = fridays.filter(d => !existing.has(d));
    for (const d of toAdd) await db.ref('fridayLeagues/' + leagueId + '/dates').push(d);
    document.querySelector('.friday-modal')?.remove();
    showToast(`השחקן נוסף ✅${toAdd.length > 0 ? ` · ${toAdd.length} תאריכי שישי נוספו` : ''}`);
    loadFridayLeague(leagueId);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}

function openAddFridayDateModal(leagueId) {
  const allFridays = getFridaysBetween(YEAR_START, YEAR_END);
  const existing = new Set(Object.values(_fridayData[leagueId]?.dates || {}));
  const available = allFridays.filter(d => !existing.has(d));
  if (!available.length) { showToast('כל ימי השישי של השנה כבר נוספו', 'error'); return; }
  const options = available.map(d => {
    const dd = new Date(d);
    return `<option value="${d}">${dd.toLocaleDateString('he-IL', {day:'numeric', month:'long', year:'numeric'})}</option>`;
  }).join('');
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:320px">
        <div class="modal-header"><span class="modal-title">📅 הוסף יום שישי</span>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div>
        <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:12px">
          <div class="modal-field"><label>בחר יום שישי</label>
            <select id="fd-date" class="modal-input">${options}</select></div>
          <button onclick="saveFridayDate('${leagueId}')" style="background:#2b6cb0;color:white;border:none;border-radius:8px;padding:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">הוסף</button>
        </div>
      </div>
    </div>`);
}

async function saveFridayDate(leagueId) {
  const date = document.getElementById('fd-date')?.value;
  if (!date) { showToast('יש לבחור תאריך', 'error'); return; }
  try {
    await db.ref('fridayLeagues/' + leagueId + '/dates').push(date);
    document.querySelector('.friday-modal')?.remove();
    showToast('התאריך נוסף ✅');
    loadFridayLeague(leagueId);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}

function openFridayPaymentModal(leagueId, playerId) {
  const player = _fridayData[leagueId]?.players?.[playerId];
  const today = new Date().toISOString().split('T')[0];
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:380px">
        <div class="modal-header"><span class="modal-title">💳 תשלום — ${player?.name||''}</span>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div>
        <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <div class="modal-field" style="flex:1;min-width:120px"><label>תאריך תשלום</label>
              <input type="date" id="pay-date" value="${today}" class="modal-input"></div>
            <div class="modal-field" style="min-width:90px"><label>סכום (₪)</label>
              <input type="number" id="pay-amount" placeholder="50" min="1" class="modal-input"></div>
          </div>
          <div class="modal-field"><label>אמצעי תשלום</label>
            <select id="pay-method" class="modal-input">
              <option value="cash">מזומן</option>
              <option value="transfer">העברה בנקאית</option>
              <option value="bit">ביט</option>
              <option value="other">אחר</option>
            </select></div>
          <div class="modal-field"><label>שולם ע"י</label>
            <input type="text" id="pay-by" placeholder="שם ההורה / השחקן" class="modal-input"></div>
          <div class="modal-field"><label>הערה (אופציונלי)</label>
            <input type="text" id="pay-note" placeholder="..." class="modal-input"></div>
          <button onclick="saveFridayPayment('${leagueId}','${playerId}')" style="background:#276749;color:white;border:none;border-radius:8px;padding:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">שמור תשלום</button>
        </div>
      </div>
    </div>`);
  setTimeout(() => document.getElementById('pay-amount')?.focus(), 50);
}

async function saveFridayPayment(leagueId, playerId) {
  const date = document.getElementById('pay-date')?.value;
  const amount = parseFloat(document.getElementById('pay-amount')?.value);
  const method = document.getElementById('pay-method')?.value;
  const paidBy = document.getElementById('pay-by')?.value.trim();
  const note = document.getElementById('pay-note')?.value.trim();
  if (!date || !amount || amount <= 0) { showToast('יש למלא תאריך וסכום', 'error'); return; }
  const methodLabels = { cash:'מזומן', transfer:'העברה', bit:'ביט', other:'אחר' };
  try {
    await db.ref(`fridayLeagues/${leagueId}/players/${playerId}/payments`).push({
      date, amount, method, methodLabel: methodLabels[method], paidBy: paidBy||null, note: note||null, ts: Date.now()
    });
    document.querySelector('.friday-modal')?.remove();
    showToast('התשלום נשמר ✅');
    loadFridayLeague(leagueId);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}

function openFridayPaymentHistory(leagueId, playerId) {
  const player = _fridayData[leagueId]?.players?.[playerId];
  const payments = player?.payments ? Object.entries(player.payments).map(([id,p]) => ({id,...p})) : [];
  payments.sort((a,b) => (b.ts||0)-(a.ts||0));
  const total = payments.reduce((s,p) => s+(p.amount||0), 0);
  const thS = 'padding:9px 12px;text-align:right;font-size:12px;font-weight:700;color:#4a5568;border-bottom:2px solid #e2e8f0;background:#f7fafc';
  const rows = payments.length ? payments.map(p => `
    <tr style="border-bottom:1px solid #f0f4f8">
      <td style="padding:9px 12px;font-size:13px">${p.date}</td>
      <td style="padding:9px 12px;font-size:13px;font-weight:700;color:#276749">₪${p.amount}</td>
      <td style="padding:9px 12px;font-size:13px">${p.methodLabel||p.method}</td>
      <td style="padding:9px 12px;font-size:13px">${p.paidBy||'—'}</td>
      <td style="padding:9px 12px;font-size:12px;color:#718096">${p.note||''}</td>
      <td style="padding:9px 8px;text-align:center"><button onclick="deleteFridayPayment('${leagueId}','${playerId}','${p.id}')" style="background:none;border:none;color:#fc8181;cursor:pointer;font-size:14px">🗑</button></td>
    </tr>`).join('') : '<tr><td colspan="6" style="padding:20px;text-align:center;color:#a0aec0">אין תשלומים עדיין</td></tr>';
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:520px">
        <div class="modal-header"><span class="modal-title">📋 היסטוריית תשלומים — ${player?.name||''}</span>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div>
        <div class="modal-body" style="padding:0">
          <div style="padding:12px 20px;background:#f0fff4;border-bottom:1px solid #e2e8f0;font-weight:700;color:#276749;font-size:14px">סה"כ שולם: ₪${total}</div>
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse">
              <thead><tr><th style="${thS}">תאריך</th><th style="${thS}">סכום</th><th style="${thS}">אמצעי</th><th style="${thS}">שולם ע"י</th><th style="${thS}">הערה</th><th style="${thS}"></th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`);
}

async function deleteFridayPayment(leagueId, playerId, payId) {
  if (!confirm('למחוק תשלום זה?')) return;
  try {
    await db.ref(`fridayLeagues/${leagueId}/players/${playerId}/payments/${payId}`).remove();
    showToast('התשלום נמחק');
    document.querySelector('.friday-modal')?.remove();
    loadFridayLeague(leagueId);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}

// ---- PLAYER PROFILE ----
function openFridayPlayerProfile(leagueId, playerId) {
  const p = _fridayData[leagueId]?.players?.[playerId];
  if (!p) return;
  const league = FRIDAY_LEAGUES.find(l => l.id === leagueId);
  const dates = _fridayData[leagueId]?.dates ? Object.values(_fridayData[leagueId].dates).sort() : [];
  const att = p.attendance || {};
  const presentCount = dates.filter(d => att[d]).length;
  const pct = dates.length > 0 ? Math.round(presentCount / dates.length * 100) : 0;
  const pctColor = pct >= 80 ? '#276749' : pct >= 60 ? '#d69e2e' : '#e53e3e';
  const payments = p.payments ? Object.values(p.payments).sort((a,b) => (b.ts||0)-(a.ts||0)) : [];
  const totalPaid = payments.reduce((s, pay) => s + (pay.amount||0), 0);

  const attDots = dates.map(d => {
    const dd = new Date(d);
    return `<div title="${dd.toLocaleDateString('he-IL')}"
      style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;font-size:10px;font-weight:700;margin:2px;background:${att[d]?'#c6f6d5':'#fed7d7'};color:${att[d]?'#276749':'#c53030'}">
      ${dd.getDate()}/${dd.getMonth()+1}
    </div>`;
  }).join('');

  const payRows = payments.slice(0,5).map(pay => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f0f4f8;font-size:13px">
      <span>${pay.date}</span>
      <span style="font-weight:700;color:#276749">₪${pay.amount}</span>
      <span style="color:#718096">${pay.methodLabel||pay.method}</span>
      <span style="color:#718096">${pay.paidBy||''}</span>
    </div>`).join('');

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="profile-modal-box" style="width:480px">
        <div style="background:linear-gradient(135deg,${league.color},${league.color}dd);color:white;padding:18px 22px;border-radius:14px 14px 0 0;display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-size:20px;font-weight:800">${p.name}</div>
            <div style="font-size:13px;opacity:0.85;margin-top:3px">${league.name}</div>
          </div>
          <button onclick="this.closest('.modal-overlay').remove()" style="background:rgba(255,255,255,0.2);border:none;color:white;border-radius:8px;padding:6px 12px;cursor:pointer;font-size:14px">✕</button>
        </div>
        <div class="profile-modal-body">

          <!-- פרטים אישיים -->
          <div class="profile-section">
            <div class="profile-section-header">
              📋 פרטים אישיים
              <button onclick="openFridayPlayerEdit('${leagueId}','${playerId}')" class="btn-profile-edit">✏️ ערוך</button>
            </div>
            <div id="fp-profile-details-${playerId}">
              ${[
                ['שם פרטי', p.first || p.name.split(' ')[0]],
                ['שם משפחה', p.last || p.name.split(' ').slice(1).join(' ') || '—'],
                ['גיל', p.age ? `${p.age}` : '—'],
                ['כיתה', p.grade || '—'],
                ['שם הורה', p.parent || '—'],
                ['טלפון הורה', p.phone ? `<a href="tel:${p.phone}" style="color:#2b6cb0;text-decoration:none">${p.phone}</a>` : '—'],
              ].map(([label, val]) => `
                <div class="profile-detail-row">
                  <span class="profile-label">${label}</span>
                  <span class="profile-value">${val}</span>
                </div>`).join('')}
            </div>
          </div>

          <!-- נוכחות -->
          <div class="profile-section">
            <div class="profile-section-header">
              📅 נוכחות
              <span style="font-size:13px;font-weight:700;color:${pctColor}">${presentCount}/${dates.length} · ${pct}%</span>
            </div>
            <div style="line-height:2.2">${attDots || '<span style="color:#a0aec0;font-size:13px">אין תאריכים</span>'}</div>
          </div>

          <!-- תשלומים -->
          <div class="profile-section">
            <div class="profile-section-header">
              💳 תשלומים
              <span style="font-size:13px;font-weight:700;color:#276749">סה"כ: ₪${totalPaid}</span>
            </div>
            ${payRows || '<div style="color:#a0aec0;font-size:13px">אין תשלומים עדיין</div>'}
            ${payments.length > 5 ? `<div style="font-size:12px;color:#718096;margin-top:6px">ועוד ${payments.length-5} תשלומים...</div>` : ''}
          </div>

          <!-- משחקים לפי תאריך -->
          ${(() => {
            const allPlayers = _fridayData[leagueId]?.players || {};
            const results = _fridayData[leagueId]?.tournamentResults || {};
            const games = [];
            Object.keys(allPlayers).forEach(opId => {
              if (opId === playerId) return;
              const opName = allPlayers[opId]?.name || '?';
              const asW = results[playerId]?.[opId];
              if (asW != null) {
                const r = getResult(asW); const d = getGameDate(asW);
                const score = parseFloat(r);
                games.push({ date: d||'?', opName, color: 'לבן', result: score===1?'ניצחון':score===0.5?'תיקו':'הפסד', score });
              }
              const asB = results[opId]?.[playerId];
              if (asB != null) {
                const r = getResult(asB); const d = getGameDate(asB);
                const score = 1 - parseFloat(r);
                games.push({ date: d||'?', opName, color: 'שחור', result: score===1?'ניצחון':score===0.5?'תיקו':'הפסד', score });
              }
            });
            if (!games.length) return `<div class="profile-section"><div class="profile-section-header">♟️ משחקים</div><div style="color:#a0aec0;font-size:13px">אין משחקים מתועדים</div></div>`;
            const byDate = {};
            games.forEach(g => { if (!byDate[g.date]) byDate[g.date] = []; byDate[g.date].push(g); });
            const dateBlocks = Object.keys(byDate).sort().reverse().map(date => {
              const dd = date !== '?' ? new Date(date + 'T12:00:00').toLocaleDateString('he-IL', { day:'numeric', month:'long', year:'numeric' }) : '—';
              const rows = byDate[date].map(g => {
                const rc = g.result==='ניצחון'?'#276749':g.result==='תיקו'?'#744210':'#c53030';
                const bg = g.result==='ניצחון'?'#f0fff4':g.result==='תיקו'?'#fffff0':'#fff5f5';
                return `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 8px;border-radius:6px;background:${bg};margin-bottom:3px;font-size:12px">
                  <span style="font-weight:600">${g.opName}</span>
                  <span style="color:#718096">${g.color}</span>
                  <span style="font-weight:700;color:${rc}">${g.result}</span>
                </div>`;
              }).join('');
              return `<div style="margin-bottom:10px"><div style="font-size:12px;font-weight:700;color:#4a5568;margin-bottom:4px">📅 ${dd}</div>${rows}</div>`;
            }).join('');
            return `<div class="profile-section"><div class="profile-section-header">♟️ משחקים (${games.length})</div>${dateBlocks}</div>`;
          })()}

          <!-- הערות -->
          <div class="profile-section">
            <div class="profile-section-header">📝 הערות</div>
            <div style="font-size:14px;color:${p.notes?'#2d3748':'#a0aec0'};white-space:pre-wrap">${p.notes || 'אין הערות'}</div>
          </div>
        </div>

        <div class="profile-modal-footer" style="flex-wrap:wrap;gap:8px">
          <button onclick="openFridayPaymentModal('${leagueId}','${playerId}');this.closest('.modal-overlay').remove()" style="background:#ebf8ff;border:1px solid #bee3f8;color:#2b6cb0;border-radius:8px;padding:7px 14px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">💳 הוסף תשלום</button>
          <button onclick="openFridayNotes('${leagueId}','${playerId}');this.closest('.modal-overlay').remove()" style="background:#fffff0;border:1px solid #fefcbf;color:#744210;border-radius:8px;padding:7px 14px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">📝 ערוך הערות</button>
          <button onclick="openFridayTransfer('${leagueId}','${playerId}')" style="background:#f0fff4;border:1px solid #9ae6b4;color:#276749;border-radius:8px;padding:7px 14px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">🔀 העבר ליגה</button>
          <button onclick="if(confirm('להסיר שחקן זה?')){removeFridayPlayer('${leagueId}','${playerId}');this.closest('.modal-overlay').remove()}" class="btn-remove-player">🗑 הסר שחקן</button>
        </div>
      </div>
    </div>`);
}

function openFridayPlayerEdit(leagueId, playerId) {
  const p = _fridayData[leagueId]?.players?.[playerId];
  if (!p) return;
  const detailsEl = document.getElementById(`fp-profile-details-${playerId}`);
  if (!detailsEl) return;
  detailsEl.innerHTML = `
    <div style="display:flex;gap:10px;margin-bottom:10px">
      <div class="modal-field" style="flex:1"><label>שם פרטי</label>
        <input type="text" id="fpe-first" value="${p.first||p.name.split(' ')[0]||''}" class="modal-input"></div>
      <div class="modal-field" style="flex:1"><label>שם משפחה</label>
        <input type="text" id="fpe-last" value="${p.last||p.name.split(' ').slice(1).join(' ')||''}" class="modal-input"></div>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:10px">
      <div class="modal-field" style="flex:1"><label>גיל</label>
        <input type="number" id="fpe-age" value="${p.age||''}" min="4" max="20" class="modal-input"></div>
      <div class="modal-field" style="flex:1"><label>כיתה</label>
        <input type="text" id="fpe-grade" value="${p.grade||''}" class="modal-input"></div>
    </div>
    <div class="modal-field" style="margin-bottom:10px"><label>שם הורה</label>
      <input type="text" id="fpe-parent" value="${p.parent||''}" class="modal-input"></div>
    <div class="modal-field" style="margin-bottom:10px"><label>טלפון הורה</label>
      <input type="tel" id="fpe-phone" value="${p.phone||''}" class="modal-input"></div>
    <button onclick="saveFridayPlayerEdit('${leagueId}','${playerId}')"
      style="background:#2b6cb0;color:white;border:none;border-radius:8px;padding:9px 20px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">שמור</button>`;
}

async function saveFridayPlayerEdit(leagueId, playerId) {
  const first  = document.getElementById('fpe-first')?.value.trim();
  const last   = document.getElementById('fpe-last')?.value.trim();
  const age    = document.getElementById('fpe-age')?.value.trim();
  const grade  = document.getElementById('fpe-grade')?.value.trim();
  const parent = document.getElementById('fpe-parent')?.value.trim();
  const phone  = document.getElementById('fpe-phone')?.value.trim();
  if (!first || !last) { showToast('יש להזין שם', 'error'); return; }
  const updates = { first, last, name: `${first} ${last}`, age: parseInt(age)||null, grade: grade||null, parent: parent||null, phone: phone||null };
  try {
    await db.ref(`fridayLeagues/${leagueId}/players/${playerId}`).update(updates);
    Object.assign(_fridayData[leagueId].players[playerId], updates);
    document.querySelector('.friday-modal')?.remove();
    showToast('הפרטים עודכנו ✅');
    renderFridayLeagueContent(leagueId, _fridayData[leagueId]);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}

// ---- TOURNAMENT ----
function switchFridaySubTab(leagueId, tab) {
  _fridaySubTab[leagueId] = tab;
  renderFridayLeagueContent(leagueId, _fridayData[leagueId] || {});
}

function renderFridayTournamentView(leagueId, data, archiveOpts = null) {
  const league = FRIDAY_LEAGUES.find(l => l.id === leagueId);
  // Players in insertion order
  const players = data.players
    ? Object.entries(data.players).map(([id,p]) => ({id,...p}))
    : [];
  if (players.length < 2) {
    return `<div style="text-align:center;color:#a0aec0;padding:48px 20px">
      <div style="font-size:36px;margin-bottom:12px">♟️</div>
      <div>יש להוסיף לפחות 2 שחקנים כדי לנהל ליגה</div>
    </div>`;
  }
  const results = data.tournamentResults || {};

  // Score per player: as white + as black
  function playerScore(pid) {
    let score = 0;
    players.forEach(op => {
      if (op.id === pid) return;
      const asW = getResult(results[pid]?.[op.id]);
      if (asW != null) score += parseFloat(asW);
      const asB = getResult(results[op.id]?.[pid]);
      if (asB != null) score += 1 - parseFloat(asB);
    });
    return score;
  }

  // Cross-table header row
  const thBase = 'padding:6px 4px;text-align:center;font-size:11px;font-weight:700;color:#4a5568;border-bottom:2px solid #e2e8f0;background:#f7fafc;min-width:38px';
  const colHeaders = players.map((p,i) => `<th style="${thBase}" title="${p.name}">${i+1}</th>`).join('');

  // Helper: combined score between two players (row's perspective)
  function pairScore(rowId, colId) {
    let r = 0, c = 0, played = 0;
    const asW = getResult(results[rowId]?.[colId]);
    if (asW != null) { const v=parseFloat(asW); r+=v; c+=1-v; played++; }
    const asB = getResult(results[colId]?.[rowId]);
    if (asB != null) { const v=parseFloat(asB); r+=1-v; c+=v; played++; }
    return { r, c, played };
  }

  function fmtScore(v) { return v % 1 === 0 ? String(v) : v.toFixed(1); }

  // Rows
  const rows = players.map((row, ri) => {
    const cells = players.map((col, ci) => {
      if (ri === ci) return `<td style="background:#2d3748;min-width:56px"></td>`;
      const { r, c, played } = pairScore(row.id, col.id);
      let bg = '#f7fafc', label = '·', color = '#a0aec0', fw = '400';
      if (played > 0) {
        fw = '700';
        if (r > c)      { bg='#c6f6d5'; color='#276749'; }
        else if (r < c) { bg='#fed7d7'; color='#c53030'; }
        else            { bg='#fefcbf'; color='#744210'; }
        label = `${fmtScore(c)}-${fmtScore(r)}`;
      }
      const clickHandler = archiveOpts?.locked
        ? ''
        : archiveOpts
          ? `onclick="openArchiveResultModal('${leagueId}','${archiveOpts.seasonKey}','${row.id}','${col.id}')"`
          : `onclick="openResultModal('${leagueId}','${row.id}','${col.id}')"`;
      return `<td style="text-align:center;padding:4px;min-width:56px">
        <button ${clickHandler} title="${row.name} vs ${col.name}"
          style="min-width:50px;height:28px;border-radius:6px;border:1px solid #e2e8f0;background:${bg};color:${color};font-weight:${fw};font-size:12px;${archiveOpts?.locked?'':'cursor:pointer;'}font-family:inherit;padding:0 4px;white-space:nowrap">
          ${label}
        </button>
      </td>`;
    }).join('');
    const score = playerScore(row.id);
    return `<tr style="border-bottom:1px solid #f0f4f8">
      <td style="padding:8px 10px;font-size:13px;font-weight:600;white-space:nowrap">${ri+1}. ${row.name}</td>
      ${cells}
      <td style="padding:8px 10px;text-align:center;font-weight:800;font-size:15px;color:${league.color}">${fmtScore(score)}</td>
    </tr>`;
  }).join('');

  // Standings — count per game (not per opponent)
  const standings = [...players].map(p => {
    let wins = 0, draws = 0, losses = 0, score = 0;
    players.forEach(op => {
      if (op.id === p.id) return;
      const asW = getResult(results[p.id]?.[op.id]);
      if (asW != null) {
        const v = parseFloat(asW);
        score += v;
        if (v === 1) wins++; else if (v === 0.5) draws++; else losses++;
      }
      const asB = getResult(results[op.id]?.[p.id]);
      if (asB != null) {
        const v = 1 - parseFloat(asB);
        score += v;
        if (v === 1) wins++; else if (v === 0.5) draws++; else losses++;
      }
    });
    return { ...p, score, wins, draws, losses, played: wins+draws+losses };
  }).sort((a,b) => b.score - a.score);

  const standingRows = standings.map((p, i) => `
    <tr style="border-bottom:1px solid #f0f4f8">
      <td style="padding:8px 12px;font-weight:700;text-align:center;color:#718096">${i+1}</td>
      <td style="padding:8px 12px;font-size:14px;font-weight:600">${p.name}</td>
      <td style="padding:8px 12px;text-align:center;color:#718096">${p.played}</td>
      <td style="padding:8px 12px;text-align:center;color:#276749;font-weight:600">${p.wins}</td>
      <td style="padding:8px 12px;text-align:center;color:#744210;font-weight:600">${p.draws}</td>
      <td style="padding:8px 12px;text-align:center;color:#c53030;font-weight:600">${p.losses}</td>
      <td style="padding:8px 12px;text-align:center;font-weight:800;font-size:15px;color:${league.color}">${p.score % 1 === 0 ? p.score : p.score.toFixed(1)}</td>
    </tr>`).join('');

  const thS2 = 'padding:9px 12px;text-align:right;font-size:12px;font-weight:700;color:#4a5568;border-bottom:2px solid #e2e8f0;background:#f7fafc';
  return `
    <div style="font-size:13px;color:#718096;margin-bottom:14px">
      לחץ על תא בטבלה להזין תוצאה — שורה = <b>לבן</b>, עמודה = <b>שחור</b>
    </div>
    <div style="overflow-x:auto;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:24px">
      <table style="border-collapse:collapse">
        <thead><tr>
          <th style="${thBase};text-align:right;min-width:120px">שחקן</th>
          ${colHeaders}
          <th style="${thBase}">נק׳</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="font-size:15px;font-weight:700;color:#2d3748;margin-bottom:12px">🏅 טבלת דירוג</div>
    <div style="overflow-x:auto;border-radius:10px;border:1px solid #e2e8f0">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr>
          <th style="${thS2};text-align:center">#</th>
          <th style="${thS2}">שם</th>
          <th style="${thS2};text-align:center">משחקים</th>
          <th style="${thS2};text-align:center;color:#276749">✓ ניצח</th>
          <th style="${thS2};text-align:center;color:#744210">½ תיקו</th>
          <th style="${thS2};text-align:center;color:#c53030">✗ הפסיד</th>
          <th style="${thS2};text-align:center">נקודות</th>
        </tr></thead>
        <tbody>${standingRows}</tbody>
      </table>
    </div>
    ${!archiveOpts ? `<div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap">
      <button onclick="openFridayArchive('${leagueId}')" style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;color:#4a5568">📚 ארכיון</button>
      <button onclick="closeFridayLeague('${leagueId}')" style="background:#fff5f5;border:1px solid #fed7d7;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;color:#c53030">🏁 סיום ליגה</button>
    </div>` : ''}`;
}

function openResultModal(leagueId, pid1, pid2) {
  const data = _fridayData[leagueId] || {};
  const p1 = data.players?.[pid1];
  const p2 = data.players?.[pid2];

  function gameRow(wPid, bPid) {
    const wp = data.players?.[wPid], bp = data.players?.[bPid];
    const cur = getResult(data.tournamentResults?.[wPid]?.[bPid]) ?? '';
    const rowId = `gr-${wPid}-${bPid}`;
    const bs = (val) => {
      const c = { '1':['#c6f6d5','#276749'], '0.5':['#fefcbf','#744210'], '0':['#fed7d7','#c53030'] }[val];
      return `background:${cur===val?c[0]:'#f7fafc'};color:${cur===val?c[1]:'#718096'};border:2px solid ${cur===val?c[1]:'#e2e8f0'};border-radius:8px;padding:7px 12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit`;
    };
    return `
      <div id="${rowId}" data-w="${wPid}" data-b="${bPid}" data-val="${cur}" style="background:#f7fafc;border-radius:10px;padding:10px 12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:12px">
          <span>⬜ <b>${wp?.name||'?'}</b></span>
          <span style="color:#718096">vs</span>
          <span>⬛ <b>${bp?.name||'?'}</b></span>
        </div>
        <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">
          <button onclick="selectFridayResult('${rowId}','1')" id="${rowId}-1" style="${bs('1')}">1–0<br><span style="font-size:10px;font-weight:400">לבן ניצח</span></button>
          <button onclick="selectFridayResult('${rowId}','0.5')" id="${rowId}-0.5" style="${bs('0.5')}">½–½<br><span style="font-size:10px;font-weight:400">תיקו</span></button>
          <button onclick="selectFridayResult('${rowId}','0')" id="${rowId}-0" style="${bs('0')}">0–1<br><span style="font-size:10px;font-weight:400">שחור ניצח</span></button>
          <button onclick="selectFridayResult('${rowId}','')" style="background:none;border:1px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:12px;cursor:pointer;color:#a0aec0;font-family:inherit" title="נקה">✕</button>
        </div>
      </div>`;
  }

  const today = new Date().toISOString().split('T')[0];
  const allFridays = getFridaysBetween(YEAR_START, today);
  const existingDate = getGameDate(data.tournamentResults?.[pid1]?.[pid2]) || getGameDate(data.tournamentResults?.[pid2]?.[pid1]) || getLastFriday();
  const fridayOpts = [...allFridays].reverse().map(d => {
    const dd = new Date(d + 'T12:00:00');
    const label = dd.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
    return `<option value="${d}" ${d === existingDate ? 'selected' : ''}>${label}</option>`;
  }).join('');

  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:380px">
        <div class="modal-header">
          <span class="modal-title">♟️ ${p1?.name||'?'} vs ${p2?.name||'?'}</span>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body" style="padding:16px;display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;align-items:center;gap:8px;background:#f7fafc;border-radius:8px;padding:8px 12px">
            <span style="font-size:13px;color:#4a5568;font-weight:600">📅 תאריך שישי:</span>
            <select id="friday-game-date" style="flex:1;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;font-size:13px;font-family:inherit;background:white">
              ${fridayOpts}
            </select>
          </div>
          ${gameRow(pid1, pid2)}
          ${gameRow(pid2, pid1)}
          <button onclick="confirmFridayResults('${leagueId}','${pid1}','${pid2}')"
            style="background:#2b6cb0;color:white;border:none;border-radius:8px;padding:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">✅ אשר תוצאות</button>
        </div>
      </div>
    </div>`);
}

function selectFridayResult(rowId, val) {
  const row = document.getElementById(rowId);
  if (!row) return;
  row.dataset.val = val;
  const colors = { '1':['#c6f6d5','#276749'], '0.5':['#fefcbf','#744210'], '0':['#fed7d7','#c53030'] };
  ['1','0.5','0'].forEach(v => {
    const btn = document.getElementById(rowId + '-' + v);
    if (!btn) return;
    if (v === val) {
      const [bg, fg] = colors[v];
      btn.style.background = bg;
      btn.style.color = fg;
      btn.style.fontWeight = '700';
      btn.style.border = `2px solid ${fg}`;
    } else {
      btn.style.background = '#f7fafc';
      btn.style.color = '#718096';
      btn.style.fontWeight = '700';
      btn.style.border = '2px solid #e2e8f0';
    }
  });
}

async function confirmFridayResults(leagueId, pid1, pid2) {
  const row1 = document.getElementById('gr-' + pid1 + '-' + pid2);
  const row2 = document.getElementById('gr-' + pid2 + '-' + pid1);
  const val1 = row1?.dataset.val;
  const val2 = row2?.dataset.val;
  const gameDate = document.getElementById('friday-game-date')?.value || getLastFriday();
  try {
    if (!_fridayData[leagueId].tournamentResults) _fridayData[leagueId].tournamentResults = {};
    if (val1 !== undefined && val1 !== '') {
      const entry1 = { result: val1, date: gameDate };
      await db.ref(`fridayLeagues/${leagueId}/tournamentResults/${pid1}/${pid2}`).set(entry1);
      if (!_fridayData[leagueId].tournamentResults[pid1]) _fridayData[leagueId].tournamentResults[pid1] = {};
      _fridayData[leagueId].tournamentResults[pid1][pid2] = entry1;
    } else if (val1 === '') {
      await db.ref(`fridayLeagues/${leagueId}/tournamentResults/${pid1}/${pid2}`).remove();
      if (_fridayData[leagueId]?.tournamentResults?.[pid1]) delete _fridayData[leagueId].tournamentResults[pid1][pid2];
    }
    if (val2 !== undefined && val2 !== '') {
      const entry2 = { result: val2, date: gameDate };
      await db.ref(`fridayLeagues/${leagueId}/tournamentResults/${pid2}/${pid1}`).set(entry2);
      if (!_fridayData[leagueId].tournamentResults[pid2]) _fridayData[leagueId].tournamentResults[pid2] = {};
      _fridayData[leagueId].tournamentResults[pid2][pid1] = entry2;
    } else if (val2 === '') {
      await db.ref(`fridayLeagues/${leagueId}/tournamentResults/${pid2}/${pid1}`).remove();
      if (_fridayData[leagueId]?.tournamentResults?.[pid2]) delete _fridayData[leagueId].tournamentResults[pid2][pid1];
    }
    document.querySelector('.friday-modal')?.remove();
    showToast('התוצאות נשמרו ✅');
    renderFridayLeagueContent(leagueId, _fridayData[leagueId]);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}

async function saveGameResult(leagueId, whitePid, blackPid, result) {
  try {
    if (result === null) {
      await db.ref(`fridayLeagues/${leagueId}/tournamentResults/${whitePid}/${blackPid}`).remove();
      if (_fridayData[leagueId]?.tournamentResults?.[whitePid]) delete _fridayData[leagueId].tournamentResults[whitePid][blackPid];
    } else {
      await db.ref(`fridayLeagues/${leagueId}/tournamentResults/${whitePid}/${blackPid}`).set(result);
      if (!_fridayData[leagueId].tournamentResults) _fridayData[leagueId].tournamentResults = {};
      if (!_fridayData[leagueId].tournamentResults[whitePid]) _fridayData[leagueId].tournamentResults[whitePid] = {};
      _fridayData[leagueId].tournamentResults[whitePid][blackPid] = result;
    }
    document.querySelector('.friday-modal')?.remove();
    showToast('התוצאה נשמרה ✅');
    renderFridayLeagueContent(leagueId, _fridayData[leagueId]);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}

// ---- ARCHIVE / CLOSE LEAGUE ----

function closeFridayLeague(leagueId) {
  const league = FRIDAY_LEAGUES.find(l => l.id === leagueId);
  const data = _fridayData[leagueId] || {};
  const players = data.players ? Object.entries(data.players).map(([id,p]) => ({id,...p})) : [];
  const results = data.tournamentResults || {};
  const standings = [...players].map(p => {
    let score = 0;
    players.forEach(op => {
      if (op.id === p.id) return;
      const asW = getResult(results[p.id]?.[op.id]);
      if (asW != null) score += parseFloat(asW);
      const asB = getResult(results[op.id]?.[p.id]);
      if (asB != null) score += 1 - parseFloat(asB);
    });
    return { ...p, score };
  }).sort((a,b) => b.score - a.score);
  const medals = ['🥇','🥈','🥉'];
  const preview = standings.slice(0,5).map((p,i) => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #f0f4f8">
      <span style="font-weight:600;color:#2d3748">${medals[i]||''} ${i+1}. ${p.name}</span>
      <span style="font-weight:700;color:${league.color}">${p.score%1===0?p.score:p.score.toFixed(1)} נק׳</span>
    </div>`).join('');
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:420px">
        <div class="modal-header">
          <span class="modal-title">🏁 סיום ליגה — ${league.name}</span>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:14px">
          <div style="background:#fff5f5;border:1px solid #fed7d7;border-radius:8px;padding:12px;font-size:13px;color:#c53030">
            ⚠️ הליגה תסתיים ותועבר לארכיון, ותיפתח ליגה חדשה ריקה. ניתן להמשיך להזין תוצאות חסרות בארכיון לאחר הסיום.
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;color:#4a5568;display:block;margin-bottom:6px">שם העונה</label>
            <input type="text" id="close-league-name" value="עונה ${new Date().getFullYear()}"
              style="width:100%;box-sizing:border-box;border:1px solid #e2e8f0;border-radius:8px;padding:9px 12px;font-size:14px;font-family:inherit">
          </div>
          ${standings.length > 0 ? `<div>
            <div style="font-size:13px;font-weight:700;color:#4a5568;margin-bottom:8px">📊 דירוג סופי (תצוגה מקדימה)</div>
            ${preview}
            ${standings.length > 5 ? `<div style="font-size:12px;color:#718096;margin-top:4px">ועוד ${standings.length-5} שחקנים...</div>` : ''}
          </div>` : ''}
          <button onclick="doCloseFridayLeague('${leagueId}')"
            style="background:#c53030;color:white;border:none;border-radius:8px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">
            🏁 סיים ליגה ופתח עונה חדשה
          </button>
        </div>
      </div>
    </div>`);
}
window.closeFridayLeague = closeFridayLeague;

async function doCloseFridayLeague(leagueId) {
  const seasonName = document.getElementById('close-league-name')?.value?.trim() || `עונה ${new Date().getFullYear()}`;
  const data = _fridayData[leagueId] || {};
  const seasonKey = Date.now().toString();
  try {
    await db.ref(`fridayLeagues/${leagueId}/archive/${seasonKey}`).set({
      seasonName,
      closedAt: new Date().toISOString(),
      locked: false,
      players: data.players || null,
      tournamentResults: data.tournamentResults || null,
      dates: data.dates || null,
    });
    await db.ref(`fridayLeagues/${leagueId}/players`).remove();
    await db.ref(`fridayLeagues/${leagueId}/tournamentResults`).remove();
    await db.ref(`fridayLeagues/${leagueId}/dates`).remove();
    _fridayData[leagueId] = { archive: { ...(_fridayData[leagueId]?.archive || {}), [seasonKey]: { seasonName, closedAt: new Date().toISOString(), locked: false } } };
    document.querySelector('.friday-modal')?.remove();
    showToast(`הליגה נסגרה ✅ · "${seasonName}" נשמרה בארכיון`);
    renderFridayLeagueContent(leagueId, _fridayData[leagueId]);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.doCloseFridayLeague = doCloseFridayLeague;

async function openFridayArchive(leagueId) {
  const league = FRIDAY_LEAGUES.find(l => l.id === leagueId);
  try {
    const snap = await db.ref(`fridayLeagues/${leagueId}/archive`).once('value');
    const archive = snap.val() || {};
    const seasons = Object.entries(archive).sort((a,b) => b[0] - a[0]);
    if (seasons.length === 0) { showToast('אין עונות בארכיון עדיין'); return; }
    const rows = seasons.map(([key, s]) => {
      const date = new Date(s.closedAt).toLocaleDateString('he-IL', { day:'numeric', month:'long', year:'numeric' });
      const playerCount = s.players ? Object.keys(s.players).length : 0;
      let winner = '';
      if (s.players && s.tournamentResults) {
        const ps = Object.entries(s.players).map(([id,p]) => ({id,...p}));
        const rs = s.tournamentResults || {};
        const scored = ps.map(p => {
          let sc = 0;
          ps.forEach(op => {
            if (op.id === p.id) return;
            const asW = getResult(rs[p.id]?.[op.id]);
            if (asW != null) sc += parseFloat(asW);
            const asB = getResult(rs[op.id]?.[p.id]);
            if (asB != null) sc += 1 - parseFloat(asB);
          });
          return { ...p, sc };
        }).sort((a,b) => b.sc - a.sc);
        if (scored.length > 0) winner = scored[0].name;
      }
      return `<div style="border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;gap:10px">
        <div>
          <div style="font-size:15px;font-weight:700;color:#2d3748">${s.seasonName||'עונה'}
            ${s.locked ? ' <span style="font-size:11px;background:#e2e8f0;color:#4a5568;border-radius:4px;padding:2px 6px">🔒 נעול</span>' : ''}
          </div>
          <div style="font-size:12px;color:#718096;margin-top:2px">${date} · ${playerCount} שחקנים${winner ? ` · 🏆 ${winner}` : ''}</div>
        </div>
        <button onclick="openArchiveSeason('${leagueId}','${key}')"
          style="background:${league.color};color:white;border:none;border-radius:7px;padding:7px 14px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">פתח</button>
      </div>`;
    }).join('');
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
        <div class="modal-box" style="max-width:500px">
          <div class="modal-header">
            <span class="modal-title">📚 ארכיון — ${league.name}</span>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
          </div>
          <div class="modal-body" style="padding:16px;display:flex;flex-direction:column;gap:10px">${rows}</div>
        </div>
      </div>`);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.openFridayArchive = openFridayArchive;

async function openArchiveSeason(leagueId, seasonKey) {
  const league = FRIDAY_LEAGUES.find(l => l.id === leagueId);
  try {
    const snap = await db.ref(`fridayLeagues/${leagueId}/archive/${seasonKey}`).once('value');
    const s = snap.val();
    if (!s) { showToast('לא נמצאה העונה', 'error'); return; }
    const date = new Date(s.closedAt).toLocaleDateString('he-IL', { day:'numeric', month:'long', year:'numeric' });
    const tournHtml = renderFridayTournamentView(leagueId, s, { seasonKey, locked: !!s.locked });
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
        <div class="profile-modal-box" style="width:720px;max-width:calc(100vw - 24px)">
          <div style="background:linear-gradient(135deg,${league.color},${league.color}dd);color:white;padding:18px 22px;border-radius:14px 14px 0 0;display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-size:18px;font-weight:800">${s.seasonName||'עונה'}</div>
              <div style="font-size:12px;opacity:0.85;margin-top:2px">${league.name} · נסגרה ${date}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
              ${s.locked
                ? '<span style="background:rgba(255,255,255,0.2);border-radius:8px;padding:6px 12px;font-size:13px;font-weight:700">🔒 נעול</span>'
                : `<button onclick="lockArchiveSeason('${leagueId}','${seasonKey}')" style="background:rgba(255,255,255,0.2);border:none;color:white;border-radius:8px;padding:6px 12px;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">🔒 נעל סופית</button>`}
              <button onclick="this.closest('.modal-overlay').remove()" style="background:rgba(255,255,255,0.2);border:none;color:white;border-radius:8px;padding:6px 12px;cursor:pointer;font-size:14px">✕</button>
            </div>
          </div>
          <div class="profile-modal-body" style="padding:20px">${tournHtml}</div>
        </div>
      </div>`);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.openArchiveSeason = openArchiveSeason;

async function lockArchiveSeason(leagueId, seasonKey) {
  if (!confirm('לנעול את העונה סופית? לא ניתן יהיה לערוך תוצאות לאחר מכן.')) return;
  try {
    await db.ref(`fridayLeagues/${leagueId}/archive/${seasonKey}/locked`).set(true);
    showToast('העונה ננעלה 🔒');
    document.querySelector('.friday-modal')?.remove();
    openArchiveSeason(leagueId, seasonKey);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.lockArchiveSeason = lockArchiveSeason;

function openArchiveResultModal(leagueId, seasonKey, pid1, pid2) {
  db.ref(`fridayLeagues/${leagueId}/archive/${seasonKey}`).once('value').then(snap => {
    const s = snap.val();
    if (!s || s.locked) return;
    const p1 = s.players?.[pid1], p2 = s.players?.[pid2];
    function gameRow(wPid, bPid) {
      const wp = s.players?.[wPid], bp = s.players?.[bPid];
      const cur = getResult(s.tournamentResults?.[wPid]?.[bPid]) ?? '';
      const rowId = `agr-${wPid}-${bPid}`;
      const bs = (val) => {
        const c = { '1':['#c6f6d5','#276749'], '0.5':['#fefcbf','#744210'], '0':['#fed7d7','#c53030'] }[val];
        return `background:${cur===val?c[0]:'#f7fafc'};color:${cur===val?c[1]:'#718096'};border:2px solid ${cur===val?c[1]:'#e2e8f0'};border-radius:8px;padding:7px 12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit`;
      };
      return `<div id="${rowId}" data-val="${cur}" style="background:#f7fafc;border-radius:10px;padding:10px 12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:12px">
          <span>⬜ <b>${wp?.name||'?'}</b></span><span style="color:#718096">vs</span><span>⬛ <b>${bp?.name||'?'}</b></span>
        </div>
        <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">
          <button onclick="selectFridayResult('${rowId}','1')" id="${rowId}-1" style="${bs('1')}">1–0<br><span style="font-size:10px;font-weight:400">לבן ניצח</span></button>
          <button onclick="selectFridayResult('${rowId}','0.5')" id="${rowId}-0.5" style="${bs('0.5')}">½–½<br><span style="font-size:10px;font-weight:400">תיקו</span></button>
          <button onclick="selectFridayResult('${rowId}','0')" id="${rowId}-0" style="${bs('0')}">0–1<br><span style="font-size:10px;font-weight:400">שחור ניצח</span></button>
          <button onclick="selectFridayResult('${rowId}','')" style="background:none;border:1px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:12px;cursor:pointer;color:#a0aec0;font-family:inherit" title="נקה">✕</button>
        </div>
      </div>`;
    }
    const today = new Date().toISOString().split('T')[0];
    const allFridays = getFridaysBetween(YEAR_START, today);
    const existingDate = getGameDate(s.tournamentResults?.[pid1]?.[pid2]) || getGameDate(s.tournamentResults?.[pid2]?.[pid1]) || getLastFriday();
    const fridayOpts = [...allFridays].reverse().map(d => {
      const dd = new Date(d + 'T12:00:00');
      return `<option value="${d}" ${d===existingDate?'selected':''}>${dd.toLocaleDateString('he-IL',{day:'numeric',month:'long',year:'numeric'})}</option>`;
    }).join('');
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
        <div class="modal-box" style="max-width:380px">
          <div class="modal-header">
            <span class="modal-title">♟️ ${p1?.name||'?'} vs ${p2?.name||'?'}</span>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
          </div>
          <div class="modal-body" style="padding:16px;display:flex;flex-direction:column;gap:10px">
            <div style="display:flex;align-items:center;gap:8px;background:#f7fafc;border-radius:8px;padding:8px 12px">
              <span style="font-size:13px;color:#4a5568;font-weight:600">📅 תאריך שישי:</span>
              <select id="friday-game-date" style="flex:1;border:1px solid #e2e8f0;border-radius:6px;padding:4px 8px;font-size:13px;font-family:inherit;background:white">${fridayOpts}</select>
            </div>
            ${gameRow(pid1, pid2)}
            ${gameRow(pid2, pid1)}
            <button onclick="confirmArchiveResults('${leagueId}','${seasonKey}','${pid1}','${pid2}')"
              style="background:#2b6cb0;color:white;border:none;border-radius:8px;padding:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">✅ אשר תוצאות</button>
          </div>
        </div>
      </div>`);
  }).catch(e => showToast('שגיאה: ' + e.message, 'error'));
}
window.openArchiveResultModal = openArchiveResultModal;

async function confirmArchiveResults(leagueId, seasonKey, pid1, pid2) {
  const row1 = document.getElementById('agr-' + pid1 + '-' + pid2);
  const row2 = document.getElementById('agr-' + pid2 + '-' + pid1);
  const val1 = row1?.dataset.val;
  const val2 = row2?.dataset.val;
  const gameDate = document.getElementById('friday-game-date')?.value || getLastFriday();
  try {
    if (val1 !== undefined && val1 !== '') {
      await db.ref(`fridayLeagues/${leagueId}/archive/${seasonKey}/tournamentResults/${pid1}/${pid2}`).set({ result: val1, date: gameDate });
    } else if (val1 === '') {
      await db.ref(`fridayLeagues/${leagueId}/archive/${seasonKey}/tournamentResults/${pid1}/${pid2}`).remove();
    }
    if (val2 !== undefined && val2 !== '') {
      await db.ref(`fridayLeagues/${leagueId}/archive/${seasonKey}/tournamentResults/${pid2}/${pid1}`).set({ result: val2, date: gameDate });
    } else if (val2 === '') {
      await db.ref(`fridayLeagues/${leagueId}/archive/${seasonKey}/tournamentResults/${pid2}/${pid1}`).remove();
    }
    document.querySelector('.friday-modal')?.remove();
    showToast('התוצאות נשמרו ✅');
    openArchiveSeason(leagueId, seasonKey);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}
window.confirmArchiveResults = confirmArchiveResults;

// ---- TRANSFER ----
function openFridayTransfer(leagueId, playerId) {
  const p = _fridayData[leagueId]?.players?.[playerId];
  if (!p) return;
  const targets = FRIDAY_LEAGUES.filter(l => l.id !== leagueId);
  const opts = targets.map(l => `<option value="${l.id}">${l.name}</option>`).join('');
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:340px">
        <div class="modal-header">
          <span class="modal-title">🔀 העבר ליגה — ${p.name}</span>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:14px">
          <div class="modal-field">
            <label>העבר אל</label>
            <select id="ft-target" class="modal-input">${opts}</select>
          </div>
          <div style="font-size:13px;color:#718096;background:#f7fafc;border-radius:8px;padding:10px">
            כל הנתונים של השחקן (נוכחות, תשלומים, הערות) יועברו לליגה החדשה.
          </div>
          <button onclick="transferFridayPlayer('${leagueId}','${playerId}')"
            style="background:#276749;color:white;border:none;border-radius:8px;padding:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">העבר</button>
        </div>
      </div>
    </div>`);
}

async function transferFridayPlayer(fromLeagueId, playerId) {
  const targetId = document.getElementById('ft-target')?.value;
  if (!targetId) return;
  const p = _fridayData[fromLeagueId]?.players?.[playerId];
  if (!p) return;
  const fromLeague = FRIDAY_LEAGUES.find(l => l.id === fromLeagueId);
  const toLeague   = FRIDAY_LEAGUES.find(l => l.id === targetId);
  try {
    // Copy all player data to target league
    await db.ref('fridayLeagues/' + targetId + '/players').push(p);
    // Remove from source league
    await db.ref(`fridayLeagues/${fromLeagueId}/players/${playerId}`).remove();
    // Close all friday modals
    document.querySelectorAll('.friday-modal').forEach(m => m.remove());
    showToast(`${p.name} הועבר מ${fromLeague.name} ל${toLeague.name} ✅`);
    // Reload both leagues cache
    delete _fridayData[fromLeagueId];
    delete _fridayData[targetId];
    loadFridayLeague(fromLeagueId);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}

// ---- NOTES ----
function openFridayNotes(leagueId, playerId) {
  const player = _fridayData[leagueId]?.players?.[playerId];
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay open friday-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-box" style="max-width:400px">
        <div class="modal-header"><span class="modal-title">📝 הערות — ${player?.name||''}</span>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div>
        <div class="modal-body" style="padding:20px;display:flex;flex-direction:column;gap:12px">
          <textarea id="fn-notes" rows="5" placeholder="הוסף הערות חופשיות על השחקן..."
            style="padding:10px;border:2px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit;resize:vertical">${player?.notes||''}</textarea>
          <button onclick="saveFridayNotes('${leagueId}','${playerId}')"
            style="background:#744210;color:white;border:none;border-radius:8px;padding:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">שמור הערות</button>
        </div>
      </div>
    </div>`);
  setTimeout(() => document.getElementById('fn-notes')?.focus(), 50);
}

async function saveFridayNotes(leagueId, playerId) {
  const notes = document.getElementById('fn-notes')?.value.trim();
  try {
    await db.ref(`fridayLeagues/${leagueId}/players/${playerId}/notes`).set(notes || null);
    if (_fridayData[leagueId]?.players?.[playerId]) _fridayData[leagueId].players[playerId].notes = notes || null;
    document.querySelector('.friday-modal')?.remove();
    showToast('ההערות נשמרו ✅');
    renderFridayLeagueContent(leagueId, _fridayData[leagueId]);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}

// ---- REPORTS ----
let _fridayReportsData = {};

async function loadFridayReports() {
  const content = document.getElementById('friday-league-content');
  if (!content) return;
  content.innerHTML = '<div style="text-align:center;color:#a0aec0;padding:24px">טוען נתונים...</div>';
  try {
    const snaps = await Promise.all(FRIDAY_LEAGUES.map(l => db.ref('fridayLeagues/' + l.id).get()));
    FRIDAY_LEAGUES.forEach((l, i) => { _fridayReportsData[l.id] = snaps[i].val() || {}; });
    renderFridayReports('summary');
  } catch(e) { content.innerHTML = `<div style="color:#c53030;padding:16px">שגיאה: ${e.message}</div>`; }
}

function renderFridayReports(mode) {
  const content = document.getElementById('friday-league-content');
  if (!content) return;
  const modeBar = `
    <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">
      ${['summary','bydate','byplayer'].map((m,i) => {
        const labels = ['👥 שנתי לפי ליגה','📅 לפי תאריך','🧑 לפי שחקן'];
        return `<button onclick="renderFridayReports('${m}')"
          style="padding:8px 16px;border-radius:8px;border:1px solid #e2e8f0;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;background:${mode===m?'#6b46c1':'white'};color:${mode===m?'white':'#4a5568'}">${labels[i]}</button>`;
      }).join('')}
    </div>`;

  let reportHtml = '';
  if (mode === 'summary') {
    reportHtml = FRIDAY_LEAGUES.map(l => {
      const data = _fridayReportsData[l.id] || {};
      const players = data.players ? Object.entries(data.players).map(([id,p]) => ({id,...p})) : [];
      const dates = data.dates ? Object.values(data.dates).sort() : [];
      if (!players.length) return `<div style="color:#a0aec0;font-size:13px;margin-bottom:16px">${l.name}: אין שחקנים</div>`;
      const rows = players.map((p,i) => {
        const att = p.attendance || {};
        const present = dates.filter(d => att[d]).length;
        const pct = dates.length > 0 ? Math.round(present/dates.length*100) : 0;
        const col = pct>=80?'#276749':pct>=60?'#d69e2e':'#e53e3e';
        return `<tr style="border-bottom:1px solid #f0f4f8">
          <td style="padding:8px 12px;font-size:13px">${i+1}</td>
          <td style="padding:8px 12px;font-size:14px;font-weight:600">${p.name}</td>
          <td style="padding:8px 12px;text-align:center;font-weight:700;color:#2b6cb0">${present}</td>
          <td style="padding:8px 12px;text-align:center;color:#718096">${dates.length}</td>
          <td style="padding:8px 12px;text-align:center;font-weight:700;color:${col}">${pct}%</td>
          <td style="padding:8px 20px 8px 12px"><div style="background:#e2e8f0;border-radius:4px;height:8px;width:100%;min-width:80px"><div style="background:${col};height:8px;border-radius:4px;width:${pct}%"></div></div></td>
        </tr>`;
      }).join('');
      const thS = 'padding:9px 12px;text-align:right;font-size:12px;font-weight:700;color:#4a5568;border-bottom:2px solid #e2e8f0;background:#f7fafc';
      return `<div style="margin-bottom:24px">
        <div style="font-size:15px;font-weight:700;color:${l.color};margin-bottom:10px">${l.name} — ${players.length} שחקנים, ${dates.length} ימי שישי</div>
        <div style="overflow-x:auto;border-radius:10px;border:1px solid #e2e8f0">
          <table style="width:100%;border-collapse:collapse">
            <thead><tr><th style="${thS}">#</th><th style="${thS}">שם</th><th style="${thS};text-align:center">נוכח</th><th style="${thS};text-align:center">מתוך</th><th style="${thS};text-align:center">%</th><th style="${thS}">גרף</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div></div>`;
    }).join('');

  } else if (mode === 'bydate') {
    const allDates = [...new Set(FRIDAY_LEAGUES.flatMap(l =>
      Object.values(_fridayReportsData[l.id]?.dates || {})))].sort().reverse();
    const selDate = allDates[0] || '';
    const dateOpts = allDates.map(d => {
      const dd = new Date(d);
      return `<option value="${d}">${dd.toLocaleDateString('he-IL',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</option>`;
    }).join('');
    const dateContent = selDate ? buildFridayByDateReport(selDate) : '<div style="color:#a0aec0;padding:20px">אין תאריכים</div>';
    reportHtml = `
      <div style="margin-bottom:16px">
        <label style="font-size:13px;font-weight:600;color:#4a5568;margin-left:8px">תאריך:</label>
        <select onchange="document.getElementById('fl-bydate-content').innerHTML=buildFridayByDateReport(this.value)"
          style="padding:8px 12px;border:2px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit">${dateOpts}</select>
      </div>
      <div id="fl-bydate-content">${dateContent}</div>`;

  } else {
    const allPlayers = FRIDAY_LEAGUES.flatMap(l => {
      const data = _fridayReportsData[l.id] || {};
      return data.players ? Object.entries(data.players).map(([id,p]) => ({id, leagueId:l.id, leagueName:l.name, leagueColor:l.color, ...p})) : [];
    });
    if (!allPlayers.length) {
      reportHtml = '<div style="color:#a0aec0;padding:20px;text-align:center">אין שחקנים</div>';
    } else {
      const opts = allPlayers.map(p => `<option value="${p.leagueId}__${p.id}">${p.name} (${p.leagueName})</option>`).join('');
      const firstKey = allPlayers[0].leagueId + '__' + allPlayers[0].id;
      reportHtml = `
        <div style="margin-bottom:16px">
          <label style="font-size:13px;font-weight:600;color:#4a5568;margin-left:8px">שחקן:</label>
          <select onchange="document.getElementById('fl-byplayer-content').innerHTML=buildFridayByPlayerReport(this.value)"
            style="padding:8px 12px;border:2px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit">${opts}</select>
        </div>
        <div id="fl-byplayer-content">${buildFridayByPlayerReport(firstKey)}</div>`;
    }
  }

  content.innerHTML = modeBar + reportHtml;
}

function buildFridayByDateReport(dateStr) {
  const dd = new Date(dateStr);
  const dateLabel = dd.toLocaleDateString('he-IL',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  return FRIDAY_LEAGUES.map(l => {
    const data = _fridayReportsData[l.id] || {};
    const players = data.players ? Object.entries(data.players).map(([id,p]) => ({id,...p})) : [];
    const hasDates = data.dates && Object.values(data.dates).includes(dateStr);
    if (!players.length || !hasDates) return '';
    const present = players.filter(p => p.attendance?.[dateStr]);
    const absent = players.filter(p => !p.attendance?.[dateStr]);
    return `<div style="margin-bottom:20px">
      <div style="font-size:14px;font-weight:700;color:${l.color};margin-bottom:8px">${l.name} — ${present.length}/${players.length} נכחו</div>
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <div style="flex:1;min-width:160px">
          <div style="font-size:12px;font-weight:700;color:#276749;margin-bottom:6px">✅ נכחו (${present.length})</div>
          ${present.map(p=>`<div style="padding:4px 8px;font-size:13px">${p.name}</div>`).join('') || '<div style="color:#a0aec0;font-size:13px">אף אחד</div>'}
        </div>
        <div style="flex:1;min-width:160px">
          <div style="font-size:12px;font-weight:700;color:#c53030;margin-bottom:6px">❌ לא נכחו (${absent.length})</div>
          ${absent.map(p=>`<div style="padding:4px 8px;font-size:13px">${p.name}</div>`).join('') || '<div style="color:#a0aec0;font-size:13px">אף אחד</div>'}
        </div>
      </div>
    </div>`;
  }).join('') || '<div style="color:#a0aec0;padding:12px">אין נתונים לתאריך זה</div>';
}

function buildFridayByPlayerReport(key) {
  const [leagueId, playerId] = key.split('__');
  const data = _fridayReportsData[leagueId] || {};
  const player = data.players?.[playerId];
  const league = FRIDAY_LEAGUES.find(l => l.id === leagueId);
  if (!player) return '<div style="color:#a0aec0;padding:12px">לא נמצא שחקן</div>';
  const dates = data.dates ? Object.values(data.dates).sort() : [];
  const att = player.attendance || {};
  const present = dates.filter(d => att[d]).length;
  const pct = dates.length > 0 ? Math.round(present/dates.length*100) : 0;
  const col = pct>=80?'#276749':pct>=60?'#d69e2e':'#e53e3e';
  const dots = dates.map(d => {
    const dd = new Date(d);
    return `<div title="${dd.toLocaleDateString('he-IL')}" style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;font-size:11px;font-weight:700;margin:3px;background:${att[d]?'#c6f6d5':'#fed7d7'};color:${att[d]?'#276749':'#c53030'}">${dd.getDate()}/${dd.getMonth()+1}</div>`;
  }).join('');
  return `
    <div style="background:#f7fafc;border-radius:10px;padding:16px;margin-bottom:16px;display:flex;gap:24px;flex-wrap:wrap;align-items:center">
      <div style="text-align:center"><div style="font-size:32px;font-weight:800;color:${col}">${pct}%</div><div style="font-size:12px;color:#718096">נוכחות</div></div>
      <div style="text-align:center"><div style="font-size:28px;font-weight:800;color:#2b6cb0">${present}</div><div style="font-size:12px;color:#718096">מתוך ${dates.length}</div></div>
      <div><div style="font-size:13px;font-weight:700;color:${league.color}">${league.name}</div>${player.notes?`<div style="font-size:12px;color:#718096;margin-top:4px">📝 ${player.notes}</div>`:''}</div>
    </div>
    <div style="font-size:12px;font-weight:700;color:#4a5568;margin-bottom:8px">נוכחות לפי תאריך:</div>
    <div style="line-height:2">${dots || '<div style="color:#a0aec0">אין תאריכים</div>'}</div>`;
}

async function removeFridayDate(leagueId, dateStr) {
  const datesObj = _fridayData[leagueId]?.dates || {};
  const key = Object.entries(datesObj).find(([k,v]) => v === dateStr)?.[0];
  if (!key) return;
  try {
    await db.ref(`fridayLeagues/${leagueId}/dates/${key}`).remove();
    showToast('התאריך הוסר');
    loadFridayLeague(leagueId);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}

async function clearAllFridayDates(leagueId) {
  if (!confirm('למחוק את כל התאריכים מהליגה?')) return;
  try {
    await db.ref(`fridayLeagues/${leagueId}/dates`).remove();
    showToast('כל התאריכים נמחקו');
    loadFridayLeague(leagueId);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}

async function removeFridayPlayer(leagueId, playerId) {
  const player = _fridayData[leagueId]?.players?.[playerId];
  if (!confirm(`להסיר את ${player?.name||'השחקן'} מהליגה?`)) return;
  try {
    await db.ref(`fridayLeagues/${leagueId}/players/${playerId}`).remove();
    showToast('השחקן הוסר');
    loadFridayLeague(leagueId);
  } catch(e) { showToast('שגיאה: ' + e.message, 'error'); }
}

