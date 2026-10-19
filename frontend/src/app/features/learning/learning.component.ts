import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-learning',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="learning-viewport">
      <div class="toolbar">
        <div>
          <span class="eyebrow">UPSKILLING & CAREER DEVELOPMENT</span>
          <h2 class="display-md">Learning Roadmaps & Revisions</h2>
        </div>
        <button type="button" class="btn btn-primary btn-sm">+ NEW ROADMAP</button>
      </div>

      <!-- Active Skill Roadmap Cards -->
      <div class="roadmaps-grid">
        @for (roadmap of roadmaps(); track roadmap.skill) {
          <div class="card card-interactive roadmap-card">
            <div class="card-header">
              <span class="badge badge-gold font-mono">{{ roadmap.targetHours }}h/WEEK TARGET</span>
              <span class="status font-mono">{{ roadmap.status }}</span>
            </div>
            <h3 class="skill-name">{{ roadmap.skill }}</h3>
            <p class="objective font-sans text-secondary text-sm">{{ roadmap.objective }}</p>

            <div class="metrics-row font-mono">
              <div>
                <span class="num text-gold-gradient">{{ roadmap.completedTopics }} / {{ roadmap.totalTopics }}</span>
                <span class="lbl">TOPICS ({{ roadmap.progressPct }}%)</span>
              </div>
              <div>
                <span class="num">{{ roadmap.loggedHours }}h</span>
                <span class="lbl">LOGGED PRACTICE</span>
              </div>
            </div>

            <div class="progress-bar-bg">
              <div class="progress-fill" [style.width.%]="roadmap.progressPct"></div>
            </div>

            <div class="next-revision-card font-mono">
              <span class="rev-title">SCHEDULED REVISION:</span>
              <span class="rev-topic">{{ roadmap.nextRevision }}</span>
            </div>
          </div>
        }
      </div>

      <!-- Practice Logs Section -->
      <section class="console-panel mt-4">
        <div class="panel-header">
          <span class="eyebrow">RECENT PRACTICE & CODING LOGS</span>
        </div>
        <div class="logs-table font-mono">
          <div class="log-row">
            <span class="log-date">2026-10-19</span>
            <span class="log-topic">Spring Boot Flyway Migrations & JPA</span>
            <span class="log-problems">2 problems solved</span>
            <span class="log-duration">60 min</span>
          </div>
          <div class="log-row">
            <span class="log-date">2026-10-18</span>
            <span class="log-topic">Java Virtual Threads & Structured Concurrency</span>
            <span class="log-problems">1 benchmark project</span>
            <span class="log-duration">90 min</span>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .learning-viewport {
      padding: var(--space-lg);
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
      overflow-y: auto;
      height: calc(100vh - var(--topbar-height));
    }
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .roadmaps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: var(--space-md);
    }
    .roadmap-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        .status { font-size: 0.62rem; color: var(--accent-gold); letter-spacing: 0.15em; }
      }
      .skill-name {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
      }
      .metrics-row {
        display: flex;
        justify-content: space-between;
        border-top: 1px solid var(--border-subtle);
        padding-top: 10px;
        .num { font-size: 1.1rem; font-weight: 700; display: block; }
        .lbl { font-size: 0.58rem; color: var(--text-muted); letter-spacing: 0.1em; }
      }
      .progress-bar-bg {
        height: 5px;
        background: var(--bg-surface-elevated);
        border-radius: var(--radius-full);
        overflow: hidden;
        .progress-fill { height: 100%; background: var(--gold-gradient); }
      }
      .next-revision-card {
        background: var(--bg-surface-elevated);
        border: 1px solid var(--border-subtle);
        border-left: 3px solid var(--accent-gold);
        border-radius: var(--radius-sm);
        padding: 8px 10px;
        font-size: 0.68rem;
        .rev-title { color: var(--text-muted); display: block; font-size: 0.58rem; letter-spacing: 0.1em; }
        .rev-topic { color: var(--text-primary); font-weight: 600; }
      }
    }
    .mt-4 { margin-top: 16px; }
    .logs-table {
      display: flex;
      flex-direction: column;
      .log-row {
        display: flex;
        justify-content: space-between;
        padding: 12px 20px;
        border-bottom: 1px solid var(--border-subtle);
        font-size: 0.75rem;
        color: var(--text-secondary);
        &:last-child { border-bottom: none; }
        .log-date { color: var(--text-muted); width: 100px; }
        .log-topic { flex: 1; color: var(--text-primary); }
        .log-problems { width: 160px; color: var(--accent-gold); }
        .log-duration { width: 80px; text-align: right; }
      }
    }
  `]
})
export class LearningComponent {
  roadmaps = signal([
    {
      skill: 'Java 21 LTS & Spring Boot Architecture',
      objective: 'Master Spring Security, Jakarta Validation, Flyway migrations, and high-performance reactive pipelines.',
      targetHours: 6,
      status: 'IN PROGRESS',
      completedTopics: 14,
      totalTopics: 28,
      progressPct: 50,
      loggedHours: 18.5,
      nextRevision: 'Virtual Threads & Structured Concurrency'
    },
    {
      skill: 'Angular 21 Standalone & Reactive Architecture',
      objective: 'Modern Angular design systems, signals, typed forms, micro-animations, and production state management.',
      targetHours: 4,
      status: 'IN PROGRESS',
      completedTopics: 8,
      totalTopics: 16,
      progressPct: 50,
      loggedHours: 12.0,
      nextRevision: 'Signal Inputs, Queries & Linked Signals'
    }
  ]);
}
