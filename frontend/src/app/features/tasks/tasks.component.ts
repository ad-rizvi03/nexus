import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, TaskItem, Category, CreateTaskRequest, Subtask } from '../../core/services/task.service';
import { AiCopilotModalComponent, YouTubeRecommendation } from '../../shared/ai-copilot-modal/ai-copilot-modal.component';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, AiCopilotModalComponent],
  template: `
    <div class="tasks-viewport">
      <!-- Toolbar -->
      <div class="tasks-toolbar">
        <div class="toolbar-left">
          <span class="eyebrow">TASK MANAGEMENT CONSOLE</span>
          <h2 class="display-md">Tasks & Backlog</h2>
        </div>
        <div class="toolbar-right">
          <!-- View Toggle -->
          <div class="view-toggle font-mono">
            <button
              type="button"
              class="toggle-btn"
              [class.active]="viewMode() === 'LIST'"
              (click)="viewMode.set('LIST')"
              title="List View"
            >
              LIST
            </button>
            <button
              type="button"
              class="toggle-btn"
              [class.active]="viewMode() === 'KANBAN'"
              (click)="viewMode.set('KANBAN')"
              title="Kanban Board View"
            >
              KANBAN
            </button>
          </div>

          <!-- Search Input -->
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search tasks, categories..."
            class="form-input search-input font-mono"
          />

          <!-- AI Copilot Button -->
          <button type="button" class="btn btn-secondary btn-sm font-mono ai-badge-btn" (click)="openAiForNewTask()">
            ✨ AI COPILOT
          </button>

          <!-- Add Button -->
          <button type="button" class="btn btn-primary btn-sm" (click)="openCreateModal()">
            + NEW TASK
          </button>
        </div>
      </div>

      <!-- Filters Strip -->
      <div class="filter-strip">
        <div class="pill-group">
          @for (tab of filterTabs; track tab.id) {
            <button
              type="button"
              class="pill-btn font-mono"
              [class.active]="activeTab() === tab.id"
              (click)="activeTab.set(tab.id)"
            >
              {{ tab.label }}
              <span class="pill-count">{{ getTabCount(tab.id) }}</span>
            </button>
          }
        </div>

        <div class="category-filter">
          <select [(ngModel)]="selectedCategoryFilter" class="form-select font-mono category-select">
            <option value="">ALL CATEGORIES</option>
            @for (cat of categories(); track cat.id) {
              <option [value]="cat.id">{{ cat.name }}</option>
            }
          </select>
          <button type="button" class="btn btn-secondary btn-xs font-mono ml-2" (click)="openCategoryModal()" title="Manage Categories">
            ⚙ CATEGORIES
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-state font-mono">
          <div class="spinner"></div>
          <span>SYNCHRONIZING TASKS & SUBTASKS...</span>
        </div>
      } @else {
        <!-- LIST VIEW -->
        @if (viewMode() === 'LIST') {
          <div class="task-grid">
            @for (task of filteredTasks(); track task.id) {
              <div
                class="card card-interactive task-card"
                [class.done]="task.status === 'COMPLETED'"
                (click)="openDetailDrawer(task)"
              >
                <div class="card-top">
                  <span class="badge font-mono" [ngClass]="getPriorityBadgeClass(task.priority)">
                    {{ task.priority }}
                  </span>
                  @if (task.category) {
                    <span class="category-name font-mono" [style.color]="task.category.color || 'var(--accent-gold)'">
                      {{ task.category.name }}
                    </span>
                  }
                </div>

                <div class="card-body">
                  <h4 class="task-heading">{{ task.title }}</h4>
                  @if (task.description) {
                    <p class="task-desc">{{ task.description }}</p>
                  }
                </div>

                <!-- Subtask Summary -->
                @if (task.subtasks && task.subtasks.length > 0) {
                  <div class="subtask-progress font-mono">
                    <div class="progress-bar-sub">
                      <div class="progress-fill" [style.width.%]="getSubtaskPercent(task)"></div>
                    </div>
                    <span>{{ getCompletedSubtaskCount(task) }}/{{ task.subtasks.length }} SUBTASKS</span>
                  </div>
                }

                <div class="card-footer font-mono" (click)="$event.stopPropagation()">
                  <div class="footer-left">
                    <span>⏱ {{ task.estimatedDurationMinutes || 45 }}m</span>
                    @if (task.deadlineDate) {
                      <span class="deadline-tag text-warning">📅 {{ task.deadlineDate }}</span>
                    }
                  </div>
                  <select
                    [ngModel]="task.status"
                    (ngModelChange)="changeStatus(task, $event)"
                    class="status-select font-mono"
                  >
                    <option value="TO_DO">TO DO</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="BLOCKED">BLOCKED</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>
            }

            @if (filteredTasks().length === 0) {
              <div class="empty-state font-mono">
                <p>NO TASKS FOUND MATCHING CURRENT CRITERIA.</p>
                <button type="button" class="btn btn-ghost btn-sm mt-3" (click)="openCreateModal()">
                  + CREATE NEW TASK
                </button>
              </div>
            }
          </div>
        }

        <!-- KANBAN BOARD VIEW -->
        @if (viewMode() === 'KANBAN') {
          <div class="kanban-board">
            @for (column of kanbanColumns; track column.status) {
              <div class="kanban-column">
                <div class="column-header">
                  <span class="font-mono column-title">{{ column.title }}</span>
                  <span class="badge badge-neutral font-mono">{{ getColumnTasks(column.status).length }}</span>
                </div>

                <div class="column-cards">
                  @for (task of getColumnTasks(column.status); track task.id) {
                    <div class="card card-interactive kanban-card" (click)="openDetailDrawer(task)">
                      <div class="card-top">
                        <span class="badge font-mono" [ngClass]="getPriorityBadgeClass(task.priority)">
                          {{ task.priority }}
                        </span>
                        @if (task.category) {
                          <span class="category-name font-mono" [style.color]="task.category.color || 'var(--accent-gold)'">
                            {{ task.category.name }}
                          </span>
                        }
                      </div>

                      <h4 class="task-heading">{{ task.title }}</h4>

                      @if (task.subtasks && task.subtasks.length > 0) {
                        <div class="subtask-progress font-mono">
                          <span>✓ {{ getCompletedSubtaskCount(task) }}/{{ task.subtasks.length }}</span>
                        </div>
                      }

                      <div class="card-footer font-mono" (click)="$event.stopPropagation()">
                        <span>⏱ {{ task.estimatedDurationMinutes || 45 }}m</span>
                        <select
                          [ngModel]="task.status"
                          (ngModelChange)="changeStatus(task, $event)"
                          class="status-select font-mono"
                        >
                          <option value="TO_DO">TO DO</option>
                          <option value="IN_PROGRESS">IN PROGRESS</option>
                          <option value="BLOCKED">BLOCKED</option>
                          <option value="COMPLETED">COMPLETED</option>
                        </select>
                      </div>
                    </div>
                  }
                  @if (getColumnTasks(column.status).length === 0) {
                    <div class="column-empty font-mono">EMPTY</div>
                  }
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- Quick Add / Edit Task Modal -->
      @if (showNewTaskModal) {
        <div class="modal-backdrop" (click)="showNewTaskModal = false">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <span class="eyebrow">{{ editingTaskId ? 'EDIT TASK SPECIFICATION' : 'CAPTURE NEW TASK' }}</span>
              <div class="header-modal-actions">
                <button type="button" class="btn btn-secondary btn-xs font-mono ai-badge-btn" (click)="openAiForNewTask()">
                  ✨ ASK AI
                </button>
                <button type="button" class="close-btn font-mono" (click)="showNewTaskModal = false">✕</button>
              </div>
            </div>
            <form (ngSubmit)="saveTask()">
              <div class="form-group">
                <label class="form-label font-mono">TASK TITLE</label>
                <input
                  type="text"
                  [(ngModel)]="taskForm.title"
                  name="title"
                  required
                  class="form-input"
                  placeholder="e.g. Implement refresh tokens in Spring Security"
                  autofocus
                />
              </div>

              <div class="form-group">
                <label class="form-label font-mono">DESCRIPTION / ACCEPTANCE CRITERIA</label>
                <textarea
                  [(ngModel)]="taskForm.description"
                  name="description"
                  rows="2"
                  class="form-input"
                  placeholder="Additional context, implementation notes..."
                ></textarea>
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
                  <label class="form-label font-mono">PRIORITY</label>
                  <select [(ngModel)]="taskForm.priority" name="priority" class="form-select font-mono">
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
                <div class="form-group flex-1">
                  <div class="label-with-ai-link">
                    <label class="form-label font-mono">DURATION (MIN)</label>
                    <button type="button" class="ai-inline-btn font-mono" (click)="openAiForNewTask()">✨ AI</button>
                  </div>
                  <input
                    type="number"
                    [(ngModel)]="taskForm.estimatedDurationMinutes"
                    name="duration"
                    class="form-input font-mono"
                    min="5"
                    step="5"
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label font-mono">PLANNED DATE</label>
                  <input
                    type="date"
                    [(ngModel)]="taskForm.plannedDate"
                    name="plannedDate"
                    class="form-input font-mono"
                  />
                </div>
                <div class="form-group flex-1">
                  <label class="form-label font-mono">DEADLINE DATE</label>
                  <input
                    type="date"
                    [(ngModel)]="taskForm.deadlineDate"
                    name="deadlineDate"
                    class="form-input font-mono"
                  />
                </div>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-ghost btn-sm font-mono" (click)="showNewTaskModal = false">
                  CANCEL
                </button>
                <button type="submit" class="btn btn-primary btn-sm font-mono" [disabled]="submitting()">
                  {{ submitting() ? 'SAVING...' : (editingTaskId ? 'UPDATE TASK' : 'CREATE TASK') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Task Details & Subtasks Drawer -->
      @if (selectedTask(); as task) {
        <div class="drawer-backdrop" (click)="selectedTask.set(null)">
          <div class="drawer-panel" (click)="$event.stopPropagation()">
            <div class="drawer-header">
              <div class="drawer-title-group">
                <span class="badge font-mono" [ngClass]="getPriorityBadgeClass(task.priority)">
                  {{ task.priority }}
                </span>
                <span class="badge font-mono" [ngClass]="getStatusBadgeClass(task.status)">
                  {{ task.status }}
                </span>
              </div>
              <button type="button" class="close-btn font-mono" (click)="selectedTask.set(null)">✕</button>
            </div>

            <h3 class="drawer-heading">{{ task.title }}</h3>
            <div class="drawer-ai-deck mt-1 mb-2">
              <button type="button" class="btn btn-secondary btn-xs font-mono ai-badge-btn" (click)="openAiForSelectedTask(task)">
                ✨ AI TIME ESTIMATE & YOUTUBE RECOMMENDATIONS
              </button>
            </div>
            @if (task.description) {
              <p class="drawer-desc">{{ task.description }}</p>
            }

            <div class="drawer-meta font-mono">
              <div class="meta-row">
                <span class="meta-label">CATEGORY:</span>
                <span class="meta-val">{{ task.category?.name || 'Unassigned' }}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">DURATION:</span>
                <span class="meta-val">{{ task.estimatedDurationMinutes || 45 }} minutes</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">PLANNED:</span>
                <span class="meta-val">{{ task.plannedDate || 'Not scheduled' }}</span>
              </div>
              @if (task.deadlineDate) {
                <div class="meta-row">
                  <span class="meta-label text-warning">DEADLINE:</span>
                  <span class="meta-val text-warning">{{ task.deadlineDate }}</span>
                </div>
              }
            </div>

            <!-- Subtasks Section -->
            <div class="drawer-section">
              <div class="section-title-bar">
                <span class="eyebrow">SUBTASKS CHECKLIST</span>
                <span class="subtask-count font-mono">{{ getCompletedSubtaskCount(task) }}/{{ task.subtasks.length }}</span>
              </div>

              <!-- Subtasks List -->
              <div class="subtask-list">
                @for (sub of task.subtasks; track sub.id) {
                  <div class="subtask-row" [class.completed]="sub.completed">
                    <button type="button" class="subtask-check" (click)="toggleSubtask(task, sub)">
                      @if (sub.completed) { <span>✓</span> }
                    </button>
                    @if (editingSubtaskId === sub.id) {
                      <input
                        type="text"
                        [(ngModel)]="editingSubtaskTitle"
                        class="form-input font-mono subtask-edit-input"
                        (keyup.enter)="saveSubtaskEdit(task, sub)"
                        (keyup.escape)="cancelEditSubtask()"
                        placeholder="Subtask title..."
                        autofocus
                      />
                      <button type="button" class="btn btn-primary btn-xs font-mono" (click)="saveSubtaskEdit(task, sub)">✓</button>
                      <button type="button" class="btn btn-ghost btn-xs font-mono" (click)="cancelEditSubtask()">✕</button>
                    } @else {
                      <span class="subtask-text">{{ sub.title }}</span>
                      <button type="button" class="subtask-action-btn font-mono" title="Edit subtask" (click)="startEditSubtask(sub)">
                        ✎
                      </button>
                      <button type="button" class="subtask-del font-mono" title="Delete subtask" (click)="deleteSubtask(task, sub)">
                        ✕
                      </button>
                    }
                  </div>
                }
              </div>

              <!-- Add Subtask Input -->
              <form class="add-subtask-form" (ngSubmit)="addSubtask(task)">
                <input
                  type="text"
                  [(ngModel)]="newSubtaskTitle"
                  name="newSubtaskTitle"
                  placeholder="+ Add subtask breakdown item..."
                  class="form-input subtask-input font-mono"
                />
                <button type="submit" class="btn btn-ghost btn-sm font-mono" [disabled]="!newSubtaskTitle.trim()">
                  ADD
                </button>
              </form>
            </div>

            <!-- Drawer Bottom Actions -->
            <div class="drawer-actions">
              <button type="button" class="btn btn-ghost btn-sm font-mono" (click)="editTask(task)">
                EDIT SPEC
              </button>
              <button type="button" class="btn btn-error btn-sm font-mono" (click)="deleteTask(task.id)">
                DELETE TASK
              </button>
            </div>
          </div>
        </div>
      }
      <!-- Category Management Modal -->
      @if (showCategoryModal) {
        <div class="modal-backdrop" (click)="showCategoryModal = false">
          <div class="modal-card category-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <span class="eyebrow font-mono">CATEGORY CONFIGURATION</span>
              <button type="button" class="close-btn font-mono" (click)="showCategoryModal = false">✕</button>
            </div>

            <!-- Existing Categories List -->
            <div class="category-manager-list font-mono">
              <div class="category-manager-header">EXISTING CATEGORIES ({{ categories().length }})</div>
              @for (cat of categories(); track cat.id) {
                <div class="category-manager-item">
                  <div class="cat-pill" [style.border-color]="cat.color || '#C6A56A'">
                    <span class="cat-dot" [style.background-color]="cat.color || '#C6A56A'"></span>
                    <span class="cat-name">{{ cat.name }}</span>
                    @if (cat.icon) {
                      <span class="cat-icon text-muted text-xs">({{ cat.icon }})</span>
                    }
                  </div>
                  <div class="cat-actions">
                    <button type="button" class="btn btn-secondary btn-xs font-mono" (click)="editCategory(cat)">
                      EDIT
                    </button>
                    <button type="button" class="btn btn-error btn-xs font-mono" (click)="deleteCategory(cat)">
                      DELETE
                    </button>
                  </div>
                </div>
              }
              @if (categories().length === 0) {
                <div class="empty-state font-mono">No categories configured yet.</div>
              }
            </div>

            <!-- Create / Edit Form -->
            <form (ngSubmit)="saveCategory()" class="category-form mt-4">
              <div class="form-title font-mono text-gold text-xs">
                {{ editingCategoryId ? 'EDIT CATEGORY' : 'CREATE NEW CATEGORY' }}
              </div>
              <div class="form-row mt-2">
                <div class="form-group flex-1">
                  <label class="form-label font-mono">NAME</label>
                  <input
                    type="text"
                    [(ngModel)]="categoryForm.name"
                    name="catName"
                    required
                    class="form-input font-mono"
                    placeholder="e.g. Engineering, Research"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label font-mono">COLOR</label>
                  <input
                    type="color"
                    [(ngModel)]="categoryForm.color"
                    name="catColor"
                    class="form-input color-picker-input"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label font-mono">ICON CODE</label>
                  <input
                    type="text"
                    [(ngModel)]="categoryForm.icon"
                    name="catIcon"
                    class="form-input font-mono"
                    placeholder="code / book / tag"
                    style="width: 120px;"
                  />
                </div>
              </div>
              <div class="modal-actions mt-3">
                @if (editingCategoryId) {
                  <button type="button" class="btn btn-ghost btn-sm font-mono" (click)="cancelCategoryEdit()">
                    CANCEL EDIT
                  </button>
                }
                <button type="submit" class="btn btn-primary btn-sm font-mono" [disabled]="!categoryForm.name.trim()">
                  {{ editingCategoryId ? 'UPDATE CATEGORY' : '+ ADD CATEGORY' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- AI Copilot Modal -->
      @if (showAiModal()) {
        <app-ai-copilot-modal
          [contextType]="aiContextType()"
          [initialSubject]="aiInitialSubject()"
          (closeModal)="showAiModal.set(false)"
          (applyDuration)="onAiApplyDuration($event)"
          (applySubtasks)="onAiApplySubtasks($event)"
          (bookmarkVideo)="onAiBookmarkVideo($event)"
        ></app-ai-copilot-modal>
      }
    </div>
  `,
  styles: [`
    .tasks-viewport {
      padding: var(--space-lg);
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
      overflow-y: auto;
      height: calc(100vh - var(--topbar-height));
    }
    .tasks-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      .toolbar-right {
        display: flex;
        gap: 12px;
        align-items: center;
        .search-input { width: 240px; font-size: 0.75rem; }
      }
    }
    .view-toggle {
      display: flex;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-main);
      border-radius: var(--radius-sm);
      overflow: hidden;
      .toggle-btn {
        background: transparent;
        border: none;
        color: var(--text-muted);
        padding: 6px 12px;
        font-size: 0.65rem;
        cursor: pointer;
        transition: all var(--transition-fast);
        &.active {
          background: var(--accent-gold);
          color: var(--bg-base);
          font-weight: 700;
        }
      }
    }
    .filter-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 8px;
      gap: 12px;
      flex-wrap: wrap;
    }
    .pill-group {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .pill-btn {
      padding: 6px 12px;
      font-size: 0.65rem;
      letter-spacing: 0.12em;
      border-radius: var(--radius-full);
      background: var(--bg-card);
      border: 1px solid var(--border-main);
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all var(--transition-fast);
      &.active {
        background: var(--accent-gold-subtle);
        border-color: var(--accent-gold);
        color: var(--accent-gold);
        font-weight: 600;
      }
      .pill-count {
        background: var(--bg-surface-elevated);
        padding: 1px 5px;
        border-radius: var(--radius-full);
        font-size: 0.58rem;
      }
    }
    .category-select {
      width: 180px;
      padding: 4px 8px;
      font-size: 0.68rem;
    }
    .loading-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 60px 0;
      color: var(--text-muted);
      font-size: 0.75rem;
      letter-spacing: 0.1em;
      .spinner {
        width: 18px;
        height: 18px;
        border: 2px solid var(--border-subtle);
        border-top-color: var(--accent-gold);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .task-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--space-md);
      margin-top: 10px;
    }
    .task-card {
      display: flex;
      flex-direction: column;
      gap: 10px;
      cursor: pointer;
      &.done {
        opacity: 0.55;
        .task-heading { text-decoration: line-through; }
      }
      .card-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        .category-name {
          font-size: 0.62rem;
          letter-spacing: 0.12em;
          font-weight: 600;
        }
      }
      .card-body {
        display: flex;
        flex-direction: column;
        gap: 4px;
        .task-heading {
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.35;
        }
        .task-desc {
          font-size: 0.75rem;
          color: var(--text-secondary);
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      }
      .subtask-progress {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.62rem;
        color: var(--text-muted);
        .progress-bar-sub {
          flex: 1;
          height: 3px;
          background: var(--bg-surface-elevated);
          border-radius: var(--radius-full);
          overflow: hidden;
          .progress-fill {
            height: 100%;
            background: var(--accent-gold);
          }
        }
      }
      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.68rem;
        color: var(--text-muted);
        border-top: 1px solid var(--border-subtle);
        padding-top: 8px;
        margin-top: auto;
        .footer-left {
          display: flex;
          gap: 8px;
          align-items: center;
          .deadline-tag { font-size: 0.62rem; }
        }
        .status-select {
          background: var(--bg-surface-elevated);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          padding: 2px 6px;
          font-size: 0.62rem;
          outline: none;
        }
      }
    }
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 60px 0;
      color: var(--text-muted);
      font-size: 0.75rem;
      letter-spacing: 0.1em;
    }

    /* KANBAN BOARD */
    .kanban-board {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-top: 10px;
      align-items: start;
      min-width: 900px;
      overflow-x: auto;
    }
    .kanban-column {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-height: 480px;
      .column-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--border-subtle);
        .column-title {
          font-size: 0.72rem;
          letter-spacing: 0.12em;
          color: var(--text-primary);
          font-weight: 600;
        }
      }
      .column-cards {
        display: flex;
        flex-direction: column;
        gap: 10px;
        .column-empty {
          text-align: center;
          padding: 30px 0;
          color: var(--text-muted);
          font-size: 0.65rem;
          border: 1px dashed var(--border-subtle);
          border-radius: var(--radius-sm);
        }
      }
    }
    .kanban-card {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      cursor: pointer;
      .card-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        .category-name { font-size: 0.6rem; font-weight: 600; }
      }
      .task-heading {
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--text-primary);
        line-height: 1.3;
      }
      .subtask-progress { font-size: 0.62rem; color: var(--text-muted); }
      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.65rem;
        color: var(--text-muted);
        border-top: 1px solid var(--border-subtle);
        padding-top: 6px;
        .status-select {
          background: var(--bg-surface-elevated);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          padding: 2px 4px;
          font-size: 0.6rem;
        }
      }
    }

    /* MODAL */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(11, 13, 16, 0.85);
      backdrop-filter: blur(4px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-card {
      width: 100%;
      max-width: 540px;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--accent-gold);
      border-radius: var(--radius-lg);
      padding: 24px;
      box-shadow: var(--shadow-card);
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        .close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.1rem; }
      }
      .form-row { display: flex; gap: 12px; }
      .flex-1 { flex: 1; }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
      }
    }

    /* DRAWER */
    .drawer-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(11, 13, 16, 0.7);
      backdrop-filter: blur(2px);
      z-index: 100;
      display: flex;
      justify-content: flex-end;
    }
    .drawer-panel {
      width: 100%;
      max-width: 480px;
      background: var(--bg-surface-elevated);
      border-left: 1px solid var(--border-main);
      height: 100vh;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow-y: auto;
      box-shadow: var(--shadow-card);
      .drawer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        .drawer-title-group { display: flex; gap: 8px; }
        .close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.1rem; }
      }
      .drawer-heading {
        font-size: 1.25rem;
        font-weight: 500;
        color: var(--text-primary);
        line-height: 1.3;
      }
      .drawer-desc {
        font-size: 0.85rem;
        color: var(--text-secondary);
        line-height: 1.4;
      }
      .drawer-meta {
        background: var(--bg-surface);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-sm);
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 0.7rem;
        .meta-row {
          display: flex;
          justify-content: space-between;
          .meta-label { color: var(--text-muted); }
          .meta-val { color: var(--text-primary); font-weight: 500; }
        }
      }
      .drawer-section {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 8px;
        .section-title-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          .subtask-count { font-size: 0.7rem; color: var(--text-muted); }
        }
      }
      .subtask-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .subtask-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        background: var(--bg-surface);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-sm);
        transition: all var(--transition-fast);
        &.completed {
          opacity: 0.6;
          .subtask-text { text-decoration: line-through; }
        }
        .subtask-check {
          width: 18px;
          height: 18px;
          border: 1px solid var(--border-main);
          border-radius: 3px;
          background: transparent;
          color: var(--accent-gold);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.75rem;
        }
        .subtask-text {
          flex: 1;
          font-size: 0.8rem;
          color: var(--text-primary);
        }
        .subtask-edit-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.8rem;
          &:hover { color: var(--accent-gold); }
        }
        .subtask-edit-input {
          flex: 1;
          font-size: 0.75rem;
          padding: 2px 6px;
          height: 24px;
        }
        .subtask-del {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.8rem;
          &:hover { color: var(--accent-error); }
        }
      }
      .add-subtask-form {
        display: flex;
        gap: 8px;
        margin-top: 4px;
        .subtask-input { font-size: 0.75rem; }
      }
      .drawer-actions {
        margin-top: auto;
        display: flex;
        justify-content: space-between;
        padding-top: 16px;
        border-top: 1px solid var(--border-subtle);
      }
    }
    .category-modal {
      max-width: 540px;
      width: 100%;
      .category-manager-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 240px;
        overflow-y: auto;
        padding-right: 4px;
        .category-manager-header {
          font-size: 0.65rem;
          color: var(--text-muted);
          letter-spacing: 0.1em;
          margin-bottom: 4px;
        }
        .category-manager-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 10px;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          .cat-pill {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.75rem;
            color: var(--text-primary);
            border-left: 3px solid;
            padding-left: 6px;
            .cat-dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
            }
          }
          .cat-actions {
            display: flex;
            gap: 6px;
          }
        }
      }
      .color-picker-input {
        width: 48px;
        height: 34px;
        padding: 2px;
        cursor: pointer;
      }
    }
    .ai-badge-btn {
      background: linear-gradient(135deg, rgba(198, 165, 106, 0.15) 0%, rgba(229, 201, 143, 0.25) 100%);
      border: 1px solid rgba(198, 165, 106, 0.4);
      color: #E5C98F;
      font-weight: 600;
      letter-spacing: 0.08em;
      transition: all 0.2s ease;
      &:hover {
        background: linear-gradient(135deg, rgba(198, 165, 106, 0.25) 0%, rgba(229, 201, 143, 0.35) 100%);
        border-color: #C6A56A;
        box-shadow: 0 0 12px rgba(198, 165, 106, 0.25);
      }
    }
    .header-modal-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .label-with-ai-link {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
      .ai-inline-btn {
        background: none;
        border: none;
        color: var(--accent-gold);
        font-size: 0.65rem;
        cursor: pointer;
        padding: 0 4px;
        letter-spacing: 0.05em;
        &:hover {
          text-decoration: underline;
        }
      }
    }
    .drawer-ai-deck {
      display: flex;
      align-items: center;
    }
  `]
})
export class TasksComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toastService = inject(ToastService);

  readonly tasks = signal<TaskItem[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly submitting = signal(false);

  showAiModal = signal(false);
  aiInitialSubject = signal('');
  aiContextType = signal<'TASK' | 'ROADMAP' | 'GENERAL'>('TASK');

  searchQuery = '';
  selectedCategoryFilter = '';
  activeTab = signal('ALL');
  viewMode = signal<'LIST' | 'KANBAN'>('LIST');

  showNewTaskModal = false;
  editingTaskId: string | null = null;
  selectedTask = signal<TaskItem | null>(null);
  newSubtaskTitle = '';
  editingSubtaskId: string | null = null;
  editingSubtaskTitle = '';

  showCategoryModal = false;
  editingCategoryId: string | null = null;
  categoryForm = {
    name: '',
    color: '#C6A56A',
    icon: 'tag'
  };

  taskForm: CreateTaskRequest = {
    title: '',
    description: '',
    categoryId: '',
    priority: 'MEDIUM',
    status: 'TO_DO',
    estimatedDurationMinutes: 45,
    plannedDate: new Date().toISOString().substring(0, 10),
    deadlineDate: ''
  };

  readonly filterTabs = [
    { id: 'ALL', label: 'ALL TASKS' },
    { id: 'TO_DO', label: 'TO DO' },
    { id: 'IN_PROGRESS', label: 'IN PROGRESS' },
    { id: 'BLOCKED', label: 'BLOCKED' },
    { id: 'COMPLETED', label: 'COMPLETED' }
  ];

  readonly kanbanColumns: Array<{ status: 'TO_DO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED'; title: string }> = [
    { status: 'TO_DO', title: 'TO DO' },
    { status: 'IN_PROGRESS', title: 'IN PROGRESS' },
    { status: 'BLOCKED', title: 'BLOCKED' },
    { status: 'COMPLETED', title: 'COMPLETED' }
  ];

  ngOnInit() {
    this.loadCategories();
    this.loadTasks();
  }

  loadCategories() {
    this.taskService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  loadTasks() {
    this.loading.set(true);
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load tasks', err);
        this.loading.set(false);
      }
    });
  }

  filteredTasks(): TaskItem[] {
    let list = this.tasks();
    const tab = this.activeTab();
    if (tab !== 'ALL') {
      list = list.filter(t => t.status === tab);
    }
    if (this.selectedCategoryFilter) {
      list = list.filter(t => t.category?.id === this.selectedCategoryFilter);
    }
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.category && t.category.name.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }
    return list;
  }

  getColumnTasks(status: 'TO_DO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED'): TaskItem[] {
    let list = this.tasks().filter(t => t.status === status);
    if (this.selectedCategoryFilter) {
      list = list.filter(t => t.category?.id === this.selectedCategoryFilter);
    }
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.category && t.category.name.toLowerCase().includes(q))
      );
    }
    return list;
  }

  getTabCount(tabId: string): number {
    if (tabId === 'ALL') return this.tasks().length;
    return this.tasks().filter(t => t.status === tabId).length;
  }

  changeStatus(task: TaskItem, newStatus: any) {
    this.taskService.updateStatus(task.id, newStatus).subscribe({
      next: (updated) => {
        this.tasks.update(all => all.map(t => t.id === task.id ? updated : t));
        if (this.selectedTask()?.id === task.id) {
          this.selectedTask.set(updated);
        }
      },
      error: (err) => console.error('Failed to update status', err)
    });
  }

  openCreateModal() {
    this.editingTaskId = null;
    this.taskForm = {
      title: '',
      description: '',
      categoryId: this.categories().length > 0 ? this.categories()[0].id : '',
      priority: 'MEDIUM',
      status: 'TO_DO',
      estimatedDurationMinutes: 45,
      plannedDate: new Date().toISOString().substring(0, 10),
      deadlineDate: ''
    };
    this.showNewTaskModal = true;
  }

  editTask(task: TaskItem) {
    this.editingTaskId = task.id;
    this.taskForm = {
      title: task.title,
      description: task.description || '',
      categoryId: task.category?.id || '',
      priority: task.priority,
      status: task.status,
      estimatedDurationMinutes: task.estimatedDurationMinutes || 45,
      plannedDate: task.plannedDate || '',
      deadlineDate: task.deadlineDate || ''
    };
    this.selectedTask.set(null);
    this.showNewTaskModal = true;
  }

  saveTask() {
    if (!this.taskForm.title?.trim()) return;
    this.submitting.set(true);

    const payload: CreateTaskRequest = {
      ...this.taskForm,
      categoryId: this.taskForm.categoryId || undefined,
      deadlineDate: this.taskForm.deadlineDate || undefined,
      plannedDate: this.taskForm.plannedDate || undefined
    };

    if (this.editingTaskId) {
      this.taskService.updateTask(this.editingTaskId, payload).subscribe({
        next: (updated) => {
          this.tasks.update(all => all.map(t => t.id === updated.id ? updated : t));
          this.submitting.set(false);
          this.showNewTaskModal = false;
        },
        error: (err) => {
          console.error('Failed to update task', err);
          this.submitting.set(false);
        }
      });
    } else {
      this.taskService.createTask(payload).subscribe({
        next: (created) => {
          this.tasks.update(all => [created, ...all]);
          this.submitting.set(false);
          this.showNewTaskModal = false;
        },
        error: (err) => {
          console.error('Failed to create task', err);
          this.submitting.set(false);
        }
      });
    }
  }

  async deleteTask(taskId: string) {
    const ok = await this.confirmDialog.confirm({
      title: 'DELETE TASK',
      message: 'Are you sure you want to delete this task? This action cannot be undone.',
      isDestructive: true,
      confirmText: 'DELETE TASK'
    });
    if (!ok) return;

    this.taskService.deleteTask(taskId).subscribe({
      next: () => {
        this.tasks.update(all => all.filter(t => t.id !== taskId));
        if (this.selectedTask()?.id === taskId) {
          this.selectedTask.set(null);
        }
        this.toastService.success('Task permanently removed from workspace.', 'TASK DELETED');
      },
      error: (err) => {
        console.error('Failed to delete task', err);
        this.toastService.error('Failed to delete task.');
      }
    });
  }

  openDetailDrawer(task: TaskItem) {
    this.selectedTask.set(task);
    this.newSubtaskTitle = '';
  }

  addSubtask(task: TaskItem) {
    if (!this.newSubtaskTitle.trim()) return;
    this.taskService.addSubtask(task.id, this.newSubtaskTitle.trim()).subscribe({
      next: (sub) => {
        const updatedSubtasks = [...(task.subtasks || []), sub];
        const updatedTask = { ...task, subtasks: updatedSubtasks };
        this.tasks.update(all => all.map(t => t.id === task.id ? updatedTask : t));
        this.selectedTask.set(updatedTask);
        this.newSubtaskTitle = '';
      },
      error: (err) => console.error('Failed to add subtask', err)
    });
  }

  toggleSubtask(task: TaskItem, sub: Subtask) {
    this.taskService.toggleSubtask(task.id, sub.id).subscribe({
      next: (toggled) => {
        const updatedSubtasks = task.subtasks.map(s => s.id === sub.id ? toggled : s);
        const updatedTask = { ...task, subtasks: updatedSubtasks };
        this.tasks.update(all => all.map(t => t.id === task.id ? updatedTask : t));
        this.selectedTask.set(updatedTask);
      },
      error: (err) => console.error('Failed to toggle subtask', err)
    });
  }

  deleteSubtask(task: TaskItem, sub: Subtask) {
    this.taskService.deleteSubtask(task.id, sub.id).subscribe({
      next: () => {
        const updatedSubtasks = task.subtasks.filter(s => s.id !== sub.id);
        const updatedTask = { ...task, subtasks: updatedSubtasks };
        this.tasks.update(all => all.map(t => t.id === task.id ? updatedTask : t));
        this.selectedTask.set(updatedTask);
      },
      error: (err) => console.error('Failed to delete subtask', err)
    });
  }

  startEditSubtask(sub: Subtask) {
    this.editingSubtaskId = sub.id;
    this.editingSubtaskTitle = sub.title;
  }

  cancelEditSubtask() {
    this.editingSubtaskId = null;
    this.editingSubtaskTitle = '';
  }

  saveSubtaskEdit(task: TaskItem, sub: Subtask) {
    if (!this.editingSubtaskTitle.trim()) return;
    this.taskService.updateSubtask(task.id, sub.id, this.editingSubtaskTitle.trim()).subscribe({
      next: (updatedSub) => {
        const updatedSubtasks = task.subtasks.map(s => s.id === sub.id ? updatedSub : s);
        const updatedTask = { ...task, subtasks: updatedSubtasks };
        this.tasks.update(all => all.map(t => t.id === task.id ? updatedTask : t));
        this.selectedTask.set(updatedTask);
        this.cancelEditSubtask();
      },
      error: (err) => console.error('Failed to update subtask', err)
    });
  }

  openCategoryModal() {
    this.showCategoryModal = true;
    this.editingCategoryId = null;
    this.categoryForm = { name: '', color: '#C6A56A', icon: 'tag' };
  }

  editCategory(cat: Category) {
    this.editingCategoryId = cat.id;
    this.categoryForm = {
      name: cat.name,
      color: cat.color || '#C6A56A',
      icon: cat.icon || 'tag'
    };
  }

  cancelCategoryEdit() {
    this.editingCategoryId = null;
    this.categoryForm = { name: '', color: '#C6A56A', icon: 'tag' };
  }

  saveCategory() {
    if (!this.categoryForm.name.trim()) return;
    if (this.editingCategoryId) {
      this.taskService.updateCategory(this.editingCategoryId, this.categoryForm).subscribe({
        next: (updated) => {
          this.categories.update(all => all.map(c => c.id === updated.id ? updated : c));
          this.cancelCategoryEdit();
          this.loadTasks();
        },
        error: (err) => console.error('Failed to update category', err)
      });
    } else {
      this.taskService.createCategory(this.categoryForm).subscribe({
        next: (created) => {
          this.categories.update(all => [...all, created]);
          this.cancelCategoryEdit();
        },
        error: (err) => console.error('Failed to create category', err)
      });
    }
  }

  async deleteCategory(cat: Category) {
    const ok = await this.confirmDialog.confirm({
      title: 'DELETE CATEGORY',
      message: `Permanently delete category "${cat.name}"? Tasks assigned to this category will become unassigned.`,
      isDestructive: true,
      confirmText: 'DELETE CATEGORY'
    });
    if (!ok) return;

    this.taskService.deleteCategory(cat.id).subscribe({
      next: () => {
        this.categories.update(all => all.filter(c => c.id !== cat.id));
        if (this.editingCategoryId === cat.id) {
          this.cancelCategoryEdit();
        }
        this.loadTasks();
        this.toastService.success(`Category "${cat.name}" deleted.`, 'CATEGORY DELETED');
      },
      error: (err) => {
        console.error('Failed to delete category', err);
        this.toastService.error('Failed to delete category.');
      }
    });
  }

  getCompletedSubtaskCount(task: TaskItem): number {
    return (task.subtasks || []).filter(s => s.completed).length;
  }

  getSubtaskPercent(task: TaskItem): number {
    if (!task.subtasks || task.subtasks.length === 0) return 0;
    return Math.round((this.getCompletedSubtaskCount(task) / task.subtasks.length) * 100);
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'URGENT': return 'badge-error';
      case 'HIGH': return 'badge-warning';
      case 'MEDIUM': return 'badge-gold';
      default: return 'badge-neutral';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'badge-success';
      case 'IN_PROGRESS': return 'badge-gold';
      case 'BLOCKED': return 'badge-error';
      default: return 'badge-neutral';
    }
  }

  openAiForNewTask() {
    this.aiContextType.set('TASK');
    this.aiInitialSubject.set(this.taskForm.title || '');
    this.showAiModal.set(true);
  }

  openAiForSelectedTask(task: TaskItem) {
    this.aiContextType.set('TASK');
    this.aiInitialSubject.set(task.title);
    this.showAiModal.set(true);
  }

  onAiApplyDuration(minutes: number) {
    this.taskForm.estimatedDurationMinutes = minutes;
    const task = this.selectedTask();
    if (task) {
      this.taskService.updateTask(task.id, { estimatedDurationMinutes: minutes }).subscribe({
        next: (updated) => {
          this.selectedTask.set(updated);
          this.tasks.update(all => all.map(t => t.id === updated.id ? updated : t));
        }
      });
    }
  }

  onAiApplySubtasks(subtasks: string[]) {
    const task = this.selectedTask();
    if (task) {
      subtasks.forEach(title => {
        this.taskService.addSubtask(task.id, title).subscribe({
          next: (created: Subtask) => {
            task.subtasks.push(created);
            this.tasks.update(all => all.map(t => t.id === task.id ? { ...task } : t));
          }
        });
      });
    } else {
      const bulletPoints = subtasks.map(s => `• ${s}`).join('\n');
      this.taskForm.description = this.taskForm.description
        ? `${this.taskForm.description}\n\nKey Subtasks:\n${bulletPoints}`
        : `Key Subtasks:\n${bulletPoints}`;
    }
  }

  onAiBookmarkVideo(video: YouTubeRecommendation) {
    const videoNote = `\n\n📌 Recommended Tutorial: [${video.title}](${video.url}) (${video.channel} - ${video.duration})`;
    const task = this.selectedTask();
    if (task) {
      const newDesc = (task.description || '') + videoNote;
      this.taskService.updateTask(task.id, { description: newDesc }).subscribe({
        next: (updated) => {
          this.selectedTask.set(updated);
          this.tasks.update(all => all.map(t => t.id === updated.id ? updated : t));
        }
      });
    } else {
      this.taskForm.description = (this.taskForm.description || '') + videoNote;
    }
  }
}
