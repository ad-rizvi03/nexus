import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="true">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-card" [ngClass]="'toast-' + toast.type" (click)="dismiss(toast.id)">
          <div class="toast-indicator"></div>
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') { <span>✓</span> }
              @case ('error') { <span>✕</span> }
              @case ('warning') { <span>⚠</span> }
              @default { <span>ℹ</span> }
            }
          </div>
          <div class="toast-content">
            @if (toast.title) {
              <div class="toast-title font-mono">{{ toast.title }}</div>
            }
            <div class="toast-message font-sans">{{ toast.message }}</div>
          </div>
          <button type="button" class="toast-close" (click)="dismiss(toast.id); $event.stopPropagation()">
            ✕
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 420px;
      width: calc(100vw - 48px);
      pointer-events: none;
    }

    .toast-card {
      pointer-events: auto;
      background: rgba(20, 23, 29, 0.94);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--border-main);
      border-radius: var(--radius-md);
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.55), 0 0 1px rgba(255, 255, 255, 0.1);
      padding: 12px 14px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      position: relative;
      overflow: hidden;
      cursor: pointer;
      animation: toastIn 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      transition: transform 0.18s ease, opacity 0.18s ease;

      &:hover {
        transform: translateY(-2px);
      }
    }

    @keyframes toastIn {
      from {
        opacity: 0;
        transform: translateY(16px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .toast-indicator {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 3px;
    }

    .toast-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .toast-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;

      .toast-title {
        font-size: 0.7rem;
        letter-spacing: 0.08em;
        font-weight: 700;
      }

      .toast-message {
        font-size: 0.8rem;
        color: var(--text-secondary);
        line-height: 1.4;
      }
    }

    .toast-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.8rem;
      padding: 2px 4px;
      border-radius: 4px;
      transition: color 0.15s ease;

      &:hover {
        color: var(--text-primary);
      }
    }

    /* Type Specific Themes */
    .toast-success {
      border-color: rgba(16, 185, 129, 0.35);
      .toast-indicator { background: #10B981; }
      .toast-icon { background: rgba(16, 185, 129, 0.15); color: #10B981; }
      .toast-title { color: #10B981; }
    }

    .toast-error {
      border-color: rgba(239, 68, 68, 0.4);
      .toast-indicator { background: #EF4444; }
      .toast-icon { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
      .toast-title { color: #EF4444; }
    }

    .toast-warning {
      border-color: rgba(245, 158, 11, 0.4);
      .toast-indicator { background: #F59E0B; }
      .toast-icon { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
      .toast-title { color: #F59E0B; }
    }

    .toast-info {
      border-color: rgba(198, 165, 106, 0.4);
      .toast-indicator { background: #C6A56A; }
      .toast-icon { background: rgba(198, 165, 106, 0.15); color: #E5C98F; }
      .toast-title { color: #E5C98F; }
    }
  `]
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
