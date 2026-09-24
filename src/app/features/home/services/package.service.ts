import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PackageCount, PackageFilters } from '../models/release.models';

@Injectable({ providedIn: 'root' })
export class PackageService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:8000/api/v1/pacotes/contagem';

  getCount(idCliente: number, filters: PackageFilters): Observable<PackageCount> {
    const token = typeof localStorage === 'undefined' ? null : localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    let params = new HttpParams().set('id_cliente', idCliente);
    const optionalParams: Record<string, string | number | ''> = {
      nm_pacote: filters.nm_pacote.trim(),
      id_produto: filters.id_produto,
      versao_correcao: filters.versao_correcao.trim(),
      sn_aplicado: filters.sn_aplicado,
      sn_mergeado: filters.sn_mergeado,
      sn_aprovado_gerente: filters.sn_aprovado_gerente,
      ticket: filters.ticket.trim(),
      ticket_bug: filters.ticket_bug.trim(),
      id_setor: filters.id_setor,
    };

    for (const [key, value] of Object.entries(optionalParams)) {
      if (value !== '') params = params.set(key, value);
    }
    return this.http.get<PackageCount>(this.url, { headers, params });
  }
}
