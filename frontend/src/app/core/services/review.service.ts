import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TaskItem } from './task.service';

export type TaskTriageAction = 'RESCHEDULE' | 'BACKLOG' | 'MARK_BLOCKED' | 'BREAK_SUBTASKS' | 'CANCEL';

export interface TaskTriageRequest {
  taskId: string;
  action: TaskTriageAction;
  rescheduleDate?: string;
  rescheduleStartTime?: string;
  blockedReason?: string;
  subtasks?: string[];
}

export interface DailyReviewSubmission {
  reviewDate: string;
  reflectionNotes?: string;
  triageActions?: TaskTriageRequest[];
}

export interface LearningCompletedItem {
  topicId: string;
  topicTitle: string;
  moduleTitle?: string;
  roadmapSkill?: string;
  completedAt: string;
}

export interface GoalProgressedItem {
  milestoneId: string;
  milestoneTitle: string;
  goalName?: string;
  completedAt: string;
}

export interface DailyReview {
  id: string;
  reviewDate: string;
  completedTaskCount: number;
  unfinishedTaskCount: number;
  missedDeadlineCount: number;
  totalTimeTrackedMinutes: number;
  learningCompletedCount: number;
  goalsProgressedCount: number;
  habitsCompletedCount: number;
  reflectionNotes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyReviewWorkspace {
  reviewDate: string;
  completed: boolean;
  review?: DailyReview;
  completedTasks: TaskItem[];
  unfinishedTasks: TaskItem[];
  missedDeadlines: TaskItem[];
  timeTrackedMinutes: number;
  learningTopicsCompleted: LearningCompletedItem[];
  goalsProgressed: GoalProgressedItem[];
  habitsCompletedCount: number;
  totalCompletedTasks: number;
  totalUnfinishedTasks: number;
  totalMissedDeadlines: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/reviews';

  getWorkspace(date?: string): Observable<DailyReviewWorkspace> {
    let params = new HttpParams();
    if (date) {
      params = params.set('date', date);
    }
    return this.http.get<DailyReviewWorkspace>(`${this.baseUrl}/workspace`, { params });
  }

  executeTriage(request: TaskTriageRequest): Observable<TaskItem> {
    return this.http.post<TaskItem>(`${this.baseUrl}/triage`, request);
  }

  saveReview(submission: DailyReviewSubmission): Observable<DailyReview> {
    return this.http.post<DailyReview>(this.baseUrl, submission);
  }

  getHistory(): Observable<DailyReview[]> {
    return this.http.get<DailyReview[]>(`${this.baseUrl}/history`);
  }

  deleteReview(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
