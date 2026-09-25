import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Client } from '../models/release.models';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:8000/api/v1/clientes';

  getById(id: number): Observable<Client> {
    const token = typeof localStorage === 'undefined' ? null : localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<unknown>(`${this.url}/${id}`, { headers }).pipe(map((response) => {
      const client = this.toClient(response);
      if (!client) throw new Error('Cliente inválido.');
      return client;
    }));
  }

  getClients(skip: number, limit: number, nome = ''): Observable<Client[]> {
    const token = typeof localStorage === 'undefined' ? null : localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    let params = new HttpParams().set('skip', skip).set('limit', limit);
    if (nome) params = params.set('nome', nome);
    const endpoint = nome ? `${this.url}/busca` : this.url;

    return this.http
      .get<unknown>(endpoint, { headers, params })
      .pipe(map((response) => this.extractClients(response)));
  }

  private extractClients(response: unknown): Client[] {
    const payload = this.asRecord(response);
    const records = Array.isArray(response)
      ? response
      : (payload?.['clientes'] ??
        payload?.['items'] ??
        payload?.['data'] ??
        payload?.['results'] ??
        []);

    if (!Array.isArray(records)) return [];
    return records
      .map((record) => this.toClient(record))
      .filter((client): client is Client => client !== null);
  }

  private toClient(value: unknown): Client | null {
    const record = this.asRecord(value);
    if (!record || typeof record['id'] !== 'number' || typeof record['nm_cliente'] !== 'string')
      return null;

    return {
      id: record['id'],
      nm_cliente: record['nm_cliente'],
      id_setor_atendimento: Number(record['id_setor_atendimento'] ?? 0),
      setor_atendimento: this.getSectorLabel(record['id_setor_atendimento']),
      status_ambiente: record['status_ambiente'] === 'PRD' ? 'PRD' : 'PRE-PROD',
      estado: typeof record['estado'] === 'string' ? record['estado'] : '—',
      id_usuario: Number(record['id_usuario'] ?? 0),
    };
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
  }

  private getSectorLabel(value: unknown): string {
    if (value === 1) return 'Fábrica';
    if (value === 2) return 'Serviços Técnicos';
    return 'Setor não informado';
  }
}
