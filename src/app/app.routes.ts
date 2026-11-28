import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RecuperarSenhaComponent } from './features/auth/recuperar-senha/recuperar-senha.component';
import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent, title: 'Entrar | EasyPack' },
  { path: 'recuperar-senha', component: RecuperarSenhaComponent, title: 'Recuperar senha | EasyPack' },
  { path: 'home', component: HomeComponent, title: 'EasyPack', canActivate: [authGuard] },
  { path: 'pacotes/novo', loadComponent: () => import('./features/home/package-create/package-create.component').then((m) => m.PackageCreateComponent), title: 'Novo pacote | EasyPack', canActivate: [authGuard] },
  { path: 'pacotes/:id', loadComponent: () => import('./features/home/package-details/package-details.component').then((m) => m.PackageDetailsComponent), title: 'Detalhes do pacote | EasyPack', canActivate: [authGuard] },
  { path: 'usuarios', loadComponent: () => import('./features/usuarios/usuario-list/usuario-list.component').then((m) => m.UsuarioListComponent), title: 'Usuários | EasyPack', canActivate: [authGuard] },
  { path: 'usuarios/novo', loadComponent: () => import('./features/usuarios/usuario-form/usuario-form.component').then((m) => m.UsuarioFormComponent), title: 'Novo usuário | EasyPack', canActivate: [authGuard] },
  { path: 'usuarios/:id/editar', loadComponent: () => import('./features/usuarios/usuario-form/usuario-form.component').then((m) => m.UsuarioFormComponent), title: 'Editar usuário | EasyPack', canActivate: [authGuard] },
  { path: 'clientes', loadComponent: () => import('./features/clientes/cliente-list/cliente-list.component').then((m) => m.ClienteListComponent), title: 'Gestão de clientes | EasyPack', canActivate: [authGuard] },
  { path: 'clientes/novo', loadComponent: () => import('./features/clientes/cliente-form/cliente-form.component').then((m) => m.ClienteFormComponent), title: 'Novo cliente | EasyPack', canActivate: [authGuard] },
  { path: 'clientes/:id/editar', loadComponent: () => import('./features/clientes/cliente-form/cliente-form.component').then((m) => m.ClienteFormComponent), title: 'Editar cliente | EasyPack', canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' }
];
