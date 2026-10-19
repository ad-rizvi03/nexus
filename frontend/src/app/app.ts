import { Component, signal, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { TopbarComponent } from './layout/topbar/topbar.component';
import { CommandPaletteComponent } from './layout/command-palette/command-palette.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent, CommandPaletteComponent],
  template: `
    <div class="app-layout">
      <!-- Persistent Sidebar -->
      <app-sidebar></app-sidebar>

      <!-- Main Operational Area -->
      <div class="main-container">
        <!-- Topbar -->
        <app-topbar
          (openCommandPalette)="showCommandPalette.set(true)"
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
    </div>
  `,
  styleUrl: './app.scss'
})
export class App {
  showCommandPalette = signal(false);

  @HostListener('window:keydown', ['$event'])
  handleGlobalShortcuts(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.showCommandPalette.update(v => !v);
    }
  }

  handleQuickAdd() {
    this.showCommandPalette.set(false);
    // Navigate to tasks or open quick add
  }
}
