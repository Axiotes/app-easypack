import { LucideArrowLeft, LucideBuilding2, LucideChevronRight, LucidePackage } from '@lucide/angular';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, PLATFORM_ID, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { AppHeaderComponent } from '../components/app-header/app-header.component';
import { LoggedUser, PackageDetails } from '../models/release.models';
import { PackageService } from '../services/package.service';
import { UserService } from '../services/user.service';

interface DetailField {
  key: keyof PackageDetails;
  label: string;
  status?: boolean;
}

@Component({
  selector: 'app-package-details',
  standalone: true,
  imports: [LucideArrowLeft, LucideBuilding2, LucideChevronRight, LucidePackage, RouterLink, AppHeaderComponent],
  templateUrl: './package-details.component.html',
  styleUrls: ['../home.component.scss', './package-details.component.scss'],
})
export class PackageDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly packageService = inject(PackageService);
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly details = signal<PackageDetails | null>(null);
  protected readonly loggedUser = signal<LoggedUser | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly sections: { title: string; fields: DetailField[] }[] = [
    { title: 'Dados do pacote', fields: [
      { key: 'id', label: 'ID do pacote' },
      { key: 'nm_pacote', label: 'Nome do pacote' },
      { key: 'tp_pacote', label: 'Tipo do pacote (código)' },
      { key: 'sn_aplicado', label: 'Aplicado', status: true },
      { key: 'sn_aprovado_usu', label: 'Aprovação do usuário', status: true },
      { key: 'sn_aprovado_gerente', label: 'Aprovação do gerente de projeto', status: true },
      { key: 'id_usuario_aplicacao', label: 'Aplicado por' },
      { key: 'id_usuario_aprovador_gerente', label: 'Gerente aprovador' },
      { key: 'id_usuario_aprovador_par', label: 'Aprovador par' },
    ] },
    { title: 'Dados da correção', fields: [
      { key: 'id_correcao', label: 'ID da correção' },
      { key: 'versao_correcao', label: 'Versão da correção' },
      { key: 'id_cliente', label: 'Cliente' },
      { key: 'id_produto', label: 'Produto' },
      { key: 'id_setor', label: 'Setor' },
      { key: 'id_usuario', label: 'Responsável pela correção' },
      { key: 'ticket', label: 'Ticket' },
      { key: 'ticket_bug', label: 'Ticket bug' },
      { key: 'merge', label: 'Merge' },
      { key: 'sn_mergeado', label: 'Mergeado', status: true },
      { key: 'sn_aprovado_code_review', label: 'Code review aprovado', status: true },
      { key: 'id_usuario_aprovador', label: 'Aprovador da correção' },
    ] },
  ];

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    this.userService.getCurrentUser().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (user) => this.loggedUser.set(user),
      error: () => this.loggedUser.set(null),
    });
    this.route.paramMap.pipe(
      map((params) => params.get('id') ?? ''),
      tap(() => {
        this.loading.set(true);
        this.error.set('');
        this.details.set(null);
      }),
      switchMap((value) => {
        const id = Number(value);
        if (!/^\d+$/.test(value) || !Number.isSafeInteger(id) || id <= 0) {
          this.error.set('ID do pacote inválido.');
          return of(null);
        }
        return this.packageService.getById(id).pipe(catchError((error: HttpErrorResponse) => {
          this.error.set(error.status === 404 ? 'Pacote não encontrado.' :
            error.status === 401 ? 'Sua sessão expirou. Entre novamente para consultar o pacote.' :
            error.status === 403 ? 'Você não tem permissão para consultar este pacote.' :
            'Não foi possível carregar os detalhes do pacote. Tente novamente.');
          return of(null);
        }));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((details) => {
      this.details.set(details);
      this.loading.set(false);
    });
  }

  protected display(value: PackageDetails[keyof PackageDetails], status = false): string {
    if (value === null || value === '') return 'Não informado';
    if (status) return value === 'S' ? 'Sim' : 'Não';
    return String(value);
  }
}
