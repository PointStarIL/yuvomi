/**
 * Tests: recipe instructions as a checklist (public/utils/recipe-steps.js)
 * Run: node --test test/test-recipe-steps.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseInstructions, stepKey, loadProgress, saveProgress } from '../public/utils/recipe-steps.js';

const memory = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m };
};

test('parseInstructions: headings end with a colon, everything else is a step', () => {
  const blocks = parseInstructions('אופן ההכנה:\nמערבבים קמח וסוכר.\nלבצק:\nמוסיפים ביצה.');
  assert.deepEqual(blocks.map((b) => b.type), ['heading', 'step', 'heading', 'step']);
  assert.equal(blocks[0].text, 'אופן ההכנה');
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
