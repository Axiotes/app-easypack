import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppHeaderComponent } from './components/app-header/app-header.component';
import { ClientListComponent } from './components/client-list/client-list.component';
import { PackageTableComponent } from './components/package-table/package-table.component';
import { mockClients, mockPackages } from './data/mock-release.data';
import { Client, PackageFilters, ReleasePackage } from './models/release.models';

@Component({ selector: 'app-home', standalone: true, imports: [FormsModule, AppHeaderComponent, ClientListComponent, PackageTableComponent], templateUrl: './home.component.html', styleUrl: './home.component.scss' })
export class HomeComponent {
  protected readonly clients = mockClients;
  protected selectedClient = mockClients[3];
  protected filters: PackageFilters = this.emptyFilters();
  protected get packageCount(): Record<number, number> { return mockPackages.reduce<Record<number, number>>((count, item) => { count[item.correcao.id_cliente] = (count[item.correcao.id_cliente] || 0) + 1; return count; }, {}); }
  protected get selectedPackages(): ReleasePackage[] {
    const f = this.filters; const contains = (value: string, term: string) => value.toLowerCase().includes(term.toLowerCase().trim());
    return mockPackages.filter(item => item.correcao.id_cliente === this.selectedClient.id)
      .filter(item => !f.search || contains(`${item.nm_pacote} ${item.correcao.ticket} ${item.correcao.ticket_bug}`, f.search))
      .filter(item => !f.produto || item.correcao.produto === f.produto).filter(item => !f.versao || contains(item.correcao.versao_correcao, f.versao))
      .filter(item => !f.sn_aprovado_gerente || item.sn_aprovado_gerente === f.sn_aprovado_gerente).filter(item => !f.sn_aprovado_code_review || item.correcao.sn_aprovado_code_review === f.sn_aprovado_code_review)
      .filter(item => !f.sn_mergeado || item.correcao.sn_mergeado === f.sn_mergeado).filter(item => !f.ticket_bug || contains(item.correcao.ticket_bug, f.ticket_bug)).filter(item => !f.setor || item.correcao.setor === f.setor);
  }
  protected get totalPackages(): number { return this.selectedPackages.length; }
  protected get appliedPackages(): number { return this.selectedPackages.filter(item => item.sn_aplicado === 'S').length; }
  protected get pendingPackages(): number { return this.selectedPackages.filter(item => item.sn_aplicado === 'N').length; }
  protected selectClient(client: Client): void { this.selectedClient = client; this.clearFilters(); }
  protected clearFilters(): void { this.filters = this.emptyFilters(); }
  private emptyFilters(): PackageFilters { return { search: '', produto: '', versao: '', sn_aprovado_gerente: '', sn_aprovado_code_review: '', sn_mergeado: '', ticket_bug: '', setor: '' }; }
}
