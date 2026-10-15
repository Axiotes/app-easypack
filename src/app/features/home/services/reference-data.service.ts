import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { Product, Setor, Subsetor, UsuarioRaw } from '../models/release.models';
import { authHeaders } from './auth-headers';

const BASE = 'http://localhost:8000/api/v1';

/**
 * O backend não resolve nomes (produto, setor, subsetor, usuário) nas respostas
 * de pacotes/correções/usuário logado — só expõe os ids. Este serviço cacheia as
 * listas de referência (poucas linhas, mudam raramente) para os demais services
 * fazerem o join no cliente.
 */
@Injectable({ providedIn: 'root' })
export class ReferenceDataService {
  private readonly http = inject(HttpClient);

  private produtos$?: Observable<Product[]>;
  private setores$?: Observable<Setor[]>;
  private subsetores$?: Observable<Subsetor[]>;
  private usuarios$?: Observable<UsuarioRaw[]>;

  getProdutos(): Observable<Product[]> {
    this.produtos$ ??= this.http
      .get<Product[]>(`${BASE}/produtos`, { headers: authHeaders() })
      .pipe(shareReplay(1));
    return this.produtos$;
  }

  getSetores(): Observable<Setor[]> {
    this.setores$ ??= this.http
      .get<Setor[]>(`${BASE}/setores`, { headers: authHeaders() })
      .pipe(shareReplay(1));
    return this.setores$;
  }

  getSubsetores(): Observable<Subsetor[]> {
    this.subsetores$ ??= this.http
      .get<Subsetor[]>(`${BASE}/subsetores`, { headers: authHeaders() })
      .pipe(shareReplay(1));
    return this.subsetores$;
  }

  getUsuarios(): Observable<UsuarioRaw[]> {
    this.usuarios$ ??= this.http
      .get<UsuarioRaw[]>(`${BASE}/usuarios`, { headers: authHeaders() })
      .pipe(shareReplay(1));
    return this.usuarios$;
  }
}
