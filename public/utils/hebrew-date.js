/**
 * Hebrew calendar date label for the month grid.
 * Purpose: show the Hebrew day (and the month name on the 1st) next to the
 *          Gregorian number. Pure Intl - no data, no network: the browser's
 *          ICU carries the Hebrew calendar (including leap years).
 * Dependencies: none (Intl)
 */

const fmtParts = new Map();

const ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
const HUNDREDS = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];

/**
 * A number 1-999 as Hebrew numerals: 1 -> א׳, 15 -> ט״ו, 16 -> ט״ז, 29 -> כ״ט,
 * 787 -> תשפ״ז. Written out instead of `nu-hebr`: engines differ in whether they
 * honour that numbering system for the day field.
 * @param {number} n
 * @returns {string}
 */
export function hebrewNumeral(n) {
  if (!Number.isInteger(n) || n < 1 || n > 999) return String(n);
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  // 15 and 16 avoid the divine name (י״ה, י״ו): ט״ו, ט״ז.
  let tail;
  if (rest === 15) tail = 'טו';
  else if (rest === 16) tail = 'טז';
  else tail = TENS[Math.floor(rest / 10)] + ONES[rest % 10];
  const letters = HUNDREDS[hundreds] + tail;
  if (letters.length === 1) return `${letters}׳`;
  return `${letters.slice(0, -1)}״${letters.slice(-1)}`;
}

/** Hebrew year without the thousands, as written in Hebrew: 5787 -> תשפ״ז. */
export function hebrewYearLabel(year) {
  return hebrewNumeral(Number(year) % 1000);
}

const fullFmt = new Map();
function fullParts(date) {
  let f = fullFmt.get('he');
  if (!f) {
    f = new Intl.DateTimeFormat('he-u-ca-hebrew-nu-latn', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    fullFmt.set('he', f);
  }
  const parts = f.formatToParts(new Date(`${date}T12:00:00Z`));
  return {
    day: Number(parts.find((p) => p.type === 'day')?.value),
    month: parts.find((p) => p.type === 'month')?.value ?? '',
    year: Number(parts.find((p) => p.type === 'year' || p.type === 'relatedYear')?.value),
  };
}

/**
 * The full Hebrew date, written the Hebrew way: "י״ג בכסלו תשפ״ז".
 * @param {string} date 'YYYY-MM-DD'
 * @param {{year?: boolean}} [o]
 * @returns {string} '' on failure
 */
export function hebrewFullDate(date, { year = true } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return '';
  try {
    const p = fullParts(date);
    if (!p.day || !p.month) return '';
    const base = `${hebrewNumeral(p.day)} ב${p.month}`;
    return year && p.year ? `${base} ${hebrewYearLabel(p.year)}` : base;
  } catch {
    return '';
  }
}

/**
 * The Hebrew month(s) a Gregorian month spans, for the month title:
 * "כסלו תשפ״ז" or "חשוון - כסלו תשפ״ז" (and across Rosh Hashana the year changes).
 * @param {number|string} gYear
 * @param {number|string} gMonth 1-12
 * @returns {string} '' on failure
 */
export function hebrewMonthRange(gYear, gMonth) {
  try {
    const y = Number(gYear);
    const m = Number(gMonth);
    const pad = (n) => String(n).padStart(2, '0');
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const a = fullParts(`${y}-${pad(m)}-01`);
    const b = fullParts(`${y}-${pad(m)}-${pad(last)}`);
    if (!a.month || !b.month) return '';
    if (a.month === b.month) return `${a.month} ${hebrewYearLabel(a.year)}`;
    if (a.year === b.year) return `${a.month} - ${b.month} ${hebrewYearLabel(a.year)}`;
    return `${a.month} ${hebrewYearLabel(a.year)} - ${b.month} ${hebrewYearLabel(b.year)}`;
  } catch {
    return '';
  }
}

function formatter(locale, numbering) {
  const key = `${locale}|${numbering}`;
  let f = fmtParts.get(key);
  if (!f) {
    // Latin digits always: the numeral conversion happens in hebrewNumeral().
    f = new Intl.DateTimeFormat(`${locale}-u-ca-hebrew-nu-latn`, {
      day: 'numeric', month: 'long', timeZone: 'UTC',
    });
    fmtParts.set(key, f);
  }
  return f;
}

/**
 * @param {string} date 'YYYY-MM-DD' (Gregorian)
 * @param {string} [locale] UI language; Hebrew numerals only for `he`
 * @returns {string} e.g. "ט״ו" or "1 שבט" on the first of a Hebrew month; '' on failure
 */
export function hebrewDayLabel(date, locale = 'he') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return '';
  try {
    // Noon UTC: far from any day boundary in every timezone offset.
    const d = new Date(`${date}T12:00:00Z`);
    const lang = locale === 'he' ? 'he' : 'en';
    const parts = formatter(lang, 'latn').formatToParts(d);
    const day = parts.find((p) => p.type === 'day')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    const firstOfMonth = formatter('en', 'latn').formatToParts(d).find((p) => p.type === 'day')?.value === '1';
    if (!day) return '';
    const shown = locale === 'he' ? hebrewNumeral(Number(day)) : day;
    return firstOfMonth && month ? `${shown} ${month}` : shown;
  } catch {
    return '';
  }
}
