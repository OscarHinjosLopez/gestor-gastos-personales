import {
  Component,
  Input,
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
import { ChartService } from './chart.service';

Chart.register(...registerables);

export interface BarChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  template: `
    <div
      class="relative w-full flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden"
      [style.height.px]="height"
    >
      @if (isBrowser && chartData && chartData.labels && chartData.labels.length
      > 0) {
      <div class="px-6 py-4 border-b border-gray-100" *ngIf="title">
        <h4 class="text-lg font-semibold text-gray-900 m-0">{{ title }}</h4>
      </div>
      <div class="relative flex-1 min-h-0 p-4">
        <canvas
          baseChart
          #chartCanvas
          [data]="chartData"
          [options]="chartOptions"
          [type]="'bar'"
          class="w-full h-full"
        >
        </canvas>
      </div>
      } @else {
      <div class="flex items-center justify-center h-full min-h-[300px] p-8">
        <div class="text-center text-gray-500">
          <div class="text-5xl mb-4 opacity-60">📊</div>
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
export class BarChartComponent
  implements OnInit, OnDestroy, AfterViewInit, OnChanges
{
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  @ViewChild('chartCanvas', { static: false })
  chartCanvas?: ElementRef<HTMLCanvasElement>;

  @Input() labels: string[] = [];
  @Input() datasets: BarChartDataset[] = [];
  @Input() title = '';
  @Input() height = 400;
  @Input() stacked = false;
  @Input() horizontal = false;
  @Input() showValues = false;
  @Input() noDataTitle = 'Sin datos disponibles';
  @Input() noDataMessage = 'No hay información para mostrar en este momento.';

  chartData?: ChartData<'bar'>;
  chartOptions?: ChartConfiguration<'bar'>['options'];
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
        backgroundColor:
          dataset.backgroundColor || this.chartService.getIncomeColor() + '80',
        borderColor: dataset.borderColor || this.chartService.getIncomeColor(),
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      })),
    };

    this.chartOptions = {
      ...this.chartService.getBarChartConfig(this.title),
      indexAxis: this.horizontal ? 'y' : 'x',
      scales: {
        x: {
          stacked: this.stacked,
          grid: {
            display: !this.horizontal,
            color: '#f3f4f6',
          },
          ticks: {
            color: '#6b7280',
            font: {
              size: 12,
            },
          },
        },
        y: {
          stacked: this.stacked,
          beginAtZero: true,
          grid: {
            display: this.horizontal,
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
          display: false, // Title is handled by template
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
              const value = context.parsed.y || context.parsed.x;
              const formattedValue = this.chartService.formatCurrency(value);
              return `${context.dataset.label}: ${formattedValue}`;
            },
          },
        },
      },
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
        easing: 'easeInOutQuart',
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
    };

    // Forzar actualización del gráfico
    setTimeout(() => {
      this.chart?.update();
    }, 0);
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

  // Método público para actualizar el gráfico externamente
  public updateChartData(): void {
    this.updateChart();
  }

  // Método público para obtener datos del gráfico
  public getChartInstance(): Chart | undefined {
    return this.chart?.chart;
  }

  // Método para exportar el gráfico como imagen
  public exportAsImage(filename = 'chart.png'): void {
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
