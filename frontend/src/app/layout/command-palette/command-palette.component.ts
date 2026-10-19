import { Component, EventEmitter, HostListener, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface CommandAction {
  id: string;
  title: string;
  category: string;
  hotkey?: string;
  icon?: string;
  execute: () => void;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="palette-backdrop" (click)="close()">
      <div class="palette-container" (click)="$event.stopPropagation()">
        <!-- Search Input -->
        <div class="search-header">
          <span class="prompt-arrow">›</span>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Type a command or search modules..."
            class="palette-input"
            autofocus
          />
          <span class="esc-hint font-mono">ESC</span>
        </div>

        <div class="hairline"></div>

        <!-- Command List -->
        <div class="commands-list">
          @for (action of filteredCommands(); track action.id; let idx = $index) {
            <div
              class="command-item"
              [class.selected]="idx === selectedIndex"
              (click)="runCommand(action)"
              (mouseenter)="selectedIndex = idx"
            >
              <div class="item-left">
                <span class="category-tag font-mono">{{ action.category }}</span>
                <span class="command-title">{{ action.title }}</span>
              </div>
              @if (action.hotkey) {
                <span class="command-hotkey font-mono">{{ action.hotkey }}</span>
              }
            </div>
          }
          @if (filteredCommands().length === 0) {
            <div class="empty-state font-mono">
              NO MATCHING COMMANDS FOUND
            </div>
          }
        </div>

        <div class="hairline"></div>

        <!-- Palette Footer -->
        <div class="palette-footer font-mono">
          <span><span class="key">↑↓</span> NAVIGATE</span>
          <span><span class="key">↵</span> SELECT</span>
          <span><span class="key">ESC</span> CLOSE</span>
        </div>
      </div>
    </div>
  `,
  styleUrl: './command-palette.component.scss'
})
export class CommandPaletteComponent {
  @Output() closePalette = new EventEmitter<void>();
  @Output() triggerQuickAdd = new EventEmitter<void>();

  private readonly router = inject(Router);

  searchQuery = '';
  selectedIndex = 0;

  readonly commands: CommandAction[] = [
    { id: 'quick-add', title: 'Capture New Task', category: 'ACTION', hotkey: 'N', execute: () => this.triggerQuickAdd.emit() },
    { id: 'focus-start', title: 'Start 25m Focus Session', category: 'ACTION', hotkey: 'F', execute: () => this.router.navigate(['/focus']) },
    { id: 'nav-dashboard', title: 'Open Daily Operations Dashboard', category: 'NAVIGATE', hotkey: 'D', execute: () => this.router.navigate(['/dashboard']) },
    { id: 'nav-tasks', title: 'Open Task Board & Backlog', category: 'NAVIGATE', hotkey: 'T', execute: () => this.router.navigate(['/tasks']) },
    { id: 'nav-calendar', title: 'Open Schedule & Calendar', category: 'NAVIGATE', hotkey: 'C', execute: () => this.router.navigate(['/calendar']) },
    { id: 'nav-notes', title: 'Open Knowledge & Notes Library', category: 'NAVIGATE', hotkey: 'K', execute: () => this.router.navigate(['/notes']) },
    { id: 'nav-learning', title: 'Open Upskilling & Learning Roadmaps', category: 'NAVIGATE', hotkey: 'L', execute: () => this.router.navigate(['/learning']) },
    { id: 'nav-habits', title: 'Open Habit Tracker', category: 'NAVIGATE', hotkey: 'H', execute: () => this.router.navigate(['/habits']) },
    { id: 'nav-goals', title: 'Open Strategic Goals & Milestones', category: 'NAVIGATE', hotkey: 'G', execute: () => this.router.navigate(['/goals']) },
    { id: 'nav-review', title: 'Open End-of-Day Review', category: 'NAVIGATE', hotkey: 'R', execute: () => this.router.navigate(['/review']) },
    { id: 'nav-analytics', title: 'Open Workload & Productivity Analytics', category: 'NAVIGATE', hotkey: 'A', execute: () => this.router.navigate(['/analytics']) },
    { id: 'nav-settings', title: 'Open Application Settings', category: 'SYSTEM', hotkey: 'S', execute: () => this.router.navigate(['/settings']) }
  ];

  filteredCommands(): CommandAction[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.commands;
    return this.commands.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  }

  runCommand(cmd: CommandAction) {
    cmd.execute();
    this.close();
  }

  close() {
    this.closePalette.emit();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.close();
      return;
    }

    const filtered = this.filteredCommands();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedIndex = (this.selectedIndex + 1) % (filtered.length || 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedIndex = (this.selectedIndex - 1 + filtered.length) % (filtered.length || 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (filtered[this.selectedIndex]) {
        this.runCommand(filtered[this.selectedIndex]);
      }
    }
  }
}
