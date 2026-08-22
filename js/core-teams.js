// ===== FIREBASE CONFIG =====
// קבל את ה-API Key מ: Firebase Console → Project Settings → Your Apps → Web → Config
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCTGtk2rj9QcdFqtxLvALdkWVil5SPgvn8',
  authDomain: 'rishon-lezion-chess-mana-e9f5b.firebaseapp.com',
  databaseURL: 'https://rishon-lezion-chess-mana-e9f5b-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'rishon-lezion-chess-mana-e9f5b',
};

let db = null;
let auth = null;
let _vacations = {};
let _teamVacations = {};
let _history = {};
function initFirebase() {
  if (FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY_HERE') return false;
  try {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.database();
    auth = firebase.auth();
    return true;
  } catch(e) { console.error('Firebase init error:', e); return false; }
}

const CURRENT_YEAR = 2026;
let YEAR_START = '2025-09-01';
let YEAR_END = '2026-06-30';

function calcAge(birthYear) {
  if (!birthYear) return null;
  return CURRENT_YEAR - birthYear;
}

function splitName(fullName) {
  if (!fullName) return { first: '', last: '' };
  // Clean notes like (פרש), (כנראה פרש)
  const cleaned = fullName.replace(/\s*\(.*?\)\s*/g, '').trim();
  const spaceIdx = cleaned.indexOf(' ');
  if (spaceIdx === -1) return { first: cleaned, last: '' };
  return {
    first: cleaned.substring(0, spaceIdx).trim(),
    last: cleaned.substring(spaceIdx + 1).trim()
  };
}

const ALL_GROUPS = [
  {
    id: 'galb-sheni',
    name: 'גלב — יום שני',
    instructor: 'גלב',
    instructorWa: '972545813743',
    day: 'יום שני',
    dayOfWeek: 1,
    subGroups: [
      {
        time: '1200–1400',
        players: [
          { name: "דניקה פבלוצ'נקו", birthYear: 2015, fedId: null, joinDate: '2025-09-01' },
          { name: 'ליאם ריבקין', birthYear: 2018, fedId: null, joinDate: '2025-09-01' },
          { name: 'יסמין מרנסקי', birthYear: 2014, fedId: null, joinDate: '2025-09-01' },
          { name: 'ריי פיטלוביץ', birthYear: 2017, fedId: null, joinDate: '2025-09-01' },
          { name: 'דניאל ביבס', birthYear: 2017, fedId: null, joinDate: '2025-09-01' },
          { name: 'אוהד און', birthYear: 2017, fedId: null, joinDate: '2025-09-01' },
          { name: 'דור זברסקי', birthYear: 2019, fedId: null, joinDate: '2025-09-01' },
          { name: 'אדם הולי', birthYear: 2014, fedId: null, joinDate: '2025-09-01' },
          { name: 'סטיב הלפרין', birthYear: 2012, fedId: null, joinDate: '2025-09-01' },
          { name: 'אור ברסקין', birthYear: 2017, fedId: null, joinDate: '2025-09-08' },
          { name: 'דוד ולדמן', birthYear: 2018, fedId: null, joinDate: '2025-09-15' },
          { name: 'נועה וקסלר', birthYear: 2017, fedId: null, joinDate: '2025-09-01' },
          { name: 'אימי ורסנו', birthYear: 2017, fedId: null, joinDate: '2025-09-08' },
          { name: 'אדר רייכבך', birthYear: 2017, fedId: null, joinDate: '2025-09-08' },
          { name: 'איתן רוזנוב', birthYear: 2017, fedId: null, joinDate: '2025-10-20' },
          { name: 'וודים גלושקו', birthYear: 2015, fedId: null, joinDate: '2025-11-10' },
          { name: 'מיכאל סוחובלינסקי', birthYear: null, fedId: null, joinDate: '2025-09-22' },
          { name: 'מתי', birthYear: null, fedId: null, joinDate: '2025-12-01' },
          { name: 'נווה בנין', birthYear: null, fedId: null, joinDate: '2026-01-05' },
        ]
      },
      {
        time: '1400–1600',
        players: [
          { name: 'תום עזרא', birthYear: 2013, fedId: null, joinDate: '2025-09-01' },
          { name: 'שון גייסינסקי', birthYear: 2012, fedId: null, joinDate: '2025-09-01' },
          { name: 'ארד רביב', birthYear: 2017, fedId: null, joinDate: '2025-09-01' },
          { name: 'גאורגי בוזגלוב', birthYear: 2015, fedId: null, joinDate: '2025-09-01' },
          { name: 'אמיר קושניר', birthYear: 2015, fedId: null, joinDate: '2025-09-01' },
          { name: 'ליאו לוחם', birthYear: 2017, fedId: null, joinDate: '2025-09-01' },
          { name: 'יעקב יחקינד', birthYear: 2014, fedId: null, joinDate: '2025-09-08' },
          { name: 'משה אופנר', birthYear: null, fedId: null, joinDate: '2025-09-29' },
          { name: 'יאלי סטז\'רו', birthYear: null, fedId: null, joinDate: '2025-09-01' },
          { name: 'ליאורה מזרחי', birthYear: null, fedId: null, joinDate: '2025-12-01' },
        ]
      }
    ]
  },
  {
    id: 'galb-revii',
    name: 'גלב — יום רביעי',
    instructor: 'גלב',
    instructorWa: '972545813743',
    day: 'יום רביעי',
    dayOfWeek: 3,
    subGroups: [
      {
        time: '1200–1400',
        players: [
          { name: 'ליאם ריבקין', birthYear: 2018, fedId: null, joinDate: '2025-09-03' },
          { name: 'דור זברסקי', birthYear: 2019, fedId: null, joinDate: '2025-09-03' },
          { name: 'אדם הולי', birthYear: 2014, fedId: null, joinDate: '2025-09-03' },
          { name: "דניקה פבלוצ'נקו", birthYear: 2015, fedId: null, joinDate: '2025-09-03' },
          { name: 'אלון קהת', birthYear: 2016, fedId: null, joinDate: '2025-09-03' },
          { name: 'אריאל מוסקוביץ', birthYear: 2016, fedId: null, joinDate: '2025-09-03' },
          { name: 'דן רחקוביץ', birthYear: 2013, fedId: null, joinDate: '2025-09-03' },
          { name: 'אווה מירצבסקי', birthYear: 2014, fedId: null, joinDate: '2025-09-03' },
          { name: 'גלעד זסרמן', birthYear: 2017, fedId: null, joinDate: '2025-09-03' },
          { name: 'מאיה אטר', birthYear: 2017, fedId: null, joinDate: '2025-09-03' },
          { name: 'אוריאן זילברמן', birthYear: 2011, fedId: null, joinDate: '2025-09-10' },
          { name: 'עידו כליף', birthYear: 2016, fedId: null, joinDate: '2025-09-10' },
          { name: 'יואב כליף', birthYear: 2016, fedId: null, joinDate: '2025-09-10' },
          { name: 'ריי פיטלוביץ', birthYear: 2017, fedId: null, joinDate: '2025-09-17' },
          { name: 'מרטה טשקינוב', birthYear: 2014, fedId: null, joinDate: '2025-09-17' },
          { name: 'מיכאל סוחובלינסקי', birthYear: null, fedId: null, joinDate: '2025-11-19' },
        ]
      },
      {
        time: '1400–1600',
        players: [
          { name: 'אופק פינקלשטיין', birthYear: 2017, fedId: null, joinDate: '2025-09-03' },
          { name: 'ארד רביב', birthYear: 2017, fedId: null, joinDate: '2025-09-03' },
          { name: 'ליאו לוחם', birthYear: 2017, fedId: null, joinDate: '2025-09-03' },
          { name: 'גאורגי בוזגלוב', birthYear: 2015, fedId: null, joinDate: '2025-09-03' },
          { name: 'שון גייסינסקי', birthYear: 2012, fedId: null, joinDate: '2025-09-03' },
          { name: 'מתן זיסרמן', birthYear: 2012, fedId: null, joinDate: '2025-09-03' },
          { name: 'יעקב יחקינד', birthYear: 2014, fedId: null, joinDate: '2025-09-03' },
          { name: 'רומי לרנר', birthYear: 2011, fedId: null, joinDate: '2025-09-03' },
          { name: 'אריאל ינקוביץ', birthYear: 2014, fedId: null, joinDate: '2025-09-03' },
          { name: 'יאיר זנקו', birthYear: 2014, fedId: null, joinDate: '2025-10-15' },
          { name: 'אור ארגמן', birthYear: 2013, fedId: null, joinDate: '2025-10-22' },
          { name: 'נטע שוסט', birthYear: 2013, fedId: null, joinDate: '2025-09-10' },
          { name: 'ליאורה מזרחי', birthYear: null, fedId: null, joinDate: '2025-12-03' },
        ]
      }
    ]
  },
  {
    id: 'maya-rishon',
    name: 'מאיה — יום ראשון',
    instructor: 'מאיה',
    instructorWa: '972543291449',
    day: 'יום ראשון',
    dayOfWeek: 0,
    subGroups: [
      {
        time: '',
        players: [
          { name: 'עידו צוגלין', birthYear: null, fedId: null, joinDate: '2025-09-14' },
          { name: 'שירה פיטלוביץ', birthYear: null, fedId: null, joinDate: '2025-09-14' },
          { name: 'לביא אשר', birthYear: null, fedId: null, joinDate: '2025-09-21' },
          { name: 'איילה פולברניס', birthYear: null, fedId: null, joinDate: '2025-11-16' },
          { name: 'קשת מורדכוביץ', birthYear: null, fedId: null, joinDate: '2025-12-28' },
          { name: 'תומאס חייטוביץ', birthYear: null, fedId: null, joinDate: '2026-01-25' },
        ]
      }
    ]
  },
  {
    id: 'vitaly-sheni',
    name: 'ויטלי — יום שני',
    instructor: 'ויטלי',
    instructorWa: '972545305402',
    day: 'יום שני',
    dayOfWeek: 1,
    subGroups: [
      {
        time: '1600–1800',
        players: [
          { name: "דן אוצ'רטיאנסקי", birthYear: 2013, fedId: 208480, joinDate: '2025-09-01' },
          { name: 'תומר כהן', birthYear: 2012, fedId: 199422, joinDate: '2025-09-01' },
          { name: 'יונתן סדובסקי', birthYear: 2010, fedId: 197103, joinDate: '2025-09-01' },
          { name: 'ליאם סבטאב', birthYear: 2015, fedId: 203280, joinDate: '2025-09-01' },
          { name: 'עומר רבינוביץ', birthYear: 2012, fedId: 199935, joinDate: '2025-09-01' },
          { name: 'איתן הרכבי', birthYear: 2011, fedId: 196599, joinDate: '2025-09-01' },
          { name: 'זוהר שוורץ', birthYear: 2013, fedId: 201767, joinDate: '2025-09-01' },
          { name: 'דניאל מרנסקי', birthYear: 2010, fedId: 198866, joinDate: '2025-09-01' },
          { name: 'יונתן מינקין', birthYear: 2012, fedId: 198616, joinDate: '2025-09-01' },
          { name: "ארטמי פקרצ'יק", birthYear: 2012, fedId: 209808, joinDate: '2025-09-01' },
          { name: 'תומר טיחובר', birthYear: 2012, fedId: 201681, joinDate: '2025-10-20' },
          { name: 'שני דרובין', birthYear: 2009, fedId: 195951, joinDate: '2026-01-05' },
          { name: 'אריאל ינקוביץ', birthYear: 2014, fedId: 199821, joinDate: '2026-01-12' },
        ]
      }
    ]
  },
  {
    id: 'yaron-rishon',
    name: 'ירון — יום ראשון',
    instructor: 'ירון',
    instructorWa: '972507949335',
    day: 'יום ראשון',
    dayOfWeek: 0,
    subGroups: [
      {
        time: 'קבוצה א',
        players: [
          { name: 'איתן הלפרן', birthYear: 2018, fedId: 209383, joinDate: '2025-09-07' },
          { name: 'ינון פינגלי', birthYear: 2011, fedId: 210807, joinDate: '2025-09-14' },
          { name: 'רן אפשטיין', birthYear: 2015, fedId: 204413, joinDate: '2025-09-07' },
          { name: 'אריאל חדד', birthYear: null, fedId: null, joinDate: '2025-09-07' },
          { name: 'נדב הולין', birthYear: 2015, fedId: 207967, joinDate: '2025-09-07' },
          { name: 'טוהר לסרי', birthYear: null, fedId: null, joinDate: '2025-09-07' },
          { name: 'עומר לוי', birthYear: null, fedId: null, joinDate: '2025-09-07' },
          { name: 'נעם', birthYear: null, fedId: null, joinDate: '2025-09-07' },
          { name: 'אריאל ורדיין', birthYear: 2014, fedId: 203283, joinDate: '2025-09-07' },
          { name: 'יאיר ביצוצקי', birthYear: 2014, fedId: 206928, joinDate: '2025-09-07' },
          { name: 'אלון גרטי', birthYear: 2019, fedId: 207921, joinDate: '2025-09-14' },
          { name: 'אוריאן זילברמן', birthYear: null, fedId: null, joinDate: '2025-09-21' },
          { name: 'אביגיל בשין', birthYear: null, fedId: null, joinDate: '2025-10-05' },
          { name: 'יהלי ויג', birthYear: null, fedId: null },
          { name: 'דימה לדוב', birthYear: null, fedId: null, joinDate: '2026-02-15' },
          { name: 'אילון זיסמן', birthYear: null, fedId: null, joinDate: '2025-12-14' },
        ]
      },
      {
        time: 'קבוצה ב',
        players: [
          { name: 'פאולה סדובסקי', birthYear: null, fedId: null, joinDate: '2025-09-07' },
          { name: 'יונתן נוסרט', birthYear: null, fedId: null, joinDate: '2025-09-07' },
          { name: 'גדעון מיטל', birthYear: null, fedId: null, joinDate: '2025-09-07' },
          { name: 'בועז פלדי', birthYear: null, fedId: null, joinDate: '2025-09-07' },
          { name: "דזין גיא", birthYear: null, fedId: null, joinDate: '2025-09-14' },
          { name: 'איתן לוי', birthYear: null, fedId: null, joinDate: '2025-09-14' },
          { name: 'לאוניד רפוגץ', birthYear: null, fedId: null, joinDate: '2025-10-19' },
        ]
      }
    ]
  },
  {
    id: 'yaron-chamishi',
    name: 'ירון — יום חמישי',
    instructor: 'ירון',
    instructorWa: '972507949335',
    day: 'יום חמישי',
    dayOfWeek: 4,
    subGroups: [
      {
        time: 'קבוצה א (מתחילים)',
        players: [
          { name: 'שחר קוט', birthYear: 2021, fedId: null, joinDate: '2025-09-11' },
          { name: 'עלמא אלקין', birthYear: 2020, fedId: null, joinDate: '2025-09-18' },
          { name: 'הראל זנקו', birthYear: 2020, fedId: null, joinDate: '2025-10-16' },
          { name: 'מעיין מזור', birthYear: 2020, fedId: null, joinDate: '2025-10-16' },
          { name: 'עידו צוגלין', birthYear: null, fedId: null },
          { name: 'נועם מלכה', birthYear: null, fedId: null, joinDate: '2026-02-05' },
          { name: 'טום אליעזר', birthYear: null, fedId: null, joinDate: '2025-09-04' },
          { name: 'אדם מרדכי', birthYear: null, fedId: null, joinDate: '2025-09-11' },
          { name: 'אור ביבס', birthYear: null, fedId: null, joinDate: '2025-09-11' },
        ]
      },
      {
        time: 'קבוצה ב',
        players: [
          { name: 'אביב גולובוב', birthYear: 2019, fedId: null, joinDate: '2025-09-04' },
          { name: 'יער נגב', birthYear: 2019, fedId: null, joinDate: '2025-09-04' },
          { name: 'מורי חכים', birthYear: 2018, fedId: null, joinDate: '2025-09-18' },
          { name: 'אביתר טל', birthYear: 2019, fedId: null, joinDate: '2025-09-04' },
          { name: 'פלג שרון', birthYear: 2019, fedId: null, joinDate: '2025-09-04' },
          { name: 'סהר לוי', birthYear: 2018, fedId: null, joinDate: '2025-09-11' },
          { name: 'יהונתן סוקולצקי', birthYear: 2018, fedId: null, joinDate: '2025-09-11' },
          { name: 'נועם זוהר', birthYear: null, fedId: null, joinDate: '2025-09-11' },
          { name: 'סמואל פומקין', birthYear: null, fedId: null, joinDate: '2025-09-18' },
          { name: 'שון קנטר', birthYear: 2018, fedId: null, joinDate: '2025-09-25' },
          { name: 'אייל אברון', birthYear: 2019, fedId: null, joinDate: '2025-09-25' },
          { name: 'איתי צור', birthYear: 2019, fedId: null, joinDate: '2025-10-30' },
          { name: 'אדר צור', birthYear: 2017, fedId: null, joinDate: '2025-10-30' },
          { name: 'אור קנטר', birthYear: 2018, fedId: null, joinDate: '2025-11-06' },
          { name: 'יהלי', birthYear: 2019, fedId: null, joinDate: '2025-11-06' },
        ]
      }
    ]
  }
];

let groups = [];
let _useDbGroups = false; // true = groups come from Firebase, don't fallback to ALL_GROUPS
let _deletedGroupIds = new Set(); // persisted in Firebase so ALL_GROUPS deletions survive refresh

let teams = [];

const PERMISSION_TABS = [
  { key: 'camps',            label: '🏕️ מחנות',            instructorDefault: false },
  { key: 'attendance',       label: '🗓 נוכחות',           instructorDefault: true  },
  { key: 'payments',         label: '💳 תשלומים',          instructorDefault: true  },
  { key: 'reports',          label: '📊 דוחות',            instructorDefault: true  },
  { key: 'calendar',         label: '📅 לוח שנה',          instructorDefault: true  },
  { key: 'hours',            label: '⏱️ שעות',             instructorDefault: false },
  { key: 'friday',           label: '♟ ליגות שישי',        instructorDefault: false },
  { key: 'club-tournaments', label: '🏆 תחרויות',          instructorDefault: false },
  { key: 'league-adults',    label: '♟ ליגות בוגרים',      instructorDefault: false },
  { key: 'league-women',     label: '♛ ליגות נשים',        instructorDefault: false },
  { key: 'league-youth',     label: '🎓 ליגות נוער',        instructorDefault: false },
  { key: 'league-stars',     label: '⭐ מצטייני ליגות',     instructorDefault: false },
  { key: 'saturday',         label: '🏅 מפגשי ליגה',        instructorDefault: false },
  { key: 'prospects',        label: '🌟 מצטייני גנים',      instructorDefault: false },
  { key: 'youth-players',    label: '👦 שחקני נוער',        instructorDefault: false },
  { key: 'audit',            label: '📊 פעילות מדריכים',    instructorDefault: false },
  { key: 'schedule-editor',  label: '📅 לוח חוגים',         instructorDefault: false },
  { key: 'site-content',     label: '📝 עמוד הבית',         instructorDefault: false },
  { key: 'news-posts',       label: '📰 כתבות',             instructorDefault: false },
  { key: 'club-people',      label: '👥 אנשי המועדון',      instructorDefault: false },
  { key: 'tourn-cal',        label: '📅 גאנט תחרויות',      instructorDefault: false },
  { key: 'monthly-cal',      label: '📅 לוח חודשי',         instructorDefault: false },
];

function hasTabPerm(tabKey) {
  if (!currentUser || currentUser.role === 'admin') return true;
  const perms = currentUser.permissions || {};
  if (tabKey in perms) return !!perms[tabKey];
  // Instructor defaults
  const tab = PERMISSION_TABS.find(t => t.key === tabKey);
  return tab ? tab.instructorDefault : false;
}
let _useDbTeams = false;
let _addPlayerIsTeam = false;
let _teamProfileState = { teamIdx: 0, subTeamIdx: 0, playerIdx: 0 };

let camps = [];
let _useDbCamps = false;

async function loadDbGroups() {
  if (!db) return;
  try {
    const snap = await db.ref('dbGroups').get();
    const data = snap.val();
    if (!data) return;
    _useDbGroups = true;
    groups = Object.entries(data).filter(([id, g]) => g && g.name).map(([id, g]) => ({
      id,
      name: g.name,
      instructor: g.instructor || '',
      day: g.day || '',
      dayOfWeek: g.dayOfWeek ?? -1,
      meetings: Array.isArray(g.meetings) ? g.meetings : (g.meetings ? Object.values(g.meetings) : []),
      subGroups: Array.isArray(g.subGroups)
        ? g.subGroups.map(sg => ({ time: sg.time || '', day: sg.day ?? null, meetingTime: sg.meetingTime || '', location: sg.location || '', players: [] }))
        : g.subGroups
          ? Object.values(g.subGroups).map(sg => ({ time: sg.time || '', day: sg.day ?? null, meetingTime: sg.meetingTime || '', location: sg.location || '', players: [] }))
          : [{ time: 'קבוצה א', day: null, meetingTime: '', location: '', players: [] }]
    }));
  } catch(e) { console.error('loadDbGroups error:', e); }
}

const ALL_TEAMS = [
  // ── מערב ──
  { name: 'נגבה',       coach: 'אריק',            region: 'מערב' },
  { name: 'כרמים',      coach: 'אריק',            region: 'מערב' },
  { name: 'נוה עוז',    coach: 'אדוארד',          region: 'מערב' },
  { name: 'מרחבים',     coach: 'אדוארד',          region: 'מערב' },
  { name: 'שקמה',       coach: 'אדוארד',          region: 'מערב' },
  { name: 'נווה חוף',   coach: 'אדוארד',          region: 'מערב' },
  { name: 'חופית',      coach: 'אדוארד',          region: 'מערב' },
  { name: 'מיתרים',     coach: 'ליבי',            region: 'מערב' },
  { name: 'נווה דקלים', coach: 'יבגני',           region: 'מערב' },
  { name: 'ידלין',      coach: 'גלב',             region: 'מערב' },
  { name: 'ניצנים',     coach: 'יבגני',           region: 'מערב' },
  { name: 'עין הקורא',  coach: 'גלב',             region: 'מערב' },
  { name: 'בארי',       coach: 'יבגני',           region: 'מערב' },
  // ── מזרח ──
  { name: 'יפה נוף',    coach: 'גלב',             region: 'מזרח' },
  { name: 'יסוד המעלה', coach: 'יבגני',           region: 'מזרח' },
  { name: 'אריאל שרון', coach: 'ליבי',            region: 'מזרח' },
  { name: 'הדרים',      coach: 'ליבי',            region: 'מזרח' },
  { name: 'מישור הנוף', coach: 'ליבי',            region: 'מזרח' },
  { name: 'עדיני',      coach: 'ליבי',            region: 'מזרח' },
  { name: 'אשכולות',    coach: 'גלב',             region: 'מזרח' },
  { name: 'אלונים',     coach: 'שמוליק',          region: 'מזרח' },
  { name: 'אליאב',      coach: 'זאב',             region: 'מזרח' },
  { name: 'רקפות',      coach: 'יבגני לבנזוב',   region: 'מזרח' },
  { name: 'תמיר',       coach: 'זאב',             region: 'מזרח' },
];

async function loadDbTeams() {
  if (!db) return;
  try {
    const snap = await db.ref('dbTeams').get();
    const data = snap.val();
    if (data) {
      _useDbTeams = true;
      teams = Object.entries(data).map(([id, t]) => ({
        id,
        name:     t.name || t.teamName || t.label || id.replace(/^team-/,'').replace(/-\d{3,}$/,'').replace(/-/g,' ').trim(),
        coach:    t.coach    || '',
        region:   t.region   || '',
        dayOfWeek: t.dayOfWeek ?? 0,
        meetings: t.meetings  || [],
        subGroups: (t.subGroups || [{ time: 'נבחרת א' }, { time: 'נבחרת ב' }])
                    .map(sg => ({ time: sg.time || '', day: sg.day ?? null, meetingTime: sg.meetingTime || '', location: sg.location || '', players: [] }))
      }));
      await db.ref('settings/teamsSeeded').set(true);
    } else {
      const seededSnap = await db.ref('settings/teamsSeeded').get();
      if (seededSnap.val()) {
        // Teams were already initialized before (via Firebase) and are now
        // genuinely empty — e.g. the admin deleted all of them, or year-end
        // archiving cleared them. Don't silently repopulate the hardcoded
        // default roster; leave it empty, same as groups behave.
        _useDbTeams = true;
        teams = [];
      } else {
        await seedDefaultTeams();
        await db.ref('settings/teamsSeeded').set(true);
      }
    }
  } catch(e) { console.error('loadDbTeams error:', e); }
}

async function seedDefaultTeams() {
  _useDbTeams = true;
  const subGroups = [{ time: 'נבחרת א' }, { time: 'נבחרת ב' }];
  for (const t of ALL_TEAMS) {
    const id = 'team-' + t.name.replace(/[^א-תa-zA-Z0-9]/g, '-').replace(/-+/g,'-') + '-' + Date.now() % 100000;
    const def = { name: t.name, coach: t.coach, region: t.region, subGroups };
    try {
      await db.ref(`dbTeams/${id}`).set(def);
      teams.push({ id, ...def, subGroups: subGroups.map(sg => ({ time: sg.time, players: [] })) });
    } catch(e) { console.error('seedDefaultTeams error for ' + t.name, e); }
  }
  showToast(`${teams.length} נבחרות נטענו ✅`);
}

async function loadTeamPlayers() {
  if (!db || teams.length === 0) return;
  try {
    const snap = await db.ref('team_players').get();
    const playersData = snap.val() || {};
    teams.forEach((team, teamIdx) => {
      const tPlayers = playersData[team.id] || {};
      team.subGroups.forEach((sg, si) => {
        const sgPlayers = tPlayers[si] || {};
        sg.players = Object.entries(sgPlayers).map(([key, p], idx) => ({
          name: `${p.firstName || ''} ${p.lastName || ''}`.trim(),
          firstName:     p.firstName     || '',
          lastName:      p.lastName      || '',
          birthYear:     p.birthYear     || null,
          fedId:         p.fedId         || null,
          rating:        p.rating        || null,
          cardExpiry:    p.cardExpiry    || null,
          gender:        p.gender        || null,
          joinDate:      p.joinDate      || null,
          paymentStatus: p.paymentStatus || 'trial',
          parentPhone:   p.parentPhone   || null,
          parentEmail:   p.parentEmail   || null,
          hidden:        !!p.hidden,
          _key: key
        }));
      });
      const panel = document.getElementById('panel-team-' + team.id);
      if (panel) panel.innerHTML = renderTeamGroup(team, teamIdx);
    });
  } catch(e) { console.error('loadTeamPlayers error:', e); }
}

async function loadDbCamps() {
  if (!db) return;
  try {
    const snap = await db.ref('dbCamps').get();
    const data = snap.val();
    camps = data ? Object.entries(data).map(([id, c]) => ({
      id,
      name: c.name || '',
      startDate: c.startDate || null,
      endDate: c.endDate || null,
      levels: (c.levels || []).map(lv => ({ name: lv.name || '', instructor: lv.instructor || '', players: [] }))
    })) : [];
  } catch(e) { console.error('loadDbCamps error:', e); camps = []; }
}

async function loadCampPlayers() {
  if (!db || camps.length === 0) return;
  try {
    const snap = await db.ref('camp_players').get();
    const playersData = snap.val() || {};
    camps.forEach(camp => {
      const cPlayers = playersData[camp.id] || {};
      camp.levels.forEach((lv, li) => {
        const lvPlayers = cPlayers[li] || {};
        lv.players = Object.entries(lvPlayers).map(([key, p]) => ({
          name: `${p.firstName || ''} ${p.lastName || ''}`.trim(),
          firstName:     p.firstName     || '',
          lastName:      p.lastName      || '',
          birthYear:     p.birthYear     || null,
          fedId:         p.fedId         || null,
          parentPhone:   p.parentPhone   || null,
          parentEmail:   p.parentEmail   || null,
          paymentStatus: p.paymentStatus || 'trial',
          hidden:        !!p.hidden,
          _key: key
        }));
      });
      const panel = document.getElementById('panel-camp-' + camp.id);
      if (panel) panel.innerHTML = renderCampOwnPage(camp);
    });
  } catch(e) { console.error('loadCampPlayers error:', e); }
}

async function loadDeletedGroups() {
  if (!db) return;
  try {
    const snap = await db.ref('deletedGroupIds').get();
    const data = snap.val();
    if (data) _deletedGroupIds = new Set(Object.keys(data));
  } catch(e) { console.warn('loadDeletedGroups error:', e); }
}

async function initializeApp() {
  if (db) { await Promise.all([loadDeletedGroups(), loadDbGroups(), loadDbTeams(), loadDbCamps()]); }
  buildApp();
  injectPermissionTabs();
  buildTopNav();
}

function sortedPlayers(players) {
  return players
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => !p.hidden)
    .sort((a, b) => {
      const la = splitName(a.p.name).last || '';
      const lb = splitName(b.p.name).last || '';
      return la.localeCompare(lb, 'he');
    });
}

