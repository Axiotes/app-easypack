import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Client } from '../../models/release.models';

@Component({ selector: 'app-client-list', standalone: true, imports: [FormsModule], templateUrl: './client-list.component.html', styleUrl: './client-list.component.scss' })
export class ClientListComponent {
  @Input({ required: true }) clients: Client[] = [];
  @Input({ required: true }) selectedClientId = 0;
  @Input() packageCount: Record<number, number> = {};
  @Output() selectClient = new EventEmitter<Client>();
  protected search = '';
  protected get filteredClients(): Client[] { const term = this.search.toLowerCase().trim(); return this.clients.filter(client => client.nm_cliente.toLowerCase().includes(term)); }
  protected environmentClass(status: Client['status_ambiente']): string { return `environment environment--${status.toLowerCase()}`; }
}
