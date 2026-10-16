import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, switchMap } from 'rxjs';
import {
  CreatePackage,
  CreatedPackage,
  Product,
  PackageCount,
  PackageDetails,
  PackageFilters,
  ReleasePackage,
  Setor,
  TipoPacote,
  UsuarioRaw,
  YesNo,
} from '../models/release.models';
import { authHeaders } from './auth-headers';
import { ReferenceDataService } from './reference-data.service';

const BASE = 'http://localhost:8000/api/v1';

interface PacoteRaw {
  id: number;
  id_correcao: number;
  tp_pacote: number;
  nm_pacote: string;
  sn_aplicado: YesNo;
  sn_aprovado_usu: YesNo | null;
  sn_aprovado_gerente: YesNo;
  id_usuario_aplicacao: number | null;
  id_usuario_aprovador_gerente: number | null;
  id_usuario_aprovador_par: number | null;
}

interface CorrecaoRaw {
  id: number;
  ticket: string;
  ticket_bug: string | null;
  merge: string | null;
  id_cliente: number;
  id_produto: number;
  id_usuario: number;
  id_setor: number;
  sn_mergeado: YesNo | null;
  versao_correcao: string;
  sn_aprovado_code_review: YesNo;
  id_usuario_aprovador: number | null;
}

interface UsuarioMeRaw {
  id: number;
  id_subsetor: number;
}

interface SubsetorRaw {
  id: number;
  id_setor: number;
}

interface ClienteRaw {
  id: number;
  nm_cliente: string;
}

@Injectable({ providedIn: 'root' })
export class PackageService {
  private readonly http = inject(HttpClient);
  private readonly referenceData = inject(ReferenceDataService);

  /**
   * O backend não tem um endpoint único de "criar pacote com correção": é preciso
   * criar a Correção (/correcoes) e só então o Pacote (/pacotes) com o id_correcao
   * gerado. id_usuario e id_setor da correção vêm do usuário logado (ele e o setor
   * do seu subsetor), já que a tela não coleta esses campos.
   */
  create(data: CreatePackage): Observable<CreatedPackage> {
    const headers = authHeaders();
    return this.http.get<UsuarioMeRaw>(`${BASE}/usuarios/me`, { headers }).pipe(
      switchMap((me) =>
        this.http
          .get<SubsetorRaw>(`${BASE}/subsetores/${me.id_subsetor}`, { headers })
          .pipe(map((subsetor) => ({ id_usuario: me.id, id_setor: subsetor.id_setor }))),
      ),
      switchMap(({ id_usuario, id_setor }) =>
        this.http.post<CorrecaoRaw>(
          `${BASE}/correcoes`,
          {
            ticket: data.ticket,
            ticket_bug: data.ticket_bug,
            merge: data.merge,
            id_cliente: data.id_cliente,
            id_produto: data.id_produto,
            id_usuario,
            id_setor,
            sn_mergeado: data.sn_mergeado,
            versao_correcao: data.versao_correcao,
          },
          { headers },
        ),
      ),
      switchMap((correcao) =>
        this.http
          .post<PacoteRaw>(
            `${BASE}/pacotes`,
            { id_correcao: correcao.id, tp_pacote: data.tp_pacote, nm_pacote: data.nm_pacote },
            { headers },
          )
          .pipe(map((pacote) => ({ id: pacote.id, id_correcao: correcao.id }))),
      ),
    );
  }

  getProducts(): Observable<Product[]> {
    return this.referenceData.getProdutos();
  }

  aprovarCorrecao(idCorrecao: number): Observable<void> {
    return this.http
      .post(`${BASE}/correcoes/${idCorrecao}/aprovar`, {}, { headers: authHeaders() })
      .pipe(map(() => undefined));
  }

  aprovarGerente(idPacote: number): Observable<void> {
    return this.http
      .post(`${BASE}/pacotes/${idPacote}/aprovar-gerente`, {}, { headers: authHeaders() })
      .pipe(map(() => undefined));
  }

