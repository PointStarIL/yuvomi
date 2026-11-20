/**
 * Hebrew calendar date label for the month grid.
 * Purpose: show the Hebrew day (and the month name on the 1st) next to the
 *          Gregorian number. Pure Intl - no data, no network: the browser's
 *          ICU carries the Hebrew calendar (including leap years).
 * Dependencies: none (Intl)
 */

const fmtParts = new Map();

const ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const TENS = ['', 'י', 'כ', 'ל'];

/**
 * Day of a Hebrew month (1-30) as Hebrew numerals: 1 -> א׳, 15 -> ט״ו, 16 -> ט״ז,
 * 29 -> כ״ט. Written out instead of `nu-hebr`: engines differ in whether they
 * honour that numbering system for the day field.
 * @param {number} n
 * @returns {string}
 */
export function hebrewNumeral(n) {
  if (!Number.isInteger(n) || n < 1 || n > 30) return String(n);
  // 15 and 16 avoid the divine name (י״ה, י״ו): ט״ו, ט״ז.
  const [tens, ones] = n === 15 ? [0, 15] : n === 16 ? [0, 16] : [Math.floor(n / 10), n % 10];
  let letters;
  if (n === 15) letters = 'טו';
  else if (n === 16) letters = 'טז';
  else letters = TENS[tens] + ONES[ones];
  if (letters.length === 1) return `${letters}׳`;
  return `${letters.slice(0, -1)}״${letters.slice(-1)}`;
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
