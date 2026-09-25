import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreatePackage, CreatedPackage, Product, PackageCount, PackageDetails, PackageFilters, ReleasePackage } from '../models/release.models';

@Injectable({ providedIn: 'root' })
export class PackageService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://localhost:8000/api/v1/pacotes';

  create(data: CreatePackage): Observable<CreatedPackage> {
    const token = typeof localStorage === 'undefined' ? null : localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.post<CreatedPackage>(this.url, data, { headers });
  }

  getProducts(): Observable<Product[]> {
    const token = typeof localStorage === 'undefined' ? null : localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<Product[]>('http://localhost:8000/api/v1/produtos', { headers });
  }

  getById(id: number): Observable<PackageDetails> {
    const token = typeof localStorage === 'undefined' ? null : localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<PackageDetails>(`${this.url}/${id}/detalhes`, { headers });
  }

  getCount(idCliente: number, filters: PackageFilters): Observable<PackageCount> {
    const { headers, params } = this.requestOptions(idCliente, filters);
    return this.http.get<PackageCount>(`${this.url}/contagem`, { headers, params });
  }

  getDetails(
    idCliente: number,
    skip: number,
    limit: number,
    filters: PackageFilters,
  ): Observable<ReleasePackage[]> {
    const { headers, params: baseParams } = this.requestOptions(idCliente, filters);
    const params = baseParams.set('skip', skip).set('limit', limit);
    return this.http.get<ReleasePackage[]>(`${this.url}/detalhados`, { headers, params });
  }

  private requestOptions(idCliente: number, filters: PackageFilters): {
    headers: HttpHeaders | undefined;
    params: HttpParams;
  } {
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
    return { headers, params };
  }
}
