import { Component, EventEmitter, OnInit, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService, Category, CreateTaskRequest } from '../../core/services/task.service';
import { NoteService, NoteRequest } from '../../core/services/note.service';
import { PlannerService, NaturalLanguageParsed } from '../../core/services/planner.service';
import { AiCopilotModalComponent, YouTubeRecommendation } from '../../shared/ai-copilot-modal/ai-copilot-modal.component';

@Component({
  selector: 'app-quick-capture',
  standalone: true,
  imports: [CommonModule, FormsModule, AiCopilotModalComponent],
  template: `
    <div class="capture-backdrop" (click)="close()">
      <div class="capture-modal card" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="capture-header">
          <div class="header-left">
            <span class="badge badge-gold font-mono">QUICK CAPTURE</span>
            <div class="capture-tabs font-mono">
              <button
                type="button"
                class="tab-btn"
                [class.active]="mode() === 'TASK'"
                (click)="mode.set('TASK')"
              >
                TASK
              </button>
              <button
                type="button"
                class="tab-btn"
                [class.active]="mode() === 'NOTE'"
                (click)="mode.set('NOTE')"
              >
                NOTE / IDEA
              </button>
            </div>
          </div>
          <button type="button" class="close-btn font-mono" (click)="close()" title="Close (ESC)">✕</button>
        </div>

        <!-- Success Toast Banner -->
        @if (successMessage()) {
          <div class="success-banner font-mono">
            <span>✓ {{ successMessage() }}</span>
          </div>
        }

        <!-- TASK CAPTURE -->
        @if (mode() === 'TASK') {
          <div class="capture-body">
            <!-- Natural Language Quick Bar -->
            <div class="nl-box">
              <div class="nl-label font-mono">
                <span>NATURAL LANGUAGE QUICK ENTRY</span>
                <span class="nl-hint">Type naturally then click parse</span>
              </div>
              <div class="nl-input-row">
                <input
                  type="text"
                  [(ngModel)]="nlInput"
                  (keyup.enter)="parseNaturalLanguage()"
                  class="form-input font-mono nl-input"
                  placeholder="e.g. Finish security audit tomorrow for 45m urgent"
                />
                <button
                  type="button"
                  class="btn btn-secondary btn-sm font-mono parse-btn"
                  [disabled]="!nlInput.trim() || parsing()"
                  (click)="parseNaturalLanguage()"
                >
                  {{ parsing() ? 'PARSING...' : '✨ PARSE' }}
                </button>
                <button
                  type="button"
                  class="btn btn-secondary btn-sm font-mono ai-btn"
                  (click)="openAiModal = true"
                  title="Ask AI to estimate time or recommend YouTube tutorials"
                >
                  ✨ ASK AI
                </button>
              </div>
              @if (parseExplanation()) {
                <div class="parse-feedback font-mono">
                  <span>🎯 {{ parseExplanation() }}</span>
                </div>
              }
            </div>

            <form (ngSubmit)="submitTask()" class="capture-form mt-3">
              <div class="form-group">
                <label class="form-label font-mono">TASK TITLE *</label>
                <input
                  type="text"
                  [(ngModel)]="taskForm.title"
                  name="title"
                  required
                  class="form-input"
                  placeholder="What outcome needs to be achieved?"
                  autofocus
                />
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label font-mono">CATEGORY</label>
                  <select [(ngModel)]="taskForm.categoryId" name="categoryId" class="form-select font-mono">
                    <option value="">(None)</option>
                    @for (cat of categories(); track cat.id) {
                      <option [value]="cat.id">{{ cat.name }}</option>
                    }
                  </select>
                </div>

                <div class="form-group flex-1">
                  <label class="form-label font-mono">DURATION (MIN)</label>
                  <input
                    type="number"
                    [(ngModel)]="taskForm.estimatedDurationMinutes"
                    name="duration"
                    class="form-input font-mono"
                    min="5"
                    step="5"
                  />
                </div>

                <div class="form-group flex-1">
                  <label class="form-label font-mono">PLANNED DATE</label>
                  <input
                    type="date"
                    [(ngModel)]="taskForm.plannedDate"
                    name="plannedDate"
                    class="form-input font-mono"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label font-mono">PRIORITY</label>
                <div class="priority-pills font-mono">
                  @for (p of priorities; track p) {
                    <button
                      type="button"
                      class="p-pill"
                      [class.active]="taskForm.priority === p"
                      [class]="p.toLowerCase()"
                      (click)="taskForm.priority = p"
                    >
                      {{ p }}
                    </button>
                  }
                </div>
              </div>

              <div class="modal-actions mt-4">
                <button type="button" class="btn btn-ghost btn-sm font-mono" (click)="close()">
                  CANCEL
                </button>
                <button
                  type="submit"
                  class="btn btn-primary btn-sm font-mono"
                  [disabled]="!taskForm.title.trim() || submitting()"
                >
                  {{ submitting() ? 'CAPTURING...' : '✓ CAPTURE TASK' }}
                </button>
              </div>
            </form>
          </div>
        }

        <!-- NOTE CAPTURE -->
        @if (mode() === 'NOTE') {
          <div class="capture-body">
            <form (ngSubmit)="submitNote()" class="capture-form">
              <div class="form-group">
                <label class="form-label font-mono">NOTE TITLE *</label>
                <input
                  type="text"
                  [(ngModel)]="noteForm.title"
                  name="noteTitle"
                  required
                  class="form-input"
                  placeholder="e.g. Architecture RFC notes, Key learning insights"
                  autofocus
                />
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label font-mono">CATEGORY</label>
                  <select [(ngModel)]="noteForm.categoryId" name="noteCategory" class="form-select font-mono">
                    <option [ngValue]="null">(None)</option>
                    @for (cat of categories(); track cat.id) {
                      <option [ngValue]="cat.id">{{ cat.name }}</option>
                    }
                  </select>
                </div>

                <div class="form-group flex-1">
                  <label class="form-label font-mono">TAGS (COMMA SEPARATED)</label>
                  <input
                    type="text"
                    [(ngModel)]="noteTagsInput"
                    name="tags"
                    class="form-input font-mono"
                    placeholder="spring, devops, database"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label font-mono">CONTENT (MARKDOWN)</label>
                <textarea
                  [(ngModel)]="noteForm.content"
                  name="content"
                  rows="5"
                  class="form-textarea font-sans"
                  placeholder="Record your thoughts, code snippets, or notes..."
                ></textarea>
              </div>

              <div class="modal-actions mt-4">
                <button type="button" class="btn btn-ghost btn-sm font-mono" (click)="close()">
                  CANCEL
                </button>
                <button
                  type="submit"
                  class="btn btn-primary btn-sm font-mono"
                  [disabled]="!noteForm.title.trim() || submitting()"
                >
                  {{ submitting() ? 'SAVING...' : '✓ CAPTURE NOTE' }}
                </button>
              </div>
            </form>
          </div>
        }
      </div>

      <!-- AI Copilot Modal -->
      @if (openAiModal) {
        <app-ai-copilot-modal
          [contextType]="mode() === 'TASK' ? 'TASK' : 'GENERAL'"
          [initialSubject]="mode() === 'TASK' ? (taskForm.title || nlInput || 'Task') : (noteForm.title || 'Note')"
          (closeModal)="openAiModal = false"
          (applyDuration)="onAiApplyDuration($event)"
          (applySubtasks)="onAiApplySubtasks($event)"
          (bookmarkVideo)="onAiBookmarkVideo($event)"
        ></app-ai-copilot-modal>
      }
    </div>
  `,
  styles: [`
    .capture-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(11, 13, 16, 0.75);
      backdrop-filter: blur(4px);
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .capture-modal {
      width: 100%;
      max-width: 580px;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-main);
      border-radius: var(--radius-lg);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8), 0 0 1px rgba(198, 165, 106, 0.3);
      max-height: 90vh;
      overflow-y: auto;
    }
    .capture-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 12px;
      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .close-btn {
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 1.1rem;
        &:hover { color: var(--text-primary); }
      }
    }
    .capture-tabs {
      display: flex;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 2px;
      gap: 2px;
      .tab-btn {
        background: transparent;
        border: none;
        color: var(--text-muted);
        font-size: 0.65rem;
        letter-spacing: 0.1em;
        padding: 4px 10px;
        cursor: pointer;
        border-radius: var(--radius-xs);
        transition: all var(--transition-fast);
        &.active {
          background: var(--bg-surface-elevated);
          color: var(--accent-gold);
          font-weight: 600;
        }
      }
    }
    .success-banner {
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #10B981;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.72rem;
    }
    .nl-box {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      .nl-label {
        display: flex;
        justify-content: space-between;
        font-size: 0.62rem;
        color: var(--accent-gold);
        letter-spacing: 0.1em;
        .nl-hint { color: var(--text-muted); font-size: 0.58rem; }
      }
      .nl-input-row {
        display: flex;
        gap: 8px;
        .nl-input {
          flex: 1;
          font-size: 0.75rem;
          background: var(--bg-surface);
        }
      }
      .parse-feedback {
        font-size: 0.65rem;
        color: var(--accent-gold);
        padding-top: 4px;
      }
    }
    .capture-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      .form-row { display: flex; gap: 12px; }
      .flex-1 { flex: 1; }
      .form-textarea {
        width: 100%;
        background: var(--bg-surface);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-sm);
        padding: 8px 10px;
        color: var(--text-primary);
        font-size: 0.8rem;
        resize: vertical;
        outline: none;
        &:focus { border-color: var(--accent-gold); }
      }
    }
    .priority-pills {
      display: flex;
      gap: 8px;
      margin-top: 4px;
      .p-pill {
        flex: 1;
        background: var(--bg-card);
        border: 1px solid var(--border-subtle);
        color: var(--text-muted);
        padding: 6px;
        font-size: 0.65rem;
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all var(--transition-fast);
        &.active {
          color: #fff;
          font-weight: 700;
          &.low { background: #3B82F6; border-color: #3B82F6; }
          &.medium { background: var(--accent-gold); border-color: var(--accent-gold); color: #000; }
          &.high { background: #F59E0B; border-color: #F59E0B; }
          &.urgent { background: #EF4444; border-color: #EF4444; }
        }
      }
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      border-top: 1px solid var(--border-subtle);
      padding-top: 14px;
    }
  `]
})
export class QuickCaptureComponent implements OnInit {
  @Output() closeCapture = new EventEmitter<void>();
  @Output() itemCreated = new EventEmitter<{ type: 'TASK' | 'NOTE'; item: any }>();

