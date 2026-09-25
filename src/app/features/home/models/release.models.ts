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
  versao_correcao: string;
  id_produto: number;
  nm_produto: string;
  id_setor: number;
  nm_setor: string;
  sg_setor: string;
  ticket: string;
  ticket_bug: string | null;
  sn_mergeado: YesNo;
  sn_aprovado_gerente: YesNo;
  sn_aplicado: YesNo;
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

export interface LoggedUser {
  id: number;
  nm_usuario: string;
  nm_completo: string;
  cargo: string;
  nm_subsetor: string;
  nm_produto: string;
}

// Matches PacoteCompletoRead: references other than package/correction IDs are names.
export interface PackageDetails {
  id: number;
  id_correcao: number;
  tp_pacote: number;
  nm_pacote: string;
  sn_aplicado: YesNo;
  sn_aprovado_usu: YesNo | null;
  sn_aprovado_gerente: YesNo;
  id_usuario_aplicacao: string | null;
  id_usuario_aprovador_gerente: string | null;
  id_usuario_aprovador_par: string | null;
  ticket: string;
  ticket_bug: string | null;
  merge: string | null;
  id_cliente: string;
  id_produto: string;
  id_usuario: string;
  id_setor: string;
  sn_mergeado: YesNo | null;
  versao_correcao: string;
  sn_aprovado_code_review: YesNo;
  id_usuario_aprovador: string | null;
}
