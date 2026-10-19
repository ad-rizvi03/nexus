import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type HabitFrequency = 'DAILY' | 'WEEKDAYS' | 'WEEKENDS' | 'CUSTOM';

export interface Habit {
  id: string;
  name: string;
  description: string;
  targetFrequency: HabitFrequency;
  targetDurationMinutes: number | null;
  isPaused: boolean;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate30d: number;
  lastEntryDate: string | null;
  recentEntries: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface HabitSummary {
  totalActiveHabits: number;
  totalPausedHabits: number;
  completedTodayCount: number;
  overallCompletionRate: number;
  bestStreakOverall: number;
  habits: Habit[];
}

export interface HabitRequest {
  name: string;
  description?: string;
  targetFrequency: HabitFrequency;
  targetDurationMinutes?: number | null;
  isPaused?: boolean;
}

export interface HabitToggleRequest {
  entryDate: string;
  completed?: boolean;
  durationMinutes?: number;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HabitService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/habits';

  getHabits(includePaused: boolean = false): Observable<HabitSummary> {
    const params = new HttpParams().set('includePaused', includePaused.toString());
    return this.http.get<HabitSummary>(this.baseUrl, { params });
  }

  getHabitById(id: string): Observable<Habit> {
    return this.http.get<Habit>(`${this.baseUrl}/${id}`);
  }

  createHabit(request: HabitRequest): Observable<Habit> {
    return this.http.post<Habit>(this.baseUrl, request);
  }

  updateHabit(id: string, request: HabitRequest): Observable<Habit> {
    return this.http.put<Habit>(`${this.baseUrl}/${id}`, request);
  }

  togglePause(id: string): Observable<Habit> {
    return this.http.patch<Habit>(`${this.baseUrl}/${id}/pause`, {});
  }

  deleteHabit(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  toggleEntry(id: string, request?: HabitToggleRequest): Observable<Habit> {
    return this.http.post<Habit>(`${this.baseUrl}/${id}/toggle`, request || {});
  }

  getEntries(id: string, startDate?: string, endDate?: string): Observable<any[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<any[]>(`${this.baseUrl}/${id}/entries`, { params });
  }
}
