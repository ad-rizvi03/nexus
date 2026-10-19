import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analytics-viewport">
      <div class="toolbar">
        <div>
          <span class="eyebrow">PRODUCTIVITY TELEMETRY & INSIGHTS</span>
          <h2 class="display-md">Operational Analytics</h2>
        </div>
        <div class="date-range font-mono text-xs text-muted">TRAILING 30 DAYS</div>
      </div>

      <!-- High-level Metric Cards -->
      <div class="metrics-grid">
        <div class="card metric-card">
          <span class="eyebrow">TASK COMPLETION RATE</span>
          <div class="metric-val num-feature text-gold-gradient">88.5%</div>
          <span class="metric-sub font-mono">54 OF 61 SCHEDULED TASKS COMPLETED</span>
        </div>
        <div class="card metric-card">
          <span class="eyebrow">TOTAL STUDY & LEARNING</span>
          <div class="metric-val num-feature">34.2h</div>
          <span class="metric-sub font-mono">AVERAGE 8.5h / WEEK</span>
        </div>
        <div class="card metric-card">
          <span class="eyebrow">ESTIMATION ACCURACY</span>
          <div class="metric-val num-feature">92%</div>
          <span class="metric-sub font-mono">PLANNED VS ACTUAL TIME VARIANCE</span>
        </div>
        <div class="card metric-card">
          <span class="eyebrow">FOCUS POMODORO SESSIONS</span>
          <div class="metric-val num-feature">46</div>
          <span class="metric-sub font-mono">1,150 MINUTES IN DEEP WORK</span>
        </div>
      </div>

      <!-- Categorical breakdown -->
      <div class="card mt-4">
        <span class="eyebrow">TIME DISTRIBUTION BY CATEGORY</span>
        <div class="breakdown-list font-mono mt-3">
          <div class="breakdown-row">
            <span class="cat-label">ENGINEERING & DEVELOPMENT</span>
            <div class="bar-container"><div class="bar-fill" style="width: 55%;"></div></div>
            <span class="cat-time">55% (18.8h)</span>
          </div>
          <div class="breakdown-row">
            <span class="cat-label">TECHNICAL LEARNING & STUDY</span>
            <div class="bar-container"><div class="bar-fill" style="width: 25%;"></div></div>
            <span class="cat-time">25% (8.5h)</span>
          </div>
          <div class="breakdown-row">
            <span class="cat-label">SYSTEMS & ARCHITECTURE</span>
            <div class="bar-container"><div class="bar-fill" style="width: 12%;"></div></div>
            <span class="cat-time">12% (4.1h)</span>
          </div>
          <div class="breakdown-row">
            <span class="cat-label">PERSONAL & ROUTINES</span>
            <div class="bar-container"><div class="bar-fill" style="width: 8%;"></div></div>
            <span class="cat-time">8% (2.8h)</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-viewport {
      padding: var(--space-lg);
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
      height: calc(100vh - var(--topbar-height));
      overflow-y: auto;
    }
    .toolbar { display: flex; justify-content: space-between; align-items: center; }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-md);
      @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); }
      @media (max-width: 640px) { grid-template-columns: 1fr; }
    }
    .metric-card {
      display: flex;
      flex-direction: column;
      gap: 6px;
      .metric-val { font-size: 2rem; font-weight: 700; color: var(--text-primary); }
      .metric-sub { font-size: 0.6rem; color: var(--text-muted); letter-spacing: 0.1em; }
    }
    .mt-4 { margin-top: 16px; }
    .mt-3 { margin-top: 12px; }
    .breakdown-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      .breakdown-row {
        display: flex;
        align-items: center;
        gap: 16px;
        font-size: 0.72rem;
        .cat-label { width: 220px; color: var(--text-secondary); }
        .bar-container {
          flex: 1;
          height: 8px;
          background: var(--bg-surface-elevated);
          border-radius: var(--radius-full);
          overflow: hidden;
          .bar-fill { height: 100%; background: var(--gold-gradient); }
        }
        .cat-time { width: 100px; text-align: right; color: var(--text-primary); }
      }
    }
  `]
})
export class AnalyticsComponent {}
