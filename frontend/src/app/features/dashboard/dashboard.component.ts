import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TaskService, TaskItem, DashboardTodayResponse } from '../../core/services/task.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-viewport">
      <!-- Top Operational Telemetry Bar -->
      <section class="telemetry-deck">
        <div class="telemetry-card" [class.alert-card]="isOverloaded()">
          <div class="card-eyebrow font-mono">TIME PLANNED TODAY</div>
          <div class="card-value num-feature" [class.text-gold-gradient]="!isOverloaded()" [class.text-error]="isOverloaded()">
            {{ plannedMinutesToday() }}m
          </div>
          <div class="card-caption font-mono">
            CAPACITY: {{ availableMinutesToday() }}m ({{ remainingMinutes() }}m {{ isOverloaded() ? 'OVERLOAD' : 'REMAINING' }})
          </div>
          <div class="capacity-meter">
            <div
              class="meter-fill"
              [class.meter-overload]="isOverloaded()"
              [style.width.%]="capacityPercentage()"
            ></div>
          </div>
        </div>

        <div class="telemetry-card">
          <div class="card-eyebrow font-mono">TASKS ACTIVE TODAY</div>
          <div class="card-value num-feature">{{ activeTasksCount() }}</div>
          <div class="card-caption font-mono">
            {{ completedTasksCount() }} COMPLETED · {{ inProgressCount() }} IN PROGRESS
          </div>
        </div>

        <div class="telemetry-card" [class.alert-card]="overdueTasks().length > 0">
          <div class="card-eyebrow font-mono">OVERDUE ITEMS</div>
          <div class="card-value num-feature" [class.alert-val]="overdueTasks().length > 0">
            {{ overdueTasks().length }}
          </div>
          <div class="card-caption font-mono">
            {{ overdueTasks().length > 0 ? 'REQUIRES ATTENTION & RESCHEDULING' : 'BACKLOG IN GOOD ORDER' }}
          </div>
        </div>

        <div class="telemetry-card">
          <div class="card-eyebrow font-mono">WEEKLY LEARNING</div>
          <div class="card-value num-feature text-gold-gradient">{{ weeklyLearningHours() }}h</div>
          <div class="card-caption font-mono">TARGET: {{ weeklyTargetHours }}h · {{ learningProgressPercent() }}% PACED</div>
        </div>
      </section>

      <!-- Main Operational Split Layout -->
      <div class="grid-workspace">
        <!-- Left / Center Column: Next Action & Today's Agenda -->
        <main class="primary-column">
          <!-- Next Up Priority Banner -->
          @if (nextActionTask(); as task) {
            <section class="priority-banner">
              <div class="banner-header">
                <span class="eyebrow">NEXT ACTIONABLE TASK</span>
                <span class="badge badge-gold font-mono">{{ task.priority }} PRIORITY</span>
              </div>
              <div class="banner-content">
                <h2 class="task-title">{{ task.title }}</h2>
                @if (task.description) {
                  <p class="task-desc">{{ task.description }}</p>
                }
                <div class="task-meta font-mono">
                  @if (task.category) {
                    <span class="meta-item">CATEGORY: {{ task.category.name }}</span>
                  }
                  <span class="meta-item">ESTIMATED: {{ task.estimatedDurationMinutes || 45 }}m</span>
                  @if (task.deadlineDate) {
                    <span class="meta-item text-warning">DUE: {{ task.deadlineDate }}</span>
                  }
                </div>
              </div>
              <div class="banner-actions">
                <button type="button" class="btn btn-gold btn-sm font-mono" (click)="markComplete(task.id)">
                  ✓ MARK COMPLETED
                </button>
                <button type="button" class="btn btn-ghost btn-sm font-mono" routerLink="/focus">
                  START FOCUS ({{ task.estimatedDurationMinutes || 25 }}m)
                </button>
              </div>
            </section>
          }

          <!-- Today's Planned Tasks Section -->
          <section class="console-panel">
            <div class="panel-header">
              <div class="panel-title-group">
                <span class="panel-tag font-mono">AGENDA</span>
                <h3 class="panel-heading">Planned For Today</h3>
              </div>
              <button type="button" class="btn btn-ghost btn-sm font-mono" routerLink="/tasks">
                VIEW ALL TASKS →
              </button>
            </div>

            <div class="task-table">
              @for (task of todayTasks(); track task.id) {
                <div class="task-row" [class.done]="task.status === 'COMPLETED'">
                  <button type="button" class="check-box" (click)="toggleTaskStatus(task)">
                    @if (task.status === 'COMPLETED') { <span>✓</span> }
                  </button>
                  <div class="task-info">
                    <span class="title">{{ task.title }}</span>
                    <span class="tag-row font-mono">
                      @if (task.category) {
                        <span class="category-chip" [style.color]="task.category.color || 'var(--accent-gold)'">
                          {{ task.category.name }}
                        </span>
                      }
                      <span>· {{ task.estimatedDurationMinutes || 45 }}m</span>
                      @if (task.subtasks && task.subtasks.length > 0) {
                        <span>· {{ getCompletedSubtaskCount(task) }}/{{ task.subtasks.length }} subtasks</span>
                      }
                    </span>
                  </div>
                  <span class="badge font-mono" [ngClass]="getPriorityBadgeClass(task.priority)">
                    {{ task.priority }}
                  </span>
                  <span class="badge font-mono" [ngClass]="getStatusBadgeClass(task.status)">
                    {{ task.status }}
                  </span>
                </div>
              }
              @if (todayTasks().length === 0) {
                <div class="empty-agenda font-mono">
                  <span>NO TASKS SCHEDULED FOR TODAY.</span>
                  <button type="button" class="btn btn-ghost btn-sm mt-2 font-mono" routerLink="/tasks">
                    + PLAN WORK FROM BACKLOG
                  </button>
                </div>
              }
            </div>
          </section>

          <!-- Overdue Items Panel if any -->
          @if (overdueTasks().length > 0) {
            <section class="console-panel alert-border">
              <div class="panel-header">
                <div class="panel-title-group">
                  <span class="panel-tag font-mono text-error">CRITICAL</span>
                  <h3 class="panel-heading">Overdue Backlog Requiring Attention</h3>
                </div>
              </div>
              <div class="task-table">
                @for (task of overdueTasks(); track task.id) {
                  <div class="task-row alert-row">
                    <div class="task-info">
                      <span class="title">{{ task.title }}</span>
                      <span class="tag-row font-mono">
                        <span class="text-error">DEADLINE PASSED: {{ task.deadlineDate }}</span>
                        <span>· {{ task.estimatedDurationMinutes || 45 }}m</span>
                      </span>
                    </div>
                    <div class="row-actions">
                      <button type="button" class="btn btn-ghost btn-sm font-mono" (click)="rescheduleToToday(task.id)">
                        MOVE TO TODAY
                      </button>
                    </div>
                  </div>
                }
              </div>
            </section>
          }
        </main>

        <!-- Right Column: Secondary Widgets & Insights -->
        <aside class="secondary-column">
          <!-- Active Learning Progress Widget -->
          <div class="card card-surface">
            <div class="widget-header">
              <span class="eyebrow">ACTIVE LEARNING ROADMAP</span>
              <span class="badge badge-gold font-mono">JAVA 21 & SPRING</span>
            </div>
            <div class="roadmap-preview">
              <div class="roadmap-stat">
                <span class="stat-num num-feature text-gold-gradient">14 / 28</span>
                <span class="stat-desc font-mono">TOPICS MASTERED (50%)</span>
              </div>
              <div class="progress-track">
                <div class="progress-bar" style="width: 50%;"></div>
              </div>
              <div class="next-revision font-mono">
                <span class="label">NEXT SCHEDULED REVISION:</span>
                <span class="val">Virtual Threads & Concurrency</span>
              </div>
              <a routerLink="/learning" class="link-subtle font-mono">VIEW FULL ROADMAP →</a>
            </div>
          </div>

          <!-- Habit Consistency Widget -->
          <div class="card card-surface">
            <div class="widget-header">
              <span class="eyebrow">DAILY ROUTINES & HABITS</span>
              <span class="font-mono text-muted text-xs">TODAY</span>
            </div>
            <div class="habits-list">
              @for (habit of habits(); track habit.name) {
                <div class="habit-item" (click)="toggleHabit(habit)">
                  <span class="habit-box" [class.checked]="habit.completed">
                    @if (habit.completed) { ✓ }
                  </span>
                  <span class="habit-name">{{ habit.name }}</span>
                  <span class="habit-streak font-mono">{{ habit.streak }}d streak</span>
                </div>
              }
            </div>
          </div>

          <!-- End of Day Review Prompt -->
          <div class="card card-surface review-card">
            <span class="eyebrow">DAY CLOSE</span>
            <h4 class="font-serif text-lg mt-1">End-of-Day Review</h4>
            <p class="text-secondary text-xs mt-1">
              Review completed work, reflect on mistakes, and manage carry-forward without endless accumulation.
            </p>
            <a routerLink="/review" class="btn btn-primary btn-sm mt-3 w-full font-mono">
              START DAILY REVIEW
            </a>
          </div>
        </aside>
      </div>
    </div>
  `,
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly taskService = inject(TaskService);

  readonly weeklyTargetHours = 10.0;

  readonly dashboardData = signal<DashboardTodayResponse | null>(null);
  readonly loading = signal(true);

  readonly habits = signal([
    { name: 'Morning Code & System Design Practice', streak: 12, completed: true },
    { name: '45-Minute Focus Session without distraction', streak: 8, completed: true },
    { name: 'Technical Reading / Documentation Review', streak: 5, completed: false }
  ]);

  readonly todayTasks = computed<TaskItem[]>(() => this.dashboardData()?.todayTasks || []);
  readonly overdueTasks = computed<TaskItem[]>(() => this.dashboardData()?.overdueTasks || []);
  readonly inProgressTasks = computed<TaskItem[]>(() => this.dashboardData()?.inProgressTasks || []);

  readonly plannedMinutesToday = computed(() => this.dashboardData()?.totalPlannedMinutesToday ?? 0);
  readonly availableMinutesToday = computed(() => this.dashboardData()?.availableMinutesToday ?? 120);
  readonly remainingMinutes = computed(() => this.dashboardData()?.remainingCapacityMinutes ?? 0);
  readonly isOverloaded = computed(() => this.dashboardData()?.isOverloaded ?? false);
  readonly activeTasksCount = computed(() => this.dashboardData()?.activeCountToday ?? 0);
  readonly completedTasksCount = computed(() => this.dashboardData()?.completedCountToday ?? 0);
  readonly inProgressCount = computed(() => this.inProgressTasks().length);

  readonly capacityPercentage = computed(() => {
    const planned = this.plannedMinutesToday();
    const available = this.availableMinutesToday();
    if (!available || available === 0) return 0;
    return Math.min(100, Math.round((planned / available) * 100));
  });

  readonly nextActionTask = computed<TaskItem | null>(() => {
    const inProg = this.inProgressTasks();
    if (inProg.length > 0) return inProg[0];
    const pending = this.todayTasks().find(t => t.status === 'TO_DO');
    return pending || null;
  });

  ngOnInit() {
    this.refreshDashboard();
  }

  refreshDashboard() {
    this.taskService.getDashboardToday().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load dashboard data', err);
        this.loading.set(false);
      }
    });
  }

  weeklyLearningHours(): number {
    return 6.5;
  }

  learningProgressPercent(): number {
    return Math.round((this.weeklyLearningHours() / this.weeklyTargetHours) * 100);
  }

  toggleTaskStatus(task: TaskItem) {
    const nextStatus = task.status === 'COMPLETED' ? 'TO_DO' : 'COMPLETED';
    this.taskService.updateStatus(task.id, nextStatus).subscribe({
      next: () => this.refreshDashboard(),
      error: (err) => console.error('Failed to toggle task status', err)
    });
  }

  markComplete(taskId: string) {
    this.taskService.updateStatus(taskId, 'COMPLETED').subscribe({
      next: () => this.refreshDashboard(),
      error: (err) => console.error('Failed to mark task complete', err)
    });
  }

  rescheduleToToday(taskId: string) {
    const today = new Date().toISOString().substring(0, 10);
    this.taskService.updateTask(taskId, { plannedDate: today }).subscribe({
      next: () => this.refreshDashboard(),
      error: (err) => console.error('Failed to reschedule task', err)
    });
  }

  toggleHabit(habit: any) {
    habit.completed = !habit.completed;
  }

  getCompletedSubtaskCount(task: TaskItem): number {
    return (task.subtasks || []).filter(s => s.completed).length;
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
}
