import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { RankedBarItem } from '../../shared/components/ranked-bars/ranked-bars.component';
import { ReferenceDataService } from '../home/services/reference-data.service';

const BASE = 'http://localhost:8000/api/v1';

interface PacoteRaw {
  id: number;
  id_correcao: number;
  sn_aplicado: 'S' | 'N';
  sn_aprovado_gerente: 'S' | 'N';
}

interface CorrecaoRaw {
  id: number;
  id_cliente: number;
  id_produto: number;
  id_setor: number;
  sn_aprovado_code_review: 'S' | 'N';
}

interface ClienteRaw {
  id: number;
  id_usuario: number;
}

export interface DashboardKpis {
  aguardandoCodeReview: number;
  aguardandoGerente: number;
  aguardandoAplicacao: number;
  aplicados: number;
}

export interface DashboardData {
  kpis: DashboardKpis;
  porProduto: RankedBarItem[];
  porSetor: RankedBarItem[];
  pendentesPorGerente: RankedBarItem[];
}

/**
 * O backend não tem um endpoint de indicadores agregados; monta o dashboard no
 * cliente a partir de /pacotes + /correcoes + /clientes + referências, no mesmo
 * espírito do join que PackageService já faz para a listagem por cliente.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly referenceData = inject(ReferenceDataService);

  getDashboard(): Observable<DashboardData> {
    return forkJoin({
      pacotes: this.http.get<PacoteRaw[]>(`${BASE}/pacotes`),
      correcoes: this.http.get<CorrecaoRaw[]>(`${BASE}/correcoes`),
      clientes: this.http.get<ClienteRaw[]>(`${BASE}/clientes`),
      produtos: this.referenceData.getProdutos(),
      setores: this.referenceData.getSetores(),
      usuarios: this.referenceData.getUsuarios(),
    }).pipe(
      map(({ pacotes, correcoes, clientes, produtos, setores, usuarios }) => {
        const correcaoById = new Map(correcoes.map((item) => [item.id, item]));
        const clienteById = new Map(clientes.map((item) => [item.id, item]));

        const kpis: DashboardKpis = {
          aguardandoCodeReview: 0,
          aguardandoGerente: 0,
          aguardandoAplicacao: 0,
          aplicados: 0,
        };
        const pendentesPorGerenteMap = new Map<string, number>();

        for (const pacote of pacotes) {
          const correcao = correcaoById.get(pacote.id_correcao);
          if (!correcao) continue;

          if (correcao.sn_aprovado_code_review !== 'S') {
            kpis.aguardandoCodeReview += 1;
          } else if (pacote.sn_aprovado_gerente !== 'S') {
            kpis.aguardandoGerente += 1;
            const cliente = clienteById.get(correcao.id_cliente);
            const gerente = cliente ? usuarios.find((usuario) => usuario.id === cliente.id_usuario) : undefined;
            const nomeGerente = gerente?.nm_completo ?? 'Sem responsável';
            pendentesPorGerenteMap.set(nomeGerente, (pendentesPorGerenteMap.get(nomeGerente) ?? 0) + 1);
          } else if (pacote.sn_aplicado !== 'S') {
            kpis.aguardandoAplicacao += 1;
          } else {
            kpis.aplicados += 1;
          }
        }

        const porProdutoMap = new Map<string, number>();
        const porSetorMap = new Map<string, number>();
        for (const correcao of correcoes) {
          const nomeProduto = produtos.find((item) => item.id === correcao.id_produto)?.nm_produto ?? `Produto #${correcao.id_produto}`;
          const nomeSetor = setores.find((item) => item.id === correcao.id_setor)?.nm_setor ?? `Setor #${correcao.id_setor}`;
          porProdutoMap.set(nomeProduto, (porProdutoMap.get(nomeProduto) ?? 0) + 1);
          porSetorMap.set(nomeSetor, (porSetorMap.get(nomeSetor) ?? 0) + 1);
        }

        const toList = (mapa: Map<string, number>): RankedBarItem[] =>
          Array.from(mapa, ([label, value]) => ({ label, value }));

        return {
          kpis,
          porProduto: toList(porProdutoMap),
          porSetor: toList(porSetorMap),
          pendentesPorGerente: toList(pendentesPorGerenteMap),
        };
      }),
    );
  }
}
