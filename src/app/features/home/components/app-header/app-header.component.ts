import { Component } from '@angular/core';
import { BrandComponent } from '../../../../shared/components/brand/brand.component';

@Component({ selector: 'app-header', standalone: true, imports: [BrandComponent], templateUrl: './app-header.component.html', styleUrl: './app-header.component.scss' })
export class AppHeaderComponent {}
