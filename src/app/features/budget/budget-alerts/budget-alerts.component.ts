import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  OnInit,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  Budget,
  BudgetAlert,
  BudgetStatus,
  BudgetConfiguration,
  CreateBudgetRequest,
  AlertFilters,
  AlertType,
  AlertPriority,
} from '../../../shared/models/budget.model';
import { BudgetService } from '../budget.service';
import { LoadingService } from '../../../core/loading.service';
import { NotificationService } from '../../../core/notification.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal.component';
import { BudgetValidator } from '../../../shared/utils/budget-validation.utils';

@Component({
  selector: 'app-budget-alerts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    ConfirmModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './budget-alerts.component.html',
  styleUrls: ['./budget-alerts.component.scss'],
})
export class BudgetAlertsComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // Signals for reactive state
  private selectedTabSignal = signal<'alerts' | 'budgets' | 'settings'>(
    'alerts'
  );
  private showCreateBudgetModalSignal = signal(false);
  private showDeleteConfirmModalSignal = signal(false);
  private budgetToDeleteSignal = signal<Budget | null>(null);
  private alertFiltersSignal = signal<AlertFilters>({});

  // Forms
  budgetForm: FormGroup;
  configForm: FormGroup;

  // Computed values
  selectedTab = computed(() => this.selectedTabSignal());
  showCreateBudgetModal = computed(() => this.showCreateBudgetModalSignal());
  showDeleteConfirmModal = computed(() => this.showDeleteConfirmModalSignal());
  budgetToDelete = computed(() => this.budgetToDeleteSignal());
  alertFilters = computed(() => this.alertFiltersSignal());

  // Modal data
  deleteModalData = computed(() => {
    const budget = this.budgetToDelete();
    return budget
      ? {
          title: 'Eliminar Presupuesto',
          message: `¿Estás seguro de que quieres eliminar el presupuesto "${budget.name}"? Esta acción no se puede deshacer.`,
          confirmText: 'Eliminar',
          cancelText: 'Cancelar',
          type: 'danger' as const,
        }
      : null;
  });

  // Data from service (with SSR guards)
  budgets = computed(() => {
    if (!this.isBrowser) return [];
    return this.budgetService.budgets();
  });

  alerts = computed(() => {
    if (!this.isBrowser) return [];
    return this.getFilteredAlerts();
  });

  budgetStatuses = computed(() => {
    if (!this.isBrowser) return [];
    return this.budgetService.getAllBudgetStatuses();
  });

  budgetSummary = computed(() => {
    if (!this.isBrowser) {
      return {
        totalBudgets: 0,
        activeBudgets: 0,
        totalAllocated: 0,
        totalSpent: 0,
        totalRemaining: 0,
        overBudgetCount: 0,
        alertsCount: 0,
        averageUsagePercentage: 0,
      };
    }
    return this.budgetService.budgetSummary();
  });

  configuration = computed(() => {
    if (!this.isBrowser) {
      // Return default configuration for SSR
      return {
        id: 'default',
        enableNotifications: true,
        soundEnabled: false,
        emailNotifications: false,
        dailyDigest: false,
        weeklyReport: false,
        autoCreateMonthlyBudgets: false,
        defaultWarningThreshold: 80,
        defaultDangerThreshold: 95,
        categories: [],
      };
    }
    return this.budgetService.configuration();
  });

  unreadAlerts = computed(() => {
    if (!this.isBrowser) return [];
    return this.budgetService.unreadAlerts();
  });

  criticalAlerts = computed(() => {
    if (!this.isBrowser) return [];
    return this.budgetService.criticalAlerts();
  });

  // Available categories for budgets
  availableCategories = [
    'Alimentación',
    'Transporte',
    'Entretenimiento',
    'Salud',
    'Ropa',
    'Hogar',
    'Educación',
    'Servicios',
    'Otros',
  ];

  constructor() {
    this.budgetForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      category: ['', [Validators.required]],
      monthlyLimit: [0, [Validators.required, Validators.min(1)]],
      warningThreshold: [
        80,
        [Validators.required, Validators.min(1), Validators.max(100)],
      ],
      dangerThreshold: [
        95,
        [Validators.required, Validators.min(1), Validators.max(100)],
      ],
      isActive: [true],
    });

    this.configForm = this.fb.group({
      enableNotifications: [true],
      soundEnabled: [true],
      emailNotifications: [false],
      dailyDigest: [false],
      weeklyReport: [true],
      autoCreateMonthlyBudgets: [false],
      defaultWarningThreshold: [80, [Validators.min(1), Validators.max(99)]],
      defaultDangerThreshold: [95, [Validators.min(2), Validators.max(100)]],
    });
  }

  ngOnInit(): void {
    // Only load configuration in browser to avoid SSR issues
    // Use setTimeout to defer execution and avoid blocking SSR
    if (this.isBrowser) {
      setTimeout(() => {
        this.loadConfigurationIntoForm();
      }, 0);
    }
  }

  // Tab navigation
  selectTab(tab: 'alerts' | 'budgets' | 'settings'): void {
    this.selectedTabSignal.set(tab);
  }

  // Alert management
  getFilteredAlerts(): BudgetAlert[] {
    // Return empty array for SSR to avoid service calls
    if (!this.isBrowser) return [];

    const filters = this.alertFilters();
    const sortOptions = {
      field: 'triggeredAt' as const,
      direction: 'desc' as const,
    };
    return this.budgetService.getFilteredAlerts(filters, sortOptions);
  }

  async markAlertAsRead(alert: BudgetAlert): Promise<void> {
    if (!alert.isRead) {
      await this.budgetService.markAlertAsRead(alert.id);
    }
  }

  async dismissAlert(alert: BudgetAlert): Promise<void> {
    await this.budgetService.dismissAlert(alert.id);
    this.notificationService.success('Alerta descartada');
  }

  getAlertIcon(type: AlertType): string {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'danger':
        return '🚨';
      case 'info':
      default:
        return 'ℹ️';
    }
  }

  getAlertClass(type: AlertType, priority: AlertPriority): string {
    const baseClasses = 'p-4 rounded-lg border-l-4 mb-4';

    if (type === 'danger' || priority === 'critical') {
      return `${baseClasses} bg-red-50 border-red-500 text-red-800`;
    } else if (type === 'warning' || priority === 'high') {
      return `${baseClasses} bg-yellow-50 border-yellow-500 text-yellow-800`;
    } else {
      return `${baseClasses} bg-blue-50 border-blue-500 text-blue-800`;
    }
  }

  // Budget management
  openCreateBudgetModal(): void {
    this.budgetForm.reset({
      name: '',
      category: '',
      monthlyLimit: 0,
      warningThreshold: this.configuration().defaultWarningThreshold,
      dangerThreshold: this.configuration().defaultDangerThreshold,
      isActive: true,
    });
    this.showCreateBudgetModalSignal.set(true);
  }

  closeCreateBudgetModal(): void {
    this.showCreateBudgetModalSignal.set(false);
  }

  async createBudget(): Promise<void> {
    if (this.budgetForm.valid) {
      try {
        await this.loadingService.wrap(
          'create-budget',
          (async () => {
            const formValue = this.budgetForm.value;

            // Validate with Zod
            const validation = BudgetValidator.validateCreateBudget(formValue);
            if (!validation.success) {
              throw new Error(validation.errors?.join(', '));
            }

            await this.budgetService.createBudget(validation.data!);
            this.closeCreateBudgetModal();
          })()
        );
      } catch (error) {
        this.notificationService.error(`Error al crear presupuesto: ${error}`);
      }
    } else {
      this.notificationService.error(
        'Por favor, completa todos los campos correctamente'
      );
    }
  }

  openDeleteBudgetConfirm(budget: Budget): void {
    this.budgetToDeleteSignal.set(budget);
    this.showDeleteConfirmModalSignal.set(true);
  }

  closeDeleteBudgetConfirm(): void {
    this.showDeleteConfirmModalSignal.set(false);
    this.budgetToDeleteSignal.set(null);
  }

  async deleteBudget(): Promise<void> {
    const budget = this.budgetToDelete();
    if (budget) {
      try {
        await this.loadingService.wrap(
          'delete-budget',
          (async () => {
            await this.budgetService.deleteBudget(budget.id);
            this.closeDeleteBudgetConfirm();
          })()
        );
      } catch (error) {
        this.notificationService.error(
          `Error al eliminar presupuesto: ${error}`
        );
      }
    }
  }

  async toggleBudgetStatus(budget: Budget): Promise<void> {
    try {
      await this.budgetService.updateBudget({
        id: budget.id,
        isActive: !budget.isActive,
      });
    } catch (error) {
      this.notificationService.error(
        `Error al cambiar estado del presupuesto: ${error}`
      );
    }
  }

  getBudgetStatusClass(status: BudgetStatus['status']): string {
    switch (status) {
      case 'safe':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'danger':
        return 'text-red-600 bg-red-100';
      case 'exceeded':
        return 'text-red-700 bg-red-200';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  getBudgetStatusText(status: BudgetStatus['status']): string {
    switch (status) {
      case 'safe':
        return 'Seguro';
      case 'warning':
        return 'Advertencia';
      case 'danger':
        return 'Peligro';
      case 'exceeded':
        return 'Excedido';
      default:
        return 'Desconocido';
    }
  }

  // Configuration management
  loadConfigurationIntoForm(): void {
    // Additional SSR guard
    if (!this.isBrowser) return;

    try {
      const config = this.configuration();
      this.configForm.patchValue({
        enableNotifications: config.enableNotifications,
        soundEnabled: config.soundEnabled,
        emailNotifications: config.emailNotifications,
        dailyDigest: config.dailyDigest,
        weeklyReport: config.weeklyReport,
        autoCreateMonthlyBudgets: config.autoCreateMonthlyBudgets,
        defaultWarningThreshold: config.defaultWarningThreshold,
        defaultDangerThreshold: config.defaultDangerThreshold,
      });
    } catch (error) {
      console.warn('Error loading configuration in SSR:', error);
    }
  }

  async saveConfiguration(): Promise<void> {
    if (this.configForm.valid) {
      try {
        await this.loadingService.wrap(
          'save-config',
          (async () => {
            const formValue = this.configForm.value;
            this.budgetService.updateConfiguration(formValue);
          })()
        );
      } catch (error) {
        this.notificationService.error(
          `Error al guardar configuración: ${error}`
        );
      }
    }
  }

  // Filter management
  updateFilters(filters: Partial<AlertFilters>): void {
    this.alertFiltersSignal.set({ ...this.alertFilters(), ...filters });
  }

  clearFilters(): void {
    this.alertFiltersSignal.set({});
  }

  // Utility methods
  isLoading(operation: string): boolean {
    return this.loadingService.isLoading(operation);
  }

  getProgressBarWidth(currentAmount: number, limit: number): number {
    return Math.min((currentAmount / limit) * 100, 100);
  }

  getProgressBarClass(percentage: number): string {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 95) return 'bg-red-400';
    if (percentage >= 80) return 'bg-yellow-400';
    return 'bg-green-500';
  }

  formatCurrency(amount: number): string {
    // Only format currency in browser to avoid SSR issues
    if (this.isBrowser) {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
      }).format(amount);
    }
    // Fallback for SSR
    return `€${amount.toFixed(2)}`;
  }

  getDaysRemainingText(days: number): string {
    if (days === 0) return 'Último día del mes';
    if (days === 1) return '1 día restante';
    return `${days} días restantes`;
  }

  getBudgetById(budgetId: string): Budget | undefined {
    return this.budgets().find((b) => b.id === budgetId);
  }
}
