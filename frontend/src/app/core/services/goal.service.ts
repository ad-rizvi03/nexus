import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type GoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';
export type ScheduleHealth = 'ON_TRACK' | 'APPROACHING_DEADLINE' | 'OVERDUE' | 'COMPLETED';

export interface GoalMilestone {
  id: string;
  goalId: string;
  title: string;
  targetDate: string | null;
  completed: boolean;
  completedAt: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface Goal {
  id: string;
  name: string;
  description: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  targetDate: string | null;
  status: GoalStatus;
  progressPercentage: number;
  reviewNotes: string | null;
  scheduleHealth: ScheduleHealth;
  milestones: GoalMilestone[];
  totalMilestones: number;
  completedMilestones: number;
  linkedTasksCount: number;
  completedTasksCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoalSummary {
  totalGoals: number;
  inProgressGoals: number;
  completedGoals: number;
  averageProgress: number;
  onTrackCount: number;
  approachingDeadlineCount: number;
  overdueCount: number;
  goals: Goal[];
}

export interface GoalMilestoneRequest {
  title: string;
  targetDate?: string | null;
  completed?: boolean;
  sortOrder?: number;
}

export interface GoalRequest {
  name: string;
  description?: string;
  categoryId?: string | null;
  targetDate?: string | null;
  status?: GoalStatus;
  reviewNotes?: string;
  milestones?: GoalMilestoneRequest[];
}

@Injectable({
  providedIn: 'root'
})
export class GoalService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/goals';

  getGoals(): Observable<GoalSummary> {
    return this.http.get<GoalSummary>(this.baseUrl);
  }

  getGoalById(id: string): Observable<Goal> {
    return this.http.get<Goal>(`${this.baseUrl}/${id}`);
  }

  createGoal(request: GoalRequest): Observable<Goal> {
    return this.http.post<Goal>(this.baseUrl, request);
  }

  updateGoal(id: string, request: GoalRequest): Observable<Goal> {
    return this.http.put<Goal>(`${this.baseUrl}/${id}`, request);
  }

  deleteGoal(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  toggleMilestone(goalId: string, milestoneId: string): Observable<Goal> {
    return this.http.patch<Goal>(`${this.baseUrl}/${goalId}/milestones/${milestoneId}/toggle`, {});
  }

  addMilestone(goalId: string, request: GoalMilestoneRequest): Observable<Goal> {
    return this.http.post<Goal>(`${this.baseUrl}/${goalId}/milestones`, request);
  }

  deleteMilestone(goalId: string, milestoneId: string): Observable<Goal> {
    return this.http.delete<Goal>(`${this.baseUrl}/${goalId}/milestones/${milestoneId}`);
  }
}
