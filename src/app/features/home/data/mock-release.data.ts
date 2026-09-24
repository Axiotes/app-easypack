import { Client, ReleasePackage } from '../models/release.models';

export const mockClients: Client[] = [
  { id: 1, nm_cliente: 'Grupo Vitalis', id_setor_atendimento: 1, setor_atendimento: 'ST', status_ambiente: 'PRD', estado: 'SP', id_usuario: 1 },
  { id: 2, nm_cliente: 'Clínica Horizonte', id_setor_atendimento: 1, setor_atendimento: 'ST', status_ambiente: 'PRE-PROD', estado: 'RJ', id_usuario: 2 },
  { id: 3, nm_cliente: 'Hospital Nova Aurora', id_setor_atendimento: 2, setor_atendimento: 'FB', status_ambiente: 'PRD', estado: 'MG', id_usuario: 3 },
  { id: 4, nm_cliente: 'Centro Médico Prisma', id_setor_atendimento: 1, setor_atendimento: 'ST', status_ambiente: 'PRD', estado: 'MG', id_usuario: 4 },
  { id: 5, nm_cliente: 'Instituto Vida Plena', id_setor_atendimento: 2, setor_atendimento: 'FB', status_ambiente: 'PRE-PROD', estado: 'MG', id_usuario: 5 },
  { id: 6, nm_cliente: 'Rede Bem Estar', id_setor_atendimento: 1, setor_atendimento: 'ST', status_ambiente: 'PRD', estado: 'SP', id_usuario: 6 },
  { id: 7, nm_cliente: 'Hospital Vale Sereno', id_setor_atendimento: 2, setor_atendimento: 'FB', status_ambiente: 'PRE-PROD', estado: 'RS', id_usuario: 7 }
];

export const mockPackages: ReleasePackage[] = [
  { id: 101, id_correcao: 501, nm_pacote: 'pep-core-prisma-v3.4.1.jar', tp_pacote: 'Correção', sn_aplicado: 'S', sn_aprovado_usu: 'S', sn_aprovado_gerente: 'S', correcao: { ticket: 'PEP-1042', ticket_bug: 'PEP-1091', merge: 'a7c31e5', id_cliente: 4, id_produto: 1, produto: 'PEP', setor: 'ST', sn_mergeado: 'S', versao_correcao: '3.4.1', sn_aprovado_code_review: 'S' } },
  { id: 102, id_correcao: 502, nm_pacote: 'soul-core-prisma-v2.0.3.jar', tp_pacote: 'Correção', sn_aplicado: 'N', sn_aprovado_usu: 'S', sn_aprovado_gerente: 'N', correcao: { ticket: 'SOUL-204', ticket_bug: 'SOUL-201', merge: 'q3r4s5f', id_cliente: 4, id_produto: 2, produto: 'SOUL', setor: 'ST', sn_mergeado: 'N', versao_correcao: '2.0.3', sn_aprovado_code_review: 'N' } },
  { id: 103, id_correcao: 503, nm_pacote: 'sacr-cnes-materdei-v1.1.0.jar', tp_pacote: 'Correção', sn_aplicado: 'N', sn_aprovado_usu: 'S', sn_aprovado_gerente: 'N', correcao: { ticket: 'SACR-044', ticket_bug: 'SACR-051', merge: 'df12ab8', id_cliente: 4, id_produto: 3, produto: 'SACR', setor: 'FB', sn_mergeado: 'S', versao_correcao: '1.1.0', sn_aprovado_code_review: 'S' } },
  { id: 104, id_correcao: 504, nm_pacote: 'pep-prescricao-einstein-v4.2.0.jar', tp_pacote: 'Hotfix', sn_aplicado: 'S', sn_aprovado_usu: 'S', sn_aprovado_gerente: 'S', correcao: { ticket: 'PEP-1203', ticket_bug: 'PEP-1208', merge: '9f3ab12', id_cliente: 1, id_produto: 1, produto: 'PEP', setor: 'ST', sn_mergeado: 'S', versao_correcao: '4.2.0', sn_aprovado_code_review: 'S' } },
  { id: 105, id_correcao: 505, nm_pacote: 'soul-agenda-dor-v2.6.8.jar', tp_pacote: 'Correção', sn_aplicado: 'N', sn_aprovado_usu: 'N', sn_aprovado_gerente: 'N', correcao: { ticket: 'SOUL-291', ticket_bug: 'SOUL-300', merge: '4b12dc0', id_cliente: 2, id_produto: 2, produto: 'SOUL', setor: 'ST', sn_mergeado: 'N', versao_correcao: '2.6.8', sn_aprovado_code_review: 'N' } }
];
