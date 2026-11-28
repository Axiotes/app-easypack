import { LucideBell, LucideChevronDown, LucideLogOut, LucideCheck } from '@lucide/angular';
import { Component, Input, OnChanges, SimpleChanges, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { BrandComponent } from '../../../../shared/components/brand/brand.component';
import { LoggedUser } from '../../models/release.models';
import { Notification } from '../../models/notification.models';
import { NotificationService } from '../../services/notification.service';

@Component({ selector: 'app-header', standalone: true, imports: [LucideBell, LucideCheck, LucideChevronDown, LucideLogOut, BrandComponent], templateUrl: './app-header.component.html', styleUrl: './app-header.component.scss' })
export class AppHeaderComponent implements OnChanges {
  @Input() user: LoggedUser | null = null;
  @Input() clientId: number | null = null;

  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  protected readonly notifications = signal<Notification[]>([]);
  protected readonly notificationOpen = signal(false);
  protected readonly notificationLoading = signal(false);
  protected readonly notificationError = signal(false);
  protected readonly markingRead = signal<number | null>(null);
  protected readonly unreadCount = computed(() => this.notifications().filter((item) => !item.lida).length);

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['user'] || changes['clientId']) && this.user && this.clientId !== null) this.loadNotifications();
    if (changes['user'] && !this.user || changes['clientId'] && this.clientId === null) this.notifications.set([]);
  }

  protected toggleNotifications(): void {
    this.notificationOpen.update((open) => !open);
    if (this.notificationOpen() && this.notificationError()) this.loadNotifications();
  }

  protected loadNotifications(): void {
    if (this.clientId === null) return;
    this.notificationLoading.set(true);
    this.notificationError.set(false);
    this.notificationService.list(this.clientId).subscribe({
      next: (items) => { this.notifications.set(items); this.notificationLoading.set(false); },
      error: () => { this.notificationError.set(true); this.notificationLoading.set(false); },
    });
  }

  protected markAsRead(item: Notification): void {
    if (item.lida || this.markingRead() !== null) return;
    this.markingRead.set(item.id);
    this.notificationService.markAsRead(item.id).subscribe({
      next: (updated) => {
        this.notifications.update((items) => items.map((current) => current.id === item.id ? { ...current, ...updated, lida: true } : current));
        this.markingRead.set(null);
      },
      error: () => this.markingRead.set(null),
    });
  }

  protected formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
  }

  protected notificationMessage(item: Notification): string {
    return item.mensagem?.trim() || 'Você movimentou um arquivo de um cliente. Lembre-se de marcar se aplicou o pacote.';
  }

  protected initials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }

  protected logout(): void {
    localStorage.removeItem('token');
    void this.router.navigate(['/login']);
  }
}
