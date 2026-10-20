import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LearningService,
  Roadmap,
  Module,
  Topic,
  TopicStatus,
  RevisionSession,
  PracticeLog,
  RoadmapRequest,
  ModuleRequest,
  TopicRequest,
  PracticeLogRequest
} from '../../core/services/learning.service';
import {
  AiCopilotModalComponent,
  YouTubeRecommendation,
  SuggestedModule
} from '../../shared/ai-copilot-modal/ai-copilot-modal.component';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-learning',
  standalone: true,
  imports: [CommonModule, FormsModule, AiCopilotModalComponent],
  template: `
    <div class="learning-viewport">
      <!-- Toolbar -->
      <div class="learning-toolbar">
        <div>
          <span class="eyebrow">UPSKILLING & TECHNICAL ROADMAP CONSOLE</span>
          <h2 class="display-md">Learning Roadmaps & Topic Trees</h2>
        </div>
        <div class="toolbar-actions">
          <button type="button" class="btn btn-secondary btn-sm font-mono ai-badge-btn" (click)="openAiCurriculumAdvisor()">
            ✨ AI ADVISOR & VIDEOS
          </button>
          <button type="button" class="btn btn-ghost btn-sm font-mono" (click)="openPracticeModal()">
            + LOG PRACTICE
          </button>
          <button type="button" class="btn btn-primary btn-sm font-mono" (click)="openRoadmapModal()">
            + NEW ROADMAP
          </button>
        </div>
      </div>

      <!-- Telemetry Deck -->
      <section class="telemetry-deck">
        <div class="telemetry-card">
          <div class="card-eyebrow font-mono">ACTIVE ROADMAPS</div>
          <div class="card-value num-feature text-gold-gradient">{{ roadmaps().length }}</div>
          <div class="card-caption font-mono">CAREER & ENGINEERING TRACKS</div>
        </div>

        <div class="telemetry-card">
          <div class="card-eyebrow font-mono">TOTAL TOPICS MASTERED</div>
          <div class="card-value num-feature text-gold-gradient">{{ totalCompletedTopics() }} / {{ totalTopicsCount() }}</div>
          <div class="card-caption font-mono">{{ overallProgressPercent() }}% CURRICULUM PACED</div>
          <div class="capacity-meter">
            <div class="meter-fill" [style.width.%]="overallProgressPercent()"></div>
          </div>
        </div>

        <div class="telemetry-card">
          <div class="card-eyebrow font-mono">PRACTICE TIME LOGGED</div>
          <div class="card-value num-feature">{{ totalPracticeHours() }}h</div>
          <div class="card-caption font-mono">{{ practiceLogs().length }} CODING / SYSTEM DESIGN SESSIONS</div>
        </div>

        <div class="telemetry-card" [class.alert-card]="revisions().length > 0">
          <div class="card-eyebrow font-mono">SCHEDULED REVISIONS</div>
          <div class="card-value num-feature" [class.alert-val]="revisions().length > 0">{{ revisions().length }}</div>
          <div class="card-caption font-mono">SPACED REPETITION QUEUE</div>
        </div>
      </section>

      <!-- Main Layout: Roadmaps & Topic Trees -->
      <div class="grid-workspace">
        <!-- Left: Roadmaps Overview & Topic Tree -->
        <main class="primary-column">
          <!-- Roadmap Cards Grid -->
          <div class="roadmaps-grid">
            @for (roadmap of roadmaps(); track roadmap.id) {
              <div
                class="card card-interactive roadmap-card"
                [class.selected]="selectedRoadmap()?.id === roadmap.id"
                (click)="selectRoadmap(roadmap)"
              >
                <div class="card-header">
                  <span class="badge badge-gold font-mono">{{ roadmap.weeklyTargetHours }}h/WEEK TARGET</span>
                  <span class="badge font-mono" [ngClass]="getRoadmapStatusBadgeClass(roadmap.status)">{{ roadmap.status }}</span>
                </div>

                <h3 class="skill-name">{{ roadmap.skillName }}</h3>
                @if (roadmap.objective) {
                  <p class="objective font-sans text-secondary text-sm">{{ roadmap.objective }}</p>
                }

                <div class="metrics-row font-mono">
                  <div>
                    <span class="num text-gold-gradient">{{ roadmap.completedTopics }} / {{ roadmap.totalTopics }}</span>
                    <span class="lbl">TOPICS ({{ roadmap.progressPercentage }}%)</span>
                  </div>
                  <div>
                    <span class="num">{{ (roadmap.totalPracticeMinutes / 60) | number:'1.1-1' }}h</span>
                    <span class="lbl">LOGGED PRACTICE</span>
                  </div>
                </div>

                <div class="progress-bar-bg">
                  <div class="progress-fill" [style.width.%]="roadmap.progressPercentage"></div>
                </div>

                <div class="next-revision-card font-mono">
                  <span class="rev-title">NEXT REVISION:</span>
                  <span class="rev-topic">{{ roadmap.nextScheduledRevision || 'None scheduled' }}</span>
                </div>
              </div>
            }
          </div>

          <!-- Selected Roadmap's Topic Tree Section -->
          @if (selectedRoadmap(); as curRoadmap) {
            <section class="console-panel mt-4">
              <div class="panel-header">
                <div class="panel-title-group">
                  <span class="panel-tag font-mono">TOPIC TREE</span>
                  <h3 class="panel-heading">{{ curRoadmap.skillName }} Curriculum</h3>
                </div>
                <div class="header-action-btns">
                  <button type="button" class="btn btn-ghost btn-xs font-mono" (click)="openEditRoadmapModal(curRoadmap)">
                    EDIT ROADMAP
                  </button>
                  <button type="button" class="btn btn-error btn-xs font-mono" (click)="deleteRoadmap(curRoadmap.id)">
                    DELETE ROADMAP
                  </button>
                  <button type="button" class="btn btn-primary btn-xs font-mono" (click)="openModuleModal(curRoadmap.id)">
                    + ADD MODULE
                  </button>
                </div>
              </div>

              <div class="modules-accordion">
                @for (module of curRoadmap.modules; track module.id) {
                  <div class="module-card">
                    <div class="module-header">
                      <div class="module-title-group">
                        <span class="module-order font-mono">M{{ module.sortOrder }}</span>
                        <div>
                          <h4 class="module-title">{{ module.title }}</h4>
                          @if (module.description) {
                            <p class="module-desc">{{ module.description }}</p>
                          }
                        </div>
                      </div>
                      <div class="module-actions">
                        <span class="badge font-mono" [ngClass]="getModuleStatusBadgeClass(module.status)">
                          {{ module.status }}
                        </span>
                        <button type="button" class="btn btn-ghost btn-xs font-mono" (click)="openEditModuleModal(module)">
                          EDIT
                        </button>
                        <button type="button" class="btn btn-error btn-xs font-mono" (click)="deleteModule(module.id)">
                          DEL
                        </button>
                        <button type="button" class="btn btn-ghost btn-xs font-mono" (click)="openTopicModal(module.id)">
                          + TOPIC
                        </button>
                      </div>
                    </div>

                    <!-- Topics Tree List -->
                    <div class="topics-list">
                      @for (topic of module.topics; track topic.id) {
                        <div class="topic-row" [class.completed]="topic.status === 'COMPLETED'">
                          <div class="topic-left">
                            <span class="topic-bullet font-mono">↳</span>
                            <span class="topic-title">{{ topic.title }}</span>
                            @if (topic.estimatedMinutes) {
                              <span class="topic-duration font-mono">{{ topic.estimatedMinutes }}m</span>
                            }
                          </div>

                          <div class="topic-right font-mono">
                            <select
                              [ngModel]="topic.status"
                              (ngModelChange)="changeTopicStatus(topic, $event)"
                              class="status-select font-mono"
                            >
                              <option value="NOT_STARTED">NOT STARTED</option>
                              <option value="IN_PROGRESS">IN PROGRESS</option>
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="NEEDS_REVISION">NEEDS REVISION</option>
                            </select>
                            <button
                              type="button"
                              class="btn btn-ghost btn-xs font-mono"
                              title="Edit Topic"
                              (click)="openEditTopicModal(module.id, topic)"
                            >
                              EDIT
                            </button>
                            <button
                              type="button"
                              class="btn btn-error btn-xs font-mono"
                              title="Delete Topic"
                              (click)="deleteTopic(topic.id)"
                            >
                              ✕
                            </button>
                            <button
                              type="button"
                              class="btn btn-ghost btn-xs font-mono"
                              title="Schedule Spaced Repetition"
                              (click)="quickScheduleRevision(topic)"
                            >
                              ↻ REVISE
                            </button>
                          </div>
                        </div>
                      }
                      @if (module.topics.length === 0) {
                        <div class="empty-topics font-mono">NO TOPICS ADDED YET. CLICK '+ TOPIC' ABOVE.</div>
                      }
                    </div>
                  </div>
                }
                @if (curRoadmap.modules.length === 0) {
                  <div class="empty-modules font-mono">
                    NO MODULES CREATED FOR THIS ROADMAP YET.
                    <button type="button" class="btn btn-ghost btn-sm mt-2" (click)="openModuleModal(curRoadmap.id)">
                      + ADD FIRST MODULE
                    </button>
                  </div>
                }
              </div>
            </section>
          }
        </main>

        <!-- Right: Spaced Repetitions & Practice Logs -->
        <aside class="secondary-column">
          <!-- Upcoming Revisions Widget -->
          <div class="card card-surface">
            <div class="widget-header">
              <span class="eyebrow">SPACED REPETITIONS QUEUE</span>
              <span class="badge badge-gold font-mono">{{ revisions().length }} DUE</span>
            </div>

            <div class="revisions-list">
              @for (rev of revisions(); track rev.id) {
                <div class="revision-item">
                  <button type="button" class="rev-checkbox" (click)="completeRevision(rev.id)">
                    ✓
                  </button>
                  <div class="rev-details">
                    <span class="rev-topic-name">{{ rev.topicTitle }}</span>
                    <span class="rev-meta font-mono">
                      <span>{{ rev.roadmapSkillName }}</span>
                      <span class="text-warning">· DUE {{ rev.scheduledDate }}</span>
                    </span>
                  </div>
                  <button type="button" class="rev-del-btn font-mono" (click)="deleteRevision(rev.id)" title="Cancel/Delete Revision">
                    ✕
                  </button>
                </div>
              }
              @if (revisions().length === 0) {
                <div class="empty-queue font-mono">
                  ALL SCHEDULED REVISIONS COMPLETED!
                </div>
              }
            </div>
          </div>

          <!-- Practice Coding Logs Widget -->
          <div class="card card-surface">
            <div class="widget-header">
              <span class="eyebrow">RECENT PRACTICE SESSIONS</span>
              <button type="button" class="btn btn-ghost btn-xs font-mono" (click)="openPracticeModal()">
                + LOG
              </button>
            </div>

            <div class="practice-list">
              @for (log of practiceLogs(); track log.id) {
                <div class="practice-item font-mono">
                  <div class="practice-top">
                    <span class="log-date">{{ log.logDate }}</span>
                    <span class="log-badge">{{ log.minutesSpent }} min</span>
                    <button type="button" class="log-del-btn font-mono" (click)="deletePracticeLog(log.id)" title="Delete Log">
                      ✕
                    </button>
                  </div>
                  @if (log.topicTitle || log.roadmapSkillName) {
                    <span class="log-topic-title">{{ log.topicTitle || log.roadmapSkillName }}</span>
                  }
                  @if (log.conceptSummary) {
                    <p class="log-summary">{{ log.conceptSummary }}</p>
                  }
                  @if (log.problemsSolved > 0) {
                    <span class="log-solved">✓ {{ log.problemsSolved }} problems solved</span>
                  }
                </div>
              }
              @if (practiceLogs().length === 0) {
                <div class="empty-queue font-mono">NO PRACTICE SESSIONS LOGGED YET.</div>
              }
            </div>
          </div>
        </aside>
      </div>

      <!-- New Roadmap Modal -->
      @if (showRoadmapModal) {
        <div class="modal-backdrop" (click)="showRoadmapModal = false">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <span class="eyebrow">{{ editingRoadmapId ? 'EDIT LEARNING ROADMAP' : 'NEW LEARNING ROADMAP' }}</span>
              <div class="header-modal-actions">
                <button type="button" class="btn btn-secondary btn-xs font-mono ai-badge-btn" (click)="openAiForRoadmap()">
                  ✨ AI CURRICULUM & VIDEOS
                </button>
                <button type="button" class="close-btn font-mono" (click)="showRoadmapModal = false">✕</button>
              </div>
            </div>
            <form (ngSubmit)="saveRoadmap()">
              <div class="form-group">
                <label class="form-label font-mono">SKILL OR TECHNOLOGY NAME</label>
                <input
                  type="text"
                  [(ngModel)]="roadmapForm.skillName"
                  name="skillName"
                  required
                  class="form-input"
                  placeholder="e.g. Distributed Consensus & Raft Protocol"
                  autofocus
                />
              </div>

              <div class="form-group">
                <label class="form-label font-mono">LEARNING OBJECTIVE</label>
                <textarea
                  [(ngModel)]="roadmapForm.objective"
                  name="objective"
                  rows="2"
                  class="form-input"
                  placeholder="What core architectural mastery will you achieve?"
                ></textarea>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <div class="label-with-ai-link">
                    <label class="form-label font-mono">WEEKLY TARGET (HOURS)</label>
                    <button type="button" class="ai-inline-btn font-mono" (click)="openAiForRoadmap()">✨ AI</button>
                  </div>
                  <input
                    type="number"
                    [(ngModel)]="roadmapForm.weeklyTargetHours"
                    name="weeklyTargetHours"
                    class="form-input font-mono"
                    min="1"
                    step="0.5"
                  />
                </div>
                <div class="form-group flex-1">
                  <label class="form-label font-mono">TARGET COMPLETION DATE</label>
                  <input
                    type="date"
                    [(ngModel)]="roadmapForm.targetCompletionDate"
                    name="targetCompletionDate"
                    class="form-input font-mono"
                  />
                </div>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-ghost btn-sm font-mono" (click)="showRoadmapModal = false">CANCEL</button>
                <button type="submit" class="btn btn-primary btn-sm font-mono" [disabled]="!roadmapForm.skillName.trim()">
                  {{ editingRoadmapId ? 'UPDATE ROADMAP' : 'CREATE ROADMAP' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- New Module Modal -->
      @if (showModuleModal) {
        <div class="modal-backdrop" (click)="showModuleModal = false">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <span class="eyebrow">{{ editingModuleId ? 'EDIT CURRICULUM MODULE' : 'ADD CURRICULUM MODULE' }}</span>
              <button type="button" class="close-btn font-mono" (click)="showModuleModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveModule()">
              <div class="form-group">
                <label class="form-label font-mono">MODULE TITLE</label>
                <input
                  type="text"
                  [(ngModel)]="moduleForm.title"
                  name="moduleTitle"
                  required
                  class="form-input"
                  placeholder="e.g. Advanced Concurrency Primitives"
                  autofocus
                />
              </div>

              <div class="form-group">
                <label class="form-label font-mono">DESCRIPTION</label>
                <textarea
                  [(ngModel)]="moduleForm.description"
                  name="moduleDesc"
                  rows="2"
                  class="form-input"
                  placeholder="Module objectives and key concepts"
                ></textarea>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-ghost btn-sm font-mono" (click)="showModuleModal = false">CANCEL</button>
                <button type="submit" class="btn btn-primary btn-sm font-mono" [disabled]="!moduleForm.title.trim()">
                  {{ editingModuleId ? 'UPDATE MODULE' : 'ADD MODULE' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- New Topic Modal -->
      @if (showTopicModal) {
        <div class="modal-backdrop" (click)="showTopicModal = false">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <span class="eyebrow">{{ editingTopicId ? 'EDIT TOPIC UNIT' : 'ADD TOPIC UNIT' }}</span>
              <button type="button" class="close-btn font-mono" (click)="showTopicModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveTopic()">
              <div class="form-group">
                <label class="form-label font-mono">TOPIC TITLE</label>
                <input
                  type="text"
                  [(ngModel)]="topicForm.title"
                  name="topicTitle"
                  required
                  class="form-input"
                  placeholder="e.g. Memory Barriers & JMM volatile semantics"
                  autofocus
                />
              </div>

              <div class="form-group">
                <div class="label-with-ai-link">
                  <label class="form-label font-mono">ESTIMATED DURATION (MINUTES)</label>
                  <button type="button" class="ai-inline-btn font-mono" (click)="openAiForTopic()">✨ AI Estimate</button>
                </div>
                <input
                  type="number"
                  [(ngModel)]="topicForm.estimatedMinutes"
                  name="topicEstimated"
                  class="form-input font-mono"
                  min="5"
                  step="5"
                />
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-ghost btn-sm font-mono" (click)="showTopicModal = false">CANCEL</button>
                <button type="submit" class="btn btn-primary btn-sm font-mono" [disabled]="!topicForm.title.trim()">
                  {{ editingTopicId ? 'UPDATE TOPIC' : 'ADD TOPIC' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Log Practice Modal -->
      @if (showPracticeModal) {
        <div class="modal-backdrop" (click)="showPracticeModal = false">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <span class="eyebrow">LOG PRACTICE OR STUDY SESSION</span>
              <button type="button" class="close-btn font-mono" (click)="showPracticeModal = false">✕</button>
            </div>
            <form (ngSubmit)="savePracticeLog()">
              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label font-mono">ROADMAP / SKILL</label>
                  <select [(ngModel)]="practiceForm.roadmapId" name="pRoadmap" class="form-select font-mono">
                    <option [value]="undefined">(General / None)</option>
                    @for (r of roadmaps(); track r.id) {
                      <option [value]="r.id">{{ r.skillName }}</option>
                    }
                  </select>
                </div>
                <div class="form-group flex-1">
                  <label class="form-label font-mono">MINUTES SPENT</label>
                  <input
                    type="number"
                    [(ngModel)]="practiceForm.minutesSpent"
                    name="pMinutes"
                    required
                    class="form-input font-mono"
                    min="5"
                    step="5"
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label font-mono">PROBLEMS SOLVED</label>
                  <input
                    type="number"
                    [(ngModel)]="practiceForm.problemsSolved"
                    name="pProblems"
                    class="form-input font-mono"
                    min="0"
                  />
                </div>
                <div class="form-group flex-1">
                  <label class="form-label font-mono">DATE</label>
                  <input
                    type="date"
                    [(ngModel)]="practiceForm.logDate"
                    name="pDate"
                    class="form-input font-mono"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label font-mono">CONCEPT SUMMARY</label>
                <input
                  type="text"
                  [(ngModel)]="practiceForm.conceptSummary"
                  name="pConcept"
                  class="form-input"
                  placeholder="e.g. Implemented Redlock with lettuce client and token verification"
                />
              </div>

              <div class="form-group">
                <label class="form-label font-mono">MISTAKES, GOTCHAS & LESSONS</label>
                <textarea
                  [(ngModel)]="practiceForm.mistakesAndNotes"
                  name="pMistakes"
                  rows="2"
                  class="form-input"
                  placeholder="What went wrong? What edge cases to remember for production?"
                ></textarea>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-ghost btn-sm font-mono" (click)="showPracticeModal = false">CANCEL</button>
                <button type="submit" class="btn btn-primary btn-sm font-mono" [disabled]="!practiceForm.minutesSpent">SAVE PRACTICE LOG</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- AI Copilot Modal -->
      @if (showAiModal()) {
        <app-ai-copilot-modal
          [contextType]="aiContextType()"
          [initialSubject]="aiInitialSubject()"
          (closeModal)="showAiModal.set(false)"
          (applyStudyHours)="onAiApplyStudyHours($event)"
          (applyDuration)="onAiApplyTopicDuration($event)"
          (applyModules)="onAiApplyModules($event)"
          (bookmarkVideo)="onAiBookmarkVideo($event)"
        ></app-ai-copilot-modal>
      }
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
    .learning-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      .toolbar-actions { display: flex; gap: 10px; }
    }
    .telemetry-deck {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-md);
      @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); }
      @media (max-width: 640px) { grid-template-columns: 1fr; }
    }
    .telemetry-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-main);
      border-radius: var(--radius-lg);
      padding: 18px 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: border-color var(--transition-fast);
      &:hover { border-color: var(--border-focus); }
      &.alert-card {
        border-color: rgba(215, 126, 126, 0.4);
        background: linear-gradient(180deg, rgba(215, 126, 126, 0.05) 0%, var(--bg-card) 100%);
      }
      .card-eyebrow { font-size: 0.62rem; letter-spacing: 0.2em; color: var(--text-muted); }
      .card-value {
        font-size: 1.85rem;
        color: var(--text-primary);
        line-height: 1.1;
        &.alert-val { color: var(--status-error); }
      }
      .card-caption { font-size: 0.62rem; letter-spacing: 0.1em; color: var(--text-secondary); }
      .capacity-meter {
        margin-top: 4px;
        height: 4px;
        width: 100%;
        background-color: var(--bg-surface-elevated);
        border-radius: var(--radius-full);
        overflow: hidden;
        .meter-fill {
          height: 100%;
          background: var(--gold-gradient);
          border-radius: var(--radius-full);
          transition: width var(--transition-normal);
        }
      }
    }

    .grid-workspace {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: var(--space-lg);
      @media (max-width: 1100px) { grid-template-columns: 1fr; }
    }
    .primary-column {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }
    .secondary-column {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }

    .roadmaps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: var(--space-md);
    }
    .roadmap-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      cursor: pointer;
      border: 1px solid var(--border-main);
      &.selected {
        border-color: var(--accent-gold);
        box-shadow: 0 0 12px rgba(198, 165, 106, 0.15);
      }
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .skill-name {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
      }
      .objective { line-height: 1.35; }
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

    /* TOPIC TREE MODULES ACCORDION */
    .modules-accordion {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .module-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      overflow: hidden;
      .module-header {
        background: var(--bg-surface-elevated);
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--border-subtle);
        .module-title-group {
          display: flex;
          align-items: center;
          gap: 12px;
          .module-order {
            background: var(--bg-base);
            border: 1px solid var(--border-subtle);
            color: var(--accent-gold);
            font-size: 0.65rem;
            padding: 3px 6px;
            border-radius: 4px;
            font-weight: 700;
          }
          .module-title { font-size: 0.95rem; font-weight: 600; color: var(--text-primary); }
          .module-desc { font-size: 0.72rem; color: var(--text-secondary); margin-top: 2px; }
        }
        .module-actions { display: flex; gap: 8px; align-items: center; }
      }
    }

    .topics-list {
      display: flex;
      flex-direction: column;
    }
    .topic-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px 10px 24px;
      border-bottom: 1px solid var(--border-subtle);
      transition: background var(--transition-fast);
      &:last-child { border-bottom: none; }
      &:hover { background: rgba(255, 255, 255, 0.015); }
      &.completed {
        opacity: 0.6;
        .topic-title { text-decoration: line-through; }
      }
      .topic-left {
        display: flex;
        align-items: center;
        gap: 8px;
        .topic-bullet { color: var(--text-muted); font-size: 0.8rem; }
        .topic-title { font-size: 0.85rem; color: var(--text-primary); }
        .topic-duration {
          font-size: 0.65rem;
          color: var(--text-muted);
          background: var(--bg-surface-elevated);
          padding: 1px 5px;
          border-radius: 3px;
        }
      }
      .topic-right {
        display: flex;
        align-items: center;
        gap: 8px;
        .status-select {
          background: var(--bg-surface-elevated);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          padding: 2px 6px;
          font-size: 0.62rem;
          outline: none;
        }
      }
    }
    .empty-topics, .empty-modules {
      padding: 20px;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.7rem;
    }

    /* REVISIONS WIDGET */
    .revisions-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 8px;
    }
    .revision-item {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 8px 10px;
      .rev-checkbox {
        width: 22px;
        height: 22px;
        border: 1px solid var(--accent-gold);
        background: transparent;
        color: var(--accent-gold);
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        &:hover { background: var(--accent-gold); color: var(--bg-base); }
      }
      .rev-details {
        display: flex;
        flex-direction: column;
        gap: 2px;
        .rev-topic-name { font-size: 0.8rem; color: var(--text-primary); font-weight: 500; }
        .rev-meta { font-size: 0.62rem; color: var(--text-muted); }
      }
    }
    .empty-queue {
      padding: 20px 0;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.68rem;
    }

    /* PRACTICE LIST */
    .practice-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 8px;
    }
    .practice-item {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      .practice-top {
        display: flex;
        justify-content: space-between;
        font-size: 0.65rem;
        .log-date { color: var(--text-muted); }
        .log-badge { color: var(--accent-gold); font-weight: 700; }
      }
      .log-topic-title { font-size: 0.8rem; color: var(--text-primary); font-weight: 600; }
      .log-summary { font-size: 0.72rem; color: var(--text-secondary); line-height: 1.3; }
      .log-solved { font-size: 0.65rem; color: var(--status-success); }
    }

    /* MODAL */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(11, 13, 16, 0.85);
      backdrop-filter: blur(4px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-card {
      width: 100%;
      max-width: 520px;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--accent-gold);
      border-radius: var(--radius-lg);
      padding: 24px;
      box-shadow: var(--shadow-card);
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        .close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.1rem; }
      }
      .form-row { display: flex; gap: 12px; }
      .flex-1 { flex: 1; }
      .modal-actions {
        display: flex;
        justify-content: space-end;
        gap: 10px;
        margin-top: 20px;
      }
    }
    .ai-badge-btn {
      background: linear-gradient(135deg, rgba(198, 165, 106, 0.15) 0%, rgba(229, 201, 143, 0.25) 100%);
      border: 1px solid rgba(198, 165, 106, 0.4);
      color: #E5C98F;
      font-weight: 600;
      letter-spacing: 0.08em;
      transition: all 0.2s ease;
      &:hover {
        background: linear-gradient(135deg, rgba(198, 165, 106, 0.25) 0%, rgba(229, 201, 143, 0.35) 100%);
        border-color: #C6A56A;
        box-shadow: 0 0 12px rgba(198, 165, 106, 0.25);
      }
    }
    .header-modal-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .label-with-ai-link {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
      .ai-inline-btn {
        background: none;
        border: none;
        color: var(--accent-gold);
        font-size: 0.65rem;
        cursor: pointer;
        padding: 0 4px;
        letter-spacing: 0.05em;
        &:hover {
          text-decoration: underline;
        }
      }
    }
  `]
})
export class LearningComponent implements OnInit {
  private readonly learningService = inject(LearningService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toastService = inject(ToastService);

  readonly roadmaps = signal<Roadmap[]>([]);
  readonly revisions = signal<RevisionSession[]>([]);
  readonly practiceLogs = signal<PracticeLog[]>([]);
  readonly selectedRoadmap = signal<Roadmap | null>(null);

  showAiModal = signal(false);
  aiInitialSubject = signal('');
  aiContextType = signal<'TASK' | 'ROADMAP' | 'GENERAL'>('ROADMAP');

  readonly totalTopicsCount = computed(() =>
    this.roadmaps().reduce((acc, r) => acc + (r.totalTopics || 0), 0)
  );

  readonly totalCompletedTopics = computed(() =>
    this.roadmaps().reduce((acc, r) => acc + (r.completedTopics || 0), 0)
  );

  readonly overallProgressPercent = computed(() => {
    const total = this.totalTopicsCount();
    if (total === 0) return 0;
    return Math.round((this.totalCompletedTopics() / total) * 100);
  });

  readonly totalPracticeHours = computed(() => {
    const totalMin = this.practiceLogs().reduce((acc, p) => acc + p.minutesSpent, 0);
    return Math.round((totalMin / 60) * 10) / 10;
  });

  // Modals state
  showRoadmapModal = false;
  showModuleModal = false;
  showTopicModal = false;
  showPracticeModal = false;

  editingRoadmapId: string | null = null;
  editingModuleId: string | null = null;
  editingTopicId: string | null = null;

  activeRoadmapIdForModule = '';
  activeModuleIdForTopic = '';

  roadmapForm: RoadmapRequest = {
    skillName: '',
    objective: '',
    weeklyTargetHours: 5.0,
    targetCompletionDate: ''
  };

  moduleForm: ModuleRequest = {
    title: '',
    description: ''
  };

  topicForm: TopicRequest = {
    title: '',
    estimatedMinutes: 45
  };

  practiceForm: PracticeLogRequest = {
    minutesSpent: 45,
    problemsSolved: 1,
    logDate: new Date().toISOString().substring(0, 10),
    conceptSummary: '',
    mistakesAndNotes: ''
  };

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.learningService.getRoadmaps().subscribe({
      next: (data) => {
        this.roadmaps.set(data);
        if (data.length > 0 && !this.selectedRoadmap()) {
          this.selectedRoadmap.set(data[0]);
        } else if (this.selectedRoadmap()) {
          const updated = data.find(r => r.id === this.selectedRoadmap()?.id);
          if (updated) this.selectedRoadmap.set(updated);
        }
      },
      error: (err) => console.error('Failed to load roadmaps', err)
    });

    this.learningService.getUpcomingRevisions().subscribe({
      next: (revs) => this.revisions.set(revs),
      error: (err) => console.error('Failed to load revisions', err)
    });

    this.learningService.getPracticeLogs().subscribe({
      next: (logs) => this.practiceLogs.set(logs),
      error: (err) => console.error('Failed to load practice logs', err)
    });
  }

