// ===== ISRAELI HOLIDAYS (auto-fetched, no manual entry needed) =====
// Pulled live from the free, public Hebcal API (CORS-enabled, no key required) so the
// list is always correct for any year without anyone having to update it by hand.
// Used by both "לוח פעילויות" (monthly-calendar.js) and "גאנט תחרויות"
// (tournament-calendar-leagues.js) as an overlay merged in at render time only —
// nothing here is ever written to Firebase, so it can never go stale or need cleanup.

const ISRAELI_HOLIDAY_COLOR = '#2f7d6c'; // matches the existing "חג" category color used in the tournament calendar

// Every day of the classic "major" chagim — Erev, Chol HaMoed, every Chanukah day —
// plus, from the "modern" Israeli national days, only the well-known four (skipping
// the civic/school observances Hebcal also returns, like Family Day or Herzl Day).
function _isRelevantHolidayItem(it) {
  if (it.category !== 'holiday') return false;
  if (it.subcat === 'modern') {
    return /^Yom HaShoah/.test(it.title) || /^Yom HaZikaron/.test(it.title) ||
           /^Yom HaAtzma/.test(it.title) || /^Yom Yerushalayim/.test(it.title);
  }
  return it.subcat === 'major';
}

function _addDay(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

// Hebcal doesn't return Isru Chag on its own — it's simply the day right after each
// of the three pilgrimage festivals ends, so we derive it from the days we already have.
function _deriveIsruChag(items) {
  const pesachLast    = items.find(function(it) { return it.title === 'Pesach VII'; });
  const shavuot       = items.find(function(it) { return it.title === 'Shavuot'; });
  const shminiAtzeret = items.find(function(it) { return it.title === 'Shmini Atzeret'; });
  const out = [];
  if (pesachLast)    out.push({ date: _addDay(pesachLast.date),    title: 'אסרו חג פסח' });
  if (shavuot)       out.push({ date: _addDay(shavuot.date),       title: 'אסרו חג שבועות' });
  if (shminiAtzeret) out.push({ date: _addDay(shminiAtzeret.date), title: 'אסרו חג סוכות' });
  return out;
}

let _holidayFetchCache = {}; // year -> Promise<Array<{date, title}>>

function _fetchIsraeliHolidaysForYear(year) {
  if (_holidayFetchCache[year]) return _holidayFetchCache[year];
  const url = 'https://www.hebcal.com/hebcal?cfg=json&v=1&maj=on&min=off&mod=on&nx=off&year=' + year + '&i=on&ss=off&mf=off&c=off';
  _holidayFetchCache[year] = fetch(url)
    .then(function(r) { return r.ok ? r.json() : Promise.reject(new Error('hebcal http ' + r.status)); })
    .then(function(j) {
      const relevant = (j.items || []).filter(_isRelevantHolidayItem);
      const isruChag = _deriveIsruChag(relevant);
      return relevant
        // Hebcal appends the Hebrew year to Rosh Hashana's title ("ראש השנה 5787") —
        // strip it so the chip text stays clean and matches how these are named manually.
        .map(function(it) { return { date: it.date, title: (it.hebrew || it.title).replace(/\s+\d{4}$/, '') }; })
        .concat(isruChag);
    })
    .catch(function(e) { console.warn('Israeli holidays fetch failed:', e); return []; });
  return _holidayFetchCache[year];
}

// Returns {date, title, color} entries for every year in [startYear, endYear] (inclusive).
async function getIsraeliHolidays(startYear, endYear) {
  const years = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);
  const perYear = await Promise.all(years.map(_fetchIsraeliHolidaysForYear));
  return perYear.flat().map(function(h) {
    return { date: h.date, title: h.title, color: ISRAELI_HOLIDAY_COLOR };
  });
}
window.getIsraeliHolidays = getIsraeliHolidays;
