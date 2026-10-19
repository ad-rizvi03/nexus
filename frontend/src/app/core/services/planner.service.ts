import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SmartPlanSlot {
  slotId: string;
  taskId?: string;
  taskTitle: string;
  categoryName?: string;
  categoryColor?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  slotType: 'WORK_BLOCK' | 'STUDY_BLOCK' | 'PERSONAL_BLOCK' | 'BREAK' | 'COMMUTE';
  startTime: string;
  endTime: string;
  durationMinutes: number;
  rationale: string;
  accepted: boolean;
}

export interface SmartPlanResponse {
  targetDate: string;
  workStartTime: string;
  workEndTime: string;
  commuteMinutes: number;
  availableCapacityMinutes: number;
  totalPlannedDurationMinutes: number;
  overloadMinutes: number;
  status: 'OPTIMAL' | 'OVERLOADED' | 'UNDERALLOCATED';
  overallSummary: string;
  slots: SmartPlanSlot[];
  rationale: string[];
  rulesApplied: string[];
}

export interface ApplyPlanRequest {
  targetDate: string;
  slots: {
    taskId: string;
    startTime: string;
    endTime: string;
    plannedDate?: string;
  }[];
}

export interface NaturalLanguageParsed {
  originalInput: string;
  title: string;
  plannedDate: string;
  startTime?: string;
  estimatedDurationMinutes: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
}

export interface ReminderItem {
  id: string;
  taskId?: string;
  taskTitle?: string;
  scheduledAt: string;
  notificationType: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  attemptCount: number;
  lastError?: string;
  sentAt?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlannerService {
  private readonly http = inject(HttpClient);
  private readonly plannerUrl = '/api/v1/planner';
  private readonly reminderUrl = '/api/v1/reminders';

  getDailyPlan(date?: string): Observable<SmartPlanResponse> {
    let params = new HttpParams();
    if (date) {
      params = params.set('date', date);
    }
    return this.http.get<SmartPlanResponse>(`${this.plannerUrl}/daily`, { params });
  }

  applyPlan(request: ApplyPlanRequest): Observable<{ appliedCount: number; message: string }> {
    return this.http.post<{ appliedCount: number; message: string }>(`${this.plannerUrl}/apply`, request);
  }

  parseNaturalLanguage(input: string): Observable<NaturalLanguageParsed> {
    return this.http.post<NaturalLanguageParsed>(`${this.plannerUrl}/parse-entry`, { input });
  }

  sendTestEmail(toEmail?: string): Observable<{ success: boolean; message: string; simulated: boolean }> {
    return this.http.post<{ success: boolean; message: string; simulated: boolean }>(
      `${this.reminderUrl}/test-email`,
      toEmail ? { toEmail } : {}
    );
  }

  getReminders(): Observable<ReminderItem[]> {
    return this.http.get<ReminderItem[]>(this.reminderUrl);
  }

  cancelReminder(id: string): Observable<void> {
    return this.http.post<void>(`${this.reminderUrl}/${id}/cancel`, {});
  }

  processReminders(): Observable<{ processedCount: number; message: string }> {
    return this.http.post<{ processedCount: number; message: string }>(`${this.reminderUrl}/process`, {});
  }
}
