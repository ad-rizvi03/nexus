import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="review-viewport">
      <div class="review-card card">
        <span class="eyebrow">DAILY REVIEW WORKFLOW</span>
        <h2 class="display-md mt-2">End-of-Day Retrospective</h2>
        <p class="text-secondary text-sm mt-1">
          Review today's accomplishments, reschedule or reprioritize carry-forward items, and record key reflections.
        </p>

        <!-- Stats Bar -->
        <div class="summary-deck font-mono mt-4">
          <div class="stat-pill">
            <span class="num text-gold-gradient">3</span>
            <span class="lbl">COMPLETED</span>
          </div>
          <div class="stat-pill">
            <span class="num">1</span>
            <span class="lbl">UNFINISHED</span>
          </div>
          <div class="stat-pill">
            <span class="num">75m</span>
            <span class="lbl">FOCUSED TIME</span>
          </div>
        </div>

        <div class="hairline my-4"></div>

        <!-- Carry-forward resolution -->
        <div class="carry-forward-section">
          <span class="section-tag font-mono">UNFINISHED ITEMS RESOLUTION</span>
          <div class="unfinished-item">
            <div class="item-title font-sans font-medium">Solve 2 LeetCode dynamic programming problems</div>
            <div class="action-options font-mono">
              <label class="action-opt">
                <input type="radio" name="res1" value="tomorrow" checked /> Reschedule to Tomorrow
              </label>
              <label class="action-opt">
                <input type="radio" name="res1" value="backlog" /> Move to Backlog
              </label>
              <label class="action-opt">
                <input type="radio" name="res1" value="blocked" /> Mark as Blocked
              </label>
            </div>
          </div>
        </div>

        <div class="hairline my-4"></div>

        <!-- Reflection Notes -->
        <div class="form-group">
          <label class="form-label">End-of-Day Notes & Reflection</label>
          <textarea
            [(ngModel)]="reflectionText"
            class="form-textarea"
            rows="4"
            placeholder="What went well today? What slowed progress? What is tomorrow's single most important outcome?"
          ></textarea>
        </div>

        <div class="actions-strip">
          <button type="button" class="btn btn-primary" (click)="completeReview()">
            ✓ COMPLETE & SAVE REVIEW
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .review-viewport {
      padding: var(--space-lg);
      display: flex;
      justify-content: center;
      align-items: flex-start;
      height: calc(100vh - var(--topbar-height));
      overflow-y: auto;
    }
    .review-card {
      width: 100%;
      max-width: 680px;
      padding: 32px;
      margin-top: 20px;
    }
    .my-4 { margin: 18px 0; }
    .summary-deck {
      display: flex;
      gap: 16px;
      .stat-pill {
        flex: 1;
        background: var(--bg-surface-elevated);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
        padding: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        .num { font-size: 1.3rem; font-weight: 700; }
        .lbl { font-size: 0.58rem; color: var(--text-muted); letter-spacing: 0.12em; }
      }
    }
    .carry-forward-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
      .section-tag { font-size: 0.62rem; color: var(--accent-gold); letter-spacing: 0.15em; }
      .unfinished-item {
        background: var(--bg-surface-elevated);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        .action-options { display: flex; gap: 16px; font-size: 0.7rem; color: var(--text-secondary); }
        .action-opt { display: flex; align-items: center; gap: 6px; cursor: pointer; }
      }
    }
    .actions-strip { display: flex; justify-content: flex-end; margin-top: 16px; }
  `]
})
export class ReviewsComponent {
  reflectionText = '';
  completeReview() {
    alert('Daily review saved successfully.');
  }
}
