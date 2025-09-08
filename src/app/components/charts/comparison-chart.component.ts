import { Component, Input, signal, computed, ViewChild, ElementRef, OnInit, OnDestroy, OnChanges, SimpleChanges, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { PeriodComparison, DeltaMetric } from '../../models/period-comparison.model';

Chart.register(...registerables);

@Component({
  selector: 'app-comparison-chart',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      @if (title) {
        <h3 class="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
          @if (icon) {
            <span class="text-xl">{{ icon }}</span>
          }
          {{ title }}
        </h3>
      }

      @if (comparison) {
        <div class="relative">
          @if (isBrowser) {
            <canvas
              #chartCanvas
              [attr.id]="chartId()"
              class="max-h-96"
            ></canvas>
          } @else {
            <div class="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
              <div class="text-center text-gray-500">
                <div class="text-4xl mb-2">📊</div>
                <p>Cargando gráfico...</p>
              </div>
            </div>
          }

          @if (showSummary) {
            <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div class="bg-gray-50 rounded-lg p-3">
                <div class="text-gray-600 text-xs uppercase tracking-wide">{{ period1Label() }}</div>
                <div class="text-lg font-semibold text-gray-800">{{ period1Value() | currency:'EUR':'symbol':'1.0-0' }}</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <div class="text-gray-600 text-xs uppercase tracking-wide">{{ period2Label() }}</div>
                <div class="text-lg font-semibold text-gray-800">{{ period2Value() | currency:'EUR':'symbol':'1.0-0' }}</div>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <div class="text-gray-600 text-xs uppercase tracking-wide">Cambio</div>
                <div class="text-lg font-semibold" [class]="getDeltaClass()">
                  {{ getDeltaPercentage() > 0 ? '+' : '' }}{{ getDeltaPercentage() | number:'1.1-1' }}%
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="text-center py-12">
          <div class="text-4xl text-gray-300 mb-2">📊</div>
          <p class="text-gray-500">{{ noDataMessage || 'No hay datos para mostrar' }}</p>
        </div>
      }
    </div>
  `
})
export class ComparisonChartComponent implements OnInit, OnDestroy, OnChanges {
  @Input() comparison: PeriodComparison | null = null;
  @Input() chartType: 'bar' | 'line' | 'doughnut' = 'bar';
  @Input() title: string = '';
  @Input() icon: string = '';
  @Input() height: number = 400;
  @Input() showSummary: boolean = true;
  @Input() dataType: 'balance' | 'income' | 'expense' | 'categories' | 'sources' = 'balance';
  @Input() maxCategories: number = 5;
  @Input() noDataMessage: string = '';

  @ViewChild('chartCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;
  chartId = signal(`comparison-chart-${Math.random().toString(36).substr(2, 9)}`);
  isBrowser: boolean;
  private platformId = inject(PLATFORM_ID);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // Computed values
  period1Label = computed(() => {
    const comp = this.comparison;
    return comp?.period1.range.label || 'Período 1';
  });

  period2Label = computed(() => {
    const comp = this.comparison;
    return comp?.period2.range.label || 'Período 2';
  });

  period1Value = computed(() => {
    const comp = this.comparison;
    if (!comp) return 0;

    switch (this.dataType) {
      case 'balance': return comp.period1.data.balance;
      case 'income': return comp.period1.data.totalIncomes;
      case 'expense': return comp.period1.data.totalExpenses;
      default: return 0;
    }
  });

  period2Value = computed(() => {
    const comp = this.comparison;
    if (!comp) return 0;

    switch (this.dataType) {
      case 'balance': return comp.period2.data.balance;
      case 'income': return comp.period2.data.totalIncomes;
      case 'expense': return comp.period2.data.totalExpenses;
      default: return 0;
    }
  });

  getDeltaPercentage(): number {
    const comp = this.comparison;
    if (!comp) return 0;

    switch (this.dataType) {
      case 'balance': return comp.metrics.balanceDelta.percentage;
      case 'income': return comp.metrics.incomeDelta.percentage;
      case 'expense': return comp.metrics.expenseDelta.percentage;
      default: return 0;
    }
  }

  getDeltaClass(): string {
    const percentage = this.getDeltaPercentage();
    const isExpense = this.dataType === 'expense';

    if (Math.abs(percentage) < 1) return 'text-gray-600';

    if (isExpense) {
      return percentage > 0 ? 'text-red-600' : 'text-green-600';
    }

    return percentage > 0 ? 'text-green-600' : 'text-red-600';
  }

  ngOnInit(): void {
    if (this.isBrowser && this.comparison) {
      this.createChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('🔍 ngOnChanges: Changes detected', {
      hasComparison: changes['comparison']?.currentValue ? 'yes' : 'no',
      dataType: this.dataType,
      chartType: this.chartType
    });
    
    if (changes['comparison'] || changes['dataType'] || changes['chartType']) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private createChart(): void {
    if (!this.isBrowser || !this.comparison || !this.canvasRef) {
      console.log('🔍 createChart: Missing browser, comparison or canvas', {
        isBrowser: this.isBrowser,
        hasComparison: !!this.comparison,
        hasCanvas: !!this.canvasRef
      });
      return;
    }

    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) {
      console.log('🔍 createChart: No 2D context available');
      return;
    }

    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
    }

    const config = this.getChartConfig();
    console.log('🔍 createChart: Creating chart with config', {
      type: config.type,
      dataLabels: config.data.labels,
      datasets: config.data.datasets?.length || 0,
      dataType: this.dataType
    });

    try {
      this.chart = new Chart(ctx, config);
      console.log('🔍 createChart: Chart created successfully');
    } catch (error) {
      console.error('🔍 createChart: Error creating chart', error);
    }
  }

  private updateChart(): void {
    if (this.isBrowser && this.comparison) {
      this.createChart();
    } else if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  private getChartConfig(): ChartConfiguration {
    const data = this.getChartData();
    const options = this.getChartOptions();

    return {
      type: this.chartType as ChartType,
      data,
      options
    };
  }

  private getChartData() {
    if (!this.comparison) {
      console.log('🔍 getChartData: No comparison data');
      return { labels: [], datasets: [] };
    }

    console.log('🔍 getChartData: Processing data type:', this.dataType);

    switch (this.dataType) {
      case 'categories':
        const catData = this.getCategoryComparisonData();
        console.log('🔍 getChartData: Category data', catData);
        return catData;
      case 'sources':
        const srcData = this.getSourceComparisonData();
        console.log('🔍 getChartData: Source data', srcData);
        return srcData;
      default:
        const metricData = this.getMetricComparisonData();
        console.log('🔍 getChartData: Metric data', metricData);
        return metricData;
    }
  }

  private getMetricComparisonData() {
    if (!this.comparison) return { labels: [], datasets: [] };

    const labels = [this.period1Label(), this.period2Label()];
    const values = [this.period1Value(), this.period2Value()];

    let color: string;
    let label: string;

    switch (this.dataType) {
      case 'balance':
        color = values[0] >= 0 ? '#10B981' : '#EF4444';
        label = 'Balance';
        break;
      case 'income':
        color = '#10B981';
        label = 'Ingresos';
        break;
      case 'expense':
        color = '#EF4444';
        label = 'Gastos';
        break;
      default:
        color = '#6B7280';
        label = 'Valor';
    }

    return {
      labels,
      datasets: [{
        label,
        data: values,
        backgroundColor: [color + '80', color + '60'],
        borderColor: [color, color],
        borderWidth: 2,
        borderRadius: this.chartType === 'bar' ? 8 : 0,
      }]
    };
  }

  private getCategoryComparisonData() {
    if (!this.comparison) return { labels: [], datasets: [] };

    const changes = this.comparison.metrics.categoryChanges
      .slice(0, this.maxCategories)
      .filter(c => c.period1Amount > 0 || c.period2Amount > 0);

    const labels = changes.map(c => c.name);
    const period1Data = changes.map(c => c.period1Amount);
    const period2Data = changes.map(c => c.period2Amount);

    return {
      labels,
      datasets: [
        {
          label: this.period1Label(),
          data: period1Data,
          backgroundColor: '#3B82F680',
          borderColor: '#3B82F6',
          borderWidth: 2,
          borderRadius: this.chartType === 'bar' ? 8 : 0,
        },
        {
          label: this.period2Label(),
          data: period2Data,
          backgroundColor: '#8B5CF680',
          borderColor: '#8B5CF6',
          borderWidth: 2,
          borderRadius: this.chartType === 'bar' ? 8 : 0,
        }
      ]
    };
  }

  private getSourceComparisonData() {
    if (!this.comparison) return { labels: [], datasets: [] };

    const changes = this.comparison.metrics.sourceChanges
      .slice(0, this.maxCategories)
      .filter(c => c.period1Amount > 0 || c.period2Amount > 0);

    const labels = changes.map(c => c.name);
    const period1Data = changes.map(c => c.period1Amount);
    const period2Data = changes.map(c => c.period2Amount);

    return {
      labels,
      datasets: [
        {
          label: this.period1Label(),
          data: period1Data,
          backgroundColor: '#10B98180',
          borderColor: '#10B981',
          borderWidth: 2,
          borderRadius: this.chartType === 'bar' ? 8 : 0,
        },
        {
          label: this.period2Label(),
          data: period2Data,
          backgroundColor: '#F5971880',
          borderColor: '#F59718',
          borderWidth: 2,
          borderRadius: this.chartType === 'bar' ? 8 : 0,
        }
      ]
    };
  }

  private getChartOptions() {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: this.dataType === 'categories' || this.dataType === 'sources',
          position: 'top' as const,
          labels: {
            usePointStyle: true,
            padding: 20
          }
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          titleColor: '#F9FAFB',
          bodyColor: '#F9FAFB',
          borderColor: '#374151',
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: (context: any) => {
              const value = context.parsed.y || context.parsed;
              const formatted = new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(value);
              return `${context.dataset.label}: ${formatted}`;
            }
          }
        }
      },
      scales: this.chartType === 'bar' ? {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#6B7280'
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: '#F3F4F6'
          },
          ticks: {
            color: '#6B7280',
            callback: function(value: any) {
              return new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(value);
            }
          }
        }
      } : {}
    };

    return {
      ...baseOptions,
      layout: {
        padding: 10
      }
    };
  }
}
