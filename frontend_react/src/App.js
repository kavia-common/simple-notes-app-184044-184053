import React, { useEffect, useMemo, useState, useRef } from 'react';
import './App.css';
import './index.css';
import NoteForm from './components/NoteForm';
import NotesList from './components/NotesList';
import { loadNotes, saveNotes } from './utils/storage';

// Key used to persist theme
const THEME_STORAGE_KEY = 'notesApp:theme';

// PUBLIC_INTERFACE
export default function App() {
  /**
   * Single-page Notes App
   * - Provides header, new note form, and notes list
   * - Manages notes state and persists via localStorage
   * - Theme: light/dark via [data-theme] on root, persisted to localStorage
   */
  const [notes, setNotes] = useState(() => loadNotes());
  const [filter, setFilter] = useState('');
  const [theme, setTheme] = useState(() => {
    // Determine initial theme: saved preference or system preference
    if (typeof window === 'undefined') return 'light';
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });
  const headerRef = useRef(null);

  useEffect(() => {
    // Persist notes on any change
    saveNotes(notes);
  }, [notes]);

  useEffect(() => {
    // Apply theme to root for CSS variables
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    // Listen for system preference changes if user hasn't set explicit preference yet
    // If user has a saved preference, we respect that and skip dynamic changes.
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(THEME_STORAGE_KEY) : null;
    if (saved === 'light' || saved === 'dark') return;

    const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    if (!mq || !mq.addEventListener) return;

    const handler = (e) => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const filteredNotes = useMemo(() => {
    if (!filter.trim()) return notes;
    const q = filter.trim().toLowerCase();
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        (n.content || '').toLowerCase().includes(q)
    );
  }, [notes, filter]);

  const handleAdd = (draft) => {
    const now = new Date().toISOString();
    const id =
      (window.crypto && window.crypto.randomUUID && window.crypto.randomUUID()) ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newNote = {
      id,
      title: draft.title.trim(),
      content: (draft.content || '').trim(),
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => [newNote, ...prev]);
  };

  const handleUpdate = (id, updates) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : n
      )
    );
  };

  const handleDelete = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const toggleTheme = () => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  };

  const themeLabel = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
  const themeIcon = theme === 'light' ? '🌙' : '☀️';

  return (
    <div className="notes-app">
      <header className="app-header sheen-top highlight-angled" ref={headerRef}>
        <h1 className="app-title" aria-label="Simple Notes App">
          Simple Notes
        </h1>
        <div className="header-actions">
          <button
            className="theme-toggle light-sweep"
            onClick={toggleTheme}
            aria-label={themeLabel}
            title={themeLabel}
            type="button"
          >
            <span className="icon" aria-hidden="true">{themeIcon}</span>
          </button>
          <label htmlFor="search" className="sr-only">
            Search notes
          </label>
          <input
            id="search"
            type="search"
            placeholder="Search notes..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="search-input light-sweep"
            aria-label="Search notes"
          />
        </div>
      </header>

      <main className="content">
        <section
          className="new-note-section"
          aria-labelledby="new-note-heading"
        >
          <h2 id="new-note-heading" className="section-title">
            Add a new note
          </h2>
          <NoteForm onSubmit={handleAdd} />
        </section>

        <section
          className="notes-list-section"
          aria-labelledby="notes-list-heading"
        >
          <h2 id="notes-list-heading" className="section-title">
            Your notes ({filteredNotes.length})
          </h2>
          <NotesList
            notes={filteredNotes}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        </section>
      </main>

      <footer className="app-footer" aria-label="footer">
        <small>
          Notes are stored locally in your browser. No data leaves this device.
        </small>
      </footer>
    </div>
  );
}
