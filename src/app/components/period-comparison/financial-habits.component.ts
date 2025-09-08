import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PeriodComparison } from '../../models/period-comparison.model';

interface FinancialHabit {
  name: string;
  description: string;
  score: number; // 0-100
  trend: 'improved' | 'worsened' | 'stable';
  icon: string;
  recommendation?: string;
}

@Component({
  selector: 'app-financial-habits',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (comparison) {
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <h3 class="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <span class="text-xl">🎯</span>
        Análisis de Hábitos Financieros
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        @for (habit of getFinancialHabits(); track habit.name) {
        <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4">
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ habit.icon }}</span>
              <div>
                <h4 class="font-medium text-gray-800">{{ habit.name }}</h4>
                <p class="text-sm text-gray-600">{{ habit.description }}</p>
              </div>
            </div>
            <span [class]="getTrendBadgeClass(habit.trend)">
              {{ getTrendIcon(habit.trend) }}
            </span>
          </div>

          <!-- Progress Bar -->
          <div class="mb-3">
            <div class="flex justify-between items-center mb-1">
              <span class="text-sm text-gray-600">Puntuación</span>
              <span class="text-sm font-medium" [class]="getScoreClass(habit.score)">
                {{ habit.score }}/100
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div 
                class="h-2 rounded-full transition-all duration-300"
                [class]="getProgressBarClass(habit.score)"
                [style.width.%]="habit.score">
              </div>
            </div>
          </div>

          @if (habit.recommendation) {
          <div class="bg-white rounded-md p-3 border-l-4" [class]="getRecommendationClass(habit.trend)">
            <p class="text-sm text-gray-700">{{ habit.recommendation }}</p>
          </div>
          }
        </div>
        }
      </div>

      <!-- Overall Score -->
      <div class="mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-lg font-semibold mb-1">Puntuación General de Hábitos</h4>
            <p class="text-indigo-100">Basado en el análisis de tus patrones financieros</p>
          </div>
          <div class="text-right">
            <div class="text-3xl font-bold">{{ getOverallScore() }}</div>
            <div class="text-sm text-indigo-100">de 100</div>
          </div>
        </div>
        <div class="mt-4 bg-white/20 rounded-full h-3">
          <div 
            class="bg-white h-3 rounded-full transition-all duration-500"
            [style.width.%]="getOverallScore()">
          </div>
        </div>
        <div class="mt-3 text-sm text-indigo-100">
          {{ getOverallMessage() }}
        </div>
      </div>
    </div>
    }
  `
})
export class FinancialHabitsComponent {
  @Input() comparison: PeriodComparison | null = null;

  getFinancialHabits(): FinancialHabit[] {
    if (!this.comparison) return [];

    const habits: FinancialHabit[] = [];

    // 1. Consistencia en ahorro
    const savingsHabit = this.analyzeSavingsConsistency(this.comparison);
    habits.push(savingsHabit);

    // 2. Control de gastos
    const expenseControlHabit = this.analyzeExpenseControl(this.comparison);
    habits.push(expenseControlHabit);

    // 3. Diversificación de ingresos
    const incomeHabit = this.analyzeIncomeDiversification(this.comparison);
    habits.push(incomeHabit);

    // 4. Planificación de gastos
    const planningHabit = this.analyzeExpensePlanning(this.comparison);
    habits.push(planningHabit);

    // 5. Gestión de categorías
    const categoryHabit = this.analyzeCategoryManagement(this.comparison);
    habits.push(categoryHabit);

    // 6. Frecuencia de transacciones
    const frequencyHabit = this.analyzeTransactionFrequency(this.comparison);
    habits.push(frequencyHabit);

    return habits;
  }

  getOverallScore(): number {
    const habits = this.getFinancialHabits();
    if (habits.length === 0) return 0;
    return Math.round(habits.reduce((sum, habit) => sum + habit.score, 0) / habits.length);
  }

  private analyzeSavingsConsistency(comp: PeriodComparison): FinancialHabit {
    const p1Rate = comp.period1.data.savingsRate;
    const p2Rate = comp.period2.data.savingsRate;
    const avgRate = (p1Rate + p2Rate) / 2;
    
    let score = Math.min(100, Math.max(0, avgRate * 5)); // Base score
    let trend: 'improved' | 'worsened' | 'stable' = 'stable';
    
    if (p1Rate > p2Rate + 2) trend = 'improved';
    else if (p1Rate < p2Rate - 2) trend = 'worsened';

    let recommendation = '';
    if (avgRate < 10) {
      recommendation = 'Intenta ahorrar al menos 10% de tus ingresos mensualmente.';
    } else if (avgRate > 20) {
      recommendation = '¡Excelente hábito de ahorro! Considera diversificar tus inversiones.';
    }

    return {
      name: 'Constancia en Ahorro',
      description: 'Capacidad de mantener un ahorro regular',
      score: Math.round(score),
      trend,
      icon: '🏦',
      recommendation
    };
  }

  private analyzeExpenseControl(comp: PeriodComparison): FinancialHabit {
    const expenseChange = comp.metrics.expenseDelta.percentage;
    const incomeChange = comp.metrics.incomeDelta.percentage;
    
    let score = 50; // Base score
    
    // Good if expenses decreased or increased less than income
    if (expenseChange < 0) score += 30; // Expenses decreased
    else if (expenseChange < incomeChange) score += 20; // Controlled growth
    else if (expenseChange > incomeChange + 10) score -= 20; // Poor control
    
    // Consider average daily expense consistency
    const avgExpenseP1 = comp.period1.data.averageDailyExpense;
    const avgExpenseP2 = comp.period2.data.averageDailyExpense;
    const consistency = Math.abs(avgExpenseP1 - avgExpenseP2) / Math.max(avgExpenseP1, avgExpenseP2);
    
    if (consistency < 0.1) score += 20; // Very consistent
    else if (consistency > 0.3) score -= 15; // Inconsistent

    score = Math.min(100, Math.max(0, score));

    let trend: 'improved' | 'worsened' | 'stable' = 'stable';
    if (expenseChange < -5) trend = 'improved';
    else if (expenseChange > 10) trend = 'worsened';

    let recommendation = '';
    if (score < 40) {
      recommendation = 'Revisa tus gastos variables y establece un presupuesto mensual.';
    } else if (score > 80) {
      recommendation = '¡Excelente control de gastos! Mantén esta disciplina.';
    }

    return {
      name: 'Control de Gastos',
      description: 'Gestión eficaz del gasto mensual',
      score: Math.round(score),
      trend,
      icon: '💰',
      recommendation
    };
  }

  private analyzeIncomeDiversification(comp: PeriodComparison): FinancialHabit {
    const sourcesP1 = comp.period1.data.sourceBreakdown.length;
    const sourcesP2 = comp.period2.data.sourceBreakdown.length;
    const avgSources = (sourcesP1 + sourcesP2) / 2;
    
    let score = Math.min(100, avgSources * 25); // Score based on number of sources
    
    // Analyze concentration (how balanced are the sources)
    const totalIncomeP1 = comp.period1.data.totalIncomes;
    const concentrationP1 = comp.period1.data.sourceBreakdown.reduce((max, source) => 
      Math.max(max, source.percentage), 0);
    
    if (concentrationP1 < 70) score += 20; // Well diversified
    else if (concentrationP1 > 90) score -= 20; // Too concentrated

    score = Math.min(100, Math.max(0, score));

    let trend: 'improved' | 'worsened' | 'stable' = 'stable';
    if (sourcesP1 > sourcesP2) trend = 'improved';
    else if (sourcesP1 < sourcesP2) trend = 'worsened';

    let recommendation = '';
    if (avgSources === 1) {
      recommendation = 'Considera desarrollar fuentes adicionales de ingresos.';
    } else if (avgSources >= 3) {
      recommendation = '¡Gran diversificación de ingresos! Esto reduce tu riesgo financiero.';
    }

    return {
      name: 'Diversificación de Ingresos',
      description: 'Variedad de fuentes de ingresos',
      score: Math.round(score),
      trend,
      icon: '💼',
      recommendation
    };
  }

  private analyzeExpensePlanning(comp: PeriodComparison): FinancialHabit {
    // Analyze transaction patterns and category consistency
    const categoriesP1 = comp.period1.data.categoryBreakdown.length;
    const categoriesP2 = comp.period2.data.categoryBreakdown.length;
    
    let score = 50; // Base score
    
    // Consistent categories indicate planning
    const categoryDiff = Math.abs(categoriesP1 - categoriesP2);
    if (categoryDiff <= 1) score += 25; // Very consistent
    else if (categoryDiff <= 2) score += 15; // Somewhat consistent
    else score -= 10; // Inconsistent

    // Regular transaction frequency indicates planning
    const transactionsP1 = comp.period1.data.transactionCount;
    const transactionsP2 = comp.period2.data.transactionCount;
    const daysP1 = comp.period1.data.daysWithTransactions;
    const daysP2 = comp.period2.data.daysWithTransactions;
    
    const frequencyP1 = daysP1 > 0 ? transactionsP1 / daysP1 : 0;
    const frequencyP2 = daysP2 > 0 ? transactionsP2 / daysP2 : 0;
    const avgFrequency = (frequencyP1 + frequencyP2) / 2;
    
    if (avgFrequency > 1.5 && avgFrequency < 4) score += 20; // Good planning rhythm
    else if (avgFrequency > 6) score -= 15; // Too frequent, might indicate impulsive buying

    score = Math.min(100, Math.max(0, score));

    let trend: 'improved' | 'worsened' | 'stable' = 'stable';
    if (Math.abs(frequencyP1 - frequencyP2) / Math.max(frequencyP1, frequencyP2) < 0.2) {
      trend = 'stable';
    } else if (frequencyP1 < frequencyP2) {
      trend = 'improved'; // More regular spending
    } else {
      trend = 'worsened';
    }

    let recommendation = '';
    if (score < 40) {
      recommendation = 'Intenta planificar tus gastos semanalmente y mantén categorías consistentes.';
    }

    return {
      name: 'Planificación de Gastos',
      description: 'Regularidad y consistencia en patrones de gasto',
      score: Math.round(score),
      trend,
      icon: '📋',
      recommendation
    };
  }

  private analyzeCategoryManagement(comp: PeriodComparison): FinancialHabit {
    const newCategories = comp.metrics.categoryChanges.filter(c => c.isNew).length;
    const removedCategories = comp.metrics.categoryChanges.filter(c => c.isRemoved).length;
    const totalCategories = comp.period1.data.categoryBreakdown.length;
    
    let score = 60; // Base score
    
    // Stable categories indicate good management
    const stabilityRatio = 1 - (newCategories + removedCategories) / Math.max(totalCategories, 1);
    score += stabilityRatio * 30;
    
    // But some flexibility is good
    if (newCategories === 0 && removedCategories === 0 && totalCategories > 3) {
      score += 10; // Perfect stability with good diversity
    }

    score = Math.min(100, Math.max(0, score));

    let trend: 'improved' | 'worsened' | 'stable' = 'stable';
    if (newCategories > removedCategories) trend = 'worsened'; // Less organized
    else if (removedCategories > newCategories) trend = 'improved'; // More organized

    return {
      name: 'Gestión de Categorías',
      description: 'Organización y consistencia en categorización',
      score: Math.round(score),
      trend,
      icon: '🏷️'
    };
  }

  private analyzeTransactionFrequency(comp: PeriodComparison): FinancialHabit {
    const daysP1 = comp.period1.data.daysWithTransactions;
    const daysP2 = comp.period2.data.daysWithTransactions;
    const transactionsP1 = comp.period1.data.transactionCount;
    const transactionsP2 = comp.period2.data.transactionCount;
    
    // Calculate consistency in transaction frequency
    const freqP1 = daysP1 > 0 ? transactionsP1 / daysP1 : 0;
    const freqP2 = daysP2 > 0 ? transactionsP2 / daysP2 : 0;
    
    let score = 50;
    
    // Ideal frequency: 1-3 transactions per active day
    const avgFreq = (freqP1 + freqP2) / 2;
    if (avgFreq >= 1 && avgFreq <= 3) score += 30;
    else if (avgFreq > 5) score -= 20; // Too frequent

    // Consistency bonus
    const consistency = 1 - Math.abs(freqP1 - freqP2) / Math.max(freqP1, freqP2, 1);
    score += consistency * 20;

    score = Math.min(100, Math.max(0, score));

    let trend: 'improved' | 'worsened' | 'stable' = 'stable';
    const freqChange = Math.abs(freqP1 - freqP2) / Math.max(freqP1, freqP2, 1);
    if (freqChange < 0.1) trend = 'stable';
    else if (freqP1 < freqP2 && avgFreq > 3) trend = 'improved'; // Reducing excessive frequency
    else if (freqP1 > freqP2 && avgFreq < 2) trend = 'improved'; // Increasing low frequency

    return {
      name: 'Frecuencia de Transacciones',
      description: 'Patrones regulares de actividad financiera',
      score: Math.round(score),
      trend,
      icon: '⏱️'
    };
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'improved': return '📈';
      case 'worsened': return '📉';
      default: return '➖';
    }
  }

  getTrendBadgeClass(trend: string): string {
    const base = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium';
    switch (trend) {
      case 'improved': return `${base} bg-green-100 text-green-800`;
      case 'worsened': return `${base} bg-red-100 text-red-800`;
      default: return `${base} bg-gray-100 text-gray-800`;
    }
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  }

  getProgressBarClass(score: number): string {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  }

  getRecommendationClass(trend: string): string {
    switch (trend) {
      case 'improved': return 'border-green-400 bg-green-50';
      case 'worsened': return 'border-red-400 bg-red-50';
      default: return 'border-blue-400 bg-blue-50';
    }
  }

  getOverallMessage(): string {
    const score = this.getOverallScore();
    if (score >= 85) return '🎉 ¡Excelentes hábitos financieros! Eres un ejemplo a seguir.';
    if (score >= 70) return '👍 Buenos hábitos financieros. Pequeños ajustes pueden llevarte al siguiente nivel.';
    if (score >= 50) return '⚖️ Hábitos promedio. Hay margen para mejorar tu disciplina financiera.';
    if (score >= 30) return '⚠️ Tus hábitos necesitan atención. Considera establecer rutinas más consistentes.';
    return '🚨 Es momento de revisar completamente tu estrategia financiera.';
  }
}
