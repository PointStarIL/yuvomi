/**
 * Recipe instructions as a checklist.
 * Purpose: split the free-text instructions of a recipe into headings, steps and
 *          side notes, and keep "what I already did / put in" per recipe on this
 *          device (localStorage) while cooking.
 * Dependencies: none (pure; storage is injected so it can be tested)
 *
 * The recipe keeps ONE text field (`notes`), so the structure is read off its
 * lines, never stored: a short line that ends with ":" is a heading; a line that
 * starts with a warning word (or a dash) is a side note without a checkbox;
 * everything else is a step. Blank lines only separate.
 */

const NOTE_WORDS = /^(?:דיסקליימר|חשוב|דגש(?:ים)?(?:\s+נוספים)?|הערה|הערות|טיפ|טיפים|שימו\s+לב|שימי\s+לב|לתשומת\s+לב|הערות\s+המתכון)(?=[\s:,.!-]|$)/;
const MAX_HEADING = 80;
const STORAGE_PREFIX = 'yuvomi:recipe-progress:';

/**
 * @param {string|null|undefined} text
 * @returns {Array<{type: 'heading'|'step'|'note', text: string, key?: string}>}
 */
export function parseInstructions(text) {
  const blocks = [];
  const seen = new Map();
  const lines = String(text ?? '').split(/\r?\n/).map((l) => l.trim());
  let first = true;
  for (const line of lines) {
    if (!line) continue;
    const bullet = /^[-•*]\s+/.test(line);
    const clean = line.replace(/^[-•*]\s+/, '').trim();
    if (!clean) continue;
    if (!bullet && clean.length <= MAX_HEADING && /:$/.test(clean)) {
      blocks.push({ type: 'heading', text: clean.replace(/:$/, '').trim() });
    } else if (bullet || NOTE_WORDS.test(clean) || (first && /^מתכון\s+ל/.test(clean))) {
      blocks.push({ type: 'note', text: clean });
    } else {
      const base = stepKey(clean);
      const n = (seen.get(base) ?? 0) + 1;
      seen.set(base, n);
      blocks.push({ type: 'step', text: clean, key: n === 1 ? base : `${base}-${n}` });
    }
    first = false;
  }
  return blocks;
}

/** Short stable key for a step: survives reordering, changes when its text changes. */
export function stepKey(text) {
  let h = 5381;
  for (const ch of String(text)) h = ((h * 33) ^ ch.codePointAt(0)) >>> 0;
  return h.toString(36);
}

function storageFor(storage) {
  if (storage) return storage;
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

/** @returns {{ i: Set<string>, s: Set<string> }} ingredient keys and step keys already done */
export function loadProgress(recipeId, storage) {
  const out = { i: new Set(), s: new Set() };
  try {
    const raw = storageFor(storage)?.getItem(STORAGE_PREFIX + recipeId);
    if (!raw) return out;
    const data = JSON.parse(raw);
    for (const k of Array.isArray(data?.i) ? data.i : []) if (typeof k === 'string') out.i.add(k);
    for (const k of Array.isArray(data?.s) ? data.s : []) if (typeof k === 'string') out.s.add(k);
  } catch { /* unreadable or blocked: start empty */ }
  return out;
}

/** Persist; an empty record removes the entry so finished recipes leave nothing behind. */
export function saveProgress(recipeId, progress, storage) {
  try {
    const store = storageFor(storage);
    if (!store) return;
    if (!progress.i.size && !progress.s.size) store.removeItem(STORAGE_PREFIX + recipeId);
    else store.setItem(STORAGE_PREFIX + recipeId, JSON.stringify({ i: [...progress.i], s: [...progress.s] }));
  } catch { /* storage full or blocked: the checkmarks just do not persist */ }
}
