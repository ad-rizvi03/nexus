import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type EventType = 'TASK_SCHEDULED' | 'TASK_DEADLINE' | 'REVISION_SESSION';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  categoryName?: string;
  categoryColor?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'TO_DO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED';
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm:ss
  endTime?: string;
  durationMinutes?: number;
  type: EventType;
  completed: boolean;
  isDeadline: boolean;
}

export interface RescheduleRequest {
  plannedDate?: string;
  startTime?: string;
  endTime?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/calendar';

  getEvents(startDate?: string, endDate?: string): Observable<CalendarEvent[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<CalendarEvent[]>(`${this.baseUrl}/events`, { params, withCredentials: true });
  }

  rescheduleTask(taskId: string, request: RescheduleRequest): Observable<CalendarEvent> {
    return this.http.patch<CalendarEvent>(`${this.baseUrl}/tasks/${taskId}/reschedule`, request, { withCredentials: true });
  }
}
