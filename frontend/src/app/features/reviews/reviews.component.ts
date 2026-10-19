import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ReviewService,
  DailyReviewWorkspace,
  DailyReview,
  TaskTriageAction,
  TaskTriageRequest,
  DailyReviewSubmission
} from '../../core/services/review.service';
import { TaskItem } from '../../core/services/task.service';

interface TaskTriageState {
  action: TaskTriageAction;
  rescheduleDate: string;
  rescheduleTime: string;
  blockedReason: string;
  subtasks: string[];
  applied: boolean;
}

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="review-viewport">
      <!-- Toolbar & Date Control -->
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="eyebrow font-mono">DAILY REVIEW & RETROSPECTIVE</span>
          <div class="date-stepper font-mono">
            <button type="button" class="btn btn-secondary btn-sm" (click)="changeDate(-1)" title="Previous Day">
              ◀ PREV
            </button>
            <input
              type="date"
              [ngModel]="selectedDate()"
              (ngModelChange)="onDateSelect($event)"
              class="date-input"
            />
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              [disabled]="isToday()"
              (click)="goToToday()"
              title="Jump to Today"
            >
              TODAY
            </button>
            <button type="button" class="btn btn-secondary btn-sm" (click)="changeDate(1)" title="Next Day">
              NEXT ▶
            </button>
          </div>
        </div>

        <div class="toolbar-actions font-mono">
          <span
            class="status-pill"
            [class.completed]="workspace()?.completed"
            [class.draft]="!workspace()?.completed"
          >
            ● {{ workspace()?.completed ? 'REVIEW FINALIZED' : 'DRAFT / IN-PROGRESS' }}
          </span>

          <button type="button" class="btn btn-secondary btn-sm" (click)="openHistory()">
            📜 ARCHIVE ({{ history().length }})
          </button>

          <button
            type="button"
            class="btn btn-primary btn-sm"
            [disabled]="saving()"
            (click)="submitReview()"
          >
            {{ saving() ? 'SAVING...' : '✓ COMPLETE & SAVE REVIEW' }}
          </button>
        </div>
      </div>

      <!-- Success Notification Banner -->
      @if (successMessage()) {
        <div class="alert-banner font-mono">
          <span>✓ {{ successMessage() }}</span>
          <button type="button" class="close-alert" (click)="successMessage.set(null)">✕</button>
        </div>
      }

      @if (loading()) {
        <div class="loading-state font-mono">
          <div class="spinner"></div>
          <span>AGGREGATING LIVE DAY TELEMETRY...</span>
        </div>
      } @else if (workspace()) {
        <!-- Telemetry Metrics Deck -->
        <div class="summary-deck">
          <!-- Completed Tasks -->
          <div class="metric-card card">
            <div class="metric-top font-mono">
              <span class="metric-label">COMPLETED TASKS</span>
              <span class="metric-badge green">DONE</span>
            </div>
            <div class="metric-body">
              <span class="metric-value font-mono text-success">
                {{ workspace()!.completedTasks.length }}
              </span>
              <span class="metric-sub font-mono">
                of {{ workspace()!.completedTasks.length + workspace()!.unfinishedTasks.length }} scheduled
              </span>
            </div>
            <div class="mini-bar">
              <div
                class="mini-bar-fill green-bar"
                [style.width.%]="completionPercentage()"
              ></div>
            </div>
          </div>

          <!-- Unfinished Items -->
          <div class="metric-card card">
            <div class="metric-top font-mono">
              <span class="metric-label">UNFINISHED TASKS</span>
              <span
                class="metric-badge"
                [class.amber]="workspace()!.unfinishedTasks.length > 0"
                [class.green]="workspace()!.unfinishedTasks.length === 0"
              >
                {{ workspace()!.unfinishedTasks.length > 0 ? 'NEEDS TRIAGE' : 'ALL CLEAR' }}
              </span>
            </div>
            <div class="metric-body">
              <span
                class="metric-value font-mono"
                [class.text-amber]="workspace()!.unfinishedTasks.length > 0"
              >
                {{ workspace()!.unfinishedTasks.length }}
              </span>
              <span class="metric-sub font-mono">
                {{ unhandledTriageCount() }} unresolved
              </span>
            </div>
            <div class="mini-bar">
              <div
                class="mini-bar-fill amber-bar"
                [style.width.%]="unhandledPercentage()"
              ></div>
            </div>
          </div>

          <!-- Missed Deadlines -->
          <div class="metric-card card">
            <div class="metric-top font-mono">
              <span class="metric-label">MISSED DEADLINES</span>
              <span
                class="metric-badge"
                [class.red]="workspace()!.missedDeadlines.length > 0"
                [class.green]="workspace()!.missedDeadlines.length === 0"
              >
                {{ workspace()!.missedDeadlines.length > 0 ? 'OVERDUE' : 'CLEAN' }}
              </span>
            </div>
            <div class="metric-body">
              <span
                class="metric-value font-mono"
                [class.text-red]="workspace()!.missedDeadlines.length > 0"
              >
                {{ workspace()!.missedDeadlines.length }}
              </span>
              <span class="metric-sub font-mono">requiring replan</span>
            </div>
          </div>

          <!-- Focused Time -->
          <div class="metric-card card">
            <div class="metric-top font-mono">
              <span class="metric-label">TIME TRACKED</span>
              <span class="metric-badge gold">FOCUS</span>
            </div>
            <div class="metric-body">
              <span class="metric-value font-mono text-gold-gradient">
                {{ formatMinutes(workspace()!.timeTrackedMinutes) }}
              </span>
              <span class="metric-sub font-mono">recorded via timer</span>
            </div>
          </div>

          <!-- Learning Accomplishments -->
          <div class="metric-card card">
            <div class="metric-top font-mono">
              <span class="metric-label">LEARNING TOPICS</span>
              <span class="metric-badge blue">STUDY</span>
            </div>
            <div class="metric-body">
              <span class="metric-value font-mono text-blue">
                {{ workspace()!.learningTopicsCompleted.length }}
              </span>
              <span class="metric-sub font-mono">topics completed</span>
            </div>
          </div>

          <!-- Goals Progressed -->
          <div class="metric-card card">
            <div class="metric-top font-mono">
              <span class="metric-label">GOAL DELIVERABLES</span>
              <span class="metric-badge purple">STRATEGY</span>
            </div>
            <div class="metric-body">
              <span class="metric-value font-mono text-purple">
                {{ workspace()!.goalsProgressed.length }}
              </span>
              <span class="metric-sub font-mono">milestones checked</span>
            </div>
          </div>
        </div>

        <!-- Main Workspace Dual-Panel Layout -->
        <div class="workspace-grid">
          <!-- LEFT COLUMN: Unfinished Tasks Carry-Forward Resolution -->
          <div class="workspace-column">
            <div class="card panel-card">
              <div class="panel-header">
                <div>
                  <span class="eyebrow font-mono text-amber">SECTION 13 REQUIREMENT</span>
                  <h3 class="panel-title font-sans">
                    Unfinished Tasks Carry-Forward Triage
                    <span class="badge-count font-mono">{{ workspace()!.unfinishedTasks.length }}</span>
                  </h3>
                </div>
                <span class="rule-hint font-mono">
                  *Tasks never copy automatically to tomorrow. Explicit triage required.
                </span>
              </div>

              @if (workspace()!.unfinishedTasks.length === 0) {
                <div class="empty-state font-mono">
                  <div class="empty-icon">✓</div>
                  <div class="empty-text">Zero unfinished tasks for this day!</div>
                  <div class="empty-sub">All planned assignments have been resolved.</div>
                </div>
              } @else {
                <div class="triage-items-list">
                  @for (task of workspace()!.unfinishedTasks; track task.id) {
                    <div class="triage-card" [class.applied]="isTriageApplied(task.id)">
                      <div class="triage-task-header">
                        <div class="task-info">
                          <span
                            class="priority-tag font-mono"
                            [class]="task.priority.toLowerCase()"
                          >
                            {{ task.priority }}
                          </span>
                          @if (task.category) {
                            <span
                              class="category-tag font-mono"
                              [style.borderColor]="task.category.color"
                              [style.color]="task.category.color"
                            >
                              {{ task.category.name }}
                            </span>
                          }
                          <span class="task-title font-sans">{{ task.title }}</span>
                        </div>
                        <div class="task-meta font-mono">
                          @if (task.deadlineDate) {
                            <span class="due-pill" [class.overdue]="isDatePast(task.deadlineDate)">
                              Due: {{ task.deadlineDate }}
                            </span>
                          }
                          @if (task.estimatedDurationMinutes) {
                            <span class="duration-pill">{{ task.estimatedDurationMinutes }}m</span>
                          }
                        </div>
                      </div>

                      @if (task.description) {
                        <p class="task-desc text-secondary text-sm">{{ task.description }}</p>
                      }

                      <!-- Disposition Action Selector Strip -->
                      <div class="action-selector-strip font-mono">
                        <button
                          type="button"
                          class="action-tab"
                          [class.selected]="getTriageAction(task.id) === 'RESCHEDULE'"
                          (click)="setTriageAction(task.id, 'RESCHEDULE')"
                        >
                          📅 RESCHEDULE
                        </button>
                        <button
                          type="button"
                          class="action-tab"
                          [class.selected]="getTriageAction(task.id) === 'BACKLOG'"
                          (click)="setTriageAction(task.id, 'BACKLOG')"
                        >
                          📥 TO BACKLOG
                        </button>
                        <button
                          type="button"
                          class="action-tab"
                          [class.selected]="getTriageAction(task.id) === 'MARK_BLOCKED'"
                          (click)="setTriageAction(task.id, 'MARK_BLOCKED')"
                        >
                          ⛔ MARK BLOCKED
                        </button>
                        <button
                          type="button"
                          class="action-tab"
                          [class.selected]="getTriageAction(task.id) === 'BREAK_SUBTASKS'"
                          (click)="setTriageAction(task.id, 'BREAK_SUBTASKS')"
                        >
                          🧩 BREAK INTO SUBTASKS
                        </button>
                        <button
                          type="button"
                          class="action-tab danger-tab"
                          [class.selected]="getTriageAction(task.id) === 'CANCEL'"
                          (click)="setTriageAction(task.id, 'CANCEL')"
                        >
                          ✕ CANCEL / DROP
                        </button>
                      </div>

                      <!-- Sub-Panel: Dynamic Form depending on selected action -->
                      <div class="action-detail-panel font-mono">
                        @if (getTriageAction(task.id) === 'RESCHEDULE') {
                          <div class="action-form-row">
                            <label class="form-label text-xs">New Planned Date:</label>
                            <input
                              type="date"
                              [ngModel]="getTriageState(task.id).rescheduleDate"
                              (ngModelChange)="updateTriageField(task.id, 'rescheduleDate', $event)"
                              class="form-input date-select"
                            />
                            <label class="form-label text-xs ml-2">Optional Time:</label>
                            <input
                              type="time"
                              [ngModel]="getTriageState(task.id).rescheduleTime"
                              (ngModelChange)="updateTriageField(task.id, 'rescheduleTime', $event)"
                              class="form-input time-select"
                            />
                            <button
                              type="button"
                              class="btn btn-secondary btn-xs action-apply-btn"
                              (click)="applyTriageNow(task)"
                            >
                              APPLY RESCHEDULE
                            </button>
                          </div>
                        } @else if (getTriageAction(task.id) === 'BACKLOG') {
                          <div class="action-form-row">
                            <span class="action-note">
                              Clears planned date. Task returns to backlog so it does not clutter tomorrow's schedule.
                            </span>
                            <button
                              type="button"
                              class="btn btn-secondary btn-xs action-apply-btn"
                              (click)="applyTriageNow(task)"
                            >
                              SEND TO BACKLOG
                            </button>
                          </div>
                        } @else if (getTriageAction(task.id) === 'MARK_BLOCKED') {
                          <div class="action-form-col">
                            <label class="form-label text-xs">Reason for Block:</label>
                            <div class="input-with-btn">
                              <input
                                type="text"
                                [ngModel]="getTriageState(task.id).blockedReason"
                                (ngModelChange)="updateTriageField(task.id, 'blockedReason', $event)"
                                placeholder="e.g. Waiting on API spec or security team approval..."
                                class="form-input w-full"
                              />
                              <button
                                type="button"
                                class="btn btn-secondary btn-xs action-apply-btn"
                                (click)="applyTriageNow(task)"
                              >
                                CONFIRM BLOCKED
                              </button>
                            </div>
                          </div>
                        } @else if (getTriageAction(task.id) === 'BREAK_SUBTASKS') {
                          <div class="action-form-col">
                            <label class="form-label text-xs">Break into smaller atomic deliverables:</label>
                            <div class="subtask-inputs">
                              @for (st of getTriageState(task.id).subtasks; track $index) {
                                <div class="subtask-row">
                                  <span class="subtask-num">#{{ $index + 1 }}</span>
                                  <span class="subtask-text">{{ st }}</span>
                                  <button
                                    type="button"
                                    class="remove-subtask-btn"
                                    (click)="removeSubtaskFromTriage(task.id, $index)"
                                  >
                                    ✕
                                  </button>
                                </div>
                              }
                              <div class="add-subtask-box">
                                <input
                                  type="text"
                                  #subtaskInput
                                  placeholder="Type new subtask title and press Add..."
                                  class="form-input"
                                  (keyup.enter)="addSubtaskToTriage(task.id, subtaskInput.value); subtaskInput.value = ''"
                                />
                                <button
                                  type="button"
                                  class="btn btn-secondary btn-xs"
                                  (click)="addSubtaskToTriage(task.id, subtaskInput.value); subtaskInput.value = ''"
                                >
                                  + ADD
                                </button>
                              </div>
                            </div>
                            <div class="subtask-footer-action mt-2">
                              <button
                                type="button"
                                class="btn btn-secondary btn-xs action-apply-btn"
                                [disabled]="getTriageState(task.id).subtasks.length === 0"
                                (click)="applyTriageNow(task)"
                              >
                                CREATE {{ getTriageState(task.id).subtasks.length }} SUBTASKS & SET IN-PROGRESS
                              </button>
                            </div>
                          </div>
                        } @else if (getTriageAction(task.id) === 'CANCEL') {
                          <div class="action-form-row">
                            <span class="action-note text-red">
                              Archive / Cancel this task as no longer relevant or required.
                            </span>
                            <button
                              type="button"
                              class="btn btn-danger btn-xs action-apply-btn"
                              (click)="applyTriageNow(task)"
                            >
                              CONFIRM CANCEL
                            </button>
                          </div>
                        }
                      </div>

                      @if (isTriageApplied(task.id)) {
                        <div class="applied-badge font-mono">
                          <span>✓ DISPOSITION APPLIED</span>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- RIGHT COLUMN: Accomplishments & Daily Retrospective -->
          <div class="workspace-column">
            <!-- Completed Work Card -->
            <div class="card panel-card mb-4">
              <div class="panel-header">
                <div>
                  <span class="eyebrow font-mono text-success">DELIVERED WORK</span>
                  <h3 class="panel-title font-sans">
                    Accomplishments & Completed Work
                    <span class="badge-count green font-mono">{{ workspace()!.completedTasks.length }}</span>
                  </h3>
                </div>
              </div>

              @if (workspace()!.completedTasks.length === 0) {
                <div class="empty-state font-mono">
                  <span class="empty-text">No tasks checked off today yet.</span>
                </div>
              } @else {
                <div class="accomplishment-list">
                  @for (task of workspace()!.completedTasks; track task.id) {
                    <div class="accomplishment-item">
                      <div class="check-mark">✓</div>
                      <div class="accomplishment-info">
                        <span class="task-title strikethrough font-sans">{{ task.title }}</span>
                        <div class="accomplishment-meta font-mono">
                          @if (task.category) {
                            <span class="cat-pill" [style.color]="task.category.color">
                              {{ task.category.name }}
                            </span>
                          }
                          @if (task.estimatedDurationMinutes) {
                            <span class="time-pill">{{ task.estimatedDurationMinutes }}m planned</span>
                          }
                          @if (task.completedAt) {
                            <span class="timestamp-pill">Completed: {{ formatTime(task.completedAt) }}</span>
                          }
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }

              <!-- Learning & Goals Accomplishments Sub-panel -->
              @if (workspace()!.learningTopicsCompleted.length > 0 || workspace()!.goalsProgressed.length > 0) {
                <div class="accomplishments-subdeck font-mono mt-3">
                  @if (workspace()!.learningTopicsCompleted.length > 0) {
                    <div class="subdeck-group">
                      <span class="subdeck-tag text-blue">LEARNING SESSIONS COMPLETED:</span>
                      @for (item of workspace()!.learningTopicsCompleted; track item.topicId) {
                        <div class="subdeck-row">
                          <span class="text-secondary">📚 {{ item.topicTitle }}</span>
                          <span class="text-muted text-xs">({{ item.roadmapSkill || item.moduleTitle }})</span>
                        </div>
                      }
                    </div>
                  }

                  @if (workspace()!.goalsProgressed.length > 0) {
                    <div class="subdeck-group mt-2">
                      <span class="subdeck-tag text-purple">GOAL DELIVERABLES CHECKED:</span>
                      @for (item of workspace()!.goalsProgressed; track item.milestoneId) {
                        <div class="subdeck-row">
                          <span class="text-secondary">🎯 {{ item.milestoneTitle }}</span>
                          <span class="text-muted text-xs">({{ item.goalName }})</span>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Reflection & Retrospective Notes -->
            <div class="card panel-card">
              <div class="panel-header">
                <div>
                  <span class="eyebrow font-mono text-gold">RETROSPECTIVE LOG</span>
                  <h3 class="panel-title font-sans">End-of-Day Reflection Notes</h3>
                </div>
                <span class="rule-hint font-mono">Section 13 Record</span>
              </div>

              <div class="reflection-workspace">
                <div class="prompt-chips font-mono">
                  <span class="chip">1. What went well today?</span>
                  <span class="chip">2. What slowed progress or blocked velocity?</span>
                  <span class="chip">3. Top single outcome for tomorrow?</span>
                </div>

                <textarea
                  [(ngModel)]="reflectionNotes"
                  class="form-textarea reflection-input font-sans"
                  rows="7"
                  placeholder="Record your honest engineering reflection, friction analysis, and primary priority for tomorrow..."
                ></textarea>

                <div class="reflection-footer font-mono">
                  <span class="word-counter text-muted text-xs">
                    {{ wordCount() }} words / {{ reflectionNotes.length }} chars
                  </span>
                  <div class="footer-buttons">
                    <button
                      type="button"
                      class="btn btn-secondary btn-sm"
                      [disabled]="saving()"
                      (click)="saveDraft()"
                    >
                      SAVE AS DRAFT
                    </button>
                    <button
                      type="button"
                      class="btn btn-primary btn-sm"
                      [disabled]="saving()"
                      (click)="submitReview()"
                    >
                      ✓ COMPLETE & FINALIZE REVIEW
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Historical Reviews Archive Modal -->
      @if (showHistoryModal()) {
        <div class="modal-backdrop" (click)="showHistoryModal.set(false)">
          <div class="modal-window card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <span class="eyebrow font-mono">HISTORICAL ARCHIVE</span>
                <h3 class="font-serif text-lg">Daily Reviews History Log</h3>
              </div>
              <button type="button" class="close-btn" (click)="showHistoryModal.set(false)">✕</button>
            </div>

            <div class="history-list font-mono">
              @if (history().length === 0) {
                <div class="empty-state">
                  <span>No finalized daily reviews recorded yet.</span>
                </div>
              } @else {
                <table class="history-table">
                  <thead>
                    <tr>
                      <th>DATE</th>
                      <th>COMPLETED</th>
                      <th>UNFINISHED</th>
                      <th>FOCUS TIME</th>
                      <th>LEARNING</th>
                      <th>STATUS</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of history(); track item.id) {
                      <tr>
                        <td class="font-bold">{{ item.reviewDate }}</td>
                        <td class="text-success">{{ item.completedTaskCount }}</td>
                        <td [class.text-amber]="item.unfinishedTaskCount > 0">{{ item.unfinishedTaskCount }}</td>
                        <td class="text-gold">{{ formatMinutes(item.totalTimeTrackedMinutes) }}</td>
                        <td class="text-blue">{{ item.learningCompletedCount }}</td>
                        <td>
                          <span class="status-badge" [class.done]="item.status === 'COMPLETED'">
                            {{ item.status }}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            class="btn btn-secondary btn-xs"
                            (click)="viewHistoricalDate(item.reviewDate)"
                          >
                            OPEN
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .review-viewport {
      padding: var(--space-xl);
      max-width: 1440px;
      margin: 0 auto;
      min-height: calc(100vh - var(--topbar-height));
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Toolbar Header */
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border-subtle);

      .toolbar-left {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .date-stepper {
        display: flex;
        align-items: center;
        gap: 8px;

        .date-input {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 0.85rem;
          outline: none;
          &:focus { border-color: var(--accent-gold); }
        }
      }

      .toolbar-actions {
        display: flex;
        align-items: center;
        gap: 12px;

        .status-pill {
          font-size: 0.68rem;
          letter-spacing: 0.08em;
          padding: 6px 12px;
          border-radius: 9999px;
          &.completed {
            background: rgba(120, 185, 154, 0.12);
            color: var(--status-success);
            border: 1px solid rgba(120, 185, 154, 0.3);
          }
          &.draft {
            background: rgba(216, 172, 102, 0.12);
            color: var(--status-warning);
            border: 1px solid rgba(216, 172, 102, 0.3);
          }
        }
      }
    }

    /* Alert Banner */
    .alert-banner {
      background: rgba(120, 185, 154, 0.1);
      border: 1px solid rgba(120, 185, 154, 0.3);
      color: var(--status-success);
      padding: 10px 16px;
      border-radius: var(--radius-sm);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
      .close-alert {
        background: transparent;
        border: none;
        color: var(--status-success);
        cursor: pointer;
      }
    }

    .loading-state {
      padding: 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: var(--text-muted);
      font-size: 0.75rem;
      letter-spacing: 0.12em;
      .spinner {
        width: 32px;
        height: 32px;
        border: 2px solid var(--border-subtle);
        border-top-color: var(--accent-gold);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Summary Deck Cards */
    .summary-deck {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;

      .metric-card {
        padding: 16px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 10px;

        .metric-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          .metric-label {
            font-size: 0.62rem;
            color: var(--text-muted);
            letter-spacing: 0.12em;
          }
          .metric-badge {
            font-size: 0.58rem;
            padding: 2px 6px;
            border-radius: var(--radius-sm);
            letter-spacing: 0.05em;
            &.green { background: rgba(120, 185, 154, 0.15); color: var(--status-success); }
            &.amber { background: rgba(216, 172, 102, 0.15); color: var(--status-warning); }
            &.red { background: rgba(215, 126, 126, 0.15); color: var(--status-error); }
            &.gold { background: rgba(198, 165, 106, 0.15); color: var(--accent-gold); }
            &.blue { background: rgba(96, 165, 250, 0.15); color: #60a5fa; }
            &.purple { background: rgba(192, 132, 252, 0.15); color: #c084fc; }
          }
        }

        .metric-body {
          display: flex;
          flex-direction: column;
          gap: 2px;
          .metric-value { font-size: 1.5rem; font-weight: 700; line-height: 1.1; }
          .metric-sub { font-size: 0.65rem; color: var(--text-secondary); }
        }

        .mini-bar {
          height: 4px;
          background: var(--bg-surface-elevated);
          border-radius: 2px;
          overflow: hidden;
          .mini-bar-fill {
            height: 100%;
            transition: width 0.3s ease;
            &.green-bar { background: var(--status-success); }
            &.amber-bar { background: var(--status-warning); }
          }
        }
      }
    }

    /* Dual Column Layout */
    .workspace-grid {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 20px;
      align-items: flex-start;
      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    .workspace-column {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .panel-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 10px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border-subtle);

      .panel-title {
        font-size: 1.15rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 4px;
      }

      .badge-count {
        font-size: 0.7rem;
        background: rgba(216, 172, 102, 0.18);
        color: var(--status-warning);
        padding: 2px 8px;
        border-radius: 9999px;
        &.green {
          background: rgba(120, 185, 154, 0.18);
          color: var(--status-success);
        }
      }

      .rule-hint {
        font-size: 0.62rem;
        color: var(--accent-gold);
        letter-spacing: 0.05em;
      }
    }

    /* Unfinished Triage Items */
    .triage-items-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .triage-card {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      position: relative;
      transition: border-color 0.2s ease;

      &.applied {
        border-color: rgba(120, 185, 154, 0.4);
      }

      .triage-task-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        flex-wrap: wrap;

        .task-info {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          .task-title { font-weight: 500; font-size: 0.95rem; color: var(--text-primary); }
        }

        .task-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.65rem;

          .due-pill {
            background: var(--bg-surface);
            padding: 2px 6px;
            border-radius: var(--radius-sm);
            color: var(--text-muted);
            &.overdue { color: var(--status-error); border: 1px solid rgba(215, 126, 126, 0.3); }
          }
          .duration-pill {
            color: var(--accent-gold);
          }
        }
      }

      .priority-tag {
        font-size: 0.58rem;
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        letter-spacing: 0.08em;
        font-weight: 600;
        &.urgent { background: rgba(215, 126, 126, 0.2); color: var(--status-error); }
        &.high { background: rgba(216, 172, 102, 0.2); color: var(--status-warning); }
        &.medium { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }
        &.low { background: rgba(160, 166, 176, 0.2); color: var(--text-muted); }
      }

      .category-tag {
        font-size: 0.58rem;
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        border: 1px solid;
      }

      .task-desc { margin: 0; line-height: 1.4; }

      /* Action Tabs Strip */
      .action-selector-strip {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        border-top: 1px solid var(--border-subtle);
        padding-top: 10px;

        .action-tab {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          font-size: 0.65rem;
          padding: 6px 10px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.15s ease;
          &:hover { border-color: var(--accent-gold); color: var(--text-primary); }
          &.selected {
            background: rgba(198, 165, 106, 0.15);
            border-color: var(--accent-gold);
            color: var(--accent-gold);
            font-weight: 600;
          }
          &.danger-tab:hover {
            border-color: var(--status-error);
            color: var(--status-error);
          }
          &.danger-tab.selected {
            background: rgba(215, 126, 126, 0.15);
            border-color: var(--status-error);
            color: var(--status-error);
          }
        }
      }

      /* Detail action form */
      .action-detail-panel {
        background: var(--bg-surface);
        border: 1px dashed var(--border-subtle);
        border-radius: var(--radius-sm);
        padding: 12px;

        .action-form-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .action-form-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .action-note { font-size: 0.7rem; color: var(--text-secondary); }
        .action-apply-btn { margin-left: auto; }

        .date-select, .time-select {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
        }

        .input-with-btn {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .subtask-inputs {
          display: flex;
          flex-direction: column;
          gap: 6px;

          .subtask-row {
            display: flex;
            align-items: center;
            gap: 8px;
            background: var(--bg-card);
            padding: 4px 8px;
            border-radius: var(--radius-sm);
            font-size: 0.75rem;
            .subtask-num { color: var(--accent-gold); font-size: 0.65rem; }
            .subtask-text { flex: 1; color: var(--text-primary); }
            .remove-subtask-btn {
              background: transparent;
              border: none;
              color: var(--text-muted);
              cursor: pointer;
              &:hover { color: var(--status-error); }
            }
          }

          .add-subtask-box {
            display: flex;
            gap: 6px;
            .form-input { flex: 1; font-size: 0.75rem; padding: 4px 8px; }
          }
        }
      }

      .applied-badge {
        font-size: 0.65rem;
        color: var(--status-success);
        letter-spacing: 0.08em;
        text-align: right;
      }
    }

    /* Accomplishments */
    .accomplishment-list {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .accomplishment-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 8px 10px;
        background: var(--bg-surface-elevated);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-sm);

        .check-mark {
          color: var(--status-success);
          font-weight: 700;
          font-size: 0.9rem;
        }

        .accomplishment-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          .task-title.strikethrough {
            text-decoration: line-through;
            color: var(--text-secondary);
            font-size: 0.88rem;
          }
          .accomplishment-meta {
            display: flex;
            gap: 8px;
            font-size: 0.62rem;
            color: var(--text-muted);
            .time-pill { color: var(--accent-gold); }
          }
        }
      }
    }

    .accomplishments-subdeck {
      border-top: 1px solid var(--border-subtle);
      padding-top: 10px;
      font-size: 0.7rem;
      .subdeck-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
        .subdeck-tag { font-size: 0.62rem; letter-spacing: 0.08em; font-weight: 600; }
        .subdeck-row { display: flex; justify-content: space-between; padding: 2px 0; }
      }
    }

    /* Reflection Workspace */
    .reflection-workspace {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .prompt-chips {
        display: flex;
        flex-direction: column;
        gap: 4px;
        .chip {
          font-size: 0.65rem;
          color: var(--text-muted);
          letter-spacing: 0.04em;
        }
      }

      .reflection-input {
        background: var(--bg-surface-elevated);
        border: 1px solid var(--border-subtle);
        color: var(--text-primary);
        line-height: 1.6;
        font-size: 0.88rem;
        padding: 12px;
        border-radius: var(--radius-sm);
        resize: vertical;
        outline: none;
        &:focus { border-color: var(--accent-gold); }
      }

      .reflection-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;

        .footer-buttons {
          display: flex;
          gap: 8px;
        }
      }
    }

    /* Empty state */
    .empty-state {
      padding: 30px 16px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      color: var(--text-muted);
      .empty-icon { font-size: 1.5rem; color: var(--status-success); }
      .empty-text { font-size: 0.85rem; color: var(--text-primary); font-weight: 500; }
      .empty-sub { font-size: 0.7rem; }
    }

    /* Modal Archive */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.75);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal-window {
      width: 100%;
      max-width: 820px;
      max-height: 85vh;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 1px solid var(--border-subtle);
        padding-bottom: 12px;
        .close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 1.1rem;
          cursor: pointer;
          &:hover { color: var(--text-primary); }
        }
      }

      .history-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.75rem;

        th, td {
          padding: 10px 12px;
          text-align: left;
          border-bottom: 1px solid var(--border-subtle);
        }

        th {
          color: var(--text-muted);
          font-size: 0.65rem;
          letter-spacing: 0.1em;
        }

        .status-badge {
          font-size: 0.62rem;
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          background: var(--bg-surface);
          color: var(--text-muted);
          &.done { background: rgba(120, 185, 154, 0.15); color: var(--status-success); }
        }
      }
    }

    /* Colors and Utilities */
    .text-success { color: var(--status-success); }
    .text-amber { color: var(--status-warning); }
    .text-red { color: var(--status-error); }
    .text-gold { color: var(--accent-gold); }
    .text-blue { color: #60a5fa; }
    .text-purple { color: #c084fc; }
    .text-muted { color: var(--text-muted); }
    .text-secondary { color: var(--text-secondary); }
    .text-xs { font-size: 0.7rem; }
    .w-full { width: 100%; }
    .ml-2 { margin-left: 8px; }
    .mt-2 { margin-top: 8px; }
    .mt-3 { margin-top: 12px; }
    .mb-4 { margin-bottom: 16px; }
    .btn-xs { padding: 4px 8px; font-size: 0.65rem; }
  `]
})
export class ReviewsComponent implements OnInit {
  private readonly reviewService = inject(ReviewService);

  readonly selectedDate = signal<string>(new Date().toISOString().split('T')[0]);
  readonly workspace = signal<DailyReviewWorkspace | null>(null);
  readonly loading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly successMessage = signal<string | null>(null);
  readonly history = signal<DailyReview[]>([]);
  readonly showHistoryModal = signal<boolean>(false);

  reflectionNotes = '';

  private readonly triageMap = signal<Record<string, TaskTriageState>>({});

  readonly isToday = computed(() => {
    return this.selectedDate() === new Date().toISOString().split('T')[0];
  });

  readonly completionPercentage = computed(() => {
    const ws = this.workspace();
    if (!ws) return 0;
    const total = ws.completedTasks.length + ws.unfinishedTasks.length;
    if (total === 0) return 100;
    return Math.round((ws.completedTasks.length / total) * 100);
  });

  readonly unhandledTriageCount = computed(() => {
    const ws = this.workspace();
    if (!ws) return 0;
    const map = this.triageMap();
    return ws.unfinishedTasks.filter(t => !map[t.id]?.applied).length;
  });

  readonly unhandledPercentage = computed(() => {
    const ws = this.workspace();
    if (!ws || ws.unfinishedTasks.length === 0) return 0;
    return Math.round((this.unhandledTriageCount() / ws.unfinishedTasks.length) * 100);
  });

  readonly wordCount = computed(() => {
    const text = this.reflectionNotes.trim();
    if (!text) return 0;
    return text.split(/\\s+/).length;
  });

  ngOnInit() {
    this.loadWorkspace(this.selectedDate());
    this.loadHistory();
  }

  loadWorkspace(dateStr: string) {
    this.loading.set(true);
    this.reviewService.getWorkspace(dateStr).subscribe({
      next: (ws) => {
        this.workspace.set(ws);
        this.reflectionNotes = ws.review?.reflectionNotes || '';

        // Initialize default triage states for unfinished tasks
        const tomorrow = this.getTomorrow(dateStr);
        const states: Record<string, TaskTriageState> = {};
        for (const task of ws.unfinishedTasks) {
          states[task.id] = {
            action: 'RESCHEDULE',
            rescheduleDate: tomorrow,
            rescheduleTime: task.startTime || '09:00',
            blockedReason: '',
            subtasks: [],
            applied: false
          };
        }
        this.triageMap.set(states);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load review workspace:', err);
        this.loading.set(false);
      }
    });
  }

  loadHistory() {
    this.reviewService.getHistory().subscribe({
      next: (hist) => this.history.set(hist),
      error: (err) => console.error('Failed to load review history:', err)
    });
  }

  onDateSelect(date: string) {
    if (date && date !== this.selectedDate()) {
      this.selectedDate.set(date);
      this.loadWorkspace(date);
    }
  }

  changeDate(offset: number) {
    const current = new Date(this.selectedDate());
    current.setDate(current.getDate() + offset);
    const dateStr = current.toISOString().split('T')[0];
    this.selectedDate.set(dateStr);
    this.loadWorkspace(dateStr);
  }

  goToToday() {
    const today = new Date().toISOString().split('T')[0];
    this.selectedDate.set(today);
    this.loadWorkspace(today);
  }

  getTriageState(taskId: string): TaskTriageState {
    const map = this.triageMap();
    if (!map[taskId]) {
      return {
        action: 'RESCHEDULE',
        rescheduleDate: this.getTomorrow(this.selectedDate()),
        rescheduleTime: '09:00',
        blockedReason: '',
        subtasks: [],
        applied: false
      };
    }
    return map[taskId];
  }

  getTriageAction(taskId: string): TaskTriageAction {
    return this.getTriageState(taskId).action;
  }

  isTriageApplied(taskId: string): boolean {
    return !!this.getTriageState(taskId).applied;
  }

  setTriageAction(taskId: string, action: TaskTriageAction) {
    const map = { ...this.triageMap() };
    const current = this.getTriageState(taskId);
    map[taskId] = { ...current, action, applied: false };
    this.triageMap.set(map);
  }

  updateTriageField(taskId: string, field: keyof TaskTriageState, value: any) {
    const map = { ...this.triageMap() };
    const current = this.getTriageState(taskId);
    map[taskId] = { ...current, [field]: value, applied: false };
    this.triageMap.set(map);
  }

  addSubtaskToTriage(taskId: string, title: string) {
    if (!title || !title.trim()) return;
    const map = { ...this.triageMap() };
    const current = this.getTriageState(taskId);
    map[taskId] = {
      ...current,
      subtasks: [...current.subtasks, title.trim()],
      applied: false
    };
    this.triageMap.set(map);
  }

  removeSubtaskFromTriage(taskId: string, index: number) {
    const map = { ...this.triageMap() };
    const current = this.getTriageState(taskId);
    const updated = [...current.subtasks];
    updated.splice(index, 1);
    map[taskId] = { ...current, subtasks: updated, applied: false };
    this.triageMap.set(map);
  }

  applyTriageNow(task: TaskItem) {
    const state = this.getTriageState(task.id);
    const req: TaskTriageRequest = {
      taskId: task.id,
      action: state.action,
      rescheduleDate: state.action === 'RESCHEDULE' ? state.rescheduleDate : undefined,
      rescheduleStartTime: state.action === 'RESCHEDULE' && state.rescheduleTime ? state.rescheduleTime + ':00' : undefined,
      blockedReason: state.action === 'MARK_BLOCKED' ? state.blockedReason : undefined,
      subtasks: state.action === 'BREAK_SUBTASKS' ? state.subtasks : undefined
    };

    this.reviewService.executeTriage(req).subscribe({
      next: () => {
        const map = { ...this.triageMap() };
        map[task.id] = { ...state, applied: true };
        this.triageMap.set(map);
        this.successMessage.set(`Disposition applied for '${task.title}'!`);
      },
      error: (err) => console.error('Triage execution failed:', err)
    });
  }

  saveDraft() {
    this.persistReview(false);
  }

  submitReview() {
    this.persistReview(true);
  }

  private persistReview(finalize: boolean) {
    this.saving.set(true);
    const map = this.triageMap();
    const triageActions: TaskTriageRequest[] = [];

    // Assemble unapplied triage decisions
    for (const [taskId, state] of Object.entries(map)) {
      if (!state.applied) {
        triageActions.push({
          taskId,
          action: state.action,
          rescheduleDate: state.action === 'RESCHEDULE' ? state.rescheduleDate : undefined,
          rescheduleStartTime: state.action === 'RESCHEDULE' && state.rescheduleTime ? state.rescheduleTime + ':00' : undefined,
          blockedReason: state.action === 'MARK_BLOCKED' ? state.blockedReason : undefined,
          subtasks: state.action === 'BREAK_SUBTASKS' ? state.subtasks : undefined
        });
      }
    }

    const submission: DailyReviewSubmission = {
      reviewDate: this.selectedDate(),
      reflectionNotes: this.reflectionNotes,
      triageActions: triageActions.length > 0 ? triageActions : undefined
    };

    this.reviewService.saveReview(submission).subscribe({
      next: (savedReview) => {
        this.saving.set(false);
        this.successMessage.set(
          finalize
            ? `Daily Review for ${savedReview.reviewDate} finalized and recorded successfully.`
            : `Draft saved successfully.`
        );
        this.loadWorkspace(this.selectedDate());
        this.loadHistory();
      },
      error: (err) => {
        console.error('Failed to save daily review:', err);
        this.saving.set(false);
      }
    });
  }

  openHistory() {
    this.showHistoryModal.set(true);
    this.loadHistory();
  }

  viewHistoricalDate(dateStr: string) {
    this.showHistoryModal.set(false);
    this.selectedDate.set(dateStr);
    this.loadWorkspace(dateStr);
  }

  formatMinutes(mins: number): string {
    if (!mins || mins === 0) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }

  formatTime(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  isDatePast(dateStr: string): boolean {
    if (!dateStr) return false;
    return dateStr < this.selectedDate();
  }

  private getTomorrow(dateStr: string): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }
}
