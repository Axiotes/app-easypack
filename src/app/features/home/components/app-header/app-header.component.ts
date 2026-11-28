import { LucideBell, LucideCheck, LucideChevronDown, LucideLogOut } from '@lucide/angular';
import { Component, Input, OnChanges, SimpleChanges, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../../../core/auth/auth.service';
import { BrandComponent } from '../../../../shared/components/brand/brand.component';
import { Notification } from '../../models/notification.models';
import { LoggedUser } from '../../models/release.models';
import { NotificationService } from '../../services/notification.service';

@Component({ selector: 'app-header', standalone: true, imports: [LucideBell, LucideCheck, LucideChevronDown, LucideLogOut, BrandComponent], templateUrl: './app-header.component.html', styleUrl: './app-header.component.scss' })
export class AppHeaderComponent implements OnChanges {
  @Input() user: LoggedUser | null = null;

  private readonly auth = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  protected readonly notifications = signal<Notification[]>([]);
  protected readonly notificationOpen = signal(false);
  protected readonly notificationLoading = signal(false);
  protected readonly notificationError = signal(false);
  protected readonly markingRead = signal<number | null>(null);
  protected readonly unreadCount = computed(() => this.notifications().filter((item) => !item.lida).length);

  // Notificação é por usuário logado (Notificacao.id_usuario no backend), não por
  // cliente selecionado — por isso dispara sempre que o usuário muda, em qualquer tela.
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user) this.loadNotifications();
    else if (changes['user'] && !this.user) this.notifications.set([]);
  }

  protected toggleNotifications(): void {
    this.notificationOpen.update((open) => !open);
    if (this.notificationOpen() && this.notificationError()) this.loadNotifications();
  }

  protected loadNotifications(): void {
    if (!this.user) return;
    this.notificationLoading.set(true);
    this.notificationError.set(false);
    this.notificationService.list(this.user.id).subscribe({
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
    this.auth.logout();
  }
}
