import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay, switchMap } from 'rxjs';
import { Client, ClienteCreate, ClienteUpdate, Setor } from '../models/release.models';
import { authHeaders } from './auth-headers';
import { ReferenceDataService } from './reference-data.service';

interface ClienteRaw {
  id: number;
  nm_cliente: string;
  id_setor_atendimento: number;
  id_usuario: number;
}

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly http = inject(HttpClient);
  private readonly referenceData = inject(ReferenceDataService);
  private readonly url = 'http://localhost:8000/api/v1/clientes';
  private clients$?: Observable<Client[]>;

  getById(id: number): Observable<Client> {
    return this.http.get<ClienteRaw>(`${this.url}/${id}`, { headers: authHeaders() }).pipe(
      switchMap((raw) =>
        this.referenceData.getSetores().pipe(map((setores) => this.toClient(raw, setores))),
      ),
    );
  }

  /** O backend não suporta paginação nem busca por nome; filtra e pagina em memória. */
  getClients(skip: number, limit: number, nome = ''): Observable<Client[]> {
    return this.allClients().pipe(
      map((clients) => {
        const filtered = nome
          ? clients.filter((client) => client.nm_cliente.toLowerCase().includes(nome.toLowerCase()))
          : clients;
        return filtered.slice(skip, skip + limit);
      }),
    );
  }

  listAll(): Observable<Client[]> {
    return this.allClients();
  }

  create(data: ClienteCreate): Observable<Client> {
    return this.http.post<ClienteRaw>(this.url, data, { headers: authHeaders() }).pipe(
      switchMap((raw) => this.referenceData.getSetores().pipe(map((setores) => this.toClient(raw, setores)))),
      map((client) => {
        this.invalidate();
        return client;
      }),
    );
  }

  update(id: number, data: ClienteUpdate): Observable<Client> {
    return this.http.put<ClienteRaw>(`${this.url}/${id}`, data, { headers: authHeaders() }).pipe(
      switchMap((raw) => this.referenceData.getSetores().pipe(map((setores) => this.toClient(raw, setores)))),
      map((client) => {
        this.invalidate();
        return client;
      }),
    );
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`, { headers: authHeaders() }).pipe(
      map(() => this.invalidate()),
    );
  }

  private invalidate(): void {
    this.clients$ = undefined;
  }

  private allClients(): Observable<Client[]> {
    this.clients$ ??= this.http.get<ClienteRaw[]>(this.url, { headers: authHeaders() }).pipe(
      switchMap((raw) =>
        this.referenceData
          .getSetores()
          .pipe(map((setores) => raw.map((item) => this.toClient(item, setores)))),
      ),
      shareReplay(1),
    );
    return this.clients$;
  }

  private toClient(raw: ClienteRaw, setores: Setor[]): Client {
    return {
      id: raw.id,
      nm_cliente: raw.nm_cliente,
      id_setor_atendimento: raw.id_setor_atendimento,
      setor_atendimento:
        setores.find((setor) => setor.id === raw.id_setor_atendimento)?.nm_setor ??
        'Setor não informado',
      id_usuario: raw.id_usuario,
    };
  }
}