  aplicar(idPacote: number, idUsuarioAprovadorPar: number | null): Observable<void> {
    return this.http
      .post(
        `${BASE}/pacotes/${idPacote}/aplicar`,
        { id_usuario_aprovador_par: idUsuarioAprovadorPar },
        { headers: authHeaders() },
      )
      .pipe(map(() => undefined));
  }

  alterarMergeado(idCorrecao: number, sn_mergeado: YesNo): Observable<void> {
    return this.http
      .post(`${BASE}/correcoes/${idCorrecao}/merge`, { sn_mergeado }, { headers: authHeaders() })
      .pipe(map(() => undefined));
  }

  /** Não existe `/pacotes/{id}/detalhes`; monta os detalhes juntando pacote + correção + referências. */
  getById(id: number): Observable<PackageDetails> {
    const headers = authHeaders();
    return this.http.get<PacoteRaw>(`${BASE}/pacotes/${id}`, { headers }).pipe(
      switchMap((pacote) =>
        this.http.get<CorrecaoRaw>(`${BASE}/correcoes/${pacote.id_correcao}`, { headers }).pipe(
          switchMap((correcao) =>
            forkJoin({
              cliente: this.http.get<ClienteRaw>(`${BASE}/clientes/${correcao.id_cliente}`, { headers }),
              produtos: this.referenceData.getProdutos(),
              setores: this.referenceData.getSetores(),
              usuarios: this.referenceData.getUsuarios(),
              tiposPacote: this.referenceData.getTiposPacote(),
            }).pipe(
              map(({ cliente, produtos, setores, usuarios, tiposPacote }) =>
                this.toPackageDetails(pacote, correcao, cliente, produtos, setores, usuarios, tiposPacote),
              ),
            ),
          ),
        ),
      ),
    );
  }

  getCount(idCliente: number, filters: PackageFilters): Observable<PackageCount> {
    return this.joinedPackages(idCliente, filters).pipe(
      map((packages) => ({
        total_pacotes: packages.length,
        total_aplicados: packages.filter((item) => item.sn_aplicado === 'S').length,
        total_pendentes: packages.filter((item) => item.sn_aplicado !== 'S').length,
      })),
    );
  }

  getDetails(
    idCliente: number,
    skip: number,
    limit: number,
    filters: PackageFilters,
  ): Observable<ReleasePackage[]> {
    return this.joinedPackages(idCliente, filters).pipe(
      map((packages) => packages.slice(skip, skip + limit)),
    );
  }

  /** Não existe `/pacotes/detalhados`; junta /pacotes + /correcoes no cliente e filtra em memória. */
  private joinedPackages(idCliente: number, filters: PackageFilters): Observable<ReleasePackage[]> {
    const headers = authHeaders();
    return forkJoin({
      pacotes: this.http.get<PacoteRaw[]>(`${BASE}/pacotes`, { headers }),
      correcoes: this.http.get<CorrecaoRaw[]>(`${BASE}/correcoes`, { headers }),
      produtos: this.referenceData.getProdutos(),
      setores: this.referenceData.getSetores(),
    }).pipe(
      map(({ pacotes, correcoes, produtos, setores }) => {
        const correcoesById = new Map(correcoes.map((correcao) => [correcao.id, correcao]));
        const items: ReleasePackage[] = [];
        for (const pacote of pacotes) {
          const correcao = correcoesById.get(pacote.id_correcao);
          if (!correcao || correcao.id_cliente !== idCliente) continue;
          const produto = produtos.find((item) => item.id === correcao.id_produto);
          const setor = setores.find((item) => item.id === correcao.id_setor);
          items.push({
            id: pacote.id,
            id_correcao: correcao.id,
            nm_pacote: pacote.nm_pacote,
            versao_correcao: correcao.versao_correcao,
            id_produto: correcao.id_produto,
            nm_produto: produto?.nm_produto ?? `Produto #${correcao.id_produto}`,
            id_setor: correcao.id_setor,
            nm_setor: setor?.nm_setor ?? `Setor #${correcao.id_setor}`,
            sg_setor: setor?.sg_setor ?? '—',
            ticket: correcao.ticket,
            ticket_bug: correcao.ticket_bug,
            sn_mergeado: correcao.sn_mergeado ?? 'N',
            sn_aprovado_gerente: pacote.sn_aprovado_gerente,
            sn_aplicado: pacote.sn_aplicado,
          });
        }
        return items.filter((item) => this.matchesFilters(item, filters)).sort((a, b) => b.id - a.id);
      }),
    );
  }

