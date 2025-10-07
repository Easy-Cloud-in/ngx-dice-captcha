import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ResponsiveTestComponent } from './pages/responsive-test/responsive-test.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  {
    path: 'responsive-test',
    component: ResponsiveTestComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
