import { LucideCheck, LucideClock, LucideMinus } from '@lucide/angular';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReleasePackage } from '../../models/release.models';

@Component({
  selector: 'app-package-table',
  standalone: true,
  imports: [LucideCheck, LucideClock, LucideMinus, RouterLink],
  templateUrl: './package-table.component.html',
  styleUrl: './package-table.component.scss',
})
export class PackageTableComponent {
  private readonly router = inject(Router);

  protected openPackage(id: number): void {
    void this.router.navigate(['/pacotes', id], { queryParamsHandling: 'preserve' });
  }

  @Input({ required: true }) packages: ReleasePackage[] = [];
  @Input() loading = false;
  @Input() errorMessage = '';
  @Output() loadMore = new EventEmitter<void>();

  protected label(value: 'S' | 'N', yes: string, no: string): string {
    return value === 'S' ? yes : no;
  }

  protected productClass(product: string): string {
    return `tag tag--${product.toLowerCase()}`;
  }

  protected onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 24) this.loadMore.emit();
  }
}
