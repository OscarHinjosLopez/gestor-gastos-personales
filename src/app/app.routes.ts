import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'expenses',
    loadComponent: () =>
      import('./features/expenses/expense-list/expense-list.component').then(
        (m) => m.ExpenseListComponent
      ),
  },
  {
    path: 'incomes',
    loadComponent: () =>
      import('./features/income/income-list/income-list.component').then(
        (m) => m.IncomeListComponent
      ),
  },
  {
    path: 'stats',
    loadComponent: () =>
      import('./features/stats/stats.component').then((m) => m.StatsComponent),
  },
  {
    path: 'comparison',
    loadComponent: () =>
      import(
        './features/stats/period-comparison/period-comparison.component'
      ).then((m) => m.PeriodComparisonComponent),
  },
  {
    path: 'projections',
    loadComponent: () =>
      import('./features/projections/projections.component').then(
        (m) => m.ProjectionsComponent
      ),
  },
  {
    path: 'budget-alerts',
    loadComponent: () =>
      import('./features/budget/budget-alerts/budget-alerts.component').then(
        (m) => m.BudgetAlertsComponent
      ),
    data: { prerender: false }, // Disable SSR prerendering for this route
  },
  { path: '**', redirectTo: '' },
];
