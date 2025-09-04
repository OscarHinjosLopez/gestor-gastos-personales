import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface DateRange {
  start: string;
  end: string;
}

export interface DatePreset {
  label: string;
  months: number;
}

export interface ChartFilters {
  dateRange: DateRange;
  categories: string[];
  sources: string[];
  minAmount?: number;
  maxAmount?: number;
}

@Component({
  selector: 'app-chart-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
    >
      <div
        class="flex justify-between items-center px-6 py-4 bg-gray-50 border-b border-gray-200"
      >
        <h4 class="text-lg font-semibold text-gray-900 m-0">
          🔍 Filtros y Controles
        </h4>
        <button
          class="px-4 py-2 border border-gray-300 bg-white rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          (click)="resetFilters()"
          [disabled]="!hasActiveFilters"
        >
          Restablecer
        </button>
      </div>

      <div class="p-6">
        <!-- Filtro de fechas -->
        <div class="mb-6">
          <h4 class="block text-sm font-semibold text-gray-700 mb-3"
            >📅 Período de tiempo</h4
          >
          <div class="flex items-center gap-3 mb-3">
            <div class="flex-1">
              <label for="startDate" class="sr-only">Fecha de inicio</label>
              <input
                type="date"
                id="startDate"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                [(ngModel)]="filters.dateRange.start"
                (ngModelChange)="onFiltersChange()"
                [max]="filters.dateRange.end"
              />
            </div>
            <span class="text-sm text-gray-500 font-medium">hasta</span>
            <div class="flex-1">
              <label for="endDate" class="sr-only">Fecha de fin</label>
              <input
                type="date"
                id="endDate"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                [(ngModel)]="filters.dateRange.end"
                (ngModelChange)="onFiltersChange()"
                [min]="filters.dateRange.start"
              />
            </div>
          </div>
          <div class="flex gap-2 flex-wrap">
            <button
              class="px-3 py-1.5 border border-gray-300 bg-white rounded-md text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
              [class.bg-blue-500]="isActivePreset(preset)"
              [class.border-blue-500]="isActivePreset(preset)"
              [class.text-white]="isActivePreset(preset)"
              *ngFor="let preset of datePresets"
              (click)="selectDatePreset(preset)"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>

        <!-- Filtro de categorías -->
        <div class="mb-6" *ngIf="availableCategories.length > 0">
          <h4 class="block text-sm font-semibold text-gray-700 mb-3"
            >🏷️ Categorías</h4
          >
          <div class="flex flex-col gap-2 max-h-[150px] overflow-y-auto">
            <label
              class="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-50 transition-colors"
              *ngFor="let category of availableCategories"
            >
              <input
                type="checkbox"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                [value]="category"
                [checked]="filters.categories.includes(category)"
                (change)="toggleCategory(category)"
              />
              <span class="text-sm text-gray-700">{{ category }}</span>
            </label>
          </div>
        </div>

        <!-- Filtro de fuentes de ingreso -->
        <div class="mb-6" *ngIf="availableSources.length > 0">
          <h4 class="block text-sm font-semibold text-gray-700 mb-3"
            >💰 Fuentes de ingreso</h4
          >
          <div class="flex flex-col gap-2 max-h-[150px] overflow-y-auto">
            <label
              class="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-50 transition-colors"
              *ngFor="let source of availableSources"
            >
              <input
                type="checkbox"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                [value]="source"
                [checked]="filters.sources.includes(source)"
                (change)="toggleSource(source)"
              />
              <span class="text-sm text-gray-700">{{ source }}</span>
            </label>
          </div>
        </div>

        <!-- Filtro de montos -->
        <div class="mb-6">
          <h4 class="block text-sm font-semibold text-gray-700 mb-3"
            >💶 Rango de montos</h4
          >
          <div class="flex gap-4">
            <div class="flex-1 flex flex-col gap-1">
              <label for="minAmount" class="text-xs font-medium text-gray-600"
                >Mínimo</label
              >
              <input
                type="number"
                id="minAmount"
                class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                [(ngModel)]="filters.minAmount"
                (ngModelChange)="onFiltersChange()"
                [max]="filters.maxAmount || null"
                placeholder="0"
                min="0"
              />
            </div>
            <div class="flex-1 flex flex-col gap-1">
              <label for="maxAmount" class="text-xs font-medium text-gray-600"
                >Máximo</label
              >
              <input
                type="number"
                id="maxAmount"
                class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                [(ngModel)]="filters.maxAmount"
                (ngModelChange)="onFiltersChange()"
                [min]="filters.minAmount || null"
                placeholder="Sin límite"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Indicadores de filtros activos -->
      <div
        class="border-t border-gray-200 px-6 py-4 bg-gray-50"
        *ngIf="hasActiveFilters"
      >
        <h5 class="text-sm font-semibold text-gray-700 mb-3 m-0">
          Filtros activos:
        </h5>
        <div class="flex flex-wrap gap-2">
          <span
            class="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium"
            *ngIf="!isDefaultDateRange()"
          >
            📅 {{ formatDateRange() }}
            <button
              class="text-blue-600 hover:text-blue-800 font-bold leading-none"
              (click)="resetDateRange()"
            >
              ×
            </button>
          </span>
          <span
            class="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium"
            *ngFor="let category of filters.categories"
          >
            🏷️ {{ category }}
            <button
              class="text-blue-600 hover:text-blue-800 font-bold leading-none"
              (click)="toggleCategory(category)"
            >
              ×
            </button>
          </span>
          <span
            class="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium"
            *ngFor="let source of filters.sources"
          >
            💰 {{ source }}
            <button
              class="text-blue-600 hover:text-blue-800 font-bold leading-none"
              (click)="toggleSource(source)"
            >
              ×
            </button>
          </span>
          <span
            class="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium"
            *ngIf="
              filters.minAmount !== undefined || filters.maxAmount !== undefined
            "
          >
            💶 {{ formatAmountRange() }}
            <button
              class="text-blue-600 hover:text-blue-800 font-bold leading-none"
              (click)="resetAmountRange()"
            >
              ×
            </button>
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class ChartFiltersComponent implements OnInit {
  @Input() availableCategories: string[] = [];
  @Input() availableSources: string[] = [];
  @Output() filtersChange = new EventEmitter<ChartFilters>();

  filters: ChartFilters = {
    dateRange: {
      start: '',
      end: '',
    },
    categories: [],
    sources: [],
  };

  datePresets: DatePreset[] = [
    { label: 'Este mes', months: 0 },
    { label: 'Últimos 3 meses', months: 3 },
    { label: 'Últimos 6 meses', months: 6 },
    { label: 'Este año', months: 12 },
  ];

  get hasActiveFilters(): boolean {
    return (
      !this.isDefaultDateRange() ||
      this.filters.categories.length > 0 ||
      this.filters.sources.length > 0 ||
      this.filters.minAmount !== undefined ||
      this.filters.maxAmount !== undefined
    );
  }

  ngOnInit(): void {
    this.setDefaultDateRange();
  }

  private setDefaultDateRange(): void {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.filters.dateRange = {
      start: firstDayOfMonth.toISOString().split('T')[0],
      end: lastDayOfMonth.toISOString().split('T')[0],
    };
  }

  onFiltersChange(): void {
    this.filtersChange.emit({ ...this.filters });
  }

  toggleCategory(category: string): void {
    const index = this.filters.categories.indexOf(category);
    if (index > -1) {
      this.filters.categories.splice(index, 1);
    } else {
      this.filters.categories.push(category);
    }
    this.onFiltersChange();
  }

  toggleSource(source: string): void {
    const index = this.filters.sources.indexOf(source);
    if (index > -1) {
      this.filters.sources.splice(index, 1);
    } else {
      this.filters.sources.push(source);
    }
    this.onFiltersChange();
  }

  selectDatePreset(preset: DatePreset): void {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date();

    if (preset.months === 0) {
      // Este mes
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (preset.months === 12) {
      // Este año
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    } else {
      // Últimos X meses
      startDate = new Date(
        now.getFullYear(),
        now.getMonth() - preset.months + 1,
        1
      );
    }

    this.filters.dateRange = {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    };
    this.onFiltersChange();
  }

  isActivePreset(preset: DatePreset): boolean {
    // Verificar si el preset coincide con el rango de fechas actual
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (preset.months === 0) {
      // Este mes
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (preset.months === 12) {
      // Este año
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    } else {
      // Últimos X meses
      startDate = new Date(
        now.getFullYear(),
        now.getMonth() - preset.months + 1,
        1
      );
      endDate = new Date();
    }

    const expectedStart = startDate.toISOString().split('T')[0];
    const expectedEnd = endDate.toISOString().split('T')[0];

    return (
      this.filters.dateRange.start === expectedStart &&
      this.filters.dateRange.end === expectedEnd
    );
  }

  resetFilters(): void {
    this.filters = {
      dateRange: { start: '', end: '' },
      categories: [],
      sources: [],
    };
    this.setDefaultDateRange();
    this.onFiltersChange();
  }

  resetDateRange(): void {
    this.setDefaultDateRange();
    this.onFiltersChange();
  }

  resetAmountRange(): void {
    this.filters.minAmount = undefined;
    this.filters.maxAmount = undefined;
    this.onFiltersChange();
  }

  isDefaultDateRange(): boolean {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];

    return (
      this.filters.dateRange.start === firstDay &&
      this.filters.dateRange.end === lastDay
    );
  }

  formatDateRange(): string {
    const start = new Date(this.filters.dateRange.start).toLocaleDateString(
      'es-ES'
    );
    const end = new Date(this.filters.dateRange.end).toLocaleDateString(
      'es-ES'
    );
    return `${start} - ${end}`;
  }

  formatAmountRange(): string {
    const min =
      this.filters.minAmount !== undefined
        ? new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
          }).format(this.filters.minAmount)
        : '';
    const max =
      this.filters.maxAmount !== undefined
        ? new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
          }).format(this.filters.maxAmount)
        : '';

    if (min && max) return `${min} - ${max}`;
    if (min) return `Desde ${min}`;
    if (max) return `Hasta ${max}`;
    return '';
  }
}
