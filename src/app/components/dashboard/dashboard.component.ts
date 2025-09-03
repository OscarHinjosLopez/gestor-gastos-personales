import { Component, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { StateService } from '../../core/state.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">📊 Resumen General</h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Balance Total -->
        <div
          class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-100 text-sm font-medium">Balance Total</p>
              <p
                class="text-2xl font-bold"
                [class]="balance() >= 0 ? 'text-white' : 'text-red-200'"
              >
                {{ balance() | currency : 'EUR' : 'symbol' : '1.2-2' }}
              </p>
            </div>
            <div class="text-3xl opacity-80">💰</div>
          </div>
        </div>

        <!-- Total Ingresos -->
        <div
          class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-green-100 text-sm font-medium">Total Ingresos</p>
              <p class="text-2xl font-bold">
                {{ totalIncome() | currency : 'EUR' : 'symbol' : '1.2-2' }}
              </p>
              <p class="text-green-100 text-xs">
                {{ incomeCount() }} registros
              </p>
            </div>
            <div class="text-3xl opacity-80">📈</div>
          </div>
        </div>

        <!-- Total Gastos -->
        <div
          class="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-red-100 text-sm font-medium">Total Gastos</p>
              <p class="text-2xl font-bold">
                {{ totalExpenses() | currency : 'EUR' : 'symbol' : '1.2-2' }}
              </p>
              <p class="text-red-100 text-xs">{{ expenseCount() }} registros</p>
            </div>
            <div class="text-3xl opacity-80">📉</div>
          </div>
        </div>
      </div>

      <!-- Estadísticas adicionales -->
      <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-gray-800 mb-3">
            🏷️ Top Categorías de Gastos
          </h3>
          <div class="space-y-2">
            @for (category of topExpenseCategories(); track category.name) {
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">{{ category.name }}</span>
              <span class="text-sm font-medium text-gray-900">
                {{ category.amount | currency : 'EUR' : 'symbol' : '1.2-2' }}
              </span>
            </div>
            } @empty {
            <p class="text-gray-500 text-sm">No hay gastos registrados</p>
            }
          </div>
        </div>

        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="text-lg font-semibold text-gray-800 mb-3">
            💡 Resumen del Mes
          </h3>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600"
                >Promedio diario de gastos:</span
              >
              <span class="text-sm font-medium">{{
                avgDailyExpense() | currency : 'EUR' : 'symbol' : '1.2-2'
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Días con movimientos:</span>
              <span class="text-sm font-medium">{{ activeDays() }}</span>
            </div>
            @if (balance() < 0) {
            <div class="mt-3 p-2 bg-red-100 rounded text-sm text-red-700">
              ⚠️ Tu balance es negativo. Considera revisar tus gastos.
            </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  constructor(public state: StateService) {}

  balance = this.state.balance;

  totalIncome = computed(() =>
    this.state.incomes().reduce((sum, income) => sum + (income.amount || 0), 0)
  );

  totalExpenses = computed(() =>
    this.state
      .expenses()
      .reduce((sum, expense) => sum + (expense.amount || 0), 0)
  );

  incomeCount = computed(() => this.state.incomes().length);
  expenseCount = computed(() => this.state.expenses().length);

  topExpenseCategories = computed(() => {
    const categories = this.state.expenses().reduce((acc, expense) => {
      const cat = expense.category || 'Sin categoría';
      acc[cat] = (acc[cat] || 0) + (expense.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categories)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  });

  avgDailyExpense = computed(() => {
    const expenses = this.state.expenses();
    if (expenses.length === 0) return 0;

    const total = expenses.reduce(
      (sum, expense) => sum + (expense.amount || 0),
      0
    );
    const uniqueDays = new Set(expenses.map((e) => e.date.split('T')[0])).size;

    return uniqueDays > 0 ? total / uniqueDays : 0;
  });

  activeDays = computed(() => {
    const allDates = [
      ...this.state.expenses().map((e) => e.date.split('T')[0]),
      ...this.state.incomes().map((i) => i.date.split('T')[0]),
    ];
    return new Set(allDates).size;
  });
}