function renderPlayer(player, displayNum, groupIdx, subGroupIdx, originalIdx) {
  const { first, last } = splitName(player.name);
  const age = calcAge(player.birthYear);
  const joinDateDisplay = player.joinDate
    ? `<span style="font-size:12px;color:#2b6cb0">${formatDate(player.joinDate)}</span>`
    : '<span style="color:#cbd5e0">—</span>';
  const payStatus = player.paymentStatus || 'trial';
  const payLabel = { trial: 'ניסיון', pending: 'ממתין', paid: 'שילם ✓' }[payStatus];
  return `
    <tr class="player-row" onclick="openPlayerProfile(${groupIdx},${subGroupIdx},${originalIdx})">
      <td class="idx">${displayNum}</td>
      <td class="last-name">${last || '<span style="color:#cbd5e0">—</span>'}</td>
      <td class="first-name">${first}</td>
      <td class="gender-col">${player.gender === 'm' ? '👦 ז' : player.gender === 'f' ? '👧 נ' : '<span style="color:#cbd5e0">—</span>'}</td>
      <td class="birth">
        ${player.birthYear
          ? `<span class="year">${player.birthYear}</span><span class="age">גיל ${age}</span>`
          : '<span style="color:#cbd5e0">לא ידוע</span>'}
      </td>
      <td class="${player.fedId ? 'fed-id' : 'fed-id empty'}">
        ${player.fedId ? player.fedId : 'חסר'}
      </td>
      <td style="text-align:center">${player.rating ? `<span style="font-weight:600;color:#2b6cb0">${player.rating}</span>` : '<span style="color:#cbd5e0">—</span>'}</td>
      <td style="text-align:center">${player.cardExpiry ? cardExpiryBadge(player.cardExpiry) : '<span style="color:#cbd5e0">—</span>'}</td>
      <td style="text-align:center">${joinDateDisplay}</td>
      <td style="text-align:center"><span class="pay-badge pay-${payStatus}">${payLabel}</span></td>
    </tr>`;
}

