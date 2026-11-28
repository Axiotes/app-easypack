# EasyPack — Front-end

Front-end do EasyPack: sistema de controle de pacotes e correções aplicados em
ambientes de clientes, com rastreabilidade de quem fez o quê (aprovações, aplicação
de pacote, histórico de operações, dashboard e relatórios). Projeto da disciplina de
Fábrica de Software, construído em Angular (standalone components, signals).

Repositório do backend (FastAPI): [api-easypack](https://github.com/Axiotes/api-easypack).

## Stack

- Angular 21 (standalone components, signals, SSR)
- [@lucide/angular](https://lucide.dev/) para ícones
- [Vitest](https://vitest.dev/) para testes unitários

## Pré-requisitos

- Node.js 20+
- O backend (`api-easypack`) rodando em `http://localhost:8000` — este projeto consome a
  API diretamente nessa URL (sem arquivo de ambiente, a URL está fixa nos *services*).

## Rodando o projeto

```bash
npm install
ng serve
```

Acesse `http://localhost:4200`. A aplicação recarrega automaticamente ao salvar qualquer
arquivo. Login de teste: qualquer usuário do catálogo de exemplo do backend (ex.:
`maria.silva`), senha `admin123`.

## Testes automatizados

```bash
ng test
```

## Build de produção

```bash
ng build
```

Os artefatos ficam em `dist/`.

## Estrutura do projeto

```
src/app/
  core/auth/          autenticação centralizada (AuthService, guard de rotas, interceptor HTTP)
  features/
    auth/              login, recuperação de senha
    home/              listagem/cadastro de pacotes e correções por cliente
    clientes/          gestão de clientes (Gerente de Projeto)
    usuarios/          gestão de usuários (Coordenador)
    logs/              histórico de operações (Coordenador / Gerente de Projeto)
    dashboard/         indicadores gerais de pacotes e correções
    relatorios/        relatórios consolidados, exportáveis em CSV
  shared/              componentes e estilos reutilizados entre telas
```

## Principais funcionalidades

- Login com rotas protegidas (todas as telas internas exigem sessão válida; sessão
  expirada redireciona para o login automaticamente).
- Cadastro e acompanhamento de pacotes/correções por cliente, com as aprovações
  (code review, Gerente de Projeto, aplicação) feitas direto na tela de detalhes.
- Gestão de usuários (restrita ao próprio subsetor do Coordenador) e de clientes
  (restrita a Gerente de Projeto).
- Histórico de operações, dashboard com indicadores e relatórios exportáveis em CSV.

## Mais sobre o Angular CLI

Este projeto foi gerado com [Angular CLI](https://github.com/angular/angular-cli). Para o
guia completo de comandos (scaffolding, schematics, etc.), veja a
[referência do Angular CLI](https://angular.dev/tools/cli).
