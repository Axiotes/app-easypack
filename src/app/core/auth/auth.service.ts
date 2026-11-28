import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

const BASE = 'http://localhost:8000/api/v1';
const TOKEN_KEY = 'token';

interface LoginResponse {
  token: string;
  message: string;
}

/**
 * Centraliza o ciclo de vida do token: login, armazenamento, logout e verificação
 * de expiração. Usado pelo authGuard (protege rotas) e pelo authInterceptor
 * (injeta o header Authorization e trata 401 globalmente).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  login(nm_usuario: string, senha: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${BASE}/auth/login`, { nm_usuario, senha })
      .pipe(tap((response) => this.setToken(response.token)));
  }

  logout(motivo?: 'sessao-expirada'): void {
    this.clearToken();
    void this.router.navigate(['/login'], motivo ? { queryParams: { motivo } } : {});
  }

  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem(TOKEN_KEY) : null;
  }

  setToken(token: string): void {
    if (this.isBrowser) localStorage.setItem(TOKEN_KEY, token);
  }

  clearToken(): void {
    if (this.isBrowser) localStorage.removeItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isExpired(token);
  }

  /** Decodifica o `exp` do JWT só para UX local (esconder/mostrar telas); o backend valida a assinatura de verdade. */
  private isExpired(token: string): boolean {
    const payload = this.decodePayload(token);
    if (!payload || typeof payload.exp !== 'number') return true;
    return Date.now() >= payload.exp * 1000;
  }

  private decodePayload(token: string): { exp?: number } | null {
    try {
      const [, payload] = token.split('.');
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(normalized));
    } catch {
      return null;
    }
  }
}
