import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Subject, of, throwError } from 'rxjs';
import { routes } from '../../../app.routes';
import { AuthService } from '../../../core/auth/auth.service';
import { Client, CreatePackage, CreatedPackage, LoggedUser, Product, TipoPacote } from '../models/release.models';
import { ClientService } from '../services/client.service';
import { PackageService } from '../services/package.service';
import { ReferenceDataService } from '../services/reference-data.service';
import { UserService } from '../services/user.service';

const client: Client = { id: 4, nm_cliente: 'Hospital Prisma', id_setor_atendimento: 1, setor_atendimento: 'Fábrica', id_usuario: 2 };
const loggedUser: LoggedUser = {
  id: 2, nm_usuario: 'maria.silva', nm_completo: 'Maria Silva', cargo: 'GERENTE_PROJETO',
  id_subsetor: 2, nm_subsetor: 'Dev PEP ST', sn_gerencia: 'N', sg_setor: 'ST', id_produto: 1, nm_produto: 'PEP',
};
const products: Product[] = [
  { id: 1, nm_produto: 'PEP', nm_grupo_tipo_pacote: 'FRONT_BACK' },
  { id: 2, nm_produto: 'SOUL', nm_grupo_tipo_pacote: 'FORMS_REPORTS' },
  { id: 4, nm_produto: 'PAGU', nm_grupo_tipo_pacote: 'FORMS_REPORTS' },
];
const tiposPacote: TipoPacote[] = [
  { id: 1, nm_tipo: 'Front', nm_grupo: 'FRONT_BACK' },
  { id: 2, nm_tipo: 'Back', nm_grupo: 'FRONT_BACK' },
];

@Component({ template: '' })
class DetailsStub {}

describe('Package creation', () => {
  let createCalledWith: CreatePackage | undefined;
  let createSubject: Subject<CreatedPackage>;

  function configureTestBed(createImpl?: (data: CreatePackage) => ReturnType<PackageService['create']>) {
    createCalledWith = undefined;
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes.map((route) => (route.path === 'pacotes/:id' ? { path: route.path, component: DetailsStub } : route))),
        { provide: AuthService, useValue: { isAuthenticated: () => true } },
        { provide: ClientService, useValue: { getById: () => of(client) } },
        { provide: UserService, useValue: { getCurrentUser: () => of(loggedUser) } },
        {
          provide: PackageService,
          useValue: {
            getProducts: () => of(products),
            create:
              createImpl ??
              ((data: CreatePackage) => {
                createCalledWith = data;
                createSubject = new Subject<CreatedPackage>();
                return createSubject.asObservable();
              }),
          },
        },
        { provide: ReferenceDataService, useValue: { getTiposPacote: () => of(tiposPacote) } },
      ],
    });
  }

  async function open() {
    const harness = await RouterTestingHarness.create('/pacotes/novo?id_cliente=4');
    harness.detectChanges();
    return harness;
  }

  function fill(harness: RouterTestingHarness, name: string, value: string) {
    const input = harness.routeNativeElement!.querySelector(`[formControlName="${name}"]`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }
  function selectByLabel(harness: RouterTestingHarness, name: string, labelSubstring: string) {
    const select = harness.routeNativeElement!.querySelector(`[formControlName="${name}"]`) as HTMLSelectElement;
    const option = Array.from(select.options).find((item) => item.textContent?.includes(labelSubstring));
    if (!option) throw new Error(`option not found for ${name}: ${labelSubstring}`);
    select.value = option.value;
    select.dispatchEvent(new Event('change'));
  }
  function submit(harness: RouterTestingHarness) {
    harness.routeNativeElement!.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    harness.detectChanges();
  }
  function validForm(harness: RouterTestingHarness) {
    fill(harness, 'nm_pacote', ' pep-core.jar ');
    selectByLabel(harness, 'tp_pacote', 'Front');
    fill(harness, 'ticket', ' PEP-1042 ');
    fill(harness, 'versao_correcao', '3.4.1');
  }

  it('opens the static creation route with the selected client and permitted products', async () => {
    configureTestBed();
    const harness = await open();
    expect(harness.routeNativeElement?.textContent).toContain('Hospital Prisma');
    const options = harness.routeNativeElement!.querySelector('[formControlName="id_produto"]')!.textContent;
    expect(options).toContain('PEP');
    expect(options).toContain('PAGU');
    expect(options).not.toContain('SOUL');
  });

  it('blocks empty and whitespace-only required values', async () => {
    configureTestBed();
    const harness = await open();
    validForm(harness);
    fill(harness, 'nm_pacote', '   ');
    submit(harness);
    expect(createCalledWith).toBeUndefined();
    expect(harness.routeNativeElement?.textContent).toContain('Informe o nome do pacote');
  });

  it('creates package and correction in one request, prevents double submit and opens details', async () => {
    configureTestBed();
    const harness = await open();
    validForm(harness);
    submit(harness);
    submit(harness);
    expect(createCalledWith).toEqual({
      nm_pacote: 'pep-core.jar', tp_pacote: 1, id_cliente: 4, id_produto: 1,
      ticket: 'PEP-1042', versao_correcao: '3.4.1', ticket_bug: null, merge: null, sn_mergeado: 'N',
    });
    createSubject.next({ id: 101, id_correcao: 501 });
    createSubject.complete();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/pacotes/101?id_cliente=4');
  });

  it('keeps the data and enables retry when the API rejects the registration', async () => {
    configureTestBed(() => throwError(() => new HttpErrorResponse({ status: 403, error: { detail: 'Cadastro não permitido' } })));
    const harness = await open();
    validForm(harness);
    submit(harness);
    expect(harness.routeNativeElement?.textContent).toContain('Cadastro não permitido');
    const input = harness.routeNativeElement!.querySelector('[formControlName="nm_pacote"]') as HTMLInputElement;
    expect(input.value).toBe(' pep-core.jar ');
    expect(input.disabled).toBe(false);
  });

  it('requires a client for direct access', async () => {
    configureTestBed();
    const harness = await RouterTestingHarness.create('/pacotes/novo');
    expect(harness.routeNativeElement?.textContent).toContain('Selecione um cliente');
    expect(createCalledWith).toBeUndefined();
  });
});
