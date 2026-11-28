import { LucideChevronRight } from '@lucide/angular';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { MainNavComponent } from '../../../shared/components/main-nav/main-nav.component';
import { AppHeaderComponent } from '../../home/components/app-header/app-header.component';
import { LogOperacao, LoggedUser } from '../../home/models/release.models';
import { LogService } from '../../home/services/log.service';
import { UserService } from '../../home/services/user.service';

@Component({
  selector: 'app-log-list',
  standalone: true,
  imports: [FormsModule, AppHeaderComponent, MainNavComponent, LucideChevronRight],
  templateUrl: './log-list.component.html',
  styleUrls: ['../../home/home.component.scss', './log-list.component.scss'],
})
export class LogListComponent {
  private readonly logService = inject(LogService);
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loggedUser = signal<LoggedUser | null>(null);
  protected readonly logs = signal<LogOperacao[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  protected readonly entidadeFiltro = signal<'' | string>('');
  protected readonly acaoFiltro = signal<'' | string>('');
  protected readonly textoFiltro = signal('');

  protected readonly entidadesDisponiveis = computed(() =>
    Array.from(new Set(this.logs().map((log) => log.nm_entidade))).sort(),
  );
  protected readonly acoesDisponiveis = computed(() =>
    Array.from(new Set(this.logs().map((log) => log.ds_acao))).sort(),
  );

  protected readonly logsFiltrados = computed(() => {
    const entidade = this.entidadeFiltro();
    const acao = this.acaoFiltro();
    const texto = this.textoFiltro().trim().toLowerCase();
    return this.logs().filter(
      (log) =>
        (!entidade || log.nm_entidade === entidade) &&
        (!acao || log.ds_acao === acao) &&
        (!texto ||
          log.nm_usuario.toLowerCase().includes(texto) ||
          log.ds_detalhe.toLowerCase().includes(texto)),
    );
  });

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({ user: this.userService.getCurrentUser(), logs: this.logService.list() })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ user, logs }) => {
          this.loggedUser.set(user);
          this.logs.set(logs);
        },
        error: (error: HttpErrorResponse) => {
          this.error.set(
            error.status === 401
              ? 'Sua sessão expirou. Entre novamente para continuar.'
              : error.status === 403
                ? 'Apenas Coordenador ou Gerente de Projeto pode consultar o histórico de operações.'
                : 'Não foi possível carregar o histórico de operações.',
          );
        },
      });
  }

  protected formatarData(valor: string): string {
    return new Date(valor).toLocaleString('pt-BR');
  }
}
