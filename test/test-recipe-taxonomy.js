/**
 * Tests: recipe course, kashrut and tags (public/utils/recipe-taxonomy.js)
 * Run: node --test test/test-recipe-taxonomy.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  RECIPE_COURSES, RECIPE_KASHRUT, MAX_RECIPE_TAGS, MAX_RECIPE_TAG_LENGTH,
  normalizeCourse, normalizeKashrut, normalizeTags,
} from '../public/utils/recipe-taxonomy.js';

test('the approved course list and the three kashrut values', () => {
  assert.deepEqual([...RECIPE_COURSES], ['main', 'side', 'starter', 'dessert', 'bakery', 'drink', 'base']);
  assert.deepEqual([...RECIPE_KASHRUT], ['dairy', 'meat', 'pareve']);
});

test('normalizeCourse / normalizeKashrut: known values pass, everything else is null', () => {
  assert.equal(normalizeCourse(' dessert '), 'dessert');
  assert.equal(normalizeCourse('Dessert'), null);
  assert.equal(normalizeCourse(''), null);
  assert.equal(normalizeCourse(undefined), null);
  assert.equal(normalizeKashrut('pareve'), 'pareve');
  assert.equal(normalizeKashrut('kosher'), null);
});

test('normalizeTags: trims, drops "#", folds spaces, dedupes ignoring case', () => {
  assert.deepEqual(normalizeTags(['  שבת ', '#שבת', 'Easy  Dinner', 'easy dinner', '', '   ']), ['שבת', 'Easy Dinner']);
});

test('normalizeTags: accepts comma text, cuts long tags and caps the count', () => {
  assert.deepEqual(normalizeTags('איטלקי, בלי תנור ,'), ['איטלקי', 'בלי תנור']);
  assert.equal(normalizeTags(['x'.repeat(80)])[0].length, MAX_RECIPE_TAG_LENGTH);
  assert.equal(normalizeTags(Array.from({ length: 40 }, (_, i) => `t${i}`)).length, MAX_RECIPE_TAGS);
  assert.deepEqual(normalizeTags(null), []);
  assert.deepEqual(normalizeTags(undefined), []);
});
