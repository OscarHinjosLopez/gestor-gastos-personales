import { Component, computed, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StateService } from '../../core/state.service';

@Component({
  selector: 'app-income-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-semibold text-gray-900">
          💰 Lista de Ingresos
        </h3>
        <span class="text-sm text-gray-500">
          {{ filteredIncomes().length }} de
          {{ state.incomes().length }} ingresos
        </span>
      </div>

      <!-- Filtros -->
      <div class="mb-6 p-4 bg-gray-50 rounded-lg">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Filtro por mes -->
          <div>
            <label
              for="month-filter"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Filtrar por mes
            </label>
            <input
              id="month-filter"
              type="month"
              [value]="selectedMonth()"
              (input)="selectedMonth.set($any($event.target).value)"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <!-- Filtro por fuente -->
          <div>
            <label
              for="source-filter"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Filtrar por fuente
            </label>
            <select
              id="source-filter"
              [value]="selectedSource()"
              (change)="selectedSource.set($any($event.target).value)"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Todas las fuentes</option>
              @for (source of uniqueSources(); track source) {
              <option [value]="source">{{ source }}</option>
              }
            </select>
          </div>

          <!-- Botón limpiar -->
          <div class="flex items-end">
            <button
              (click)="clearFilters()"
              class="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              🗑️ Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      <!-- Lista de ingresos -->
      <div class="space-y-3 max-h-96 overflow-y-auto">
        @for (income of filteredIncomes(); track income.id) {
        <div
          class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  {{ income.source || 'Ingreso' }}
                </span>
                <span class="text-sm text-gray-500">{{
                  income.date | date : 'dd/MM/yyyy'
                }}</span>
              </div>
              <div class="flex justify-between items-center">
                <div>
                  <p class="text-lg font-semibold text-gray-900">
                    {{ income.amount | currency : 'EUR' : 'symbol' : '1.2-2' }}
                  </p>
                  @if (income.notes) {
                  <p class="text-sm text-gray-600 mt-1">{{ income.notes }}</p>
                  }
                </div>
              </div>
            </div>

            <!-- Acciones -->
            <div class="flex items-center gap-2 ml-4">
              <button
                (click)="onEdit(income)"
                class="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
              >
                ✏️ Editar
              </button>
              <button
                (click)="onDelete(income.id)"
                class="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 transition-colors"
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        </div>
        } @empty {
        <div class="text-center py-8">
          <div class="text-gray-400 text-4xl mb-2">💰</div>
          <p class="text-gray-500 text-lg">No hay ingresos registrados</p>
          @if (selectedMonth() || selectedSource()) {
          <p class="text-gray-400 text-sm mt-1">Prueba ajustando los filtros</p>
          } @else {
          <p class="text-gray-400 text-sm mt-1">
            Agrega tu primer ingreso usando el formulario
          </p>
          }
        </div>
        }
      </div>

      @if (filteredIncomes().length > 0) {
      <!-- Resumen -->
      <div class="mt-6 pt-4 border-t border-gray-200">
        <div class="flex justify-between items-center text-sm">
          <span class="text-gray-600">Total filtrado:</span>
          <span class="font-semibold text-green-600">
            {{ totalFiltered() | currency : 'EUR' : 'symbol' : '1.2-2' }}
          </span>
        </div>
      </div>
      }
    </div>
  `,
})
export class IncomeListComponent {
  selectedMonth = signal<string>('');
  selectedSource = signal<string>('');

  constructor(public state: StateService) {}

  filteredIncomes = computed(() => {
    let incomes = this.state.incomes();

    // Filtrar por mes
    if (this.selectedMonth()) {
      incomes = incomes.filter((income) =>
        income.date.startsWith(this.selectedMonth())
      );
    }

    // Filtrar por fuente
    if (this.selectedSource()) {
      incomes = incomes.filter(
        (income) => income.source === this.selectedSource()
      );
    }

    // Ordenar por fecha (más reciente primero)
    return incomes.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  });

  uniqueSources = computed(() => {
    const sources = this.state.incomes().map((i) => i.source || 'Ingreso');
    return [...new Set(sources)].filter(Boolean).sort();
  });

  totalFiltered = computed(() => {
    return this.filteredIncomes().reduce(
      (sum, income) => sum + (income.amount || 0),
      0
    );
  });

  async onDelete(id: string) {
    if (confirm('¿Estás seguro de que quieres eliminar este ingreso?')) {
      await this.state.deleteIncome(id);
    }
  }

  onEdit(income: any) {
    // TODO: Implementar edición inline o modal
    console.log('Editar ingreso:', income);
  }

  clearFilters() {
    this.selectedMonth.set('');
    this.selectedSource.set('');
  }
}
