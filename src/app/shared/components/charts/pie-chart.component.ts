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

export interface PieChartDataItem {
  name: string;
  amount: number;
  percentage: number;
}

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  template: `
    <div class="relative w-full flex flex-col" [style.height.px]="height">
      @if (isBrowser && chartData && chartData.labels && chartData.labels.length
      > 0) {
      <div class="relative flex-1 min-h-0">
        <canvas
          baseChart
          #chartCanvas
          [data]="chartData"
          [options]="chartOptions"
          [type]="chartType"
          class="w-full h-full"
        >
        </canvas>
      </div>
      } @else {
      <div class="flex items-center justify-center h-full min-h-[200px]">
        <div class="text-center text-gray-500">
          <div class="text-5xl mb-4">📊</div>
          <h4 class="text-xl font-semibold mb-2 text-gray-700">
            {{ noDataTitle }}
          </h4>
          <p class="text-sm">{{ noDataMessage }}</p>
        </div>
      </div>
      } @if (showLegend && chartData && chartData.labels &&
      chartData.labels.length > 0) {
      <div class="mt-4 pt-4 border-t border-gray-200">
        <div class="flex flex-col gap-3 max-h-[200px] overflow-y-auto">
          @for (label of chartData.labels; track $index; let i = $index) {
          <div
            class="flex items-center gap-3 p-2 rounded-md transition-colors hover:bg-gray-50"
          >
            <div
              class="w-4 h-4 rounded-full flex-shrink-0 border-2 border-white shadow-sm"
              [style.background-color]="getLegendColor(i)"
            ></div>
            <span
              class="flex-1 text-sm font-medium text-gray-700 min-w-0 truncate"
              >{{ label }}</span
            >
            <span class="text-sm font-semibold text-gray-900 flex-shrink-0">
              {{ formatValue(getData(i)) }}
            </span>
          </div>
          }
        </div>
      </div>
      }
    </div>
  `,
  styles: [],
})
export class PieChartComponent
  implements OnInit, OnDestroy, AfterViewInit, OnChanges
{
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  @ViewChild('chartCanvas', { static: false })
  chartCanvas?: ElementRef<HTMLCanvasElement>;

  @Input() data: PieChartDataItem[] = [];
  @Input() title = '';
  @Input() height = 400;
  @Input() chartType: 'pie' | 'doughnut' = 'doughnut';
  @Input() showLegend = true;
  @Input() noDataTitle = 'Sin datos disponibles';
  @Input() noDataMessage = 'No hay información para mostrar en este momento.';

  chartData?: ChartData<'doughnut' | 'pie'>;
  chartOptions?: ChartConfiguration<'doughnut' | 'pie'>['options'];
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
    if (!this.data || this.data.length === 0) {
      this.chartData = undefined;
      return;
    }

    // Preparar datos para Chart.js
    const chartDataItems = this.data.map((item) => ({
      name: item.name,
      amount: item.amount,
      percentage: item.percentage,
    }));

    this.chartData =
      this.chartService.createExpensesByCategoryData(chartDataItems);

    // Configurar opciones del gráfico
    this.chartOptions = {
      ...this.chartService.getPieChartConfig(this.title),
      plugins: {
        ...this.chartService.getPieChartConfig(this.title).plugins,
        legend: {
          display: !this.showLegend, // Ocultamos la leyenda nativa si usamos la personalizada
          position: 'bottom',
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#e5e7eb',
          borderWidth: 1,
          callbacks: {
            label: (context) => {
              const value = context.parsed;
              const percentage = this.data[context.dataIndex]?.percentage || 0;
              const formattedValue = this.chartService.formatCurrency(value);
              return `${context.label}: ${formattedValue} (${percentage.toFixed(
                1
              )}%)`;
            },
          },
        },
      },
      cutout: this.chartType === 'doughnut' ? '60%' : 0,
      radius: '90%',
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 800,
      },
      interaction: {
        intersect: false,
        mode: 'point',
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

  getLegendColor(index: number): string {
    if (this.chartData?.datasets?.[0]?.backgroundColor) {
      const colors = this.chartData.datasets[0].backgroundColor as string[];
      return colors[index] || this.chartService.getColor(index);
    }
    return this.chartService.getColor(index);
  }

  getData(index: number): number {
    if (this.chartData?.datasets?.[0]?.data) {
      return this.chartData.datasets[0].data[index] || 0;
    }
    return 0;
  }

  formatValue(value: number): string {
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
}
