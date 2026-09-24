import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppHeaderComponent } from './components/app-header/app-header.component';
import { ClientListComponent } from './components/client-list/client-list.component';
import { PackageTableComponent } from './components/package-table/package-table.component';
import { mockClients } from './data/mock-release.data';
import { Client, LoggedUser, PackageCount, PackageFilters, ReleasePackage } from './models/release.models';
import { ClientService } from './services/client.service';
import { PackageService } from './services/package.service';
import { UserService } from './services/user.service';
import { Subject, debounceTime, distinctUntilChanged, finalize, map } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, AppHeaderComponent, ClientListComponent, PackageTableComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly clientService = inject(ClientService);
  private readonly packageService = inject(PackageService);
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pageSize = 20;
  private skip = 0;
  private hasMoreClients = true;
  private activeSearch = '';
  private requestId = 0;
  private selectedClientIdFromRoute: number | null = null;
  private readonly searchRequests = new Subject<string>();
  private readonly packageCountRequests = new Subject<void>();
  private packageCountRequestId = 0;
  private packageSkip = 0;
  private hasMorePackages = true;
  private packageDetailsRequestId = 0;

  protected readonly clients = signal<Client[]>([]);
  protected selectedClient = mockClients[3];
  protected filters: PackageFilters = this.emptyFilters();
  protected readonly clientLoading = signal(false);
  protected readonly clientError = signal('');
  protected readonly clientSearch = signal('');
  protected readonly packageCounts = signal<PackageCount>({
    total_pacotes: 0,
    total_aplicados: 0,
    total_pendentes: 0,
  });
  protected readonly packages = signal<ReleasePackage[]>([]);
  protected readonly packageLoading = signal(false);
  protected readonly packageError = signal('');
  protected readonly loggedUser = signal<LoggedUser | null>(null);

  constructor() {
    this.searchRequests
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((nome) => {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { cliente: nome || null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      });
    this.packageCountRequests
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadPackageCount();
        this.resetPackageDetails();
      });
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.filters = this.filtersFromRoute();
    this.loadCurrentUser();

    this.route.queryParamMap
      .pipe(
        map((params) => params.get('cliente')?.trim() ?? ''),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((nome) => {
        this.clientSearch.set(nome);
        this.searchClients(nome);
      });
    this.route.queryParamMap
      .pipe(
        map((params) => Number(params.get('id_cliente')) || null),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((idCliente) => {
        this.selectedClientIdFromRoute = idCliente;
        const client = this.clients().find((item) => item.id === idCliente);
        if (client) this.applySelectedClient(client, false);
      });
  }
  private loadCurrentUser(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user) => this.loggedUser.set(user),
    });
  }

  protected loadMoreClients(): void {
    if (this.clientLoading() || !this.hasMoreClients) return;
    const requestId = ++this.requestId;
    const isFirstPage = this.skip === 0;
    this.clientLoading.set(true);
    this.clientError.set('');
    this.clientService
      .getClients(this.skip, this.pageSize, this.activeSearch)
      .pipe(
        finalize(() => {
          if (requestId === this.requestId) this.clientLoading.set(false);
        }),
      )
      .subscribe({
        next: (clients) => {
          if (requestId !== this.requestId) return;
          const currentClients = this.clients();
          const newClients = clients.filter(
            (client) => !currentClients.some((current) => current.id === client.id),
          );
          this.clients.set([...currentClients, ...newClients]);
          this.skip += clients.length;
          this.hasMoreClients = clients.length === this.pageSize;
          if (isFirstPage) {
            const selectedFromRoute = this.clients().find(
              (client) => client.id === this.selectedClientIdFromRoute,
            );
            const client = selectedFromRoute ?? newClients[0];
            if (client) this.applySelectedClient(client, false);
          }
        },
        error: () => {
          if (requestId === this.requestId) {
            this.clientError.set('Não foi possível carregar os clientes.');
          }
        },
      });
  }
  protected updateClientSearch(nome: string): void {
    this.searchRequests.next(nome.trim());
  }
  private searchClients(nome: string): void {
    this.requestId++;
    this.activeSearch = nome;
    this.skip = 0;
    this.hasMoreClients = true;
    this.clients.set([]);
    this.clientLoading.set(false);
    this.clientError.set('');
    this.loadMoreClients();
  }
  protected updatePackageFilters(): void {
    this.persistPackageFilters();
    this.packageCountRequests.next();
  }
  private loadPackageCount(): void {
    const requestId = ++this.packageCountRequestId;
    this.packageService.getCount(this.selectedClient.id, this.filters).subscribe({
      next: (counts) => {
        if (requestId === this.packageCountRequestId) this.packageCounts.set(counts);
      },
    });
  }
  protected loadMorePackages(): void {
    if (this.packageLoading() || !this.hasMorePackages) return;
    const requestId = ++this.packageDetailsRequestId;
    this.packageLoading.set(true);
    this.packageError.set('');
    this.packageService
      .getDetails(this.selectedClient.id, this.packageSkip, this.pageSize, this.filters)
      .pipe(
        finalize(() => {
          if (requestId === this.packageDetailsRequestId) this.packageLoading.set(false);
        }),
      )
      .subscribe({
        next: (packages) => {
          if (requestId !== this.packageDetailsRequestId) return;
          const currentPackages = this.packages();
          const newPackages = packages.filter(
            (item) => !currentPackages.some((current) => current.id === item.id),
          );
          this.packages.set([...currentPackages, ...newPackages]);
          this.packageSkip += packages.length;
          this.hasMorePackages = packages.length === this.pageSize;
        },
        error: () => {
          if (requestId === this.packageDetailsRequestId) {
            this.packageError.set('Não foi possível carregar os pacotes.');
          }
        },
      });
  }
  private resetPackageDetails(): void {
    this.packageDetailsRequestId++;
    this.packageSkip = 0;
    this.hasMorePackages = true;
    this.packages.set([]);
    this.packageLoading.set(false);
    this.packageError.set('');
    this.loadMorePackages();
  }
  protected selectClient(client: Client): void {
    this.applySelectedClient(client);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id_cliente: client.id },
      queryParamsHandling: 'merge',
    });
  }
  private applySelectedClient(client: Client, resetFilters = true): void {
    if (this.selectedClient === client) return;
    this.selectedClient = client;
    if (resetFilters) this.clearFilters();
    else {
      this.loadPackageCount();
      this.resetPackageDetails();
    }
  }
  protected clearFilters(): void {
    this.filters = this.emptyFilters();
    this.persistPackageFilters();
    this.loadPackageCount();
    this.resetPackageDetails();
  }
  private persistPackageFilters(): void {
    const filters = this.filters;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        nm_pacote: filters.nm_pacote || null,
        ticket: filters.ticket || null,
        id_produto: filters.id_produto || null,
        versao_correcao: filters.versao_correcao || null,
        sn_aplicado: filters.sn_aplicado || null,
        sn_aprovado_gerente: filters.sn_aprovado_gerente || null,
        sn_mergeado: filters.sn_mergeado || null,
        ticket_bug: filters.ticket_bug || null,
        id_setor: filters.id_setor || null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
  private filtersFromRoute(): PackageFilters {
    const params = this.route.snapshot.queryParamMap;
    return {
      nm_pacote: params.get('nm_pacote')?.trim() ?? '',
      ticket: params.get('ticket')?.trim() ?? '',
      id_produto: this.readPositiveInteger(params.get('id_produto')),
      versao_correcao: params.get('versao_correcao')?.trim() ?? '',
      sn_aplicado: this.readYesNo(params.get('sn_aplicado')),
      sn_aprovado_gerente: this.readYesNo(params.get('sn_aprovado_gerente')),
      sn_mergeado: this.readYesNo(params.get('sn_mergeado')),
      ticket_bug: params.get('ticket_bug')?.trim() ?? '',
      id_setor: this.readPositiveInteger(params.get('id_setor')),
    };
  }
  private readYesNo(value: string | null): '' | 'S' | 'N' {
    return value === 'S' || value === 'N' ? value : '';
  }
  private readPositiveInteger(value: string | null): '' | number {
    const numberValue = Number(value);
    return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : '';
  }
  private emptyFilters(): PackageFilters {
    return {
      nm_pacote: '',
      ticket: '',
      id_produto: '',
      versao_correcao: '',
      sn_aplicado: '',
      sn_aprovado_gerente: '',
      sn_mergeado: '',
      ticket_bug: '',
      id_setor: '',
    };
  }
}
