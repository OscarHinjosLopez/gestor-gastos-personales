import {
  Component,
  signal,
  inject,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { StateService } from './core/state.service';
import { LoadingService } from './core/loading.service';
import { PwaService } from './core/pwa.service';
import { ExpenseFormComponent } from './components/expense-form/expense-form.component';
import { IncomeFormComponent } from './components/income-form/income-form.component';
import { NotificationContainerComponent } from './shared/notification-container.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CurrencyPipe,
    CommonModule,
    RouterOutlet,
    ExpenseFormComponent,
    IncomeFormComponent,
    NotificationContainerComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'gestor-gastos-personales';

  private router = inject(Router);
  private stateService = inject(StateService);
  private loadingService = inject(LoadingService);
  private pwaService = inject(PwaService);

  ngOnInit(): void {
    // Initialize PWA features
    this.pwaService.onNetworkChange((online) => {
      if (!online) {
        // Handle offline state
        console.log('Application is now offline');
      } else {
        console.log('Application is back online');
      }
    });
  }

  // Current URL for navigation highlighting
  get currentUrl(): string {
    return this.router.url.replace('/', '');
  }

  get balance() {
    return this.stateService.balance;
  }

  // Navigation helper
  navigateToTab(route: string): void {
    this.router.navigate([route]);
  }

  getCurrentTabClass(route: string): string {
    const isActive = this.currentUrl === route;

    if (isActive) {
      switch (route) {
        case '':
          return 'border-blue-500 text-blue-600 bg-blue-50';
        case 'expenses':
          return 'border-blue-500 text-blue-600 bg-blue-50';
        case 'incomes':
          return 'border-green-500 text-green-600 bg-green-50';
        case 'stats':
          return 'border-purple-500 text-purple-600 bg-purple-50';
        case 'comparison':
          return 'border-indigo-500 text-indigo-600 bg-indigo-50';
        case 'projections':
          return 'border-orange-500 text-orange-600 bg-orange-50';
        case 'budget-alerts':
          return 'border-red-500 text-red-600 bg-red-50';
        default:
          return 'border-blue-500 text-blue-600 bg-blue-50';
      }
    }

    return 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
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
