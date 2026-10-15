import { LucideBuilding2, LucideUsers, LucideUserCog } from '@lucide/angular';
import { Component, Input, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoggedUser } from '../../../features/home/models/release.models';

export type MainNavActive = 'pacotes' | 'clientes' | 'usuarios';

@Component({
  selector: 'app-main-nav',
  standalone: true,
  imports: [RouterLink, LucideBuilding2, LucideUsers, LucideUserCog],
  templateUrl: './main-nav.component.html',
  styleUrls: ['../../../features/home/home.component.scss', './main-nav.component.scss'],
})
export class MainNavComponent {
  @Input() active: MainNavActive = 'pacotes';
  @Input() set user(value: LoggedUser | null) {
    this.userSignal.set(value);
  }

  protected readonly userSignal = signal<LoggedUser | null>(null);
  protected readonly canManageUsuarios = computed(() => this.userSignal()?.cargo === 'COORDENADOR');
  protected readonly canManageClientes = computed(
    () => this.userSignal()?.cargo === 'COORDENADOR' && this.userSignal()?.sn_gerencia === 'S',
  );
}
