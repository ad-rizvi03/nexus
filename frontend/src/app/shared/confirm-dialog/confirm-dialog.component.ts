import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogService } from './confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (confirmService.isOpen()) {
      <div class="confirm-backdrop" (click)="confirmService.handleCancel()">
        <div class="confirm-modal card" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <div class="confirm-header">
            <div class="icon-wrap" [class.destructive]="confirmService.options().isDestructive">
              @if (confirmService.options().isDestructive) {
                <span>⚠</span>
              } @else {
                <span>?</span>
              }
            </div>
            <div class="header-text">
              <span class="eyebrow font-mono">{{ confirmService.options().isDestructive ? 'DESTRUCTIVE ACTION' : 'VERIFICATION' }}</span>
              <h3 class="modal-title font-sans">{{ confirmService.options().title }}</h3>
            </div>
          </div>

          <div class="modal-body">
            <p class="confirm-message font-sans">{{ confirmService.options().message }}</p>
          </div>

          <div class="modal-actions font-mono">
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              (click)="confirmService.handleCancel()"
            >
              {{ confirmService.options().cancelText || 'CANCEL' }}
            </button>
            <button
              type="button"
              class="btn btn-sm"
              [ngClass]="confirmService.options().isDestructive ? 'btn-error' : 'btn-primary'"
              (click)="confirmService.handleConfirm()"
            >
              {{ confirmService.options().confirmText || 'CONFIRM' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .confirm-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(11, 13, 16, 0.82);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: fadeIn 0.15s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .confirm-modal {
      width: 100%;
      max-width: 440px;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-main);
      border-radius: var(--radius-lg);
      padding: 24px;
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.65), 0 0 1px rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      gap: 16px;
      animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(8px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .confirm-header {
      display: flex;
      align-items: center;
      gap: 14px;

      .icon-wrap {
        width: 40px;
        height: 40px;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
        font-weight: 700;
        background: rgba(198, 165, 106, 0.15);
        border: 1px solid rgba(198, 165, 106, 0.35);
        color: #E5C98F;
        flex-shrink: 0;

        &.destructive {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.4);
          color: #EF4444;
        }
      }

      .header-text {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .modal-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
        }
      }
    }

    .modal-body {
      .confirm-message {
        font-size: 0.85rem;
        color: var(--text-secondary);
        line-height: 1.5;
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding-top: 14px;
      border-top: 1px solid var(--border-subtle);
    }
  `]
})
export class ConfirmDialogComponent {
  readonly confirmService = inject(ConfirmDialogService);

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.confirmService.isOpen()) return;
    if (event.key === 'Escape') {
      this.confirmService.handleCancel();
    } else if (event.key === 'Enter') {
      this.confirmService.handleConfirm();
    }
  }
}