  selectRoadmap(roadmap: Roadmap) {
    this.selectedRoadmap.set(roadmap);
  }

  changeTopicStatus(topic: Topic, newStatus: any) {
    const shouldSchedule = (newStatus === 'COMPLETED');
    this.learningService.updateTopicStatus(topic.id, newStatus, shouldSchedule).subscribe({
      next: () => this.loadAllData(),
      error: (err) => console.error('Failed to update topic status', err)
    });
  }

  quickScheduleRevision(topic: Topic) {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 3);
    const dateStr = nextDate.toISOString().substring(0, 10);
    this.learningService.scheduleRevision(topic.id, dateStr, 'Targeted spaced repetition session').subscribe({
      next: () => this.loadAllData(),
      error: (err) => console.error('Failed to schedule revision', err)
    });
  }

  completeRevision(revId: string) {
    this.learningService.completeRevision(revId).subscribe({
      next: () => this.loadAllData(),
      error: (err) => console.error('Failed to complete revision', err)
    });
  }

  // Modals & Actions
  openRoadmapModal() {
    this.editingRoadmapId = null;
    this.roadmapForm = {
      skillName: '',
      objective: '',
      weeklyTargetHours: 5.0,
      targetCompletionDate: ''
    };
    this.showRoadmapModal = true;
  }

  openEditRoadmapModal(roadmap: Roadmap) {
    this.editingRoadmapId = roadmap.id;
    this.roadmapForm = {
      skillName: roadmap.skillName,
      objective: roadmap.objective || '',
      weeklyTargetHours: roadmap.weeklyTargetHours,
      targetCompletionDate: roadmap.targetCompletionDate || ''
    };
    this.showRoadmapModal = true;
  }

  async deleteRoadmap(roadmapId: string) {
    const ok = await this.confirmDialog.confirm({
      title: 'DELETE ROADMAP',
      message: 'Are you sure you want to delete this learning roadmap and all its modules and topics? This action cannot be undone.',
      isDestructive: true,
      confirmText: 'DELETE ROADMAP'
    });
    if (!ok) return;

    this.learningService.deleteRoadmap(roadmapId).subscribe({
      next: () => {
        if (this.selectedRoadmap()?.id === roadmapId) {
          this.selectedRoadmap.set(null);
        }
        this.loadAllData();
        this.toastService.success('Roadmap permanently deleted.', 'ROADMAP DELETED');
      },
      error: (err) => {
        console.error('Failed to delete roadmap', err);
        this.toastService.error('Failed to delete roadmap.');
      }
    });
  }

  saveRoadmap() {
    if (!this.roadmapForm.skillName.trim()) return;
    if (this.editingRoadmapId) {
      this.learningService.updateRoadmap(this.editingRoadmapId, this.roadmapForm).subscribe({
        next: (updated) => {
          this.showRoadmapModal = false;
          this.loadAllData();
          this.selectedRoadmap.set(updated);
        },
        error: (err) => console.error('Failed to update roadmap', err)
      });
    } else {
      this.learningService.createRoadmap(this.roadmapForm).subscribe({
        next: (created) => {
          this.showRoadmapModal = false;
          this.loadAllData();
          this.selectedRoadmap.set(created);
        },
        error: (err) => console.error('Failed to create roadmap', err)
      });
    }
  }

  openModuleModal(roadmapId: string) {
    this.editingModuleId = null;
    this.activeRoadmapIdForModule = roadmapId;
    this.moduleForm = { title: '', description: '' };
    this.showModuleModal = true;
  }

  openEditModuleModal(mod: Module) {
    this.editingModuleId = mod.id;
    this.moduleForm = { title: mod.title, description: mod.description || '', sortOrder: mod.sortOrder };
    this.showModuleModal = true;
  }

  async deleteModule(moduleId: string) {
    const ok = await this.confirmDialog.confirm({
      title: 'DELETE MODULE',
      message: 'Are you sure you want to delete this module and all nested topics?',
      isDestructive: true,
      confirmText: 'DELETE MODULE'
    });
    if (!ok) return;

    this.learningService.deleteModule(moduleId).subscribe({
      next: () => {
        this.loadAllData();
        this.toastService.success('Module removed successfully.', 'MODULE DELETED');
      },
      error: (err) => {
        console.error('Failed to delete module', err);
        this.toastService.error('Failed to delete module.');
      }
    });
  }

  saveModule() {
    if (!this.moduleForm.title.trim()) return;
    if (this.editingModuleId) {
      this.learningService.updateModule(this.editingModuleId, this.moduleForm).subscribe({
        next: () => {
          this.showModuleModal = false;
          this.loadAllData();
        },
        error: (err) => console.error('Failed to update module', err)
      });
    } else {
      this.learningService.addModule(this.activeRoadmapIdForModule, this.moduleForm).subscribe({
        next: () => {
          this.showModuleModal = false;
          this.loadAllData();
        },
        error: (err) => console.error('Failed to add module', err)
      });
    }
  }

  openTopicModal(moduleId: string) {
    this.editingTopicId = null;
    this.activeModuleIdForTopic = moduleId;
    this.topicForm = { title: '', estimatedMinutes: 45 };
    this.showTopicModal = true;
  }

  openEditTopicModal(moduleId: string, topic: Topic) {
    this.activeModuleIdForTopic = moduleId;
    this.editingTopicId = topic.id;
    this.topicForm = { title: topic.title, estimatedMinutes: topic.estimatedMinutes || 45, sortOrder: topic.sortOrder };
    this.showTopicModal = true;
  }

  async deleteTopic(topicId: string) {
    const ok = await this.confirmDialog.confirm({
      title: 'DELETE TOPIC',
      message: 'Are you sure you want to delete this topic?',
      isDestructive: true,
      confirmText: 'DELETE TOPIC'
    });
    if (!ok) return;

    this.learningService.deleteTopic(topicId).subscribe({
      next: () => {
        this.loadAllData();
        this.toastService.success('Topic removed.', 'TOPIC DELETED');
      },
      error: (err) => {
        console.error('Failed to delete topic', err);
        this.toastService.error('Failed to delete topic.');
      }
    });
  }

  saveTopic() {
    if (!this.topicForm.title.trim()) return;
    if (this.editingTopicId) {
      this.learningService.updateTopic(this.editingTopicId, this.topicForm).subscribe({
        next: () => {
          this.showTopicModal = false;
          this.loadAllData();
        },
        error: (err) => console.error('Failed to update topic', err)
      });
    } else {
      this.learningService.addTopic(this.activeModuleIdForTopic, this.topicForm).subscribe({
        next: () => {
          this.showTopicModal = false;
          this.loadAllData();
        },
        error: (err) => console.error('Failed to add topic', err)
      });
    }
  }

  async deleteRevision(revId: string) {
    const ok = await this.confirmDialog.confirm({
      title: 'CANCEL REVISION',
      message: 'Cancel and remove this scheduled spaced-repetition revision session?',
      isDestructive: true,
      confirmText: 'CANCEL SESSION'
    });
    if (!ok) return;

    this.learningService.deleteRevision(revId).subscribe({
      next: () => {
        this.loadAllData();
        this.toastService.success('Revision session removed.', 'SESSION CANCELLED');
      },
      error: (err) => {
        console.error('Failed to delete revision', err);
        this.toastService.error('Failed to cancel revision session.');
      }
    });
  }

  openPracticeModal() {
    this.practiceForm = {
      roadmapId: this.selectedRoadmap()?.id,
      minutesSpent: 45,
      problemsSolved: 1,
      logDate: new Date().toISOString().substring(0, 10),
      conceptSummary: '',
      mistakesAndNotes: ''
    };
    this.showPracticeModal = true;
  }

  savePracticeLog() {
    this.learningService.createPracticeLog(this.practiceForm).subscribe({
      next: () => {
        this.showPracticeModal = false;
        this.loadAllData();
        this.toastService.success('Practice session recorded.', 'LOG SAVED');
      },
      error: (err) => {
        console.error('Failed to save practice log', err);
        this.toastService.error('Failed to save practice log.');
      }
    });
  }

  async deletePracticeLog(logId: string) {
    const ok = await this.confirmDialog.confirm({
      title: 'DELETE PRACTICE RECORD',
      message: 'Delete this practice log record?',
      isDestructive: true,
      confirmText: 'DELETE RECORD'
    });
    if (!ok) return;

    this.learningService.deletePracticeLog(logId).subscribe({
      next: () => {
        this.loadAllData();
        this.toastService.success('Practice record deleted.', 'RECORD DELETED');
      },
      error: (err) => {
        console.error('Failed to delete practice log', err);
        this.toastService.error('Failed to delete practice log.');
      }
    });
  }

  getRoadmapStatusBadgeClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'badge-success';
      case 'IN_PROGRESS': return 'badge-gold';
      case 'PAUSED': return 'badge-neutral';
      default: return 'badge-neutral';
    }
  }

  getModuleStatusBadgeClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'badge-success';
      case 'IN_PROGRESS': return 'badge-gold';
      default: return 'badge-neutral';
    }
  }

  openAiCurriculumAdvisor() {
    this.aiContextType.set('ROADMAP');
    const selected = this.selectedRoadmap();
    this.aiInitialSubject.set(selected ? selected.skillName : (this.roadmapForm.skillName || 'Full Stack Software Engineering'));
    this.showAiModal.set(true);
  }

  openAiForRoadmap() {
    this.aiContextType.set('ROADMAP');
    this.aiInitialSubject.set(this.roadmapForm.skillName || 'Engineering Mastery Track');
    this.showAiModal.set(true);
  }

  openAiForTopic() {
    this.aiContextType.set('TASK');
    this.aiInitialSubject.set(this.topicForm.title || 'Technical Concept');
    this.showAiModal.set(true);
  }

  onAiApplyStudyHours(hours: number) {
    this.roadmapForm.weeklyTargetHours = Math.max(2, Math.round((hours / 4) * 10) / 10);
  }

  onAiApplyTopicDuration(minutes: number) {
    this.topicForm.estimatedMinutes = minutes;
  }

  onAiApplyModules(modules: SuggestedModule[]) {
    const roadmap = this.selectedRoadmap();
    if (!roadmap) {
      const summary = modules.map(m => `• ${m.title} (~${m.estimatedHours}h): ${m.topics.join(', ')}`).join('\n');
      this.roadmapForm.objective = this.roadmapForm.objective
        ? `${this.roadmapForm.objective}\n\nCurriculum Outline:\n${summary}`
        : `Curriculum Outline:\n${summary}`;
      return;
    }

    modules.forEach((mod: SuggestedModule, modIdx: number) => {
      this.learningService.addModule(roadmap.id, {
        title: mod.title,
        description: mod.description,
        sortOrder: modIdx + 1
      }).subscribe({
        next: (createdMod: Module) => {
          mod.topics.forEach((topicTitle: string, topicIdx: number) => {
            this.learningService.addTopic(createdMod.id, {
              title: topicTitle,
              estimatedMinutes: Math.round((mod.estimatedHours / Math.max(1, mod.topics.length)) * 60) || 60,
              sortOrder: topicIdx + 1
            }).subscribe({
              next: () => this.loadAllData()
            });
          });
        }
      });
    });
  }

  onAiBookmarkVideo(video: YouTubeRecommendation) {
    const note = `\n\n📌 Recommended Tutorial: [${video.title}](${video.url}) (${video.channel} - ${video.duration})`;
    this.roadmapForm.objective = (this.roadmapForm.objective || '') + note;
  }
}
