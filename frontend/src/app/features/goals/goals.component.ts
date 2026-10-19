import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="goals-viewport">
      <div class="toolbar">
        <div>
          <span class="eyebrow">STRATEGIC GOALS & MILESTONES</span>
          <h2 class="display-md">Long-Term Outcomes</h2>
        </div>
        <button type="button" class="btn btn-primary btn-sm">+ NEW GOAL</button>
      </div>

      <div class="goals-grid">
        @for (goal of goals(); track goal.title) {
          <div class="card card-interactive goal-card">
            <div class="goal-header">
              <span class="badge badge-gold font-mono">{{ goal.category }}</span>
              <span class="font-mono text-muted text-xs">TARGET: {{ goal.targetDate }}</span>
            </div>
            <h3 class="goal-title">{{ goal.title }}</h3>
            <p class="goal-desc text-secondary text-sm">{{ goal.description }}</p>

            <div class="progress-section">
              <div class="progress-labels font-mono">
                <span>PROGRESS</span>
                <span class="text-gold-gradient font-bold">{{ goal.progress }}%</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-fill" [style.width.%]="goal.progress"></div>
              </div>
            </div>

            <!-- Milestones checklist -->
            <div class="milestones-list font-mono">
              <div class="ms-header">MILESTONES ({{ getCompletedMilestones(goal) }}/{{ goal.milestones.length }})</div>
              @for (ms of goal.milestones; track ms.name) {
                <div class="ms-item" [class.done]="ms.completed">
                  <span class="ms-check">{{ ms.completed ? '✓' : '○' }}</span>
                  <span class="ms-name">{{ ms.name }}</span>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .goals-viewport {
      padding: var(--space-lg);
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
      height: calc(100vh - var(--topbar-height));
      overflow-y: auto;
    }
    .toolbar { display: flex; justify-content: space-between; align-items: center; }
    .goals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: var(--space-md);
    }
    .goal-card {
      display: flex;
      flex-direction: column;
      gap: 14px;
      .goal-header { display: flex; justify-content: space-between; align-items: center; }
      .goal-title { font-size: 1.25rem; font-weight: 600; color: var(--text-primary); }
      .progress-section {
        display: flex;
        flex-direction: column;
        gap: 6px;
        .progress-labels { display: flex; justify-content: space-between; font-size: 0.65rem; color: var(--text-muted); }
        .progress-bar-bg { height: 4px; background: var(--bg-surface-elevated); border-radius: var(--radius-full); overflow: hidden; .progress-fill { height: 100%; background: var(--gold-gradient); } }
      }
      .milestones-list {
        background: var(--bg-surface-elevated);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 0.7rem;
        .ms-header { font-size: 0.58rem; color: var(--text-muted); letter-spacing: 0.12em; margin-bottom: 4px; }
        .ms-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
          &.done { color: var(--text-muted); text-decoration: line-through; .ms-check { color: var(--status-success); } }
          .ms-check { font-weight: 700; width: 14px; }
        }
      }
    }
  `]
})
export class GoalsComponent {
  goals = signal([
    {
      title: 'Senior Full-Stack & Systems Architecture Competency',
      category: 'CAREER',
      targetDate: '2026-12-31',
      description: 'Ship comprehensive personal productivity application with Spring Boot, PostgreSQL, and Angular standalone architecture.',
      progress: 60,
      milestones: [
        { name: 'Phase 0: Architecture, Flyway schema & console shell', completed: true },
        { name: 'Phase 1: Session authentication & user profile', completed: true },
        { name: 'Phase 2: Task management & workload calculation', completed: false },
        { name: 'Phase 3: Schedule matrix & recurring tasks', completed: false }
      ]
    },
    {
      title: 'Algorithmic Problem Solving & System Design Mastery',
      category: 'UPSKILLING',
      targetDate: '2026-11-30',
      description: 'Solve 150 curated algorithmic problems and design 10 distributed systems architectures.',
      progress: 45,
      milestones: [
        { name: '50 Dynamic Programming & Graph problems', completed: true },
        { name: 'Concurrency & Multi-threaded problem sets', completed: false },
        { name: 'Distributed rate limiter & messaging systems', completed: false }
      ]
    }
  ]);

  getCompletedMilestones(goal: any): number {
    return goal.milestones.filter((m: any) => m.completed).length;
  }
}
