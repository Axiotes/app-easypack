import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReleasePackage } from '../../models/release.models';

@Component({ selector: 'app-package-table', standalone: true, templateUrl: './package-table.component.html', styleUrl: './package-table.component.scss' })
export class PackageTableComponent {
  @Input({ required: true }) packages: ReleasePackage[] = [];
  @Input() loading = false;
  @Input() errorMessage = '';
  @Output() loadMore = new EventEmitter<void>();
  protected label(value: 'S' | 'N', yes: string, no: string): string { return value === 'S' ? yes : no; }
  protected productClass(product: string): string { return `tag tag--${product.toLowerCase()}`; }
  protected onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 24) this.loadMore.emit();
  }
}
