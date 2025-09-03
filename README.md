# GestorGastosPersonales

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.0.5.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

---

Scaffold notes for Gestor de Gastos Personales

- This repo now includes:
  - Models: `src/app/models/*` (Expense, Income, Category)
  - Core services: `src/app/core/*` (StorageService using Dexie fallback, ExpenseService, IncomeService, StateService using Signals)
  - Shared pipes: `src/app/shared/*` (filterByMonth, filterByCategory)
  - Basic standalone components: dashboard, expense-list, income-list, stats
  - Tailwind config and PostCSS wiring. Add `npm install` to install new deps.

Next steps (suggested):

1. Install deps: `npm install` (this will add tailwind, dexie, chart libs, and Angular Material).
2. Implement reactive forms for creating/updating expenses & incomes using `@angular/forms` and Angular Material components.
3. Wire ng2-charts charts in `src/app/components/stats`.
4. Add unit tests for services and pipes.

If you want, I can continue and implement the reactive forms, full Material UI, and chart components next.
