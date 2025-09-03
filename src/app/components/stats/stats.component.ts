import { Component, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { StateService } from '../../core/state.service';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-6">
        📊 Estadísticas y Análisis
      </h3>

      <!-- Resumen rápido -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-blue-50 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-blue-600">
            {{ monthlyStats().balance | currency : 'EUR' : 'symbol' : '1.0-0' }}
          </div>
          <div class="text-sm text-blue-600">Balance del Mes</div>
        </div>
        <div class="bg-green-50 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-green-600">
            {{
              monthlyStats().totalIncomes
                | currency : 'EUR' : 'symbol' : '1.0-0'
            }}
          </div>
          <div class="text-sm text-green-600">Ingresos del Mes</div>
        </div>
        <div class="bg-red-50 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-red-600">
            {{
              monthlyStats().totalExpenses
                | currency : 'EUR' : 'symbol' : '1.0-0'
            }}
          </div>
          <div class="text-sm text-red-600">Gastos del Mes</div>
        </div>
        <div class="bg-purple-50 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-purple-600">
            {{ averageDailyExpense() | currency : 'EUR' : 'symbol' : '1.0-0' }}
          </div>
          <div class="text-sm text-purple-600">Gasto Diario Promedio</div>
        </div>
      </div>

      <!-- Distribución por categorías -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Gastos por categoría -->
        <div>
          <h4 class="text-lg font-medium text-gray-900 mb-4">
            💸 Gastos por Categoría
          </h4>
          <div class="space-y-3">
            @for (category of expensesByCategory(); track category.name) {
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <div
                  class="w-4 h-4 rounded"
                  [style.background-color]="getCategoryColor(category.name)"
                ></div>
                <span class="text-sm font-medium text-gray-700">{{
                  category.name
                }}</span>
              </div>
              <div class="flex items-center space-x-3">
                <div class="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    class="h-2 rounded-full"
                    [style.background-color]="getCategoryColor(category.name)"
                    [style.width.%]="category.percentage"
                  ></div>
                </div>
                <span
                  class="text-sm font-semibold text-gray-900 w-16 text-right"
                >
                  {{ category.amount | currency : 'EUR' : 'symbol' : '1.0-0' }}
                </span>
              </div>
            </div>
            } @empty {
            <div class="text-center py-4 text-gray-500">
              No hay gastos para mostrar
            </div>
            }
          </div>
        </div>

        <!-- Ingresos por fuente -->
        <div>
          <h4 class="text-lg font-medium text-gray-900 mb-4">
            💰 Ingresos por Fuente
          </h4>
          <div class="space-y-3">
            @for (source of incomesBySource(); track source.name) {
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <div class="w-4 h-4 rounded bg-green-500"></div>
                <span class="text-sm font-medium text-gray-700">{{
                  source.name
                }}</span>
              </div>
              <div class="flex items-center space-x-3">
                <div class="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-green-500 h-2 rounded-full"
                    [style.width.%]="source.percentage"
                  ></div>
                </div>
                <span
                  class="text-sm font-semibold text-gray-900 w-16 text-right"
                >
                  {{ source.amount | currency : 'EUR' : 'symbol' : '1.0-0' }}
                </span>
              </div>
            </div>
            } @empty {
            <div class="text-center py-4 text-gray-500">
              No hay ingresos para mostrar
            </div>
            }
          </div>
        </div>
      </div>

      <!-- Tendencias mensuales -->
      <div class="mt-8">
        <h4 class="text-lg font-medium text-gray-900 mb-4">
          📈 Tendencia de los Últimos Meses
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          @for (month of lastMonthsData(); track month.month) {
          <div class="border rounded-lg p-4">
            <div class="text-sm font-medium text-gray-600 mb-2">
              {{ month.month }}
            </div>
            <div class="space-y-1">
              <div class="flex justify-between text-sm">
                <span class="text-green-600">Ingresos:</span>
                <span class="font-medium">{{
                  month.incomes | currency : 'EUR' : 'symbol' : '1.0-0'
                }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-red-600">Gastos:</span>
                <span class="font-medium">{{
                  month.expenses | currency : 'EUR' : 'symbol' : '1.0-0'
                }}</span>
              </div>
              <div class="flex justify-between text-sm border-t pt-1">
                <span class="font-medium">Balance:</span>
                <span
                  class="font-bold"
                  [class]="
                    month.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  "
                >
                  {{ month.balance | currency : 'EUR' : 'symbol' : '1.0-0' }}
                </span>
              </div>
            </div>
          </div>
          }
        </div>
      </div>

      <!-- Próximamente -->
      <div class="mt-8 p-4 bg-blue-50 rounded-lg">
        <h5 class="font-medium text-blue-900 mb-2">🚀 Próximamente</h5>
        <ul class="text-sm text-blue-700 space-y-1">
          <li>• Gráficos interactivos con Chart.js</li>
          <li>• Comparación de períodos</li>
          <li>• Proyecciones de gastos</li>
          <li>• Alertas de presupuesto</li>
        </ul>
      </div>
    </div>
  `,
})
export class StatsComponent {
  constructor(public state: StateService) {}

  monthlyStats = computed(() => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthlyIncomes = this.state
      .incomes()
      .filter((i) => i.date.startsWith(currentMonth));
    const monthlyExpenses = this.state
      .expenses()
      .filter((e) => e.date.startsWith(currentMonth));

    const totalIncomes = monthlyIncomes.reduce(
      (sum, i) => sum + (i.amount || 0),
      0
    );
    const totalExpenses = monthlyExpenses.reduce(
      (sum, e) => sum + (e.amount || 0),
      0
    );

    return {
      totalIncomes,
      totalExpenses,
      balance: totalIncomes - totalExpenses,
    };
  });

  averageDailyExpense = computed(() => {
    const expenses = this.state.expenses();
    if (expenses.length === 0) return 0;

    const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const uniqueDays = new Set(expenses.map((e) => e.date.split('T')[0])).size;

    return uniqueDays > 0 ? total / uniqueDays : 0;
  });

  expensesByCategory = computed(() => {
    const expenses = this.state.expenses();
    const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    if (total === 0) return [];

    const categories = expenses.reduce((acc, expense) => {
      const cat = expense.category || 'Sin categoría';
      acc[cat] = (acc[cat] || 0) + (expense.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categories)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: (amount / total) * 100,
      }))
      .sort((a, b) => b.amount - a.amount);
  });

  incomesBySource = computed(() => {
    const incomes = this.state.incomes();
    const total = incomes.reduce((sum, i) => sum + (i.amount || 0), 0);

    if (total === 0) return [];

    const sources = incomes.reduce((acc, income) => {
      const source = income.source || 'Ingreso general';
      acc[source] = (acc[source] || 0) + (income.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(sources)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: (amount / total) * 100,
      }))
      .sort((a, b) => b.amount - a.amount);
  });

  lastMonthsData = computed(() => {
    const months = [];
    const now = new Date();

    for (let i = 2; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toISOString().slice(0, 7);
      const monthName = date.toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric',
      });

      const monthIncomes = this.state
        .incomes()
        .filter((i) => i.date.startsWith(monthStr))
        .reduce((sum, i) => sum + (i.amount || 0), 0);

      const monthExpenses = this.state
        .expenses()
        .filter((e) => e.date.startsWith(monthStr))
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      months.push({
        month: monthName,
        incomes: monthIncomes,
        expenses: monthExpenses,
        balance: monthIncomes - monthExpenses,
      });
    }

    return months;
  });

  getCategoryColor(category: string): string {
    const colors = [
      '#ef4444',
      '#f97316',
      '#f59e0b',
      '#eab308',
      '#84cc16',
      '#22c55e',
      '#10b981',
      '#14b8a6',
      '#06b6d4',
      '#0ea5e9',
      '#3b82f6',
      '#6366f1',
      '#8b5cf6',
      '#a855f7',
      '#d946ef',
      '#ec4899',
      '#f43f5e',
    ];

    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }
}