function renderSubGroup(sg, showTime, groupIdx, subGroupIdx) {
  const totalPlayers = sg.players.filter(p => !p.hidden).length;
  const fid = `${groupIdx}-${subGroupIdx}`;
  const sorted = sortedPlayers(sg.players);
  return `
    <div class="sub-group">
      <div class="sub-group-header">
        <div>
          <h3 id="sgname-header-${fid}" style="display:flex;align-items:center;gap:6px">
            <span>${showTime && sg.time ? sg.time : 'שחקנים'}</span>
            <button class="btn-edit-name" onclick="editSubGroupName(${groupIdx},${subGroupIdx})" title="ערוך שם">✎</button>
          </h3>
          <div class="count">${totalPlayers} שחקנים</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn-add-in-header" style="background:rgba(255,255,255,0.15)" onclick="printPlayerList(${groupIdx},${subGroupIdx})">🖨️ הדפס</button>
          <button class="btn-add-in-header" style="background:rgba(37,211,102,0.2);border:1px solid rgba(37,211,102,0.4)" onclick="openWhatsAppExport(${groupIdx},${subGroupIdx})">📲 WhatsApp</button>
          <button class="btn-add-in-header" id="addBtn-${fid}" onclick="toggleAddPlayerForm(${groupIdx},${subGroupIdx})">➕ הוסף משתתף</button>
        </div>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>שם משפחה</th>
              <th>שם פרטי</th>
              <th class="gender-col">מין</th>
              <th>שנת לידה / גיל</th>
              <th>מספר שחקן</th>
              <th style="text-align:center">מד כושר</th>
              <th style="text-align:center">כרטיס שחמטאי</th>
              <th style="text-align:center">הצטרפות</th>
              <th style="text-align:center">תשלום</th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map(({ p, i }, displayNum) => renderPlayer(p, displayNum + 1, groupIdx, subGroupIdx, i)).join('')}
          </tbody>
        </table>
      </div>
      <div class="stats-bar">
        ${sg.players.filter(p => p.fedId).length} מתוך ${totalPlayers} עם מספר שחקן
        &nbsp;·&nbsp;
        ${sg.players.filter(p => p.birthYear).length} מתוך ${totalPlayers} עם שנת לידה
      </div>
    </div>`;
}

function renderGroup(group, groupIdx) {
  const showTime = group.subGroups.length > 1 || (group.subGroups[0] && group.subGroups[0].time);
  const meetingsBadge = (group.meetings || []).length > 0
    ? `<span style="font-size:12px;color:rgba(255,255,255,0.6);margin-right:6px">${formatTeamMeetingsSummary(group.meetings)}</span>` : '';
  const header = `<div class="group-name-header" id="gname-header-${groupIdx}" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
      <span class="group-name-text">${group.name}</span>
      <button class="btn-edit-name" onclick="editGroupName(${groupIdx})" title="ערוך שם">✎</button>
      ${meetingsBadge}
    </div>
  </div>`;
  const historySection = `<div style="margin-top:8px">
    <button onclick="toggleHistory(${groupIdx})" style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:8px 16px;cursor:pointer;font-size:13px;color:#718096;font-family:inherit;width:100%;text-align:center">📋 היסטוריית שינויים</button>
    <div id="historyContent-${groupIdx}" style="display:none"></div>
  </div>`;
  return header + group.subGroups.map((sg, si) => renderSubGroup(sg, showTime, groupIdx, si)).join('') + historySection;
}

// ===== TEAMS RENDERING =====

function renderTeamPlayer(player, displayNum, teamIdx, subTeamIdx, originalIdx) {
  const { first, last } = splitName(player.name);
  const age = calcAge(player.birthYear);
  const joinDateDisplay = player.joinDate
    ? `<span style="font-size:12px;color:#2b6cb0">${formatDate(player.joinDate)}</span>`
    : '<span style="color:#cbd5e0">—</span>';
  const payStatus = player.paymentStatus || 'trial';
  const payLabel = { trial: 'ניסיון', pending: 'ממתין', paid: 'שילם ✓' }[payStatus];
  const levelMap = { beginner: 'מתחיל', intermediate: 'ממשיך', advanced: 'מתקדם' };
  const levelClass = { beginner: 'level-beginner', intermediate: 'level-intermediate', advanced: 'level-advanced' };
  const levelDisplay = player.level && levelMap[player.level]
    ? `<span class="level-badge ${levelClass[player.level]}">${levelMap[player.level]}</span>`
    : '<span style="color:#cbd5e0">—</span>';
  return `
    <tr class="player-row" onclick="openTeamPlayerProfile(${teamIdx},${subTeamIdx},${originalIdx})">
      <td class="idx">${displayNum}</td>
      <td class="last-name">${last || '<span style="color:#cbd5e0">—</span>'}</td>
      <td class="first-name">${first}</td>
      <td class="gender-col">${player.gender === 'm' ? '👦 ז' : player.gender === 'f' ? '👧 נ' : '<span style="color:#cbd5e0">—</span>'}</td>
      <td class="birth">
        ${player.birthYear
          ? `<span class="year">${player.birthYear}</span><span class="age">גיל ${age}</span>`
          : '<span style="color:#cbd5e0">לא ידוע</span>'}
      </td>
      <td class="${player.fedId ? 'fed-id' : 'fed-id empty'}">${player.fedId ? player.fedId : 'חסר'}</td>
      <td style="text-align:center">${player.rating ? `<span style="font-weight:600;color:#2b6cb0">${player.rating}</span>` : '<span style="color:#cbd5e0">—</span>'}</td>
      <td style="text-align:center">${player.cardExpiry ? cardExpiryBadge(player.cardExpiry) : '<span style="color:#cbd5e0">—</span>'}</td>
      <td style="text-align:center">${joinDateDisplay}</td>
      <td style="text-align:center"><span class="pay-badge pay-${payStatus}">${payLabel}</span></td>
      <td style="text-align:center">${levelDisplay}</td>
    </tr>`;
}

function renderTeamSubGroup(sg, showTime, teamIdx, subTeamIdx) {
  const totalPlayers = sg.players.filter(p => !p.hidden).length;
  const sorted = sortedPlayers(sg.players);
  return `
    <div class="sub-group">
      <div class="sub-group-header">
        <div>
          <h3>${showTime && sg.time ? sg.time : 'שחקנים'}</h3>
          <div class="count">${totalPlayers} שחקנים</div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn-add-in-header" style="background:rgba(255,255,255,0.15)" onclick="printTeamPlayerList(${teamIdx},${subTeamIdx})">🖨️ הדפס</button>
          <button class="btn-add-in-header" onclick="toggleAddTeamPlayerForm(${teamIdx},${subTeamIdx})">➕ הוסף משתתף</button>
        </div>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>#</th><th>שם משפחה</th><th>שם פרטי</th>
              <th class="gender-col">מין</th><th>שנת לידה / גיל</th>
              <th>מספר שחקן</th>
              <th style="text-align:center">מד כושר</th>
              <th style="text-align:center">כרטיס שחמטאי</th>
              <th style="text-align:center">הצטרפות</th>
              <th style="text-align:center">תשלום</th>
              <th style="text-align:center">רמה</th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map(({ p, i }, dn) => renderTeamPlayer(p, dn + 1, teamIdx, subTeamIdx, i)).join('')}
          </tbody>
        </table>
      </div>
      <div class="stats-bar">
        ${sg.players.filter(p => p.fedId && !p.hidden).length} מתוך ${totalPlayers} עם מספר שחקן
      </div>
    </div>`;
}

