import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { PeriodComparison } from '../../models/period-comparison.model';

Chart.register(...registerables);

@Component({
  selector: 'app-simple-comparison-chart',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      @if (title) {
      <h3
        class="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2"
      >
        @if (icon) {
        <span class="text-xl">{{ icon }}</span>
        }
        {{ title }}
      </h3>
      } @if (comparison) {
      <div class="relative">
        @if (isBrowser) {
        <div class="w-full h-80">
          <canvas #chartCanvas></canvas>
        </div>
        } @else {
        <div
          class="flex items-center justify-center w-full h-80 bg-gray-50 rounded-lg"
        >
          <div class="text-center text-gray-500">
            <div class="text-4xl mb-2">📊</div>
            <p>Cargando gráfico...</p>
          </div>
        </div>
        } @if (showSummary && dataType !== 'categories' && dataType !==
        'sources') {
        <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-gray-600 text-xs uppercase tracking-wide">
              {{ getPeriod1Label() }}
            </div>
            <div class="text-lg font-semibold text-gray-800">
              {{ getPeriod1Value() | currency : 'EUR' : 'symbol' : '1.0-0' }}
            </div>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-gray-600 text-xs uppercase tracking-wide">
              {{ getPeriod2Label() }}
            </div>
            <div class="text-lg font-semibold text-gray-800">
              {{ getPeriod2Value() | currency : 'EUR' : 'symbol' : '1.0-0' }}
            </div>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-gray-600 text-xs uppercase tracking-wide">
              Cambio
            </div>
            <div class="text-lg font-semibold" [class]="getDeltaClass()">
              {{ getDeltaPercentage() > 0 ? '+' : ''
              }}{{ getDeltaPercentage() | number : '1.1-1' }}%
            </div>
          </div>
        </div>
        }
      </div>
      } @else {
      <div class="text-center py-12">
        <div class="text-4xl text-gray-300 mb-2">📊</div>
        <p class="text-gray-500">
          {{ noDataMessage || 'No hay datos para mostrar' }}
        </p>
        <button
          (click)="debugChart()"
          class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Debug Chart
        </button>
      </div>
      }
    </div>
  `,
})
export class SimpleComparisonChartComponent
  implements AfterViewInit, OnDestroy, OnChanges
{
  @Input() comparison: PeriodComparison | null = null;
  @Input() chartType: 'bar' | 'line' | 'doughnut' = 'bar';
  @Input() title: string = '';
  @Input() icon: string = '';
  @Input() showSummary: boolean = true;
  @Input() dataType:
    | 'balance'
    | 'income'
    | 'expense'
    | 'categories'
    | 'sources' = 'balance';
  @Input() maxCategories: number = 5;
  @Input() noDataMessage: string = '';

  @ViewChild('chartCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;
  isBrowser: boolean;
  private platformId = inject(PLATFORM_ID);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      // Use setTimeout to ensure the view is fully initialized
      setTimeout(() => {
        this.createChart();
      }, 100);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isBrowser && changes['comparison'] && this.canvasRef) {
      setTimeout(() => {
        this.createChart();
      }, 100);
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  debugChart(): void {
    console.log('🔍 DEBUG Simple Chart:', {
      hasComparison: !!this.comparison,
      hasCanvas: !!this.canvasRef,
      dataType: this.dataType,
      comparison: this.comparison,
    });
  }

  private createChart(): void {
    if (!this.isBrowser || !this.comparison || !this.canvasRef) {
      console.log('❌ No browser, comparison or canvas available');
      return;
    }

    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) {
      console.log('❌ No 2D context available');
      return;
    }

    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
    }

    try {
      const chartData = this.getSimpleChartData();
      console.log('📊 Creating chart with data:', chartData);

      this.chart = new Chart(ctx, {
        type: this.chartType as ChartType,
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display:
                this.dataType === 'categories' || this.dataType === 'sources',
            },
          },
          scales:
            this.chartType === 'bar'
              ? {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function (value) {
                        return '€' + value;
                      },
                    },
                  },
                }
              : undefined,
        },
      });

      console.log('✅ Chart created successfully');
    } catch (error) {
      console.error('❌ Error creating chart:', error);
    }
  }

  private getSimpleChartData() {
    if (!this.comparison) return { labels: [], datasets: [] };

    switch (this.dataType) {
      case 'categories':
        return this.getCategoryData();
      case 'sources':
        return this.getSourceData();
      default:
        return this.getMetricData();
    }
  }

  private getMetricData() {
    if (!this.comparison) return { labels: [], datasets: [] };

    const labels = [this.getPeriod1Label(), this.getPeriod2Label()];
    const values = [this.getPeriod1Value(), this.getPeriod2Value()];

    let color: string;
    let label: string;

    switch (this.dataType) {
      case 'balance':
        color = '#10B981';
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
      datasets: [
        {
          label,
          data: values,
          backgroundColor: [color + '80', color + '60'],
          borderColor: [color, color],
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    };
  }

  private getCategoryData() {
    if (!this.comparison) return { labels: [], datasets: [] };

    const changes = this.comparison.metrics.categoryChanges
      .slice(0, this.maxCategories)
      .filter((c) => c.period1Amount > 0 || c.period2Amount > 0);

    console.log('📊 Category changes:', changes);

    const labels = changes.map((c) => c.name);
    const period1Data = changes.map((c) => c.period1Amount);
    const period2Data = changes.map((c) => c.period2Amount);

    return {
      labels,
      datasets: [
        {
          label: this.getPeriod1Label(),
          data: period1Data,
          backgroundColor: '#3B82F680',
          borderColor: '#3B82F6',
          borderWidth: 2,
          borderRadius: 8,
        },
        {
          label: this.getPeriod2Label(),
          data: period2Data,
          backgroundColor: '#8B5CF680',
          borderColor: '#8B5CF6',
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    };
  }

  private getSourceData() {
    if (!this.comparison) return { labels: [], datasets: [] };

    const changes = this.comparison.metrics.sourceChanges
      .slice(0, this.maxCategories)
      .filter((c) => c.period1Amount > 0 || c.period2Amount > 0);

    console.log('📊 Source changes:', changes);

    const labels = changes.map((c) => c.name);
    const period1Data = changes.map((c) => c.period1Amount);
    const period2Data = changes.map((c) => c.period2Amount);

    return {
      labels,
      datasets: [
        {
          label: this.getPeriod1Label(),
          data: period1Data,
          backgroundColor: '#10B98180',
          borderColor: '#10B981',
          borderWidth: 2,
          borderRadius: 8,
        },
        {
          label: this.getPeriod2Label(),
          data: period2Data,
          backgroundColor: '#F59E0B80',
          borderColor: '#F59E0B',
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    };
  }

  // Helper methods
  getPeriod1Label(): string {
    return this.comparison?.period1.range.label || 'Período 1';
  }

  getPeriod2Label(): string {
    return this.comparison?.period2.range.label || 'Período 2';
  }

  getPeriod1Value(): number {
    if (!this.comparison) return 0;
    switch (this.dataType) {
      case 'balance':
        return this.comparison.period1.data.balance;
      case 'income':
        return this.comparison.period1.data.totalIncomes;
      case 'expense':
        return this.comparison.period1.data.totalExpenses;
      default:
        return 0;
    }
  }

  getPeriod2Value(): number {
    if (!this.comparison) return 0;
    switch (this.dataType) {
      case 'balance':
        return this.comparison.period2.data.balance;
      case 'income':
        return this.comparison.period2.data.totalIncomes;
      case 'expense':
        return this.comparison.period2.data.totalExpenses;
      default:
        return 0;
    }
  }

  getDeltaPercentage(): number {
    if (!this.comparison) return 0;
    switch (this.dataType) {
      case 'balance':
        return this.comparison.metrics.balanceDelta.percentage;
      case 'income':
        return this.comparison.metrics.incomeDelta.percentage;
      case 'expense':
        return this.comparison.metrics.expenseDelta.percentage;
      default:
        return 0;
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
}
