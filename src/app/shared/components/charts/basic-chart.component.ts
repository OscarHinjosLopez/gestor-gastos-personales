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
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ChartLibraryService } from '../../core/chart-library.service';
import { PerformanceService } from '../../core/performance.service';

@Component({
  selector: 'app-basic-chart',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      [attr.aria-label]="'Gráfico de ' + title"
      role="img"
    >
      <h3
        class="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2"
        id="chart-title-{{ chartId }}"
      >
        <span class="text-xl" [attr.aria-hidden]="true">{{ icon }}</span>
        {{ title }}
      </h3>

      <div class="relative">
        @if (isLoading) {
        <div
          class="w-full h-80 flex items-center justify-center bg-gray-50 rounded-lg"
        >
          <div class="text-center">
            <div
              class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
            ></div>
            <p class="text-gray-600">Cargando gráfico...</p>
          </div>
        </div>
        } @else if (hasError) {
        <div
          class="w-full h-80 flex items-center justify-center bg-red-50 rounded-lg border border-red-200"
        >
          <div class="text-center text-red-600">
            <span class="text-4xl mb-2 block">⚠️</span>
            <p class="font-medium">Error al cargar el gráfico</p>
            <p class="text-sm text-red-500 mt-1">{{ errorMessage }}</p>
            <button
              (click)="retryChart()"
              class="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              [attr.aria-label]="'Reintentar cargar gráfico de ' + title"
            >
              Reintentar
            </button>
          </div>
        </div>
        } @else {
        <div class="w-full h-80">
          <canvas
            #chartCanvas
            [attr.aria-labelledby]="'chart-title-' + chartId"
            [attr.aria-describedby]="'chart-desc-' + chartId"
            role="img"
            [attr.aria-label]="getChartAriaLabel()"
          ></canvas>
          <div [id]="'chart-desc-' + chartId" class="sr-only">
            {{ getChartDescription() }}
          </div>
        </div>
        } @if (showSummary && !isLoading && !hasError) {
        <div class="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-gray-600 text-xs uppercase tracking-wide">
              {{ label1 }}
            </div>
            <div
              class="text-lg font-semibold"
              [attr.aria-label]="
                label1 + ': ' + (value1 | currency : 'EUR' : 'symbol' : '1.0-0')
              "
            >
              {{ value1 | currency : 'EUR' : 'symbol' : '1.0-0' }}
            </div>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-gray-600 text-xs uppercase tracking-wide">
              {{ label2 }}
            </div>
            <div
              class="text-lg font-semibold"
              [attr.aria-label]="
                label2 + ': ' + (value2 | currency : 'EUR' : 'symbol' : '1.0-0')
              "
            >
              {{ value2 | currency : 'EUR' : 'symbol' : '1.0-0' }}
            </div>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-gray-600 text-xs uppercase tracking-wide">
              Cambio
            </div>
            <div
              class="text-lg font-semibold"
              [class]="getPercentageClass()"
              [attr.aria-label]="'Cambio: ' + getPercentageText()"
            >
              {{ getPercentageText() }}
            </div>
          </div>
        </div>
        }
      </div>
    </div>
  `,
})
export class BasicChartComponent
  implements AfterViewInit, OnDestroy, OnChanges
{
  @Input() title: string = '';
  @Input() icon: string = '';
  @Input() value1: number = 0;
  @Input() value2: number = 0;
  @Input() label1: string = 'Anterior';
  @Input() label2: string = 'Actual';
  @Input() showSummary: boolean = true;
  @Input() color: string = '#3B82F6';
  @Input() chartId: string = Math.random().toString(36).substr(2, 9);

  @ViewChild('chartCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart: any = null;
  private chartLibrary = inject(ChartLibraryService);
  private performanceService = inject(PerformanceService);

  isLoading = true;
  hasError = false;
  errorMessage = '';

  // Debounced chart update to prevent excessive re-renders
  private debouncedUpdateChart = this.performanceService.debounce(
    () => this.updateChart(),
    300
  );

  ngAfterViewInit(): void {
    setTimeout(() => this.initializeChart(), 100);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['value1'] || changes['value2']) && this.chart) {
      // Use debounced update to prevent excessive re-renders
      this.debouncedUpdateChart();
    }
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  private async initializeChart(): Promise<void> {
    try {
      this.isLoading = true;
      this.hasError = false;

      await this.performanceService.measureAsyncPerformance(
        `Chart.js loading for ${this.title}`,
        async () => {
          const loaded = await this.chartLibrary.loadChartJs();
          if (!loaded) {
            throw new Error('No se pudo cargar la librería de gráficos');
          }
        }
      );

      await this.performanceService.measureAsyncPerformance(
        `Chart creation for ${this.title}`,
        () => this.createChart()
      );
    } catch (error) {
      this.handleChartError(error);
    } finally {
      this.isLoading = false;
    }
  }

  private async createChart(): Promise<void> {
    if (!this.canvasRef?.nativeElement) {
      throw new Error('Canvas no disponible');
    }

    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) {
      throw new Error('Contexto 2D no disponible');
    }

    this.destroyChart();

    try {
      const Chart = this.chartLibrary.getChart();

      this.chart = new Chart(ctx, {
        type: 'bar',
        data: this.getChartData(),
        options: this.getChartOptions(),
      });

      console.log('✅ Gráfico creado exitosamente:', this.title);
    } catch (error) {
      throw new Error(`Error al crear el gráfico: ${error}`);
    }
  }

  private updateChart(): void {
    if (this.chart) {
      this.chart.data = this.getChartData();
      this.chart.update('active');
    }
  }

  private getChartData() {
    // Memoize chart data calculation to improve performance
    const cacheKey = `chart-data-${this.chartId}-${this.value1}-${this.value2}`;

    return this.performanceService.memoize(cacheKey, () => {
      const changePercentage = this.getPercentage();
      const isPositive = changePercentage >= 0;

      return {
        labels: [this.label1, this.label2],
        datasets: [
          {
            label: this.title,
            data: [this.value1, this.value2],
            backgroundColor: [
              this.color + '80',
              isPositive ? '#10B981' + '80' : '#EF4444' + '80',
            ],
            borderColor: [this.color, isPositive ? '#10B981' : '#EF4444'],
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      };
    });
  }

  private getChartOptions() {
    // Memoize chart options to prevent recreation
    const cacheKey = `chart-options-${this.chartId}`;

    return this.performanceService.memoize(cacheKey, () => ({
      responsive: true,
      maintainAspectRatio: false,
      accessibility: {
        enabled: true,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const value = context.parsed.y;
              const percentage = this.getPercentage();
              return `${context.label}: €${value.toLocaleString()} (${
                percentage > 0 ? '+' : ''
              }${percentage}%)`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value: any) {
              return '€' + value.toLocaleString();
            },
          },
          grid: {
            color: '#f3f4f6',
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
      animation: {
        duration: 750,
        easing: 'easeInOutQuart',
      },
    }));
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  private handleChartError(error: any): void {
    this.hasError = true;
    this.errorMessage = error?.message || 'Error desconocido';
    console.error('❌ Error en gráfico:', this.title, error);
  }

  async retryChart(): Promise<void> {
    await this.initializeChart();
  }

  // Accessibility helpers
  getChartAriaLabel(): string {
    const percentage = this.getPercentage();
    const trend = percentage >= 0 ? 'aumentó' : 'disminuyó';
    return `Gráfico de barras mostrando ${this.title}. ${this.label1}: €${
      this.value1
    }, ${this.label2}: €${this.value2}. ${trend} ${Math.abs(percentage)}%`;
  }

  getChartDescription(): string {
    return `Comparación entre ${this.label1} y ${this.label2} para ${this.title}. Datos: ${this.label1} €${this.value1}, ${this.label2} €${this.value2}.`;
  }

  // Helper methods
  getPercentage(): number {
    if (this.value1 === 0) return this.value2 > 0 ? 100 : 0;
    return Math.round(((this.value2 - this.value1) / this.value1) * 100);
  }

  getPercentageText(): string {
    const percentage = this.getPercentage();
    return `${percentage > 0 ? '+' : ''}${percentage}%`;
  }

  getPercentageClass(): string {
    const percentage = this.getPercentage();
    if (Math.abs(percentage) < 1) return 'text-gray-600';
    return percentage > 0 ? 'text-green-600' : 'text-red-600';
  }
}
