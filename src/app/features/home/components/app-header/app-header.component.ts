import { LucideChevronDown, LucideLogOut } from '@lucide/angular';
import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BrandComponent } from '../../../../shared/components/brand/brand.component';
import { LoggedUser } from '../../models/release.models';

@Component({ selector: 'app-header', standalone: true, imports: [LucideChevronDown, LucideLogOut, BrandComponent], templateUrl: './app-header.component.html', styleUrl: './app-header.component.scss' })
export class AppHeaderComponent {
  @Input() user: LoggedUser | null = null;

  private readonly router = inject(Router);

  protected initials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }

  protected logout(): void {
    localStorage.removeItem('token');
    void this.router.navigate(['/login']);
  }
}
