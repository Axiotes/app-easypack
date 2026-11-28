import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';
import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';

@Component({ template: 'protegido' })
class ProtectedStub {}

@Component({ template: 'login' })
class LoginStub {}

function configureTestBed(isAuthenticated: boolean) {
  const clearToken = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: { isAuthenticated: () => isAuthenticated, clearToken } },
      provideRouter([
        { path: 'login', component: LoginStub },
        { path: 'protegido', component: ProtectedStub, canActivate: [authGuard] },
      ]),
    ],
  });
  return { clearToken };
}

describe('authGuard', () => {
  it('allows navigation when authenticated', async () => {
    configureTestBed(true);
    const harness = await RouterTestingHarness.create('/protegido');
    expect(harness.routeNativeElement?.textContent).toContain('protegido');
  });

  it('redirects to /login and clears the token when not authenticated', async () => {
    const { clearToken } = configureTestBed(false);
    const harness = await RouterTestingHarness.create('/protegido');
    expect(clearToken).toHaveBeenCalled();
    expect(TestBed.inject(Router).url).toBe('/login?redirectTo=%2Fprotegido');
    expect(harness.routeNativeElement?.textContent).toContain('login');
  });
});
