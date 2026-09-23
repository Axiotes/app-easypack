import { Component, Input } from '@angular/core';
import { ReleasePackage } from '../../models/release.models';

@Component({ selector: 'app-package-table', standalone: true, templateUrl: './package-table.component.html', styleUrl: './package-table.component.scss' })
export class PackageTableComponent {
  @Input({ required: true }) packages: ReleasePackage[] = [];
  protected label(value: 'S' | 'N', yes: string, no: string): string { return value === 'S' ? yes : no; }
  protected productClass(product: string): string { return `tag tag--${product.toLowerCase()}`; }
}
