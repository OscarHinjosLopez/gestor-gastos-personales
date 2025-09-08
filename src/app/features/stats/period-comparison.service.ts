import { Injectable, inject, computed, signal } from '@angular/core';
import { StateService } from '../../core/state.service';
import {
  DateRange,
  PeriodData,
  PeriodComparison,
  ComparisonMetrics,
  DeltaMetric,
  CategoryData,
  SourceData,
  CategoryComparison,
  SourceComparison,
  ComparisonInsight,
  ComparisonFilter,
  PERIOD_PRESETS,
} from '../../shared/models/period-comparison.model';
import { Expense } from '../../shared/models/expense.model';
import { Income } from '../../shared/models/income.model';

@Injectable({ providedIn: 'root' })
export class PeriodComparisonService {
  private stateService = inject(StateService);

  // Signals for reactive state management
  private _currentComparison = signal<PeriodComparison | null>(null);
  private _currentFilter = signal<ComparisonFilter>({});
  private _isLoading = signal<boolean>(false);

  // Readonly signals for components
  currentComparison = this._currentComparison.asReadonly();
  currentFilter = this._currentFilter.asReadonly();
  isLoading = this._isLoading.asReadonly();

  // Available period presets
  periodPresets = PERIOD_PRESETS;

  constructor() {}

