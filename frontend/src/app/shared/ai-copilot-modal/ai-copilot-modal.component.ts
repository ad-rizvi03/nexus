import { Component, EventEmitter, Input, OnInit, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService, AiResponse, YouTubeRecommendation, SuggestedModule } from '../../core/services/ai.service';
import { NoteService } from '../../core/services/note.service';
import { ToastService } from '../toast/toast.service';

export type { YouTubeRecommendation, SuggestedModule } from '../../core/services/ai.service';

@Component({
  selector: 'app-ai-copilot-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="copilot-backdrop" (click)="close()">
      <div class="copilot-modal card" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="copilot-header">
          <div class="header-left">
            <div class="ai-badge font-mono">
              <span class="ai-sparkle">✨</span>
              <span>GEMINI AI COPILOT</span>
              <span class="live-dot" title="Google Gemini 3.8 Flash Connected">● LIVE</span>
            </div>
            @if (subject) {
              <span class="context-pill font-mono">{{ contextType }}: {{ subject }}</span>
            }
          </div>
          <div class="header-right">
            <button
              type="button"
              class="btn-key-toggle font-mono"
              (click)="showKeyConfig.update(v => !v)"
              title="Configure Gemini API Key"
            >
              ⚙ API KEY
            </button>
            <button type="button" class="close-btn font-mono" (click)="close()">✕</button>
          </div>
        </div>

        <!-- Optional API Key Configuration Strip -->
        @if (showKeyConfig()) {
          <div class="api-key-panel font-mono">
            <div class="key-header">
              <span>GOOGLE GEMINI API CONFIGURATION</span>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" class="get-key-link">
                Get free Gemini Key ↗
              </a>
            </div>
            <div class="key-input-row">
              <input
                type="password"
                [(ngModel)]="customApiKey"
                placeholder="Paste your Google Gemini API key (starts with AIza...)"
                class="form-input key-input"
              />
              <button type="button" class="btn btn-secondary btn-xs" (click)="saveApiKey()">
                SAVE KEY
              </button>
              @if (customApiKey) {
                <button type="button" class="btn btn-ghost btn-xs text-error" (click)="clearApiKey()">
                  CLEAR
                </button>
              }
            </div>
            <span class="key-hint text-xs text-muted">
              {{ isKeySet() ? '✓ Custom Gemini key active' : 'Defaulting to Nexus Smart Intelligence. Enter key to connect live Gemini-1.5-Flash.' }}
            </span>
          </div>
        }

        <!-- Quick Action Prompt Chips -->
        <div class="prompt-chips font-mono">
          <button type="button" class="chip" (click)="selectChip('Estimate duration & complexity')">
            ⏱ Estimate Duration
          </button>
          <button type="button" class="chip" (click)="selectChip('Recommend best YouTube video tutorials & courses')">
            🎥 YouTube Video Recommendations
          </button>
          @if (contextType === 'TASK' || contextType === 'GENERAL') {
            <button type="button" class="chip" (click)="selectChip('Break this down into step-by-step subtasks')">
              📋 Break Down Subtasks
            </button>
          }
          @if (contextType === 'ROADMAP' || contextType === 'GENERAL') {
            <button type="button" class="chip" (click)="selectChip('Generate complete structured learning modules and roadmap')">
              🗺️ Generate Learning Modules
            </button>
          }
        </div>

        <!-- Query Input Bar -->
        <div class="query-bar">
          <input
            type="text"
            [(ngModel)]="userQuery"
            (keyup.enter)="ask()"
            class="form-input font-sans query-input"
            placeholder="Ask anything... e.g. 'How long to learn this?', 'Find YouTube tutorials', or 'Break into subtasks'"
            autofocus
          />
          <button
            type="button"
            class="btn btn-primary btn-sm font-mono send-btn"
            [disabled]="!userQuery.trim() || loading()"
            (click)="ask()"
          >
            {{ loading() ? 'THINKING...' : 'ASK GEMINI →' }}
          </button>
        </div>

        <!-- Results Viewport -->
        <div class="results-viewport">
          @if (loading()) {
            <div class="loading-state font-mono">
              <div class="spinner"></div>
              <span>QUERYING GEMINI INTELLIGENCE...</span>
            </div>
          } @else if (response()) {
            <!-- Response Content -->
            <div class="response-container">
              <!-- Meta telemetry strip -->
              <div class="telemetry-bar font-mono">
                <span class="model-tag">
                  🟢 {{ response()!.modelUsed || 'LIVE GOOGLE GEMINI' }}
                </span>
                @if (response()!.estimatedDurationMinutes) {
                  <span class="metric-pill gold">
                    ⏱ {{ response()!.estimatedDurationMinutes }} MIN ESTIMATE
                  </span>
                }
                @if (response()!.estimatedStudyHours) {
                  <span class="metric-pill blue">
                    📚 ~{{ response()!.estimatedStudyHours }} HOURS TOTAL STUDY
                  </span>
                }
              </div>

              <!-- Action Bar to Apply Direct to Forms -->
              @if (response()!.estimatedDurationMinutes || (response()!.suggestedSubtasks && response()!.suggestedSubtasks.length > 0) || (response()!.suggestedModules && response()!.suggestedModules.length > 0)) {
                <div class="quick-apply-bar font-mono">
                  <span class="apply-label">ONE-CLICK ACTIONS:</span>
                  @if (response()!.estimatedDurationMinutes) {
                    <button type="button" class="btn btn-secondary btn-xs" (click)="onApplyDuration(response()!.estimatedDurationMinutes!)">
                      ✓ APPLY {{ response()!.estimatedDurationMinutes }}m TO TASK
                    </button>
                  }
                  @if (response()!.estimatedStudyHours) {
                    <button type="button" class="btn btn-secondary btn-xs" (click)="onApplyStudyHours(response()!.estimatedStudyHours!)">
                      ✓ APPLY {{ response()!.estimatedStudyHours }}h TO ROADMAP
                    </button>
                  }
                  @if (response()!.suggestedSubtasks && response()!.suggestedSubtasks.length > 0) {
                    <button type="button" class="btn btn-secondary btn-xs" (click)="onApplySubtasks(response()!.suggestedSubtasks)">
                      ✓ IMPORT {{ response()!.suggestedSubtasks.length }} SUBTASKS
                    </button>
                  }
                  @if (response()!.suggestedModules && response()!.suggestedModules.length > 0) {
                    <button type="button" class="btn btn-secondary btn-xs" (click)="onApplyModules(response()!.suggestedModules)">
                      ✓ IMPORT {{ response()!.suggestedModules.length }} MODULES
                    </button>
                  }
                </div>
              }

              <!-- YouTube Recommendations Grid -->
              @if (response()!.youtubeRecommendations && response()!.youtubeRecommendations.length > 0) {
                <div class="yt-section font-mono">
                  <div class="section-title">
                    <span>🎥 RECOMMENDED YOUTUBE VIDEO TUTORIALS</span>
                    <span class="text-xs text-muted">Click to watch or bookmark to resources</span>
                  </div>
                  <div class="yt-grid">
                    @for (yt of response()!.youtubeRecommendations; track yt.url) {
                      <div class="yt-card">
                        <div class="yt-card-top">
                          <a [href]="yt.url" target="_blank" rel="noopener noreferrer" class="yt-title font-sans">
                            {{ yt.title }} ↗
                          </a>
                          @if (yt.duration) {
                            <span class="yt-duration">{{ yt.duration }}</span>
                          }
                        </div>
                        <div class="yt-channel text-gold font-mono">{{ yt.channel }}</div>
                        <p class="yt-desc font-sans">{{ yt.description }}</p>
                        <div class="yt-actions">
                          <a [href]="yt.url" target="_blank" rel="noopener noreferrer" class="btn-yt-watch font-mono">
                            ▶ WATCH ON YOUTUBE
                          </a>
                          <button type="button" class="btn-yt-bookmark font-mono" (click)="bookmarkYouTube(yt)">
                            + BOOKMARK TO NOTES
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Suggested Subtasks List (if present) -->
              @if (response()!.suggestedSubtasks && response()!.suggestedSubtasks.length > 0) {
                <div class="subtasks-preview font-mono">
                  <div class="section-title">
                    <span>📋 AI-GENERATED ACTIONABLE SUBTASKS</span>
                    <button type="button" class="btn-link" (click)="onApplySubtasks(response()!.suggestedSubtasks)">
                      Apply All to Task
                    </button>
                  </div>
                  <div class="subtasks-preview-list">
                    @for (st of response()!.suggestedSubtasks; track st) {
                      <div class="st-item">
                        <span class="st-bullet">▫</span>
                        <span class="st-text">{{ st }}</span>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Suggested Modules Preview (if present) -->
              @if (response()!.suggestedModules && response()!.suggestedModules.length > 0) {
                <div class="modules-preview font-mono">
                  <div class="section-title">
                    <span>🗺️ AI-GENERATED LEARNING MODULES</span>
                    <button type="button" class="btn-link" (click)="onApplyModules(response()!.suggestedModules)">
                      Apply All to Roadmap
                    </button>
                  </div>
                  <div class="modules-preview-list">
                    @for (m of response()!.suggestedModules; track m.title) {
                      <div class="mod-card">
                        <div class="mod-card-header">
                          <span class="mod-name font-sans">{{ m.title }}</span>
                          <span class="mod-hours">{{ m.estimatedHours }}h study</span>
                        </div>
                        @if (m.description) {
                          <p class="mod-desc font-sans">{{ m.description }}</p>
                        }
                        @if (m.topics && m.topics.length > 0) {
                          <div class="mod-topics">
                            @for (t of m.topics; track t) {
                              <span class="mod-topic-chip">{{ t }}</span>
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Markdown Text Answer -->
              <div class="answer-card font-sans">
                <div class="answer-header font-mono">
                  <span>ANALYSIS & DETAILED GUIDANCE</span>
                </div>
                <div class="answer-body font-sans" [innerHTML]="formatAnswerMarkdown(response()!.answer)"></div>
              </div>
            </div>
          } @else {
            <div class="empty-state font-mono">
              <span class="empty-icon">💡</span>
              <span class="empty-text">Ask Gemini anything about "{{ subject || 'your project' }}"</span>
              <span class="empty-sub">Get realistic time estimates, curated YouTube tutorials, or step-by-step breakdown.</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .copilot-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(11, 13, 16, 0.85);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 250;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .copilot-modal {
      width: 100%;
      max-width: 860px;
      height: 90vh;
      max-height: 90vh;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-main);
      border-radius: var(--radius-xl);
      padding: 24px 24px 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 32px 80px rgba(0, 0, 0, 0.9), 0 0 1px rgba(198, 165, 106, 0.5);
      overflow: hidden;
      box-sizing: border-box;
    }
    .copilot-header {
      flex-shrink: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 12px;

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .ai-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--accent-gold);
        letter-spacing: 0.1em;
        .ai-sparkle { font-size: 1rem; }
        .live-dot {
          color: #10B981;
          font-size: 0.6rem;
          margin-left: 4px;
          letter-spacing: 0.08em;
          background: rgba(16, 185, 129, 0.15);
          padding: 2px 8px;
          border-radius: var(--radius-full);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
      }
      .context-pill {
        font-size: 0.65rem;
        background: var(--bg-card);
        border: 1px solid var(--border-subtle);
        padding: 2px 10px;
        border-radius: var(--radius-full);
        color: var(--text-secondary);
        max-width: 320px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .header-right {
        display: flex;
        align-items: center;
        gap: 10px;
        .btn-key-toggle {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          color: var(--text-muted);
          font-size: 0.65rem;
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.15s ease;
          &:hover { color: var(--accent-gold); border-color: var(--accent-gold); }
        }
        .close-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 1.2rem;
          cursor: pointer;
          line-height: 1;
          padding: 4px 6px;
          border-radius: 4px;
          transition: color 0.15s ease;
          &:hover { color: var(--text-primary); }
        }
      }
    }
    .api-key-panel {
      flex-shrink: 0;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 0.68rem;
      .key-header {
        display: flex;
        justify-content: space-between;
        color: var(--accent-gold);
        .get-key-link {
          color: var(--accent-gold);
          text-decoration: underline;
        }
      }
      .key-input-row {
        display: flex;
        gap: 8px;
        .key-input {
          flex: 1;
          font-size: 0.72rem;
          height: 32px;
        }
      }
    }
    .prompt-chips {
      flex-shrink: 0;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      padding: 4px 0 6px 0;
      min-height: 34px;
      z-index: 1;

      .chip {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid var(--border-subtle);
        color: var(--text-secondary);
        font-size: 0.7rem;
        padding: 6px 12px;
        border-radius: var(--radius-full);
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.15s ease;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        line-height: 1;

        &:hover {
          background: rgba(198, 165, 106, 0.14);
          border-color: var(--accent-gold);
          color: #F4E2B2;
          transform: translateY(-1px);
        }
      }
    }
    .query-bar {
      flex-shrink: 0;
      display: flex;
      gap: 10px;
      align-items: center;
      margin-bottom: 4px;
      z-index: 2;

      .query-input {
        flex: 1;
        font-size: 0.88rem;
        padding: 11px 16px;
        border-radius: var(--radius-md);
        background: var(--bg-card);
        border: 1px solid var(--border-main);
        color: var(--text-primary);
        outline: none;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;

        &:focus {
          border-color: var(--accent-gold);
          box-shadow: 0 0 0 2px rgba(198, 165, 106, 0.2);
        }
      }
      .send-btn {
        padding: 0 20px;
        height: 42px;
        font-size: 0.75rem;
        font-weight: 700;
        white-space: nowrap;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
    }
    .results-viewport {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      padding-right: 8px;
      padding-bottom: 40px;
      display: flex;
      flex-direction: column;
      gap: 18px;

      &::-webkit-scrollbar {
        width: 6px;
      }
      &::-webkit-scrollbar-track {
        background: rgba(20, 23, 29, 0.5);
        border-radius: 4px;
      }
      &::-webkit-scrollbar-thumb {
        background: rgba(198, 165, 106, 0.35);
        border-radius: 4px;
        &:hover {
          background: var(--accent-gold);
        }
      }
    }
    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      text-align: center;
      gap: 10px;
      color: var(--text-muted);
      font-size: 0.75rem;
      .empty-icon { font-size: 2rem; }
      .empty-text { font-size: 0.85rem; color: var(--text-primary); font-weight: 500; }
      .empty-sub { font-size: 0.7rem; color: var(--text-muted); max-width: 420px; }
    }
    .response-container {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .telemetry-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      font-size: 0.65rem;
      .model-tag {
        background: var(--bg-card);
        border: 1px solid var(--border-subtle);
        padding: 4px 10px;
        border-radius: var(--radius-sm);
        color: var(--text-primary);
        font-weight: 600;
      }
      .metric-pill {
        padding: 4px 10px;
        border-radius: var(--radius-sm);
        font-weight: 600;
        &.gold { background: rgba(198, 165, 106, 0.15); border: 1px solid var(--accent-gold); color: var(--accent-gold); }
        &.blue { background: rgba(59, 130, 246, 0.15); border: 1px solid #3B82F6; color: #60A5FA; }
      }
    }
    .quick-apply-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      background: rgba(198, 165, 106, 0.08);
      border: 1px solid rgba(198, 165, 106, 0.25);
      padding: 10px 14px;
      border-radius: var(--radius-md);
      font-size: 0.68rem;
      .apply-label { color: var(--accent-gold); font-weight: 700; margin-right: 4px; }
    }
    .yt-section, .subtasks-preview, .modules-preview {
      display: flex;
      flex-direction: column;
      gap: 10px;
      .section-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.7rem;
        color: var(--accent-gold);
        letter-spacing: 0.1em;
        font-weight: 700;
        .btn-link {
          background: none;
          border: none;
          color: var(--accent-gold);
          cursor: pointer;
          font-size: 0.68rem;
          text-decoration: underline;
        }
      }
    }
    .yt-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 14px;
    }
    .yt-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: all var(--transition-fast);
      &:hover {
        border-color: rgba(198, 165, 106, 0.4);
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
      }
      .yt-card-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 8px;
        .yt-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
          text-decoration: none;
          line-height: 1.35;
          &:hover { color: var(--accent-gold); }
        }
        .yt-duration {
          font-size: 0.62rem;
          font-family: 'JetBrains Mono', monospace;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #EF4444;
          padding: 2px 6px;
          border-radius: var(--radius-xs);
          white-space: nowrap;
          flex-shrink: 0;
        }
      }
      .yt-channel { font-size: 0.72rem; }
      .yt-desc { font-size: 0.76rem; color: var(--text-secondary); line-height: 1.4; }
      .yt-actions {
        display: flex;
        gap: 10px;
        margin-top: 6px;
        flex-wrap: wrap;

        .btn-yt-watch {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(239, 68, 68, 0.16);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #FF7B7B !important;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          text-decoration: none;
          transition: all 0.15s ease;
          white-space: nowrap;

          &:hover {
            background: #EF4444;
            color: #FFFFFF !important;
            border-color: #EF4444;
            transform: translateY(-1px);
            box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
          }
        }

        .btn-yt-bookmark {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(198, 165, 106, 0.12);
          border: 1px solid rgba(198, 165, 106, 0.35);
          color: var(--accent-gold);
          font-size: 0.68rem;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;

          &:hover {
            background: var(--accent-gold);
            color: #14171D;
            border-color: var(--accent-gold);
            transform: translateY(-1px);
          }
        }
      }
    }
    .subtasks-preview-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 12px;
      .st-item {
        display: flex;
        gap: 10px;
        font-size: 0.8rem;
        color: var(--text-primary);
        line-height: 1.4;
        .st-bullet { color: var(--accent-gold); font-weight: 700; }
      }
    }
    .modules-preview-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .mod-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      .mod-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        .mod-name { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); }
        .mod-hours { font-size: 0.68rem; color: var(--accent-gold); font-weight: 700; }
      }
      .mod-desc { font-size: 0.76rem; color: var(--text-secondary); line-height: 1.4; }
      .mod-topics {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        margin-top: 4px;
        .mod-topic-chip {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          font-size: 0.65rem;
          padding: 3px 8px;
          border-radius: var(--radius-xs);
          color: var(--text-muted);
        }
      }
    }
    .answer-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      .answer-header {
        font-size: 0.68rem;
        color: var(--text-muted);
        letter-spacing: 0.1em;
        border-bottom: 1px solid var(--border-subtle);
        padding-bottom: 8px;
      }
      .answer-body {
        font-size: 0.88rem;
        color: var(--text-primary);
        line-height: 1.65;
      }
    }
  `]
})
export class AiCopilotModalComponent implements OnInit {
  @Input() subject: string = '';
  @Input() set initialSubject(val: string) {
    if (val) this.subject = val;
  }
  @Input() contextType: 'TASK' | 'ROADMAP' | 'GENERAL' = 'GENERAL';
  @Input() initialQuery: string = '';

  @Output() closeCopilot = new EventEmitter<void>();
  @Output() closeModal = new EventEmitter<void>();
  @Output() applyDuration = new EventEmitter<number>();
  @Output() applyStudyHours = new EventEmitter<number>();
  @Output() applySubtasks = new EventEmitter<string[]>();
  @Output() applyModules = new EventEmitter<SuggestedModule[]>();
  @Output() bookmarkVideo = new EventEmitter<YouTubeRecommendation>();

  private readonly aiService = inject(AiService);
  private readonly noteService = inject(NoteService);
  private readonly toastService = inject(ToastService);

  userQuery: string = '';
  loading = signal(false);
  response = signal<AiResponse | null>(null);
  showKeyConfig = signal(false);
  customApiKey: string = '';
  isKeySet = signal(false);

  ngOnInit() {
    this.customApiKey = this.aiService.getEffectiveApiKey();
    this.isKeySet.set(!!this.customApiKey);

    if (this.initialQuery) {
      this.userQuery = this.initialQuery;
      this.ask();
    } else if (this.subject) {
      if (this.contextType === 'TASK') {
        this.userQuery = `Estimate time to do "${this.subject}", break down into subtasks, and recommend top YouTube tutorials`;
      } else if (this.contextType === 'ROADMAP') {
        this.userQuery = `Estimated learning hours for "${this.subject}", suggest modules/topics, and recommend best YouTube courses`;
      }
      this.ask();
    }
  }

  selectChip(chipText: string) {
    if (this.subject) {
      this.userQuery = `${chipText} for "${this.subject}"`;
    } else {
      this.userQuery = chipText;
    }
    this.ask();
  }

  ask() {
    if (!this.userQuery.trim()) return;
    this.loading.set(true);

    this.aiService.askAi(this.userQuery.trim(), this.subject, this.contextType).subscribe({
      next: (res: AiResponse) => {
        this.response.set(res);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.loading.set(false);
        console.error('Failed to query Gemini AI in real time', err);
        const msg = err?.error?.message || err?.message || 'Failed to query live Google Gemini in real time. Please verify your connection.';
        this.toastService.error(msg, 'REAL-TIME FETCH FAILED');
      }
    });
  }

  saveApiKey() {
    this.aiService.setCustomApiKey(this.customApiKey);
    this.isKeySet.set(!!this.customApiKey.trim());
    this.showKeyConfig.set(false);
  }

  clearApiKey() {
    this.customApiKey = '';
    this.aiService.setCustomApiKey('');
    this.isKeySet.set(false);
  }

  onApplyDuration(duration: number) {
    this.applyDuration.emit(duration);
    this.close();
  }

  onApplyStudyHours(hours: number) {
    this.applyStudyHours.emit(hours);
    this.close();
  }

  onApplySubtasks(subtasks: string[]) {
    this.applySubtasks.emit(subtasks);
    this.close();
  }

  onApplyModules(modules: SuggestedModule[]) {
    this.applyModules.emit(modules);
    this.close();
  }

  bookmarkYouTube(yt: YouTubeRecommendation) {
    this.noteService.createResource({
      title: yt.title,
      url: yt.url,
      description: `${yt.channel} (${yt.duration}) - ${yt.description}`,
      resourceType: 'VIDEO'
    }).subscribe({
      next: () => {
        this.toastService.success(`Resource "${yt.title}" bookmarked into your library.`, 'BOOKMARK SAVED');
      },
      error: (err: any) => {
        console.error('Failed to bookmark YouTube resource', err);
        this.toastService.error('Could not save resource bookmark.');
      }
    });
  }

  formatAnswerMarkdown(md: string): string {
    if (!md) return '';
    // Basic formatting for bold, lists, and headers
    return md
      .replace(/### (.*?)\n/g, '<h4 class="font-bold text-base text-gold mt-2 mb-1">$1</h4>')
      .replace(/#### (.*?)\n/g, '<h5 class="font-bold text-sm text-secondary mt-2 mb-1">$1</h5>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/- \[ \] (.*?)\n/g, '<div class="py-0.5">▫ $1</div>')
      .replace(/- (.*?)\n/g, '<div class="py-0.5">• $1</div>')
      .replace(/\n\n/g, '<br/>');
  }

  close() {
    this.closeCopilot.emit();
    this.closeModal.emit();
  }
}