  private matchesFilters(item: ReleasePackage, filters: PackageFilters): boolean {
    const contains = (value: string, term: string) => value.toLowerCase().includes(term.toLowerCase());
    if (filters.nm_pacote && !contains(item.nm_pacote, filters.nm_pacote)) return false;
    if (filters.ticket && !contains(item.ticket, filters.ticket)) return false;
    if (filters.id_produto !== '' && item.id_produto !== filters.id_produto) return false;
    if (filters.versao_correcao && !contains(item.versao_correcao, filters.versao_correcao)) return false;
    if (filters.sn_aplicado !== '' && item.sn_aplicado !== filters.sn_aplicado) return false;
    if (filters.sn_aprovado_gerente !== '' && item.sn_aprovado_gerente !== filters.sn_aprovado_gerente)
      return false;
    if (filters.sn_mergeado !== '' && item.sn_mergeado !== filters.sn_mergeado) return false;
    if (filters.ticket_bug && !contains(item.ticket_bug ?? '', filters.ticket_bug)) return false;
    if (filters.id_setor !== '' && item.id_setor !== filters.id_setor) return false;
    return true;
  }

  private toPackageDetails(
    pacote: PacoteRaw,
    correcao: CorrecaoRaw,
    cliente: ClienteRaw,
    produtos: Product[],
    setores: Setor[],
    usuarios: UsuarioRaw[],
    tiposPacote: TipoPacote[],
  ): PackageDetails {
    const nomeUsuario = (idUsuario: number | null): string | null =>
      idUsuario === null
        ? null
        : (usuarios.find((usuario) => usuario.id === idUsuario)?.nm_completo ?? `Usuário #${idUsuario}`);
    const setor = setores.find((item) => item.id === correcao.id_setor);

    return {
      id: pacote.id,
      id_correcao: pacote.id_correcao,
      tp_pacote: pacote.tp_pacote,
      nm_tipo_pacote: tiposPacote.find((item) => item.id === pacote.tp_pacote)?.nm_tipo ?? `Tipo #${pacote.tp_pacote}`,
      nm_pacote: pacote.nm_pacote,
      sn_aplicado: pacote.sn_aplicado,
      sn_aprovado_usu: pacote.sn_aprovado_usu,
      sn_aprovado_gerente: pacote.sn_aprovado_gerente,
      id_usuario_aplicacao: nomeUsuario(pacote.id_usuario_aplicacao),
      id_usuario_aprovador_gerente: nomeUsuario(pacote.id_usuario_aprovador_gerente),
      id_usuario_aprovador_par: nomeUsuario(pacote.id_usuario_aprovador_par),
      ticket: correcao.ticket,
      ticket_bug: correcao.ticket_bug,
      merge: correcao.merge,
      id_cliente: cliente.nm_cliente,
      id_produto: produtos.find((item) => item.id === correcao.id_produto)?.nm_produto ?? `Produto #${correcao.id_produto}`,
      id_usuario: nomeUsuario(correcao.id_usuario) ?? `Usuário #${correcao.id_usuario}`,
      id_setor: setor?.nm_setor ?? `Setor #${correcao.id_setor}`,
      sg_setor_correcao: setor?.sg_setor ?? '',
      sn_mergeado: correcao.sn_mergeado,
      versao_correcao: correcao.versao_correcao,
      sn_aprovado_code_review: correcao.sn_aprovado_code_review,
      id_usuario_aprovador: nomeUsuario(correcao.id_usuario_aprovador),
    };
  }
}
