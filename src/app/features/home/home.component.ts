import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppHeaderComponent } from './components/app-header/app-header.component';
import { ClientListComponent } from './components/client-list/client-list.component';
import { PackageTableComponent } from './components/package-table/package-table.component';
import { mockClients, mockPackages } from './data/mock-release.data';
import { Client, PackageFilters, ReleasePackage } from './models/release.models';
import { ClientService } from './services/client.service';
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pageSize = 20;
  private skip = 0;
  private hasMoreClients = true;
  private activeSearch = '';
  private requestId = 0;
  private readonly searchRequests = new Subject<string>();

  protected readonly clients = signal<Client[]>([]);
  protected selectedClient = mockClients[3];
  protected filters: PackageFilters = this.emptyFilters();
  protected readonly clientLoading = signal(false);
  protected readonly clientError = signal('');
  protected readonly clientSearch = signal('');

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
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

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
          if (isFirstPage && newClients[0]) this.selectedClient = newClients[0];
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
  protected get packageCount(): Record<number, number> {
    return mockPackages.reduce<Record<number, number>>((count, item) => {
      count[item.correcao.id_cliente] = (count[item.correcao.id_cliente] || 0) + 1;
      return count;
    }, {});
  }
  protected get selectedPackages(): ReleasePackage[] {
    const f = this.filters;
    const contains = (value: string, term: string) =>
      value.toLowerCase().includes(term.toLowerCase().trim());
    return mockPackages
      .filter((item) => item.correcao.id_cliente === this.selectedClient.id)
      .filter(
        (item) =>
          !f.search ||
          contains(
            `${item.nm_pacote} ${item.correcao.ticket} ${item.correcao.ticket_bug}`,
            f.search,
          ),
      )
      .filter((item) => !f.produto || item.correcao.produto === f.produto)
      .filter((item) => !f.versao || contains(item.correcao.versao_correcao, f.versao))
      .filter(
        (item) => !f.sn_aprovado_gerente || item.sn_aprovado_gerente === f.sn_aprovado_gerente,
      )
      .filter(
        (item) =>
          !f.sn_aprovado_code_review ||
          item.correcao.sn_aprovado_code_review === f.sn_aprovado_code_review,
      )
      .filter((item) => !f.sn_mergeado || item.correcao.sn_mergeado === f.sn_mergeado)
      .filter((item) => !f.ticket_bug || contains(item.correcao.ticket_bug, f.ticket_bug))
      .filter((item) => !f.setor || item.correcao.setor === f.setor);
  }
  protected get totalPackages(): number {
    return this.selectedPackages.length;
  }
  protected get appliedPackages(): number {
    return this.selectedPackages.filter((item) => item.sn_aplicado === 'S').length;
  }
  protected get pendingPackages(): number {
    return this.selectedPackages.filter((item) => item.sn_aplicado === 'N').length;
  }
  protected selectClient(client: Client): void {
    this.selectedClient = client;
    this.clearFilters();
  }
  protected clearFilters(): void {
    this.filters = this.emptyFilters();
  }
  private emptyFilters(): PackageFilters {
    return {
      search: '',
      produto: '',
      versao: '',
      sn_aprovado_gerente: '',
      sn_aprovado_code_review: '',
      sn_mergeado: '',
      ticket_bug: '',
      setor: '',
    };
  }
}
