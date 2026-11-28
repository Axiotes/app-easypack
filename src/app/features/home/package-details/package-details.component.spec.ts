import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Observable, of, throwError } from 'rxjs';
import { routes } from '../../../app.routes';
import { AuthService } from '../../../core/auth/auth.service';
import { PackageDetails } from '../models/release.models';
import { PackageService } from '../services/package.service';
import { ReferenceDataService } from '../services/reference-data.service';
import { UserService } from '../services/user.service';

const details: PackageDetails = {
  id: 101, id_correcao: 501, tp_pacote: 3, nm_tipo_pacote: 'Front', nm_pacote: 'pep-core.jar',
  sn_aplicado: 'N', sn_aprovado_usu: null, sn_aprovado_gerente: 'S',
  id_usuario_aplicacao: null, id_usuario_aprovador_gerente: 'Maria Silva',
  id_usuario_aprovador_par: null, ticket: 'PEP-1042', ticket_bug: null,
  merge: 'abc123', id_cliente: 'Hospital Prisma', id_produto: 'PEP',
  id_usuario: 'João Souza', id_setor: 'Fábrica', sg_setor_correcao: 'FB', sn_mergeado: 'S',
  versao_correcao: '3.4.1', sn_aprovado_code_review: 'S',
  id_usuario_aprovador: 'Ana Lima',
};

/**
 * `PackageService`/`ReferenceDataService` fazem várias chamadas HTTP encadeadas
 * (pacote → correção → cliente/produtos/setores/usuários/tipos de pacote); mocar
 * os services diretamente é mais robusto do que simular cada requisição.
 */
function configureTestBed(getById: (id: number) => Observable<PackageDetails> = () => of(details)): void {
  TestBed.configureTestingModule({
    providers: [
      provideRouter(routes),
      { provide: AuthService, useValue: { isAuthenticated: () => true } },
      { provide: UserService, useValue: { getCurrentUser: () => of(null) } },
      { provide: PackageService, useValue: { getById } },
      { provide: ReferenceDataService, useValue: { getCargos: () => of([]), getUsuarios: () => of([]) } },
    ],
  });
}

describe('Package details navigation', () => {
  it('loads the package by URL ID and displays correction and approval data', async () => {
    configureTestBed();
    const harness = await RouterTestingHarness.create('/pacotes/101?id_cliente=4');
    harness.detectChanges();
    const page = harness.routeNativeElement!;
    for (const value of ['pep-core.jar', '501', 'Hospital Prisma', 'PEP-1042', 'Maria Silva', 'Ana Lima', 'Não informado']) {
      expect(page.textContent).toContain(value);
    }
    expect(page.querySelector('.back-link')?.getAttribute('href')).toBe('/home?id_cliente=4');
    // 9 campos em "Dados do pacote" + 12 em "Dados da correção" (ver package-details.component.ts `sections`).
    expect(page.querySelectorAll('dd').length).toBe(21);
  });

  it('rejects invalid IDs without requesting a package', async () => {
    let called = false;
    configureTestBed(() => {
      called = true;
      return of(details);
    });
    const harness = await RouterTestingHarness.create('/pacotes/invalido');
    expect(harness.routeNativeElement?.textContent).toContain('ID do pacote inválido.');
    expect(called).toBe(false);
  });

  it('handles packages that do not exist', async () => {
    configureTestBed(() => throwError(() => new HttpErrorResponse({ status: 404 })));
    const harness = await RouterTestingHarness.create('/pacotes/999');
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Pacote não encontrado.');
    expect(harness.routeNativeElement?.querySelector('dl')).toBeNull();
  });

  it('replaces displayed data when navigating to another package and handles permission errors', async () => {
    configureTestBed((id) => (id === 101 ? of(details) : throwError(() => new HttpErrorResponse({ status: 403 }))));
    const harness = await RouterTestingHarness.create('/pacotes/101');
    harness.detectChanges();
    await harness.navigateByUrl('/pacotes/102');
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Você não tem permissão');
    expect(harness.routeNativeElement?.textContent).not.toContain('pep-core.jar');
  });
});
