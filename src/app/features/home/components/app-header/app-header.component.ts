import { Component, Input } from '@angular/core';
import { BrandComponent } from '../../../../shared/components/brand/brand.component';
import { LoggedUser } from '../../models/release.models';

@Component({ selector: 'app-header', standalone: true, imports: [BrandComponent], templateUrl: './app-header.component.html', styleUrl: './app-header.component.scss' })
export class AppHeaderComponent {
  @Input() user: LoggedUser | null = null;

  protected initials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }
}
