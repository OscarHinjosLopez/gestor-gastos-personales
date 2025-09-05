import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { PeriodComparison } from '../../models/period-comparison.model';

@Component({
  selector: 'app-trend-analysis',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    @if (comparison) {
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <h3 class="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <span class="text-xl">📊</span>
        Análisis de Tendencias
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Velocity Analysis -->
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <h4 class="font-medium text-blue-800 mb-3 flex items-center gap-2">
            <span>⚡</span>
            Velocidad de Gasto
          </h4>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-blue-700">Período 1:</span>
              <span class="font-medium text-blue-800">
                {{ getDailyExpenseP1() | currency:'EUR':'symbol':'1.0-0' }}/día
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-blue-700">Período 2:</span>
              <span class="font-medium text-blue-800">
                {{ getDailyExpenseP2() | currency:'EUR':'symbol':'1.0-0' }}/día
              </span>
            </div>
            <div class="border-t border-blue-200 pt-2">
              <div class="flex justify-between items-center">
                <span class="text-sm text-blue-700">Cambio:</span>
                <span [class]="getChangeClass(getVelocityChange())">
                  {{ getVelocityChange() > 0 ? '+' : '' }}{{ getVelocityChange() | number:'1.1-1' }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Efficiency Analysis -->
        <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <h4 class="font-medium text-green-800 mb-3 flex items-center gap-2">
            <span>🎯</span>
            Eficiencia Financiera
          </h4>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-green-700">Gasto/Ingreso P1:</span>
              <span class="font-medium text-green-800">
                {{ getEfficiencyP1() | number:'1.1-1' }}%
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-green-700">Gasto/Ingreso P2:</span>
              <span class="font-medium text-green-800">
                {{ getEfficiencyP2() | number:'1.1-1' }}%
              </span>
            </div>
            <div class="border-t border-green-200 pt-2">
              <div class="flex justify-between items-center">
                <span class="text-sm text-green-700">Mejora:</span>
                <span [class]="getChangeClass(getEfficiencyChange(), true)">
                  {{ getEfficiencyChange() > 0 ? '+' : '' }}{{ getEfficiencyChange() | number:'1.1-1' }}pp
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Volatility Analysis -->
        <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <h4 class="font-medium text-purple-800 mb-3 flex items-center gap-2">
            <span>📈</span>
            Estabilidad
          </h4>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-purple-700">Categorías activas P1:</span>
              <span class="font-medium text-purple-800">{{ getCategoriesP1() }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-purple-700">Categorías activas P2:</span>
              <span class="font-medium text-purple-800">{{ getCategoriesP2() }}</span>
            </div>
            <div class="border-t border-purple-200 pt-2">
              <div class="flex justify-between items-center">
                <span class="text-sm text-purple-700">Diversificación:</span>
                <span [class]="getDiversificationClass()">
                  {{ getDiversificationLabel() }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Trend Predictions -->
      <div class="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 class="font-medium text-gray-800 mb-3 flex items-center gap-2">
          <span>🔮</span>
          Proyecciones
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white rounded-lg p-3">
            <div class="text-sm text-gray-600 mb-1">Si continúa la tendencia actual:</div>
            <div class="font-medium text-gray-800">
              Balance próximo período: {{ getProjectedBalance() | currency:'EUR':'symbol':'1.0-0' }}
            </div>
          </div>
          <div class="bg-white rounded-lg p-3">
            <div class="text-sm text-gray-600 mb-1">Recomendación:</div>
            <div class="font-medium" [class]="getRecommendationClass()">
              {{ getRecommendation() }}
            </div>
          </div>
        </div>
      </div>
    </div>
    }
  `
})
export class TrendAnalysisComponent {
  @Input() comparison: PeriodComparison | null = null;

  getDailyExpenseP1(): number {
    return this.comparison ? this.comparison.period1.data.averageDailyExpense : 0;
  }

  getDailyExpenseP2(): number {
    return this.comparison ? this.comparison.period2.data.averageDailyExpense : 0;
  }

  getVelocityChange(): number {
    const p1 = this.getDailyExpenseP1();
    const p2 = this.getDailyExpenseP2();
    return p2 !== 0 ? ((p1 - p2) / p2) * 100 : 0;
  }

  getEfficiencyP1(): number {
    if (!this.comparison || this.comparison.period1.data.totalIncomes === 0) return 0;
    return (this.comparison.period1.data.totalExpenses / this.comparison.period1.data.totalIncomes) * 100;
  }

  getEfficiencyP2(): number {
    if (!this.comparison || this.comparison.period2.data.totalIncomes === 0) return 0;
    return (this.comparison.period2.data.totalExpenses / this.comparison.period2.data.totalIncomes) * 100;
  }

  getEfficiencyChange(): number {
    return this.getEfficiencyP2() - this.getEfficiencyP1();
  }

  getCategoriesP1(): number {
    return this.comparison ? this.comparison.period1.data.categoryBreakdown.length : 0;
  }

  getCategoriesP2(): number {
    return this.comparison ? this.comparison.period2.data.categoryBreakdown.length : 0;
  }

  getProjectedBalance(): number {
    if (!this.comparison) return 0;
    
    const trend = this.comparison.metrics.balanceDelta.percentage / 100;
    return this.comparison.period1.data.balance * (1 + trend);
  }

  getChangeClass(change: number, inverse = false): string {
    const isPositive = inverse ? change < 0 : change > 0;
    if (Math.abs(change) < 1) return 'text-gray-600';
    return isPositive ? 'text-green-600 font-medium' : 'text-red-600 font-medium';
  }

  getDiversificationClass(): string {
    const diff = this.getCategoriesP1() - this.getCategoriesP2();
    if (Math.abs(diff) <= 1) return 'text-blue-600 font-medium';
    return diff > 0 ? 'text-green-600 font-medium' : 'text-orange-600 font-medium';
  }

  getDiversificationLabel(): string {
    const diff = this.getCategoriesP1() - this.getCategoriesP2();
    if (Math.abs(diff) <= 1) return 'Estable';
    return diff > 0 ? 'Más diversificado' : 'Menos diversificado';
  }

  getRecommendation(): string {
    if (!this.comparison) return 'Sin datos suficientes';

    const balanceTrend = this.comparison.metrics.balanceDelta.trend;
    const savingsRate = this.comparison.period1.data.savingsRate;

    if (balanceTrend === 'up' && savingsRate > 15) {
      return '¡Excelente gestión financiera!';
    } else if (balanceTrend === 'down' && savingsRate < 5) {
      return 'Revisar gastos urgentemente';
    } else if (savingsRate < 10) {
      return 'Buscar oportunidades de ahorro';
    } else {
      return 'Mantener la disciplina financiera';
    }
  }

  getRecommendationClass(): string {
    const rec = this.getRecommendation();
    if (rec.includes('Excelente')) return 'text-green-600';
    if (rec.includes('urgentemente')) return 'text-red-600';
    if (rec.includes('Revisar') || rec.includes('Buscar')) return 'text-orange-600';
    return 'text-blue-600';
  }
}
