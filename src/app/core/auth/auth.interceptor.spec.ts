import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Mock, vi } from 'vitest';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

const BASE = 'http://localhost:8000/api/v1';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let logout: Mock;

  beforeEach(() => {
    logout = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { getToken: () => 'meu-token', logout } },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('adds the Authorization header to API requests', () => {
    http.get(`${BASE}/usuarios`).subscribe();
    const req = httpMock.expectOne(`${BASE}/usuarios`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer meu-token');
    req.flush([]);
  });

  it('does not add the Authorization header to the login request', () => {
    http.post(`${BASE}/auth/login`, {}).subscribe();
    const req = httpMock.expectOne(`${BASE}/auth/login`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ token: 'x', message: 'ok' });
  });

  it('does not add the Authorization header to requests outside the API', () => {
    http.get('http://outro-servico.local/qualquer').subscribe();
    const req = httpMock.expectOne('http://outro-servico.local/qualquer');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('logs out on a 401 response from the API', () => {
    http.get(`${BASE}/usuarios`).subscribe({ error: () => undefined });
    httpMock.expectOne(`${BASE}/usuarios`).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(logout).toHaveBeenCalledWith('sessao-expirada');
  });

  it('does not treat a 401 from the login endpoint as an expired session', () => {
    http.post(`${BASE}/auth/login`, {}).subscribe({ error: () => undefined });
    httpMock.expectOne(`${BASE}/auth/login`).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(logout).not.toHaveBeenCalled();
  });
});
