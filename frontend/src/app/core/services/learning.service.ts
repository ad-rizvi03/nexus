import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type RoadmapStatus = 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
export type ModuleStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type TopicStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'NEEDS_REVISION';

export interface Topic {
  id: string;
  moduleId: string;
  title: string;
  status: TopicStatus;
  estimatedMinutes?: number;
  completedAt?: string;
  sortOrder: number;
}

export interface TopicRequest {
  title: string;
  status?: TopicStatus;
  estimatedMinutes?: number;
  sortOrder?: number;
}

export interface Module {
  id: string;
  roadmapId: string;
  title: string;
  description?: string;
  sortOrder: number;
  status: ModuleStatus;
  topics: Topic[];
}

export interface ModuleRequest {
  title: string;
  description?: string;
  sortOrder?: number;
  status?: ModuleStatus;
}

export interface Roadmap {
  id: string;
  skillName: string;
  objective?: string;
  startDate?: string;
  targetCompletionDate?: string;
  weeklyTargetHours: number;
  status: RoadmapStatus;
  modules: Module[];
  totalTopics: number;
  completedTopics: number;
  progressPercentage: number;
  totalPracticeMinutes: number;
  nextScheduledRevision?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapRequest {
  skillName: string;
  objective?: string;
  startDate?: string;
  targetCompletionDate?: string;
  weeklyTargetHours?: number;
  status?: RoadmapStatus;
}

export interface RevisionSession {
  id: string;
  topicId: string;
  topicTitle: string;
  moduleTitle: string;
  roadmapSkillName: string;
  scheduledDate: string;
  completed: boolean;
  completedAt?: string;
  notes?: string;
}

export interface PracticeLog {
  id: string;
  roadmapId?: string;
  roadmapSkillName?: string;
  topicId?: string;
  topicTitle?: string;
  logDate: string;
  problemsSolved: number;
  minutesSpent: number;
  conceptSummary?: string;
  mistakesAndNotes?: string;
  createdAt: string;
}

export interface PracticeLogRequest {
  roadmapId?: string;
  topicId?: string;
  logDate?: string;
  problemsSolved?: number;
  minutesSpent: number;
  conceptSummary?: string;
  mistakesAndNotes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LearningService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/learning';

  // Roadmaps
  getRoadmaps(): Observable<Roadmap[]> {
    return this.http.get<Roadmap[]>(`${this.baseUrl}/roadmaps`, { withCredentials: true });
  }

  getRoadmapById(id: string): Observable<Roadmap> {
    return this.http.get<Roadmap>(`${this.baseUrl}/roadmaps/${id}`, { withCredentials: true });
  }

  createRoadmap(req: RoadmapRequest): Observable<Roadmap> {
    return this.http.post<Roadmap>(`${this.baseUrl}/roadmaps`, req, { withCredentials: true });
  }

  updateRoadmap(id: string, req: RoadmapRequest): Observable<Roadmap> {
    return this.http.put<Roadmap>(`${this.baseUrl}/roadmaps/${id}`, req, { withCredentials: true });
  }

  deleteRoadmap(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/roadmaps/${id}`, { withCredentials: true });
  }

  // Modules
  addModule(roadmapId: string, req: ModuleRequest): Observable<Module> {
    return this.http.post<Module>(`${this.baseUrl}/roadmaps/${roadmapId}/modules`, req, { withCredentials: true });
  }

  updateModule(moduleId: string, req: ModuleRequest): Observable<Module> {
    return this.http.put<Module>(`${this.baseUrl}/modules/${moduleId}`, req, { withCredentials: true });
  }

  deleteModule(moduleId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/modules/${moduleId}`, { withCredentials: true });
  }

  // Topics
  addTopic(moduleId: string, req: TopicRequest): Observable<Topic> {
    return this.http.post<Topic>(`${this.baseUrl}/modules/${moduleId}/topics`, req, { withCredentials: true });
  }

  updateTopicStatus(topicId: string, status: TopicStatus, scheduleRevision = false): Observable<Topic> {
    return this.http.patch<Topic>(
      `${this.baseUrl}/topics/${topicId}/status`,
      { status },
      {
        params: { status, scheduleRevision: String(scheduleRevision) },
        withCredentials: true
      }
    );
  }

  updateTopic(topicId: string, req: TopicRequest): Observable<Topic> {
    return this.http.put<Topic>(`${this.baseUrl}/topics/${topicId}`, req, { withCredentials: true });
  }

  deleteTopic(topicId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/topics/${topicId}`, { withCredentials: true });
  }

  // Revisions
  getUpcomingRevisions(): Observable<RevisionSession[]> {
    return this.http.get<RevisionSession[]>(`${this.baseUrl}/revisions`, { withCredentials: true });
  }

  scheduleRevision(topicId: string, scheduledDate: string, notes?: string): Observable<RevisionSession> {
    return this.http.post<RevisionSession>(`${this.baseUrl}/revisions`, { topicId, scheduledDate, notes }, { withCredentials: true });
  }

  completeRevision(revisionId: string): Observable<RevisionSession> {
    return this.http.patch<RevisionSession>(`${this.baseUrl}/revisions/${revisionId}/complete`, null, { withCredentials: true });
  }

  deleteRevision(revisionId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/revisions/${revisionId}`, { withCredentials: true });
  }

  // Practice Logs
  getPracticeLogs(roadmapId?: string): Observable<PracticeLog[]> {
    let params = new HttpParams();
    if (roadmapId) params = params.set('roadmapId', roadmapId);
    return this.http.get<PracticeLog[]>(`${this.baseUrl}/practice-logs`, { params, withCredentials: true });
  }

  createPracticeLog(req: PracticeLogRequest): Observable<PracticeLog> {
    return this.http.post<PracticeLog>(`${this.baseUrl}/practice-logs`, req, { withCredentials: true });
  }

  deletePracticeLog(logId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/practice-logs/${logId}`, { withCredentials: true });
  }
}
