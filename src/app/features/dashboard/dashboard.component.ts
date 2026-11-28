import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, PLATFORM_ID, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';
import { MainNavComponent } from '../../shared/components/main-nav/main-nav.component';
import { RankedBarsComponent } from '../../shared/components/ranked-bars/ranked-bars.component';
import { AppHeaderComponent } from '../home/components/app-header/app-header.component';
import { LoggedUser } from '../home/models/release.models';
import { UserService } from '../home/services/user.service';
import { DashboardData, DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AppHeaderComponent, MainNavComponent, RankedBarsComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['../home/home.component.scss', './dashboard.component.scss'],
})
export class DashboardComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loggedUser = signal<LoggedUser | null>(null);
  protected readonly data = signal<DashboardData | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({ user: this.userService.getCurrentUser(), data: this.dashboardService.getDashboard() })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ user, data }) => {
          this.loggedUser.set(user);
          this.data.set(data);
        },
        error: (error: HttpErrorResponse) => {
          this.error.set(
            error.status === 401
              ? 'Sua sessão expirou. Entre novamente para continuar.'
              : 'Não foi possível carregar o dashboard. Tente novamente.',
          );
        },
      });
  }
}
