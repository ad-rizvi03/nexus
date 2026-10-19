import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, of, tap, shareReplay, Observable } from 'rxjs';

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface UserSettings {
  timeZone: string;
  firstDayOfWeek: number;
  workStartTime: string;
  workEndTime: string;
  commuteMinutes: number;
  weekdayStudyHours: number;
  weekendStudyHours: number;
  defaultTaskDurationMinutes: number;
  dailyAgendaTime: string;
  reviewReminderTime: string;
  themePreference: string;
  dateFormatPreference: string;
}

export interface UserProfileResponse {
  user: User;
  settings: UserSettings;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly currentUser = signal<User | null>(null);
  readonly userSettings = signal<UserSettings | null>(null);
  readonly isAuthenticated = signal<boolean>(false);
  readonly isCheckingAuth = signal<boolean>(true);

  constructor() {
    this.checkInitialAuth().subscribe();
  }

  private initialAuth$?: Observable<boolean>;

  checkInitialAuth(): Observable<boolean> {
    if (this.initialAuth$) {
      return this.initialAuth$;
    }
    this.isCheckingAuth.set(true);
    this.initialAuth$ = this.http.get<UserProfileResponse>('/api/v1/auth/me', { withCredentials: true }).pipe(
      tap((res) => {
        this.currentUser.set(res.user);
        this.userSettings.set(res.settings);
        this.isAuthenticated.set(true);
        this.isCheckingAuth.set(false);
      }),
      map(() => true),
      catchError(() => {
        this.currentUser.set(null);
        this.userSettings.set(null);
        this.isAuthenticated.set(false);
        this.isCheckingAuth.set(false);
        return of(false);
      }),
      shareReplay(1)
    );
    return this.initialAuth$;
  }

  register(data: { email: string; password: string; displayName: string }): Observable<UserProfileResponse> {
    this.initialAuth$ = undefined;
    return this.http.post<UserProfileResponse>('/api/v1/auth/register', data, { withCredentials: true }).pipe(
      tap((res) => {
        this.currentUser.set(res.user);
        this.userSettings.set(res.settings);
        this.isAuthenticated.set(true);
      })
    );
  }

  login(data: { email: string; password: string }): Observable<UserProfileResponse> {
    this.initialAuth$ = undefined;
    return this.http.post<UserProfileResponse>('/api/v1/auth/login', data, { withCredentials: true }).pipe(
      tap((res) => {
        this.currentUser.set(res.user);
        this.userSettings.set(res.settings);
        this.isAuthenticated.set(true);
      })
    );
  }

  logout(): Observable<any> {
    this.initialAuth$ = undefined;
    return this.http.post('/api/v1/auth/logout', {}, { withCredentials: true }).pipe(
      tap(() => {
        this.currentUser.set(null);
        this.userSettings.set(null);
        this.isAuthenticated.set(false);
        this.router.navigate(['/login']);
      }),
      catchError(() => {
        this.currentUser.set(null);
        this.userSettings.set(null);
        this.isAuthenticated.set(false);
        this.router.navigate(['/login']);
        return of(null);
      })
    );
  }

  updateProfile(data: { displayName: string; email: string }): Observable<User> {
    return this.http.put<User>('/api/v1/auth/profile', data, { withCredentials: true }).pipe(
      tap((user) => {
        this.currentUser.set(user);
      })
    );
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.http.put('/api/v1/auth/password', data, { withCredentials: true });
  }

  deleteAccount(): Observable<any> {
    return this.http.delete('/api/v1/auth/account', { withCredentials: true }).pipe(
      tap(() => {
        this.currentUser.set(null);
        this.userSettings.set(null);
        this.isAuthenticated.set(false);
        this.router.navigate(['/login']);
      })
    );
  }

  updateSettings(settings: UserSettings): Observable<UserSettings> {
    return this.http.put<UserSettings>('/api/v1/settings', settings, { withCredentials: true }).pipe(
      tap((updated) => {
        this.userSettings.set(updated);
      })
    );
  }
}
