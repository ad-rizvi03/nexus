import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type ResourceType = 'ARTICLE' | 'VIDEO' | 'REPO' | 'SNIPPET' | 'BOOK';

export interface Note {
  id: string;
  title: string;
  content: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  taskId: string | null;
  learningTopicId: string | null;
  goalId: string | null;
  isPinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NoteRequest {
  title: string;
  content: string;
  categoryId?: string | null;
  taskId?: string | null;
  learningTopicId?: string | null;
  goalId?: string | null;
  isPinned?: boolean;
  tags?: string[];
}

export interface SavedResource {
  id: string;
  title: string;
  url: string;
  description: string;
  resourceType: ResourceType;
  learningTopicId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SavedResourceRequest {
  title: string;
  url: string;
  description: string;
  resourceType: ResourceType;
  learningTopicId?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private readonly http = inject(HttpClient);
  private readonly notesUrl = '/api/v1/notes';
  private readonly resourcesUrl = '/api/v1/resources';

  getNotes(query?: string, categoryId?: string): Observable<Note[]> {
    let params = new HttpParams();
    if (query && query.trim()) {
      params = params.set('query', query.trim());
    }
    if (categoryId) {
      params = params.set('categoryId', categoryId);
    }
    return this.http.get<Note[]>(this.notesUrl, { params });
  }

  getNoteById(id: string): Observable<Note> {
    return this.http.get<Note>(`${this.notesUrl}/${id}`);
  }

  createNote(request: NoteRequest): Observable<Note> {
    return this.http.post<Note>(this.notesUrl, request);
  }

  updateNote(id: string, request: NoteRequest): Observable<Note> {
    return this.http.put<Note>(`${this.notesUrl}/${id}`, request);
  }

  togglePin(id: string): Observable<Note> {
    return this.http.patch<Note>(`${this.notesUrl}/${id}/pin`, {});
  }

  deleteNote(id: string): Observable<void> {
    return this.http.delete<void>(`${this.notesUrl}/${id}`);
  }

  getTags(): Observable<string[]> {
    return this.http.get<string[]>(`${this.notesUrl}/tags`);
  }

  getResources(query?: string, type?: ResourceType): Observable<SavedResource[]> {
    let params = new HttpParams();
    if (query && query.trim()) {
      params = params.set('query', query.trim());
    }
    if (type) {
      params = params.set('type', type);
    }
    return this.http.get<SavedResource[]>(this.resourcesUrl, { params });
  }

  createResource(request: SavedResourceRequest): Observable<SavedResource> {
    return this.http.post<SavedResource>(this.resourcesUrl, request);
  }

  updateResource(id: string, request: SavedResourceRequest): Observable<SavedResource> {
    return this.http.put<SavedResource>(`${this.resourcesUrl}/${id}`, request);
  }

  deleteResource(id: string): Observable<void> {
    return this.http.delete<void>(`${this.resourcesUrl}/${id}`);
  }
}
