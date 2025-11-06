import React from 'react';
import NoteItem from './NoteItem';

export default function NotesList({ notes, onUpdate, onDelete }) {
  if (!notes || notes.length === 0) {
    return <p className="note-meta" role="status">No notes yet. Add your first note above.</p>;
    }
  return (
    <div className="list-scroll" role="list" aria-label="Notes list">
      {notes.map((n) => (
        <div key={n.id} role="listitem" style={{ marginBottom: 12 }}>
          <NoteItem note={n} onUpdate={onUpdate} onDelete={onDelete} />
        </div>
      ))}
    </div>
  );
}
