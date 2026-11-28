/** Gera e baixa um CSV simples a partir de linhas de objetos planos (sem libs externas). */
export function exportToCsv<T>(nomeArquivo: string, colunas: { chave: keyof T; titulo: string }[], linhas: T[]): void {
  const escapar = (valor: unknown): string => {
    const texto = valor === null || valor === undefined ? '' : String(valor);
    return /[",\n;]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };

  const cabecalho = colunas.map((coluna) => escapar(coluna.titulo)).join(';');
  const corpo = linhas.map((linha) => colunas.map((coluna) => escapar(linha[coluna.chave])).join(';'));
  const conteudo = [cabecalho, ...corpo].join('\r\n');

  const blob = new Blob([`﻿${conteudo}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}
