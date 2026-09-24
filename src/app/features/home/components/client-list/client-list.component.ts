import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Client } from '../../models/release.models';

@Component({ selector: 'app-client-list', standalone: true, imports: [FormsModule], templateUrl: './client-list.component.html', styleUrl: './client-list.component.scss' })
export class ClientListComponent {
  @Input({ required: true }) clients: Client[] = [];
  @Input({ required: true }) selectedClientId = 0;
  @Input() packageCount: Record<number, number> = {};
  @Input() loading = false;
  @Input() errorMessage = '';
  @Input() set searchTerm(value: string) { this.search = value; }
  @Output() selectClient = new EventEmitter<Client>();
  @Output() loadMore = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<string>();

  protected search = '';
  protected get filteredClients(): Client[] { return this.clients; }

  protected environmentClass(status: Client['status_ambiente']): string { return `environment environment--${status.toLowerCase()}`; }
  protected onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 24) this.loadMore.emit();
  }
}
