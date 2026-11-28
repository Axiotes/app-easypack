import { LucideDownload } from '@lucide/angular';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';
import { MainNavComponent } from '../../shared/components/main-nav/main-nav.component';
import { exportToCsv } from '../../shared/utils/csv-export';
import { AppHeaderComponent } from '../home/components/app-header/app-header.component';
import { LoggedUser, LogOperacao } from '../home/models/release.models';
import { LogService } from '../home/services/log.service';
import { UserService } from '../home/services/user.service';
import { RelatorioClientePacotes, RelatorioPendencia, RelatorioService } from './relatorio.service';

interface AtividadeUsuario {
  nm_usuario: string;
  totalOperacoes: number;
  ultimaOperacao: string;
}

@Component({
  selector: 'app-relatorio-list',
  standalone: true,
  imports: [AppHeaderComponent, MainNavComponent, LucideDownload],
  templateUrl: './relatorio-list.component.html',
  styleUrls: ['../home/home.component.scss', './relatorio-list.component.scss'],
})
export class RelatorioListComponent {
  private readonly relatorioService = inject(RelatorioService);
  private readonly logService = inject(LogService);
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loggedUser = signal<LoggedUser | null>(null);
  protected readonly clientePacotes = signal<RelatorioClientePacotes[]>([]);
  protected readonly pendencias = signal<RelatorioPendencia[]>([]);
  protected readonly logs = signal<LogOperacao[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly atividadeIndisponivel = signal(false);

  protected readonly atividadePorUsuario = computed<AtividadeUsuario[]>(() => {
    const porUsuario = new Map<string, AtividadeUsuario>();
    for (const log of this.logs()) {
      const atual = porUsuario.get(log.nm_usuario);
      if (!atual) {
        porUsuario.set(log.nm_usuario, { nm_usuario: log.nm_usuario, totalOperacoes: 1, ultimaOperacao: log.dt_operacao });
      } else {
        atual.totalOperacoes += 1;
        if (log.dt_operacao > atual.ultimaOperacao) atual.ultimaOperacao = log.dt_operacao;
      }
    }
    return Array.from(porUsuario.values()).sort((a, b) => b.totalOperacoes - a.totalOperacoes);
  });

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set('');
    this.atividadeIndisponivel.set(false);
    forkJoin({
      user: this.userService.getCurrentUser(),
      clientePacotes: this.relatorioService.getRelatorioClientePacotes(),
      pendencias: this.relatorioService.getRelatorioPendencias(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ user, clientePacotes, pendencias }) => {
          this.loggedUser.set(user);
          this.clientePacotes.set(clientePacotes);
          this.pendencias.set(pendencias);
        },
        error: (error: HttpErrorResponse) => {
          this.error.set(
            error.status === 401
              ? 'Sua sessão expirou. Entre novamente para continuar.'
              : 'Não foi possível carregar os relatórios.',
          );
        },
      });

    // O histórico de operações é restrito a Coordenador/GP; carrega à parte para
    // não derrubar os demais relatórios caso o usuário logado não tenha acesso.
    this.logService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (logs) => this.logs.set(logs),
        error: () => this.atividadeIndisponivel.set(true),
      });
  }

  protected formatarData(valor: string): string {
    return new Date(valor).toLocaleString('pt-BR');
  }

  protected exportarClientePacotes(): void {
    exportToCsv(
      'relatorio-pacotes-por-cliente.csv',
      [
        { chave: 'nm_cliente', titulo: 'Cliente' },
        { chave: 'total', titulo: 'Total de pacotes' },
        { chave: 'aplicados', titulo: 'Aplicados' },
        { chave: 'pendentes', titulo: 'Pendentes' },
        { chave: 'percentualAplicado', titulo: '% aplicado' },
      ],
      this.clientePacotes(),
    );
  }

  protected exportarPendencias(): void {
    exportToCsv(
      'relatorio-pendencias.csv',
      [
        { chave: 'ticket', titulo: 'Ticket' },
        { chave: 'nm_cliente', titulo: 'Cliente' },
        { chave: 'nm_produto', titulo: 'Produto' },
        { chave: 'nm_setor', titulo: 'Setor' },
        { chave: 'pendencia', titulo: 'Pendência' },
      ],
      this.pendencias(),
    );
  }

  protected exportarAtividade(): void {
    exportToCsv(
      'relatorio-atividade-por-usuario.csv',
      [
        { chave: 'nm_usuario', titulo: 'Usuário' },
        { chave: 'totalOperacoes', titulo: 'Total de operações' },
        { chave: 'ultimaOperacao', titulo: 'Última operação' },
      ],
      this.atividadePorUsuario(),
    );
  }
}
