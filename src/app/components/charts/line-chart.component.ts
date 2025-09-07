import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnChanges,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NgChartsModule, BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, Chart, registerables } from 'chart.js';
import { ChartService } from '../../core/chart.service';

Chart.register(...registerables);

export interface LineChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  fill?: boolean;
  tension?: number;
}

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  template: `
    <div
      class="relative w-full flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden"
      [style.height.px]="height"
    >
      @if (isBrowser && chartData && chartData.labels && chartData.labels.length > 0) {
      <div
        class="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50"
        *ngIf="title"
      >
        <h4 class="text-lg font-semibold text-gray-900 m-0">{{ title }}</h4>
        <div class="flex gap-2" *ngIf="showControls">
          <button
            class="px-3 py-1.5 border border-gray-300 bg-white rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
            [class.bg-blue-500]="selectedPeriod === '3m'"
            [class.border-blue-500]="selectedPeriod === '3m'"
            [class.text-white]="selectedPeriod === '3m'"
            (click)="selectPeriod('3m')"
          >
            3M
          </button>
          <button
            class="px-3 py-1.5 border border-gray-300 bg-white rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
            [class.bg-blue-500]="selectedPeriod === '6m'"
            [class.border-blue-500]="selectedPeriod === '6m'"
            [class.text-white]="selectedPeriod === '6m'"
            (click)="selectPeriod('6m')"
          >
            6M
          </button>
          <button
            class="px-3 py-1.5 border border-gray-300 bg-white rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
            [class.bg-blue-500]="selectedPeriod === '1y'"
            [class.border-blue-500]="selectedPeriod === '1y'"
            [class.text-white]="selectedPeriod === '1y'"
            (click)="selectPeriod('1y')"
          >
            1A
          </button>
        </div>
      </div>
      <div class="relative flex-1 min-h-0 p-4">
        <canvas
          baseChart
          #chartCanvas
          [data]="chartData"
          [options]="chartOptions"
          [type]="'line'"
          class="w-full h-full"
        >
        </canvas>
      </div>
      <div
        class="px-6 py-4 border-t border-gray-100 bg-gray-50"
        *ngIf="showSummary && summaryData"
      >
        <div class="flex justify-around gap-4">
          <div class="flex flex-col items-center gap-1">
            <span
              class="text-xs font-medium text-gray-600 uppercase tracking-wide"
              >Promedio:</span
            >
            <span
              class="text-sm font-semibold"
              [class]="getValueClass(summaryData.average)"
            >
              {{ formatCurrency(summaryData.average) }}
            </span>
          </div>
          <div class="flex flex-col items-center gap-1">
            <span
              class="text-xs font-medium text-gray-600 uppercase tracking-wide"
              >Máximo:</span
            >
            <span class="text-sm font-semibold text-green-600">
              {{ formatCurrency(summaryData.max) }}
            </span>
          </div>
          <div class="flex flex-col items-center gap-1">
            <span
              class="text-xs font-medium text-gray-600 uppercase tracking-wide"
              >Mínimo:</span
            >
            <span
              class="text-sm font-semibold"
              [class]="getValueClass(summaryData.min)"
            >
              {{ formatCurrency(summaryData.min) }}
            </span>
          </div>
        </div>
      </div>
      } @else {
      <div class="flex items-center justify-center h-full min-h-[300px] p-8">
        <div class="text-center text-gray-500">
          <div class="text-5xl mb-4 opacity-60">📈</div>
          <h4 class="text-xl font-semibold mb-2 text-gray-700">
            {{ noDataTitle }}
          </h4>
          <p class="text-sm opacity-80">{{ noDataMessage }}</p>
        </div>
      </div>
      }
    </div>
  `,
  styles: [],
})
export class LineChartComponent
  implements OnInit, OnDestroy, AfterViewInit, OnChanges
{
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  @ViewChild('chartCanvas', { static: false })
  chartCanvas?: ElementRef<HTMLCanvasElement>;

  @Input() labels: string[] = [];
  @Input() datasets: LineChartDataset[] = [];
  @Input() title = '';
  @Input() height = 400;
  @Input() showControls = false;
  @Input() showSummary = false;
  @Input() noDataTitle = 'Sin datos disponibles';
  @Input() noDataMessage = 'No hay información para mostrar en este momento.';

  @Output() periodChange = new EventEmitter<string>();

  chartData?: ChartData<'line'>;
  chartOptions?: ChartConfiguration<'line'>['options'];
  selectedPeriod = '6m';
  summaryData?: {
    average: number;
    max: number;
    min: number;
  };
  isBrowser: boolean;

  private resizeObserver?: ResizeObserver;
  private chartService = inject(ChartService);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.updateChart();
  }

  ngAfterViewInit(): void {
    this.setupResizeObserver();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  ngOnChanges(): void {
    this.updateChart();
    this.calculateSummary();
  }

  private updateChart(): void {
    if (
      !this.labels ||
      this.labels.length === 0 ||
      !this.datasets ||
      this.datasets.length === 0
    ) {
      this.chartData = undefined;
      return;
    }

    this.chartData = {
      labels: this.labels,
      datasets: this.datasets.map((dataset) => ({
        label: dataset.label,
        data: dataset.data,
        borderColor: dataset.borderColor || this.chartService.getBalanceColor(),
        backgroundColor:
          dataset.backgroundColor || this.chartService.getBalanceColor() + '20',
        fill: dataset.fill !== undefined ? dataset.fill : true,
        tension: dataset.tension || 0.4,
        borderWidth: 3,
        pointBackgroundColor:
          dataset.borderColor || this.chartService.getBalanceColor(),
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointHoverBackgroundColor:
          dataset.borderColor || this.chartService.getBalanceColor(),
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 3,
      })),
    };

    this.chartOptions = {
      ...this.chartService.getLineChartConfig(this.title),
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: '#6b7280',
            font: {
              size: 12,
            },
          },
        },
        y: {
          grid: {
            color: '#f3f4f6',
          },
          ticks: {
            color: '#6b7280',
            font: {
              size: 12,
            },
            callback: function (value: unknown) {
              return new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(Number(value));
            },
          },
        },
      },
      plugins: {
        legend: {
          display: this.datasets.length > 1,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
            },
            color: '#374151',
          },
        },
        title: {
          display: false,
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#e5e7eb',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          usePointStyle: true,
          callbacks: {
            label: (context) => {
              const value = context.parsed.y;
              const formattedValue = this.chartService.formatCurrency(value);
              return `${context.dataset.label}: ${formattedValue}`;
            },
            afterLabel: (context) => {
              // Agregar información adicional si es un balance
              if (context.dataset.label?.toLowerCase().includes('balance')) {
                const value = context.parsed.y;
                const trend =
                  value > 0
                    ? '📈 Positivo'
                    : value < 0
                    ? '📉 Negativo'
                    : '➖ Neutro';
                return trend;
              }
              return '';
            },
          },
        },
      },
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart',
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
      elements: {
        line: {
          tension: 0.4,
        },
      },
    };

    // Forzar actualización del gráfico
    setTimeout(() => {
      this.chart?.update();
    }, 0);
  }

  private calculateSummary(): void {
    if (!this.datasets || this.datasets.length === 0) {
      this.summaryData = undefined;
      return;
    }

    const allValues = this.datasets.flatMap((dataset) => dataset.data);
    if (allValues.length === 0) {
      this.summaryData = undefined;
      return;
    }

    this.summaryData = {
      average: allValues.reduce((sum, val) => sum + val, 0) / allValues.length,
      max: Math.max(...allValues),
      min: Math.min(...allValues),
    };
  }

  private setupResizeObserver(): void {
    if (this.chartCanvas?.nativeElement) {
      this.resizeObserver = new ResizeObserver(() => {
        setTimeout(() => {
          this.chart?.update('resize');
        }, 100);
      });

      this.resizeObserver.observe(
        this.chartCanvas.nativeElement.parentElement!
      );
    }
  }

  selectPeriod(period: string): void {
    this.selectedPeriod = period;
    // Emitir evento para que el componente padre pueda filtrar los datos
    this.periodChange.emit(period);
  }

  getValueClass(value: number): string {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-500';
    return 'text-gray-600';
  }

  formatCurrency(value: number): string {
    return this.chartService.formatCurrency(value);
  }

  // Método público para actualizar el gráfico externamente
  public updateChartData(): void {
    this.updateChart();
  }

  // Método público para obtener datos del gráfico
  public getChartInstance(): Chart | undefined {
    return this.chart?.chart;
  }

  // Método para exportar el gráfico como imagen
  public exportAsImage(filename = 'trend-chart.png'): void {
    const chartInstance = this.getChartInstance();
    if (chartInstance) {
      const url = chartInstance.toBase64Image();
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      link.click();
    }
  }
}
