import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PeriodComparison } from '../../models/period-comparison.model';

interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: 'savings' | 'expense_reduction' | 'income_increase' | 'debt_payment';
  priority: 'high' | 'medium' | 'low';
  progress: number; // 0-100
  status: 'on_track' | 'behind' | 'ahead' | 'completed';
  icon: string;
}

@Component({
  selector: 'app-financial-goals',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule],
  template: `
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span class="text-xl">🎯</span>
          Metas Financieras
        </h3>
        <button
          (click)="showAddGoal.set(!showAddGoal())"
          class="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          {{ showAddGoal() ? 'Cancelar' : '+ Nueva Meta' }}
        </button>
      </div>

      <!-- Add Goal Form -->
      @if (showAddGoal()) {
      <div class="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 class="font-medium text-gray-800 mb-4">Crear Nueva Meta</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de la meta</label>
            <input
              type="text"
              [(ngModel)]="newGoal.name"
              placeholder="Ej: Ahorrar para vacaciones"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de meta</label>
            <select
              [(ngModel)]="newGoal.category"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="savings">Ahorro</option>
              <option value="expense_reduction">Reducir gastos</option>
              <option value="income_increase">Aumentar ingresos</option>
              <option value="debt_payment">Pagar deuda</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Cantidad objetivo (€)</label>
            <input
              type="number"
              [(ngModel)]="newGoal.targetAmount"
              placeholder="1000"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
            <input
              type="date"
              [(ngModel)]="newGoal.deadline"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-4">
          <button
            (click)="showAddGoal.set(false)"
            class="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            (click)="addGoal()"
            class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Crear Meta
          </button>
        </div>
      </div>
      }

      <!-- Goals List -->
      <div class="space-y-4">
        @for (goal of goals(); track goal.id) {
        <div class="border border-gray-200 rounded-lg p-4">
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ goal.icon }}</span>
              <div>
                <h4 class="font-medium text-gray-800">{{ goal.name }}</h4>
                <div class="flex items-center gap-4 text-sm text-gray-600">
                  <span>{{ goal.targetAmount | currency:'EUR':'symbol':'1.0-0' }}</span>
                  <span>•</span>
                  <span>{{ formatDate(goal.deadline) }}</span>
                  <span class="px-2 py-1 rounded-full text-xs" [class]="getPriorityClass(goal.priority)">
                    {{ getPriorityLabel(goal.priority) }}
                  </span>
                </div>
              </div>
            </div>
            <span class="px-3 py-1 rounded-full text-sm font-medium" [class]="getStatusClass(goal.status)">
              {{ getStatusLabel(goal.status) }}
            </span>
          </div>

          <!-- Progress Bar -->
          <div class="mb-3">
            <div class="flex justify-between items-center mb-1">
              <span class="text-sm text-gray-600">Progreso</span>
              <span class="text-sm font-medium">{{ goal.progress }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3">
              <div 
                class="h-3 rounded-full transition-all duration-300"
                [class]="getProgressBarClass(goal.status)"
                [style.width.%]="goal.progress">
              </div>
            </div>
            <div class="flex justify-between items-center mt-1 text-xs text-gray-500">
              <span>{{ goal.currentAmount | currency:'EUR':'symbol':'1.0-0' }}</span>
              <span>{{ goal.targetAmount | currency:'EUR':'symbol':'1.0-0' }}</span>
            </div>
          </div>

          <!-- Goal Analysis -->
          <div class="bg-gray-50 rounded-md p-3">
            <div class="text-sm text-gray-700">
              {{ getGoalAnalysis(goal) }}
            </div>
          </div>
        </div>
        } @empty {
        <div class="text-center py-8 text-gray-500">
          <div class="text-4xl mb-3">🎯</div>
          <p class="text-lg font-medium mb-2">No tienes metas financieras aún</p>
          <p class="text-sm">Crear metas te ayudará a mantener el enfoque en tus objetivos financieros</p>
        </div>
        }
      </div>

      <!-- Suggested Goals based on comparison -->
      @if (getSuggestedGoals().length > 0) {
      <div class="mt-6 border-t border-gray-200 pt-6">
        <h4 class="font-medium text-gray-800 mb-4 flex items-center gap-2">
          <span>💡</span>
          Metas Sugeridas (basadas en tu análisis)
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (suggestion of getSuggestedGoals(); track suggestion.name) {
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-start justify-between">
              <div>
                <h5 class="font-medium text-blue-800">{{ suggestion.name }}</h5>
                <p class="text-sm text-blue-600 mt-1">{{ suggestion.description }}</p>
                <div class="text-xs text-blue-500 mt-2">
                  Meta sugerida: {{ suggestion.targetAmount | currency:'EUR':'symbol':'1.0-0' }}
                </div>
              </div>
              <button
                (click)="applySuggestedGoal(suggestion)"
                class="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Aplicar
              </button>
            </div>
          </div>
          }
        </div>
      </div>
      }
    </div>
  `
})
export class FinancialGoalsComponent {
  @Input() comparison: PeriodComparison | null = null;

