import React, { useEffect, useRef, useState } from 'react';

/**
 * NoteForm
 * - Controlled form for creating a new note
 * - Requires at least title or content
 */
export default function NoteForm({ onSubmit }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const titleRef = useRef(null);

  useEffect(() => {
    // Focus title on mount for quick entry
    titleRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const valid = title.trim() || content.trim();
    if (!valid) {
      setError('Please enter a title or some content.');
      return;
    }
    onSubmit({ title, content });
    setTitle('');
    setContent('');
    setError('');
    titleRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="form" aria-label="Create new note">
      <div className="form-row">
        <div className="input-group">
          <label htmlFor="note-title" className="label">Title</label>
          <input
            id="note-title"
            ref={titleRef}
            className="input"
            type="text"
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={!!error && !title.trim() && !content.trim()}
            aria-describedby={error ? 'new-note-error' : undefined}
          />
          <label htmlFor="note-content" className="label">Content</label>
          <textarea
            id="note-content"
            className="textarea"
            placeholder="Write your note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />
          {error ? (
            <div id="new-note-error" className="error-text" role="alert">
              {error}
            </div>
          ) : null}
        </div>
        <div className="actions" style={{ justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" aria-label="Add note">
            ➕ Add
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setTitle('');
              setContent('');
              setError('');
              titleRef.current?.focus();
            }}
            aria-label="Clear form"
          >
            Clear
          </button>
        </div>
      </div>
    </form>
  );
}
