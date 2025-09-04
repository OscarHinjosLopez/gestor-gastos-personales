import { Component, computed, signal, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StateService } from '../../core/state.service';
import { Expense } from '../../models/expense.model';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-semibold text-gray-900">📝 Lista de Gastos</h3>
        <span class="text-sm text-gray-500">
          {{ filteredExpenses().length }} de
          {{ state.expenses().length }} gastos
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
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <!-- Filtro por categoría -->
          <div>
            <label
              for="category-filter"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Filtrar por categoría
            </label>
            <select
              id="category-filter"
              [value]="selectedCategory()"
              (change)="selectedCategory.set($any($event.target).value)"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las categorías</option>
              @for (category of uniqueCategories(); track category) {
              <option [value]="category">{{ category }}</option>
              }
            </select>
          </div>

          <!-- Botón limpiar -->
          <div class="flex items-end">
            <button
              (click)="clearFilters()"
              class="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              🗑️ Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      <!-- Lista de gastos -->
      <div class="space-y-3 max-h-96 overflow-y-auto">
        @for (expense of filteredExpenses(); track expense.id) {
        <div
          class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                >
                  {{ expense.category }}
                </span>
                <span class="text-sm text-gray-500">{{
                  expense.date | date : 'dd/MM/yyyy'
                }}</span>
              </div>
              <div class="flex justify-between items-center">
                <div>
                  <p class="text-lg font-semibold text-gray-900">
                    {{ expense.amount | currency : 'EUR' : 'symbol' : '1.2-2' }}
                  </p>
                  @if (expense.notes) {
                  <p class="text-sm text-gray-600 mt-1">{{ expense.notes }}</p>
                  }
                </div>
              </div>
            </div>

            <!-- Acciones -->
            <div class="flex items-center gap-2 ml-4">
              <button
                (click)="onEdit(expense)"
                class="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
              >
                ✏️ Editar
              </button>
              <button
                (click)="onDelete(expense.id)"
                class="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 transition-colors"
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        </div>
        } @empty {
        <div class="text-center py-8">
          <div class="text-gray-400 text-4xl mb-2">📝</div>
          <p class="text-gray-500 text-lg">No hay gastos registrados</p>
          @if (selectedMonth() || selectedCategory()) {
          <p class="text-gray-400 text-sm mt-1">Prueba ajustando los filtros</p>
          } @else {
          <p class="text-gray-400 text-sm mt-1">
            Agrega tu primer gasto usando el formulario
          </p>
          }
        </div>
        }
      </div>

      @if (filteredExpenses().length > 0) {
      <!-- Resumen -->
      <div class="mt-6 pt-4 border-t border-gray-200">
        <div class="flex justify-between items-center text-sm">
          <span class="text-gray-600">Total filtrado:</span>
          <span class="font-semibold text-red-600">
            {{ totalFiltered() | currency : 'EUR' : 'symbol' : '1.2-2' }}
          </span>
        </div>
      </div>
      }
    </div>
  `,
})
export class ExpenseListComponent {
  selectedMonth = signal<string>('');
  selectedCategory = signal<string>('');

  public state = inject(StateService);

  filteredExpenses = computed(() => {
    let expenses = this.state.expenses();

    // Filtrar por mes
    if (this.selectedMonth()) {
      expenses = expenses.filter((expense) =>
        expense.date.startsWith(this.selectedMonth())
      );
    }

    // Filtrar por categoría
    if (this.selectedCategory()) {
      expenses = expenses.filter(
        (expense) => expense.category === this.selectedCategory()
      );
    }

    // Ordenar por fecha (más reciente primero)
    return expenses.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  });

  uniqueCategories = computed(() => {
    const categories = this.state.expenses().map((e) => e.category);
    return [...new Set(categories)].filter(Boolean).sort();
  });

  totalFiltered = computed(() => {
    return this.filteredExpenses().reduce(
      (sum, expense) => sum + (expense.amount || 0),
      0
    );
  });

  async onDelete(id: string) {
    if (confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      await this.state.deleteExpense(id);
    }
  }

  onEdit(expense: Expense) {
    // TODO: Implementar edición inline o modal
    console.log('Editar gasto:', expense);
  }

  clearFilters() {
    this.selectedMonth.set('');
    this.selectedCategory.set('');
  }
}
