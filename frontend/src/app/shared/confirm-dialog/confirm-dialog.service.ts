import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  readonly isOpen = signal(false);
  readonly options = signal<ConfirmOptions>({
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmText: 'CONFIRM',
    cancelText: 'CANCEL',
    isDestructive: false
  });

  private resolveCallback?: (confirmed: boolean) => void;

  confirm(options: ConfirmOptions): Promise<boolean> {
    this.options.set({
      confirmText: options.isDestructive ? 'DELETE' : 'CONFIRM',
      cancelText: 'CANCEL',
      isDestructive: false,
      ...options
    });
    this.isOpen.set(true);

    return new Promise<boolean>((resolve) => {
      this.resolveCallback = resolve;
    });
  }

  handleConfirm(): void {
    this.isOpen.set(false);
    if (this.resolveCallback) {
      this.resolveCallback(true);
      this.resolveCallback = undefined;
    }
  }

  handleCancel(): void {
    this.isOpen.set(false);
    if (this.resolveCallback) {
      this.resolveCallback(false);
      this.resolveCallback = undefined;
    }
  }
}
