import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
}

export interface CategoryRequest {
  name: string;
  color?: string;
  icon?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  estimatedDurationMinutes?: number;
  sortOrder?: number;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  category?: Category;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TO_DO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED';
  estimatedDurationMinutes?: number;
  deadlineDate?: string;
  deadlineTime?: string;
  plannedDate?: string;
  startTime?: string;
  endTime?: string;
  completedAt?: string;
  recurrenceRule?: string;
  subtasks: Subtask[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  categoryId?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'TO_DO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED';
  estimatedDurationMinutes?: number;
  deadlineDate?: string;
  deadlineTime?: string;
  plannedDate?: string;
  startTime?: string;
  endTime?: string;
  recurrenceRule?: string;
}

export interface DashboardTodayResponse {
  todayTasks: TaskItem[];
  overdueTasks: TaskItem[];
  inProgressTasks: TaskItem[];
  totalPlannedMinutesToday: number;
  availableMinutesToday: number;
  remainingCapacityMinutes: number;
  isOverloaded: boolean;
  completedCountToday: number;
  activeCountToday: number;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1';

  // Categories
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`, { withCredentials: true });
  }

  createCategory(request: CategoryRequest): Observable<Category> {
    return this.http.post<Category>(`${this.baseUrl}/categories`, request, { withCredentials: true });
  }

  // Tasks
  getTasks(filters?: {
    status?: string;
    categoryId?: string;
    priority?: string;
    search?: string;
    plannedDate?: string;
  }): Observable<TaskItem[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.status && filters.status !== 'ALL') params = params.set('status', filters.status);
      if (filters.categoryId) params = params.set('categoryId', filters.categoryId);
      if (filters.priority) params = params.set('priority', filters.priority);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.plannedDate) params = params.set('plannedDate', filters.plannedDate);
    }
    return this.http.get<TaskItem[]>(`${this.baseUrl}/tasks`, { params, withCredentials: true });
  }

  getTaskById(id: string): Observable<TaskItem> {
    return this.http.get<TaskItem>(`${this.baseUrl}/tasks/${id}`, { withCredentials: true });
  }

  createTask(request: CreateTaskRequest): Observable<TaskItem> {
    return this.http.post<TaskItem>(`${this.baseUrl}/tasks`, request, { withCredentials: true });
  }

  updateTask(id: string, request: Partial<CreateTaskRequest>): Observable<TaskItem> {
    return this.http.put<TaskItem>(`${this.baseUrl}/tasks/${id}`, request, { withCredentials: true });
  }

  updateStatus(id: string, status: 'TO_DO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED'): Observable<TaskItem> {
    return this.http.patch<TaskItem>(`${this.baseUrl}/tasks/${id}/status`, { status }, {
      params: { status },
      withCredentials: true
    });
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tasks/${id}`, { withCredentials: true });
  }

  // Subtasks
  addSubtask(taskId: string, title: string): Observable<Subtask> {
    return this.http.post<Subtask>(`${this.baseUrl}/tasks/${taskId}/subtasks`, { title }, { withCredentials: true });
  }

  toggleSubtask(taskId: string, subtaskId: string): Observable<Subtask> {
    return this.http.patch<Subtask>(`${this.baseUrl}/tasks/${taskId}/subtasks/${subtaskId}/toggle`, null, { withCredentials: true });
  }

  deleteSubtask(taskId: string, subtaskId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tasks/${taskId}/subtasks/${subtaskId}`, { withCredentials: true });
  }

  // Dashboard
  getDashboardToday(): Observable<DashboardTodayResponse> {
    return this.http.get<DashboardTodayResponse>(`${this.baseUrl}/dashboard/today`, { withCredentials: true });
  }
}
