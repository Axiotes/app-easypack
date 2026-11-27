import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { Product, Setor, Subsetor, TipoPacote, UsuarioRaw } from '../models/release.models';
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
  private cargos$?: Observable<string[]>;
  private tiposPacote$?: Observable<TipoPacote[]>;

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

  /** Ordem do mais sênior ao mais júnior (GERENTE_PROJETO primeiro). */
  getCargos(): Observable<string[]> {
    this.cargos$ ??= this.http
      .get<string[]>(`${BASE}/cargos`, { headers: authHeaders() })
      .pipe(shareReplay(1));
    return this.cargos$;
  }

  /** Grupo FORMS_REPORTS (Soul/Pagu) ou FRONT_BACK (PEP/Portaria/SACR) — ver `Produto.nm_grupo_tipo_pacote`. */
  getTiposPacote(): Observable<TipoPacote[]> {
    this.tiposPacote$ ??= this.http
      .get<TipoPacote[]>(`${BASE}/tipos-pacote`, { headers: authHeaders() })
      .pipe(shareReplay(1));
    return this.tiposPacote$;
  }

  /** Limpa os caches: usar após criar/editar/remover usuário ou cliente. */
  invalidateUsuarios(): void {
    this.usuarios$ = undefined;
  }
}
