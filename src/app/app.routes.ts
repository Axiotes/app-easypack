import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RecuperarSenhaComponent } from './features/auth/recuperar-senha/recuperar-senha.component';
import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent, title: 'Entrar | EasyPack' },
  { path: 'recuperar-senha', component: RecuperarSenhaComponent, title: 'Recuperar senha | EasyPack' },
  { path: 'home', component: HomeComponent, title: 'EasyPack' },
  { path: 'pacotes/novo', loadComponent: () => import('./features/home/package-create/package-create.component').then((m) => m.PackageCreateComponent), title: 'Novo pacote | EasyPack' },
  { path: 'pacotes/:id', loadComponent: () => import('./features/home/package-details/package-details.component').then((m) => m.PackageDetailsComponent), title: 'Detalhes do pacote | EasyPack' },
  { path: 'usuarios', loadComponent: () => import('./features/usuarios/usuario-list/usuario-list.component').then((m) => m.UsuarioListComponent), title: 'Usuários | EasyPack' },
  { path: 'usuarios/novo', loadComponent: () => import('./features/usuarios/usuario-form/usuario-form.component').then((m) => m.UsuarioFormComponent), title: 'Novo usuário | EasyPack' },
  { path: 'usuarios/:id/editar', loadComponent: () => import('./features/usuarios/usuario-form/usuario-form.component').then((m) => m.UsuarioFormComponent), title: 'Editar usuário | EasyPack' },
  { path: 'clientes', loadComponent: () => import('./features/clientes/cliente-list/cliente-list.component').then((m) => m.ClienteListComponent), title: 'Gestão de clientes | EasyPack' },
  { path: 'clientes/novo', loadComponent: () => import('./features/clientes/cliente-form/cliente-form.component').then((m) => m.ClienteFormComponent), title: 'Novo cliente | EasyPack' },
  { path: 'clientes/:id/editar', loadComponent: () => import('./features/clientes/cliente-form/cliente-form.component').then((m) => m.ClienteFormComponent), title: 'Editar cliente | EasyPack' },
  { path: '**', redirectTo: 'login' }
];
