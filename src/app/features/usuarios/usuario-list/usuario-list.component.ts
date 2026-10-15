import { LucideChevronRight, LucidePencil, LucidePlus, LucideTrash2 } from '@lucide/angular';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { MainNavComponent } from '../../../shared/components/main-nav/main-nav.component';
import { AppHeaderComponent } from '../../home/components/app-header/app-header.component';
import { LoggedUser, Product, Subsetor, Usuario } from '../../home/models/release.models';
import { ReferenceDataService } from '../../home/services/reference-data.service';
import { UserService } from '../../home/services/user.service';
import { cargoBelow } from '../../home/utils/cargo.util';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [RouterLink, AppHeaderComponent, MainNavComponent, LucideChevronRight, LucidePencil, LucidePlus, LucideTrash2],
  templateUrl: './usuario-list.component.html',
  styleUrls: ['../../home/home.component.scss', './usuario-list.component.scss'],
})
export class UsuarioListComponent {
  private readonly userService = inject(UserService);
  private readonly referenceData = inject(ReferenceDataService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loggedUser = signal<LoggedUser | null>(null);
  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly subsetores = signal<Subsetor[]>([]);
  protected readonly produtos = signal<Product[]>([]);
  protected readonly cargos = signal<string[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly deletingId = signal<number | null>(null);
  protected readonly confirmingId = signal<number | null>(null);
  protected readonly deleteError = signal('');

  protected readonly podeCadastrar = computed(() => this.loggedUser()?.cargo === 'COORDENADOR');

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      user: this.userService.getCurrentUser(),
      usuarios: this.userService.list(),
      subsetores: this.referenceData.getSubsetores(),
      produtos: this.referenceData.getProdutos(),
      cargos: this.referenceData.getCargos(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ user, usuarios, subsetores, produtos, cargos }) => {
          this.loggedUser.set(user);
          this.usuarios.set(usuarios);
          this.subsetores.set(subsetores);
          this.produtos.set(produtos);
          this.cargos.set(cargos);
        },
        error: (error: HttpErrorResponse) => {
          this.error.set(
            error.status === 401
              ? 'Sua sessão expirou. Entre novamente para continuar.'
              : 'Não foi possível carregar os usuários.',
          );
        },
      });
  }

  protected nomeSubsetor(id: number): string {
    return this.subsetores().find((item) => item.id === id)?.nm_subsetor ?? `Subsetor #${id}`;
  }

  protected nomeProduto(id: number): string {
    return this.produtos().find((item) => item.id === id)?.nm_produto ?? `Produto #${id}`;
  }

  protected podeGerenciar(usuario: Usuario): boolean {
    const user = this.loggedUser();
    if (!user || user.cargo !== 'COORDENADOR') return false;
    return usuario.id_subsetor === user.id_subsetor && cargoBelow(this.cargos(), usuario.cargo, 'COORDENADOR');
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
    this.userService
      .remove(id)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => {
          this.usuarios.set(this.usuarios().filter((usuario) => usuario.id !== id));
          this.confirmingId.set(null);
        },
        error: (error: HttpErrorResponse) => {
          this.deleteError.set(
            typeof error.error?.detail === 'string' ? error.error.detail : 'Não foi possível excluir o usuário.',
          );
        },
      });
  }
}