function renderTeamGroup(team, teamIdx) {
  const showTime = team.subGroups.length > 1;
  const coachBadge = team.coach ? `<span style="font-size:13px;color:rgba(255,255,255,0.75);font-weight:400"> · ${team.coach}</span>` : '';
  const meetingsBadge = (team.meetings || []).length > 0
    ? `<span style="font-size:12px;color:rgba(255,255,255,0.6);margin-right:8px">${formatTeamMeetingsSummary(team.meetings)}</span>` : '';
  const header = `<div class="group-name-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <span class="group-name-text">🏅 ${team.name}</span>${coachBadge}${meetingsBadge}
    </div>
  </div>`;
  return header + team.subGroups.map((sg, si) => renderTeamSubGroup(sg, showTime, teamIdx, si)).join('');
}

function formatTeamMeetingsSummary(meetings) {
  const dayNames = ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'];
  const byDay = {};
  (meetings || []).forEach(m => {
    const d = dayNames[m.day] || '';
    if (!byDay[m.day]) byDay[m.day] = { label: d, times: [] };
    byDay[m.day].times.push(m.time);
  });
  return Object.values(byDay).map(d => `יום ${d.label} ${d.times.join(',')}`).join(' | ');
}
window.formatTeamMeetingsSummary = formatTeamMeetingsSummary;

// --- Add team player (reuses addPlayerModal) ---

function toggleAddTeamPlayerForm(teamIdx, subTeamIdx) {
  _addPlayerIsTeam = true;
  _modalGroupIdx   = teamIdx;
  _modalSubGroupIdx = subTeamIdx;
  const t  = teams[teamIdx];
  const sg = t.subGroups[subTeamIdx];
  const title = (t.subGroups.length > 1 && sg.time) ? `${t.name} — ${sg.time}` : t.name;
  document.getElementById('modalTitle').textContent = title;
  ['mf-first','mf-last','mf-year','mf-fed','mf-rating','mf-card-expiry','mf-phone','mf-email'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = ''; el.classList.remove('input-error'); }
  });
  const ageEl = document.getElementById('mf-age');
  if (ageEl) ageEl.textContent = '';
  const statusEl = document.getElementById('fed-lookup-status');
  if (statusEl) statusEl.textContent = '';
  document.getElementById('addPlayerModal').classList.add('open');
  setTimeout(() => document.getElementById('mf-first')?.focus(), 50);
}
window.toggleAddTeamPlayerForm = toggleAddTeamPlayerForm;

// --- Team player profile ---

function openTeamPlayerProfile(teamIdx, subTeamIdx, playerIdx) {
  _teamProfileState = { teamIdx, subTeamIdx, playerIdx };
  _profileVersion++; // cancel any pending loadProfileAttendance from a group player
  const t = teams[teamIdx];
  const p = t?.subGroups[subTeamIdx]?.players[playerIdx];
  if (!p) return;
  const modal = document.getElementById('playerProfileModal');
  if (!modal) return;
  modal.dataset.isTeam = 'true';
  const { first, last } = splitName(p.name);
  document.getElementById('profileTitle').textContent    = `${last} ${first}`;
  document.getElementById('profileSubtitle').textContent = '🏅 ' + t.name;
  // Show edit button but wire it to the team edit function
  const editBtn = document.getElementById('btnProfileEdit');
  editBtn.style.display = '';
  editBtn.onclick = enableTeamProfileEdit;
  // Change attendance section title to "נוכחות בנבחרת"
  const attHeader = modal.querySelector('.profile-section:last-of-type .profile-section-header span');
  if (attHeader) attHeader.textContent = 'נוכחות בנבחרת';
  document.getElementById('profileAttendance').innerHTML =
    '<div style="color:#718096;font-size:13px">טוען...</div>';
  renderTeamProfileDetails();
  modal.classList.add('open');
  loadTeamProfileAttendance();
}
window.openTeamPlayerProfile = openTeamPlayerProfile;

function renderTeamProfileDetails() {
  const { teamIdx, subTeamIdx, playerIdx } = _teamProfileState;
  const t = teams[teamIdx];
  const p = t?.subGroups[subTeamIdx]?.players[playerIdx];
  if (!p) return;
  const { first, last } = splitName(p.name);
  const age = calcAge(p.birthYear);
  const det = document.getElementById('profileDetails');
  if (!det) return;
  det.innerHTML = `
    <div class="profile-detail-row">
      <span class="profile-label">שם משפחה</span>
      <span class="profile-value">${last || '—'}</span>
    </div>
    <div class="profile-detail-row">
      <span class="profile-label">שם פרטי</span>
      <span class="profile-value">${first || '—'}</span>
    </div>
    <div class="profile-detail-row">
      <span class="profile-label">שנת לידה</span>
      <span class="profile-value">${p.birthYear ? `${p.birthYear}${age ? ` (גיל ${age})` : ''}` : '—'}</span>
    </div>
    <div class="profile-detail-row">
      <span class="profile-label">מספר שחקן</span>
      <span class="profile-value">${p.fedId ? `<a href="https://www.chess.org.il/Players/Player.aspx?Id=${p.fedId}" target="_blank" style="color:#2b6cb0">${p.fedId}</a>` : '—'}</span>
    </div>
    ${p.rating ? `<div class="profile-detail-row">
      <span class="profile-label">מד כושר</span>
      <span class="profile-value" style="color:#2b6cb0;font-weight:700">${p.rating}</span>
    </div>` : ''}
    ${p.cardExpiry ? `<div class="profile-detail-row">
      <span class="profile-label">כרטיס שחמטאי</span>
      <span class="profile-value">${cardExpiryBadge(p.cardExpiry)}</span>
    </div>` : ''}
    <div class="profile-detail-row">
      <span class="profile-label">תשלום</span>
      <span class="profile-value">
        ${(s => `<span class="pay-badge pay-${s}">${{trial:'ניסיון',pending:'ממתין לתשלום',paid:'שילם ✓'}[s]}</span>`)(p.paymentStatus || 'trial')}
      </span>
    </div>
    ${p.parentPhone ? `<div class="profile-detail-row">
      <span class="profile-label">📞 הורה</span>
      <span class="profile-value" dir="ltr"><a href="tel:${p.parentPhone}" style="color:#2b6cb0;text-decoration:none">${p.parentPhone}</a></span>
    </div>` : ''}
    <div class="profile-detail-row">
      <span class="profile-label">רמה</span>
      <span class="profile-value">
        ${p.level ? `<span class="level-badge ${{beginner:'level-beginner',intermediate:'level-intermediate',advanced:'level-advanced'}[p.level]||''}">${{beginner:'מתחיל',intermediate:'ממשיך',advanced:'מתקדם'}[p.level]||'—'}</span>` : '<span style="color:#a0aec0">לא הוגדר</span>'}
      </span>
    </div>
    ${p.parentEmail ? `<div class="profile-detail-row">
      <span class="profile-label">✉ מייל</span>
      <span class="profile-value" dir="ltr"><a href="mailto:${p.parentEmail}" style="color:#2b6cb0;text-decoration:none;font-size:13px">${p.parentEmail}</a></span>
    </div>` : ''}`;
  const footer = document.getElementById('profileFooter');
  if (footer) footer.innerHTML =
    '<button class="btn-remove-player" onclick="confirmRemoveTeamPlayer()">🗑 הסר מנבחרת</button>';
}
window.renderTeamProfileDetails = renderTeamProfileDetails;

function enableTeamProfileEdit() {
  const { teamIdx, subTeamIdx, playerIdx } = _teamProfileState;
  const t = teams[teamIdx];
  const p = t?.subGroups[subTeamIdx]?.players[playerIdx];
  if (!p) return;
  const { first, last } = splitName(p.name);
  const age = p.birthYear ? `גיל ${CURRENT_YEAR - p.birthYear}` : '';
  const det = document.getElementById('profileDetails');
  if (!det) return;
  det.innerHTML = `
    <div class="modal-field">
      <label>שם פרטי <span class="required">*</span></label>
      <input type="text" id="pe-first" value="${first}">
    </div>
    <div class="modal-field">
      <label>שם משפחה <span class="required">*</span></label>
      <input type="text" id="pe-last" value="${last}">
    </div>
    <div class="modal-field">
      <label>שנת לידה <span class="required">*</span></label>
      <input type="number" id="pe-year" value="${p.birthYear || ''}" min="1900" max="${CURRENT_YEAR - 2}"
        placeholder="לדוגמה: 2015" oninput="updatePeAge(this.value)">
      <div class="age-hint" id="pe-age">${age}</div>
    </div>
    <div class="modal-field">
      <label>מין <span class="required">*</span></label>
      <div class="pay-select">
        <button type="button" id="pe-gender-m" class="pay-btn${(p.gender||'')==='m'?' active-paid':''}" onclick="selectGender('m')">👦 זכר</button>
        <button type="button" id="pe-gender-f" class="pay-btn${(p.gender||'')==='f'?' active-pending':''}" onclick="selectGender('f')">👧 נקבה</button>
      </div>
      <input type="hidden" id="pe-gender" value="${p.gender || ''}">
    </div>
    <div class="modal-field">
      <label>📞 טלפון הורה <span class="required">*</span></label>
      <input type="tel" id="pe-phone" value="${p.parentPhone || ''}" placeholder="05X-XXXXXXX" dir="ltr">
    </div>
    <div class="modal-field">
      <label>✉ מייל הורה <span class="required">*</span></label>
      <input type="email" id="pe-email" value="${p.parentEmail || ''}" placeholder="example@mail.com" dir="ltr">
    </div>
    <div class="modal-field" style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0">
      <label>מספר שחקן</label>
      <input type="number" id="pe-fed" value="${p.fedId || ''}" placeholder="לא חובה">
    </div>
    <div class="modal-field">
      <label>מד כושר</label>
      <input type="number" id="pe-rating" value="${p.rating || ''}" placeholder="לא חובה">
    </div>
    <div class="modal-field">
      <label>תוקף כרטיס שחמטאי</label>
      <input type="date" id="pe-card" value="${p.cardExpiry || ''}">
    </div>
    <div class="modal-field">
      <label>סטטוס תשלום</label>
      <div class="pay-select">
        <button type="button" class="pay-btn${(p.paymentStatus||'trial')==='trial'?' active-trial':''}" onclick="selectPayStatus(this,'trial')">ניסיון</button>
        <button type="button" class="pay-btn${p.paymentStatus==='pending'?' active-pending':''}" onclick="selectPayStatus(this,'pending')">ממתין לתשלום</button>
        <button type="button" class="pay-btn${p.paymentStatus==='paid'?' active-paid':''}" onclick="selectPayStatus(this,'paid')">שילם ✓</button>
      </div>
      <input type="hidden" id="pe-pay" value="${p.paymentStatus || 'trial'}">
    </div>
    <div class="modal-field">
      <label>רמה</label>
      <div class="pay-select">
        <button type="button" class="pay-btn${(p.level||'')==='beginner'?' active-trial':''}" onclick="selectLevel(this,'beginner')">מתחיל</button>
        <button type="button" class="pay-btn${(p.level||'')==='intermediate'?' active-pending':''}" onclick="selectLevel(this,'intermediate')">ממשיך</button>
        <button type="button" class="pay-btn${(p.level||'')==='advanced'?' active-paid':''}" onclick="selectLevel(this,'advanced')">מתקדם</button>
      </div>
      <input type="hidden" id="pe-level" value="${p.level || ''}">
    </div>
    <div class="modal-actions" style="padding:0;margin-top:4px">
      <button class="btn-form-cancel" onclick="renderTeamProfileDetails()">ביטול</button>
      <button class="btn-form-submit" onclick="saveTeamPlayerProfile()">💾 שמור</button>
    </div>
    <div style="margin-top:16px;padding-top:14px;border-top:1px solid #e2e8f0">
      <label style="font-size:12px;color:#718096;font-weight:600;display:block;margin-bottom:6px">↔ העבר לנבחרת אחרת</label>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <select id="pe-team-transfer-target" class="modal-input" style="flex:1;min-width:180px">
          <option value="">— בחר נבחרת יעד —</option>
          ${teams.flatMap((tm, tmi) =>
            tm.subGroups.map((sg, sgi) => {
              if (tmi === teamIdx && sgi === subTeamIdx) return '';
              const label = tm.subGroups.length > 1 ? `${tm.name} · ${sg.time||sgi+1}` : tm.name;
              return `<option value="${tmi}|${sgi}">${label}</option>`;
            })
          ).join('')}
        </select>
        <button onclick="transferTeamPlayer()" style="background:#553c9a;color:white;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap">↔ העבר</button>
      </div>
    </div>`;
  det.querySelector('#pe-last')?.focus();
  // Hide the header edit button while in edit mode (actions are in the form itself)
  document.getElementById('btnProfileEdit').style.display = 'none';
  const footer = document.getElementById('profileFooter');
  if (footer) footer.innerHTML = '';
}
window.enableTeamProfileEdit = enableTeamProfileEdit;

