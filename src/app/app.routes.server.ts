import { RenderMode, ServerRoute } from '@angular/ssr';

// Todas as rotas internas exigem login (ver authGuard) e dados específicos do
// usuário autenticado, então não há o que pré-renderizar nelas em tempo de build;
// só as páginas públicas (login, recuperar senha) se beneficiam de prerender.
export const serverRoutes: ServerRoute[] = [
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'recuperar-senha', renderMode: RenderMode.Prerender },
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];
