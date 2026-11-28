import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ReferenceDataService } from '../home/services/reference-data.service';

const BASE = 'http://localhost:8000/api/v1';

interface PacoteRaw {
  id: number;
  id_correcao: number;
  nm_pacote: string;
  sn_aplicado: 'S' | 'N';
}

interface CorrecaoRaw {
  id: number;
  ticket: string;
  id_cliente: number;
  id_produto: number;
  id_setor: number;
  sn_mergeado: 'S' | 'N' | null;
  sn_aprovado_code_review: 'S' | 'N';
}

interface ClienteRaw {
  id: number;
  nm_cliente: string;
}

export interface RelatorioClientePacotes {
  nm_cliente: string;
  total: number;
  aplicados: number;
  pendentes: number;
  percentualAplicado: number;
}

export interface RelatorioPendencia {
  ticket: string;
  nm_cliente: string;
  nm_produto: string;
  nm_setor: string;
  pendencia: 'Code review' | 'Merge';
}

@Injectable({ providedIn: 'root' })
export class RelatorioService {
  private readonly http = inject(HttpClient);
  private readonly referenceData = inject(ReferenceDataService);

  getRelatorioClientePacotes(): Observable<RelatorioClientePacotes[]> {
    return forkJoin({
      pacotes: this.http.get<PacoteRaw[]>(`${BASE}/pacotes`),
      correcoes: this.http.get<CorrecaoRaw[]>(`${BASE}/correcoes`),
      clientes: this.http.get<ClienteRaw[]>(`${BASE}/clientes`),
    }).pipe(
      map(({ pacotes, correcoes, clientes }) => {
        const correcaoById = new Map(correcoes.map((item) => [item.id, item]));
        const porCliente = new Map<number, { total: number; aplicados: number }>();

        for (const pacote of pacotes) {
          const correcao = correcaoById.get(pacote.id_correcao);
          if (!correcao) continue;
          const acumulado = porCliente.get(correcao.id_cliente) ?? { total: 0, aplicados: 0 };
          acumulado.total += 1;
          if (pacote.sn_aplicado === 'S') acumulado.aplicados += 1;
          porCliente.set(correcao.id_cliente, acumulado);
        }

        return clientes
          .map((cliente) => {
            const acumulado = porCliente.get(cliente.id) ?? { total: 0, aplicados: 0 };
            return {
              nm_cliente: cliente.nm_cliente,
              total: acumulado.total,
              aplicados: acumulado.aplicados,
              pendentes: acumulado.total - acumulado.aplicados,
              percentualAplicado: acumulado.total === 0 ? 0 : Math.round((acumulado.aplicados / acumulado.total) * 100),
            };
          })
          .filter((item) => item.total > 0)
          .sort((a, b) => b.total - a.total);
      }),
    );
  }

  getRelatorioPendencias(): Observable<RelatorioPendencia[]> {
    return forkJoin({
      correcoes: this.http.get<CorrecaoRaw[]>(`${BASE}/correcoes`),
      clientes: this.http.get<ClienteRaw[]>(`${BASE}/clientes`),
      produtos: this.referenceData.getProdutos(),
      setores: this.referenceData.getSetores(),
    }).pipe(
      map(({ correcoes, clientes, produtos, setores }) => {
        const nomeCliente = (id: number) => clientes.find((item) => item.id === id)?.nm_cliente ?? `Cliente #${id}`;
        const nomeProduto = (id: number) => produtos.find((item) => item.id === id)?.nm_produto ?? `Produto #${id}`;
        const nomeSetor = (id: number) => setores.find((item) => item.id === id)?.nm_setor ?? `Setor #${id}`;

        const pendencias: RelatorioPendencia[] = [];
        for (const correcao of correcoes) {
          const base = {
            ticket: correcao.ticket,
            nm_cliente: nomeCliente(correcao.id_cliente),
            nm_produto: nomeProduto(correcao.id_produto),
            nm_setor: nomeSetor(correcao.id_setor),
          };
          if (correcao.sn_aprovado_code_review !== 'S') {
            pendencias.push({ ...base, pendencia: 'Code review' });
          }
          if (correcao.sn_mergeado !== 'S') {
            pendencias.push({ ...base, pendencia: 'Merge' });
          }
        }
        return pendencias;
      }),
    );
  }
}
