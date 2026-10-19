import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface TaskItem {
  id: string;
  title: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TO_DO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED';
  plannedDate?: string;
  estimatedMinutes: number;
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tasks-viewport">
      <!-- Toolbar -->
      <div class="tasks-toolbar">
        <div class="toolbar-left">
          <span class="eyebrow">TASK MANAGEMENT CONSOLE</span>
          <h2 class="display-md">Tasks & Backlog</h2>
        </div>
        <div class="toolbar-right">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search tasks, categories..."
            class="form-input search-input font-mono"
          />
          <button type="button" class="btn btn-primary btn-sm" (click)="showNewTaskModal = true">
            + NEW TASK
          </button>
        </div>
      </div>

      <!-- Filters & Views -->
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
      </div>

      <!-- Kanban or List View -->
      <div class="tasks-container">
        <div class="task-grid">
          @for (task of filteredTasks(); track task.id) {
            <div class="card card-interactive task-card" [class.done]="task.status === 'COMPLETED'">
              <div class="card-top">
                <span class="badge font-mono" [ngClass]="getPriorityBadgeClass(task.priority)">
                  {{ task.priority }}
                </span>
                <span class="category-name font-mono">{{ task.category }}</span>
              </div>
              <h4 class="task-heading">{{ task.title }}</h4>
              <div class="card-footer font-mono">
                <span>⏱ {{ task.estimatedMinutes }}m</span>
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
        </div>
      </div>

      <!-- Quick Add Task Modal -->
      @if (showNewTaskModal) {
        <div class="modal-backdrop" (click)="showNewTaskModal = false">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <span class="eyebrow">CAPTURE TASK</span>
              <button type="button" class="close-btn" (click)="showNewTaskModal = false">✕</button>
            </div>
            <form (ngSubmit)="createTask()">
              <div class="form-group">
                <label class="form-label">Title</label>
                <input type="text" [(ngModel)]="newTaskTitle" name="title" required class="form-input" placeholder="e.g. Implement refresh tokens in Spring Security" autofocus />
              </div>
              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label">Category</label>
                  <select [(ngModel)]="newTaskCategory" name="category" class="form-select">
                    <option value="Engineering">Engineering</option>
                    <option value="Learning">Learning</option>
                    <option value="Personal">Personal</option>
                    <option value="Career">Career</option>
                  </select>
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Priority</label>
                  <select [(ngModel)]="newTaskPriority" name="priority" class="form-select">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div class="form-group flex-1">
                  <label class="form-label">Estimated (min)</label>
                  <input type="number" [(ngModel)]="newTaskMinutes" name="minutes" class="form-input" min="5" step="5" />
                </div>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn btn-ghost btn-sm" (click)="showNewTaskModal = false">CANCEL</button>
                <button type="submit" class="btn btn-primary btn-sm">CREATE TASK</button>
              </div>
            </form>
          </div>
        </div>
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
      .toolbar-right {
        display: flex;
        gap: 12px;
        align-items: center;
        .search-input { width: 260px; font-size: 0.75rem; }
      }
    }
    .filter-strip {
      display: flex;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 8px;
    }
    .pill-group {
      display: flex;
      gap: 8px;
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
    .task-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--space-md);
      margin-top: 10px;
    }
    .task-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
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
          color: var(--text-muted);
          letter-spacing: 0.12em;
        }
      }
      .task-heading {
        font-size: 0.95rem;
        font-weight: 500;
        color: var(--text-primary);
        line-height: 1.35;
      }
      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.68rem;
        color: var(--text-muted);
        border-top: 1px solid var(--border-subtle);
        padding-top: 8px;
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
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(11, 13, 16, 0.8);
      backdrop-filter: blur(4px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-card {
      width: 100%;
      max-width: 520px;
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
  `]
})
export class TasksComponent {
  searchQuery = '';
  activeTab = signal('ALL');
  showNewTaskModal = false;

  newTaskTitle = '';
  newTaskCategory = 'Engineering';
  newTaskPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM';
  newTaskMinutes = 45;

  readonly filterTabs = [
    { id: 'ALL', label: 'ALL TASKS' },
    { id: 'TO_DO', label: 'TO DO' },
    { id: 'IN_PROGRESS', label: 'IN PROGRESS' },
    { id: 'BLOCKED', label: 'BLOCKED' },
    { id: 'COMPLETED', label: 'COMPLETED' }
  ];

  readonly tasks = signal<TaskItem[]>([
    { id: '1', title: 'Implement Flyway schema and verify PostgreSQL indexes', category: 'Engineering', priority: 'HIGH', status: 'COMPLETED', estimatedMinutes: 45 },
    { id: '2', title: 'Complete Angular console shell & command palette navigation', category: 'Engineering', priority: 'HIGH', status: 'IN_PROGRESS', estimatedMinutes: 60 },
    { id: '3', title: 'Review Spring Security session management and CORS policy', category: 'Security', priority: 'MEDIUM', status: 'TO_DO', estimatedMinutes: 30 },
    { id: '4', title: 'Solve 2 LeetCode dynamic programming problems', category: 'Learning', priority: 'MEDIUM', status: 'TO_DO', estimatedMinutes: 50 },
    { id: '5', title: 'Design database backup script and restore verification runbook', category: 'DevOps', priority: 'LOW', status: 'TO_DO', estimatedMinutes: 40 }
  ]);

  getTabCount(tabId: string): number {
    if (tabId === 'ALL') return this.tasks().length;
    return this.tasks().filter(t => t.status === tabId).length;
  }

  filteredTasks(): TaskItem[] {
    let list = this.tasks();
    const tab = this.activeTab();
    if (tab !== 'ALL') {
      list = list.filter(t => t.status === tab);
    }
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(t => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }
    return list;
  }

  changeStatus(task: TaskItem, newStatus: any) {
    this.tasks.update(all => all.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
  }

  createTask() {
    if (!this.newTaskTitle.trim()) return;
    const newTask: TaskItem = {
      id: Date.now().toString(),
      title: this.newTaskTitle.trim(),
      category: this.newTaskCategory,
      priority: this.newTaskPriority,
      status: 'TO_DO',
      estimatedMinutes: this.newTaskMinutes || 45
    };
    this.tasks.update(list => [newTask, ...list]);
    this.newTaskTitle = '';
    this.showNewTaskModal = false;
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'URGENT': return 'badge-error';
      case 'HIGH': return 'badge-warning';
      case 'MEDIUM': return 'badge-gold';
      default: return 'badge-neutral';
    }
  }
}