  showAddGoal = signal(false);
  goals = signal<FinancialGoal[]>([
    // Example goals
    {
      id: '1',
      name: 'Fondo de emergencia',
      targetAmount: 3000,
      currentAmount: 1200,
      deadline: '2025-12-31',
      category: 'savings',
      priority: 'high',
      progress: 40,
      status: 'on_track',
      icon: '🛡️'
    },
    {
      id: '2', 
      name: 'Reducir gastos en entretenimiento',
      targetAmount: 500, // Amount to save monthly
      currentAmount: 180,
      deadline: '2025-10-31',
      category: 'expense_reduction',
      priority: 'medium',
      progress: 36,
      status: 'behind',
      icon: '🎬'
    }
  ]);

  newGoal = {
    name: '',
    category: 'savings' as 'savings' | 'expense_reduction' | 'income_increase' | 'debt_payment',
    targetAmount: 0,
    deadline: ''
  };

  getSuggestedGoals(): any[] {
    if (!this.comparison) return [];

    const suggestions: any[] = [];

    // Suggest based on savings rate
    if (this.comparison.period1.data.savingsRate < 10) {
      suggestions.push({
        name: 'Mejorar tasa de ahorro',
        description: 'Tu tasa de ahorro actual está por debajo del 10%. Intenta llegar al 15%.',
        targetAmount: Math.round(this.comparison.period1.data.totalIncomes * 0.15),
        category: 'savings'
      });
    }

    // Suggest based on expense categories
    const topCategory = this.comparison.period1.data.categoryBreakdown
      .sort((a: any, b: any) => b.amount - a.amount)[0];
    
    if (topCategory && topCategory.percentage > 40) {
      suggestions.push({
        name: `Reducir gastos en ${topCategory.name}`,
        description: `Esta categoría representa el ${topCategory.percentage.toFixed(1)}% de tus gastos.`,
        targetAmount: Math.round(topCategory.amount * 0.2), // 20% reduction
        category: 'expense_reduction'
      });
    }

    // Suggest income increase if expenses are growing faster than income
    if (this.comparison.metrics.expenseDelta.percentage > this.comparison.metrics.incomeDelta.percentage) {
      suggestions.push({
        name: 'Aumentar ingresos adicionales',
        description: 'Tus gastos crecen más rápido que tus ingresos. Considera ingresos extra.',
        targetAmount: Math.round(this.comparison.period1.data.totalIncomes * 0.1),
        category: 'income_increase'
      });
    }

    return suggestions;
  }

