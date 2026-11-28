import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Protege rotas internas: sem token válido, redireciona para /login preservando a rota pretendida. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  auth.clearToken();
  return router.createUrlTree(['/login'], { queryParams: { redirectTo: state.url } });
};
