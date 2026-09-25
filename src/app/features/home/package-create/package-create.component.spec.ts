import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';

@Component({ template: '' })
class DetailsStub {}

const base = 'http://localhost:8000/api/v1';

describe('Package creation', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(),
      provideRouter(routes.map((route) => route.path === 'pacotes/:id' ? { path: route.path, component: DetailsStub } : route)),
    ] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  async function open() {
    const harness = await RouterTestingHarness.create('/pacotes/novo?id_cliente=4');
    http.expectOne(`${base}/clientes/4`).flush({ id: 4, nm_cliente: 'Hospital Prisma', id_setor_atendimento: 1 });
    http.expectOne(`${base}/usuarios/me`).flush({ id: 2, nm_completo: 'Maria Silva', nm_produto: 'PEP', nm_subsetor: 'Dev PEP ST' });
    http.expectOne(`${base}/produtos`).flush([{ id: 1, nm_produto: 'PEP' }, { id: 2, nm_produto: 'SOUL' }, { id: 4, nm_produto: 'PAGU' }]);
    harness.detectChanges();
    return harness;
  }

  function fill(harness: RouterTestingHarness, name: string, value: string) {
    const input = harness.routeNativeElement!.querySelector(`[formControlName="${name}"]`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }
  function submit(harness: RouterTestingHarness) {
    harness.routeNativeElement!.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    harness.detectChanges();
  }
  function validForm(harness: RouterTestingHarness) {
    fill(harness, 'nm_pacote', ' pep-core.jar ');
    fill(harness, 'tp_pacote', '1');
    fill(harness, 'ticket', ' PEP-1042 ');
    fill(harness, 'versao_correcao', '3.4.1');
  }

  it('opens the static creation route with the selected client and permitted products', async () => {
    const harness = await open();
    expect(harness.routeNativeElement?.textContent).toContain('Hospital Prisma');
    const options = harness.routeNativeElement!.querySelector('[formControlName="id_produto"]')!.textContent;
    expect(options).toContain('PEP');
    expect(options).toContain('PAGU');
    expect(options).not.toContain('SOUL');
  });

  it('blocks empty and whitespace-only required values', async () => {
    const harness = await open();
    validForm(harness);
    fill(harness, 'nm_pacote', '   ');
    submit(harness);
    http.expectNone((request) => request.method === 'POST');
    expect(harness.routeNativeElement?.textContent).toContain('Informe o nome do pacote');
  });

  it('creates package and correction in one request, prevents double submit and opens details', async () => {
    const harness = await open();
    validForm(harness);
    submit(harness);
    submit(harness);
    const req = http.expectOne(`${base}/pacotes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nm_pacote: 'pep-core.jar', tp_pacote: 1, id_cliente: 4,
      id_produto: 1, ticket: 'PEP-1042', versao_correcao: '3.4.1', ticket_bug: null, merge: null, sn_mergeado: 'N' });
    req.flush({ id: 101, id_correcao: 501 });
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/pacotes/101?id_cliente=4');
  });

  it('keeps the data and enables retry when the API rejects the registration', async () => {
    const harness = await open();
    validForm(harness);
    submit(harness);
    http.expectOne(`${base}/pacotes`).flush({ detail: 'Cadastro não permitido' }, { status: 403, statusText: 'Forbidden' });
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('Cadastro não permitido');
    const input = harness.routeNativeElement!.querySelector('[formControlName="nm_pacote"]') as HTMLInputElement;
    expect(input.value).toBe(' pep-core.jar ');
    expect(input.disabled).toBe(false);
  });

  it('requires a client for direct access', async () => {
    const harness = await RouterTestingHarness.create('/pacotes/novo');
    expect(harness.routeNativeElement?.textContent).toContain('Selecione um cliente');
    http.expectNone((request) => request.url.startsWith(base));
  });
});
