import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PlannerService,
  SmartPlanResponse,
  SmartPlanSlot,
  ApplyPlanRequest,
  NaturalLanguageParsed,
  ReminderItem
} from '../../core/services/planner.service';
import { TaskService } from '../../core/services/task.service';

@Component({
  selector: 'app-planner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="planner-viewport">
      <!-- Toolbar Header -->
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="eyebrow font-mono">RULE-BASED SMART DAILY PLANNER</span>
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
          @if (plan()) {
            <span
              class="capacity-pill"
              [class.optimal]="plan()!.status !== 'OVERLOADED'"
              [class.overloaded]="plan()!.status === 'OVERLOADED'"
            >
              ● {{ plan()!.status === 'OVERLOADED' ? 'OVERLOAD WARNING (' + plan()!.overloadMinutes + 'm excess)' : 'CAPACITY BALANCED' }}
            </span>
          }

          <button
            type="button"
            class="btn btn-secondary btn-sm"
            (click)="activeTab.set(activeTab() === 'schedule' ? 'reminders' : 'schedule')"
          >
            {{ activeTab() === 'schedule' ? '🔔 NOTIFICATIONS & REMINDERS' : '📅 BACK TO SCHEDULE' }}
          </button>

          <button
            type="button"
            class="btn btn-primary btn-sm"
            [disabled]="applying() || !hasAcceptedSlots()"
            (click)="applyAcceptedSchedule()"
          >
            {{ applying() ? 'APPLYING...' : '✓ APPLY ACCEPTED SCHEDULE' }}
          </button>
        </div>
      </div>

      <!-- Notification Alerts -->
      @if (alertMessage()) {
        <div class="alert-banner font-mono" [class.error]="alertIsError()">
          <span>{{ alertIsError() ? '✕' : '✓' }} {{ alertMessage() }}</span>
          <button type="button" class="close-alert" (click)="alertMessage.set(null)">✕</button>
        </div>
      }

      @if (activeTab() === 'schedule') {
        <!-- Natural Language Quick Entry Strip (Section 15.2) -->
        <div class="card nl-card font-mono">
          <div class="nl-header">
            <span class="eyebrow text-gold">NATURAL LANGUAGE QUICK CAPTURE</span>
            <span class="nl-hint">Type natural schedule entries like "Study Spring Boot tomorrow for 45 minutes at 10am urgent"</span>
          </div>
          <div class="nl-input-row">
            <span class="prompt-icon">›</span>
            <input
              type="text"
              [(ngModel)]="nlInput"
              (ngModelChange)="onNlInputChange($event)"
              (keyup.enter)="createFromNl()"
              placeholder="e.g. Study Spring Boot tomorrow for 45 minutes at 10am urgent..."
              class="nl-input font-sans"
            />
            <button
              type="button"
              class="btn btn-primary btn-sm"
              [disabled]="!nlParsed() || creatingNl()"
              (click)="createFromNl()"
            >
              {{ creatingNl() ? 'SCHEDULING...' : '+ QUICK SCHEDULE' }}
            </button>
          </div>

          @if (nlParsed()) {
            <div class="nl-preview-deck">
              <span class="preview-tag font-bold">INTERPRETATION:</span>
              <span class="preview-item"><strong>Title:</strong> {{ nlParsed()!.title }}</span>
              <span class="preview-item"><strong>Date:</strong> {{ nlParsed()!.plannedDate }}</span>
              @if (nlParsed()!.startTime) {
                <span class="preview-item"><strong>Time:</strong> {{ nlParsed()!.startTime }}</span>
              }
              <span class="preview-item"><strong>Duration:</strong> {{ nlParsed()!.estimatedDurationMinutes }}m</span>
              <span class="preview-item priority font-bold" [class]="nlParsed()!.priority.toLowerCase()">
                {{ nlParsed()!.priority }}
              </span>
              <span class="preview-confidence text-muted">({{ nlParsed()!.confidence }} confidence)</span>
            </div>
          }
        </div>

        @if (loading()) {
          <div class="loading-state font-mono">
            <div class="spinner"></div>
            <span>ANALYZING CONSTRAINTS & GENERATING OPTIMAL SCHEDULE...</span>
          </div>
        } @else if (plan()) {
          <!-- Availability & Workload Telemetry Deck -->
          <div class="summary-deck">
            <div class="metric-card card">
              <div class="metric-top font-mono">
                <span class="metric-label">WORK HOURS & COMMUTE</span>
                <span class="metric-badge blue">WINDOW</span>
              </div>
              <div class="metric-body">
                <span class="metric-value font-mono">
                  {{ plan()!.workStartTime }} - {{ plan()!.workEndTime }}
                </span>
                <span class="metric-sub font-mono">{{ plan()!.commuteMinutes }}m commute buffer</span>
              </div>
            </div>

            <div class="metric-card card">
              <div class="metric-top font-mono">
                <span class="metric-label">AVAILABLE CAPACITY</span>
                <span class="metric-badge green">CAPACITY</span>
              </div>
              <div class="metric-body">
                <span class="metric-value font-mono text-success">
                  {{ formatMinutes(plan()!.availableCapacityMinutes) }}
                </span>
                <span class="metric-sub font-mono">configured availability</span>
              </div>
            </div>

            <div class="metric-card card">
              <div class="metric-top font-mono">
                <span class="metric-label">TOTAL PLANNED WORK</span>
                <span class="metric-badge gold">PLANNED</span>
              </div>
              <div class="metric-body">
                <span class="metric-value font-mono text-gold-gradient">
                  {{ formatMinutes(plan()!.totalPlannedDurationMinutes) }}
                </span>
                <span class="metric-sub font-mono">{{ plan()!.slots.length }} tasks scheduled</span>
              </div>
            </div>

            <div class="metric-card card">
              <div class="metric-top font-mono">
                <span class="metric-label">CAPACITY DELTA</span>
                <span
                  class="metric-badge"
                  [class.amber]="plan()!.overloadMinutes > 0"
                  [class.green]="plan()!.overloadMinutes === 0"
                >
                  {{ plan()!.overloadMinutes > 0 ? 'OVERLOAD' : 'BALANCED' }}
                </span>
              </div>
              <div class="metric-body">
                <span
                  class="metric-value font-mono"
                  [class.text-amber]="plan()!.overloadMinutes > 0"
                  [class.text-success]="plan()!.overloadMinutes === 0"
                >
                  {{ plan()!.overloadMinutes > 0 ? '+' + plan()!.overloadMinutes + 'm' : 'ON TRACK' }}
                </span>
                <span class="metric-sub font-mono">
                  {{ plan()!.overloadMinutes > 0 ? 'Exceeds target availability' : 'Comfortable velocity buffer' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Main Schedule Timeline View -->
          <div class="card timeline-card">
            <div class="timeline-header">
              <div>
                <span class="eyebrow font-mono text-gold">CHRONOLOGICAL SCHEDULE</span>
                <h3 class="panel-title font-sans">
                  Proposed Daily Timeline
                  <span class="badge-count font-mono">{{ plan()!.slots.length }}</span>
                </h3>
              </div>
              <div class="timeline-controls font-mono">
                <button type="button" class="btn btn-secondary btn-xs" (click)="toggleAllSlots(true)">
                  SELECT ALL
                </button>
                <button type="button" class="btn btn-secondary btn-xs" (click)="toggleAllSlots(false)">
                  DESELECT ALL
                </button>
              </div>
            </div>

            @if (plan()!.slots.length === 0) {
              <div class="empty-state font-mono">
                <div class="empty-icon">✓</div>
                <div class="empty-text">No active tasks scheduled for {{ selectedDate() }}.</div>
                <div class="empty-sub">Use the quick capture bar above to add an assignment or task.</div>
              </div>
            } @else {
              <div class="timeline-list">
                @for (slot of plan()!.slots; track slot.slotId) {
                  <div
                    class="timeline-slot"
                    [class.accepted]="isSlotAccepted(slot.slotId)"
                    [class.overloaded]="slot.rationale.includes('Exceeds standard daily capacity')"
                  >
                    <div class="slot-checkbox font-mono">
                      <label class="custom-checkbox">
                        <input
                          type="checkbox"
                          [checked]="isSlotAccepted(slot.slotId)"
                          (change)="toggleSlotAccepted(slot.slotId)"
                        />
                        <span class="checkmark"></span>
                      </label>
                    </div>

                    <div class="slot-time font-mono">
                      <span class="start-time">{{ slot.startTime }}</span>
                      <span class="separator">↓</span>
                      <span class="end-time">{{ slot.endTime }}</span>
                      <span class="duration-tag font-mono">{{ slot.durationMinutes }}m</span>
                    </div>

                    <div class="slot-content">
                      <div class="slot-top">
                        <span class="priority-pill font-mono" [class]="slot.priority.toLowerCase()">
                          {{ slot.priority }}
                        </span>
                        @if (slot.categoryName) {
                          <span
                            class="category-pill font-mono"
                            [style.borderColor]="slot.categoryColor"
                            [style.color]="slot.categoryColor"
                          >
                            {{ slot.categoryName }}
                          </span>
                        }
                        <span class="block-tag font-mono">{{ slot.slotType }}</span>
                        <h4 class="slot-title font-sans">{{ slot.taskTitle }}</h4>
                      </div>

                      <div class="slot-rationale font-mono">
                        <span class="rationale-icon">💡</span>
                        <span class="rationale-text">{{ slot.rationale }}</span>
                      </div>
                    </div>

                    <div class="slot-action font-mono">
                      <span class="disposition-pill" [class.accepted]="isSlotAccepted(slot.slotId)">
                        {{ isSlotAccepted(slot.slotId) ? 'PROPOSED' : 'SKIPPED' }}
                      </span>
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Planning Rules Explanations Drawer -->
            <div class="rules-footer font-mono">
              <span class="footer-title">SECTION 15 PLANNING RULES APPLIED:</span>
              <div class="rules-grid">
                @for (rule of plan()!.rulesApplied; track $index) {
                  <div class="rule-item">✓ {{ rule }}</div>
                }
              </div>
            </div>
          </div>
        }
      } @else {
        <!-- Reminders & Notifications Management Panel (Section 14) -->
        <div class="reminders-panel">
          <!-- SMTP Email Configuration Test Card -->
          <div class="card config-card mb-4">
            <div class="panel-header">
              <div>
                <span class="eyebrow font-mono text-gold">SECTION 14 NOTIFICATION DISPATCH</span>
                <h3 class="panel-title font-sans">SMTP Notification Channel & Test Dispatch</h3>
              </div>
            </div>

            <div class="config-body font-mono">
              <p class="config-desc font-sans text-sm text-secondary">
                The application dispatches task deadline notifications, morning agendas, and review alerts.
                You can trigger an explicit test email to verify your transport without disclosing credentials.
              </p>

              <div class="test-email-strip">
                <input
                  type="email"
                  [(ngModel)]="testRecipientEmail"
                  placeholder="Recipient email address..."
                  class="form-input email-input font-mono"
                />
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  [disabled]="sendingTestEmail()"
                  (click)="sendTestEmail()"
                >
                  {{ sendingTestEmail() ? 'DISPATCHING...' : '✉ SEND TEST EMAIL' }}
                </button>
              </div>

              @if (testEmailResult()) {
                <div class="result-box font-mono" [class.success]="testEmailResult()!.success">
                  <span>{{ testEmailResult()!.success ? '✓' : '✕' }} {{ testEmailResult()!.message }}</span>
                  @if (testEmailResult()!.simulated) {
                    <span class="simulated-pill">LOCAL SIMULATED RECORD</span>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Active Reminders Queue Table -->
          <div class="card queue-card">
            <div class="panel-header">
              <div>
                <span class="eyebrow font-mono text-gold">PERSISTENT REMINDER QUEUE</span>
                <h3 class="panel-title font-sans">
                  Active Scheduled Reminders
                  <span class="badge-count font-mono">{{ reminders().length }}</span>
                </h3>
              </div>
              <button type="button" class="btn btn-secondary btn-xs font-mono" (click)="processQueueNow()">
                ⚡ RUN DISPATCH WORKER NOW
              </button>
            </div>

            @if (reminders().length === 0) {
              <div class="empty-state font-mono">
                <div class="empty-text">Reminder queue is empty.</div>
                <div class="empty-sub">Scheduled reminders will appear here when deadlines approach.</div>
              </div>
            } @else {
              <table class="reminders-table font-mono">
                <thead>
                  <tr>
                    <th>TYPE</th>
                    <th>TASK DELIVERABLE</th>
                    <th>SCHEDULED TIME</th>
                    <th>STATUS</th>
                    <th>ATTEMPTS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  @for (r of reminders(); track r.id) {
                    <tr>
                      <td class="font-bold">{{ r.notificationType }}</td>
                      <td class="task-cell font-sans">{{ r.taskTitle || 'General Briefing' }}</td>
                      <td>{{ formatTimestamp(r.scheduledAt) }}</td>
                      <td>
                        <span class="status-badge" [class]="r.status.toLowerCase()">
                          {{ r.status }}
                        </span>
                      </td>
                      <td>{{ r.attemptCount }}</td>
                      <td>
                        @if (r.status === 'PENDING') {
                          <button
                            type="button"
                            class="btn btn-danger btn-xs"
                            (click)="cancelReminder(r.id)"
                          >
                            CANCEL
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .planner-viewport {
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

        .capacity-pill {
          font-size: 0.68rem;
          letter-spacing: 0.08em;
          padding: 6px 12px;
          border-radius: 9999px;
          &.optimal {
            background: rgba(120, 185, 154, 0.12);
            color: var(--status-success);
            border: 1px solid rgba(120, 185, 154, 0.3);
          }
          &.overloaded {
            background: rgba(216, 172, 102, 0.12);
            color: var(--status-warning);
            border: 1px solid rgba(216, 172, 102, 0.3);
          }
        }
      }
    }

    /* Natural Language Card */
    .nl-card {
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;

      .nl-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        .nl-hint { font-size: 0.65rem; color: var(--text-muted); }
      }

      .nl-input-row {
        display: flex;
        align-items: center;
        gap: 10px;

        .prompt-icon { color: var(--accent-gold); font-size: 1.2rem; font-weight: 700; }
        .nl-input {
          flex: 1;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          outline: none;
          &:focus { border-color: var(--accent-gold); }
        }
      }

      .nl-preview-deck {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        font-size: 0.7rem;
        background: var(--bg-surface);
        padding: 6px 12px;
        border-radius: var(--radius-sm);
        border: 1px dashed var(--border-subtle);

        .preview-tag { color: var(--accent-gold); font-size: 0.62rem; }
        .preview-item { color: var(--text-secondary); strong { color: var(--text-primary); } }
        .priority.urgent { color: var(--status-error); }
        .priority.high { color: var(--status-warning); }
        .priority.medium { color: #60a5fa; }
        .priority.low { color: var(--text-muted); }
      }
    }

    /* Summary Deck */
    .summary-deck {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px;

      .metric-card {
        padding: 16px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 8px;

        .metric-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          .metric-label { font-size: 0.62rem; color: var(--text-muted); letter-spacing: 0.12em; }
          .metric-badge {
            font-size: 0.58rem;
            padding: 2px 6px;
            border-radius: var(--radius-sm);
            &.blue { background: rgba(96, 165, 250, 0.15); color: #60a5fa; }
            &.green { background: rgba(120, 185, 154, 0.15); color: var(--status-success); }
            &.gold { background: rgba(198, 165, 106, 0.15); color: var(--accent-gold); }
            &.amber { background: rgba(216, 172, 102, 0.15); color: var(--status-warning); }
          }
        }

        .metric-body {
          display: flex;
          flex-direction: column;
          gap: 2px;
          .metric-value { font-size: 1.4rem; font-weight: 700; }
          .metric-sub { font-size: 0.65rem; color: var(--text-secondary); }
        }
      }
    }

    /* Timeline Card */
    .timeline-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;

      .timeline-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
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
          background: rgba(198, 165, 106, 0.18);
          color: var(--accent-gold);
          padding: 2px 8px;
          border-radius: 9999px;
        }

        .timeline-controls {
          display: flex;
          gap: 6px;
        }
      }
    }

    .timeline-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .timeline-slot {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 14px 18px;
      display: grid;
      grid-template-columns: 36px 110px 1fr 90px;
      align-items: center;
      gap: 16px;
      transition: all 0.2s ease;

      &.accepted {
        border-color: rgba(198, 165, 106, 0.4);
      }

      &.overloaded {
        border-color: rgba(216, 172, 102, 0.4);
      }

      .slot-time {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1px;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text-primary);
        .separator { font-size: 0.65rem; color: var(--accent-gold); line-height: 1; }
        .duration-tag { font-size: 0.62rem; color: var(--text-muted); font-weight: normal; }
      }

      .slot-content {
        display: flex;
        flex-direction: column;
        gap: 6px;

        .slot-top {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;

          .slot-title { font-size: 0.95rem; font-weight: 600; margin: 0; color: var(--text-primary); }
        }

        .slot-rationale {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          color: var(--text-secondary);
          background: var(--bg-surface);
          padding: 4px 8px;
          border-radius: var(--radius-sm);
        }
      }

      .priority-pill {
        font-size: 0.58rem;
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        font-weight: 600;
        &.urgent { background: rgba(215, 126, 126, 0.2); color: var(--status-error); }
        &.high { background: rgba(216, 172, 102, 0.2); color: var(--status-warning); }
        &.medium { background: rgba(96, 165, 250, 0.2); color: #60a5fa; }
        &.low { background: rgba(160, 166, 176, 0.2); color: var(--text-muted); }
      }

      .category-pill {
        font-size: 0.58rem;
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        border: 1px solid;
      }

      .block-tag {
        font-size: 0.58rem;
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        background: var(--bg-surface);
        color: var(--text-muted);
      }

      .disposition-pill {
        font-size: 0.65rem;
        padding: 4px 8px;
        border-radius: var(--radius-sm);
        background: var(--bg-surface);
        color: var(--text-muted);
        text-align: center;
        &.accepted {
          background: rgba(198, 165, 106, 0.15);
          color: var(--accent-gold);
          border: 1px solid rgba(198, 165, 106, 0.3);
        }
      }
    }

    .rules-footer {
      border-top: 1px solid var(--border-subtle);
      padding-top: 14px;
      font-size: 0.7rem;
      .footer-title { color: var(--accent-gold); font-size: 0.65rem; font-weight: 600; margin-bottom: 6px; display: block; }
      .rules-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 6px;
        .rule-item { color: var(--text-secondary); }
      }
    }

    /* Reminders Table */
    .reminders-panel {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .config-card, .queue-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .test-email-strip {
      display: flex;
      gap: 10px;
      margin-top: 10px;
      .email-input { flex: 1; font-size: 0.85rem; }
    }

    .result-box {
      margin-top: 10px;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      background: rgba(216, 172, 102, 0.1);
      border: 1px solid rgba(216, 172, 102, 0.3);
      color: var(--status-warning);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;

      &.success {
        background: rgba(120, 185, 154, 0.1);
        border-color: rgba(120, 185, 154, 0.3);
        color: var(--status-success);
      }

      .simulated-pill {
        font-size: 0.62rem;
        background: var(--bg-surface);
        padding: 2px 6px;
        border-radius: var(--radius-sm);
      }
    }

    .reminders-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.75rem;

      th, td {
        padding: 10px 12px;
        text-align: left;
        border-bottom: 1px solid var(--border-subtle);
      }

      th { color: var(--text-muted); font-size: 0.65rem; }
      .task-cell { font-size: 0.85rem; font-weight: 500; }

      .status-badge {
        font-size: 0.62rem;
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        &.sent { background: rgba(120, 185, 154, 0.15); color: var(--status-success); }
        &.pending { background: rgba(216, 172, 102, 0.15); color: var(--status-warning); }
        &.failed { background: rgba(215, 126, 126, 0.15); color: var(--status-error); }
        &.cancelled { background: var(--bg-surface); color: var(--text-muted); }
      }
    }

    /* Checkbox styling */
    .custom-checkbox {
      display: flex;
      align-items: center;
      cursor: pointer;
      input { cursor: pointer; width: 18px; height: 18px; accent-color: var(--accent-gold); }
    }

    /* Common */
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
      &.error {
        background: rgba(215, 126, 126, 0.1);
        border-color: rgba(215, 126, 126, 0.3);
        color: var(--status-error);
      }
      .close-alert { background: transparent; border: none; color: inherit; cursor: pointer; }
    }

    .loading-state {
      padding: 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: var(--text-muted);
      font-size: 0.75rem;
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

    .empty-state {
      padding: 30px;
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

    .text-success { color: var(--status-success); }
    .text-amber { color: var(--status-warning); }
    .text-gold { color: var(--accent-gold); }
    .text-blue { color: #60a5fa; }
    .btn-xs { padding: 4px 8px; font-size: 0.65rem; }
    .mb-4 { margin-bottom: 16px; }
  `]
})
export class PlannerComponent implements OnInit {
  private readonly plannerService = inject(PlannerService);
  private readonly taskService = inject(TaskService);

  readonly selectedDate = signal<string>(new Date().toISOString().split('T')[0]);
  readonly plan = signal<SmartPlanResponse | null>(null);
  readonly loading = signal<boolean>(false);
  readonly applying = signal<boolean>(false);
  readonly alertMessage = signal<string | null>(null);
  readonly alertIsError = signal<boolean>(false);

  readonly activeTab = signal<'schedule' | 'reminders'>('schedule');

  // Accepted Slots State
  readonly acceptedSlots = signal<Record<string, boolean>>({});

  // Natural Language State
  nlInput = '';
  readonly nlParsed = signal<NaturalLanguageParsed | null>(null);
  readonly creatingNl = signal<boolean>(false);

  // Reminders Tab State
  readonly reminders = signal<ReminderItem[]>([]);
  testRecipientEmail = '';
  readonly sendingTestEmail = signal<boolean>(false);
  readonly testEmailResult = signal<{ success: boolean; message: string; simulated: boolean } | null>(null);

  readonly isToday = computed(() => {
    return this.selectedDate() === new Date().toISOString().split('T')[0];
  });

  readonly hasAcceptedSlots = computed(() => {
    const p = this.plan();
    if (!p) return false;
    const map = this.acceptedSlots();
    return p.slots.some(s => map[s.slotId] !== false);
  });

  ngOnInit() {
    this.loadPlan(this.selectedDate());
    this.loadReminders();
  }

  loadPlan(dateStr: string) {
    this.loading.set(true);
    this.plannerService.getDailyPlan(dateStr).subscribe({
      next: (resp) => {
        this.plan.set(resp);
        // Default: accept all slots that fit in capacity
        const map: Record<string, boolean> = {};
        for (const s of resp.slots) {
          map[s.slotId] = s.accepted;
        }
        this.acceptedSlots.set(map);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load daily plan:', err);
        this.loading.set(false);
      }
    });
  }

  loadReminders() {
    this.plannerService.getReminders().subscribe({
      next: (list) => this.reminders.set(list),
      error: (err) => console.error('Failed to load reminders:', err)
    });
  }

  onDateSelect(date: string) {
    if (date && date !== this.selectedDate()) {
      this.selectedDate.set(date);
      this.loadPlan(date);
    }
  }

  changeDate(offset: number) {
    const current = new Date(this.selectedDate());
    current.setDate(current.getDate() + offset);
    const dateStr = current.toISOString().split('T')[0];
    this.selectedDate.set(dateStr);
    this.loadPlan(dateStr);
  }

  goToToday() {
    const today = new Date().toISOString().split('T')[0];
    this.selectedDate.set(today);
    this.loadPlan(today);
  }

  isSlotAccepted(slotId: string): boolean {
    const map = this.acceptedSlots();
    return map[slotId] !== false;
  }

  toggleSlotAccepted(slotId: string) {
    const map = { ...this.acceptedSlots() };
    map[slotId] = !this.isSlotAccepted(slotId);
    this.acceptedSlots.set(map);
  }

  toggleAllSlots(accept: boolean) {
    const p = this.plan();
    if (!p) return;
    const map: Record<string, boolean> = {};
    for (const s of p.slots) {
      map[s.slotId] = accept;
    }
    this.acceptedSlots.set(map);
  }

  applyAcceptedSchedule() {
    const p = this.plan();
    if (!p) return;

    this.applying.set(true);
    const acceptedList = p.slots.filter(s => this.isSlotAccepted(s.slotId) && s.taskId);

    const req: ApplyPlanRequest = {
      targetDate: this.selectedDate(),
      slots: acceptedList.map(s => ({
        taskId: s.taskId!,
        startTime: s.startTime ? s.startTime + ':00' : '09:00:00',
        endTime: s.endTime ? s.endTime + ':00' : '10:00:00',
        plannedDate: this.selectedDate()
      }))
    };

    this.plannerService.applyPlan(req).subscribe({
      next: (res) => {
        this.applying.set(false);
        this.alertIsError.set(false);
        this.alertMessage.set(`Applied scheduled times to ${res.appliedCount} tasks!`);
        this.loadPlan(this.selectedDate());
      },
      error: (err) => {
        console.error('Failed to apply schedule:', err);
        this.applying.set(false);
        this.alertIsError.set(true);
        this.alertMessage.set('Failed to apply schedule.');
      }
    });
  }

  onNlInputChange(val: string) {
    if (!val || val.trim().length < 4) {
      this.nlParsed.set(null);
      return;
    }

    this.plannerService.parseNaturalLanguage(val).subscribe({
      next: (parsed) => this.nlParsed.set(parsed),
      error: (err) => console.error('NL Parse error:', err)
    });
  }

  createFromNl() {
    const parsed = this.nlParsed();
    if (!parsed) return;

    this.creatingNl.set(true);
    this.taskService.createTask({
      title: parsed.title,
      plannedDate: parsed.plannedDate,
      startTime: parsed.startTime ? parsed.startTime + ':00' : undefined,
      estimatedDurationMinutes: parsed.estimatedDurationMinutes,
      priority: parsed.priority,
      status: 'TO_DO'
    }).subscribe({
      next: () => {
        this.creatingNl.set(false);
        this.nlInput = '';
        this.nlParsed.set(null);
        this.alertIsError.set(false);
        this.alertMessage.set(`Scheduled new task: '${parsed.title}'!`);
        this.loadPlan(this.selectedDate());
      },
      error: (err) => {
        console.error('Failed to create task from NL:', err);
        this.creatingNl.set(false);
        this.alertIsError.set(true);
        this.alertMessage.set('Failed to create task.');
      }
    });
  }

  sendTestEmail() {
    this.sendingTestEmail.set(true);
    this.plannerService.sendTestEmail(this.testRecipientEmail || undefined).subscribe({
      next: (result) => {
        this.sendingTestEmail.set(false);
        this.testEmailResult.set(result);
        this.loadReminders();
      },
      error: (err) => {
        console.error('Test email failed:', err);
        this.sendingTestEmail.set(false);
        this.testEmailResult.set({ success: false, message: err.message || 'Dispatch failed', simulated: false });
      }
    });
  }

  cancelReminder(id: string) {
    this.plannerService.cancelReminder(id).subscribe({
      next: () => this.loadReminders(),
      error: (err) => console.error('Failed to cancel reminder:', err)
    });
  }

  processQueueNow() {
    this.plannerService.processReminders().subscribe({
      next: (res) => {
        this.alertIsError.set(false);
        this.alertMessage.set(`Queue processed: ${res.processedCount} reminders dispatched.`);
        this.loadReminders();
      },
      error: (err) => console.error('Queue processing failed:', err)
    });
  }

  formatMinutes(mins: number): string {
    if (!mins || mins === 0) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }

  formatTimestamp(isoString: string): string {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
