// ===== ISRAELI HOLIDAYS (auto-fetched, no manual entry needed) =====
// Pulled live from the free, public Hebcal API (CORS-enabled, no key required) so the
// list is always correct for any year without anyone having to update it by hand.
// Used by both "לוח פעילויות" (monthly-calendar.js) and "גאנט תחרויות"
// (tournament-calendar-leagues.js) as an overlay merged in at render time only —
// nothing here is ever written to Firebase, so it can never go stale or need cleanup.

const ISRAELI_HOLIDAY_COLOR = '#2f7d6c'; // matches the existing "חג" category color used in the tournament calendar

// Keep only the days worth a calendar chip: the classic "major" chagim (including
// "Erev" eve-days), but only their FIRST day for multi-day ones (Pesach, Sukkot,
// Chanukah, Rosh Hashana) rather than every Chol HaMoed / candle-count day — and
// from the "modern" Israeli national days, only the well-known four.
function _isRelevantHolidayItem(it) {
  if (it.category !== 'holiday') return false;
  if (it.subcat === 'modern') {
    return /^Yom HaShoah/.test(it.title) || /^Yom HaZikaron/.test(it.title) ||
           /^Yom HaAtzma/.test(it.title) || /^Yom Yerushalayim/.test(it.title);
  }
  if (/\b(II|III|IV|V|VI|VII|VIII)\b/.test(it.title)) return false; // Chol HaMoed / continuation days
  if (/Candles?$/.test(it.title) && it.title !== 'Chanukah: 1 Candle') return false; // Chanukah days 2-8
  if (/8th Day/.test(it.title)) return false; // Chanukah's 8th day
  return true;
}

let _holidayFetchCache = {}; // year -> Promise<Array<{date, title}>>

function _fetchIsraeliHolidaysForYear(year) {
  if (_holidayFetchCache[year]) return _holidayFetchCache[year];
  const url = 'https://www.hebcal.com/hebcal?cfg=json&v=1&maj=on&min=off&mod=on&nx=off&year=' + year + '&i=on&ss=off&mf=off&c=off';
  _holidayFetchCache[year] = fetch(url)
    .then(function(r) { return r.ok ? r.json() : Promise.reject(new Error('hebcal http ' + r.status)); })
    .then(function(j) {
      return (j.items || [])
        .filter(_isRelevantHolidayItem)
        // Hebcal appends the Hebrew year to Rosh Hashana's title ("ראש השנה 5787") —
        // strip it so the chip text stays clean and matches how these are named manually.
        .map(function(it) { return { date: it.date, title: (it.hebrew || it.title).replace(/\s+\d{4}$/, '') }; });
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
