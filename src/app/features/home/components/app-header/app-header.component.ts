import { LucideChevronDown, LucideLogOut } from '@lucide/angular';
import { Component, Input, inject } from '@angular/core';
import { AuthService } from '../../../../core/auth/auth.service';
import { BrandComponent } from '../../../../shared/components/brand/brand.component';
import { LoggedUser } from '../../models/release.models';

@Component({ selector: 'app-header', standalone: true, imports: [LucideChevronDown, LucideLogOut, BrandComponent], templateUrl: './app-header.component.html', styleUrl: './app-header.component.scss' })
export class AppHeaderComponent {
  @Input() user: LoggedUser | null = null;

  private readonly auth = inject(AuthService);

  protected initials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }

  protected logout(): void {
    this.auth.logout();
  }
}
