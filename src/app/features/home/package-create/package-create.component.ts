import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, PLATFORM_ID, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideBuilding2, LucideChevronRight, LucidePackage, LucideSave } from '@lucide/angular';
import { finalize, forkJoin } from 'rxjs';
import { AppHeaderComponent } from '../components/app-header/app-header.component';
import { Client, LoggedUser, Product, YesNo } from '../models/release.models';
import { ClientService } from '../services/client.service';
import { PackageService } from '../services/package.service';
import { UserService } from '../services/user.service';

const integerCode: ValidatorFn = (control) => control.value === null || Number.isSafeInteger(control.value) ? null : { integer: true };

@Component({
  selector: 'app-package-create',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AppHeaderComponent, LucideArrowLeft,
    LucideBuilding2, LucideChevronRight, LucidePackage, LucideSave],
  templateUrl: './package-create.component.html',
  styleUrls: ['../home.component.scss', './package-create.component.scss'],
})
export class PackageCreateComponent {
  private readonly service = inject(PackageService);
  private readonly clientService = inject(ClientService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  protected readonly loggedUser = signal<LoggedUser | null>(null);
  protected readonly client = signal<Client | null>(null);
  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly loadError = signal('');
  protected readonly saveError = signal('');
  protected readonly createdId = signal<number | null>(null);
  protected readonly form = this.fb.group({
    nm_pacote: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)]],
    tp_pacote: [null as number | null, [Validators.required, integerCode]],
    id_produto: [null as number | null, Validators.required],
    ticket: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    versao_correcao: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(50)]],
    ticket_bug: ['', Validators.maxLength(100)],
    merge: ['', Validators.maxLength(255)],
    sn_mergeado: ['N' as YesNo, Validators.required],
  });

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) this.load();
  }

  protected load(): void {
    const id = Number(this.route.snapshot.queryParamMap.get('id_cliente'));
    if (!Number.isSafeInteger(id) || id <= 0) {
      this.loadError.set('Selecione um cliente na listagem para cadastrar um pacote.');
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.loadError.set('');
    forkJoin({ client: this.clientService.getById(id), user: this.userService.getCurrentUser(),
      products: this.service.getProducts() }).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)),
    ).subscribe({
      next: ({ client, user, products }) => {
        this.client.set(client);
        this.loggedUser.set(user);
        const ownProduct = user.nm_produto.toUpperCase();
        const allowed = products.filter((product) => product.nm_produto.toUpperCase() === ownProduct ||
          (product.nm_produto.toUpperCase() === 'PAGU' && ['SOUL', 'PEP'].includes(ownProduct)));
        this.products.set(allowed);
        this.form.controls.id_produto.setValue(allowed.find((p) => p.nm_produto.toUpperCase() === ownProduct)?.id ?? null);
        if (!allowed.length) this.loadError.set('Nenhum produto disponível para o seu perfil.');
      },
      error: (error: HttpErrorResponse) => this.loadError.set(this.errorMessage(error, 'Não foi possível carregar os dados do cadastro.')),
    });
  }

  protected invalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.touched && control.invalid;
  }

  protected submit(): void {
    if (this.saving() || this.loading() || this.loadError() || this.createdId()) return;
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    const client = this.client();
    if (this.form.invalid || !client || !Number.isSafeInteger(value.tp_pacote) ||
      !this.products().some((product) => product.id === value.id_produto)) return;
    this.saving.set(true);
    this.saveError.set('');
    this.form.disable();
    this.service.create({
      nm_pacote: value.nm_pacote!.trim(), tp_pacote: value.tp_pacote!,
      id_cliente: client.id, id_produto: value.id_produto!, ticket: value.ticket!.trim(),
      versao_correcao: value.versao_correcao!.trim(), ticket_bug: value.ticket_bug?.trim() || null,
      merge: value.merge?.trim() || null, sn_mergeado: value.sn_mergeado!,
    }).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false))).subscribe({
      next: (created) => {
        this.createdId.set(created.id);
        void this.router.navigate(['/pacotes', created.id], { queryParams: { id_cliente: client.id }, queryParamsHandling: 'merge' });
      },
      error: (error: HttpErrorResponse) => {
        this.form.enable();
        this.saveError.set(this.errorMessage(error, 'Não foi possível cadastrar o pacote e a correção. Tente novamente.'));
      },
    });
  }

  private errorMessage(error: HttpErrorResponse, fallback: string): string {
    if (error.status === 401) return 'Sua sessão expirou. Entre novamente para continuar.';
    if (typeof error.error?.detail === 'string') return error.error.detail;
    if (error.status === 403) return 'Você não tem permissão para realizar esta operação.';
    if (error.status === 422) return 'Verifique os dados informados e tente novamente.';
    return fallback;
  }
}
