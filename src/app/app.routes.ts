import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent, title: 'Entrar | EasyPack' },
  { path: 'home', component: HomeComponent, title: 'EasyPack' },
  { path: 'pacotes/:id', loadComponent: () => import('./features/home/package-details/package-details.component').then((m) => m.PackageDetailsComponent), title: 'Detalhes do pacote | EasyPack' },
  { path: '**', redirectTo: 'login' }
];
