import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent, title: 'Entrar | EasyPack' },
  { path: 'home', component: HomeComponent, title: 'EasyPack' },
  { path: '**', redirectTo: 'login' }
];
