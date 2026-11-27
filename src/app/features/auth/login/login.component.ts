import { LucideArrowRight, LucideCircle, LucideDiamond, LucideEye, LucideEyeOff, LucideHistory, LucideLockKeyhole, LucideShieldCheck, LucideUserRound, LucideWorkflow } from '@lucide/angular';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BrandComponent } from '../../../shared/components/brand/brand.component';

interface LoginResponse {
  token: string;
  message: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [LucideArrowRight, LucideCircle, LucideDiamond, LucideEye, LucideEyeOff, LucideHistory, LucideLockKeyhole, LucideShieldCheck, LucideUserRound, LucideWorkflow, FormsModule, RouterLink, BrandComponent],
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

    if (!this.username() || this.password().length < 6 || this.loading()) return;

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
            text: this.errorMessage(error),
          });
          this.loading.set(false);
        },
      });
  }

  /**
   * O backend retorna `detail` como string em erros de autenticação (401), mas como
   * lista de objetos de validação do Pydantic em erros de schema (422) — sem essa
   * checagem de tipo, o template renderiza a lista como "[object Object]".
   */
  private errorMessage(error: HttpErrorResponse): string {
    if (typeof error.error?.message === 'string') return error.error.message;
    if (typeof error.error?.detail === 'string') return error.error.detail;
    if (error.status === 422) return 'Usuário ou senha em formato inválido. Verifique os dados informados.';
    if (error.status === 0) return 'Não foi possível conectar ao servidor. Verifique sua conexão.';
    return 'Não foi possível realizar o login. Verifique suas credenciais.';
  }
}
