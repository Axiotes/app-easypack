/** `cargos` deve vir de `ReferenceDataService.getCargos()` (ordem do mais sênior ao mais júnior). */
export function cargoRank(cargos: string[], cargo: string): number {
  const index = cargos.indexOf(cargo);
  return index === -1 ? cargos.length : index;
}

export function cargoAtLeast(cargos: string[], cargo: string, minimo: string): boolean {
  return cargoRank(cargos, cargo) <= cargoRank(cargos, minimo);
}

export function cargoBelow(cargos: string[], cargo: string, referencia: string): boolean {
  return cargoRank(cargos, cargo) > cargoRank(cargos, referencia);
}
