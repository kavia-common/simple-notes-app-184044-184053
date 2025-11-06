import React, { useEffect, useRef, useState } from 'react';

function formatDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export default function NoteItem({ note, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(note.title);
  const [draftContent, setDraftContent] = useState(note.content || '');
  const [error, setError] = useState('');
  const titleInputRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      titleInputRef.current?.focus();
    }
  }, [isEditing]);

  const save = () => {
    const valid = draftTitle.trim() || draftContent.trim();
    if (!valid) {
      setError('Title or content is required.');
      return;
    }
    onUpdate(note.id, { title: draftTitle.trim(), content: draftContent.trim() });
    setIsEditing(false);
    setError('');
  };

  const cancel = () => {
    setDraftTitle(note.title);
    setDraftContent(note.content || '');
    setIsEditing(false);
    setError('');
  };

  const confirmDelete = () => {
    const ok = window.confirm('Delete this note? This action cannot be undone.');
    if (ok) {
      onDelete(note.id);
    }
  };

  return (
    <article
      className="note-card"
      aria-label={`Note: ${note.title || 'Untitled'}`}
      aria-live="polite"
    >
      {!isEditing ? (
        <>
          <header>
            <h3 className="note-title">{note.title || 'Untitled'}</h3>
            <div className="note-meta">
              <span>Created: {formatDate(note.createdAt)}</span> ·{' '}
              <span>Updated: {formatDate(note.updatedAt)}</span>
            </div>
          </header>
          {note.content ? (
            <p className="note-content">
              {note.content.length > 220
                ? `${note.content.slice(0, 220)}…`
                : note.content}
            </p>
          ) : null}
          <div className="divider" />
          <div className="actions">
            <button
              className="btn btn-secondary light-sweep"
              onClick={() => setIsEditing(true)}
              aria-label={`Edit note ${note.title || 'Untitled'}`}
            >
              ✏️ Edit
            </button>
            <button
              className="btn btn-danger light-sweep"
              onClick={confirmDelete}
              aria-label={`Delete note ${note.title || 'Untitled'}`}
            >
              🗑️ Delete
            </button>
          </div>
        </>
      ) : (
        <div role="region" aria-label="Editing note" aria-live="assertive">
          <div className="input-group">
            <label htmlFor={`edit-title-${note.id}`} className="label">Title</label>
            <input
              id={`edit-title-${note.id}`}
              ref={titleInputRef}
              className="input"
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              aria-invalid={!!error && !draftTitle.trim() && !draftContent.trim()}
            />
            <label htmlFor={`edit-content-${note.id}`} className="label">Content</label>
            <textarea
              id={`edit-content-${note.id}`}
              className="textarea"
              rows={4}
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
            />
            {error ? (
              <div className="error-text" role="alert">{error}</div>
            ) : null}
          </div>
          <div className="divider" />
          <div className="actions">
            <button className="btn btn-primary light-sweep" onClick={save} aria-label="Save note">
              💾 Save
            </button>
            <button className="btn btn-ghost light-sweep" onClick={cancel} aria-label="Cancel editing">
              Cancel
            </button>
            <button className="btn btn-danger light-sweep" onClick={confirmDelete} aria-label="Delete note">
              🗑️ Delete
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
