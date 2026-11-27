import { LucideArrowLeft, LucideChevronRight, LucideSave, LucideUserCog } from '@lucide/angular';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin, of } from 'rxjs';
import { MainNavComponent } from '../../../shared/components/main-nav/main-nav.component';
import { AppHeaderComponent } from '../../home/components/app-header/app-header.component';
import { LoggedUser, Product } from '../../home/models/release.models';
import { ReferenceDataService } from '../../home/services/reference-data.service';
import { UserService } from '../../home/services/user.service';
import { cargoBelow } from '../../home/utils/cargo.util';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AppHeaderComponent, MainNavComponent, LucideArrowLeft, LucideChevronRight, LucideSave, LucideUserCog],
  templateUrl: './usuario-form.component.html',
  styleUrls: ['../../home/home.component.scss', '../../../shared/styles/form-page.scss', './usuario-form.component.scss'],
})
export class UsuarioFormComponent {
  private readonly userService = inject(UserService);
  private readonly referenceData = inject(ReferenceDataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  protected readonly loggedUser = signal<LoggedUser | null>(null);
  protected readonly produtos = signal<Product[]>([]);
  protected readonly cargosDisponiveis = signal<string[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly loadError = signal('');
  protected readonly saveError = signal('');
  protected readonly editId = signal<number | null>(null);
  protected readonly isEdit = computed(() => this.editId() !== null);

  protected readonly form = this.fb.group({
    nm_usuario: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    nm_completo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
    senha: ['', [Validators.minLength(6), Validators.maxLength(100)]],
    cargo: [null as string | null, Validators.required],
    id_produto: [null as number | null, Validators.required],
  });

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) this.load();
  }

  protected load(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : null;
    this.editId.set(id);
    this.form.controls.senha.setValidators(
      id === null
        ? [Validators.required, Validators.minLength(6), Validators.maxLength(100)]
        : [Validators.minLength(6), Validators.maxLength(100)],
    );

    this.loading.set(true);
    this.loadError.set('');
    forkJoin({
      user: this.userService.getCurrentUser(),
      produtos: this.referenceData.getProdutos(),
      cargos: this.referenceData.getCargos(),
      usuario: id !== null ? this.userService.getById(id) : of(null),
    })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ user, produtos, cargos, usuario }) => {
          this.loggedUser.set(user);
          this.produtos.set(produtos);
          this.cargosDisponiveis.set(cargos.filter((cargo) => cargoBelow(cargos, cargo, 'COORDENADOR')));
          if (usuario) {
            if (usuario.id_subsetor !== user.id_subsetor) {
              this.loadError.set('Você só pode editar usuários do seu próprio subsetor.');
              return;
            }
            this.form.patchValue({
              nm_usuario: usuario.nm_usuario,
              nm_completo: usuario.nm_completo,
              cargo: usuario.cargo,
              id_produto: usuario.id_produto,
            });
          }
        },
        error: (error: HttpErrorResponse) => {
          this.loadError.set(
            error.status === 401
              ? 'Sua sessão expirou. Entre novamente para continuar.'
              : error.status === 404
                ? 'Usuário não encontrado.'
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
    const user = this.loggedUser();
    if (!user) return;

    const value = this.form.getRawValue();
    this.saving.set(true);
    this.saveError.set('');
    this.form.disable();

    const id = this.editId();
    const request =
      id === null
        ? this.userService.create({
            nm_usuario: value.nm_usuario!.trim(),
            nm_completo: value.nm_completo!.trim(),
            senha: value.senha!.trim(),
            cargo: value.cargo!,
            id_subsetor: user.id_subsetor,
            id_produto: value.id_produto!,
          })
        : this.userService.update(id, {
            nm_usuario: value.nm_usuario!.trim(),
            nm_completo: value.nm_completo!.trim(),
            ...(value.senha?.trim() ? { senha: value.senha.trim() } : {}),
            cargo: value.cargo!,
            id_produto: value.id_produto!,
          });

    request.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false))).subscribe({
      next: () => void this.router.navigate(['/usuarios']),
      error: (error: HttpErrorResponse) => {
        this.form.enable();
        this.saveError.set(
          error.status === 401
            ? 'Sua sessão expirou. Entre novamente para continuar.'
            : typeof error.error?.detail === 'string'
              ? error.error.detail
              : error.status === 409
                ? 'Nome de usuário já cadastrado.'
                : 'Não foi possível salvar o usuário. Tente novamente.',
        );
      },
    });
  }
}