  addGoal(): void {
    if (!this.newGoal.name || !this.newGoal.targetAmount || !this.newGoal.deadline) {
      return;
    }

    const newGoalData: FinancialGoal = {
      id: Date.now().toString(),
      name: this.newGoal.name,
      targetAmount: this.newGoal.targetAmount,
      currentAmount: 0,
      deadline: this.newGoal.deadline,
      category: this.newGoal.category,
      priority: 'medium',
      progress: 0,
      status: 'on_track',
      icon: this.getCategoryIcon(this.newGoal.category)
    };

    this.goals.update(goals => [...goals, newGoalData]);
    
    // Reset form
    this.newGoal = {
      name: '',
      category: 'savings',
      targetAmount: 0,
      deadline: ''
    };
    this.showAddGoal.set(false);
  }

  applySuggestedGoal(suggestion: any): void {
    this.newGoal = {
      name: suggestion.name,
      category: suggestion.category,
      targetAmount: suggestion.targetAmount,
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 3 months from now
    };
    this.showAddGoal.set(true);
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'savings': return '🏦';
      case 'expense_reduction': return '💰';
      case 'income_increase': return '📈';
      case 'debt_payment': return '💳';
      default: return '🎯';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES');
  }

  getPriorityClass(priority: string): string {
    const base = 'px-2 py-1 rounded-full text-xs';
    switch (priority) {
      case 'high': return `${base} bg-red-100 text-red-800`;
      case 'medium': return `${base} bg-yellow-100 text-yellow-800`;
      case 'low': return `${base} bg-green-100 text-green-800`;
      default: return `${base} bg-gray-100 text-gray-800`;
    }
  }

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return 'Media';
    }
  }

  getStatusClass(status: string): string {
    const base = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (status) {
      case 'on_track': return `${base} bg-blue-100 text-blue-800`;
      case 'behind': return `${base} bg-red-100 text-red-800`;
      case 'ahead': return `${base} bg-green-100 text-green-800`;
      case 'completed': return `${base} bg-green-100 text-green-800`;
      default: return `${base} bg-gray-100 text-gray-800`;
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'on_track': return 'En progreso';
      case 'behind': return 'Retrasado';
      case 'ahead': return 'Adelantado';
      case 'completed': return 'Completado';
      default: return 'En progreso';
    }
  }

  getProgressBarClass(status: string): string {
    switch (status) {
      case 'on_track': return 'bg-blue-500';
      case 'behind': return 'bg-red-500';
      case 'ahead': return 'bg-green-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  }

  getGoalAnalysis(goal: FinancialGoal): string {
    if (!this.comparison) return 'Análisis no disponible';

    const deadline = new Date(goal.deadline);
    const now = new Date();
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const remaining = goal.targetAmount - goal.currentAmount;

    if (goal.status === 'completed') {
      return '🎉 ¡Meta completada! Felicitaciones por alcanzar tu objetivo.';
    }

    if (daysLeft < 0) {
      return `⏰ Esta meta venció hace ${Math.abs(daysLeft)} días. Considera actualizarla.`;
    }

    if (goal.category === 'savings') {
      const monthlyNeeded = remaining / Math.max(1, Math.ceil(daysLeft / 30));
      const currentSavings = this.comparison.period1.data.balance;
      
      if (monthlyNeeded <= currentSavings) {
        return `✅ Con tu ahorro actual de ${currentSavings.toFixed(0)}€/mes, alcanzarás la meta fácilmente.`;
      } else {
        return `📊 Necesitas ahorrar ${monthlyNeeded.toFixed(0)}€/mes durante ${Math.ceil(daysLeft / 30)} meses.`;
      }
    }

    if (goal.category === 'expense_reduction') {
      const currentSpending = this.comparison.period1.data.totalExpenses;
      const targetReduction = (goal.targetAmount / goal.currentAmount) * 100;
      
      return `🎯 Para reducir ${goal.targetAmount}€, necesitas disminuir gastos un ${targetReduction.toFixed(1)}%.`;
    }

    return `📅 Tienes ${daysLeft} días para alcanzar esta meta. ¡Sigue así!`;
  }
}
