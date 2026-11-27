import { LucideChevronRight, LucidePencil, LucidePlus, LucideTrash2 } from '@lucide/angular';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { MainNavComponent } from '../../../shared/components/main-nav/main-nav.component';
import { AppHeaderComponent } from '../../home/components/app-header/app-header.component';
import { Client, LoggedUser, UsuarioRaw } from '../../home/models/release.models';
import { ClientService } from '../../home/services/client.service';
import { ReferenceDataService } from '../../home/services/reference-data.service';
import { UserService } from '../../home/services/user.service';

@Component({
  selector: 'app-cliente-list',
  standalone: true,
  imports: [RouterLink, AppHeaderComponent, MainNavComponent, LucideChevronRight, LucidePencil, LucidePlus, LucideTrash2],
  templateUrl: './cliente-list.component.html',
  styleUrls: ['../../home/home.component.scss', './cliente-list.component.scss'],
})
export class ClienteListComponent {
  private readonly clientService = inject(ClientService);
  private readonly userService = inject(UserService);
  private readonly referenceData = inject(ReferenceDataService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loggedUser = signal<LoggedUser | null>(null);
  protected readonly clientes = signal<Client[]>([]);
  protected readonly usuarios = signal<UsuarioRaw[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly deletingId = signal<number | null>(null);
  protected readonly confirmingId = signal<number | null>(null);
  protected readonly deleteError = signal('');

  protected readonly podeGerenciar = computed(() => this.loggedUser()?.cargo === 'GERENTE_PROJETO');

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      user: this.userService.getCurrentUser(),
      clientes: this.clientService.listAll(),
      usuarios: this.referenceData.getUsuarios(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ user, clientes, usuarios }) => {
          this.loggedUser.set(user);
          this.clientes.set(clientes);
          this.usuarios.set(usuarios);
        },
        error: (error: HttpErrorResponse) => {
          this.error.set(
            error.status === 401
              ? 'Sua sessão expirou. Entre novamente para continuar.'
              : 'Não foi possível carregar os clientes.',
          );
        },
      });
  }

  protected nomeResponsavel(idUsuario: number): string {
    return this.usuarios().find((usuario) => usuario.id === idUsuario)?.nm_completo ?? `Usuário #${idUsuario}`;
  }

  protected confirmarExclusao(id: number): void {
    this.confirmingId.set(id);
    this.deleteError.set('');
  }

  protected cancelarExclusao(): void {
    this.confirmingId.set(null);
  }

  protected excluir(id: number): void {
    this.deletingId.set(id);
    this.deleteError.set('');
    this.clientService
      .remove(id)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => {
          this.clientes.set(this.clientes().filter((cliente) => cliente.id !== id));
          this.confirmingId.set(null);
        },
        error: (error: HttpErrorResponse) => {
          this.deleteError.set(
            typeof error.error?.detail === 'string' ? error.error.detail : 'Não foi possível excluir o cliente.',
          );
        },
      });
  }
}
