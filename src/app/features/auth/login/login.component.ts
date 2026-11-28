import { LucideArrowRight, LucideCircle, LucideDiamond, LucideEye, LucideEyeOff, LucideHistory, LucideLockKeyhole, LucideShieldCheck, LucideUserRound, LucideWorkflow } from '@lucide/angular';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { BrandComponent } from '../../../shared/components/brand/brand.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [LucideArrowRight, LucideCircle, LucideDiamond, LucideEye, LucideEyeOff, LucideHistory, LucideLockKeyhole, LucideShieldCheck, LucideUserRound, LucideWorkflow, FormsModule, RouterLink, BrandComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly username = signal('');
  protected readonly password = signal('');
  protected readonly showPassword = signal(false);
  protected readonly submitted = signal(false);
  protected readonly loading = signal(false);
  protected readonly feedback = signal<{ type: 'success' | 'error'; text: string } | null>(
    this.route.snapshot.queryParamMap.get('motivo') === 'sessao-expirada'
      ? { type: 'error', text: 'Sua sessão expirou. Entre novamente para continuar.' }
      : null,
  );

  protected submit(): void {
    this.submitted.set(true);
    this.feedback.set(null);

    if (!this.username() || this.password().length < 6 || this.loading()) return;

    this.loading.set(true);
    this.auth.login(this.username(), this.password()).subscribe({
      next: (response) => {
        this.feedback.set({
          type: 'success',
          text: response.message || 'Login realizado com sucesso.',
        });
        this.loading.set(false);
        const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') || '/home';
        window.setTimeout(() => void this.router.navigateByUrl(redirectTo), 700);
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
