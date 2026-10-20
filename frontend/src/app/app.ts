import { Component, signal, HostListener, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { TopbarComponent } from './layout/topbar/topbar.component';
import { CommandPaletteComponent } from './layout/command-palette/command-palette.component';
import { QuickCaptureComponent } from './layout/quick-capture/quick-capture.component';
import { AiCopilotModalComponent } from './shared/ai-copilot-modal/ai-copilot-modal.component';
import { ToastContainerComponent } from './shared/toast/toast-container.component';
import { ConfirmDialogComponent } from './shared/confirm-dialog/confirm-dialog.component';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    TopbarComponent,
    CommandPaletteComponent,
    QuickCaptureComponent,
    AiCopilotModalComponent,
    ToastContainerComponent,
    ConfirmDialogComponent
  ],
  template: `
    @if (authService.isAuthenticated() && !isLoginRoute()) {
      <div class="app-layout">
        <!-- Persistent Console Sidebar -->
        <app-sidebar></app-sidebar>

        <!-- Main Operational Area -->
        <div class="main-container">
          <!-- Topbar -->
          <app-topbar
            (openCommandPalette)="showCommandPalette.set(true)"
            (openAiCopilot)="showAiCopilot.set(true)"
            (quickAdd)="handleQuickAdd()"
          ></app-topbar>

          <!-- Feature Viewport -->
          <main class="content-viewport">
            <router-outlet></router-outlet>
          </main>
        </div>

        <!-- Command Palette Modal -->
        @if (showCommandPalette()) {
          <app-command-palette
            (closePalette)="showCommandPalette.set(false)"
            (triggerQuickAdd)="handleQuickAdd()"
          ></app-command-palette>
        }

        <!-- Universal Quick Capture Modal -->
        @if (showQuickCapture()) {
          <app-quick-capture
            (closeCapture)="showQuickCapture.set(false)"
          ></app-quick-capture>
        }

        <!-- Universal AI Copilot Modal -->
        @if (showAiCopilot()) {
          <app-ai-copilot-modal
            [contextType]="'GENERAL'"
            (closeModal)="showAiCopilot.set(false)"
          ></app-ai-copilot-modal>
        }
      </div>
    } @else {
      <!-- Login / Registration Standalone Viewport -->
      <router-outlet></router-outlet>
    }

    <!-- Universal Overlays: Toasts and Confirm Dialog -->
    <app-toast-container></app-toast-container>
    <app-confirm-dialog></app-confirm-dialog>
  `,
  styleUrl: './app.scss'
})
export class App {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  showCommandPalette = signal(false);
  showQuickCapture = signal(false);
  showAiCopilot = signal(false);
  isLoginRoute = signal(false);

  constructor() {
    this.isLoginRoute.set(window.location.pathname.startsWith('/login'));
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((event) => {
      this.isLoginRoute.set(event.urlAfterRedirects.startsWith('/login') || event.url.startsWith('/login'));
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleGlobalShortcuts(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (this.authService.isAuthenticated()) {
        this.showCommandPalette.update(v => !v);
      }
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'j') {
      event.preventDefault();
      if (this.authService.isAuthenticated()) {
        this.showAiCopilot.update(v => !v);
      }
    }
  }

  handleQuickAdd() {
    this.showCommandPalette.set(false);
    this.showQuickCapture.set(true);
  }
}
