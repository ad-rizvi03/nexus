import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="notes-viewport">
      <div class="notes-sidebar">
        <div class="notes-header">
          <span class="eyebrow">KNOWLEDGE BASE</span>
          <button type="button" class="btn btn-primary btn-sm mt-2 w-full">+ NEW NOTE</button>
        </div>
        <div class="notes-list">
          @for (note of notes(); track note.id) {
            <div
              class="note-item"
              [class.active]="selectedNote().id === note.id"
              (click)="selectedNote.set(note)"
            >
              <div class="note-title">{{ note.title }}</div>
              <div class="note-preview text-muted">{{ note.preview }}</div>
              <div class="note-meta font-mono">
                <span>{{ note.category }}</span>
                <span>{{ note.date }}</span>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Note Editor View -->
      <div class="note-editor">
        @if (selectedNote(); as note) {
          <div class="editor-header">
            <input type="text" [(ngModel)]="note.title" class="editor-title font-sans" />
            <div class="editor-meta font-mono">
              <span class="badge badge-gold">{{ note.category }}</span>
              <span class="text-muted">UPDATED: {{ note.date }}</span>
            </div>
          </div>
          <div class="hairline"></div>
          <textarea [(ngModel)]="note.content" class="editor-body" placeholder="Write in Markdown..."></textarea>
        }
      </div>
    </div>
  `,
  styles: [`
    .notes-viewport {
      display: grid;
      grid-template-columns: 320px 1fr;
      height: calc(100vh - var(--topbar-height));
    }
    .notes-sidebar {
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border-main);
      display: flex;
      flex-direction: column;
    }
    .notes-header {
      padding: 18px;
      border-bottom: 1px solid var(--border-subtle);
    }
    .mt-2 { margin-top: 8px; }
    .w-full { width: 100%; }
    .notes-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .note-item {
      padding: 12px 14px;
      border-radius: var(--radius-md);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: background var(--transition-fast);
      &:hover { background: var(--bg-surface-elevated); }
      &.active {
        background: rgba(198, 165, 106, 0.08);
        border: 1px solid rgba(198, 165, 106, 0.3);
      }
      .note-title { font-size: 0.88rem; font-weight: 600; color: var(--text-primary); }
      .note-preview { font-size: 0.72rem; }
      .note-meta {
        display: flex;
        justify-content: space-between;
        font-size: 0.6rem;
        color: var(--text-muted);
        margin-top: 4px;
      }
    }
    .note-editor {
      display: flex;
      flex-direction: column;
      background: var(--bg-card);
      .editor-header {
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        .editor-title {
          background: transparent;
          border: none;
          outline: none;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .editor-meta { display: flex; gap: 12px; align-items: center; font-size: 0.68rem; }
      }
      .editor-body {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        padding: 24px;
        color: var(--text-primary);
        font-family: inherit;
        font-size: 0.95rem;
        line-height: 1.6;
        resize: none;
      }
    }
  `]
})
export class NotesComponent {
  readonly notes = signal([
    {
      id: '1',
      title: 'Spring Security 6+ & Stateless Session Architecture',
      preview: 'Notes on configuring SecurityFilterChain, SameSite cookies, and CORS origins...',
      category: 'Architecture',
      date: '2026-10-19',
      content: `### Spring Security 6+ Architecture Notes\n\n- Prefer server-managed HTTP-only sessions with strict cookie flags for local same-origin webapps.\n- Disable basic auth to prevent repetitive browser popups.\n- Register UrlBasedCorsConfigurationSource with exact origin \`http://localhost:4201\` and \`allowCredentials(true)\`.\n- Flyway migrations handle baseline and forward evolution.`
    },
    {
      id: '2',
      title: 'PostgreSQL Indexing & Optimization Patterns',
      preview: 'Composite indexes on (user_id, status) and (user_id, planned_date)...',
      category: 'Database',
      date: '2026-10-18',
      content: `### PostgreSQL Indexing Best Practices\n\n- Every tenant query must be indexed with \`user_id\` as the leading prefix.\n- Use partial indexes for active tasks: \`CREATE INDEX ... WHERE status != 'COMPLETED'\`.\n- Store timestamps as \`timestamptz\` in UTC to prevent calendar day shifting.`
    }
  ]);

  readonly selectedNote = signal(this.notes()[0]);
}
