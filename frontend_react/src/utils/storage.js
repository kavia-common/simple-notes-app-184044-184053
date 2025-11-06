const STORAGE_KEY = 'notesApp:v1';

/**
 * Safely parse JSON.
 * @param {string} text
 * @param {any} fallback
 * @returns {any}
 */
function safeParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

// PUBLIC_INTERFACE
export function loadNotes() {
  /** Load notes array from localStorage, or return empty array if missing. */
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const notes = safeParse(raw, []);
  if (!Array.isArray(notes)) return [];
  return notes;
}

// PUBLIC_INTERFACE
export function saveNotes(notes) {
  /** Save notes array to localStorage under a single key. */
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes || []));
  } catch {
    // ignore quota or serialization errors
  }
}
