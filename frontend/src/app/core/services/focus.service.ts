import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type SessionType = 'POMODORO' | 'SHORT_BREAK' | 'LONG_BREAK' | 'MANUAL' | 'OPEN_TIMER';

export interface FocusSession {
  id: string;
  taskId: string | null;
  taskTitle: string | null;
  learningTopicId: string | null;
  learningTopicTitle: string | null;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  sessionType: SessionType;
  notes: string | null;
  isRunning: boolean;
  createdAt: string;
}

export interface FocusSummary {
  todayCompletedSessions: number;
  todayFocusMinutes: number;
  weekFocusMinutes: number;
  activeSession: FocusSession | null;
  recentSessions: FocusSession[];
}

export interface StartSessionRequest {
  taskId?: string | null;
  learningTopicId?: string | null;
  sessionType?: SessionType;
  notes?: string;
}

export interface StopSessionRequest {
  durationMinutes?: number;
  notes?: string;
}

export interface ManualSessionRequest {
  taskId?: string | null;
  learningTopicId?: string | null;
  startTime?: string;
  durationMinutes: number;
  sessionType?: SessionType;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FocusService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/focus';

  getSummary(): Observable<FocusSummary> {
    return this.http.get<FocusSummary>(`${this.baseUrl}/summary`);
  }

  getActiveSession(): Observable<FocusSession | null> {
    return this.http.get<FocusSession | null>(`${this.baseUrl}/active`);
  }

  startSession(request?: StartSessionRequest): Observable<FocusSession> {
    return this.http.post<FocusSession>(`${this.baseUrl}/start`, request || {});
  }

  stopSession(id: string, request?: StopSessionRequest): Observable<FocusSession> {
    return this.http.post<FocusSession>(`${this.baseUrl}/${id}/stop`, request || {});
  }

  deleteSession(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  createManualEntry(request: ManualSessionRequest): Observable<FocusSession> {
    return this.http.post<FocusSession>(`${this.baseUrl}/manual`, request);
  }

  getSessions(startDate?: string, endDate?: string): Observable<FocusSession[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<FocusSession[]>(`${this.baseUrl}/sessions`, { params });
  }
}
