import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrandComponent } from '../../../shared/components/brand/brand.component';

@Component({ selector: 'app-login', standalone: true, imports: [FormsModule, BrandComponent], templateUrl: './login.component.html', styleUrl: './login.component.scss' })
export class LoginComponent {
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly showPassword = signal(false);
  protected readonly submitted = signal(false);
  protected submit(): void { this.submitted.set(true); }
}
