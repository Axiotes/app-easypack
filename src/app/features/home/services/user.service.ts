import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, switchMap } from 'rxjs';
import { LoggedUser } from '../models/release.models';
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

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly referenceData = inject(ReferenceDataService);
  private readonly url = 'http://localhost:8000/api/v1/usuarios/me';

  /** `/usuarios/me` só retorna ids de subsetor/produto; resolve os nomes aqui. */
  getCurrentUser(): Observable<LoggedUser> {
    return this.http.get<UsuarioMeRaw>(this.url, { headers: authHeaders() }).pipe(
      switchMap((raw) =>
        forkJoin({
          subsetores: this.referenceData.getSubsetores(),
          produtos: this.referenceData.getProdutos(),
        }).pipe(
          map(({ subsetores, produtos }) => ({
            id: raw.id,
            nm_usuario: raw.nm_usuario,
            nm_completo: raw.nm_completo,
            cargo: raw.cargo,
            nm_subsetor:
              subsetores.find((subsetor) => subsetor.id === raw.id_subsetor)?.nm_subsetor ??
              'Subsetor não informado',
            nm_produto:
              produtos.find((produto) => produto.id === raw.id_produto)?.nm_produto ??
              'Produto não informado',
          })),
        ),
      ),
    );
  }
}
