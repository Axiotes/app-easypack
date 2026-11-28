import { Component, Input } from '@angular/core';

export interface RankedBarItem {
  label: string;
  value: number;
}

/**
 * Lista de barras horizontais ranqueadas (maior primeiro), um único hue — para
 * comparar partes de um todo (correções por produto/setor, pendências por
 * responsável). Ver skill de dataviz: "part-to-whole, compare the parts" usa
 * barras ranqueadas de um hue, não um gráfico categórico multicolor.
 */
@Component({
  selector: 'app-ranked-bars',
  standalone: true,
  templateUrl: './ranked-bars.component.html',
  styleUrl: './ranked-bars.component.scss',
})
export class RankedBarsComponent {
  @Input({ required: true }) items: RankedBarItem[] = [];
  @Input() emptyMessage = 'Sem dados para exibir.';

  protected get sortedItems(): RankedBarItem[] {
    return [...this.items].sort((a, b) => b.value - a.value);
  }

  protected get maxValue(): number {
    return Math.max(1, ...this.items.map((item) => item.value));
  }

  protected percent(value: number): number {
    return (value / this.maxValue) * 100;
  }
}
