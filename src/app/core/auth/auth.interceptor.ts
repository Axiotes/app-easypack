import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

const API_PREFIX = 'http://localhost:8000/api/v1';

/**
 * Injeta `Authorization: Bearer <token>` em toda chamada à API (substitui o antigo
 * helper `authHeaders()` chamado manualmente em cada service) e, numa resposta 401,
 * limpa a sessão e redireciona para /login — nenhuma tela precisa tratar isso sozinha.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isApiRequest = req.url.startsWith(API_PREFIX);
  const isLoginRequest = req.url === `${API_PREFIX}/auth/login`;
  const token = auth.getToken();

  const authReq = isApiRequest && token && !isLoginRequest
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && isApiRequest && !isLoginRequest) {
        auth.logout('sessao-expirada');
      }
      return throwError(() => error);
    }),
  );
};
