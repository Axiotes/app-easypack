import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideChevronRight, LucidePackage, LucideSave } from '@lucide/angular';
import { finalize, forkJoin } from 'rxjs';
import { MainNavComponent } from '../../../shared/components/main-nav/main-nav.component';
import { AppHeaderComponent } from '../components/app-header/app-header.component';
import { Client, LoggedUser, Product, TipoPacote, YesNo } from '../models/release.models';
import { ClientService } from '../services/client.service';
import { PackageService } from '../services/package.service';
import { ReferenceDataService } from '../services/reference-data.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-package-create',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AppHeaderComponent, MainNavComponent, LucideArrowLeft,
    LucideChevronRight, LucidePackage, LucideSave],
  templateUrl: './package-create.component.html',
  styleUrls: ['../home.component.scss', '../../../shared/styles/form-page.scss', './package-create.component.scss'],
})
export class PackageCreateComponent {
  private readonly service = inject(PackageService);
  private readonly clientService = inject(ClientService);
  private readonly userService = inject(UserService);
  private readonly referenceData = inject(ReferenceDataService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  protected readonly loggedUser = signal<LoggedUser | null>(null);
  protected readonly client = signal<Client | null>(null);
  protected readonly products = signal<Product[]>([]);
  protected readonly tiposPacote = signal<TipoPacote[]>([]);
  protected readonly selectedProdutoId = signal<number | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly loadError = signal('');
  protected readonly saveError = signal('');
  protected readonly createdId = signal<number | null>(null);
  protected readonly form = this.fb.group({
    nm_pacote: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)]],
    tp_pacote: [null as number | null, Validators.required],
    id_produto: [null as number | null, Validators.required],
    ticket: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)]],
    versao_correcao: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(50)]],
    ticket_bug: ['', Validators.maxLength(100)],
    merge: ['', Validators.maxLength(255)],
    sn_mergeado: ['N' as YesNo, Validators.required],
  });

  protected readonly tiposDisponiveis = computed(() => {
    const produto = this.products().find((item) => item.id === this.selectedProdutoId());
    if (!produto) return [];
    return this.tiposPacote().filter((tipo) => tipo.nm_grupo === produto.nm_grupo_tipo_pacote);
  });

  constructor() {
    this.form.controls.id_produto.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((id) => {
      this.selectedProdutoId.set(id);
      this.form.controls.tp_pacote.setValue(null);
    });
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
      products: this.service.getProducts(), tiposPacote: this.referenceData.getTiposPacote() }).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)),
    ).subscribe({
      next: ({ client, user, products, tiposPacote }) => {
        this.client.set(client);
        this.loggedUser.set(user);
        this.tiposPacote.set(tiposPacote);
        const ownProduct = user.nm_produto.toUpperCase();
        const allowed = products.filter((product) => product.nm_produto.toUpperCase() === ownProduct ||
          (product.nm_produto.toUpperCase() === 'PAGU' && ['SOUL', 'PEP'].includes(ownProduct)) ||
          (product.nm_produto.toUpperCase() === 'PORTARIA' && ownProduct === 'SOUL'));
        this.products.set(allowed);
        const defaultProdutoId = allowed.find((p) => p.nm_produto.toUpperCase() === ownProduct)?.id ?? null;
        this.form.controls.id_produto.setValue(defaultProdutoId);
        this.selectedProdutoId.set(defaultProdutoId);
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
