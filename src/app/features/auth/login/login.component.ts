import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BrandComponent } from '../../../shared/components/brand/brand.component';

interface LoginResponse {
  token: string;
  message: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, BrandComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  protected readonly username = signal('');
  protected readonly password = signal('');
  protected readonly showPassword = signal(false);
  protected readonly submitted = signal(false);
  protected readonly loading = signal(false);
  protected readonly feedback = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  protected submit(): void {
    this.submitted.set(true);
    this.feedback.set(null);

    if (!this.username() || !this.password() || this.loading()) return;

    this.loading.set(true);
    this.http
      .post<LoginResponse>('http://localhost:8000/api/v1/auth/login', {
        nm_usuario: this.username(),
        senha: this.password(),
      })
      .subscribe({
        next: (response) => {
          localStorage.setItem('token', response.token);
          this.feedback.set({
            type: 'success',
            text: response.message || 'Login realizado com sucesso.',
          });
          this.loading.set(false);
          window.setTimeout(() => void this.router.navigate(['/home']), 700);
        },
        error: (error: HttpErrorResponse) => {
          this.feedback.set({
            type: 'error',
            text:
              error.error?.message ??
              error.error?.detail ??
              'Não foi possível realizar o login. Verifique suas credenciais.',
          });
          this.loading.set(false);
        },
      });
  }
}
