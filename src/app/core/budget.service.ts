import { Injectable, inject, computed, signal } from '@angular/core';
import {
  Budget,
  BudgetAlert,
  BudgetStatus,
  BudgetConfiguration,
  BudgetSummary,
  MonthlyBudgetReport,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  AlertType,
  AlertPriority,
  AlertFilters,
  AlertSortOptions,
} from '../models/budget.model';
import { StorageService } from './storage.service';
import { StateService } from './state.service';
import { NotificationService } from './notification.service';
import { generateId } from '../utils/id';
import { Expense } from '../models/expense.model';

@Injectable({
  providedIn: 'root',
})
export class BudgetService {
  private storageService = inject(StorageService);
  private stateService = inject(StateService);
  private notificationService = inject(NotificationService);

  private readonly BUDGETS_KEY = 'budgets';
  private readonly ALERTS_KEY = 'budget_alerts';
  private readonly CONFIG_KEY = 'budget_config';

  // Signals for reactive state management
  private budgetsSignal = signal<Budget[]>([]);
  private alertsSignal = signal<BudgetAlert[]>([]);
  private configSignal = signal<BudgetConfiguration>(
    this.getDefaultConfiguration()
  );

  // Computed values
  budgets = computed(() => this.budgetsSignal());
  alerts = computed(() => this.alertsSignal());
  configuration = computed(() => this.configSignal());

  activeBudgets = computed(() =>
    this.budgets().filter((budget) => budget.isActive)
  );

  unreadAlerts = computed(() =>
    this.alerts().filter((alert) => !alert.isRead && !alert.isDismissed)
  );

  criticalAlerts = computed(() =>
    this.alerts().filter(
      (alert) => alert.priority === 'critical' && !alert.isDismissed
    )
  );

