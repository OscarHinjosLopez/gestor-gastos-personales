import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ExpenseListComponent } from './components/expense-list/expense-list.component';
import { IncomeListComponent } from './components/income-list/income-list.component';
import { StatsComponent } from './components/stats/stats.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'expenses', component: ExpenseListComponent },
  { path: 'incomes', component: IncomeListComponent },
  { path: 'stats', component: StatsComponent },
];
