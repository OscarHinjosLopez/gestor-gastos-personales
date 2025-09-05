import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'expenses',
    loadComponent: () =>
      import('./components/expense-list/expense-list.component').then(
        (m) => m.ExpenseListComponent
      ),
  },
  {
    path: 'incomes',
    loadComponent: () =>
      import('./components/income-list/income-list.component').then(
        (m) => m.IncomeListComponent
      ),
  },
  {
    path: 'stats',
    loadComponent: () =>
      import('./components/stats/stats.component').then(
        (m) => m.StatsComponent
      ),
  },
  {
    path: 'comparison',
    loadComponent: () =>
      import('./components/period-comparison/period-comparison.component').then(
        (m) => m.PeriodComparisonComponent
      ),
  },
  { path: '**', redirectTo: '' },
];
