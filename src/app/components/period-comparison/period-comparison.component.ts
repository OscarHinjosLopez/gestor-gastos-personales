import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PeriodComparisonService } from '../../core/period-comparison.service';
import { LoadingService } from '../../core/loading.service';
import { NotificationService } from '../../core/notification.service';
import { ExportService } from '../../core/export.service';
import { StateService } from '../../core/state.service';
import { TestChartComponent } from '../charts/test-chart.component';
import { ComparisonFiltersComponent } from './comparison-filters.component';
import { TrendAnalysisComponent } from './trend-analysis.component';
import {
  DateRange,
  PeriodComparison,
  ComparisonFilter,
  PERIOD_PRESETS,
  PeriodPreset,
  ComparisonInsight,
} from '../../models/period-comparison.model';

@Component({
  selector: 'app-period-comparison',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    TestChartComponent,
    TrendAnalysisComponent,
  ],
  template: `
    <div class="max-w-7xl mx-auto p-6 space-y-6">
      <!-- Header mejorado -->
      <div
        class="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="text-4xl">📊</div>
            <div>
              <h1 class="text-2xl font-bold">Comparar Períodos</h1>
              <p class="text-purple-100">
                Descubre cómo han evolucionado tus finanzas
              </p>
            </div>
          </div>
          @if (currentComparison()) {
          <div
            class="hidden md:flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2"
          >
            <span class="text-sm">{{ getComparisonSummary() }}</span>
          </div>
          }
        </div>
      </div>

      <!-- Estado condicional -->
      @if (isLoading()) {
      <!-- Estado de carga -->
      <div
        class="bg-white rounded-2xl p-12 shadow-sm border border-gray-200 text-center"
      >
        <div
          class="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
        ></div>
        <h3 class="text-lg font-semibold text-gray-800 mb-2">
          Analizando tus datos...
        </h3>
        <p class="text-gray-600">Esto solo tomará unos segundos</p>
      </div>
      } @else if (currentComparison()) {
      <!-- Vista de resultados -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <button
              (click)="goBackToSelection()"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Cambiar períodos"
            >
              ← Cambiar períodos
            </button>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">Comparando:</span>
            <span class="font-medium text-gray-800">{{
              getPeriod1Label()
            }}</span>
            <span class="text-gray-400">vs</span>
            <span class="font-medium text-gray-800">{{
              getPeriod2Label()
            }}</span>
          </div>
        </div>

        <!-- Métricas de resumen -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <!-- Balance -->
          <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div class="flex items-center justify-between mb-4">
              <div class="text-sm font-medium text-gray-600">Balance</div>
              <div class="text-2xl">�</div>
            </div>
            <div class="space-y-2">
              <div class="text-2xl font-bold text-blue-600">
                {{ getBalanceValue1() | currency : 'EUR' : 'symbol' : '1.0-0' }}
              </div>
              <div class="text-sm text-gray-500">
                vs
                {{ getBalanceValue2() | currency : 'EUR' : 'symbol' : '1.0-0' }}
              </div>
              <div class="text-sm" [class]="getBalanceChangeClass()">
                {{ getBalanceChangeText() }}
              </div>
            </div>
          </div>

          <!-- Ingresos -->
          <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div class="flex items-center justify-between mb-4">
              <div class="text-sm font-medium text-gray-600">Ingresos</div>
              <div class="text-2xl">📈</div>
            </div>
            <div class="space-y-2">
              <div class="text-2xl font-bold text-green-600">
                {{ getIncomeValue1() | currency : 'EUR' : 'symbol' : '1.0-0' }}
              </div>
              <div class="text-sm text-gray-500">
                vs
                {{ getIncomeValue2() | currency : 'EUR' : 'symbol' : '1.0-0' }}
              </div>
              <div class="text-sm" [class]="getIncomeChangeClass()">
                {{ getIncomeChangeText() }}
              </div>
            </div>
          </div>

          <!-- Gastos -->
          <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div class="flex items-center justify-between mb-4">
              <div class="text-sm font-medium text-gray-600">Gastos</div>
              <div class="text-2xl">📉</div>
            </div>
            <div class="space-y-2">
              <div class="text-2xl font-bold text-red-600">
                {{ getExpenseValue1() | currency : 'EUR' : 'symbol' : '1.0-0' }}
              </div>
              <div class="text-sm text-gray-500">
                vs
                {{ getExpenseValue2() | currency : 'EUR' : 'symbol' : '1.0-0' }}
              </div>
              <div class="text-sm" [class]="getExpenseChangeClass()">
                {{ getExpenseChangeText() }}
              </div>
            </div>
          </div>
        </div>

        <!-- Gráficos de comparación -->
        <div class="space-y-8">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <app-test-chart
              [title]="'Comparación de Balance'"
              [icon]="'💰'"
              [value1]="getBalanceValue1()"
              [value2]="getBalanceValue2()"
              [label1]="getPeriod1Label()"
              [label2]="getPeriod2Label()"
              [color]="'#10B981'"
              [showSummary]="true"
              [chartId]="'balance-chart'"
            ></app-test-chart>

            <app-test-chart
              [title]="'Comparación de Ingresos'"
              [icon]="'📈'"
              [value1]="getIncomeValue1()"
              [value2]="getIncomeValue2()"
              [label1]="getPeriod1Label()"
              [label2]="getPeriod2Label()"
              [color]="'#3B82F6'"
              [showSummary]="true"
              [chartId]="'income-chart'"
            ></app-test-chart>
          </div>

          <div class="w-full">
            <app-test-chart
              [title]="'Comparación de Gastos'"
              [icon]="'📉'"
              [value1]="getExpenseValue1()"
              [value2]="getExpenseValue2()"
              [label1]="getPeriod1Label()"
              [label2]="getPeriod2Label()"
              [color]="'#EF4444'"
              [showSummary]="true"
              [chartId]="'expense-chart'"
            ></app-test-chart>
          </div>
        </div>

        <!-- Análisis de tendencias -->
        <app-trend-analysis
          [comparison]="currentComparison()!"
        ></app-trend-analysis>

        <!-- Botones de acción -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-800">Acciones</h3>
            <div class="flex items-center gap-4">
              <button
                (click)="exportComparison()"
                class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <span>📊</span>
                Exportar
              </button>
              <button
                (click)="copyToClipboard()"
                class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>📋</span>
                Copiar
              </button>
            </div>
          </div>
        </div>
      </div>
      } @else {
      <!-- Estado inicial mejorado -->
      <div class="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
        <div class="text-center mb-8">
          <div class="text-6xl mb-4">🔍</div>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">
            ¿Qué quieres comparar?
          </h2>
          <p class="text-gray-600 max-w-md mx-auto">
            Selecciona dos períodos para ver cómo han cambiado tus ingresos,
            gastos y ahorros
          </p>
        </div>

        <!-- Comparaciones rápidas más visuales -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          @for (preset of getPopularPresets(); track preset.id) {
          <button
            (click)="selectPreset(preset)"
            class="p-6 text-left border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 group"
          >
            <div class="text-2xl mb-2">{{ getPresetIcon(preset.id) }}</div>
            <div
              class="font-semibold text-gray-800 group-hover:text-purple-700"
            >
              {{ preset.label }}
            </div>
            <div class="text-sm text-gray-600 mt-1">
              {{ preset.description }}
            </div>
            <div
              class="text-xs text-purple-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              👆 Click para comparar
            </div>
          </button>
          }
        </div>

        <!-- Sección fechas personalizadas colapsable -->
        <div class="border-t pt-8">
          <button
            (click)="toggleCustomDates()"
            class="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div class="flex items-center gap-3">
              <span class="text-xl">�</span>
              <div class="text-left">
                <div class="font-medium text-gray-800">
                  Fechas Personalizadas
                </div>
                <div class="text-sm text-gray-600">
                  Elige exactamente qué períodos comparar
                </div>
              </div>
            </div>
            <div
              class="text-gray-400 transition-transform duration-200"
              [class.rotate-180]="showCustomDates()"
            >
              ▼
            </div>
          </button>

          @if (showCustomDates()) {
          <div class="mt-6 bg-gray-50 rounded-lg p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <!-- Período 1 -->
              <div class="bg-white rounded-lg p-4 border-2 border-blue-200">
                <h4
                  class="font-medium text-blue-800 mb-4 flex items-center gap-2"
                >
                  <span class="text-xl">📅</span>
                  Primer Período
                </h4>
                <div class="space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"
                      >Desde</label
                    >
                    <input
                      type="date"
                      [(ngModel)]="customPeriod1().start"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"
                      >Hasta</label
                    >
                    <input
                      type="date"
                      [(ngModel)]="customPeriod1().end"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <!-- Período 2 -->
              <div class="bg-white rounded-lg p-4 border-2 border-orange-200">
                <h4
                  class="font-medium text-orange-800 mb-4 flex items-center gap-2"
                >
                  <span class="text-xl">📅</span>
                  Segundo Período
                </h4>
                <div class="space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"
                      >Desde</label
                    >
                    <input
                      type="date"
                      [(ngModel)]="customPeriod2().start"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1"
                      >Hasta</label
                    >
                    <input
                      type="date"
                      [(ngModel)]="customPeriod2().end"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-6 text-center">
              <button
                (click)="compareCustomPeriods()"
                [disabled]="!isCustomPeriodValid() || isLoading()"
                class="bg-purple-600 text-white px-8 py-3 rounded-xl font-medium transition-colors hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                @if (isLoading()) {
                <span class="flex items-center justify-center gap-2">
                  <div
                    class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                  ></div>
                  Comparando...
                </span>
                } @else {
                <span class="flex items-center justify-center gap-2">
                  <span>🔍</span>
                  Comparar Períodos
                </span>
                }
              </button>
            </div>
          </div>
          }
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .animate-spin {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class PeriodComparisonComponent implements OnInit {
  private comparisonService = inject(PeriodComparisonService);
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);
  private exportService = inject(ExportService);
  private stateService = inject(StateService);
  private platformId = inject(PLATFORM_ID);

  // Signals for reactive state
  selectedPreset = signal<PeriodPreset | null>(null);
  customPeriod1 = signal<DateRange>({ start: '', end: '', label: 'Período 1' });
  customPeriod2 = signal<DateRange>({ start: '', end: '', label: 'Período 2' });
  showCustomDates = signal<boolean>(false);

  // Computed properties
  currentComparison = this.comparisonService.currentComparison;
  currentFilter = this.comparisonService.currentFilter;
  isLoading = this.comparisonService.isLoading;
  periodPresets = PERIOD_PRESETS;

  isCustomPeriodValid = computed(() => {
    const p1 = this.customPeriod1();
    const p2 = this.customPeriod2();
    return (
      p1.start &&
      p1.end &&
      p2.start &&
      p2.end &&
      p1.start <= p1.end &&
      p2.start <= p2.end
    );
  });

  ngOnInit(): void {
    // Initialize with default dates
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toISOString()
      .split('T')[0];
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      .toISOString()
      .split('T')[0];

    this.customPeriod1.set({
      start: thisMonth,
      end: endOfMonth,
      label: 'Período 1',
    });
    this.customPeriod2.set({
      start: lastMonth,
      end: endOfLastMonth,
      label: 'Período 2',
    });

    // Auto-load a default comparison only in browser environment
    if (isPlatformBrowser(this.platformId)) {
      // Use setTimeout to ensure it runs after initialization
      setTimeout(() => this.loadDefaultComparison(), 0);
    }
  }

  debugComparison(): void {
    console.log('🔍 DEBUG: Current state', {
      hasComparison: !!this.currentComparison(),
      comparison: this.currentComparison(),
      expenses: this.stateService.expenses().length,
      incomes: this.stateService.incomes().length,
      selectedPreset: this.selectedPreset(),
      customPeriod1: this.customPeriod1(),
      customPeriod2: this.customPeriod2(),
    });

    const comp = this.currentComparison();
    if (comp) {
      console.log('🔍 DEBUG: Comparison details', {
        period1: {
          range: comp.period1.range,
          data: comp.period1.data,
        },
        period2: {
          range: comp.period2.range,
          data: comp.period2.data,
        },
        metrics: comp.metrics,
        insights: comp.insights,
      });
    }
  }

  async forceDataReload(): Promise<void> {
    try {
      // Clear existing flag
      if (isPlatformBrowser(this.platformId)) {
        localStorage.removeItem('sample-data-added');
      }

      // Clear existing data by deleting all items
      const expenses = this.stateService.expenses();
      const incomes = this.stateService.incomes();

      // Delete all expenses
      for (const expense of expenses) {
        await this.stateService.deleteExpense(expense.id);
      }

      // Delete all incomes
      for (const income of incomes) {
        await this.stateService.deleteIncome(income.id);
      }

      // Add fresh sample data
      await this.addSampleData();

      // Set flag
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('sample-data-added', 'true');
      }

      // Load default comparison
      const defaultPreset = this.periodPresets.find(
        (p) => p.id === 'this-vs-last-month'
      );
      if (defaultPreset) {
        await this.selectPreset(defaultPreset);
      }

      // Removed success notification - not critical
    } catch (error) {
      this.notificationService.error('Error al recargar los datos');
      console.error('Error reloading data:', error);
    }
  }

  async loadDefaultComparison(): Promise<void> {
    // Check if we have any data
    const hasExpenses = this.stateService.expenses().length > 0;
    const hasIncomes = this.stateService.incomes().length > 0;

    // Only add sample data once - check if we're in browser first
    const hasAddedSampleData = isPlatformBrowser(this.platformId)
      ? localStorage.getItem('sample-data-added') === 'true'
      : false;

    if (!hasExpenses && !hasIncomes && !hasAddedSampleData) {
      // Add some sample data for demonstration
      await this.addSampleData();

      // Set flag only in browser
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('sample-data-added', 'true');
      }
    }

    // Try "Este mes vs Mes pasado" by default
    const defaultPreset = this.periodPresets.find(
      (p) => p.id === 'this-vs-last-month'
    );
    if (defaultPreset) {
      await this.selectPreset(defaultPreset);
    }
  }

  private async addSampleData(): Promise<void> {
    try {
      const now = new Date();
      const thisMonth = now.getMonth();
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const year = thisMonth === 0 ? now.getFullYear() - 1 : now.getFullYear();

      // Sample expenses for this month (más variados)
      const thisMonthExpenses = [
        {
          amount: 150,
          category: 'Alimentación',
          notes: 'Supermercado Carrefour',
          date: new Date(now.getFullYear(), thisMonth, 5)
            .toISOString()
            .split('T')[0],
        },
        {
          amount: 80,
          category: 'Transporte',
          notes: 'Gasolina BP',
          date: new Date(now.getFullYear(), thisMonth, 10)
            .toISOString()
            .split('T')[0],
        },
        {
          amount: 45,
          category: 'Entretenimiento',
          notes: 'Cine Kinépolis',
          date: new Date(now.getFullYear(), thisMonth, 15)
            .toISOString()
            .split('T')[0],
        },
        {
          amount: 200,
          category: 'Servicios',
          notes: 'Factura electricidad',
          date: new Date(now.getFullYear(), thisMonth, 20)
            .toISOString()
            .split('T')[0],
        },
        {
          amount: 120,
          category: 'Alimentación',
          notes: 'Compra semanal Mercadona',
          date: new Date(now.getFullYear(), thisMonth, 12)
            .toISOString()
            .split('T')[0],
        },
        {
          amount: 35,
          category: 'Entretenimiento',
          notes: 'Netflix mensual',
          date: new Date(now.getFullYear(), thisMonth, 1)
            .toISOString()
            .split('T')[0],
        },
        {
          amount: 75,
          category: 'Servicios',
          notes: 'Internet Movistar',
          date: new Date(now.getFullYear(), thisMonth, 3)
            .toISOString()
            .split('T')[0],
        },
        {
          amount: 60,
          category: 'Transporte',
          notes: 'Abono transporte público',
          date: new Date(now.getFullYear(), thisMonth, 1)
            .toISOString()
            .split('T')[0],
        },
      ];

      // Sample expenses for last month (diferentes cantidades para comparación)
      const lastMonthExpenses = [
        {
          amount: 180,
          category: 'Alimentación',
          notes: 'Supermercado Carrefour',
          date: new Date(year, lastMonth, 5).toISOString().split('T')[0],
        },
        {
          amount: 85,
          category: 'Transporte',
          notes: 'Gasolina Repsol',
          date: new Date(year, lastMonth, 10).toISOString().split('T')[0],
        },
        {
          amount: 60,
          category: 'Entretenimiento',
          notes: 'Cena restaurante',
          date: new Date(year, lastMonth, 15).toISOString().split('T')[0],
        },
        {
          amount: 180,
          category: 'Servicios',
          notes: 'Factura electricidad',
          date: new Date(year, lastMonth, 20).toISOString().split('T')[0],
        },
        {
          amount: 100,
          category: 'Alimentación',
          notes: 'Compra semanal',
          date: new Date(year, lastMonth, 12).toISOString().split('T')[0],
        },
        {
          amount: 35,
          category: 'Entretenimiento',
          notes: 'Netflix mensual',
          date: new Date(year, lastMonth, 1).toISOString().split('T')[0],
        },
        {
          amount: 75,
          category: 'Servicios',
          notes: 'Internet Movistar',
          date: new Date(year, lastMonth, 3).toISOString().split('T')[0],
        },
        {
          amount: 250,
          category: 'Ropa',
          notes: 'Compras Zara',
          date: new Date(year, lastMonth, 18).toISOString().split('T')[0],
        },
      ];

      // Sample incomes for this month
      const thisMonthIncomes = [
        {
          amount: 2500,
          source: 'Salario',
          notes: 'Salario mensual neto',
          date: new Date(now.getFullYear(), thisMonth, 1)
            .toISOString()
            .split('T')[0],
        },
        {
          amount: 300,
          source: 'Freelance',
          notes: 'Proyecto desarrollo web',
          date: new Date(now.getFullYear(), thisMonth, 15)
            .toISOString()
            .split('T')[0],
        },
        {
          amount: 50,
          source: 'Inversiones',
          notes: 'Dividendos acciones',
          date: new Date(now.getFullYear(), thisMonth, 10)
            .toISOString()
            .split('T')[0],
        },
      ];

      // Sample incomes for last month
      const lastMonthIncomes = [
        {
          amount: 2500,
          source: 'Salario',
          notes: 'Salario mensual neto',
          date: new Date(year, lastMonth, 1).toISOString().split('T')[0],
        },
        {
          amount: 200,
          source: 'Freelance',
          notes: 'Consultoría técnica',
          date: new Date(year, lastMonth, 15).toISOString().split('T')[0],
        },
        {
          amount: 25,
          source: 'Inversiones',
          notes: 'Dividendos acciones',
          date: new Date(year, lastMonth, 10).toISOString().split('T')[0],
        },
        {
          amount: 100,
          source: 'Venta',
          notes: 'Venta artículos usados',
          date: new Date(year, lastMonth, 20).toISOString().split('T')[0],
        },
      ];

      // Add sample data
      for (const expense of [...thisMonthExpenses, ...lastMonthExpenses]) {
        await this.stateService.addExpense(expense);
      }

      for (const income of [...thisMonthIncomes, ...lastMonthIncomes]) {
        await this.stateService.addIncome(income);
      }

      this.notificationService.info(
        'Se han agregado datos de ejemplo para la demostración (16 gastos y 7 ingresos)'
      );
    } catch (error) {
      console.error('Error adding sample data:', error);
      this.notificationService.error('Error al agregar datos de ejemplo');
    }
  }

  async selectPreset(preset: PeriodPreset): Promise<void> {
    this.selectedPreset.set(preset);

    try {
      const periods = preset.getPeriods();
      await this.comparisonService.comparePeriods(
        periods.period1,
        periods.period2
      );
      // Removed success notification - not critical
    } catch (error) {
      this.notificationService.error('Error al generar la comparación');
      console.error('Error comparing periods:', error);
    }
  }

  async compareCustomPeriods(): Promise<void> {
    if (!this.isCustomPeriodValid()) return;

    this.selectedPreset.set(null);

    try {
      await this.comparisonService.comparePeriods(
        this.customPeriod1(),
        this.customPeriod2()
      );
      // Removed success notification - not critical
    } catch (error) {
      this.notificationService.error(
        'Error al generar la comparación personalizada'
      );
      console.error('Error comparing custom periods:', error);
    }
  }

  async onFiltersChange(filters: ComparisonFilter): Promise<void> {
    try {
      this.comparisonService.updateFilter(filters);

      // Re-run comparison with new filters if we have periods selected
      const comparison = this.currentComparison();
      if (comparison) {
        await this.comparisonService.comparePeriods(
          comparison.period1.range,
          comparison.period2.range,
          filters
        );
        // Removed success notification - not critical
      }
    } catch (error) {
      this.notificationService.error('Error al aplicar los filtros');
      console.error('Error applying filters:', error);
    }
  }

  // Utility methods for template
  formatDateRange(range: DateRange): string {
    const start = new Date(range.start);
    const end = new Date(range.end);
    return `${start.toLocaleDateString('es-ES')} - ${end.toLocaleDateString(
      'es-ES'
    )}`;
  }

  getComparisonSummary(): string {
    const comparison = this.currentComparison();
    if (!comparison) return '';

    const balanceDelta = comparison.metrics.balanceDelta;
    if (balanceDelta.trend === 'up') return 'Mejora';
    if (balanceDelta.trend === 'down') return 'Empeora';
    return 'Estable';
  }

  getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
    switch (trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      default:
        return '➖';
    }
  }

  getMetricTrendClass(
    trend: 'up' | 'down' | 'stable',
    isExpense = false
  ): string {
    const baseClass = 'text-lg';
    if (trend === 'stable') return `${baseClass} text-gray-400`;

    // For expenses, up is bad (red), down is good (green)
    if (isExpense) {
      return trend === 'up'
        ? `${baseClass} text-red-500`
        : `${baseClass} text-green-500`;
    }

    // For income/balance, up is good (green), down is bad (red)
    return trend === 'up'
      ? `${baseClass} text-green-500`
      : `${baseClass} text-red-500`;
  }

  getPercentageClass(percentage: number, isExpense = false): string {
    if (Math.abs(percentage) < 1) return 'text-gray-600';

    if (isExpense) {
      return percentage > 0 ? 'text-red-600' : 'text-green-600';
    }

    return percentage > 0 ? 'text-green-600' : 'text-red-600';
  }

  getBalanceClass(balance: number): string {
    if (balance > 0) return 'text-green-600';
    if (balance < 0) return 'text-red-600';
    return 'text-gray-600';
  }

  getSavingsRateClass(rate: number): string {
    if (rate >= 20) return 'text-green-600';
    if (rate >= 10) return 'text-yellow-600';
    if (rate >= 0) return 'text-orange-600';
    return 'text-red-600';
  }

  getInsightClass(insight: ComparisonInsight): string {
    const baseClass = 'bg-opacity-10';
    switch (insight.type) {
      case 'positive':
        return `${baseClass} bg-green-500 border-green-500`;
      case 'negative':
        return `${baseClass} bg-red-500 border-red-500`;
      case 'warning':
        return `${baseClass} bg-yellow-500 border-yellow-500`;
      default:
        return `${baseClass} bg-blue-500 border-blue-500`;
    }
  }

  getInsightIcon(type: string): string {
    switch (type) {
      case 'positive':
        return '✅';
      case 'negative':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  }

  // Export methods
  exportToCSV(): void {
    const comparison = this.currentComparison();
    if (!comparison) {
      this.notificationService.error(
        'No hay datos de comparación para exportar'
      );
      return;
    }

    try {
      this.exportService.exportComparisonToCSV(comparison);
      // Removed success notification - not critical
    } catch (error) {
      this.notificationService.error('Error al exportar a CSV');
      console.error('Export CSV error:', error);
    }
  }

  exportToPDF(): void {
    const comparison = this.currentComparison();
    if (!comparison) {
      this.notificationService.error(
        'No hay datos de comparación para exportar'
      );
      return;
    }

    try {
      this.exportService.exportComparisonToPDF(comparison);
      // Removed success notification - not critical
    } catch (error) {
      this.notificationService.error('Error al generar PDF');
      console.error('Export PDF error:', error);
    }
  }

  async copyToClipboard(): Promise<void> {
    const comparison = this.currentComparison();
    if (!comparison) {
      this.notificationService.error('No hay datos de comparación para copiar');
      return;
    }

    try {
      const success = await this.exportService.copyComparisonToClipboard(
        comparison
      );
      if (success) {
        this.notificationService.success('Resumen copiado al portapapeles');
      } else {
        this.notificationService.error('Error al copiar al portapapeles');
      }
    } catch (error) {
      this.notificationService.error('Error al copiar al portapapeles');
      console.error('Copy to clipboard error:', error);
    }
  }

  // Helper methods for chart data binding
  getBalanceValue1(): number {
    return this.currentComparison()?.period1?.data?.balance || 0;
  }

  getBalanceValue2(): number {
    return this.currentComparison()?.period2?.data?.balance || 0;
  }

  getIncomeValue1(): number {
    return this.currentComparison()?.period1?.data?.totalIncomes || 0;
  }

  getIncomeValue2(): number {
    return this.currentComparison()?.period2?.data?.totalIncomes || 0;
  }

  getExpenseValue1(): number {
    return this.currentComparison()?.period1?.data?.totalExpenses || 0;
  }

  getExpenseValue2(): number {
    return this.currentComparison()?.period2?.data?.totalExpenses || 0;
  }

  getPeriod1Label(): string {
    return (
      this.currentComparison()?.period1?.range?.label || 'Período Anterior'
    );
  }

  getPeriod2Label(): string {
    return this.currentComparison()?.period2?.range?.label || 'Período Actual';
  }

  // Nuevos métodos para la interfaz mejorada
  getPopularPresets(): PeriodPreset[] {
    return this.periodPresets.slice(0, 6); // Los 6 primeros presets más comunes
  }

  getPresetIcon(presetId: string): string {
    const icons: { [key: string]: string } = {
      'current-vs-last-month': '📅',
      'current-vs-last-year': '🗓️',
      'current-quarter-vs-last': '📊',
      'last-3-vs-3-before': '📈',
      'current-vs-last-semester': '📋',
      'ytd-vs-ytd': '🎯',
    };
    return icons[presetId] || '📊';
  }

  toggleCustomDates(): void {
    this.showCustomDates.set(!this.showCustomDates());
  }

  goBackToSelection(): void {
    // Limpiar la comparación actual para volver al estado de selección
    this.comparisonService.clearComparison();
    this.selectedPreset.set(null);
    this.showCustomDates.set(false);
  }

  // Métodos para mostrar cambios de forma simple
  getBalanceChangeClass(): string {
    const current = this.getBalanceValue1();
    const previous = this.getBalanceValue2();
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-gray-600';
  }

  getBalanceChangeText(): string {
    const current = this.getBalanceValue1();
    const previous = this.getBalanceValue2();
    const diff = current - previous;
    const percentage = previous !== 0 ? Math.abs((diff / previous) * 100) : 0;

    if (diff > 0) {
      return `+${Math.abs(diff).toFixed(0)}€ (+${percentage.toFixed(1)}%)`;
    } else if (diff < 0) {
      return `-${Math.abs(diff).toFixed(0)}€ (-${percentage.toFixed(1)}%)`;
    }
    return 'Sin cambios';
  }

  getIncomeChangeClass(): string {
    const current = this.getIncomeValue1();
    const previous = this.getIncomeValue2();
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-gray-600';
  }

  getIncomeChangeText(): string {
    const current = this.getIncomeValue1();
    const previous = this.getIncomeValue2();
    const diff = current - previous;
    const percentage = previous !== 0 ? Math.abs((diff / previous) * 100) : 0;

    if (diff > 0) {
      return `+${Math.abs(diff).toFixed(0)}€ (+${percentage.toFixed(1)}%)`;
    } else if (diff < 0) {
      return `-${Math.abs(diff).toFixed(0)}€ (-${percentage.toFixed(1)}%)`;
    }
    return 'Sin cambios';
  }

  getExpenseChangeClass(): string {
    const current = this.getExpenseValue1();
    const previous = this.getExpenseValue2();
    // Para gastos, menos gastos es mejor (verde), más gastos es peor (rojo)
    if (current < previous) return 'text-green-600';
    if (current > previous) return 'text-red-600';
    return 'text-gray-600';
  }

  getExpenseChangeText(): string {
    const current = this.getExpenseValue1();
    const previous = this.getExpenseValue2();
    const diff = current - previous;
    const percentage = previous !== 0 ? Math.abs((diff / previous) * 100) : 0;

    if (diff > 0) {
      return `+${Math.abs(diff).toFixed(0)}€ (+${percentage.toFixed(1)}%)`;
    } else if (diff < 0) {
      return `-${Math.abs(diff).toFixed(0)}€ (-${percentage.toFixed(1)}%)`;
    }
    return 'Sin cambios';
  }

  exportComparison(): void {
    const comparison = this.currentComparison();
    if (!comparison) return;

    try {
      this.exportService.exportComparisonToCSV(comparison);
      this.notificationService.success(
        'Comparación exportada a CSV correctamente'
      );
    } catch (error) {
      this.notificationService.error('Error al exportar la comparación');
    }
  }
}
