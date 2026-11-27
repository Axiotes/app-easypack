import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, switchMap } from 'rxjs';
import { LoggedUser, Usuario, UsuarioCreate, UsuarioUpdate } from '../models/release.models';
import { authHeaders } from './auth-headers';
import { ReferenceDataService } from './reference-data.service';

interface UsuarioMeRaw {
  id: number;
  nm_usuario: string;
  nm_completo: string;
  cargo: string;
  id_subsetor: number;
  id_produto: number;
}

const BASE = 'http://localhost:8000/api/v1';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly referenceData = inject(ReferenceDataService);

  /** `/usuarios/me` só retorna ids de subsetor/produto; resolve os nomes e o setor aqui. */
  getCurrentUser(): Observable<LoggedUser> {
    return this.http.get<UsuarioMeRaw>(`${BASE}/usuarios/me`, { headers: authHeaders() }).pipe(
      switchMap((raw) =>
        forkJoin({
          subsetores: this.referenceData.getSubsetores(),
          produtos: this.referenceData.getProdutos(),
          setores: this.referenceData.getSetores(),
        }).pipe(
          map(({ subsetores, produtos, setores }) => {
            const subsetor = subsetores.find((item) => item.id === raw.id_subsetor);
            const setor = setores.find((item) => item.id === subsetor?.id_setor);
            return {
              id: raw.id,
              nm_usuario: raw.nm_usuario,
              nm_completo: raw.nm_completo,
              cargo: raw.cargo,
              id_subsetor: raw.id_subsetor,
              nm_subsetor: subsetor?.nm_subsetor ?? 'Subsetor não informado',
              sn_gerencia: subsetor?.sn_gerencia ?? 'N',
              sg_setor: setor?.sg_setor ?? '—',
              id_produto: raw.id_produto,
              nm_produto: produtos.find((produto) => produto.id === raw.id_produto)?.nm_produto ?? 'Produto não informado',
            };
          }),
        ),
      ),
    );
  }

  list(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${BASE}/usuarios`, { headers: authHeaders() });
  }

  getById(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${BASE}/usuarios/${id}`, { headers: authHeaders() });
  }

  create(data: UsuarioCreate): Observable<Usuario> {
    return this.http.post<Usuario>(`${BASE}/usuarios`, data, { headers: authHeaders() }).pipe(
      map((usuario) => {
        this.referenceData.invalidateUsuarios();
        return usuario;
      }),
    );
  }

  update(id: number, data: UsuarioUpdate): Observable<Usuario> {
    return this.http.put<Usuario>(`${BASE}/usuarios/${id}`, data, { headers: authHeaders() }).pipe(
      map((usuario) => {
        this.referenceData.invalidateUsuarios();
        return usuario;
      }),
    );
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/usuarios/${id}`, { headers: authHeaders() }).pipe(
      map(() => this.referenceData.invalidateUsuarios()),
    );
  }
}
