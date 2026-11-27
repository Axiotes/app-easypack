import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'pacotes/:id', renderMode: RenderMode.Client },
  { path: 'usuarios/:id/editar', renderMode: RenderMode.Client },
  { path: 'clientes/:id/editar', renderMode: RenderMode.Client },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