  /**
   * Compare two periods and generate comprehensive comparison data
   */
  async comparePeriods(
    period1: DateRange,
    period2: DateRange,
    filter?: ComparisonFilter
  ): Promise<PeriodComparison> {
    this._isLoading.set(true);

    try {
      // Apply filter if provided
      if (filter) {
        this._currentFilter.set(filter);
      }

      // Get data for both periods
      const period1Data = this.calculatePeriodData(period1, filter);
      const period2Data = this.calculatePeriodData(period2, filter);

      // Calculate comparison metrics
      const metrics = this.calculateComparisonMetrics(period1Data, period2Data);

      // Generate insights
      const insights = this.generateInsights(period1Data, period2Data, metrics);

      const comparison: PeriodComparison = {
        period1: { range: period1, data: period1Data },
        period2: { range: period2, data: period2Data },
        metrics,
        insights,
      };

      this._currentComparison.set(comparison);
      return comparison;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Calculate comprehensive data for a specific period
   */
  private calculatePeriodData(
    range: DateRange,
    filter?: ComparisonFilter
  ): PeriodData {
    const expenses = this.filterTransactionsByDateAndCriteria(
      this.stateService.expenses(),
      range,
      filter,
      'expense'
    ) as Expense[];

    const incomes = this.filterTransactionsByDateAndCriteria(
      this.stateService.incomes(),
      range,
      filter,
      'income'
    ) as Income[];

    const totalExpenses = expenses.reduce(
      (sum, exp) => sum + (exp.amount || 0),
      0
    );
    const totalIncomes = incomes.reduce(
      (sum, inc) => sum + (inc.amount || 0),
      0
    );
    const balance = totalIncomes - totalExpenses;

    const daysInPeriod = this.getDaysInPeriod(range);
    const uniqueDaysWithTransactions = this.getUniqueDaysWithTransactions(
      expenses,
      incomes
    );

    const categoryBreakdown = this.calculateCategoryBreakdown(expenses);
    const sourceBreakdown = this.calculateSourceBreakdown(incomes);

    return {
      totalIncomes,
      totalExpenses,
      balance,
      transactionCount: expenses.length + incomes.length,
      averageDailyExpense: daysInPeriod > 0 ? totalExpenses / daysInPeriod : 0,
      averageDailyIncome: daysInPeriod > 0 ? totalIncomes / daysInPeriod : 0,
      categoryBreakdown,
      sourceBreakdown,
      topCategory:
        categoryBreakdown.length > 0 ? categoryBreakdown[0] : undefined,
      topSource: sourceBreakdown.length > 0 ? sourceBreakdown[0] : undefined,
      daysWithTransactions: uniqueDaysWithTransactions,
      savingsRate:
        totalIncomes > 0
          ? ((totalIncomes - totalExpenses) / totalIncomes) * 100
          : 0,
    };
  }

  /**
   * Filter transactions by date range and additional criteria
   */
  private filterTransactionsByDateAndCriteria(
    transactions: (Expense | Income)[],
    range: DateRange,
    filter?: ComparisonFilter,
    type?: 'expense' | 'income'
  ): (Expense | Income)[] {
    let filtered = transactions.filter((transaction) => {
      const date = transaction.date;
      return date >= range.start && date <= range.end;
    });

    if (!filter) return filtered;

    // Apply amount filters
    if (filter.minAmount !== undefined) {
      filtered = filtered.filter((t) => (t.amount || 0) >= filter.minAmount!);
    }
    if (filter.maxAmount !== undefined) {
      filtered = filtered.filter((t) => (t.amount || 0) <= filter.maxAmount!);
    }

    // Apply category filters (for expenses)
    if (
      type === 'expense' &&
      filter.categories &&
      filter.categories.length > 0
    ) {
      filtered = filtered.filter((t) => {
        const expense = t as Expense;
        return filter.categories!.includes(expense.category || '');
      });
    }

    // Apply source filters (for incomes)
    if (type === 'income' && filter.sources && filter.sources.length > 0) {
      filtered = filtered.filter((t) => {
        const income = t as Income;
        return filter.sources!.includes(income.source || '');
      });
    }

    // Exclude zero values if specified
    if (!filter.includeZeroValues) {
      filtered = filtered.filter((t) => (t.amount || 0) > 0);
    }

    return filtered;
  }

  /**
   * Calculate category breakdown for expenses
   */
  private calculateCategoryBreakdown(expenses: Expense[]): CategoryData[] {
    const categoryMap = new Map<string, { amount: number; count: number }>();
    const totalAmount = expenses.reduce(
      (sum, exp) => sum + (exp.amount || 0),
      0
    );

    expenses.forEach((expense) => {
      const category = expense.category || 'Sin categoría';
      const current = categoryMap.get(category) || { amount: 0, count: 0 };
      categoryMap.set(category, {
        amount: current.amount + (expense.amount || 0),
        count: current.count + 1,
      });
    });

    return Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  /**
   * Calculate source breakdown for incomes
   */
  private calculateSourceBreakdown(incomes: Income[]): SourceData[] {
    const sourceMap = new Map<string, { amount: number; count: number }>();
    const totalAmount = incomes.reduce(
      (sum, inc) => sum + (inc.amount || 0),
      0
    );

    incomes.forEach((income) => {
      const source = income.source || 'Sin fuente';
      const current = sourceMap.get(source) || { amount: 0, count: 0 };
      sourceMap.set(source, {
        amount: current.amount + (income.amount || 0),
        count: current.count + 1,
      });
    });

    return Array.from(sourceMap.entries())
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  /**
   * Calculate comparison metrics between two periods
   */
  private calculateComparisonMetrics(
    period1Data: PeriodData,
    period2Data: PeriodData
  ): ComparisonMetrics {
    return {
      incomeDelta: this.calculateDelta(
        period1Data.totalIncomes,
        period2Data.totalIncomes
      ),
      expenseDelta: this.calculateDelta(
        period1Data.totalExpenses,
        period2Data.totalExpenses
      ),
      balanceDelta: this.calculateDelta(
        period1Data.balance,
        period2Data.balance
      ),
      transactionCountDelta: this.calculateDelta(
        period1Data.transactionCount,
        period2Data.transactionCount
      ),
      averageDailyExpenseDelta: this.calculateDelta(
        period1Data.averageDailyExpense,
        period2Data.averageDailyExpense
      ),
      averageDailyIncomeDelta: this.calculateDelta(
        period1Data.averageDailyIncome,
        period2Data.averageDailyIncome
      ),
      savingsRateDelta: this.calculateDelta(
        period1Data.savingsRate,
        period2Data.savingsRate
      ),
      categoryChanges: this.calculateCategoryChanges(
        period1Data.categoryBreakdown,
        period2Data.categoryBreakdown
      ),
      sourceChanges: this.calculateSourceChanges(
        period1Data.sourceBreakdown,
        period2Data.sourceBreakdown
      ),
    };
  }

  /**
   * Calculate delta metric between two values
   */
  private calculateDelta(current: number, previous: number): DeltaMetric {
    const absolute = current - previous;
    const percentage =
      previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(percentage) > 1) {
      // More than 1% change
      trend = absolute > 0 ? 'up' : 'down';
    }

    let significance: 'high' | 'medium' | 'low' = 'low';
    if (Math.abs(percentage) > 20) significance = 'high';
    else if (Math.abs(percentage) > 10) significance = 'medium';

    return { absolute, percentage, trend, significance };
  }

  /**
   * Calculate category-level changes between periods
   */
  private calculateCategoryChanges(
    current: CategoryData[],
    previous: CategoryData[]
  ): CategoryComparison[] {
    const currentMap = new Map(current.map((c) => [c.name, c]));
    const previousMap = new Map(previous.map((c) => [c.name, c]));
    const allCategories = new Set([
      ...currentMap.keys(),
      ...previousMap.keys(),
    ]);

    return Array.from(allCategories)
      .map((categoryName) => {
        const currentData = currentMap.get(categoryName);
        const previousData = previousMap.get(categoryName);

        const period1Amount = currentData?.amount || 0;
        const period2Amount = previousData?.amount || 0;

        return {
          name: categoryName,
          period1Amount,
          period2Amount,
          delta: this.calculateDelta(period1Amount, period2Amount),
          isNew: !previousData && !!currentData,
          isRemoved: !!previousData && !currentData,
        };
      })
      .sort((a, b) => Math.abs(b.delta.absolute) - Math.abs(a.delta.absolute));
  }

  /**
   * Calculate source-level changes between periods
   */
  private calculateSourceChanges(
    current: SourceData[],
    previous: SourceData[]
  ): SourceComparison[] {
    const currentMap = new Map(current.map((s) => [s.name, s]));
    const previousMap = new Map(previous.map((s) => [s.name, s]));
    const allSources = new Set([...currentMap.keys(), ...previousMap.keys()]);

    return Array.from(allSources)
      .map((sourceName) => {
        const currentData = currentMap.get(sourceName);
        const previousData = previousMap.get(sourceName);

        const period1Amount = currentData?.amount || 0;
        const period2Amount = previousData?.amount || 0;

        return {
          name: sourceName,
          period1Amount,
          period2Amount,
          delta: this.calculateDelta(period1Amount, period2Amount),
          isNew: !previousData && !!currentData,
          isRemoved: !!previousData && !currentData,
        };
      })
      .sort((a, b) => Math.abs(b.delta.absolute) - Math.abs(a.delta.absolute));
  }

  /**
   * Generate intelligent insights based on comparison data
   */
  private generateInsights(
    period1Data: PeriodData,
    period2Data: PeriodData,
    metrics: ComparisonMetrics
  ): ComparisonInsight[] {
    const insights: ComparisonInsight[] = [];

    // Balance insights
    if (metrics.balanceDelta.significance === 'high') {
      insights.push({
        type: metrics.balanceDelta.trend === 'up' ? 'positive' : 'negative',
        category: 'balance',
        title:
          metrics.balanceDelta.trend === 'up'
            ? 'Mejora significativa del balance'
            : 'Deterioro significativo del balance',
        description: `Tu balance ${
          metrics.balanceDelta.trend === 'up' ? 'mejoró' : 'empeoró'
        } en ${Math.abs(metrics.balanceDelta.percentage).toFixed(
          1
        )}% comparado con el período anterior`,
        percentage: metrics.balanceDelta.percentage,
        priority: 'high',
      });
    }

    // Income insights
    if (metrics.incomeDelta.significance === 'high') {
      insights.push({
        type: metrics.incomeDelta.trend === 'up' ? 'positive' : 'warning',
        category: 'income',
        title:
          metrics.incomeDelta.trend === 'up'
            ? 'Aumento considerable de ingresos'
            : 'Reducción considerable de ingresos',
        description: `Tus ingresos ${
          metrics.incomeDelta.trend === 'up' ? 'aumentaron' : 'disminuyeron'
        } ${Math.abs(metrics.incomeDelta.percentage).toFixed(1)}%`,
        percentage: metrics.incomeDelta.percentage,
        priority: 'high',
      });
    }

    // Expense insights
    if (metrics.expenseDelta.significance === 'high') {
      insights.push({
        type: metrics.expenseDelta.trend === 'up' ? 'negative' : 'positive',
        category: 'expense',
        title:
          metrics.expenseDelta.trend === 'up'
            ? 'Aumento significativo de gastos'
            : 'Reducción significativa de gastos',
        description: `Tus gastos ${
          metrics.expenseDelta.trend === 'up' ? 'aumentaron' : 'disminuyeron'
        } ${Math.abs(metrics.expenseDelta.percentage).toFixed(1)}%`,
        percentage: metrics.expenseDelta.percentage,
        priority: 'high',
      });
    }

    // Savings rate insights
    if (Math.abs(metrics.savingsRateDelta.percentage) > 15) {
      insights.push({
        type: metrics.savingsRateDelta.trend === 'up' ? 'positive' : 'warning',
        category: 'behavior',
        title: `${
          metrics.savingsRateDelta.trend === 'up' ? 'Mejora' : 'Reducción'
        } en tasa de ahorro`,
        description: `Tu tasa de ahorro ${
          metrics.savingsRateDelta.trend === 'up' ? 'mejoró' : 'empeoró'
        } ${Math.abs(metrics.savingsRateDelta.absolute).toFixed(
          1
        )} puntos porcentuales`,
        value: metrics.savingsRateDelta.absolute,
        priority: 'medium',
      });
    }

    // Category-specific insights
    const significantCategoryChanges = metrics.categoryChanges.filter(
      (c) => c.delta.significance === 'high'
    );
    significantCategoryChanges.slice(0, 2).forEach((change) => {
      insights.push({
        type: change.delta.trend === 'up' ? 'warning' : 'positive',
        category: 'expense',
        title: `Cambio notable en ${change.name}`,
        description: `Gastos en ${change.name} ${
          change.delta.trend === 'up' ? 'aumentaron' : 'disminuyeron'
        } ${Math.abs(change.delta.percentage).toFixed(1)}%`,
        percentage: change.delta.percentage,
        priority: 'medium',
      });
    });

    // New categories insight
    const newCategories = metrics.categoryChanges.filter((c) => c.isNew);
    if (newCategories.length > 0) {
      insights.push({
        type: 'neutral',
        category: 'behavior',
        title: 'Nuevas categorías de gastos',
        description: `Aparecieron ${
          newCategories.length
        } nueva(s) categoría(s): ${newCategories
          .map((c) => c.name)
          .join(', ')}`,
        priority: 'low',
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Get number of days in a period
   */
  private getDaysInPeriod(range: DateRange): number {
    const start = new Date(range.start);
    const end = new Date(range.end);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  /**
   * Get unique days with transactions
   */
  private getUniqueDaysWithTransactions(
    expenses: Expense[],
    incomes: Income[]
  ): number {
    const uniqueDates = new Set<string>();

    expenses.forEach((exp) => uniqueDates.add(exp.date));
    incomes.forEach((inc) => uniqueDates.add(inc.date));

    return uniqueDates.size;
  }

  /**
   * Update current filter
   */
  updateFilter(filter: ComparisonFilter): void {
    this._currentFilter.set(filter);
  }

  /**
   * Clear current comparison
   */
  clearComparison(): void {
    this._currentComparison.set(null);
  }

  /**
   * Get available categories for filtering
   */
  getAvailableCategories(): string[] {
    const expenses = this.stateService.expenses();
    const categories = [
      ...new Set(expenses.map((e) => e.category).filter(Boolean)),
    ];
    return categories.sort();
  }

  /**
   * Get available sources for filtering
   */
  getAvailableSources(): string[] {
    const incomes = this.stateService.incomes();
    const sources = [
      ...new Set(incomes.map((i) => i.source).filter(Boolean) as string[]),
    ];
    return sources.sort();
  }
}
