import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, tap } from 'rxjs';

export interface HealthStatus {
  status: string;
  database: string;
  service: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class HealthService {
  private readonly http = inject(HttpClient);

  readonly health = signal<HealthStatus | null>(null);
  readonly isConnected = signal<boolean>(false);
  readonly isDbConnected = signal<boolean>(false);
  readonly lastChecked = signal<Date | null>(null);

  checkHealth() {
    return this.http.get<HealthStatus>('/api/v1/health').pipe(
      tap((res) => {
        this.health.set(res);
        this.isConnected.set(res.status === 'UP');
        this.isDbConnected.set(res.database === 'CONNECTED');
        this.lastChecked.set(new Date());
      }),
      catchError((err) => {
        this.health.set(null);
        this.isConnected.set(false);
        this.isDbConnected.set(false);
        this.lastChecked.set(new Date());
        return of(null);
      })
    );
  }
}