async function saveTeamPlayerProfile() {
  const { teamIdx, subTeamIdx, playerIdx } = _teamProfileState;
  const t = teams[teamIdx];
  const p = t?.subGroups[subTeamIdx]?.players[playerIdx];
  if (!p) return;
  const firstName  = document.getElementById('pe-first')?.value?.trim() || '';
  const lastName   = document.getElementById('pe-last')?.value?.trim()  || '';
  const birthYear  = parseInt(document.getElementById('pe-year')?.value)   || null;
  const gender     = document.getElementById('pe-gender')?.value         || null;
  const fedId      = document.getElementById('pe-fed')?.value?.trim()   || null;
  const rating     = parseInt(document.getElementById('pe-rating')?.value) || null;
  const cardExpiry = document.getElementById('pe-card')?.value           || null;
  const paymentStatus = document.getElementById('pe-pay')?.value   || 'trial';
  const level         = document.getElementById('pe-level')?.value  || null;
  const parentPhone   = document.getElementById('pe-phone')?.value?.trim() || null;
  const parentEmail   = document.getElementById('pe-email')?.value?.trim() || null;
  p.name = `${firstName} ${lastName}`.trim();
  p.firstName = firstName; p.lastName = lastName;
  p.birthYear = birthYear; p.gender = gender;
  p.fedId = fedId; p.rating = rating; p.cardExpiry = cardExpiry;
  p.paymentStatus = paymentStatus; p.level = level || null;
  p.parentPhone = parentPhone; p.parentEmail = parentEmail;
  if (db && p._key) {
    try {
      await db.ref(`team_players/${t.id}/${subTeamIdx}/${p._key}`).update(
        { firstName, lastName, birthYear, gender, fedId, rating, cardExpiry, paymentStatus, level: level||null, parentPhone: parentPhone||null, parentEmail: parentEmail||null }
      );
      showToast('הנתונים נשמרו ✅');
    } catch(e) { showToast('שגיאה: ' + e.message, 'error'); return; }
  }
  const panel = document.getElementById('panel-team-' + t.id);
  if (panel) panel.innerHTML = renderTeamGroup(t, teamIdx);
  // Restore edit button
  const editBtn = document.getElementById('btnProfileEdit');
  if (editBtn) { editBtn.style.display = ''; editBtn.onclick = enableTeamProfileEdit; }
  renderTeamProfileDetails();
}
window.saveTeamPlayerProfile = saveTeamPlayerProfile;

function confirmRemoveTeamPlayer() {
  const { teamIdx, subTeamIdx, playerIdx } = _teamProfileState;
  const t = teams[teamIdx];
  const p = t?.subGroups[subTeamIdx]?.players[playerIdx];
  if (!p) return;
  const { first, last } = splitName(p.name);
  const footer = document.getElementById('profileFooter');
  if (footer) footer.innerHTML = `
    <span style="font-size:13px;color:#c53030">האם להסיר את ${first} ${last} מהנבחרת?</span>
    <button class="btn-remove-player" onclick="executeRemoveTeamPlayer()">✅ כן, הסר</button>
    <button class="btn-form-cancel" onclick="renderTeamProfileDetails()">ביטול</button>`;
}
window.confirmRemoveTeamPlayer = confirmRemoveTeamPlayer;

async function executeRemoveTeamPlayer() {
  const { teamIdx, subTeamIdx, playerIdx } = _teamProfileState;
  const t = teams[teamIdx];
  const p = t?.subGroups[subTeamIdx]?.players[playerIdx];
  if (!p) { showToast('שגיאה: שחקן לא נמצא', 'error'); return; }
  const { first, last } = splitName(p.name);
  p.hidden = true;
  document.getElementById('playerProfileModal')?.classList.remove('open');
  const panel = document.getElementById('panel-team-' + t.id);
  if (panel) panel.innerHTML = renderTeamGroup(t, teamIdx);
  if (db && p._key) {
    try {
      await db.ref(`team_players/${t.id}/${subTeamIdx}/${p._key}/hidden`).set(true);
      showToast(`${first} ${last} הוסר/ה מהנבחרת ✅`);
    } catch(e) {
      p.hidden = false;
      if (panel) panel.innerHTML = renderTeamGroup(t, teamIdx);
      showToast('שגיאה: ' + e.message, 'error');
    }
  }
}
window.executeRemoveTeamPlayer = executeRemoveTeamPlayer;

async function transferTeamPlayer() {
  const val = document.getElementById('pe-team-transfer-target')?.value;
  if (!val) { showToast('בחר נבחרת יעד', 'error'); return; }
  const [dstTmi, dstSgi] = val.split('|').map(Number);
  const { teamIdx, subTeamIdx, playerIdx } = _teamProfileState;
  const srcT = teams[teamIdx];
  const dstT = teams[dstTmi];
  const p    = srcT?.subGroups[subTeamIdx]?.players[playerIdx];
  if (!srcT || !dstT || !p) { showToast('שגיאה', 'error'); return; }
  const { first, last } = splitName(p.name);
  p.hidden = true;
  document.getElementById('playerProfileModal')?.classList.remove('open');
  const srcPanel = document.getElementById('panel-team-' + srcT.id);
  if (srcPanel) srcPanel.innerHTML = renderTeamGroup(srcT, teamIdx);
  if (db && p._key) {
    try {
      const newRef = await db.ref(`team_players/${dstT.id}/${dstSgi}`).push({
        firstName: p.firstName, lastName: p.lastName, birthYear: p.birthYear,
        gender: p.gender, fedId: p.fedId, rating: p.rating, cardExpiry: p.cardExpiry,
        paymentStatus: p.paymentStatus, parentPhone: p.parentPhone||null,
        parentEmail: p.parentEmail||null, joinDate: new Date().toISOString().split('T')[0]
      });
      await db.ref(`team_players/${srcT.id}/${subTeamIdx}/${p._key}/hidden`).set(true);
      // Add to destination in memory
      const newP = { ...p, hidden: false, _key: newRef.key };
      dstT.subGroups[dstSgi].players.push(newP);
      const dstPanel = document.getElementById('panel-team-' + dstT.id);
      if (dstPanel) dstPanel.innerHTML = renderTeamGroup(dstT, dstTmi);
      logAudit('transfer_player', srcT.id, srcT.name, `${last} ${first} → ${dstT.name}`);
      showToast(`${first} ${last} הועבר/ה ל"${dstT.name}" ✅`);
    } catch(e) {
      p.hidden = false;
      if (srcPanel) srcPanel.innerHTML = renderTeamGroup(srcT, teamIdx);
      showToast('שגיאה: ' + e.message, 'error');
    }
  }
}
window.transferTeamPlayer = transferTeamPlayer;

// ===== ADD PLAYER FUNCTIONS =====

let _modalGroupIdx = 0;
let _modalSubGroupIdx = 0;

function toggleAddPlayerForm(groupIdx, subGroupIdx) {
  _modalGroupIdx = groupIdx;
  _modalSubGroupIdx = subGroupIdx;
  const g = groups[groupIdx];
  const sg = g.subGroups[subGroupIdx];
  const title = sg.time ? `${g.name} — ${sg.time}` : g.name;
  document.getElementById('modalTitle').textContent = title;
  ['mf-first','mf-last','mf-year','mf-fed','mf-rating','mf-card-expiry','mf-phone','mf-email'].forEach(id => {
    const el = document.getElementById(id);
    el.value = '';
    el.classList.remove('input-error');
  });
  document.getElementById('mf-age').textContent = '';
  document.getElementById('fed-lookup-status').textContent = '';
  document.getElementById('mf-gender').value = '';
  document.getElementById('mf-gender-m').className = 'pay-btn';
  document.getElementById('mf-gender-f').className = 'pay-btn';
  document.getElementById('addPlayerModal').classList.add('open');
  setTimeout(() => document.getElementById('mf-first').focus(), 50);
}

function closeAddModal(e) {
  if (e && e.target !== document.getElementById('addPlayerModal')) return;
  document.getElementById('addPlayerModal').classList.remove('open');
  _addPlayerIsTeam = false;
}

function updateModalAge(val) {
  const year = parseInt(val);
  const hint = document.getElementById('mf-age');
  hint.textContent = (year >= 1900 && year <= CURRENT_YEAR) ? `גיל ${CURRENT_YEAR - year}` : '';
}

async function lookupFedPlayer() {
  const fedEl = document.getElementById('mf-fed');
  const statusEl = document.getElementById('fed-lookup-status');
  const btn = document.getElementById('btn-fed-lookup');
  const fedId = fedEl.value.trim();

  if (!fedId || isNaN(parseInt(fedId))) {
    statusEl.style.color = '#e53e3e';
    statusEl.textContent = 'יש להזין מספר שחקן תחילה';
    return;
  }

  btn.disabled = true;
  btn.textContent = '⏳';
  statusEl.style.color = '#666';
  statusEl.textContent = 'מחפש...';

  try {
    const targetUrl = `https://www.chess.org.il/Players/Player.aspx?Id=${parseInt(fedId)}`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // Check for runtime error page (player not found)
    if (html.includes('Runtime Error') || html.includes('Object reference not set')) {
      throw new Error('שחקן לא נמצא');
    }

    // Extract name from <title>
    const titleMatch = html.match(/<title>\s*([^\/\|<]+)/);
    if (!titleMatch) throw new Error('לא ניתן לחלץ שם');
    const fullName = titleMatch[1].trim();
    const parts = fullName.split(/\s+/);
    if (parts.length < 2) throw new Error('שם לא תקין');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');

    // Extract birth year — appears near שנת לידה
    const birthMatch = html.match(/שנת לידה[\s\S]{0,300}<span[^>]*>\s*(\d{4})\s*<\/span>/);
    const birthYear = birthMatch ? parseInt(birthMatch[1]) : null;

    // Extract Israeli rating: <li>מד כושר ישראלי<span>: 2043</span>
    let rating = null;
    const ratingMatch = html.match(/מד כושר ישראלי<span>:\s*(\d+)<\/span>/);
    if (ratingMatch) rating = parseInt(ratingMatch[1]);

    // Extract card expiry: <li>תוקף כרטיס שחמטאי<span> 31/12/2021</span>
    let cardExpiry = null;
    const expiryMatch = html.match(/תוקף כרטיס שחמטאי<span>\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*<\/span>/);
    if (expiryMatch) {
      // store as YYYY-MM-DD
      cardExpiry = `${expiryMatch[3]}-${expiryMatch[2].padStart(2,'0')}-${expiryMatch[1].padStart(2,'0')}`;
    }

    // Fill the form
    document.getElementById('mf-first').value = firstName;
    document.getElementById('mf-last').value = lastName;
    if (birthYear) {
      document.getElementById('mf-year').value = birthYear;
      updateModalAge(birthYear);
    }
    if (rating) document.getElementById('mf-rating').value = rating;
    if (cardExpiry) document.getElementById('mf-card-expiry').value = cardExpiry;

    statusEl.style.color = '#276749';
    statusEl.textContent = `✅ נמצא: ${fullName}${birthYear ? ` (${birthYear})` : ''}${rating ? ` | מד כושר: ${rating}` : ''}${cardExpiry ? ` | כרטיס עד: ${formatDate(cardExpiry)}` : ''}`;
  } catch (err) {
    statusEl.style.color = '#e53e3e';
    statusEl.textContent = `❌ ${err.message || 'שגיאה בשליפה'}`;
  } finally {
    btn.disabled = false;
    btn.textContent = '🔍 שלוף';
  }
}

