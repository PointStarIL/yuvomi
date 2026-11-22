/**
 * Tests: recipe instructions as a checklist (public/utils/recipe-steps.js)
 * Run: node --test test/test-recipe-steps.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseInstructions, stepKey, loadProgress, saveProgress, PROGRESS_TTL_MS } from '../public/utils/recipe-steps.js';

const memory = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m };
};

test('parseInstructions: headings end with a colon, everything else is a step', () => {
  const blocks = parseInstructions('אופן ההכנה:\nמערבבים קמח וסוכר.\nלבצק:\nמוסיפים ביצה.');
  assert.deepEqual(blocks.map((b) => b.type), ['heading', 'step', 'heading', 'step']);
  assert.equal(blocks[0].text, 'אופן ההכנה');
});

test('parseInstructions: a short line ending with a dash is a heading too, the dash is dropped', () => {
  const [a, b] = parseInstructions('הכנת הטאנזונג -\nקרם הזביונה-\nמערבבים.');
  assert.deepEqual([a.type, a.text], ['heading', 'הכנת הטאנזונג']);
  assert.deepEqual([b.type, b.text], ['heading', 'קרם הזביונה']);
});

test('parseInstructions: warnings and dashed lines are notes without a checkbox', () => {
  const blocks = parseInstructions('חשוב לעבוד עם כפפות.\n- דגש קטן\nמערבבים.');
  assert.deepEqual(blocks.map((b) => b.type), ['note', 'note', 'step']);
  assert.equal(blocks[1].text, 'דגש קטן');
});

test('parseInstructions: an intro line "מתכון ל..." is a note, only as the first line', () => {
  assert.equal(parseInstructions('מתכון לטירמיסו קלאסי: (22 ס״מ).\nמערבבים.')[0].type, 'note');
  assert.equal(parseInstructions('מערבבים.\nמתכון לטירמיסו.')[1].type, 'step');
});

test('parseInstructions: a long line ending with a colon is a step, blank lines are ignored', () => {
  const long = 'א'.repeat(90) + ':';
  assert.equal(parseInstructions(`\n\n${long}\n`)[0].type, 'step');
  assert.deepEqual(parseInstructions('   \n\n'), []);
});

test('parseInstructions: identical steps get distinct keys', () => {
  const [a, b] = parseInstructions('מערבבים.\nמערבבים.');
  assert.notEqual(a.key, b.key);
  assert.equal(a.key, stepKey('מערבבים.'));
});

test('progress: round-trips, and an empty record leaves nothing in storage', () => {
  const store = memory();
  saveProgress(7, { i: new Set(['קמח']), s: new Set(['x1']) }, store);
  const back = loadProgress(7, store);
  assert.deepEqual([...back.i], ['קמח']);
  assert.deepEqual([...back.s], ['x1']);
  saveProgress(7, { i: new Set(), s: new Set() }, store);
  assert.equal(store._m.size, 0);
});

test('progress: a broken or blocked storage reads as empty and never throws', () => {
  const broken = { getItem: () => '{not json', setItem: () => { throw new Error('full'); }, removeItem: () => {} };
  const p = loadProgress(1, broken);
  assert.equal(p.i.size + p.s.size, 0);
  assert.doesNotThrow(() => saveProgress(1, { i: new Set(['a']), s: new Set() }, broken));
});

test('progress: ticks survive at least 30 minutes, and any new tick renews the clock', () => {
  const store = memory();
  const t0 = 1_000_000;
  saveProgress(3, { i: new Set(['mehl']), s: new Set() }, store, t0);
  assert.equal(loadProgress(3, store, t0 + 30 * 60 * 1000).i.has('mehl'), true, '30 minutes later');
  assert.equal(loadProgress(3, store, t0 + PROGRESS_TTL_MS - 1000).i.has('mehl'), true, 'just inside the TTL');
  saveProgress(3, { i: new Set(['mehl', 'salz']), s: new Set() }, store, t0 + 5 * 60 * 60 * 1000);
  assert.equal(loadProgress(3, store, t0 + 10 * 60 * 60 * 1000).i.size, 2, 'renewed by the later tick');
});

test('progress: stale or unstamped ticks are dropped and removed from storage', () => {
  const store = memory();
  saveProgress(4, { i: new Set(['a']), s: new Set() }, store, 0);
  assert.equal(loadProgress(4, store, PROGRESS_TTL_MS + 1).i.size, 0);
  assert.equal(store._m.size, 0, 'the stale record is removed');
  store.setItem('yuvomi:recipe-progress:5', JSON.stringify({ i: ['x'], s: [] }));
  assert.equal(loadProgress(5, store).i.size, 0, 'no time stamp: dropped');
});
