import { Component, Input, ViewChild, ElementRef, OnInit, OnDestroy, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';

declare var Chart: any;

@Component({
  selector: 'app-basic-chart',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <span class="text-xl">{{ icon }}</span>
        {{ title }}
      </h3>

      <div class="relative">
        <div class="w-full h-80 flex items-center justify-center">
          <canvas #chartCanvas width="400" height="300"></canvas>
        </div>

        @if (showSummary) {
          <div class="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div class="bg-gray-50 rounded-lg p-3">
              <div class="text-gray-600 text-xs uppercase">Período 1</div>
              <div class="text-lg font-semibold">{{ value1 | currency:'EUR':'symbol':'1.0-0' }}</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <div class="text-gray-600 text-xs uppercase">Período 2</div>
              <div class="text-lg font-semibold">{{ value2 | currency:'EUR':'symbol':'1.0-0' }}</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <div class="text-gray-600 text-xs uppercase">Cambio</div>
              <div class="text-lg font-semibold text-green-600">{{ getPercentage() }}%</div>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class BasicChartComponent implements AfterViewInit, OnDestroy {
  @Input() title: string = '';
  @Input() icon: string = '';
  @Input() value1: number = 0;
  @Input() value2: number = 0;
  @Input() label1: string = 'Anterior';
  @Input() label2: string = 'Actual';
  @Input() showSummary: boolean = true;
  @Input() color: string = '#3B82F6';

  @ViewChild('chartCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart: any = null;

  ngAfterViewInit(): void {
    // Load Chart.js from CDN and then create chart
    this.loadChartJS().then(() => {
      this.createBasicChart();
    });
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private async loadChartJS(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof Chart !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
      script.onload = () => {
        console.log('✅ Chart.js loaded from CDN');
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  private createBasicChart(): void {
    if (!this.canvasRef) {
      console.log('❌ No canvas reference');
      return;
    }

    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) {
      console.log('❌ No 2D context');
      return;
    }

    console.log('📊 Creating basic chart with values:', this.value1, this.value2);

    if (this.chart) {
      this.chart.destroy();
    }

    try {
      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: [this.label1, this.label2],
          datasets: [{
            label: this.title,
            data: [this.value1, this.value2],
            backgroundColor: [this.color + '80', this.color + '60'],
            borderColor: [this.color, this.color],
            borderWidth: 2,
            borderRadius: 8,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value: any) {
                  return '€' + value;
                }
              }
            }
          }
        }
      });

      console.log('✅ Basic chart created successfully');
    } catch (error) {
      console.error('❌ Error creating basic chart:', error);
    }
  }

  getPercentage(): number {
    if (this.value1 === 0) return this.value2 > 0 ? 100 : 0;
    return Math.round(((this.value2 - this.value1) / this.value1) * 100);
  }
}
