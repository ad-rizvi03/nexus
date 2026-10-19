import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HealthService } from '../../core/services/health.service';

export interface TaskSummary {
  id: string;
  title: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TO_DO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED';
  estimatedMinutes: number;
  deadline?: string;
  plannedDate?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-viewport">
      <!-- Top Operational Telemetry Bar -->
      <section class="telemetry-deck">
        <div class="telemetry-card">
          <div class="card-eyebrow font-mono">TIME PLANNED TODAY</div>
          <div class="card-value num-feature text-gold-gradient">{{ plannedMinutesToday() }}m</div>
          <div class="card-caption font-mono">CAPACITY: {{ availableMinutesToday }}m ({{ capacityRemaining() }}m REMAINING)</div>
          <div class="capacity-meter">
            <div class="meter-fill" [style.width.%]="capacityPercentage()"></div>
          </div>
        </div>

        <div class="telemetry-card">
          <div class="card-eyebrow font-mono">TASKS ACTIVE TODAY</div>
          <div class="card-value num-feature">{{ activeTasksCount() }}</div>
          <div class="card-caption font-mono">{{ completedTasksCount() }} COMPLETED · {{ inProgressCount() }} IN PROGRESS</div>
        </div>

        <div class="telemetry-card" [class.alert-card]="overdueTasks().length > 0">
          <div class="card-eyebrow font-mono">OVERDUE ITEMS</div>
          <div class="card-value num-feature" [class.alert-val]="overdueTasks().length > 0">{{ overdueTasks().length }}</div>
          <div class="card-caption font-mono">REQUIRES ATTENTION & RESCHEDULING</div>
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
                <div class="task-meta font-mono">
                  <span class="meta-item">CATEGORY: {{ task.category }}</span>
                  <span class="meta-item">ESTIMATED: {{ task.estimatedMinutes }}m</span>
                  @if (task.deadline) {
                    <span class="meta-item text-warning">DUE: {{ task.deadline }}</span>
                  }
                </div>
              </div>
              <div class="banner-actions">
                <button type="button" class="btn btn-gold btn-sm" (click)="markComplete(task.id)">
                  ✓ MARK COMPLETED
                </button>
                <button type="button" class="btn btn-ghost btn-sm" routerLink="/focus">
                  START FOCUS (25m)
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
              <button type="button" class="btn btn-ghost btn-sm" routerLink="/tasks">
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
                      <span class="category-chip">{{ task.category }}</span>
                      <span>· {{ task.estimatedMinutes }}m</span>
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
                  <button type="button" class="btn btn-ghost btn-sm mt-2" routerLink="/tasks">
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
                        <span class="text-error">DEADLINE PASSED: {{ task.deadline }}</span>
                        <span>· {{ task.estimatedMinutes }}m</span>
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
            <a routerLink="/review" class="btn btn-primary btn-sm mt-3 w-full">
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
  readonly healthService = inject(HealthService);

  readonly availableMinutesToday = 240; // 4 hours user available study/focus time
  readonly weeklyTargetHours = 10.0;

  readonly todayTasks = signal<TaskSummary[]>([
    { id: '1', title: 'Implement Flyway schema and verify PostgreSQL indexes', category: 'Engineering', priority: 'HIGH', status: 'COMPLETED', estimatedMinutes: 45 },
    { id: '2', title: 'Complete Angular console shell & command palette navigation', category: 'Engineering', priority: 'HIGH', status: 'IN_PROGRESS', estimatedMinutes: 60 },
    { id: '3', title: 'Review Spring Security session management and CORS policy', category: 'Security', priority: 'MEDIUM', status: 'TO_DO', estimatedMinutes: 30 },
    { id: '4', title: 'Solve 2 LeetCode dynamic programming problems', category: 'Learning', priority: 'MEDIUM', status: 'TO_DO', estimatedMinutes: 50, deadline: '22:00' }
  ]);

  readonly overdueTasks = signal<TaskSummary[]>([
    { id: '5', title: 'Update project dependencies documentation in ARCHITECTURE.md', category: 'Personal', priority: 'LOW', status: 'TO_DO', estimatedMinutes: 20, deadline: 'Yesterday' }
  ]);

  readonly habits = signal([
    { name: 'Morning Code & System Design Practice', streak: 12, completed: true },
    { name: '45-Minute Focus Session without distraction', streak: 8, completed: true },
    { name: 'Technical Reading / Documentation Review', streak: 5, completed: false }
  ]);

  nextActionTask = signal<TaskSummary | null>(null);

  ngOnInit() {
    this.refreshNextAction();
  }

  plannedMinutesToday(): number {
    return this.todayTasks()
      .filter(t => t.status !== 'COMPLETED')
      .reduce((acc, t) => acc + t.estimatedMinutes, 0);
  }

  capacityRemaining(): number {
    return Math.max(0, this.availableMinutesToday - this.plannedMinutesToday());
  }

  capacityPercentage(): number {
    return Math.min(100, Math.round((this.plannedMinutesToday() / this.availableMinutesToday) * 100));
  }

  activeTasksCount(): number {
    return this.todayTasks().filter(t => t.status !== 'COMPLETED').length;
  }

  completedTasksCount(): number {
    return this.todayTasks().filter(t => t.status === 'COMPLETED').length;
  }

  inProgressCount(): number {
    return this.todayTasks().filter(t => t.status === 'IN_PROGRESS').length;
  }

  weeklyLearningHours(): number {
    return 6.5;
  }

  learningProgressPercent(): number {
    return Math.round((this.weeklyLearningHours() / this.weeklyTargetHours) * 100);
  }

  refreshNextAction() {
    const active = this.todayTasks().find(t => t.status === 'IN_PROGRESS') ||
                   this.todayTasks().find(t => t.status === 'TO_DO');
    this.nextActionTask.set(active || null);
  }

  toggleTaskStatus(task: TaskSummary) {
    const updated = this.todayTasks().map(t => {
      if (t.id === task.id) {
        const nextStatus = t.status === 'COMPLETED' ? 'TO_DO' : 'COMPLETED';
        return { ...t, status: nextStatus as any };
      }
      return t;
    });
    this.todayTasks.set(updated);
    this.refreshNextAction();
  }

  markComplete(taskId: string) {
    const updated = this.todayTasks().map(t => {
      if (t.id === taskId) {
        return { ...t, status: 'COMPLETED' as const };
      }
      return t;
    });
    this.todayTasks.set(updated);
    this.refreshNextAction();
  }

  rescheduleToToday(taskId: string) {
    const target = this.overdueTasks().find(t => t.id === taskId);
    if (target) {
      this.overdueTasks.set(this.overdueTasks().filter(t => t.id !== taskId));
      this.todayTasks.update(list => [...list, { ...target, plannedDate: 'Today' }]);
      this.refreshNextAction();
    }
  }

  toggleHabit(habit: any) {
    habit.completed = !habit.completed;
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
