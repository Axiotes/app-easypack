import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

/** Gera um JWT com a estrutura mínima (header.payload.signature) para testar a leitura do `exp`. */
function fakeToken(exp: number): string {
  const header = btoa(JSON.stringify({ alg: 'none' }));
  const payload = btoa(JSON.stringify({ sub: 'teste', exp }));
  return `${header}.${payload}.assinatura`;
}

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.removeItem('token');
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    service = TestBed.inject(AuthService);
  });

  afterEach(() => localStorage.removeItem('token'));

  it('is not authenticated without a token', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('is authenticated with a non-expired token', () => {
    service.setToken(fakeToken(Date.now() / 1000 + 3600));
    expect(service.isAuthenticated()).toBe(true);
  });

  it('is not authenticated with an expired token', () => {
    service.setToken(fakeToken(Date.now() / 1000 - 3600));
    expect(service.isAuthenticated()).toBe(false);
  });

  it('is not authenticated with a malformed token', () => {
    service.setToken('token-invalido-sem-estrutura-jwt');
    expect(service.isAuthenticated()).toBe(false);
  });

  it('clearToken removes the stored token', () => {
    service.setToken(fakeToken(Date.now() / 1000 + 3600));
    service.clearToken();
    expect(service.getToken()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
