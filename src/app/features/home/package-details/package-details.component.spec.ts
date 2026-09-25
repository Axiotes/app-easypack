import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { routes } from '../../../app.routes';
import { PackageDetails } from '../models/release.models';
import { UserService } from '../services/user.service';

const details: PackageDetails = {
  id: 101, id_correcao: 501, tp_pacote: 1, nm_pacote: 'pep-core.jar',
  sn_aplicado: 'N', sn_aprovado_usu: null, sn_aprovado_gerente: 'S',
  id_usuario_aplicacao: null, id_usuario_aprovador_gerente: 'Maria Silva',
  id_usuario_aprovador_par: null, ticket: 'PEP-1042', ticket_bug: null,
  merge: 'abc123', id_cliente: 'Hospital Prisma', id_produto: 'PEP',
  id_usuario: 'João Souza', id_setor: 'Fábrica', sn_mergeado: 'S',
  versao_correcao: '3.4.1', sn_aprovado_code_review: 'S',
  id_usuario_aprovador: 'Ana Lima',
};

describe('Package details navigation', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting(),
        { provide: UserService, useValue: { getCurrentUser: () => of(null) } }],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the package by URL ID and displays correction and approval data', async () => {
    const harness = await RouterTestingHarness.create('/pacotes/101?id_cliente=4');
    expect(harness.routeNativeElement?.textContent).toContain('Carregando detalhes');
    http.expectOne('http://localhost:8000/api/v1/pacotes/101/detalhes').flush(details);
    harness.detectChanges();
    const page = harness.routeNativeElement!;
    for (const value of ['pep-core.jar', '501', 'Hospital Prisma', 'PEP-1042', 'Maria Silva', 'Ana Lima', 'Não informado']) {
      expect(page.textContent).toContain(value);
    }
    expect(page.querySelector('.back-link')?.getAttribute('href')).toBe('/home?id_cliente=4');
    expect(page.querySelectorAll('dd').length).toBe(Object.keys(details).length);
  });

  it('rejects invalid IDs without requesting a package', async () => {
    const harness = await RouterTestingHarness.create('/pacotes/invalido');
    expect(harness.routeNativeElement?.textContent).toContain('ID do pacote inválido.');
    http.expectNone((req) => req.url.includes('/pacotes/'));
  });

  it('handles packages that do not exist', async () => {
    const harness = await RouterTestingHarness.create('/pacotes/999');
    http.expectOne('http://localhost:8000/api/v1/pacotes/999/detalhes')
      .flush({}, { status: 404, statusText: 'Not Found' });
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Pacote não encontrado.');
    expect(harness.routeNativeElement?.querySelector('dl')).toBeNull();
  });

  it('replaces displayed data when navigating to another package and handles permission errors', async () => {
    const harness = await RouterTestingHarness.create('/pacotes/101');
    http.expectOne('http://localhost:8000/api/v1/pacotes/101/detalhes').flush(details);
    await harness.navigateByUrl('/pacotes/102');
    http.expectOne('http://localhost:8000/api/v1/pacotes/102/detalhes')
      .flush({}, { status: 403, statusText: 'Forbidden' });
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Você não tem permissão');
    expect(harness.routeNativeElement?.textContent).not.toContain('pep-core.jar');
  });
});
