import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { TasksComponent } from './features/tasks/tasks.component';
import { CalendarComponent } from './features/calendar/calendar.component';
import { NotesComponent } from './features/notes/notes.component';
import { LearningComponent } from './features/learning/learning.component';
import { HabitsComponent } from './features/habits/habits.component';
import { FocusComponent } from './features/focus/focus.component';
import { GoalsComponent } from './features/goals/goals.component';
import { ReviewsComponent } from './features/reviews/reviews.component';
import { AnalyticsComponent } from './features/analytics/analytics.component';
import { SettingsComponent } from './features/settings/settings.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'tasks', component: TasksComponent, canActivate: [authGuard] },
  { path: 'calendar', component: CalendarComponent, canActivate: [authGuard] },
  { path: 'notes', component: NotesComponent, canActivate: [authGuard] },
  { path: 'learning', component: LearningComponent, canActivate: [authGuard] },
  { path: 'habits', component: HabitsComponent, canActivate: [authGuard] },
  { path: 'focus', component: FocusComponent, canActivate: [authGuard] },
  { path: 'goals', component: GoalsComponent, canActivate: [authGuard] },
  { path: 'review', component: ReviewsComponent, canActivate: [authGuard] },
  { path: 'analytics', component: AnalyticsComponent, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'dashboard' }
];
