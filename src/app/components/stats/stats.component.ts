import {
  Component,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { StateService } from '../../core/state.service';
import { ChartService } from '../../core/chart.service';
import {
  PieChartComponent,
  BarChartComponent,
  LineChartComponent,
  ChartFiltersComponent,
  BarChartDataset,
  LineChartDataset,
  ChartFilters,
} from '../charts';

@Component({
  selector: 'app-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    PieChartComponent,
    BarChartComponent,
    LineChartComponent,
    ChartFiltersComponent,
  ],
  template: `
    <div class="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div class="text-center mb-8">
        <h3 class="text-3xl font-bold text-gray-800 mb-2">
          📊 Estadísticas y Análisis Financiero
        </h3>
        <p class="text-lg text-gray-500">
          Visualización interactiva de tus finanzas personales
        </p>
      </div>

      <!-- Resumen rápido -->
      <div class="mb-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-all duration-200 hover:-translate-y-1"
          >
            <div class="text-4xl opacity-80">💰</div>
            <div class="flex-1">
              <div class="text-2xl font-bold text-blue-600 mb-1">
                {{
                  monthlyStats().balance | currency : 'EUR' : 'symbol' : '1.0-0'
                }}
              </div>
              <div class="text-sm text-gray-500 font-medium">
                Balance del Mes
              </div>
            </div>
          </div>
          <div
            class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-all duration-200 hover:-translate-y-1"
          >
            <div class="text-4xl opacity-80">📈</div>
            <div class="flex-1">
              <div class="text-2xl font-bold text-green-600 mb-1">
                {{
                  monthlyStats().totalIncomes
                    | currency : 'EUR' : 'symbol' : '1.0-0'
                }}
              </div>
              <div class="text-sm text-gray-500 font-medium">
                Ingresos del Mes
              </div>
            </div>
          </div>
          <div
            class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-all duration-200 hover:-translate-y-1"
          >
            <div class="text-4xl opacity-80">📉</div>
            <div class="flex-1">
              <div class="text-2xl font-bold text-red-600 mb-1">
                {{
                  monthlyStats().totalExpenses
                    | currency : 'EUR' : 'symbol' : '1.0-0'
                }}
              </div>
              <div class="text-sm text-gray-500 font-medium">
                Gastos del Mes
              </div>
            </div>
          </div>
          <div
            class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-all duration-200 hover:-translate-y-1"
          >
            <div class="text-4xl opacity-80">📊</div>
            <div class="flex-1">
              <div class="text-2xl font-bold text-purple-600 mb-1">
                {{
                  averageDailyExpense() | currency : 'EUR' : 'symbol' : '1.0-0'
                }}
              </div>
              <div class="text-sm text-gray-500 font-medium">
                Gasto Diario Promedio
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtros interactivos -->
      <div class="mb-8">
        <app-chart-filters
          [availableCategories]="getAvailableCategories()"
          [availableSources]="getAvailableSources()"
          (filtersChange)="onFiltersChange($event)"
        >
        </app-chart-filters>
      </div>

      <!-- Gráficos principales -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        <!-- Gráfico de gastos por categoría -->
        <div
          class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <app-pie-chart
            [data]="expensesByCategory()"
            [title]="'Distribución de Gastos por Categoría'"
            [height]="350"
            [chartType]="'doughnut'"
            [showLegend]="true"
            [noDataTitle]="'Sin gastos registrados'"
            [noDataMessage]="
              'Agrega gastos para ver la distribución por categorías'
            "
          >
          </app-pie-chart>
        </div>

        <!-- Gráfico de ingresos por fuente -->
        <div
          class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <app-bar-chart
            [labels]="incomesBySourceLabels()"
            [datasets]="incomesBySourceDatasets()"
            [title]="'Ingresos por Fuente'"
            [height]="350"
            [horizontal]="false"
            [noDataTitle]="'Sin ingresos registrados'"
            [noDataMessage]="
              'Agrega ingresos para ver la distribución por fuentes'
            "
          >
          </app-bar-chart>
        </div>

        <!-- Comparación mensual ingresos vs gastos -->
        <div
          class="col-span-1 xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <app-bar-chart
            [labels]="monthlyComparisonLabels()"
            [datasets]="monthlyComparisonDatasets()"
            [title]="'Comparación Mensual: Ingresos vs Gastos'"
            [height]="400"
            [stacked]="false"
            [noDataTitle]="'Sin datos mensuales'"
            [noDataMessage]="
              'Se necesitan al menos 2 meses de datos para mostrar la comparación'
            "
          >
          </app-bar-chart>
        </div>

        <!-- Tendencia del balance -->
        <div
          class="col-span-1 xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <app-line-chart
            [labels]="balanceTrendLabels()"
            [datasets]="balanceTrendDatasets()"
            [title]="'Evolución del Balance Financiero'"
            [height]="400"
            [showControls]="true"
            [showSummary]="true"
            [noDataTitle]="'Sin historial de balance'"
            [noDataMessage]="
              'Necesitas al menos 3 meses de datos para ver la tendencia'
            "
          >
          </app-line-chart>
        </div>
      </div>

      <!-- Estadísticas adicionales -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h5 class="text-sm font-semibold text-gray-600 mb-3 mt-0">
              🎯 Categoría con Mayor Gasto
            </h5>
            @if (topExpenseCategory(); as topCategory) {
            <div class="flex flex-col gap-1">
              <span class="text-xl font-bold text-gray-800">{{
                topCategory.name
              }}</span>
              <span class="text-sm text-gray-500">
                {{ topCategory.amount | currency : 'EUR' : 'symbol' : '1.0-0' }}
                ({{ topCategory.percentage.toFixed(1) }}%)
              </span>
            </div>
            } @else {
            <div class="flex flex-col gap-1">
              <span class="text-xl font-bold text-gray-800">No hay datos</span>
            </div>
            }
          </div>

          <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h5 class="text-sm font-semibold text-gray-600 mb-3 mt-0">
              💼 Fuente Principal de Ingresos
            </h5>
            @if (topIncomeSource(); as topSource) {
            <div class="flex flex-col gap-1">
              <span class="text-xl font-bold text-gray-800">{{
                topSource.name
              }}</span>
              <span class="text-sm text-gray-500">
                {{ topSource.amount | currency : 'EUR' : 'symbol' : '1.0-0' }}
                ({{ topSource.percentage.toFixed(1) }}%)
              </span>
            </div>
            } @else {
            <div class="flex flex-col gap-1">
              <span class="text-xl font-bold text-gray-800">No hay datos</span>
            </div>
            }
          </div>

          <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h5 class="text-sm font-semibold text-gray-600 mb-3 mt-0">
              📅 Días con Gastos
            </h5>
            <div class="flex flex-col gap-1">
              <span class="text-xl font-bold text-gray-800">{{
                daysWithExpenses()
              }}</span>
              <span class="text-sm text-gray-500"
                >de {{ daysInCurrentMonth() }} días</span
              >
            </div>
          </div>

          <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h5 class="text-sm font-semibold text-gray-600 mb-3 mt-0">
              🔄 Tasa de Ahorro
            </h5>
            <div class="flex flex-col gap-1">
              <span class="text-xl font-bold" [class]="getSavingsRateClass()">
                {{ savingsRate().toFixed(1) }}%
              </span>
              <span class="text-sm text-gray-500">del ingreso total</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class StatsComponent {
  private state = inject(StateService);
  private chartService = inject(ChartService);

  currentFilters: ChartFilters | null = null;

  monthlyStats = computed(() => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthlyIncomes = this.state
      .incomes()
      .filter((i) => i.date.startsWith(currentMonth));
    const monthlyExpenses = this.state
      .expenses()
      .filter((e) => e.date.startsWith(currentMonth));

    const totalIncomes = monthlyIncomes.reduce(
      (sum, i) => sum + (i.amount || 0),
      0
    );
    const totalExpenses = monthlyExpenses.reduce(
      (sum, e) => sum + (e.amount || 0),
      0
    );

    return {
      totalIncomes,
      totalExpenses,
      balance: totalIncomes - totalExpenses,
    };
  });

  averageDailyExpense = computed(() => {
    const expenses = this.state.expenses();
    if (expenses.length === 0) return 0;

    const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const uniqueDays = new Set(expenses.map((e) => e.date.split('T')[0])).size;

    return uniqueDays > 0 ? total / uniqueDays : 0;
  });

  expensesByCategory = computed(() => {
    const expenses = this.state.expenses();
    const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    if (total === 0) return [];

    const categories = expenses.reduce((acc, expense) => {
      const cat = expense.category || 'Sin categoría';
      acc[cat] = (acc[cat] || 0) + (expense.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categories)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: (amount / total) * 100,
      }))
      .sort((a, b) => b.amount - a.amount);
  });

  incomesBySource = computed(() => {
    const incomes = this.state.incomes();
    const total = incomes.reduce((sum, i) => sum + (i.amount || 0), 0);

    if (total === 0) return [];

    const sources = incomes.reduce((acc, income) => {
      const source = income.source || 'Ingreso general';
      acc[source] = (acc[source] || 0) + (income.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(sources)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: (amount / total) * 100,
      }))
      .sort((a, b) => b.amount - a.amount);
  });

  lastMonthsData = computed(() => {
    const months = [];
    const now = new Date();

    for (let i = 2; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toISOString().slice(0, 7);
      const monthName = date.toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric',
      });

      const monthIncomes = this.state
        .incomes()
        .filter((i) => i.date.startsWith(monthStr))
        .reduce((sum, i) => sum + (i.amount || 0), 0);

      const monthExpenses = this.state
        .expenses()
        .filter((e) => e.date.startsWith(monthStr))
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      months.push({
        month: monthName,
        incomes: monthIncomes,
        expenses: monthExpenses,
        balance: monthIncomes - monthExpenses,
      });
    }

    return months;
  });

  // Métodos para los gráficos de Chart.js
  incomesBySourceLabels = computed(() => {
    return this.incomesBySource().map((source) => source.name);
  });

  incomesBySourceDatasets = computed((): BarChartDataset[] => {
    const data = this.incomesBySource().map((source) => source.amount);
    if (data.length === 0) return [];

    return [
      {
        label: 'Ingresos por fuente',
        data,
        backgroundColor: this.chartService.getIncomeColor() + '80',
        borderColor: this.chartService.getIncomeColor(),
      },
    ];
  });

  monthlyComparisonLabels = computed(() => {
    return this.lastMonthsData().map((month) => month.month);
  });

  monthlyComparisonDatasets = computed((): BarChartDataset[] => {
    const monthsData = this.lastMonthsData();
    if (monthsData.length === 0) return [];

    return [
      {
        label: 'Ingresos',
        data: monthsData.map((month) => month.incomes),
        backgroundColor: this.chartService.getIncomeColor() + '80',
        borderColor: this.chartService.getIncomeColor(),
      },
      {
        label: 'Gastos',
        data: monthsData.map((month) => month.expenses),
        backgroundColor: this.chartService.getExpenseColor() + '80',
        borderColor: this.chartService.getExpenseColor(),
      },
    ];
  });

  balanceTrendLabels = computed(() => {
    return this.lastMonthsData().map((month) => month.month);
  });

  balanceTrendDatasets = computed((): LineChartDataset[] => {
    const monthsData = this.lastMonthsData();
    if (monthsData.length === 0) return [];

    return [
      {
        label: 'Balance',
        data: monthsData.map((month) => month.balance),
        borderColor: this.chartService.getBalanceColor(),
        backgroundColor: this.chartService.getBalanceColor() + '20',
        fill: true,
        tension: 0.4,
      },
    ];
  });

  topExpenseCategory = computed(() => {
    const categories = this.expensesByCategory();
    return categories.length > 0 ? categories[0] : null;
  });

  topIncomeSource = computed(() => {
    const sources = this.incomesBySource();
    return sources.length > 0 ? sources[0] : null;
  });

  daysWithExpenses = computed(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyExpenses = this.state
      .expenses()
      .filter((e) => e.date.startsWith(currentMonth));

    const uniqueDays = new Set(
      monthlyExpenses.map((expense) => expense.date.split('T')[0])
    );

    return uniqueDays.size;
  });

  daysInCurrentMonth = computed(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  });

  savingsRate = computed(() => {
    const stats = this.monthlyStats();
    if (stats.totalIncomes === 0) return 0;
    return (stats.balance / stats.totalIncomes) * 100;
  });

  getSavingsRateClass(): string {
    const rate = this.savingsRate();
    if (rate >= 20) return 'text-green-600';
    if (rate >= 10) return 'text-yellow-600';
    return 'text-red-600';
  }

  // Métodos para filtros
  getAvailableCategories(): string[] {
    const expenses = this.state.expenses();
    const categories = [
      ...new Set(expenses.map((e) => e.category).filter(Boolean)),
    ];
    return categories.sort();
  }

  getAvailableSources(): string[] {
    const incomes = this.state.incomes();
    const sources = [
      ...new Set(incomes.map((i) => i.source).filter(Boolean) as string[]),
    ];
    return sources.sort();
  }

  onFiltersChange(filters: ChartFilters): void {
    this.currentFilters = filters;
    // Aquí se pueden aplicar los filtros a los datos
    // Por ahora solo los almacenamos
  }

  getCategoryColor(category: string): string {
    const colors = [
      '#ef4444',
      '#f97316',
      '#f59e0b',
      '#eab308',
      '#84cc16',
      '#22c55e',
      '#10b981',
      '#14b8a6',
      '#06b6d4',
      '#0ea5e9',
      '#3b82f6',
      '#6366f1',
      '#8b5cf6',
      '#a855f7',
      '#d946ef',
      '#ec4899',
      '#f43f5e',
    ];

    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }
}