  private readonly taskService = inject(TaskService);
  private readonly noteService = inject(NoteService);
  private readonly plannerService = inject(PlannerService);
  private readonly router = inject(Router);

  mode = signal<'TASK' | 'NOTE'>('TASK');
  categories = signal<Category[]>([]);
  submitting = signal(false);
  parsing = signal(false);
  successMessage = signal<string | null>(null);
  parseExplanation = signal<string | null>(null);

  readonly priorities: Array<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'> = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  nlInput = '';
  taskForm: CreateTaskRequest = {
    title: '',
    categoryId: '',
    priority: 'MEDIUM',
    status: 'TO_DO',
    estimatedDurationMinutes: 45,
    plannedDate: new Date().toISOString().substring(0, 10)
  };

  noteForm: NoteRequest = {
    title: '',
    content: '',
    categoryId: null
  };
  noteTagsInput = '';

  ngOnInit() {
    this.taskService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err: any) => console.error('Failed to load categories', err)
    });
  }

  parseNaturalLanguage() {
    if (!this.nlInput.trim()) return;
    this.parsing.set(true);
    this.plannerService.parseNaturalLanguage(this.nlInput.trim()).subscribe({
      next: (parsed: NaturalLanguageParsed) => {
        this.parsing.set(false);
        this.taskForm.title = parsed.title;
        if (parsed.plannedDate) this.taskForm.plannedDate = parsed.plannedDate;
        if (parsed.estimatedDurationMinutes) this.taskForm.estimatedDurationMinutes = parsed.estimatedDurationMinutes;
        if (parsed.priority) this.taskForm.priority = parsed.priority;
        this.parseExplanation.set(parsed.explanation);
      },
      error: (err: any) => {
        this.parsing.set(false);
        console.error('Failed to parse natural language entry', err);
      }
    });
  }

  submitTask() {
    if (!this.taskForm.title.trim()) return;
    this.submitting.set(true);

    const payload: CreateTaskRequest = {
      ...this.taskForm,
      categoryId: this.taskForm.categoryId || undefined,
      plannedDate: this.taskForm.plannedDate || undefined
    };

    this.taskService.createTask(payload).subscribe({
      next: (created) => {
        this.submitting.set(false);
        this.successMessage.set(`Task "${created.title}" captured successfully.`);
        this.itemCreated.emit({ type: 'TASK', item: created });
        setTimeout(() => {
          this.close();
          if (this.router.url === '/tasks') {
            window.location.reload();
          }
        }, 600);
      },
      error: (err: any) => {
        this.submitting.set(false);
        console.error('Failed to capture task', err);
      }
    });
  }

  submitNote() {
    if (!this.noteForm.title.trim()) return;
    this.submitting.set(true);

    const tags = this.noteTagsInput
      ? this.noteTagsInput.split(',').map(t => t.trim()).filter(Boolean)
      : undefined;

    const payload: NoteRequest = {
      ...this.noteForm,
      tags
    };

    this.noteService.createNote(payload).subscribe({
      next: (created) => {
        this.submitting.set(false);
        this.successMessage.set(`Note "${created.title}" saved successfully.`);
        this.itemCreated.emit({ type: 'NOTE', item: created });
        setTimeout(() => {
          this.close();
          if (this.router.url === '/notes') {
            window.location.reload();
          }
        }, 600);
      },
      error: (err: any) => {
        this.submitting.set(false);
        console.error('Failed to capture note', err);
      }
    });
  }

  openAiModal = false;

  onAiApplyDuration(minutes: number) {
    this.taskForm.estimatedDurationMinutes = minutes;
  }

  onAiApplySubtasks(subtasks: string[]) {
    const list = subtasks.map(s => `• ${s}`).join('\n');
    this.taskForm.description = this.taskForm.description
      ? `${this.taskForm.description}\n\nSubtasks:\n${list}`
      : `Subtasks:\n${list}`;
  }

  onAiBookmarkVideo(video: YouTubeRecommendation) {
    const note = `\n\n📌 Recommended Video: [${video.title}](${video.url}) (${video.channel} - ${video.duration})`;
    if (this.mode() === 'TASK') {
      this.taskForm.description = (this.taskForm.description || '') + note;
    } else {
      this.noteForm.content = (this.noteForm.content || '') + note;
    }
  }

  close() {
    this.closeCapture.emit();
  }
}
