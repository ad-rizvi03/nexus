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

@Component({
  selector: 'app-learning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="learning-viewport">
      <!-- Toolbar -->
      <div class="learning-toolbar">
        <div>
          <span class="eyebrow">UPSKILLING & TECHNICAL ROADMAP CONSOLE</span>
          <h2 class="display-md">Learning Roadmaps & Topic Trees</h2>
        </div>
        <div class="toolbar-actions">
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
                <button type="button" class="btn btn-primary btn-sm font-mono" (click)="openModuleModal(curRoadmap.id)">
                  + ADD MODULE
                </button>
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
              <span class="eyebrow">NEW LEARNING ROADMAP</span>
              <button type="button" class="close-btn font-mono" (click)="showRoadmapModal = false">✕</button>
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
                  <label class="form-label font-mono">WEEKLY TARGET (HOURS)</label>
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
                <button type="submit" class="btn btn-primary btn-sm font-mono" [disabled]="!roadmapForm.skillName.trim()">CREATE ROADMAP</button>
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
              <span class="eyebrow">ADD CURRICULUM MODULE</span>
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
                <button type="submit" class="btn btn-primary btn-sm font-mono" [disabled]="!moduleForm.title.trim()">ADD MODULE</button>
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
              <span class="eyebrow">ADD TOPIC UNIT</span>
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
                <label class="form-label font-mono">ESTIMATED DURATION (MINUTES)</label>
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
                <button type="submit" class="btn btn-primary btn-sm font-mono" [disabled]="!topicForm.title.trim()">ADD TOPIC</button>
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
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
      }
    }
  `]
})
export class LearningComponent implements OnInit {
  private readonly learningService = inject(LearningService);

  readonly roadmaps = signal<Roadmap[]>([]);
  readonly revisions = signal<RevisionSession[]>([]);
  readonly practiceLogs = signal<PracticeLog[]>([]);
  readonly selectedRoadmap = signal<Roadmap | null>(null);

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

  // Modals
  openRoadmapModal() {
    this.roadmapForm = {
      skillName: '',
      objective: '',
      weeklyTargetHours: 5.0,
      targetCompletionDate: ''
    };
    this.showRoadmapModal = true;
  }

  saveRoadmap() {
    if (!this.roadmapForm.skillName.trim()) return;
    this.learningService.createRoadmap(this.roadmapForm).subscribe({
      next: (created) => {
        this.showRoadmapModal = false;
        this.loadAllData();
        this.selectedRoadmap.set(created);
      },
      error: (err) => console.error('Failed to create roadmap', err)
    });
  }

  openModuleModal(roadmapId: string) {
    this.activeRoadmapIdForModule = roadmapId;
    this.moduleForm = { title: '', description: '' };
    this.showModuleModal = true;
  }

  saveModule() {
    if (!this.moduleForm.title.trim()) return;
    this.learningService.addModule(this.activeRoadmapIdForModule, this.moduleForm).subscribe({
      next: () => {
        this.showModuleModal = false;
        this.loadAllData();
      },
      error: (err) => console.error('Failed to add module', err)
    });
  }

  openTopicModal(moduleId: string) {
    this.activeModuleIdForTopic = moduleId;
    this.topicForm = { title: '', estimatedMinutes: 45 };
    this.showTopicModal = true;
  }

  saveTopic() {
    if (!this.topicForm.title.trim()) return;
    this.learningService.addTopic(this.activeModuleIdForTopic, this.topicForm).subscribe({
      next: () => {
        this.showTopicModal = false;
        this.loadAllData();
      },
      error: (err) => console.error('Failed to add topic', err)
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
      },
      error: (err) => console.error('Failed to save practice log', err)
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
}
