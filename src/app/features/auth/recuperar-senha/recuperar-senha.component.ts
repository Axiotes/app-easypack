import { LucideArrowLeft, LucideCircle, LucideDiamond, LucideHistory, LucideShieldCheck, LucideUserCog, LucideWorkflow } from '@lucide/angular';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandComponent } from '../../../shared/components/brand/brand.component';

@Component({
  selector: 'app-recuperar-senha',
  standalone: true,
  imports: [RouterLink, LucideArrowLeft, LucideCircle, LucideDiamond, LucideHistory, LucideShieldCheck, LucideUserCog, LucideWorkflow, BrandComponent],
  templateUrl: './recuperar-senha.component.html',
  styleUrls: ['../login/login.component.scss', './recuperar-senha.component.scss'],
})
export class RecuperarSenhaComponent {}
