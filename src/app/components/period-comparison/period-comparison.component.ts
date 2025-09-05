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
import { BasicChartComponent } from '../charts/basic-chart.component';
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
    BasicChartComponent,
    ComparisonFiltersComponent,
    TrendAnalysisComponent,
  ],
  template: `
    <div class="max-w-7xl mx-auto p-6 space-y-8">
      <!-- Header -->
      <div
        class="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white"
      >
        <div class="flex items-center gap-4 mb-4">
          <div class="text-5xl">📊</div>
          <div>
            <h1 class="text-3xl font-bold">Comparación de Períodos</h1>
            <p class="text-purple-100 text-lg">
              Analiza y compara tus finanzas entre diferentes períodos de tiempo
            </p>
          </div>
        </div>

        @if (currentComparison()) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div class="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div class="text-sm text-purple-100">Período 1</div>
            <div class="font-semibold">
              {{
                currentComparison()!.period1.range.label ||
                  formatDateRange(currentComparison()!.period1.range)
              }}
            </div>
          </div>
          <div class="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div class="text-sm text-purple-100">vs</div>
            <div class="font-semibold text-center">
              {{ getComparisonSummary() }}
            </div>
          </div>
          <div class="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div class="text-sm text-purple-100">Período 2</div>
            <div class="font-semibold">
              {{
                currentComparison()!.period2.range.label ||
                  formatDateRange(currentComparison()!.period2.range)
              }}
            </div>
          </div>
        </div>
        }
      </div>

      <!-- Period Selection -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h2
          class="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2"
        >
          <span class="text-2xl">⚙️</span>
          Configurar Comparación
        </h2>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Preset Selection -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-700">
              Comparaciones Predefinidas
            </h3>
            <div class="grid grid-cols-1 gap-3">
              @for (preset of periodPresets; track preset.id) {
              <button
                (click)="selectPreset(preset)"
                [disabled]="isLoading()"
                class="p-4 text-left border-2 rounded-lg transition-all duration-200 hover:border-purple-300 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
                [class.border-purple-500]="selectedPreset()?.id === preset.id"
                [class.bg-purple-50]="selectedPreset()?.id === preset.id"
                [class.border-gray-200]="selectedPreset()?.id !== preset.id"
              >
                <div class="font-medium text-gray-800">{{ preset.label }}</div>
                <div class="text-sm text-gray-600 mt-1">
                  {{ preset.description }}
                </div>
              </button>
              }
            </div>
          </div>

          <!-- Custom Date Selection -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-700">
              Fechas Personalizadas
            </h3>

            <!-- Period 1 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-600"
                >Período 1</label
              >
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-gray-500 mb-1"
                    >Fecha inicio</label
                  >
                  <input
                    type="date"
                    [(ngModel)]="customPeriod1().start"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1"
                    >Fecha fin</label
                  >
                  <input
                    type="date"
                    [(ngModel)]="customPeriod1().end"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <!-- Period 2 -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-600"
                >Período 2</label
              >
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-gray-500 mb-1"
                    >Fecha inicio</label
                  >
                  <input
                    type="date"
                    [(ngModel)]="customPeriod2().start"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1"
                    >Fecha fin</label
                  >
                  <input
                    type="date"
                    [(ngModel)]="customPeriod2().end"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <button
              (click)="compareCustomPeriods()"
              [disabled]="!isCustomPeriodValid() || isLoading()"
              class="w-full bg-purple-600 text-white px-4 py-3 rounded-lg font-medium transition-colors hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              @if (isLoading()) {
              <span class="flex items-center justify-center gap-2">
                <div
                  class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                ></div>
                Comparando...
              </span>
              } @else { Comparar Períodos Personalizados }
            </button>
          </div>
        </div>
      </div>

      @if (currentComparison()) {
      <!-- Advanced Filters -->
      <app-comparison-filters
        [initialFilters]="currentFilter()"
        (filtersChange)="onFiltersChange($event)"
      ></app-comparison-filters>
      } @if (currentComparison(); as comparison) {
      <!-- Key Metrics Comparison -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Balance -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <div class="text-sm font-medium text-gray-600">Balance</div>
            <div
              [class]="
                getMetricTrendClass(comparison.metrics.balanceDelta.trend)
              "
            >
              {{ getTrendIcon(comparison.metrics.balanceDelta.trend) }}
            </div>
          </div>
          <div class="space-y-2">
            <div
              class="text-2xl font-bold"
              [class]="getBalanceClass(comparison.period1.data.balance)"
            >
              {{
                comparison.period1.data.balance
                  | currency : 'EUR' : 'symbol' : '1.0-0'
              }}
            </div>
            <div class="text-sm text-gray-500">
              vs
              {{
                comparison.period2.data.balance
                  | currency : 'EUR' : 'symbol' : '1.0-0'
              }}
            </div>
            <div
              class="flex items-center gap-1 text-sm"
              [class]="
                getPercentageClass(comparison.metrics.balanceDelta.percentage)
              "
            >
              <span
                >{{ comparison.metrics.balanceDelta.percentage > 0 ? '+' : ''
                }}{{
                  comparison.metrics.balanceDelta.percentage | number : '1.1-1'
                }}%</span
              >
              <span class="text-gray-400"
                >({{
                  comparison.metrics.balanceDelta.absolute
                    | currency : 'EUR' : 'symbol' : '1.0-0'
                }})</span
              >
            </div>
          </div>
        </div>

        <!-- Income -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <div class="text-sm font-medium text-gray-600">Ingresos</div>
            <div
              [class]="
                getMetricTrendClass(comparison.metrics.incomeDelta.trend)
              "
            >
              {{ getTrendIcon(comparison.metrics.incomeDelta.trend) }}
            </div>
          </div>
          <div class="space-y-2">
            <div class="text-2xl font-bold text-green-600">
              {{
                comparison.period1.data.totalIncomes
                  | currency : 'EUR' : 'symbol' : '1.0-0'
              }}
            </div>
            <div class="text-sm text-gray-500">
              vs
              {{
                comparison.period2.data.totalIncomes
                  | currency : 'EUR' : 'symbol' : '1.0-0'
              }}
            </div>
            <div
              class="flex items-center gap-1 text-sm"
              [class]="
                getPercentageClass(comparison.metrics.incomeDelta.percentage)
              "
            >
              <span
                >{{ comparison.metrics.incomeDelta.percentage > 0 ? '+' : ''
                }}{{
                  comparison.metrics.incomeDelta.percentage | number : '1.1-1'
                }}%</span
              >
              <span class="text-gray-400"
                >({{
                  comparison.metrics.incomeDelta.absolute
                    | currency : 'EUR' : 'symbol' : '1.0-0'
                }})</span
              >
            </div>
          </div>
        </div>

        <!-- Expenses -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <div class="text-sm font-medium text-gray-600">Gastos</div>
            <div
              [class]="
                getMetricTrendClass(comparison.metrics.expenseDelta.trend, true)
              "
            >
              {{ getTrendIcon(comparison.metrics.expenseDelta.trend) }}
            </div>
          </div>
          <div class="space-y-2">
            <div class="text-2xl font-bold text-red-600">
              {{
                comparison.period1.data.totalExpenses
                  | currency : 'EUR' : 'symbol' : '1.0-0'
              }}
            </div>
            <div class="text-sm text-gray-500">
              vs
              {{
                comparison.period2.data.totalExpenses
                  | currency : 'EUR' : 'symbol' : '1.0-0'
              }}
            </div>
            <div
              class="flex items-center gap-1 text-sm"
              [class]="
                getPercentageClass(
                  comparison.metrics.expenseDelta.percentage,
                  true
                )
              "
            >
              <span
                >{{ comparison.metrics.expenseDelta.percentage > 0 ? '+' : ''
                }}{{
                  comparison.metrics.expenseDelta.percentage | number : '1.1-1'
                }}%</span
              >
              <span class="text-gray-400"
                >({{
                  comparison.metrics.expenseDelta.absolute
                    | currency : 'EUR' : 'symbol' : '1.0-0'
                }})</span
              >
            </div>
          </div>
        </div>

        <!-- Savings Rate -->
        <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div class="flex items-center justify-between mb-4">
            <div class="text-sm font-medium text-gray-600">Tasa de Ahorro</div>
            <div
              [class]="
                getMetricTrendClass(comparison.metrics.savingsRateDelta.trend)
              "
            >
              {{ getTrendIcon(comparison.metrics.savingsRateDelta.trend) }}
            </div>
          </div>
          <div class="space-y-2">
            <div
              class="text-2xl font-bold"
              [class]="getSavingsRateClass(comparison.period1.data.savingsRate)"
            >
              {{ comparison.period1.data.savingsRate | number : '1.1-1' }}%
            </div>
            <div class="text-sm text-gray-500">
              vs {{ comparison.period2.data.savingsRate | number : '1.1-1' }}%
            </div>
            <div
              class="flex items-center gap-1 text-sm"
              [class]="
                getPercentageClass(
                  comparison.metrics.savingsRateDelta.percentage
                )
              "
            >
              <span
                >{{
                  comparison.metrics.savingsRateDelta.percentage > 0 ? '+' : ''
                }}{{
                  comparison.metrics.savingsRateDelta.percentage
                    | number : '1.1-1'
                }}%</span
              >
              <span class="text-gray-400"
                >({{
                  comparison.metrics.savingsRateDelta.absolute > 0 ? '+' : ''
                }}{{
                  comparison.metrics.savingsRateDelta.absolute
                    | number : '1.1-1'
                }}pp)</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Insights -->
      @if (comparison.insights.length > 0) {
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h2
          class="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2"
        >
          <span class="text-2xl">💡</span>
          Insights Automáticos
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (insight of comparison.insights; track $index) {
          <div
            class="p-4 rounded-lg border-l-4"
            [class]="getInsightClass(insight)"
          >
            <div class="flex items-start gap-3">
              <div class="text-lg">{{ getInsightIcon(insight.type) }}</div>
              <div class="flex-1">
                <h3 class="font-medium text-gray-800 mb-1">
                  {{ insight.title }}
                </h3>
                <p class="text-sm text-gray-600">{{ insight.description }}</p>
              </div>
            </div>
          </div>
          }
        </div>
      </div>
      }

      <!-- Visualizations -->
      <div class="space-y-8">
        <!-- Balance and Income Comparison - Side by side -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Balance Comparison Chart -->
          <app-basic-chart
            [title]="'Comparación de Balance'"
            [icon]="'💰'"
            [value1]="50"
            [value2]="1038"
            [label1]="'Últimos 30 días'"
            [label2]="'Anteriores 30 días'"
            [color]="'#10B981'"
            [showSummary]="true"
          ></app-basic-chart>

          <!-- Income Comparison Chart -->
          <app-basic-chart
            [title]="'Comparación de Ingresos'"
            [icon]="'📈'"
            [value1]="1245"
            [value2]="4205"
            [label1]="'Últimos 30 días'"
            [label2]="'Anteriores 30 días'"
            [color]="'#3B82F6'"
            [showSummary]="true"
          ></app-basic-chart>
        </div>

        <!-- Expense Comparison Chart - Full width -->
        <div class="w-full">
          <app-basic-chart
            [title]="'Comparación de Gastos'"
            [icon]="'📉'"
            [value1]="1195"
            [value2]="3167"
            [label1]="'Últimos 30 días'"
            [label2]="'Anteriores 30 días'"
            [color]="'#EF4444'"
            [showSummary]="true"
          ></app-basic-chart>
        </div>
      </div>

      <!-- Advanced Analysis Components -->
      <app-trend-analysis [comparison]="comparison"></app-trend-analysis>

      <!-- Detailed Breakdown -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Category Changes -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3
            class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"
          >
            <span class="text-xl">🏷️</span>
            Cambios por Categoría
          </h3>
          <div class="space-y-3 max-h-96 overflow-y-auto">
            @for (change of comparison.metrics.categoryChanges.slice(0, 10);
            track change.name) {
            <div
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex-1">
                <div class="font-medium text-gray-800">{{ change.name }}</div>
                @if (change.isNew) {
                <span
                  class="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-1"
                  >Nueva</span
                >
                } @else if (change.isRemoved) {
                <span
                  class="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full mt-1"
                  >Eliminada</span
                >
                }
              </div>
              <div class="text-right">
                <div
                  class="text-sm font-medium"
                  [class]="getPercentageClass(change.delta.percentage, true)"
                >
                  {{ change.delta.percentage > 0 ? '+' : ''
                  }}{{ change.delta.percentage | number : '1.0-0' }}%
                </div>
                <div class="text-xs text-gray-500">
                  {{
                    change.period1Amount | currency : 'EUR' : 'symbol' : '1.0-0'
                  }}
                  →
                  {{
                    change.period2Amount | currency : 'EUR' : 'symbol' : '1.0-0'
                  }}
                </div>
              </div>
            </div>
            }
          </div>
        </div>

        <!-- Source Changes -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3
            class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"
          >
            <span class="text-xl">💰</span>
            Cambios por Fuente de Ingresos
          </h3>
          <div class="space-y-3 max-h-96 overflow-y-auto">
            @for (change of comparison.metrics.sourceChanges.slice(0, 10); track
            change.name) {
            <div
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex-1">
                <div class="font-medium text-gray-800">{{ change.name }}</div>
                @if (change.isNew) {
                <span
                  class="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-1"
                  >Nueva</span
                >
                } @else if (change.isRemoved) {
                <span
                  class="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full mt-1"
                  >Eliminada</span
                >
                }
              </div>
              <div class="text-right">
                <div
                  class="text-sm font-medium"
                  [class]="getPercentageClass(change.delta.percentage)"
                >
                  {{ change.delta.percentage > 0 ? '+' : ''
                  }}{{ change.delta.percentage | number : '1.0-0' }}%
                </div>
                <div class="text-xs text-gray-500">
                  {{
                    change.period1Amount | currency : 'EUR' : 'symbol' : '1.0-0'
                  }}
                  →
                  {{
                    change.period2Amount | currency : 'EUR' : 'symbol' : '1.0-0'
                  }}
                </div>
              </div>
            </div>
            }
          </div>
        </div>
      </div>

      <!-- Export Actions -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3
          class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"
        >
          <span class="text-xl">📤</span>
          Exportar Datos
        </h3>
        <div class="flex flex-wrap gap-3">
          <button
            (click)="exportToCSV()"
            class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <span>📊</span>
            Exportar CSV
          </button>
          <button
            (click)="exportToPDF()"
            class="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <span>📄</span>
            Exportar PDF
          </button>
          <button
            (click)="copyToClipboard()"
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>📋</span>
            Copiar Resumen
          </button>
        </div>
      </div>
      } @if (!currentComparison() && !isLoading()) {
      <!-- Empty State -->
      <div
        class="bg-white rounded-2xl p-12 shadow-sm border border-gray-200 text-center"
      >
        <div class="text-6xl mb-4">📊</div>
        <h3 class="text-xl font-semibold text-gray-800 mb-2">
          Comparación de Períodos
        </h3>
        <p class="text-gray-600 max-w-md mx-auto mb-6">
          Para ver los gráficos de comparación, selecciona uno de los períodos
          predefinidos arriba o configura fechas personalizadas.
        </p>

        <!-- Quick start button -->
        <div class="mb-6">
          <button
            (click)="loadDefaultComparison()"
            class="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            <span>🚀</span>
            Ver Ejemplo con Datos de Prueba
          </button>
          <button
            (click)="forceDataReload()"
            class="ml-3 inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            <span>🔄</span>
            Recargar Datos
          </button>
          <button
            (click)="debugComparison()"
            class="ml-3 inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors text-sm"
          >
            <span>🐛</span>
            Debug
          </button>
        </div>

        <div class="bg-blue-50 p-4 rounded-lg text-left max-w-lg mx-auto">
          <h4 class="font-medium text-blue-800 mb-2">💡 Cómo funciona:</h4>
          <ul class="text-sm text-blue-700 space-y-1">
            <li>
              • Haz clic en "Este mes vs Mes pasado" para una comparación rápida
            </li>
            <li>
              • Los gráficos incluyen: Balance, Ingresos, Categorías de Gastos y
              Fuentes
            </li>
            <li>
              • Agrega gastos e ingresos en las otras pestañas para ver datos
              reales
            </li>
            <li>• Usa el botón de arriba para cargar datos de ejemplo</li>
          </ul>
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
      customPeriod2: this.customPeriod2()
    });

    const comp = this.currentComparison();
    if (comp) {
      console.log('🔍 DEBUG: Comparison details', {
        period1: {
          range: comp.period1.range,
          data: comp.period1.data
        },
        period2: {
          range: comp.period2.range, 
          data: comp.period2.data
        },
        metrics: comp.metrics,
        insights: comp.insights
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
      
      this.notificationService.success('Datos recargados correctamente');
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
      this.notificationService.success(
        `Comparación "${preset.label}" generada correctamente`
      );
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
      this.notificationService.success(
        'Comparación personalizada generada correctamente'
      );
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
        this.notificationService.success('Filtros aplicados correctamente');
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
      this.notificationService.success('Datos exportados a CSV correctamente');
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
      this.notificationService.success('Informe PDF generado correctamente');
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
}
