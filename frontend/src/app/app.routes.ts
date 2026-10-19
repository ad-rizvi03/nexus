import { Routes } from '@angular/router';
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

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'tasks', component: TasksComponent },
  { path: 'calendar', component: CalendarComponent },
  { path: 'notes', component: NotesComponent },
  { path: 'learning', component: LearningComponent },
  { path: 'habits', component: HabitsComponent },
  { path: 'focus', component: FocusComponent },
  { path: 'goals', component: GoalsComponent },
  { path: 'review', component: ReviewsComponent },
  { path: 'analytics', component: AnalyticsComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '**', redirectTo: 'dashboard' }
];
