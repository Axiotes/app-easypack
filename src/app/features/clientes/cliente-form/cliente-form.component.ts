import { LucideArrowLeft, LucideChevronRight, LucideSave } from '@lucide/angular';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin, of } from 'rxjs';
import { MainNavComponent } from '../../../shared/components/main-nav/main-nav.component';
import { AppHeaderComponent } from '../../home/components/app-header/app-header.component';
import { LoggedUser, Setor, UsuarioRaw } from '../../home/models/release.models';
import { ClientService } from '../../home/services/client.service';
import { ReferenceDataService } from '../../home/services/reference-data.service';
import { UserService } from '../../home/services/user.service';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AppHeaderComponent, MainNavComponent, LucideArrowLeft, LucideChevronRight, LucideSave],
  templateUrl: './cliente-form.component.html',
  styleUrls: ['../../home/home.component.scss', '../../../shared/styles/form-page.scss', './cliente-form.component.scss'],
})
export class ClienteFormComponent {
  private readonly clientService = inject(ClientService);
  private readonly userService = inject(UserService);
  private readonly referenceData = inject(ReferenceDataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  protected readonly loggedUser = signal<LoggedUser | null>(null);
  protected readonly setores = signal<Setor[]>([]);
  protected readonly gerentesProjeto = signal<UsuarioRaw[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly loadError = signal('');
  protected readonly saveError = signal('');
  protected readonly editId = signal<number | null>(null);
  protected readonly isEdit = computed(() => this.editId() !== null);

  protected readonly form = this.fb.group({
    nm_cliente: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)]],
    id_setor_atendimento: [null as number | null, Validators.required],
    id_usuario: [null as number | null, Validators.required],
  });

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) this.load();
  }

  protected load(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : null;
    this.editId.set(id);

    this.loading.set(true);
    this.loadError.set('');
    forkJoin({
      user: this.userService.getCurrentUser(),
      setores: this.referenceData.getSetores(),
      usuarios: this.referenceData.getUsuarios(),
      cliente: id !== null ? this.clientService.getById(id) : of(null),
    })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ user, setores, usuarios, cliente }) => {
          this.loggedUser.set(user);
          if (user.cargo !== 'GERENTE_PROJETO') {
            this.loadError.set('Apenas um Gerente de Projeto pode gerenciar clientes.');
            return;
          }
          this.setores.set(setores);
          this.gerentesProjeto.set(usuarios.filter((usuario) => usuario.cargo === 'GERENTE_PROJETO'));
          if (cliente) {
            this.form.patchValue({
              nm_cliente: cliente.nm_cliente,
              id_setor_atendimento: cliente.id_setor_atendimento,
              id_usuario: cliente.id_usuario,
            });
          }
        },
        error: (error: HttpErrorResponse) => {
          this.loadError.set(
            error.status === 401
              ? 'Sua sessão expirou. Entre novamente para continuar.'
              : error.status === 404
                ? 'Cliente não encontrado.'
                : 'Não foi possível carregar os dados do cadastro.',
          );
        },
      });
  }

  protected invalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }

  protected submit(): void {
    if (this.saving() || this.loading() || this.loadError()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const value = this.form.getRawValue();
    this.saving.set(true);
    this.saveError.set('');
    this.form.disable();

    const id = this.editId();
    const payload = {
      nm_cliente: value.nm_cliente!.trim(),
      id_setor_atendimento: value.id_setor_atendimento!,
      id_usuario: value.id_usuario!,
    };
    const request = id === null ? this.clientService.create(payload) : this.clientService.update(id, payload);

    request.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false))).subscribe({
      next: () => void this.router.navigate(['/clientes']),
      error: (error: HttpErrorResponse) => {
        this.form.enable();
        this.saveError.set(
          error.status === 401
            ? 'Sua sessão expirou. Entre novamente para continuar.'
            : typeof error.error?.detail === 'string'
              ? error.error.detail
              : 'Não foi possível salvar o cliente. Tente novamente.',
        );
      },
    });
  }
}
