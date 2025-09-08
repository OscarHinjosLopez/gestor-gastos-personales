import { Component, Input, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, CurrencyPipe, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-test-chart',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3
        class="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2"
      >
        <span class="text-xl">{{ icon }}</span>
        {{ title }}
      </h3>

      @if (showSummary) {
      <div class="grid grid-cols-3 gap-4 text-sm mb-4">
        <div class="bg-blue-50 rounded-lg p-3">
          <div class="text-blue-600 text-xs uppercase tracking-wide">
            {{ label1 }}
          </div>
          <div class="text-lg font-semibold text-blue-800">
            {{ value1 | currency : 'EUR' : 'symbol' : '1.0-0' }}
          </div>
        </div>
        <div class="bg-green-50 rounded-lg p-3">
          <div class="text-green-600 text-xs uppercase tracking-wide">
            {{ label2 }}
          </div>
          <div class="text-lg font-semibold text-green-800">
            {{ value2 | currency : 'EUR' : 'symbol' : '1.0-0' }}
          </div>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <div class="text-gray-600 text-xs uppercase tracking-wide">
            Cambio
          </div>
          <div class="text-lg font-semibold" [class]="getPercentageClass()">
            {{ getPercentageText() }}
          </div>
        </div>
      </div>
      }

      <!-- Simple Bar Chart using CSS -->
      <div class="space-y-4">
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-gray-700">{{ label1 }}</span>
            <span class="text-sm text-gray-600">{{
              value1 | currency : 'EUR' : 'symbol' : '1.0-0'
            }}</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-6">
            <div
              class="h-6 rounded-full transition-all duration-1000 ease-out"
              [style.width.%]="getBarWidth(value1)"
              [style.background-color]="color"
            ></div>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-gray-700">{{ label2 }}</span>
            <span class="text-sm text-gray-600">{{
              value2 | currency : 'EUR' : 'symbol' : '1.0-0'
            }}</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-6">
            <div
              class="h-6 rounded-full transition-all duration-1000 ease-out"
              [style.width.%]="getBarWidth(value2)"
              [style.background-color]="getBarColor()"
            ></div>
          </div>
        </div>
      </div>

      <!-- Debug Info -->
      <div class="mt-4 p-3 bg-gray-50 rounded text-xs">
        <strong>Debug:</strong> {{ title }} - V1: {{ value1 }} | V2:
        {{ value2 }} | Change: {{ getPercentage() }}%
      </div>
    </div>
  `,
})
export class TestChartComponent implements OnInit {
  @Input() title: string = '';
  @Input() icon: string = '';
  @Input() value1: number = 0;
  @Input() value2: number = 0;
  @Input() label1: string = 'Anterior';
  @Input() label2: string = 'Actual';
  @Input() showSummary: boolean = true;
  @Input() color: string = '#3B82F6';
  @Input() chartId: string = Math.random().toString(36).substr(2, 9);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    console.log('🔍 TestChart initialized:', {
      title: this.title,
      value1: this.value1,
      value2: this.value2,
      isBrowser: isPlatformBrowser(this.platformId),
    });
  }

  getBarWidth(value: number): number {
    const maxValue = Math.max(this.value1, this.value2, 1);
    return Math.min((value / maxValue) * 100, 100);
  }

  getBarColor(): string {
    const percentage = this.getPercentage();
    return percentage >= 0 ? '#10B981' : '#EF4444';
  }

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