  budgetSummary = computed((): BudgetSummary => {
    const budgets = this.activeBudgets();
    const totalBudgets = budgets.length;
    const totalAllocated = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);

    // Calculate current spending for each budget
    let totalSpent = 0;
    let overBudgetCount = 0;
    let totalUsagePercentage = 0;

    budgets.forEach((budget) => {
      const categorySpending = this.getCurrentMonthSpending(budget.category);
      totalSpent += categorySpending;

      const usagePercentage = (categorySpending / budget.monthlyLimit) * 100;
      totalUsagePercentage += usagePercentage;

      if (categorySpending > budget.monthlyLimit) {
        overBudgetCount++;
      }
    });

    return {
      totalBudgets,
      activeBudgets: totalBudgets,
      totalAllocated,
      totalSpent,
      totalRemaining: totalAllocated - totalSpent,
      overBudgetCount,
      alertsCount: this.unreadAlerts().length,
      averageUsagePercentage:
        totalBudgets > 0 ? totalUsagePercentage / totalBudgets : 0,
    };
  });

  constructor() {
    this.loadData();
    this.setupExpenseWatcher();
  }

  private async loadData(): Promise<void> {
    try {
      const budgets =
        (await this.storageService.getAll<Budget>(this.BUDGETS_KEY)) || [];
      const alerts =
        (await this.storageService.getAll<BudgetAlert>(this.ALERTS_KEY)) || [];

      // Load configuration from localStorage directly (not using the async StorageService pattern)
      const config =
        this.loadConfigFromStorage() || this.getDefaultConfiguration();

      this.budgetsSignal.set(budgets);
      this.alertsSignal.set(alerts);
      this.configSignal.set(config);
    } catch (error) {
      console.error('Error loading budget data:', error);
    }
  }

  private setupExpenseWatcher(): void {
    // Watch for expense changes and trigger budget checks
    // Using the StateService's expenses signal

    // Create a manual effect to watch expenses changes
    let previousExpensesLength = this.stateService.expenses().length;

    // Check periodically for changes
    setInterval(() => {
      const currentExpenses = this.stateService.expenses();
      const currentLength = currentExpenses.length;

      if (currentLength !== previousExpensesLength) {
        // Expenses have changed, check all budgets
        this.checkAllBudgets();
        previousExpensesLength = currentLength;
      }
    }, 2000); // Check every 2 seconds

    // Initial check
    setTimeout(() => {
      this.checkAllBudgets();
    }, 1000);
  }

  // Budget CRUD operations
  async createBudget(budgetData: CreateBudgetRequest): Promise<Budget> {
    const budget: Budget = {
      ...budgetData,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.storageService.put(this.BUDGETS_KEY, budget);

    // Update local state
    const budgets = [...this.budgets(), budget];
    this.budgetsSignal.set(budgets);

    this.notificationService.success(
      `Presupuesto "${budget.name}" creado correctamente`
    );
    this.checkBudget(budget);

    return budget;
  }

  async updateBudget(budgetData: UpdateBudgetRequest): Promise<Budget | null> {
    const budgets = this.budgets();
    const existingBudget = budgets.find((b) => b.id === budgetData.id);

    if (!existingBudget) return null;

    const updatedBudget: Budget = {
      ...existingBudget,
      ...budgetData,
      updatedAt: new Date(),
    };

    await this.storageService.put(this.BUDGETS_KEY, updatedBudget);

    // Update local state
    const newBudgets = budgets.map((b) =>
      b.id === budgetData.id ? updatedBudget : b
    );
    this.budgetsSignal.set(newBudgets);

    this.notificationService.success(
      `Presupuesto "${updatedBudget.name}" actualizado`
    );
    this.checkBudget(updatedBudget);

    return updatedBudget;
  }

  async deleteBudget(budgetId: string): Promise<boolean> {
    await this.storageService.delete(this.BUDGETS_KEY, budgetId);

    // Update local state
    const budgets = this.budgets().filter((b) => b.id !== budgetId);
    this.budgetsSignal.set(budgets);

    // Remove related alerts
    await this.removeAlertsByBudgetId(budgetId);

    this.notificationService.success('Presupuesto eliminado');
    return true;
  }

  getBudgetById(budgetId: string): Budget | null {
    return this.budgets().find((b) => b.id === budgetId) || null;
  }

  // Budget status and monitoring
  getBudgetStatus(budgetId: string): BudgetStatus | null {
    const budget = this.getBudgetById(budgetId);
    if (!budget) return null;

    const currentSpending = this.getCurrentMonthSpending(budget.category);
    const percentageUsed = (currentSpending / budget.monthlyLimit) * 100;
    const remainingAmount = budget.monthlyLimit - currentSpending;
    const daysRemaining = this.getDaysRemainingInMonth();

    let status: BudgetStatus['status'] = 'safe';
    if (percentageUsed >= budget.dangerThreshold) {
      status = percentageUsed >= 100 ? 'exceeded' : 'danger';
    } else if (percentageUsed >= budget.warningThreshold) {
      status = 'warning';
    }

    const budgetAlerts = this.alerts().filter(
      (alert) => alert.budgetId === budgetId
    );

    return {
      budgetId,
      budgetName: budget.name,
      category: budget.category,
      currentSpending,
      budgetLimit: budget.monthlyLimit,
      remainingAmount,
      percentageUsed,
      daysRemaining,
      projectedOverrun: this.calculateProjectedOverrun(
        currentSpending,
        daysRemaining,
        budget.monthlyLimit
      ),
      status,
      alerts: budgetAlerts,
    };
  }

  getAllBudgetStatuses(): BudgetStatus[] {
    return this.activeBudgets().map(
      (budget) => this.getBudgetStatus(budget.id)!
    );
  }

  // Alert management
  async createAlert(
    budget: Budget,
    type: AlertType,
    priority: AlertPriority,
    currentAmount: number,
    percentageUsed: number
  ): Promise<BudgetAlert> {
    const alert: BudgetAlert = {
      id: generateId(),
      budgetId: budget.id,
      budgetName: budget.name,
      category: budget.category,
      type,
      priority,
      title: this.generateAlertTitle(type, percentageUsed),
      message: this.generateAlertMessage(budget, currentAmount, percentageUsed),
      currentAmount,
      budgetLimit: budget.monthlyLimit,
      percentageUsed,
      isRead: false,
      isDismissed: false,
      triggeredAt: new Date(),
      expiresAt: this.calculateAlertExpiration(),
    };

    await this.storageService.put(this.ALERTS_KEY, alert);

    // Update local state
    const alerts = [...this.alerts(), alert];
    this.alertsSignal.set(alerts);

    // Show notification if enabled
    if (this.configuration().enableNotifications) {
      this.notificationService.warning(alert.title);
    }

    return alert;
  }

  async markAlertAsRead(alertId: string): Promise<void> {
    const alerts = this.alerts();
    const alert = alerts.find((a) => a.id === alertId);

    if (alert) {
      const updatedAlert = { ...alert, isRead: true };
      await this.storageService.put(this.ALERTS_KEY, updatedAlert);

      // Update local state
      const updatedAlerts = alerts.map((a) =>
        a.id === alertId ? updatedAlert : a
      );
      this.alertsSignal.set(updatedAlerts);
    }
  }

  async dismissAlert(alertId: string): Promise<void> {
    const alerts = this.alerts();
    const alert = alerts.find((a) => a.id === alertId);

    if (alert) {
      const updatedAlert = { ...alert, isDismissed: true };
      await this.storageService.put(this.ALERTS_KEY, updatedAlert);

      // Update local state
      const updatedAlerts = alerts.map((a) =>
        a.id === alertId ? updatedAlert : a
      );
      this.alertsSignal.set(updatedAlerts);
    }
  }

  async removeAlertsByBudgetId(budgetId: string): Promise<void> {
    const alertsToRemove = this.alerts().filter(
      (alert) => alert.budgetId === budgetId
    );

    for (const alert of alertsToRemove) {
      await this.storageService.delete(this.ALERTS_KEY, alert.id);
    }

    // Update local state
    const alerts = this.alerts().filter((alert) => alert.budgetId !== budgetId);
    this.alertsSignal.set(alerts);
  }

  getFilteredAlerts(
    filters: AlertFilters,
    sort?: AlertSortOptions
  ): BudgetAlert[] {
    let alerts = this.alerts();

    // Apply filters
    if (filters.type && filters.type.length > 0) {
      alerts = alerts.filter((alert) => filters.type!.includes(alert.type));
    }

    if (filters.priority && filters.priority.length > 0) {
      alerts = alerts.filter((alert) =>
        filters.priority!.includes(alert.priority)
      );
    }

    if (filters.category && filters.category.length > 0) {
      alerts = alerts.filter((alert) =>
        filters.category!.includes(alert.category)
      );
    }

    if (filters.isRead !== undefined) {
      alerts = alerts.filter((alert) => alert.isRead === filters.isRead);
    }

    if (filters.isDismissed !== undefined) {
      alerts = alerts.filter(
        (alert) => alert.isDismissed === filters.isDismissed
      );
    }

    if (filters.dateRange) {
      alerts = alerts.filter(
        (alert) =>
          alert.triggeredAt >= filters.dateRange!.start &&
          alert.triggeredAt <= filters.dateRange!.end
      );
    }

    // Apply sorting
    if (sort) {
      alerts.sort((a, b) => {
        let aValue: any = a[sort.field];
        let bValue: any = b[sort.field];

        if (sort.field === 'triggeredAt') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        } else if (sort.field === 'priority') {
          const priorityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
          aValue = priorityOrder[aValue as AlertPriority];
          bValue = priorityOrder[bValue as AlertPriority];
        }

        if (sort.direction === 'desc') {
          return bValue - aValue || bValue.localeCompare?.(aValue) || 0;
        } else {
          return aValue - bValue || aValue.localeCompare?.(bValue) || 0;
        }
      });
    }

    return alerts;
  }

  // Budget checking and monitoring
  checkAllBudgets(): void {
    this.activeBudgets().forEach((budget) => this.checkBudget(budget));
  }

  checkBudget(budget: Budget): void {
    const currentSpending = this.getCurrentMonthSpending(budget.category);
    const percentageUsed = (currentSpending / budget.monthlyLimit) * 100;

    // Check if we need to create alerts
    if (
      percentageUsed >= budget.dangerThreshold &&
      !this.hasRecentAlert(budget.id, 'danger')
    ) {
      this.createAlert(
        budget,
        'danger',
        'high',
        currentSpending,
        percentageUsed
      );
    } else if (
      percentageUsed >= budget.warningThreshold &&
      !this.hasRecentAlert(budget.id, 'warning')
    ) {
      this.createAlert(
        budget,
        'warning',
        'medium',
        currentSpending,
        percentageUsed
      );
    }

    // Check for budget exceeded
    if (percentageUsed >= 100 && !this.hasRecentAlert(budget.id, 'danger')) {
      this.createAlert(
        budget,
        'danger',
        'critical',
        currentSpending,
        percentageUsed
      );
    }
  }

  // Configuration management
  updateConfiguration(config: Partial<BudgetConfiguration>): void {
    const updatedConfig = { ...this.configuration(), ...config };
    this.configSignal.set(updatedConfig);
    this.saveConfigToStorage(updatedConfig);
    this.notificationService.success('Configuración actualizada');
  }

  // Utility methods
  private getCurrentMonthSpending(category: string): number {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return this.stateService
      .expenses()
      .filter((expense: Expense) => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getMonth() === currentMonth &&
          expenseDate.getFullYear() === currentYear &&
          expense.category === category
        );
      })
      .reduce((sum: number, expense: Expense) => sum + expense.amount, 0);
  }

  private loadConfigFromStorage(): BudgetConfiguration | null {
    try {
      const raw = localStorage.getItem(this.CONFIG_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private saveConfigToStorage(config: BudgetConfiguration): void {
    try {
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
    } catch {
      console.error('Failed to save budget configuration');
    }
  }

  private getDaysRemainingInMonth(): number {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.getDate() - now.getDate();
  }

  private calculateProjectedOverrun(
    currentSpending: number,
    daysRemaining: number,
    budgetLimit: number
  ): number | undefined {
    const daysInMonth = new Date().getDate() + daysRemaining;
    const averageDailySpending = currentSpending / new Date().getDate();
    const projectedTotal = averageDailySpending * daysInMonth;

    return projectedTotal > budgetLimit
      ? projectedTotal - budgetLimit
      : undefined;
  }

  private hasRecentAlert(budgetId: string, type: AlertType): boolean {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.alerts().some(
      (alert) =>
        alert.budgetId === budgetId &&
        alert.type === type &&
        new Date(alert.triggeredAt) > oneDayAgo &&
        !alert.isDismissed
    );
  }

  private generateAlertTitle(type: AlertType, percentageUsed: number): string {
    switch (type) {
      case 'warning':
        return `⚠️ Presupuesto al ${Math.round(percentageUsed)}%`;
      case 'danger':
        return percentageUsed >= 100
          ? `🚨 Presupuesto excedido (${Math.round(percentageUsed)}%)`
          : `⚠️ Presupuesto crítico (${Math.round(percentageUsed)}%)`;
      default:
        return `ℹ️ Actualización de presupuesto`;
    }
  }

  private generateAlertMessage(
    budget: Budget,
    currentAmount: number,
    percentageUsed: number
  ): string {
    const remaining = budget.monthlyLimit - currentAmount;

    if (percentageUsed >= 100) {
      const overrun = currentAmount - budget.monthlyLimit;
      return `Has superado el presupuesto de "${
        budget.name
      }" por €${overrun.toFixed(2)}. Gasto actual: €${currentAmount.toFixed(
        2
      )} de €${budget.monthlyLimit.toFixed(2)}.`;
    } else if (percentageUsed >= budget.dangerThreshold) {
      return `El presupuesto de "${
        budget.name
      }" está cerca del límite. Quedan €${remaining.toFixed(2)} disponibles.`;
    } else {
      return `El presupuesto de "${budget.name}" ha alcanzado ${Math.round(
        percentageUsed
      )}% del límite mensual.`;
    }
  }

  private calculateAlertExpiration(): Date {
    // Alerts expire at the end of the current month
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  }

  private getDefaultConfiguration(): BudgetConfiguration {
    return {
      id: generateId(),
      enableNotifications: true,
      soundEnabled: true,
      emailNotifications: false,
      dailyDigest: false,
      weeklyReport: true,
      autoCreateMonthlyBudgets: false,
      defaultWarningThreshold: 80,
      defaultDangerThreshold: 95,
      categories: [
        'Alimentación',
        'Transporte',
        'Entretenimiento',
        'Salud',
        'Ropa',
        'Hogar',
        'Educación',
        'Otros',
      ],
    };
  }

  // Monthly report generation
  generateMonthlyReport(month: number, year: number): MonthlyBudgetReport {
    const budgetStatuses = this.getAllBudgetStatuses();
    const summary = this.budgetSummary();

    const insights = this.generateInsights(budgetStatuses);
    const recommendations = this.generateRecommendations(budgetStatuses);

    return {
      month: new Date(year, month).toLocaleString('es', { month: 'long' }),
      year,
      budgets: budgetStatuses,
      summary,
      insights,
      recommendations,
    };
  }

  private generateInsights(budgetStatuses: BudgetStatus[]): string[] {
    const insights: string[] = [];

    const exceededBudgets = budgetStatuses.filter(
      (status) => status.status === 'exceeded'
    );
    const warningBudgets = budgetStatuses.filter(
      (status) => status.status === 'warning'
    );

    if (exceededBudgets.length > 0) {
      insights.push(
        `${exceededBudgets.length} presupuesto(s) fueron excedidos este mes`
      );
    }

    if (warningBudgets.length > 0) {
      insights.push(
        `${warningBudgets.length} presupuesto(s) están cerca del límite`
      );
    }

    const avgUsage =
      budgetStatuses.reduce((sum, status) => sum + status.percentageUsed, 0) /
      budgetStatuses.length;
    insights.push(`Uso promedio de presupuestos: ${Math.round(avgUsage)}%`);

    return insights;
  }

  private generateRecommendations(budgetStatuses: BudgetStatus[]): string[] {
    const recommendations: string[] = [];

    budgetStatuses.forEach((status) => {
      if (status.status === 'exceeded') {
        recommendations.push(
          `Considera aumentar el presupuesto de ${status.category} o reducir gastos en esta categoría`
        );
      } else if (status.projectedOverrun && status.projectedOverrun > 0) {
        recommendations.push(
          `El presupuesto de ${status.category} podría excederse. Ajusta tus gastos restantes`
        );
      }
    });

    return recommendations;
  }
}
