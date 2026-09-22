import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent, title: 'Entrar | ReleaseTrack' },
  { path: '**', redirectTo: 'login' }
];
