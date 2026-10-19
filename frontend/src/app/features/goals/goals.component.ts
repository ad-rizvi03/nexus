import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoalService, Goal, GoalMilestone, GoalSummary, GoalRequest, GoalMilestoneRequest, GoalStatus, ScheduleHealth } from '../../core/services/goal.service';
import { TaskService, Category } from '../../core/services/task.service';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="goals-viewport">
      <!-- Toolbar Header -->
      <div class="toolbar">
        <div>
          <span class="eyebrow font-mono">STRATEGIC GOALS & MILESTONES</span>
          <h2 class="display-md">Long-Term Outcomes & Key Deliverables</h2>
        </div>
        <div class="toolbar-actions font-mono">
          <div class="filter-pills">
            <button
              type="button"
              class="pill-btn"
              [class.active]="filterMode() === 'all'"
              (click)="setFilter('all')"
            >
              ALL ({{ goals().length }})
            </button>
            <button
              type="button"
              class="pill-btn"
              [class.active]="filterMode() === 'in_progress'"
              (click)="setFilter('in_progress')"
            >
              IN PROGRESS ({{ inProgressCount() }})
            </button>
            <button
              type="button"
              class="pill-btn"
              [class.active]="filterMode() === 'approaching'"
              (click)="setFilter('approaching')"
            >
              APPROACHING ({{ approachingCount() }})
            </button>
            <button
              type="button"
              class="pill-btn"
              [class.active]="filterMode() === 'overdue'"
              (click)="setFilter('overdue')"
            >
              OVERDUE ({{ overdueCount() }})
            </button>
            <button
              type="button"
              class="pill-btn"
              [class.active]="filterMode() === 'completed'"
              (click)="setFilter('completed')"
            >
              COMPLETED ({{ completedCount() }})
            </button>
          </div>

          <button type="button" class="btn btn-primary btn-sm font-mono" (click)="openAddModal()">
            + NEW GOAL
          </button>
        </div>
      </div>

      <!-- Telemetry Metric Cards -->
      <div class="metrics-grid">
        <div class="metric-card card">
          <div class="metric-top">
            <span class="metric-label font-mono">STRATEGIC OUTCOMES</span>
            <span class="metric-icon">🎯</span>
          </div>
          <div class="metric-value font-mono">{{ inProgressCount() }} <span class="text-muted text-sm">Active</span></div>
          <div class="metric-sub font-mono text-muted">{{ completedCount() }} achieved goals</div>
        </div>

        <div class="metric-card card">
          <div class="metric-top">
            <span class="metric-label font-mono">AVERAGE COMPLETION</span>
            <span class="metric-icon">📊</span>
          </div>
          <div class="metric-value font-mono text-gold-gradient">{{ averageProgress() }}%</div>
          <div class="progress-bar-container">
            <div class="progress-fill" [style.width.%]="averageProgress()"></div>
          </div>
        </div>

        <div class="metric-card card">
          <div class="metric-top">
            <span class="metric-label font-mono">SCHEDULE HEALTH</span>
            <span class="metric-icon">⏱</span>
          </div>
          <div class="metric-value font-mono text-sm health-summary">
            <span class="health-pill on-track font-mono">{{ onTrackCount() }} On Track</span>
            <span class="health-pill approaching font-mono">{{ approachingCount() }} Approaching</span>
            @if (overdueCount() > 0) {
              <span class="health-pill overdue font-mono">{{ overdueCount() }} Overdue</span>
            }
          </div>
          <div class="metric-sub font-mono text-muted">Deadline risk telemetry</div>
        </div>

        <div class="metric-card card">
          <div class="metric-top">
            <span class="metric-label font-mono">MILESTONES DELIVERED</span>
            <span class="metric-icon">🏆</span>
          </div>
          <div class="metric-value font-mono">
            {{ totalMilestonesDelivered() }} <span class="text-muted text-sm">/ {{ totalMilestonesCount() }}</span>
          </div>
          <div class="metric-sub font-mono text-muted">Across all active roadmaps</div>
        </div>
      </div>

      <!-- Goals Grid -->
      <div class="goals-grid">
        @if (displayedGoals().length === 0) {
          <div class="empty-goals-state card font-mono text-muted text-center">
            No goals found matching the selected filter.
          </div>
        } @else {
          @for (goal of displayedGoals(); track goal.id) {
            <div class="goal-card card card-interactive">
              <!-- Top Row: Category, Health Badge & Target Date -->
              <div class="goal-card-header">
                <div class="header-left">
                  @if (goal.categoryName) {
                    <span
                      class="category-badge font-mono"
                      [style.borderColor]="goal.categoryColor || 'var(--accent-gold)'"
                      [style.color]="goal.categoryColor || 'var(--accent-gold)'"
                    >
                      {{ goal.categoryName }}
                    </span>
                  }
                  <span class="health-badge font-mono" [attr.data-health]="goal.scheduleHealth">
                    <span class="health-dot">●</span>
                    {{ formatHealth(goal.scheduleHealth) }}
                  </span>
                </div>

                <div class="header-right font-mono text-muted text-xs">
                  @if (goal.targetDate) {
                    <span>TARGET: {{ formatDate(goal.targetDate) }}</span>
                  }
                </div>
              </div>

              <!-- Title & Description -->
              <h3 class="goal-title">{{ goal.name }}</h3>
              @if (goal.description) {
                <p class="goal-desc text-secondary text-sm">{{ goal.description }}</p>
              }

              <!-- Progress Bar -->
              <div class="progress-section">
                <div class="progress-labels font-mono">
                  <span>PROGRESS ({{ goal.completedMilestones }}/{{ goal.totalMilestones }} MILESTONES)</span>
                  <span class="text-gold-gradient font-bold">{{ goal.progressPercentage }}%</span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-fill" [style.width.%]="goal.progressPercentage"></div>
                </div>
              </div>

              <!-- Milestones Checklist -->
              <div class="milestones-card">
                <div class="ms-header font-mono">
                  <span>MILESTONES DELIVERABLES</span>
                  <button type="button" class="add-ms-link font-mono" (click)="openAddMilestoneRow(goal)">
                    + ADD
                  </button>
                </div>

                <div class="ms-list">
                  @if (goal.milestones.length === 0) {
                    <div class="empty-ms text-muted font-mono text-xs">
                      No milestones defined yet.
                    </div>
                  } @else {
                    @for (ms of goal.milestones; track ms.id) {
                      <div class="ms-item" [class.done]="ms.completed">
                        <button
                          type="button"
                          class="ms-check-btn font-mono"
                          [class.checked]="ms.completed"
                          (click)="toggleMilestone(goal, ms)"
                          title="Toggle Milestone"
                        >
                          {{ ms.completed ? '✓' : '○' }}
                        </button>
                        <span class="ms-title">{{ ms.title }}</span>
                        @if (ms.targetDate) {
                          <span class="ms-date font-mono text-muted">{{ formatDate(ms.targetDate) }}</span>
                        }
                        <button
                          type="button"
                          class="ms-del-btn"
                          (click)="deleteMilestone(goal, ms.id)"
                          title="Delete Milestone"
                        >
                          ✕
                        </button>
                      </div>
                    }
                  }
                </div>
              </div>

              <!-- Linked Tasks & Footer Actions -->
              <div class="goal-card-footer font-mono">
                <div class="footer-meta">
                  @if (goal.linkedTasksCount > 0) {
                    <span class="linked-tasks-badge">
                      🎯 {{ goal.completedTasksCount }}/{{ goal.linkedTasksCount }} Tasks Completed
                    </span>
                  }
                </div>

                <div class="footer-actions">
                  <button type="button" class="action-icon-btn" (click)="openEditModal(goal)" title="Edit Goal">
                    ✏️
                  </button>
                  <button type="button" class="action-icon-btn danger" (click)="deleteGoal(goal)" title="Delete Goal">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          }
        }
      </div>

      <!-- Add / Edit Goal Modal -->
      @if (showGoalModal()) {
        <div class="modal-backdrop">
          <div class="modal-dialog">
            <div class="modal-header">
              <h3 class="font-sans">{{ editingGoalId() ? 'EDIT STRATEGIC GOAL' : 'NEW STRATEGIC GOAL' }}</h3>
              <button type="button" class="close-btn" (click)="closeGoalModal()">✕</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label font-mono">GOAL OUTCOME NAME *</label>
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="goalForm.name"
                  placeholder="e.g. AWS Solutions Architect Professional Certification"
                />
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label font-mono">CATEGORY</label>
                  <select class="form-input font-mono" [(ngModel)]="goalForm.categoryId">
                    <option [ngValue]="null">None</option>
                    @for (cat of categories(); track cat.id) {
                      <option [ngValue]="cat.id">{{ cat.name }}</option>
                    }
                  </select>
                </div>

                <div class="form-group flex-1">
                  <label class="form-label font-mono">TARGET COMPLETION DATE</label>
                  <input
                    type="date"
                    class="form-input font-mono"
                    [(ngModel)]="goalForm.targetDate"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label font-mono">DESCRIPTION & STRATEGIC INTENT</label>
                <textarea
                  class="form-textarea"
                  rows="2"
                  [(ngModel)]="goalForm.description"
                  placeholder="What is the objective and business impact of achieving this goal?"
                ></textarea>
              </div>

              <div class="form-group">
                <label class="form-label font-mono">STATUS</label>
                <select class="form-input font-mono" [(ngModel)]="goalForm.status">
                  <option value="NOT_STARTED">NOT STARTED</option>
                  <option value="IN_PROGRESS">IN PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="PAUSED">PAUSED</option>
                </select>
              </div>

              <!-- Milestones Builder -->
              <div class="milestones-builder-section">
                <div class="builder-header font-mono">
                  <span>KEY MILESTONES ({{ goalFormMilestones.length }})</span>
                  <button type="button" class="btn btn-secondary btn-sm" (click)="addMilestoneRow()">
                    + Add Milestone
                  </button>
                </div>

                <div class="builder-rows">
                  @for (ms of goalFormMilestones; track $index) {
                    <div class="builder-row">
                      <input
                        type="text"
                        class="form-input flex-1"
                        [(ngModel)]="ms.title"
                        placeholder="Milestone title (e.g. Complete VPC & Subnetting Lab)"
                      />
                      <input
                        type="date"
                        class="form-input font-mono date-picker"
                        [(ngModel)]="ms.targetDate"
                      />
                      <button
                        type="button"
                        class="del-row-btn"
                        (click)="removeMilestoneRow($index)"
                        title="Remove Milestone"
                      >
                        ✕
                      </button>
                    </div>
                  }
                </div>
              </div>
            </div>

            <div class="modal-footer font-mono">
              <button type="button" class="btn btn-secondary" (click)="closeGoalModal()">CANCEL</button>
              <button
                type="button"
                class="btn btn-primary"
                [disabled]="!goalForm.name.trim()"
                (click)="saveGoal()"
              >
                SAVE GOAL
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Quick Add Milestone Inline Prompt Modal -->
      @if (showQuickMilestoneModal()) {
        <div class="modal-backdrop">
          <div class="modal-dialog modal-sm">
            <div class="modal-header">
              <h3 class="font-sans">ADD MILESTONE</h3>
              <button type="button" class="close-btn" (click)="closeQuickMilestoneModal()">✕</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label font-mono">MILESTONE DELIVERABLE *</label>
                <input
                  type="text"
                  class="form-input"
                  [(ngModel)]="quickMilestoneTitle"
                  placeholder="e.g. Deploy High-Availability Cluster"
                />
              </div>
            </div>
            <div class="modal-footer font-mono">
              <button type="button" class="btn btn-secondary" (click)="closeQuickMilestoneModal()">CANCEL</button>
              <button
                type="button"
                class="btn btn-primary"
                [disabled]="!quickMilestoneTitle.trim()"
                (click)="submitQuickMilestone()"
              >
                ADD
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .goals-viewport {
      padding: var(--space-lg);
      display: flex;
      flex-direction: column;
      gap: 20px;
      height: calc(100vh - var(--topbar-height));
      overflow-y: auto;
      background: var(--bg-base);
      color: var(--text-primary);
    }

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .filter-pills {
      display: flex;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }
    .pill-btn {
      background: transparent;
      border: none;
      padding: 6px 12px;
      color: var(--text-muted);
      font-size: 0.68rem;
      cursor: pointer;
      transition: all var(--transition-fast);
      &:hover { color: var(--text-primary); }
      &.active {
        background: var(--accent-gold);
        color: #000;
        font-weight: 700;
      }
    }

    /* METRICS */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }
    .metric-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .metric-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .metric-label {
      font-size: 0.68rem;
      color: var(--text-muted);
      letter-spacing: 0.5px;
    }
    .metric-icon { font-size: 1rem; }
    .metric-value {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .metric-sub { font-size: 0.7rem; }
    .health-summary {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      font-size: 0.65rem;
    }
    .health-pill {
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      font-weight: 600;
      &.on-track { background: rgba(16, 185, 129, 0.15); color: #10B981; }
      &.approaching { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
      &.overdue { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
    }
    .progress-bar-container {
      height: 6px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 3px;
      overflow: hidden;
      margin-top: 4px;
    }
    .progress-fill {
      height: 100%;
      background: var(--accent-gold);
      border-radius: 3px;
      transition: width var(--transition-normal);
    }

    /* GOALS GRID */
    .goals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 20px;
    }
    .empty-goals-state {
      grid-column: 1 / -1;
      padding: 50px 20px;
    }
    .goal-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: all var(--transition-fast);
      &:hover {
        border-color: var(--border-main);
        transform: translateY(-2px);
      }
    }
    .goal-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .category-badge {
      font-size: 0.62rem;
      border: 1px solid var(--accent-gold);
      padding: 1px 6px;
      border-radius: var(--radius-sm);
      font-weight: 600;
    }
    .health-badge {
      font-size: 0.62rem;
      padding: 2px 7px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 700;
      letter-spacing: 0.5px;
      &[data-health="ON_TRACK"] { background: rgba(16, 185, 129, 0.15); color: #10B981; }
      &[data-health="APPROACHING_DEADLINE"] { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
      &[data-health="OVERDUE"] { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
      &[data-health="COMPLETED"] { background: rgba(56, 189, 248, 0.15); color: #38BDF8; }
      .health-dot { font-size: 0.5rem; }
    }
    .goal-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
      line-height: 1.3;
    }
    .goal-desc {
      font-size: 0.8rem;
      margin: 0;
      line-height: 1.4;
    }

    .progress-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.65rem;
      color: var(--text-muted);
    }
    .progress-bar-bg {
      height: 5px;
      background: var(--bg-surface-elevated);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    /* MILESTONES CARD */
    .milestones-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .ms-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.62rem;
      color: var(--text-muted);
      letter-spacing: 0.1em;
    }
    .add-ms-link {
      background: transparent;
      border: none;
      color: var(--accent-gold);
      font-size: 0.65rem;
      font-weight: 700;
      cursor: pointer;
      &:hover { text-decoration: underline; }
    }
    .ms-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .ms-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.78rem;
      color: var(--text-secondary);
      &.done {
        color: var(--text-muted);
        .ms-title { text-decoration: line-through; }
      }
    }
    .ms-check-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 0.88rem;
      color: var(--text-muted);
      padding: 0;
      width: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      &:hover { color: var(--accent-gold); }
      &.checked {
        color: var(--accent-gold);
        font-weight: 800;
      }
    }
    .ms-title {
      flex: 1;
      line-height: 1.3;
    }
    .ms-date {
      font-size: 0.65rem;
      white-space: nowrap;
    }
    .ms-del-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.7rem;
      padding: 0 4px;
      opacity: 0.5;
      &:hover { opacity: 1; color: #EF4444; }
    }

    /* FOOTER */
    .goal-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 10px;
      border-top: 1px solid var(--border-subtle);
    }
    .linked-tasks-badge {
      font-size: 0.68rem;
      color: var(--text-secondary);
    }
    .footer-actions {
      display: flex;
      gap: 6px;
      margin-left: auto;
    }
    .action-icon-btn {
      background: transparent;
      border: none;
      font-size: 0.82rem;
      cursor: pointer;
      opacity: 0.6;
      transition: opacity var(--transition-fast);
      &:hover { opacity: 1; }
      &.danger:hover { color: #EF4444; }
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
      width: 540px;
      max-width: 90vw;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      overflow-y: auto;
      &.modal-sm { width: 400px; }
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
    .form-row { display: flex; gap: 12px; }
    .flex-1 { flex: 1; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-label { font-size: 0.7rem; color: var(--text-muted); letter-spacing: 0.5px; }
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
    .date-picker { width: 140px; }
    .form-textarea { resize: vertical; font-family: inherit; }

    /* BUILDER */
    .milestones-builder-section {
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 12px;
      background: var(--bg-card);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .builder-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.68rem;
      color: var(--text-muted);
    }
    .builder-rows {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .builder-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .del-row-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.85rem;
      padding: 4px;
      &:hover { color: #EF4444; }
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
export class GoalsComponent implements OnInit {
  private readonly goalService = inject(GoalService);
  private readonly taskService = inject(TaskService);

  readonly goals = signal<Goal[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly filterMode = signal<'all' | 'in_progress' | 'approaching' | 'overdue' | 'completed'>('all');

  // Telemetry metrics
  readonly inProgressCount = signal<number>(0);
  readonly completedCount = signal<number>(0);
  readonly averageProgress = signal<number>(0);
  readonly onTrackCount = signal<number>(0);
  readonly approachingCount = signal<number>(0);
  readonly overdueCount = signal<number>(0);
  readonly totalMilestonesDelivered = signal<number>(0);
  readonly totalMilestonesCount = signal<number>(0);

  // Modal State
  readonly showGoalModal = signal<boolean>(false);
  readonly editingGoalId = signal<string | null>(null);
  goalForm: GoalRequest = {
    name: '',
    description: '',
    categoryId: null,
    targetDate: null,
    status: 'IN_PROGRESS',
    milestones: []
  };
  goalFormMilestones: GoalMilestoneRequest[] = [];

  // Quick Milestone Inline Modal
  readonly showQuickMilestoneModal = signal<boolean>(false);
  quickMilestoneTargetGoal: Goal | null = null;
  quickMilestoneTitle: string = '';

  readonly displayedGoals = computed(() => {
    const list = this.goals();
    const mode = this.filterMode();
    if (mode === 'in_progress') return list.filter(g => g.status === 'IN_PROGRESS');
    if (mode === 'completed') return list.filter(g => g.status === 'COMPLETED');
    if (mode === 'approaching') return list.filter(g => g.scheduleHealth === 'APPROACHING_DEADLINE');
    if (mode === 'overdue') return list.filter(g => g.scheduleHealth === 'OVERDUE');
    return list;
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadGoals();
  }

  loadCategories(): void {
    this.taskService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  loadGoals(): void {
    this.goalService.getGoals().subscribe({
      next: (summary) => {
        this.goals.set(summary.goals);
        this.inProgressCount.set(summary.inProgressGoals);
        this.completedCount.set(summary.completedGoals);
        this.averageProgress.set(summary.averageProgress);
        this.onTrackCount.set(summary.onTrackCount);
        this.approachingCount.set(summary.approachingDeadlineCount);
        this.overdueCount.set(summary.overdueCount);

        const totalDelivered = summary.goals.reduce((acc, g) => acc + g.completedMilestones, 0);
        const totalMs = summary.goals.reduce((acc, g) => acc + g.totalMilestones, 0);
        this.totalMilestonesDelivered.set(totalDelivered);
        this.totalMilestonesCount.set(totalMs);
      },
      error: (err) => console.error('Failed to load goals summary', err)
    });
  }

  setFilter(mode: 'all' | 'in_progress' | 'approaching' | 'overdue' | 'completed'): void {
    this.filterMode.set(mode);
  }

  toggleMilestone(goal: Goal, ms: GoalMilestone): void {
    // Optimistic toggle
    ms.completed = !ms.completed;

    this.goalService.toggleMilestone(goal.id, ms.id).subscribe({
      next: (updatedGoal) => {
        this.goals.update(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
        this.recalculateSummaryMetrics();
      },
      error: (err) => {
        // Revert on failure
        ms.completed = !ms.completed;
        console.error('Failed to toggle milestone', err);
      }
    });
  }

  deleteMilestone(goal: Goal, milestoneId: string): void {
    this.goalService.deleteMilestone(goal.id, milestoneId).subscribe({
      next: (updatedGoal) => {
        this.goals.update(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
        this.recalculateSummaryMetrics();
      },
      error: (err) => console.error('Failed to delete milestone', err)
    });
  }

  openAddMilestoneRow(goal: Goal): void {
    this.quickMilestoneTargetGoal = goal;
    this.quickMilestoneTitle = '';
    this.showQuickMilestoneModal.set(true);
  }

  closeQuickMilestoneModal(): void {
    this.showQuickMilestoneModal.set(false);
    this.quickMilestoneTargetGoal = null;
  }

  submitQuickMilestone(): void {
    const goal = this.quickMilestoneTargetGoal;
    if (!goal || !this.quickMilestoneTitle.trim()) return;

    this.goalService.addMilestone(goal.id, {
      title: this.quickMilestoneTitle.trim(),
      completed: false
    }).subscribe({
      next: (updatedGoal) => {
        this.goals.update(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
        this.recalculateSummaryMetrics();
        this.closeQuickMilestoneModal();
      },
      error: (err) => console.error('Failed to add milestone', err)
    });
  }

  openAddModal(): void {
    this.editingGoalId.set(null);
    this.goalForm = {
      name: '',
      description: '',
      categoryId: null,
      targetDate: null,
      status: 'IN_PROGRESS',
      milestones: []
    };
    this.goalFormMilestones = [
      { title: '', completed: false }
    ];
    this.showGoalModal.set(true);
  }

  openEditModal(goal: Goal): void {
    this.editingGoalId.set(goal.id);
    this.goalForm = {
      name: goal.name,
      description: goal.description,
      categoryId: goal.categoryId,
      targetDate: goal.targetDate,
      status: goal.status,
      milestones: []
    };
    this.goalFormMilestones = goal.milestones.map(m => ({
      title: m.title,
      targetDate: m.targetDate,
      completed: m.completed,
      sortOrder: m.sortOrder
    }));
    this.showGoalModal.set(true);
  }

  closeGoalModal(): void {
    this.showGoalModal.set(false);
  }

  addMilestoneRow(): void {
    this.goalFormMilestones.push({ title: '', completed: false });
  }

  removeMilestoneRow(index: number): void {
    this.goalFormMilestones.splice(index, 1);
  }

  saveGoal(): void {
    if (!this.goalForm.name.trim()) return;

    const payload: GoalRequest = {
      ...this.goalForm,
      milestones: this.goalFormMilestones.filter(m => m.title && m.title.trim())
    };

    const id = this.editingGoalId();
    if (id) {
      this.goalService.updateGoal(id, payload).subscribe({
        next: (updated) => {
          this.goals.update(prev => prev.map(g => g.id === updated.id ? updated : g));
          this.recalculateSummaryMetrics();
          this.closeGoalModal();
        },
        error: (err) => console.error('Failed to update goal', err)
      });
    } else {
      this.goalService.createGoal(payload).subscribe({
        next: (created) => {
          this.goals.update(prev => [created, ...prev]);
          this.recalculateSummaryMetrics();
          this.closeGoalModal();
        },
        error: (err) => console.error('Failed to create goal', err)
      });
    }
  }

  deleteGoal(goal: Goal): void {
    if (!confirm(`Are you sure you want to delete strategic goal "${goal.name}"?`)) return;

    this.goalService.deleteGoal(goal.id).subscribe({
      next: () => {
        this.goals.update(prev => prev.filter(g => g.id !== goal.id));
        this.recalculateSummaryMetrics();
      },
      error: (err) => console.error('Failed to delete goal', err)
    });
  }

  private recalculateSummaryMetrics(): void {
    const list = this.goals();
    const inProg = list.filter(g => g.status === 'IN_PROGRESS').length;
    const comp = list.filter(g => g.status === 'COMPLETED').length;
    this.inProgressCount.set(inProg);
    this.completedCount.set(comp);

    const avg = list.length === 0 ? 0 :
      Math.round((list.reduce((acc, g) => acc + g.progressPercentage, 0) / list.length) * 10) / 10;
    this.averageProgress.set(avg);

    this.onTrackCount.set(list.filter(g => g.scheduleHealth === 'ON_TRACK').length);
    this.approachingCount.set(list.filter(g => g.scheduleHealth === 'APPROACHING_DEADLINE').length);
    this.overdueCount.set(list.filter(g => g.scheduleHealth === 'OVERDUE').length);

    this.totalMilestonesDelivered.set(list.reduce((acc, g) => acc + g.completedMilestones, 0));
    this.totalMilestonesCount.set(list.reduce((acc, g) => acc + g.totalMilestones, 0));
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  formatHealth(health: ScheduleHealth): string {
    switch (health) {
      case 'ON_TRACK': return 'ON TRACK';
      case 'APPROACHING_DEADLINE': return 'APPROACHING';
      case 'OVERDUE': return 'OVERDUE';
      case 'COMPLETED': return 'COMPLETED';
      default: return 'ON TRACK';
    }
  }
}
