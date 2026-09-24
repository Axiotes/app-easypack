export type YesNo = 'S' | 'N';

export interface Client {
  id: number;
  nm_cliente: string;
  id_setor_atendimento: number;
  setor_atendimento: string;
  status_ambiente: 'PRE-PROD' | 'PRD';
  estado: string;
  id_usuario: number;
}

export interface ReleasePackage {
  id: number;
  id_correcao: number;
  nm_pacote: string;
  tp_pacote: string;
  sn_aplicado: YesNo;
  sn_aprovado_usu: YesNo;
  sn_aprovado_gerente: YesNo;
  correcao: {
    ticket: string;
    ticket_bug: string;
    merge: string;
    id_cliente: number;
    id_produto: number;
    produto: string;
    setor: 'ST' | 'FB';
    sn_mergeado: YesNo;
    versao_correcao: string;
    sn_aprovado_code_review: YesNo;
  };
}

export interface PackageFilters {
  nm_pacote: string;
  ticket: string;
  id_produto: '' | number;
  versao_correcao: string;
  sn_aplicado: '' | YesNo;
  sn_aprovado_gerente: '' | YesNo;
  sn_mergeado: '' | YesNo;
  ticket_bug: string;
  id_setor: '' | number;
}

export interface PackageCount {
  total_pacotes: number;
  total_aplicados: number;
  total_pendentes: number;
}
