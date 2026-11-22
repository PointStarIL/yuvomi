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

// ---- layout: the filter row lives in the page head, not across the whole page ----
import { readFileSync } from 'node:fs';

test('the filter row is the head\'s bar row, so it sits on the module column', () => {
  const js = readFileSync(new URL('../public/pages/recipes.js', import.meta.url), 'utf8');
  assert.match(js, /facets\.className = 'recipes-facets page-toolbar__bar'/);
  assert.match(js, /toolbar\.appendChild\(facets\)/);
  assert.doesNotMatch(js, /page\.append\([^)]*facets/, 'not a child of the page itself: that ran across the whole window width');
});

test('cooking mode: opens above everything, closes with Escape or the X at the line end, keeps the ticks', () => {
  const js = readFileSync(new URL('../public/pages/recipes.js', import.meta.url), 'utf8');
  assert.match(js, /overlay\.setAttribute\('aria-modal', 'true'\)/);
  assert.match(js, /bar\.append\(title, closeBtn\)/, 'title first, X last: the X lands on the line end (left in Hebrew)');
  assert.match(js, /e\.key === 'Escape'/);
  assert.match(js, /inertOutside\(overlay\)/);
  const css = readFileSync(new URL('../public/styles/recipes.css', import.meta.url), 'utf8');
  assert.match(css, /\.cook-mode \.recipe-detail__ingredient-match[^{]*\{\s*display:\s*none/, 'no pantry detours while cooking');
});

test('cooking mode: its button opens the detail, it is not buried in the action row at the end', () => {
  const js = readFileSync(new URL('../public/pages/recipes.js', import.meta.url), 'utf8');
  const detail = js.slice(js.indexOf('function fillRecipeDetail('));
  assert.ok(detail.indexOf("recipe-detail__cook") > 0 && detail.indexOf("recipe-detail__cook") < detail.indexOf('const hero = recipeHeroEl'), 'before the hero image');
  assert.doesNotMatch(js.slice(js.indexOf("detailActions.className")), /openCookingMode\(recipe, cook\)[\s\S]{0,40}detailActions\.appendChild\(cook\)/);
});
