/**
 * Recipe taxonomy: course, kashrut and free tags.
 * Purpose: one definition for the router (validation) and the forms/filters.
 * Dependencies: none (isomorphic, import-free; allowlisted in .dependency-cruiser.mjs)
 *
 * Three independent layers on a recipe, besides `meal_types` (which meals the
 * recipe can be planned as):
 *   - course   one of RECIPE_COURSES, or none: what kind of dish it is
 *   - kashrut  one of RECIPE_KASHRUT, or none: dairy / meat / pareve
 *   - tags     free text, at most MAX_RECIPE_TAGS per recipe
 */

export const RECIPE_COURSES = Object.freeze(['main', 'side', 'starter', 'dessert', 'bakery', 'drink', 'base']);
export const RECIPE_KASHRUT = Object.freeze(['dairy', 'meat', 'pareve']);
export const MAX_RECIPE_TAGS = 12;
export const MAX_RECIPE_TAG_LENGTH = 30;

/** @param {unknown} value @returns {string|null} a known course, else null */
export function normalizeCourse(value) {
  const v = String(value ?? '').trim();
  return RECIPE_COURSES.includes(v) ? v : null;
}

/** @param {unknown} value @returns {string|null} a known kashrut value, else null */
export function normalizeKashrut(value) {
  const v = String(value ?? '').trim();
  return RECIPE_KASHRUT.includes(v) ? v : null;
}

/**
 * Tags as a clean list: trimmed, inner spaces folded, a leading "#" dropped, cut to
 * MAX_RECIPE_TAG_LENGTH, duplicates removed ignoring case (the first spelling
 * wins), at most MAX_RECIPE_TAGS. Accepts a list or comma-separated text.
 * @param {unknown} value
 * @returns {string[]}
 */
export function normalizeTags(value) {
  const source = Array.isArray(value) ? value : String(value ?? '').split(',');
  const seen = new Set();
  const out = [];
  for (const raw of source) {
    const tag = String(raw ?? '').trim().replace(/^#+/, '').replace(/\s+/g, ' ').trim().slice(0, MAX_RECIPE_TAG_LENGTH).trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= MAX_RECIPE_TAGS) break;
  }
  return out;
}