async function submitAddPlayer() {
  const firstEl = document.getElementById('mf-first');
  const lastEl  = document.getElementById('mf-last');
  const yearEl  = document.getElementById('mf-year');
  const fedEl   = document.getElementById('mf-fed');

  const phoneEl  = document.getElementById('mf-phone');
  const emailEl  = document.getElementById('mf-email');
  const genderEl = document.getElementById('mf-gender');
  [firstEl, lastEl, yearEl, phoneEl, emailEl].forEach(el => el.classList.remove('input-error'));
  document.getElementById('mf-gender-select')?.classList.remove('input-error');

  const firstName = firstEl.value.trim();
  const lastName  = lastEl.value.trim();
  const yearVal   = yearEl.value.trim();
  const fedVal    = fedEl.value.trim();

  let valid = true;
  if (!firstName) { firstEl.classList.add('input-error'); firstEl.focus(); valid = false; }
  if (!lastName)  { lastEl.classList.add('input-error');  if (valid) lastEl.focus(); valid = false; }
  const birthYear = parseInt(yearVal);
  if (!yearVal || isNaN(birthYear) || birthYear < 1900 || birthYear > CURRENT_YEAR - 2) {
    yearEl.classList.add('input-error');
    if (valid) yearEl.focus();
    valid = false;
  }
  if (!genderEl.value) {
    document.getElementById('mf-gender-select')?.classList.add('input-error');
    valid = false;
  }
  if (!phoneEl.value.trim()) { phoneEl.classList.add('input-error'); if (valid) phoneEl.focus(); valid = false; }
  if (!emailEl.value.trim()) { emailEl.classList.add('input-error'); if (valid) emailEl.focus(); valid = false; }
  if (!valid) return;

  const fedId = fedVal ? (parseInt(fedVal) || null) : null;
  const joinDate = new Date().toISOString().split('T')[0];
  const gender = genderEl.value || null;
  const parentPhone = phoneEl.value.trim() || null;
  const parentEmail = emailEl.value.trim() || null;
  const ratingRaw = document.getElementById('mf-rating').value.trim();
  const rating = ratingRaw ? (parseInt(ratingRaw) || null) : null;
  const cardExpiry = document.getElementById('mf-card-expiry').value || null;

  // ── Route to team if adding to a נבחרת ──────────────────
  if (_addPlayerIsTeam) {
    _addPlayerIsTeam = false;
    const teamIdx    = _modalGroupIdx;
    const subTeamIdx = _modalSubGroupIdx;
    const t  = teams[teamIdx];
    const sg = t.subGroups[subTeamIdx];
    const newPlayer = { name: `${firstName} ${lastName}`, firstName, lastName, birthYear, fedId, joinDate, rating, cardExpiry, gender: gender || null, paymentStatus: 'trial', parentPhone, parentEmail, hidden: false };
    sg.players.push(newPlayer);
    document.getElementById('addPlayerModal').classList.remove('open');
    if (db) {
      try {
        const ref = await db.ref(`team_players/${t.id}/${subTeamIdx}`).push(
          { firstName, lastName, birthYear, fedId: fedId || null, joinDate, rating: rating || null, cardExpiry: cardExpiry || null, parentPhone: parentPhone || null, parentEmail: parentEmail || null, paymentStatus: 'trial' }
        );
        newPlayer._key = ref.key;
      } catch(e) { showToast('שגיאה בשמירה: ' + e.message, 'error'); }
    }
    const panel = document.getElementById('panel-team-' + t.id);
    if (panel) panel.innerHTML = renderTeamGroup(t, teamIdx);
    showToast(`${firstName} ${lastName} נוסף/ה לנבחרת ✅`);
    return;
  }

  const player = { name: `${firstName} ${lastName}`, birthYear, fedId, joinDate, added: true, parentPhone, parentEmail, rating, cardExpiry };
  const groupIdx = _modalGroupIdx;
  const subGroupIdx = _modalSubGroupIdx;

  groups[groupIdx].subGroups[subGroupIdx].players.push(player);

  if (db) {
    const g = groups[groupIdx];
    const playerIdx = groups[groupIdx].subGroups[subGroupIdx].players.length - 1;
    await Promise.all([
      db.ref(`extra_players/${g.id}/${subGroupIdx}`).push(
        { firstName, lastName, birthYear, fedId: fedId || null, joinDate, rating: rating || null, cardExpiry: cardExpiry || null }
      ),
      (parentPhone || parentEmail)
        ? db.ref(`player_contacts/${g.id}/${subGroupIdx}/${playerIdx}`).set({ parentPhone: parentPhone || null, parentEmail: parentEmail || null })
        : Promise.resolve(),
      db.ref(`history/${g.id}/${subGroupIdx}`).push({ type: 'joined', playerName: `${lastName} ${firstName}`, timestamp: Date.now() }),
    ]);
  }

  logAudit('add_player', groups[groupIdx].id, groups[groupIdx].name, `הוסף: ${lastName} ${firstName}`);
  document.getElementById('addPlayerModal').classList.remove('open');
  const g = groups[groupIdx];
  document.getElementById('panel-' + g.id).innerHTML = renderGroup(g, groupIdx);
}

async function loadExtraPlayers() {
  if (!db) return;
  try {
    const snap = await db.ref('extra_players').get();
    if (!snap.val()) return;
    const data = snap.val();
    groups.forEach((g, groupIdx) => {
      if (!data[g.id]) return;
      g.subGroups.forEach((sg, subGroupIdx) => {
        const extra = data[g.id][subGroupIdx];
        if (!extra) return;
        Object.values(extra).forEach(p => {
          sg.players.push({ name: `${p.firstName} ${p.lastName}`, birthYear: p.birthYear, fedId: p.fedId || null, joinDate: p.joinDate || null, added: true, rating: p.rating || null, cardExpiry: p.cardExpiry || null });
        });
      });
      const ep = document.getElementById('panel-' + g.id);
      if (ep) ep.innerHTML = renderGroup(g, groupIdx);
    });
  } catch(e) {
    console.error('Error loading extra players:', e);
  }
}

// ===== ATTENDANCE FUNCTIONS =====

function getGroupDates(dayOfWeek) {
  if (dayOfWeek < 0) return [];
  const start = new Date(YEAR_START);
  const end = new Date(YEAR_END);
  const dates = [];
  let d = new Date(start);
  while (d.getDay() !== dayOfWeek) d.setDate(d.getDate() + 1);
  while (d <= end) {
    dates.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 7);
  }
  return dates;
}

function getGroupMeetingDates(group) {
  if (group.meetings && group.meetings.length > 0) {
    const days = [...new Set(group.meetings.map(m => Number(m.day)).filter(d => d >= 0 && d <= 6))];
    const all = days.flatMap(day => getGroupDates(day));
    return [...new Set(all)].sort();
  }
  return getGroupDates(group.dayOfWeek);
}

function defaultDateForGroup(dayOfWeekOrGroup) {
  const today = new Date().toISOString().split('T')[0];
  const dates = typeof dayOfWeekOrGroup === 'object'
    ? getGroupMeetingDates(dayOfWeekOrGroup)
    : getGroupDates(dayOfWeekOrGroup);
  if (!dates.length) return today;
  let selected = dates[0];
  for (const d of dates) {
    if (d <= today) selected = d;
    else break;
  }
  return selected;
}

function formatDate(iso) {
  const [y, m, day] = iso.split('-');
  return `${day}/${m}/${y}`;
}

function cardExpiryBadge(cardExpiry) {
  if (!cardExpiry) return '';
  const today = new Date(); today.setHours(0,0,0,0);
  const exp = new Date(cardExpiry);
  const diffDays = Math.round((exp - today) / 86400000);
  let bg, color, icon;
  if (diffDays < 0)       { bg='#fed7d7'; color='#c53030'; icon='🔴'; }
  else if (diffDays <= 31){ bg='#fefcbf'; color='#744210'; icon='🟡'; }
  else                    { bg='#c6f6d5'; color='#276749'; icon='🟢'; }
  return `<span title="כרטיס שחמטאי עד ${formatDate(cardExpiry)}"
    style="display:inline-block;padding:2px 6px;border-radius:10px;font-size:11px;background:${bg};color:${color};margin-right:4px"
    >${icon} ${formatDate(cardExpiry)}</span>`;
}

const attState = {
  groupIdx: 0,
  subGroupIdx: 0,
  date: defaultDateForGroup(ALL_GROUPS[0].dayOfWeek ?? -1),
};

const teamAttState = {
  teamIdx: 0,
  subTeamIdx: 0,
  date: new Date().toISOString().split('T')[0],
};

function attPath() {
  const g = groups[attState.groupIdx];
  return `attendance/${g.id}/${attState.subGroupIdx}/${attState.date}`;
}

let _attDatesWithData = new Set();

async function loadAttendanceDates() {
  if (!db) return;
  try {
    const g = groups[attState.groupIdx];
    const snap = await db.ref(`attendance/${g.id}/${attState.subGroupIdx}`).get();
    _attDatesWithData = new Set(snap.val() ? Object.keys(snap.val()) : []);
    applyDateMarkers();
  } catch(e) { console.error('loadAttendanceDates error:', e); }
}

function applyDateMarkers() {
  const sel = document.getElementById('attDateSel');
  if (!sel) return;
  const g = groups[attState.groupIdx];
  Array.from(sel.options).forEach(opt => {
    const has = _attDatesWithData.has(opt.value);
    const isVac = _vacations[g.id]?.has(opt.value);
    if (isVac) {
      opt.text = '🚫 ' + formatDate(opt.value);
    } else {
      opt.text = (has ? '✓ ' : '') + formatDate(opt.value);
    }
  });
}

function markCurrentDateInDropdown(hasData) {
  if (hasData) _attDatesWithData.add(attState.date);
  else _attDatesWithData.delete(attState.date);
  applyDateMarkers();
}

async function loadAttendanceFromFirebase() {
  if (!db) return;
  if (!groups[attState.groupIdx]) return;
  try {
    const snap = await db.ref(attPath()).get();
    const presentMap = snap.val() || {};
    document.querySelectorAll('.att-player-row').forEach(row => {
      const idx = parseInt(row.dataset.playeridx);
      const checked = !!presentMap[idx];
      row.querySelector('input[type=checkbox]').checked = checked;
      row.classList.toggle('present', checked);
    });
    updateSummary();
  } catch(e) {
    console.error('Firebase load error:', e);
  }
}

async function loadAttendance() {
  renderPlayerList({});
  await loadAttendanceFromFirebase();
}

function renderPlayerList(presentMap) {
  const g = groups[attState.groupIdx];
  if (!g) return;
  const sg = g.subGroups[attState.subGroupIdx];
  if (!sg) return;
  const list = document.getElementById('attPlayerList');
  if (!list) return;

  list.innerHTML = sortedPlayers(sg.players).map(({ p, i }) => {
    const { first, last } = splitName(p.name);
    const isPresent = !!presentMap[i];
    return `
      <label class="att-player-row${isPresent ? ' present' : ''}" data-playeridx="${i}" onclick="togglePlayer(this)">
        <input type="checkbox" ${isPresent ? 'checked' : ''} onclick="event.stopPropagation(); togglePlayerByCheckbox(this)">
        <span class="att-player-name">${last} ${first}</span>
        <span class="att-present-badge">נוכח ✓</span>
      </label>`;
  }).join('');

  updateSummary();
}

function togglePlayer(row) {
  const cb = row.querySelector('input[type=checkbox]');
  cb.checked = !cb.checked;
  row.classList.toggle('present', cb.checked);
  updateSummary();
}

function togglePlayerByCheckbox(cb) {
  cb.closest('.att-player-row').classList.toggle('present', cb.checked);
  updateSummary();
}

function updateSummary() {
  const total = document.querySelectorAll('.att-player-row').length;
  const present = document.querySelectorAll('.att-player-row.present').length;
  const summary = document.getElementById('attSummary');
  if (summary) summary.textContent = `נוכחים: ${present} מתוך ${total}`;
}

function attCheckAll() {
  document.querySelectorAll('.att-player-row').forEach(row => {
    row.querySelector('input').checked = true;
    row.classList.add('present');
  });
  updateSummary();
}

function attClearAll() {
  document.querySelectorAll('.att-player-row').forEach(row => {
    row.querySelector('input').checked = false;
    row.classList.remove('present');
  });
  updateSummary();
}

async function saveAttendance() {
  const btn = document.getElementById('btnSave');
  const status = document.getElementById('saveStatus');
  btn.disabled = true;
  btn.textContent = 'שומר...';

  const presentMap = {};
  document.querySelectorAll('.att-player-row').forEach(row => {
    const idx = parseInt(row.dataset.playeridx);
    if (row.querySelector('input[type=checkbox]').checked) presentMap[idx] = true;
  });

  try {
    if (db) {
      await db.ref(attPath()).set(Object.keys(presentMap).length > 0 ? presentMap : null);
      markCurrentDateInDropdown(Object.keys(presentMap).length > 0);
      const attG = groups[attState.groupIdx];
      logAudit('update_attendance', attG?.id, attG?.name,
        `${attState.date} · ${Object.keys(presentMap).length} נוכחים`);
    }
    status.textContent = '✅ נשמר!';
    status.classList.add('visible');
    setTimeout(() => status.classList.remove('visible'), 2500);
  } catch(e) {
    status.textContent = '❌ שגיאה בשמירה';
    status.classList.add('visible');
    setTimeout(() => status.classList.remove('visible'), 3000);
    console.error('save error', e);
  }

  btn.disabled = false;
  btn.textContent = '💾 שמור נוכחות';
}

