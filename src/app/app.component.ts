import { Component, signal, inject } from '@angular/core';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { StateService } from './core/state.service';
import { LoadingService } from './core/loading.service';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ExpenseFormComponent } from './components/expense-form/expense-form.component';
import { ExpenseListComponent } from './components/expense-list/expense-list.component';
import { IncomeFormComponent } from './components/income-form/income-form.component';
import { IncomeListComponent } from './components/income-list/income-list.component';
import { StatsComponent } from './components/stats/stats.component';
import { NotificationContainerComponent } from './shared/notification-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CurrencyPipe,
    CommonModule,
    DashboardComponent,
    ExpenseFormComponent,
    ExpenseListComponent,
    IncomeFormComponent,
    IncomeListComponent,
    StatsComponent,
    NotificationContainerComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'gestor-gastos-personales';
  activeTab = signal<'expenses' | 'incomes' | 'stats'>('expenses');

  private stateService = inject(StateService);
  private loadingService = inject(LoadingService);

  get balance() {
    return this.stateService.balance;
  }

  // Utility methods for the template
  isLoading(): boolean {
    return this.loadingService.isAnyLoading();
  }

  hasError(): boolean {
    return this.stateService.error() !== null;
  }

  getError(): string | null {
    return this.stateService.error();
  }

  clearError(): void {
    this.stateService.clearError();
  }
}
