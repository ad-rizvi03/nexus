import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NoteService, Note, NoteRequest, SavedResource, SavedResourceRequest, ResourceType } from '../../core/services/note.service';
import { TaskService, Category } from '../../core/services/task.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="notes-page-container">
      <!-- Top Navigation Tabs Bar -->
      <header class="notes-topbar">
        <div class="tab-switcher">
          <button
            type="button"
            class="tab-btn"
            [class.active]="activeTab() === 'notes'"
            (click)="activeTab.set('notes')"
          >
            <span class="tab-icon">📝</span>
            <span class="tab-title">KNOWLEDGE NOTES</span>
            <span class="tab-badge font-mono">{{ notes().length }}</span>
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.active]="activeTab() === 'resources'"
            (click)="activeTab.set('resources')"
          >
            <span class="tab-icon">🔖</span>
            <span class="tab-title">SAVED RESOURCES</span>
            <span class="tab-badge font-mono">{{ resources().length }}</span>
          </button>
        </div>

        <div class="topbar-actions font-mono">
          @if (activeTab() === 'notes') {
            <span class="sync-status" [class.syncing]="isSaving()">
              {{ isSaving() ? '● SAVING...' : '✓ ALL CHANGES SAVED' }}
            </span>
          }
        </div>
      </header>

      <!-- TAB 1: NOTES & KNOWLEDGE BASE -->
      @if (activeTab() === 'notes') {
        <div class="notes-workspace">
          <!-- Sidebar: List & Search -->
          <aside class="notes-sidebar">
            <div class="sidebar-header">
              <div class="search-box">
                <span class="search-icon">🔍</span>
                <input
                  type="text"
                  class="search-input font-mono"
                  placeholder="Search notes, tags, content..."
                  [ngModel]="searchQuery()"
                  (ngModelChange)="onSearchChange($event)"
                />
                @if (searchQuery()) {
                  <button type="button" class="clear-btn" (click)="onSearchChange('')">✕</button>
                }
              </div>

              <!-- Category filter -->
              <div class="filter-row">
                <select
                  class="category-select font-mono"
                  [ngModel]="selectedCategoryFilter()"
                  (ngModelChange)="onCategoryFilterChange($event)"
                >
                  <option value="">ALL CATEGORIES ({{ notes().length }})</option>
                  @for (cat of categories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                </select>

                <button type="button" class="btn btn-primary btn-sm new-note-btn font-mono" (click)="createNewNote()">
                  + NOTE
                </button>
              </div>
            </div>

            <!-- Notes List -->
            <div class="notes-list-scroll">
              @if (filteredNotes().length === 0) {
                <div class="empty-list text-muted font-mono">
                  <span>No notes found</span>
                  @if (searchQuery() || selectedCategoryFilter()) {
                    <button type="button" class="btn btn-secondary btn-sm mt-2" (click)="clearFilters()">
                      Reset Filters
                    </button>
                  }
                </div>
              } @else {
                @for (note of filteredNotes(); track note.id) {
                  <div
                    class="note-card"
                    [class.selected]="selectedNote()?.id === note.id"
                    (click)="selectNote(note)"
                  >
                    <div class="card-top">
                      <div class="title-row">
                        @if (note.isPinned) {
                          <span class="pin-indicator" title="Pinned Note">📌</span>
                        }
                        <span class="note-card-title">{{ note.title || 'Untitled Note' }}</span>
                      </div>
                      <button
                        type="button"
                        class="pin-toggle-btn"
                        [class.pinned]="note.isPinned"
                        (click)="togglePin($event, note)"
                        title="Toggle Pin"
                      >
                        {{ note.isPinned ? '★' : '☆' }}
                      </button>
                    </div>

                    <p class="note-snippet">{{ getSnippet(note.content) }}</p>

                    <div class="card-meta">
                      @if (note.categoryName) {
                        <span
                          class="category-tag"
                          [style.borderColor]="note.categoryColor || 'var(--accent-gold)'"
                          [style.color]="note.categoryColor || 'var(--accent-gold)'"
                        >
                          {{ note.categoryName }}
                        </span>
                      }
                      @for (t of note.tags.slice(0, 2); track t) {
                        <span class="mini-tag font-mono">#{{ t }}</span>
                      }
                      <span class="note-date font-mono">{{ formatDate(note.updatedAt) }}</span>
                    </div>
                  </div>
                }
              }
            </div>
          </aside>

          <!-- Main Note View / Editor Area -->
          <main class="note-main-pane">
            @if (selectedNote(); as note) {
              <!-- Note Top Bar Controls -->
              <div class="editor-action-bar">
                <div class="note-title-container">
                  <input
                    type="text"
                    class="main-note-title"
                    [(ngModel)]="note.title"
                    (ngModelChange)="onNoteContentChanged()"
                    placeholder="Enter Note Title..."
                  />
                </div>

                <div class="editor-controls-row">
                  <!-- Category Picker -->
                  <div class="control-group">
                    <span class="control-label font-mono">CATEGORY:</span>
                    <select
                      class="control-select font-mono"
                      [(ngModel)]="note.categoryId"
                      (ngModelChange)="onCategorySelected($event)"
                    >
                      <option [ngValue]="null">None</option>
                      @for (cat of categories(); track cat.id) {
                        <option [ngValue]="cat.id">{{ cat.name }}</option>
                      }
                    </select>
                  </div>

                  <!-- View Mode Switcher -->
                  <div class="view-mode-toggle font-mono">
                    <button
                      type="button"
                      [class.active]="viewMode() === 'edit'"
                      (click)="viewMode.set('edit')"
                    >
                      EDIT
                    </button>
                    <button
                      type="button"
                      [class.active]="viewMode() === 'split'"
                      (click)="viewMode.set('split')"
                    >
                      SPLIT
                    </button>
                    <button
                      type="button"
                      [class.active]="viewMode() === 'preview'"
                      (click)="viewMode.set('preview')"
                    >
                      PREVIEW
                    </button>
                  </div>

                  <!-- Pin Toggle -->
                  <button
                    type="button"
                    class="btn btn-secondary btn-sm font-mono"
                    [class.btn-active-gold]="note.isPinned"
                    (click)="toggleCurrentNotePin()"
                  >
                    {{ note.isPinned ? '📌 PINNED' : 'PIN NOTE' }}
                  </button>

                  <!-- Delete Note -->
                  <button
                    type="button"
                    class="btn btn-danger-ghost btn-sm font-mono"
                    (click)="deleteCurrentNote()"
                    title="Delete Note"
                  >
                    DELETE
                  </button>
                </div>

                <!-- Tags Manager Bar -->
                <div class="tags-manager-bar font-mono">
                  <span class="tags-label">TAGS:</span>
                  @for (tag of note.tags; track tag) {
                    <span class="tag-chip">
                      #{{ tag }}
                      <button type="button" class="tag-remove" (click)="removeTag(tag)">✕</button>
                    </span>
                  }
                  <div class="add-tag-wrapper">
                    <input
                      type="text"
                      class="tag-input"
                      placeholder="+ add tag (Enter)"
                      [(ngModel)]="newTagInput"
                      (keydown.enter)="addTag()"
                    />
                  </div>
                </div>
              </div>

              <!-- Note Content Workspace (Edit, Preview, Split) -->
              <div class="editor-content-viewport" [class.mode-split]="viewMode() === 'split'">
                @if (viewMode() === 'edit' || viewMode() === 'split') {
                  <div class="editor-half">
                    <textarea
                      class="markdown-editor font-mono"
                      [(ngModel)]="note.content"
                      (ngModelChange)="onNoteContentChanged()"
                      placeholder="Write markdown here... Supports # Headers, - Bullet lists, code blocks, > Quotes, **Bold**"
                    ></textarea>
                  </div>
                }

                @if (viewMode() === 'preview' || viewMode() === 'split') {
                  <div class="preview-half">
                    <div class="markdown-rendered" [innerHTML]="renderedMarkdown()"></div>
                  </div>
                }
              </div>
            } @else {
              <!-- Empty State -->
              <div class="empty-note-state">
                <div class="empty-icon font-mono">📝</div>
                <h3 class="font-sans">No Note Selected</h3>
                <p class="text-muted font-mono">Select a knowledge document from the list or create a new entry.</p>
                <button type="button" class="btn btn-primary font-mono mt-3" (click)="createNewNote()">
                  + CREATE NEW NOTE
                </button>
              </div>
            }
          </main>
        </div>
      }

      <!-- TAB 2: SAVED RESOURCES & BOOKMARKS -->
      @if (activeTab() === 'resources') {
        <div class="resources-workspace">
          <!-- Filter & Action Header -->
          <div class="resources-controls">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input
                type="text"
                class="search-input font-mono"
                placeholder="Search bookmarks, repos, articles, URLs..."
                [ngModel]="resourceQuery()"
                (ngModelChange)="onResourceSearchChange($event)"
              />
              @if (resourceQuery()) {
                <button type="button" class="clear-btn" (click)="onResourceSearchChange('')">✕</button>
              }
            </div>

            <!-- Resource Type Filter Pills -->
            <div class="type-filter-pills font-mono">
              @for (t of resourceTypes; track t) {
                <button
                  type="button"
                  class="type-pill"
                  [class.active]="selectedResourceType() === t"
                  (click)="filterResourceType(t)"
                >
                  {{ t }}
                </button>
              }
            </div>

            <button type="button" class="btn btn-primary font-mono" (click)="openAddResourceModal()">
              + ADD RESOURCE
            </button>
          </div>

          <!-- Resources Grid -->
          <div class="resources-grid">
            @if (filteredResources().length === 0) {
              <div class="empty-resources-state text-muted font-mono">
                <span>No saved resources found matching criteria.</span>
                <button type="button" class="btn btn-secondary btn-sm mt-3" (click)="openAddResourceModal()">
                  + Save Your First Bookmark
                </button>
              </div>
            } @else {
              @for (item of filteredResources(); track item.id) {
                <div class="resource-card">
                  <div class="resource-card-header">
                    <span class="type-badge font-mono" [attr.data-type]="item.resourceType">
                      {{ item.resourceType }}
                    </span>
                    <div class="resource-card-actions">
                      <button
                        type="button"
                        class="action-icon-btn"
                        (click)="editResource(item)"
                        title="Edit Resource"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        class="action-icon-btn danger"
                        (click)="deleteResource(item.id)"
                        title="Delete Resource"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <h4 class="resource-title">{{ item.title }}</h4>

                  <p class="resource-desc">{{ item.description || 'No description provided.' }}</p>

                  <div class="resource-card-footer">
                    @if (item.url) {
                      <a [href]="item.url" target="_blank" rel="noopener noreferrer" class="resource-link font-mono">
                        <span>OPEN RESOURCE</span>
                        <span class="external-icon">↗</span>
                      </a>
                    } @else {
                      <span class="text-muted font-mono text-xs">NO URL SPECIFIED</span>
                    }
                    <span class="resource-date font-mono text-xs text-muted">{{ formatDate(item.createdAt) }}</span>
                  </div>
                </div>
              }
            }
          </div>
        </div>
      }

      <!-- MODAL: ADD / EDIT RESOURCE -->
      @if (showResourceModal()) {
        <div class="modal-backdrop">
          <div class="modal-dialog">
            <div class="modal-header">
              <h3 class="font-sans">{{ editingResourceId() ? 'EDIT RESOURCE' : 'NEW SAVED RESOURCE' }}</h3>
              <button type="button" class="close-btn" (click)="closeResourceModal()">✕</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label font-mono">TITLE *</label>
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="resourceForm.title"
                  placeholder="e.g. Distributed Consensus in Raft"
                />
              </div>

              <div class="form-group">
                <label class="form-label font-mono">RESOURCE TYPE</label>
                <select class="form-input font-mono" [(ngModel)]="resourceForm.resourceType">
                  <option value="ARTICLE">ARTICLE</option>
                  <option value="VIDEO">VIDEO</option>
                  <option value="REPO">REPO</option>
                  <option value="SNIPPET">SNIPPET</option>
                  <option value="BOOK">BOOK</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label font-mono">URL / LINK</label>
                <input
                  type="url"
                  class="form-input font-mono"
                  [(ngModel)]="resourceForm.url"
                  placeholder="https://..."
                />
              </div>

              <div class="form-group">
                <label class="form-label font-mono">DESCRIPTION & KEY TAKEAWAYS</label>
                <textarea
                  class="form-textarea"
                  rows="4"
                  [(ngModel)]="resourceForm.description"
                  placeholder="Summarize key architectural insights, commands, or reference notes..."
                ></textarea>
              </div>
            </div>

            <div class="modal-footer font-mono">
              <button type="button" class="btn btn-secondary" (click)="closeResourceModal()">CANCEL</button>
              <button
                type="button"
                class="btn btn-primary"
                [disabled]="!resourceForm.title.trim()"
                (click)="saveResource()"
              >
                SAVE RESOURCE
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .notes-page-container {
      display: flex;
      flex-direction: column;
      height: calc(100vh - var(--topbar-height));
      background: var(--bg-base);
      color: var(--text-primary);
      overflow: hidden;
    }

    /* TOPBAR TABS */
    .notes-topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 20px;
      height: 48px;
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-main);
      flex-shrink: 0;
    }
    .tab-switcher {
      display: flex;
      gap: 6px;
      height: 100%;
    }
    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 16px;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 600;
      transition: all var(--transition-fast);
      &:hover {
        color: var(--text-primary);
        background: rgba(255, 255, 255, 0.02);
      }
      &.active {
        color: var(--accent-gold);
        border-bottom-color: var(--accent-gold);
        background: rgba(198, 165, 106, 0.05);
      }
    }
    .tab-badge {
      background: var(--bg-surface-elevated);
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      font-size: 0.7rem;
      color: var(--text-secondary);
    }
    .topbar-actions {
      font-size: 0.72rem;
    }
    .sync-status {
      color: #10B981;
      &.syncing {
        color: var(--accent-gold);
      }
    }

    /* NOTES WORKSPACE */
    .notes-workspace {
      display: grid;
      grid-template-columns: 360px 1fr;
      flex: 1;
      overflow: hidden;
    }

    /* SIDEBAR */
    .notes-sidebar {
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border-main);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .sidebar-header {
      padding: 14px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0 10px;
      &:focus-within {
        border-color: var(--accent-gold);
      }
    }
    .search-icon {
      font-size: 0.8rem;
      opacity: 0.5;
    }
    .search-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      padding: 8px 8px;
      color: var(--text-primary);
      font-size: 0.78rem;
    }
    .clear-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.75rem;
      &:hover { color: var(--text-primary); }
    }
    .filter-row {
      display: flex;
      gap: 8px;
    }
    .category-select {
      flex: 1;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      padding: 6px 8px;
      font-size: 0.72rem;
      outline: none;
      &:focus { border-color: var(--accent-gold); }
    }
    .new-note-btn {
      padding: 6px 12px;
      font-size: 0.72rem;
      white-space: nowrap;
    }

    /* NOTES LIST SCROLL */
    .notes-list-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .empty-list {
      text-align: center;
      padding: 30px 10px;
      font-size: 0.8rem;
    }
    .note-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 12px 14px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: all var(--transition-fast);
      &:hover {
        background: var(--bg-surface-elevated);
        border-color: var(--border-main);
      }
      &.selected {
        background: rgba(198, 165, 106, 0.08);
        border-color: var(--accent-gold);
      }
    }
    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 6px;
    }
    .title-row {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
      overflow: hidden;
    }
    .pin-indicator {
      font-size: 0.75rem;
    }
    .note-card-title {
      font-weight: 600;
      font-size: 0.88rem;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pin-toggle-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.95rem;
      padding: 0 4px;
      &:hover { color: var(--accent-gold); }
      &.pinned { color: var(--accent-gold); }
    }
    .note-snippet {
      font-size: 0.75rem;
      color: var(--text-muted);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin: 0;
    }
    .card-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
      font-size: 0.65rem;
    }
    .category-tag {
      border: 1px solid var(--accent-gold);
      padding: 1px 6px;
      border-radius: var(--radius-sm);
      font-weight: 500;
    }
    .mini-tag {
      background: rgba(255, 255, 255, 0.04);
      padding: 1px 5px;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
    }
    .note-date {
      margin-left: auto;
      color: var(--text-muted);
    }

    /* MAIN NOTE PANE */
    .note-main-pane {
      background: var(--bg-card);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .editor-action-bar {
      padding: 18px 24px 12px 24px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: var(--bg-surface);
    }
    .main-note-title {
      width: 100%;
      background: transparent;
      border: none;
      outline: none;
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--text-primary);
      border-bottom: 1px solid transparent;
      padding-bottom: 4px;
      &:focus {
        border-bottom-color: var(--accent-gold);
      }
    }
    .editor-controls-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 14px;
    }
    .control-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .control-label {
      font-size: 0.68rem;
      color: var(--text-muted);
    }
    .control-select {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      color: var(--text-primary);
      padding: 4px 8px;
      border-radius: var(--radius-sm);
      font-size: 0.72rem;
      outline: none;
      &:focus { border-color: var(--accent-gold); }
    }
    .view-mode-toggle {
      display: flex;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      overflow: hidden;
      button {
        background: var(--bg-card);
        border: none;
        padding: 4px 10px;
        color: var(--text-muted);
        font-size: 0.68rem;
        cursor: pointer;
        &:hover { color: var(--text-primary); }
        &.active {
          background: var(--accent-gold);
          color: #000;
          font-weight: 600;
        }
      }
    }
    .btn-active-gold {
      background: rgba(198, 165, 106, 0.2);
      border-color: var(--accent-gold);
      color: var(--accent-gold);
    }
    .btn-danger-ghost {
      background: transparent;
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #EF4444;
      border-radius: var(--radius-sm);
      padding: 4px 10px;
      cursor: pointer;
      &:hover {
        background: rgba(239, 68, 68, 0.1);
      }
    }

    .tags-manager-bar {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 0.72rem;
    }
    .tags-label {
      color: var(--text-muted);
      font-size: 0.68rem;
    }
    .tag-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(198, 165, 106, 0.1);
      border: 1px solid rgba(198, 165, 106, 0.3);
      color: var(--accent-gold);
      padding: 2px 8px;
      border-radius: var(--radius-sm);
    }
    .tag-remove {
      background: transparent;
      border: none;
      color: var(--accent-gold);
      cursor: pointer;
      font-size: 0.7rem;
      padding: 0;
      line-height: 1;
      opacity: 0.7;
      &:hover { opacity: 1; }
    }
    .tag-input {
      background: transparent;
      border: 1px dashed var(--border-subtle);
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      padding: 2px 8px;
      font-size: 0.7rem;
      outline: none;
      width: 130px;
      &:focus {
        border-color: var(--accent-gold);
        color: var(--text-primary);
      }
    }

    /* EDITOR & PREVIEW VIEWPORT */
    .editor-content-viewport {
      display: flex;
      flex: 1;
      overflow: hidden;
      &.mode-split {
        .editor-half {
          width: 50%;
          border-right: 1px solid var(--border-subtle);
        }
        .preview-half {
          width: 50%;
        }
      }
    }
    .editor-half, .preview-half {
      flex: 1;
      height: 100%;
      overflow-y: auto;
    }
    .markdown-editor {
      width: 100%;
      height: 100%;
      background: var(--bg-card);
      border: none;
      outline: none;
      padding: 24px;
      color: var(--text-primary);
      font-size: 0.9rem;
      line-height: 1.6;
      resize: none;
      font-family: 'JetBrains Mono', monospace;
    }
    .preview-half {
      padding: 24px 30px;
      background: var(--bg-surface);
    }
    .markdown-rendered {
      color: var(--text-primary);
      line-height: 1.7;
      font-size: 0.92rem;
      ::ng-deep h1 { font-size: 1.5rem; margin-bottom: 14px; color: var(--accent-gold); border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px; }
      ::ng-deep h2 { font-size: 1.25rem; margin-top: 18px; margin-bottom: 10px; color: #FFF; }
      ::ng-deep h3 { font-size: 1.05rem; margin-top: 14px; margin-bottom: 8px; color: var(--text-primary); }
      ::ng-deep p { margin-bottom: 12px; }
      ::ng-deep ul, ::ng-deep ol { padding-left: 20px; margin-bottom: 12px; }
      ::ng-deep li { margin-bottom: 4px; }
      ::ng-deep code { background: rgba(255, 255, 255, 0.08); padding: 2px 6px; border-radius: 3px; font-family: 'JetBrains Mono', monospace; font-size: 0.85em; color: var(--accent-gold); }
      ::ng-deep pre { background: var(--bg-base); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 14px; overflow-x: auto; margin: 14px 0; code { background: transparent; padding: 0; color: #E2E8F0; } }
      ::ng-deep blockquote { border-left: 3px solid var(--accent-gold); margin: 12px 0; padding-left: 14px; color: var(--text-secondary); font-style: italic; }
      ::ng-deep a { color: var(--accent-gold); text-decoration: underline; }
    }

    /* EMPTY STATE */
    .empty-note-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      padding: 40px;
    }
    .empty-icon {
      font-size: 3rem;
      margin-bottom: 16px;
      opacity: 0.6;
    }

    /* RESOURCES WORKSPACE */
    .resources-workspace {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      padding: 24px;
      gap: 20px;
    }
    .resources-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 14px;
    }
    .type-filter-pills {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .type-pill {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 5px 12px;
      color: var(--text-muted);
      font-size: 0.72rem;
      cursor: pointer;
      transition: all var(--transition-fast);
      &:hover { color: var(--text-primary); }
      &.active {
        background: var(--accent-gold);
        color: #000;
        font-weight: 600;
        border-color: var(--accent-gold);
      }
    }
    .resources-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }
    .empty-resources-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 60px 20px;
      background: var(--bg-card);
      border: 1px dashed var(--border-subtle);
      border-radius: var(--radius-md);
    }
    .resource-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: all var(--transition-fast);
      &:hover {
        background: var(--bg-surface-elevated);
        border-color: var(--border-main);
        transform: translateY(-2px);
      }
    }
    .resource-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .type-badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      &[data-type="ARTICLE"] { background: rgba(56, 189, 248, 0.15); color: #38BDF8; border: 1px solid rgba(56, 189, 248, 0.4); }
      &[data-type="VIDEO"] { background: rgba(248, 113, 113, 0.15); color: #F87171; border: 1px solid rgba(248, 113, 113, 0.4); }
      &[data-type="REPO"] { background: rgba(52, 211, 153, 0.15); color: #34D399; border: 1px solid rgba(52, 211, 153, 0.4); }
      &[data-type="BOOK"] { background: rgba(251, 191, 36, 0.15); color: #FBBF24; border: 1px solid rgba(251, 191, 36, 0.4); }
      &[data-type="SNIPPET"] { background: rgba(167, 139, 250, 0.15); color: #A78BFA; border: 1px solid rgba(167, 139, 250, 0.4); }
    }
    .resource-card-actions {
      display: flex;
      gap: 4px;
    }
    .action-icon-btn {
      background: transparent;
      border: none;
      font-size: 0.8rem;
      cursor: pointer;
      opacity: 0.6;
      transition: opacity var(--transition-fast);
      &:hover { opacity: 1; }
      &.danger:hover { color: #EF4444; }
    }
    .resource-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }
    .resource-desc {
      font-size: 0.8rem;
      color: var(--text-muted);
      line-height: 1.5;
      margin: 0;
      flex: 1;
    }
    .resource-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 6px;
      padding-top: 10px;
      border-top: 1px solid var(--border-subtle);
    }
    .resource-link {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.72rem;
      color: var(--accent-gold);
      text-decoration: none;
      font-weight: 600;
      &:hover { text-decoration: underline; }
    }
    .external-icon {
      font-size: 0.85rem;
    }

    /* MODAL */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }
    .modal-dialog {
      background: var(--bg-surface);
      border: 1px solid var(--border-main);
      border-radius: var(--radius-lg);
      width: 500px;
      max-width: 90vw;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
      display: flex;
      flex-direction: column;
    }
    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
      h3 { margin: 0; font-size: 1.1rem; color: var(--accent-gold); }
    }
    .close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1.1rem;
      &:hover { color: var(--text-primary); }
    }
    .modal-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-label {
      font-size: 0.7rem;
      color: var(--text-muted);
      letter-spacing: 0.5px;
    }
    .form-input, .form-textarea {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      padding: 8px 12px;
      font-size: 0.85rem;
      outline: none;
      &:focus { border-color: var(--accent-gold); }
    }
    .form-textarea {
      resize: vertical;
      font-family: inherit;
    }
    .modal-footer {
      padding: 14px 20px;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  `]
})
export class NotesComponent implements OnInit {
  private readonly noteService = inject(NoteService);
  private readonly taskService = inject(TaskService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toastService = inject(ToastService);

  readonly activeTab = signal<'notes' | 'resources'>('notes');
  readonly viewMode = signal<'edit' | 'split' | 'preview'>('split');

  // Notes state
  readonly notes = signal<Note[]>([]);
  readonly selectedNote = signal<Note | null>(null);
  readonly searchQuery = signal<string>('');
  readonly selectedCategoryFilter = signal<string>('');
  readonly categories = signal<Category[]>([]);
  readonly isSaving = signal<boolean>(false);
  newTagInput = '';

  // Resources state
  readonly resources = signal<SavedResource[]>([]);
  readonly resourceQuery = signal<string>('');
  readonly selectedResourceType = signal<string>('ALL');
  readonly resourceTypes = ['ALL', 'ARTICLE', 'VIDEO', 'REPO', 'SNIPPET', 'BOOK'];

  // Modal state
  readonly showResourceModal = signal<boolean>(false);
  readonly editingResourceId = signal<string | null>(null);
  resourceForm: SavedResourceRequest = {
    title: '',
    url: '',
    description: '',
    resourceType: 'ARTICLE'
  };

  private autoSaveTimer: any = null;

  readonly filteredNotes = computed(() => {
    let list = this.notes();
    const query = this.searchQuery().toLowerCase().trim();
    const catId = this.selectedCategoryFilter();

    if (catId) {
      list = list.filter(n => n.categoryId === catId);
    }
    if (query) {
      list = list.filter(n =>
        n.title.toLowerCase().includes(query) ||
        (n.content && n.content.toLowerCase().includes(query)) ||
        n.tags.some(t => t.toLowerCase().includes(query))
      );
    }
    return list;
  });

  readonly filteredResources = computed(() => {
    let list = this.resources();
    const query = this.resourceQuery().toLowerCase().trim();
    const type = this.selectedResourceType();

    if (type !== 'ALL') {
      list = list.filter(r => r.resourceType === type);
    }
    if (query) {
      list = list.filter(r =>
        r.title.toLowerCase().includes(query) ||
        (r.description && r.description.toLowerCase().includes(query)) ||
        (r.url && r.url.toLowerCase().includes(query))
      );
    }
    return list;
  });

  readonly renderedMarkdown = computed<SafeHtml>(() => {
    const note = this.selectedNote();
    if (!note || !note.content) return '';
    return this.sanitizer.bypassSecurityTrustHtml(this.parseSimpleMarkdown(note.content));
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadNotes();
    this.loadResources();
  }

  loadCategories(): void {
    this.taskService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  loadNotes(): void {
    this.noteService.getNotes().subscribe({
      next: (list) => {
        this.notes.set(list);
        if (list.length > 0 && !this.selectedNote()) {
          this.selectedNote.set({ ...list[0] });
        }
      },
      error: (err) => console.error('Failed to load notes', err)
    });
  }

  loadResources(): void {
    this.noteService.getResources().subscribe({
      next: (list) => this.resources.set(list),
      error: (err) => console.error('Failed to load resources', err)
    });
  }

  selectNote(note: Note): void {
    this.selectedNote.set({ ...note });
  }

  onSearchChange(val: string): void {
    this.searchQuery.set(val);
  }

  onCategoryFilterChange(catId: string): void {
    this.selectedCategoryFilter.set(catId);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategoryFilter.set('');
  }

  createNewNote(): void {
    const defaultCat = this.categories().length > 0 ? this.categories()[0].id : null;
    const req: NoteRequest = {
      title: 'New Knowledge Note',
      content: '# New Entry\n\nStart documenting architecture, design decisions, or concepts...',
      categoryId: defaultCat,
      isPinned: false,
      tags: ['draft']
    };

    this.noteService.createNote(req).subscribe({
      next: (created) => {
        this.notes.update(prev => [created, ...prev]);
        this.selectedNote.set({ ...created });
      },
      error: (err) => console.error('Failed to create note', err)
    });
  }

  onCategorySelected(catId: string | null): void {
    const note = this.selectedNote();
    if (!note) return;
    const foundCat = this.categories().find(c => c.id === catId);
    note.categoryId = catId;
    note.categoryName = foundCat ? foundCat.name : null;
    note.categoryColor = foundCat ? foundCat.color || null : null;
    this.triggerAutoSave();
  }

  onNoteContentChanged(): void {
    this.triggerAutoSave();
  }

  triggerAutoSave(): void {
    this.isSaving.set(true);
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    this.autoSaveTimer = setTimeout(() => {
      this.saveSelectedNote();
    }, 600);
  }

  saveSelectedNote(): void {
    const note = this.selectedNote();
    if (!note) return;

    const req: NoteRequest = {
      title: note.title,
      content: note.content,
      categoryId: note.categoryId,
      taskId: note.taskId,
      learningTopicId: note.learningTopicId,
      goalId: note.goalId,
      isPinned: note.isPinned,
      tags: note.tags
    };

    this.noteService.updateNote(note.id, req).subscribe({
      next: (updated) => {
        this.isSaving.set(false);
        this.notes.update(prev => prev.map(n => n.id === updated.id ? updated : n));
      },
      error: (err) => {
        this.isSaving.set(false);
        console.error('Failed to update note', err);
      }
    });
  }

  togglePin(event: MouseEvent, note: Note): void {
    event.stopPropagation();
    this.noteService.togglePin(note.id).subscribe({
      next: (updated) => {
        this.notes.update(prev => prev.map(n => n.id === updated.id ? updated : n));
        if (this.selectedNote()?.id === updated.id) {
          this.selectedNote.update(current => current ? { ...current, isPinned: updated.isPinned } : null);
        }
      },
      error: (err) => console.error('Failed to toggle pin', err)
    });
  }

  toggleCurrentNotePin(): void {
    const note = this.selectedNote();
    if (!note) return;
    this.noteService.togglePin(note.id).subscribe({
      next: (updated) => {
        this.notes.update(prev => prev.map(n => n.id === updated.id ? updated : n));
        this.selectedNote.set({ ...updated });
      },
      error: (err) => console.error('Failed to toggle pin', err)
    });
  }

  async deleteCurrentNote(): Promise<void> {
    const note = this.selectedNote();
    if (!note) return;

    const ok = await this.confirmDialog.confirm({
      title: 'DELETE NOTE',
      message: `Permanently delete note "${note.title}"? This cannot be undone.`,
      isDestructive: true,
      confirmText: 'DELETE NOTE'
    });
    if (!ok) return;

    this.noteService.deleteNote(note.id).subscribe({
      next: () => {
        this.notes.update(prev => prev.filter(n => n.id !== note.id));
        const remaining = this.notes();
        this.selectedNote.set(remaining.length > 0 ? { ...remaining[0] } : null);
        this.toastService.success(`Note "${note.title}" was deleted.`, 'NOTE REMOVED');
      },
      error: (err) => {
        console.error('Failed to delete note', err);
        this.toastService.error('Failed to delete note.');
      }
    });
  }

  addTag(): void {
    const tag = this.newTagInput.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const note = this.selectedNote();
    if (tag && note && !note.tags.includes(tag)) {
      note.tags.push(tag);
      this.newTagInput = '';
      this.triggerAutoSave();
    }
  }

  removeTag(tagToRemove: string): void {
    const note = this.selectedNote();
    if (!note) return;
    note.tags = note.tags.filter(t => t !== tagToRemove);
    this.triggerAutoSave();
  }

  // ================= RESOURCES =================

  onResourceSearchChange(val: string): void {
    this.resourceQuery.set(val);
  }

  filterResourceType(type: string): void {
    this.selectedResourceType.set(type);
  }

  openAddResourceModal(): void {
    this.editingResourceId.set(null);
    this.resourceForm = {
      title: '',
      url: '',
      description: '',
      resourceType: 'ARTICLE'
    };
    this.showResourceModal.set(true);
  }

  editResource(resource: SavedResource): void {
    this.editingResourceId.set(resource.id);
    this.resourceForm = {
      title: resource.title,
      url: resource.url,
      description: resource.description,
      resourceType: resource.resourceType,
      learningTopicId: resource.learningTopicId
    };
    this.showResourceModal.set(true);
  }

  closeResourceModal(): void {
    this.showResourceModal.set(false);
  }

  saveResource(): void {
    if (!this.resourceForm.title.trim()) return;

    const id = this.editingResourceId();
    if (id) {
      this.noteService.updateResource(id, this.resourceForm).subscribe({
        next: (updated) => {
          this.resources.update(prev => prev.map(r => r.id === updated.id ? updated : r));
          this.closeResourceModal();
        },
        error: (err) => console.error('Failed to update resource', err)
      });
    } else {
      this.noteService.createResource(this.resourceForm).subscribe({
        next: (created) => {
          this.resources.update(prev => [created, ...prev]);
          this.closeResourceModal();
        },
        error: (err) => console.error('Failed to create resource', err)
      });
    }
  }

  async deleteResource(id: string): Promise<void> {
    const ok = await this.confirmDialog.confirm({
      title: 'REMOVE RESOURCE',
      message: 'Remove this saved resource from your knowledge bookmarks?',
      isDestructive: true,
      confirmText: 'REMOVE'
    });
    if (!ok) return;

    this.noteService.deleteResource(id).subscribe({
      next: () => {
        this.resources.update(prev => prev.filter(r => r.id !== id));
        this.toastService.success('Bookmark removed.', 'RESOURCE REMOVED');
      },
      error: (err) => {
        console.error('Failed to delete resource', err);
        this.toastService.error('Failed to delete resource bookmark.');
      }
    });
  }

  // ================= UTILITIES =================

  getSnippet(content: string | undefined): string {
    if (!content) return 'No additional text...';
    return content.replace(/[#*`_\[\]]/g, '').trim().slice(0, 90) + '...';
  }

  formatDate(isoString: string): string {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }

  private parseSimpleMarkdown(md: string): string {
    if (!md) return '';
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks ```code```
    html = html.replace(/```([a-zA-Z]*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Blockquotes
    html = html.replace(/^\&gt; (.*$)/gim, '<blockquote>$1</blockquote>');

    // Bold & Italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Line breaks / paragraphs
    html = html.replace(/\n\n/g, '<p></p>');
    html = html.replace(/\n/g, '<br/>');

    return html;
  }
}
