/**
 * Tests: Hebrew date label for the month grid (public/utils/hebrew-date.js)
 * Purpose: Hebrew numerals without ICU numbering support, month name on the 1st,
 *          leap-year-safe dates straight from Intl.
 * Run: node --test test/test-hebrew-date.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hebrewDayLabel, hebrewNumeral, hebrewYearLabel, hebrewFullDate, hebrewMonthRange } from '../public/utils/hebrew-date.js';

test('hebrewNumeral: gematria for 1-30, 15 and 16 avoid the divine name', () => {
  const expected = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ז׳', 'ח׳', 'ט׳', 'י׳',
    'י״א', 'י״ב', 'י״ג', 'י״ד', 'ט״ו', 'ט״ז', 'י״ז', 'י״ח', 'י״ט', 'כ׳',
    'כ״א', 'כ״ב', 'כ״ג', 'כ״ד', 'כ״ה', 'כ״ו', 'כ״ז', 'כ״ח', 'כ״ט', 'ל׳'];
  assert.deepEqual(Array.from({ length: 30 }, (_, i) => hebrewNumeral(i + 1)), expected);
});

test('hebrewNumeral: out-of-range input falls back to plain digits', () => {
  assert.equal(hebrewNumeral(0), '0');
  assert.equal(hebrewNumeral(1000), '1000');
});

test('hebrewDayLabel: 12 Sep 2026 is 1 Tishrei 5787 - the month shows on the 1st', () => {
  assert.equal(hebrewDayLabel('2026-09-12', 'he'), 'א׳ תשרי');
});

test('hebrewDayLabel: ordinary days show only the numeral (Yom Kippur = 10 Tishrei)', () => {
  assert.equal(hebrewDayLabel('2026-09-21', 'he'), 'י׳');
  assert.equal(hebrewDayLabel('2026-09-11', 'he'), 'כ״ט'); // last day of Elul
});

test('hebrewDayLabel: other UI languages get Latin digits', () => {
  assert.equal(hebrewDayLabel('2026-09-21', 'en'), '10');
});

test('hebrewDayLabel: garbage in, empty string out', () => {
  assert.equal(hebrewDayLabel('not-a-date'), '');
  assert.equal(hebrewDayLabel(''), '');
});

test('hebrewNumeral: hundreds for years, 15/16 keep their exceptions', () => {
  assert.equal(hebrewNumeral(787), 'תשפ״ז');
  assert.equal(hebrewNumeral(400), 'ת׳');
  assert.equal(hebrewNumeral(500), 'ת״ק');
  assert.equal(hebrewNumeral(115), 'קט״ו');
  assert.equal(hebrewYearLabel(5787), 'תשפ״ז');
});

test('hebrewFullDate: written the Hebrew way, with or without the year', () => {
  assert.equal(hebrewFullDate('2026-09-12'), 'א׳ בתשרי תשפ״ז');
  assert.equal(hebrewFullDate('2026-09-12', { year: false }), 'א׳ בתשרי');
  assert.equal(hebrewFullDate('garbage'), '');
});

test('hebrewMonthRange: one month, two months, and across Rosh Hashana', () => {
  assert.equal(hebrewMonthRange(2026, 11), 'חשוון - כסלו תשפ״ז');
  assert.equal(hebrewMonthRange(2026, 9), 'אלול תשפ״ו - תשרי תשפ״ז');
});
