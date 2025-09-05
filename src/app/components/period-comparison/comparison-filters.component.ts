import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PeriodComparisonService } from '../../core/period-comparison.service';
import { ComparisonFilter } from '../../models/period-comparison.model';

@Component({
  selector: 'app-comparison-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span class="text-xl">🔍</span>
          Filtros Avanzados
        </h3>
        <button
          (click)="toggleFilters()"
          class="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          {{ showFilters() ? 'Ocultar' : 'Mostrar' }} Filtros
        </button>
      </div>

      @if (showFilters()) {
      <div class="space-y-6">
        <!-- Categories Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Categorías de Gastos
          </label>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            @for (category of availableCategories(); track category) {
            <label
              class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                [checked]="isSelectedCategory(category)"
                (change)="toggleCategory(category)"
                class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span class="text-sm text-gray-700 truncate">{{ category }}</span>
            </label>
            }
          </div>
          @if (selectedCategories().length > 0) {
          <div class="mt-2 flex flex-wrap gap-1">
            @for (category of selectedCategories(); track category) {
            <span
              class="inline-flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full"
            >
              {{ category }}
              <button
                (click)="removeCategory(category)"
                class="ml-1 text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
            }
          </div>
          }
        </div>

        <!-- Sources Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Fuentes de Ingresos
          </label>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            @for (source of availableSources(); track source) {
            <label
              class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                [checked]="isSelectedSource(source)"
                (change)="toggleSource(source)"
                class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span class="text-sm text-gray-700 truncate">{{ source }}</span>
            </label>
            }
          </div>
          @if (selectedSources().length > 0) {
          <div class="mt-2 flex flex-wrap gap-1">
            @for (source of selectedSources(); track source) {
            <span
              class="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full"
            >
              {{ source }}
              <button
                (click)="removeSource(source)"
                class="ml-1 text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
            }
          </div>
          }
        </div>

        <!-- Amount Range Filter -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Monto Mínimo (€)
            </label>
            <input
              type="number"
              [(ngModel)]="minAmount"
              (input)="onAmountChange()"
              placeholder="0"
              min="0"
              step="0.01"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Monto Máximo (€)
            </label>
            <input
              type="number"
              [(ngModel)]="maxAmount"
              (input)="onAmountChange()"
              placeholder="Sin límite"
              min="0"
              step="0.01"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <!-- Additional Options -->
        <div class="space-y-3">
          <label class="flex items-center space-x-2">
            <input
              type="checkbox"
              [(ngModel)]="includeZeroValues"
              (change)="onFilterChange()"
              class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span class="text-sm text-gray-700">Incluir valores cero</span>
          </label>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
          <button
            (click)="applyFilters()"
            [disabled]="!hasActiveFilters()"
            class="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Aplicar Filtros
          </button>
          <button
            (click)="clearAllFilters()"
            [disabled]="!hasActiveFilters()"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Limpiar Todo
          </button>
          <div class="flex-1"></div>
          @if (hasActiveFilters()) {
          <div class="flex items-center text-sm text-purple-600">
            <span class="mr-2">🔍</span>
            {{ getActiveFiltersCount() }} filtro(s) activo(s)
          </div>
          }
        </div>
      </div>
      }
    </div>
  `,
})
export class ComparisonFiltersComponent implements OnInit {
  @Input() initialFilters: ComparisonFilter = {};
  @Output() filtersChange = new EventEmitter<ComparisonFilter>();

  private comparisonService = inject(PeriodComparisonService);

  // Filter state
  showFilters = signal(false);
  selectedCategories = signal<string[]>([]);
  selectedSources = signal<string[]>([]);
  minAmount: number | null = null;
  maxAmount: number | null = null;
  includeZeroValues = true;

  // Available options
  availableCategories = signal<string[]>([]);
  availableSources = signal<string[]>([]);

  // Computed properties
  hasActiveFilters = computed(() => {
    return (
      this.selectedCategories().length > 0 ||
      this.selectedSources().length > 0 ||
      this.minAmount !== null ||
      this.maxAmount !== null ||
      !this.includeZeroValues
    );
  });

  ngOnInit(): void {
    this.loadAvailableOptions();
    this.initializeFilters();
  }

  private loadAvailableOptions(): void {
    this.availableCategories.set(
      this.comparisonService.getAvailableCategories()
    );
    this.availableSources.set(this.comparisonService.getAvailableSources());
  }

  private initializeFilters(): void {
    if (this.initialFilters) {
      this.selectedCategories.set(this.initialFilters.categories || []);
      this.selectedSources.set(this.initialFilters.sources || []);
      this.minAmount = this.initialFilters.minAmount || null;
      this.maxAmount = this.initialFilters.maxAmount || null;
      this.includeZeroValues = this.initialFilters.includeZeroValues ?? true;
    }
  }

  toggleFilters(): void {
    this.showFilters.update((show) => !show);
  }

  isSelectedCategory(category: string): boolean {
    return this.selectedCategories().includes(category);
  }

  isSelectedSource(source: string): boolean {
    return this.selectedSources().includes(source);
  }

  toggleCategory(category: string): void {
    this.selectedCategories.update((categories) => {
      if (categories.includes(category)) {
        return categories.filter((c) => c !== category);
      } else {
        return [...categories, category];
      }
    });
    this.onFilterChange();
  }

  toggleSource(source: string): void {
    this.selectedSources.update((sources) => {
      if (sources.includes(source)) {
        return sources.filter((s) => s !== source);
      } else {
        return [...sources, source];
      }
    });
    this.onFilterChange();
  }

  removeCategory(category: string): void {
    this.selectedCategories.update((categories) =>
      categories.filter((c) => c !== category)
    );
    this.onFilterChange();
  }

  removeSource(source: string): void {
    this.selectedSources.update((sources) =>
      sources.filter((s) => s !== source)
    );
    this.onFilterChange();
  }

  onAmountChange(): void {
    // Debounce to avoid too many events
    setTimeout(() => this.onFilterChange(), 300);
  }

  onFilterChange(): void {
    // Auto-apply filters when they change (optional)
    // this.applyFilters();
  }

  applyFilters(): void {
    const filters: ComparisonFilter = {
      categories:
        this.selectedCategories().length > 0
          ? this.selectedCategories()
          : undefined,
      sources:
        this.selectedSources().length > 0 ? this.selectedSources() : undefined,
      minAmount: this.minAmount || undefined,
      maxAmount: this.maxAmount || undefined,
      includeZeroValues: this.includeZeroValues,
    };

    this.filtersChange.emit(filters);
  }

  clearAllFilters(): void {
    this.selectedCategories.set([]);
    this.selectedSources.set([]);
    this.minAmount = null;
    this.maxAmount = null;
    this.includeZeroValues = true;

    this.filtersChange.emit({});
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.selectedCategories().length > 0) count++;
    if (this.selectedSources().length > 0) count++;
    if (this.minAmount !== null) count++;
    if (this.maxAmount !== null) count++;
    if (!this.includeZeroValues) count++;
    return count;
  }
}