// ===== TEAM ATTENDANCE =====

function getTeamMeetingDates(team) {
  if (!team) return [];
  if (team.meetings && team.meetings.length > 0) {
    const days = [...new Set(team.meetings.map(m => Number(m.day)).filter(d => d >= 0 && d <= 6))];
    const all = days.flatMap(day => getGroupDates(day));
    return [...new Set(all)].sort();
  }
  return getGroupDates(team.dayOfWeek ?? 0);
}

function defaultDateForTeam(team) {
  const today = new Date().toISOString().split('T')[0];
  const dates = getTeamMeetingDates(team);
  if (!dates.length) return today;
  let selected = dates[0];
  for (const d of dates) {
    if (d <= today) selected = d;
    else break;
  }
  return selected;
}

// Every day of a camp's date range, excluding Friday/Saturday (the Israeli weekend)
function getCampDates(camp) {
  if (!camp || !camp.startDate || !camp.endDate) return [];
  const start = new Date(camp.startDate);
  const end = new Date(camp.endDate);
  const dates = [];
  const d = new Date(start);
  while (d <= end) {
    const day = d.getDay(); // 0=Sunday ... 5=Friday, 6=Saturday
    if (day !== 5 && day !== 6) dates.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function defaultDateForCamp(camp) {
  const today = new Date().toISOString().split('T')[0];
  const dates = getCampDates(camp);
  if (!dates.length) return today;
  if (dates.includes(today)) return today;
  let selected = dates[0];
  for (const d of dates) {
    if (d <= today) selected = d;
    else break;
  }
  return selected;
}

function rebuildTeamDateSelect() {
  const t = teams[teamAttState.teamIdx];
  if (!t) return;
  const dates = getTeamMeetingDates(t);
  const container = document.getElementById('teamAttDateContainer');
  if (!container) return;
  if (dates.length > 0) {
    container.innerHTML = `<select id="teamAttDate" onchange="onTeamAttDateChange(this.value)"
      style="border:1px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:14px;font-family:inherit;width:100%">
      ${dates.map(d => `<option value="${d}"${d === teamAttState.date ? ' selected' : ''}>${formatDate(d)}</option>`).join('')}
    </select>`;
    applyTeamDateMarkers();
  } else {
    container.innerHTML = `<input type="date" id="teamAttDate" value="${teamAttState.date}"
      onchange="onTeamAttDateChange(this.value)"
      style="border:1px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:14px;font-family:inherit">`;
  }
}

function onTeamAttChange(val) {
  teamAttState.teamIdx = parseInt(val);
  teamAttState.subTeamIdx = 0;
  const t = teams[teamAttState.teamIdx];
  teamAttState.date = defaultDateForTeam(t);
  const subSel = document.getElementById('teamAttSubSel');
  if (subSel) {
    subSel.innerHTML = t.subGroups.map((sg, i) => `<option value="${i}">${sg.time || 'שחקנים'}</option>`).join('');
    subSel.disabled = t.subGroups.length === 1;
  }
  rebuildTeamDateSelect();
  loadTeamAttendance();
}
window.onTeamAttChange = onTeamAttChange;

function onTeamAttSubChange(val) {
  teamAttState.subTeamIdx = parseInt(val);
  loadTeamAttendance();
}
window.onTeamAttSubChange = onTeamAttSubChange;

function onTeamAttDateChange(val) {
  teamAttState.date = val;
  loadTeamAttendance();
}
window.onTeamAttDateChange = onTeamAttDateChange;

async function loadTeamAttendance() {
  const list = document.getElementById('teamAttPlayerList');
  if (!list) return;
  const t  = teams[teamAttState.teamIdx];
  const sg = t?.subGroups[teamAttState.subTeamIdx];
  if (!t || !sg) { list.innerHTML = '<div style="padding:20px;color:#a0aec0;text-align:center">אין שחקנים</div>'; return; }
  list.innerHTML = '<div style="padding:20px;color:#718096;text-align:center">טוען...</div>';
  let presentMap = {};
  if (db && teamAttState.date) {
    try {
      const snap = await db.ref(`team_attendance/${t.id}/${teamAttState.subTeamIdx}/${teamAttState.date}`).get();
      presentMap = snap.val() || {};
    } catch(e) { console.error('loadTeamAttendance error:', e); }
  }
  renderTeamPlayerList(presentMap);
}
window.loadTeamAttendance = loadTeamAttendance;

function renderTeamPlayerList(presentMap) {
  const list = document.getElementById('teamAttPlayerList');
  if (!list) return;
  const t  = teams[teamAttState.teamIdx];
  const sg = t?.subGroups[teamAttState.subTeamIdx];
  if (!sg || sg.players.length === 0) {
    list.innerHTML = '<div style="padding:20px;color:#a0aec0;text-align:center">אין שחקנים בנבחרת זו</div>';
    return;
  }
  list.innerHTML = sortedPlayers(sg.players).map(({ p, i }) => {
    const { first, last } = splitName(p.name);
    const key = p._key || String(i);
    const isPresent = !!(presentMap[key] || presentMap[i]);
    return `
      <label class="att-player-row${isPresent ? ' present' : ''}" data-playerkey="${key}" onclick="toggleTeamPlayer(this)">
        <input type="checkbox" ${isPresent ? 'checked' : ''} onclick="event.stopPropagation(); toggleTeamPlayerByCheckbox(this)">
        <span class="att-player-name">${last} ${first}</span>
        <span class="att-present-badge">נוכח ✓</span>
      </label>`;
  }).join('');
  updateTeamSummary();
}

function toggleTeamPlayer(row) {
  const cb = row.querySelector('input[type=checkbox]');
  cb.checked = !cb.checked;
  row.classList.toggle('present', cb.checked);
  updateTeamSummary();
}
window.toggleTeamPlayer = toggleTeamPlayer;

function toggleTeamPlayerByCheckbox(cb) {
  cb.closest('.att-player-row').classList.toggle('present', cb.checked);
  updateTeamSummary();
}
window.toggleTeamPlayerByCheckbox = toggleTeamPlayerByCheckbox;

function updateTeamSummary() {
  const total   = document.querySelectorAll('#teamAttPlayerList .att-player-row').length;
  const present = document.querySelectorAll('#teamAttPlayerList .att-player-row.present').length;
  const summary = document.getElementById('teamAttSummary');
  if (summary) summary.textContent = `נוכחים: ${present} מתוך ${total}`;
}

function teamAttCheckAll() {
  document.querySelectorAll('#teamAttPlayerList .att-player-row').forEach(row => {
    row.querySelector('input').checked = true; row.classList.add('present');
  });
  updateTeamSummary();
}
window.teamAttCheckAll = teamAttCheckAll;

function teamAttClearAll() {
  document.querySelectorAll('#teamAttPlayerList .att-player-row').forEach(row => {
    row.querySelector('input').checked = false; row.classList.remove('present');
  });
  updateTeamSummary();
}
window.teamAttClearAll = teamAttClearAll;

async function saveTeamAttendance() {
  const btn    = document.getElementById('btnTeamSave');
  const status = document.getElementById('teamSaveStatus');
  if (!teamAttState.date) { showToast('בחר תאריך', 'error'); return; }
  btn.disabled = true; btn.textContent = 'שומר...';
  const presentMap = {};
  document.querySelectorAll('#teamAttPlayerList .att-player-row').forEach(row => {
    if (row.querySelector('input[type=checkbox]').checked)
      presentMap[row.dataset.playerkey] = true;
  });
  try {
    const t = teams[teamAttState.teamIdx];
    if (db) {
      await db.ref(`team_attendance/${t.id}/${teamAttState.subTeamIdx}/${teamAttState.date}`)
        .set(Object.keys(presentMap).length > 0 ? presentMap : null);
      logAudit('update_attendance', t.id, t.name,
        `נבחרת · ${teamAttState.date} · ${Object.keys(presentMap).length} נוכחים`);
    }
    status.textContent = '✅ נשמר!'; status.classList.add('visible');
    setTimeout(() => status.classList.remove('visible'), 2500);
  } catch(e) {
    status.textContent = '❌ שגיאה'; status.classList.add('visible');
    setTimeout(() => status.classList.remove('visible'), 3000);
  }
  btn.disabled = false; btn.textContent = '💾 שמור נוכחות';
}
window.saveTeamAttendance = saveTeamAttendance;

function onAttGroupChange(val) {
  attState.groupIdx = parseInt(val);
  attState.subGroupIdx = 0;
  attState.date = defaultDateForGroup(groups[attState.groupIdx]);
  _attDatesWithData = new Set();
  rebuildSubGroupSelect();
  rebuildDateSelect();
  loadAttendance();
  loadAttendanceDates();
}

function onAttSubGroupChange(val) {
  attState.subGroupIdx = parseInt(val);
  _attDatesWithData = new Set();
  loadAttendance();
  loadAttendanceDates();
}

function onAttDateChange(val) {
  attState.date = val;
  loadAttendance();
}

function rebuildDateSelect() {
  const g = groups[attState.groupIdx];
  const sel = document.getElementById('attDateSel');
  if (!sel) return;
  sel.innerHTML = getGroupMeetingDates(g).map(d =>
    `<option value="${d}"${d === attState.date ? ' selected' : ''}>${formatDate(d)}</option>`
  ).join('');
}

function rebuildSubGroupSelect() {
  const g = groups[attState.groupIdx];
  const sel = document.getElementById('attSubGroupSel');
  if (!sel) return;
  sel.innerHTML = g.subGroups.map((sg, i) =>
    `<option value="${i}">${sg.time || 'קבוצה'}</option>`
  ).join('');
  sel.disabled = g.subGroups.length === 1;
}

function _attKindsAvailable() {
  const kinds = [];
  if (groups.length > 0) kinds.push({ key: 'groups', icon: '🗓', label: 'חוגים',  color: '#2b6cb0', render: renderGroupAttendanceContent });
  if (teams.length  > 0) kinds.push({ key: 'teams',  icon: '🏅', label: 'נבחרות', color: '#553c9a', render: renderTeamAttendanceContent });
  if (camps.length  > 0) kinds.push({ key: 'camps',  icon: '🏕️', label: 'מחנות',  color: '#c05621', render: renderCampAttendanceContent });
  return kinds;
}

function renderAttendancePanel() {
  const kinds = _attKindsAvailable();
  if (kinds.length === 0) return `
    <div class="att-card" style="text-align:center;padding:40px;color:#a0aec0">
      <div style="font-size:32px;margin-bottom:8px">🗓</div>
      <div>אין חוגים, נבחרות או מחנות מוקצים</div>
    </div>`;
  if (kinds.length === 1) return kinds[0].render();

  window._attKinds = kinds;
  const tabsHtml = kinds.map((k, i) => `
    <button id="att-tab-btn-${k.key}" onclick="switchAttTab('${k.key}')"
      style="padding:10px 20px;border:none;background:none;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;border-bottom:3px solid ${i===0?k.color:'transparent'};color:${i===0?k.color:'#718096'};margin-bottom:-2px">
      ${k.icon} ${k.label}
    </button>`).join('');
  const contentHtml = kinds.map((k, i) => `<div id="att-content-${k.key}"${i===0?'':' style="display:none"'}>${k.render()}</div>`).join('');
  return `<div style="display:flex;gap:0;border-bottom:2px solid #e2e8f0;margin-bottom:16px">${tabsHtml}</div>${contentHtml}`;
}

function switchAttTab(tab) {
  const kinds = window._attKinds || _attKindsAvailable();
  kinds.forEach(k => {
    const isActive = k.key === tab;
    const content = document.getElementById('att-content-' + k.key);
    if (content) content.style.display = isActive ? '' : 'none';
    const btn = document.getElementById('att-tab-btn-' + k.key);
    if (btn) { btn.style.borderBottom = isActive ? '3px solid ' + k.color : '3px solid transparent'; btn.style.color = isActive ? k.color : '#718096'; }
  });
  if (tab === 'teams') loadTeamAttendance();
  if (tab === 'camps') loadCampAttendanceHub();
}
window.switchAttTab = switchAttTab;

function renderGroupAttendanceContent() {
  const firebaseWarning = (FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY_HERE')
    ? `<div class="firebase-warning">⚠️ Firebase לא מוגדר — הנוכחות לא תישמר בענן.</div>` : '';
  const groupOptions = groups.map((g, i) => `<option value="${i}">${g.name}</option>`).join('');
  const g = groups[attState.groupIdx];
  if (!g) return '<div style="padding:24px;text-align:center;color:#888;">אין חוגים זמינים</div>';
  const subGroupOptions = g.subGroups.map((sg, i) => `<option value="${i}">${sg.time || 'קבוצה'}</option>`).join('');
  const subGroupDisabled = g.subGroups.length === 1 ? 'disabled' : '';
  return `
    ${firebaseWarning}
    <div class="att-card">
      <div class="att-card-header">🗓 נוכחות חוגים</div>
      <div class="att-controls">
        <div class="att-control-row"><label>חוג</label>
          <select id="attGroupSel" onchange="onAttGroupChange(this.value)">${groupOptions}</select></div>
        <div class="att-control-row"><label>קבוצה</label>
          <select id="attSubGroupSel" onchange="onAttSubGroupChange(this.value)" ${subGroupDisabled}>${subGroupOptions}</select></div>
        <div class="att-control-row"><label>תאריך</label>
          <select id="attDateSel" onchange="onAttDateChange(this.value)">
            ${getGroupMeetingDates(groups[attState.groupIdx]).map(d =>
              `<option value="${d}"${d === attState.date ? ' selected' : ''}>${formatDate(d)}</option>`
            ).join('')}
          </select></div>
      </div>
      <div class="att-actions">
        <button class="btn-att btn-check-all" onclick="attCheckAll()">✓ סמן הכל</button>
        <button class="btn-att btn-clear-all" onclick="attClearAll()">✗ נקה הכל</button>
        <button class="btn-att btn-save" id="btnSave" onclick="saveAttendance()">💾 שמור נוכחות</button>
        <button class="btn-att" onclick="toggleVacation()" style="background:#fff5f5;color:#e53e3e;border:1px solid #fed7d7">🚫 חופשה</button>
        <span class="save-status" id="saveStatus"></span>
      </div>
      <div class="att-player-list" id="attPlayerList">
        <div style="padding:20px;color:#718096;text-align:center">טוען...</div>
      </div>
      <div class="att-summary" id="attSummary"></div>
    </div>`;
}

function renderTeamAttendanceContent() {
  if (teams.length === 0) return '<div style="padding:24px;text-align:center;color:#888;">אין נבחרות זמינות</div>';
  const t = teams[teamAttState.teamIdx] || teams[0];
  const teamOptions  = teams.map((tm, i) => `<option value="${i}" ${i===teamAttState.teamIdx?'selected':''}>${tm.name}</option>`).join('');
  const subOptions   = t.subGroups.map((sg, i) => `<option value="${i}" ${i===teamAttState.subTeamIdx?'selected':''}>${sg.time || 'שחקנים'}</option>`).join('');
  const subDisabled  = t.subGroups.length === 1 ? 'disabled' : '';
  const teamDates    = getTeamMeetingDates(t);
  const dateControl  = teamDates.length > 0
    ? `<select id="teamAttDate" onchange="onTeamAttDateChange(this.value)"
        style="border:1px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:14px;font-family:inherit;width:100%">
        ${teamDates.map(d => `<option value="${d}"${d === teamAttState.date ? ' selected' : ''}>${formatDate(d)}</option>`).join('')}
       </select>`
    : `<input type="date" id="teamAttDate" value="${teamAttState.date}"
        onchange="onTeamAttDateChange(this.value)"
        style="border:1px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:14px;font-family:inherit">`;
  return `
    <div class="att-card">
      <div class="att-card-header">🏅 נוכחות נבחרות</div>
      <div class="att-controls">
        <div class="att-control-row"><label>נבחרת</label>
          <select id="teamAttSel" onchange="onTeamAttChange(this.value)">${teamOptions}</select></div>
        <div class="att-control-row"><label>קטגוריה</label>
          <select id="teamAttSubSel" onchange="onTeamAttSubChange(this.value)" ${subDisabled}>${subOptions}</select></div>
        <div class="att-control-row"><label>תאריך</label>
          <div id="teamAttDateContainer" style="flex:1">${dateControl}</div></div>
      </div>
      <div class="att-actions">
        <button class="btn-att btn-check-all" onclick="teamAttCheckAll()">✓ סמן הכל</button>
        <button class="btn-att btn-clear-all" onclick="teamAttClearAll()">✗ נקה הכל</button>
        <button class="btn-att btn-save" id="btnTeamSave" onclick="saveTeamAttendance()">💾 שמור נוכחות</button>
        <button class="btn-att" onclick="toggleTeamVacation()" style="background:#fff5f5;color:#e53e3e;border:1px solid #fed7d7">🚫 חופשה</button>
        <span class="save-status" id="teamSaveStatus"></span>
      </div>
      <div class="att-player-list" id="teamAttPlayerList">
        <div style="padding:20px;color:#718096;text-align:center">בחר נבחרת ותאריך</div>
      </div>
      <div class="att-summary" id="teamAttSummary"></div>
    </div>`;
}

const campAttState = {
  campId: null,
  levelIdx: 0,
  date: new Date().toISOString().split('T')[0],
};

function renderCampAttendanceContent() {
  if (camps.length === 0) return '<div style="padding:24px;text-align:center;color:#888;">אין מחנות זמינים</div>';
  if (!campAttState.campId || !camps.find(c => c.id === campAttState.campId)) campAttState.campId = camps[0].id;
  const camp = camps.find(c => c.id === campAttState.campId);
  const campOptions = camps.map(c => `<option value="${c.id}" ${c.id===campAttState.campId?'selected':''}>${c.name}</option>`).join('');
  const levelOptions = camp.levels.map((lv, i) => `<option value="${i}" ${i===campAttState.levelIdx?'selected':''}>${lv.name || 'רמה'}</option>`).join('');
  const levelDisabled = camp.levels.length === 1 ? 'disabled' : '';
  const campDates = getCampDates(camp);
  if (campDates.length > 0 && !campDates.includes(campAttState.date)) {
    campAttState.date = defaultDateForCamp(camp);
  }
  const dateControl = campDates.length > 0
    ? `<select id="campAttDate" onchange="onCampAttDateChange(this.value)"
        style="border:1px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:14px;font-family:inherit;width:100%">
        ${campDates.map(d => `<option value="${d}"${d === campAttState.date ? ' selected' : ''}>${formatDate(d)}</option>`).join('')}
       </select>`
    : `<input type="date" id="campAttDate" value="${campAttState.date}"
        onchange="onCampAttDateChange(this.value)"
        style="border:1px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:14px;font-family:inherit;width:100%">`;
  return `
    <div class="att-card">
      <div class="att-card-header">🏕️ נוכחות מחנות</div>
      <div class="att-controls">
        <div class="att-control-row"><label>מחנה</label>
          <select id="campAttSel" onchange="onCampAttChange(this.value)">${campOptions}</select></div>
        <div class="att-control-row"><label>רמה</label>
          <select id="campAttLevelSel" onchange="onCampAttLevelChange(this.value)" ${levelDisabled}>${levelOptions}</select></div>
        <div class="att-control-row"><label>תאריך</label>
          <div id="campAttDateContainer" style="flex:1">${dateControl}</div></div>
      </div>
      <div class="att-actions">
        <button class="btn-att btn-check-all" onclick="campAttCheckAll()">✓ סמן הכל</button>
        <button class="btn-att btn-clear-all" onclick="campAttClearAll()">✗ נקה הכל</button>
        <button class="btn-att btn-save" id="btnCampSave" onclick="saveCampAttendanceHub()">💾 שמור נוכחות</button>
        <span class="save-status" id="campSaveStatus"></span>
      </div>
      <div class="att-player-list" id="campAttPlayerList">
        <div style="padding:20px;color:#718096;text-align:center">טוען...</div>
      </div>
      <div class="att-summary" id="campAttSummary"></div>
    </div>`;
}

function onCampAttChange(campId) {
  campAttState.campId = campId;
  campAttState.levelIdx = 0;
  const panel = document.getElementById('panel-attendance');
  if (panel) { panel.innerHTML = renderAttendancePanel(); switchAttTab('camps'); }
}
window.onCampAttChange = onCampAttChange;

function onCampAttLevelChange(val) {
  campAttState.levelIdx = parseInt(val);
  loadCampAttendanceHub();
}
window.onCampAttLevelChange = onCampAttLevelChange;

function onCampAttDateChange(val) {
  campAttState.date = val;
  loadCampAttendanceHub();
}
window.onCampAttDateChange = onCampAttDateChange;

async function loadCampAttendanceHub() {
  const list = document.getElementById('campAttPlayerList');
  if (!list) return;
  const camp = camps.find(c => c.id === campAttState.campId);
  const lv = camp?.levels[campAttState.levelIdx];
  if (!camp || !lv) { list.innerHTML = '<div style="padding:20px;color:#a0aec0;text-align:center">אין שחקנים</div>'; return; }
  list.innerHTML = '<div style="padding:20px;color:#718096;text-align:center">טוען...</div>';
  let presentMap = {};
  if (db && campAttState.date) {
    try {
      const snap = await db.ref(`camp_attendance/${camp.id}/${campAttState.levelIdx}/${campAttState.date}`).get();
      presentMap = snap.val() || {};
    } catch(e) { console.error('loadCampAttendanceHub error:', e); }
  }
  renderCampAttPlayerList(presentMap);
}
window.loadCampAttendanceHub = loadCampAttendanceHub;

function renderCampAttPlayerList(presentMap) {
  const list = document.getElementById('campAttPlayerList');
  if (!list) return;
  const camp = camps.find(c => c.id === campAttState.campId);
  const lv = camp?.levels[campAttState.levelIdx];
  if (!lv || lv.players.length === 0) {
    list.innerHTML = '<div style="padding:20px;color:#a0aec0;text-align:center">אין שחקנים ברמה זו</div>';
    return;
  }
  list.innerHTML = sortedPlayers(lv.players).map(({ p, i }) => {
    const { first, last } = splitName(p.name);
    const key = p._key || String(i);
    const isPresent = !!presentMap[key];
    return `
      <label class="att-player-row${isPresent ? ' present' : ''}" data-playerkey="${key}" onclick="toggleCampAttPlayer(this)">
        <input type="checkbox" ${isPresent ? 'checked' : ''} onclick="event.stopPropagation(); toggleCampAttPlayerByCheckbox(this)">
        <span class="att-player-name">${last} ${first}</span>
        <span class="att-present-badge">נוכח ✓</span>
      </label>`;
  }).join('');
  updateCampAttSummary();
}

function toggleCampAttPlayer(row) {
  const cb = row.querySelector('input[type=checkbox]');
  cb.checked = !cb.checked;
  row.classList.toggle('present', cb.checked);
  updateCampAttSummary();
}
window.toggleCampAttPlayer = toggleCampAttPlayer;

function toggleCampAttPlayerByCheckbox(cb) {
  cb.closest('.att-player-row').classList.toggle('present', cb.checked);
  updateCampAttSummary();
}
window.toggleCampAttPlayerByCheckbox = toggleCampAttPlayerByCheckbox;

function updateCampAttSummary() {
  const total   = document.querySelectorAll('#campAttPlayerList .att-player-row').length;
  const present = document.querySelectorAll('#campAttPlayerList .att-player-row.present').length;
  const summary = document.getElementById('campAttSummary');
  if (summary) summary.textContent = `נוכחים: ${present} מתוך ${total}`;
}

function campAttCheckAll() {
  document.querySelectorAll('#campAttPlayerList .att-player-row').forEach(row => {
    row.querySelector('input').checked = true; row.classList.add('present');
  });
  updateCampAttSummary();
}
window.campAttCheckAll = campAttCheckAll;

function campAttClearAll() {
  document.querySelectorAll('#campAttPlayerList .att-player-row').forEach(row => {
    row.querySelector('input').checked = false; row.classList.remove('present');
  });
  updateCampAttSummary();
}
window.campAttClearAll = campAttClearAll;

async function saveCampAttendanceHub() {
  const btn    = document.getElementById('btnCampSave');
  const status = document.getElementById('campSaveStatus');
  if (!campAttState.date) { showToast('בחר תאריך', 'error'); return; }
  btn.disabled = true; btn.textContent = 'שומר...';
  const presentMap = {};
  document.querySelectorAll('#campAttPlayerList .att-player-row').forEach(row => {
    if (row.querySelector('input[type=checkbox]').checked)
      presentMap[row.dataset.playerkey] = true;
  });
  try {
    const camp = camps.find(c => c.id === campAttState.campId);
    if (db && camp) {
      await db.ref(`camp_attendance/${camp.id}/${campAttState.levelIdx}/${campAttState.date}`)
        .set(Object.keys(presentMap).length > 0 ? presentMap : null);
      logAudit('update_attendance', camp.id, camp.name,
        `מחנה · ${campAttState.date} · ${Object.keys(presentMap).length} נוכחים`);
    }
    status.textContent = '✅ נשמר!'; status.classList.add('visible');
    setTimeout(() => status.classList.remove('visible'), 2500);
  } catch(e) {
    status.textContent = '❌ שגיאה'; status.classList.add('visible');
    setTimeout(() => status.classList.remove('visible'), 3000);
  }
  btn.disabled = false; btn.textContent = '💾 שמור נוכחות';
}
window.saveCampAttendanceHub = saveCampAttendanceHub;

