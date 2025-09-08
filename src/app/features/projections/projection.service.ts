import { Injectable, inject, computed, signal } from '@angular/core';
import { StorageService } from '../../core/storage.service';
import { ExpenseService } from '../expenses/expense.service';
import { Expense } from '../../shared/models/expense.model';
import {
  ExpenseProjection,
  CategoryProjection,
  ProjectionResult,
  ProjectionType,
  ProjectionSettings,
  ProjectionWarning,
  TrendAnalysis,
  TimeSeriesPoint,
  SeasonalPattern,
  BasePeriod,
} from '../../shared/models/projection.model';
import {
  validateExpenseProjection,
  validateCreateProjection,
  CreateProjectionData,
  UpdateProjectionData,
  validateUpdateProjection,
} from '../../shared/utils/projection-validation.utils';
import { generateId } from '../../shared/utils/id';

@Injectable({ providedIn: 'root' })
export class ProjectionService {
  private storage = inject(StorageService);
  private expenseService = inject(ExpenseService);

  // Señal reactiva para las proyecciones
  private projectionsSignal = signal<ExpenseProjection[]>([]);

  // Configuración por defecto
  private defaultSettings: ProjectionSettings = {
    defaultBasePeriodMonths: 6,
    defaultGrowthRate: 0,
    minimumDataPoints: 3,
    confidenceThreshold: 70,
    enableSeasonalAdjustment: true,
    enableTrendAnalysis: true,
  };

  // Computed para obtener proyecciones reactivamente
  projections = computed(() => this.projectionsSignal());
  activeProjections = computed(() =>
    this.projections().filter((p) => p.isActive)
  );

  constructor() {
    this.loadProjections();
  }

  // Cargar proyecciones desde el storage
  private async loadProjections() {
    const projections = await this.storage.getAll<ExpenseProjection>(
      'projections'
    );
    this.projectionsSignal.set(projections || []);
  }

  // Obtener todas las proyecciones
  getAll(): ExpenseProjection[] {
    return this.projections();
  }

  // Obtener proyección por ID
  getById(id: string): ExpenseProjection | undefined {
    return this.projections().find((p) => p.id === id);
  }

  // Crear nueva proyección
  async createProjection(
    data: CreateProjectionData
  ): Promise<ProjectionResult> {
    const validation = validateCreateProjection(data);
    if (!validation.success) {
      throw new Error(
        `Datos de proyección inválidos: ${validation.error.message}`
      );
    }

    const expenses = await this.expenseService.getAll();
    const basePeriod = this.calculateBasePeriod(
      data.basePeriodMonths || this.defaultSettings.defaultBasePeriodMonths
    );
    const historicalData = this.filterExpensesByPeriod(
      expenses || [],
      basePeriod
    );

    // Calcular proyecciones por categoría
    const categories = await this.calculateCategoryProjections(
      historicalData,
      data.projectionType,
      new Date(data.startDate),
      new Date(data.endDate)
    );

    const projection: ExpenseProjection = {
      id: generateId(),
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      projectionType: data.projectionType,
      basePeriod,
      categories,
      totalProjectedAmount: categories.reduce(
        (sum, cat) => sum + cat.projectedAmount,
        0
      ),
      confidence: this.calculateOverallConfidence(categories),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      notes: data.notes,
    };

    // Validar la proyección completa
    const projectionValidation = validateExpenseProjection(projection);
    if (!projectionValidation.success) {
      throw new Error(
        `Proyección generada inválida: ${projectionValidation.error.message}`
      );
    }

    // Guardar proyección
    await this.storage.put('projections', projection);
    await this.loadProjections();

    // Generar resultado completo
    return this.generateProjectionResult(projection, historicalData);
  }

  // Actualizar proyección existente
  async updateProjection(
    data: UpdateProjectionData
  ): Promise<ExpenseProjection> {
    const validation = validateUpdateProjection(data);
    if (!validation.success) {
      throw new Error(
        `Datos de actualización inválidos: ${validation.error.message}`
      );
    }

    const existing = this.getById(data.id);
    if (!existing) {
      throw new Error('Proyección no encontrada');
    }

    const updated: ExpenseProjection = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    // Recalcular total si se actualizaron las categorías
    if (data.categories) {
      updated.totalProjectedAmount = data.categories.reduce(
        (sum, cat) => sum + cat.projectedAmount,
        0
      );
      updated.confidence = this.calculateOverallConfidence(data.categories);
    }

    this.storage.put('projections', updated);
    await this.loadProjections();

    return updated;
  }

  // Eliminar proyección
  async deleteProjection(id: string): Promise<boolean> {
    try {
      await this.storage.delete('projections', id);
      await this.loadProjections();
      return true;
    } catch {
      return false;
    }
  }

  // Calcular período base para análisis histórico
  private calculateBasePeriod(months: number): BasePeriod {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalMonths: months,
      description: `Últimos ${months} meses`,
    };
  }

  // Filtrar gastos por período
  private filterExpensesByPeriod(
    expenses: Expense[],
    period: BasePeriod
  ): Expense[] {
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);

    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= start && expenseDate <= end;
    });
  }

  // Calcular proyecciones por categoría
  private async calculateCategoryProjections(
    historicalData: Expense[],
    projectionType: ProjectionType,
    startDate: Date,
    endDate: Date
  ): Promise<CategoryProjection[]> {
    const categories = this.getUniqueCategories(historicalData);
    const projectionMonths = this.getMonthsDifference(startDate, endDate);

    const categoryProjections: CategoryProjection[] = [];

    for (const category of categories) {
      const categoryExpenses = historicalData.filter(
        (e) => e.category === category
      );
      const historicalAverage = this.calculateMonthlyAverage(categoryExpenses);

      let projectedAmount: number;
      let confidence: number;
      let adjustmentReason: string | undefined;

      switch (projectionType) {
        case 'historical_average':
          projectedAmount = historicalAverage * projectionMonths;
          confidence = this.calculateConfidenceForCategory(categoryExpenses);
          break;

        case 'trending':
          const trend = this.calculateTrend(categoryExpenses);
          projectedAmount = this.applyTrend(
            historicalAverage,
            trend,
            projectionMonths
          );
          confidence =
            this.calculateConfidenceForCategory(categoryExpenses) *
            (1 - trend.strength * 0.2);
          adjustmentReason = `Aplicada tendencia ${trend.direction}`;
          break;

        case 'seasonal':
          const seasonalAdjustment = this.calculateSeasonalAdjustment(
            categoryExpenses,
            startDate,
            endDate
          );
          projectedAmount =
            historicalAverage * projectionMonths * seasonalAdjustment;
          confidence =
            this.calculateConfidenceForCategory(categoryExpenses) * 0.9;
          adjustmentReason = 'Aplicado ajuste estacional';
          break;

        case 'hybrid':
          const trendResult = this.calculateTrend(categoryExpenses);
          const seasonal = this.calculateSeasonalAdjustment(
            categoryExpenses,
            startDate,
            endDate
          );
          projectedAmount = this.applyTrend(
            historicalAverage * seasonal,
            trendResult,
            projectionMonths
          );
          confidence =
            this.calculateConfidenceForCategory(categoryExpenses) * 0.85;
          adjustmentReason = 'Combinación de tendencia y estacionalidad';
          break;

        default: // manual
          projectedAmount = historicalAverage * projectionMonths;
          confidence = 50; // Confianza media para ajuste manual
          adjustmentReason = 'Proyección base para ajuste manual';
      }

      categoryProjections.push({
        category,
        historicalAverage,
        projectedAmount: Math.round(projectedAmount * 100) / 100,
        growthRate: this.calculateGrowthRate(
          historicalAverage * projectionMonths,
          projectedAmount
        ),
        confidence: Math.round(confidence),
        adjustmentReason,
      });
    }

    return categoryProjections;
  }

  // Obtener categorías únicas de los gastos
  private getUniqueCategories(expenses: Expense[]): string[] {
    return [...new Set(expenses.map((e) => e.category))];
  }

  // Calcular promedio mensual para una categoría
  private calculateMonthlyAverage(expenses: Expense[]): number {
    if (expenses.length === 0) return 0;

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const months = this.getUniqueMonths(expenses).length || 1;

    return total / months;
  }

  // Obtener meses únicos en los gastos
  private getUniqueMonths(expenses: Expense[]): string[] {
    const months = expenses.map((e) => {
      const date = new Date(e.date);
      return `${date.getFullYear()}-${date.getMonth()}`;
    });
    return [...new Set(months)];
  }

  // Calcular diferencia en meses entre dos fechas
  private getMonthsDifference(start: Date, end: Date): number {
    return (
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth()) +
      1
    );
  }

  // Calcular tendencia de gastos
  private calculateTrend(expenses: Expense[]): TrendAnalysis {
    const monthlyData = this.groupByMonth(expenses);
    const values = Object.values(monthlyData);

    if (values.length < 2) {
      return {
        direction: 'stable',
        strength: 0,
        monthlyChange: 0,
      };
    }

    // Calcular regresión lineal simple
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // Calcular R² para determinar la fuerza de la tendencia
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, yi, i) => {
      const yPred = slope * x[i] + (sumY - slope * sumX) / n;
      return sum + Math.pow(yi - yPred, 2);
    }, 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

    return {
      direction:
        slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable',
      strength: Math.min(Math.abs(rSquared), 1),
      monthlyChange: slope,
    };
  }

  // Agrupar gastos por mes
  private groupByMonth(expenses: Expense[]): { [key: string]: number } {
    return expenses.reduce((acc, expense) => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}`;
      acc[monthKey] = (acc[monthKey] || 0) + expense.amount;
      return acc;
    }, {} as { [key: string]: number });
  }

  // Aplicar tendencia a la proyección
  private applyTrend(
    baseAmount: number,
    trend: TrendAnalysis,
    months: number
  ): number {
    if (trend.direction === 'stable') return baseAmount * months;

    const monthlyChange = trend.monthlyChange * trend.strength;
    let total = 0;

    for (let i = 0; i < months; i++) {
      total += baseAmount + monthlyChange * i;
    }

    return total;
  }

  // Calcular ajuste estacional
  private calculateSeasonalAdjustment(
    expenses: Expense[],
    startDate: Date,
    endDate: Date
  ): number {
    // Simplificado: ajuste básico por temporada
    const startMonth = startDate.getMonth();
    const endMonth = endDate.getMonth();

    // Patrones estacionales básicos (se puede mejorar con más datos históricos)
    const seasonalMultipliers = [
      1.1,
      0.9,
      1.0,
      1.0,
      1.0,
      1.0, // Enero alto, febrero bajo
      1.1,
      1.0,
      1.0,
      1.0,
      1.2,
      1.3, // Noviembre y diciembre altos (fiestas)
    ];

    const avgMultiplier = seasonalMultipliers
      .slice(startMonth, endMonth + 1)
      .reduce((sum, mult, _, arr) => sum + mult / arr.length, 0);

    return avgMultiplier || 1.0;
  }

  // Calcular confianza para una categoría
  private calculateConfidenceForCategory(expenses: Expense[]): number {
    if (expenses.length < this.defaultSettings.minimumDataPoints) {
      return 30; // Baja confianza por pocos datos
    }

    const amounts = expenses.map((e) => e.amount);
    const mean =
      amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const variance =
      amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) /
      amounts.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;

    // Convertir coeficiente de variación a confianza (0-100)
    const confidence = Math.max(
      0,
      Math.min(100, 100 - coefficientOfVariation * 100)
    );

    return confidence;
  }

  // Calcular confianza general
  private calculateOverallConfidence(categories: CategoryProjection[]): number {
    if (categories.length === 0) return 0;

    const totalAmount = categories.reduce(
      (sum, cat) => sum + cat.projectedAmount,
      0
    );
    const weightedConfidence = categories.reduce((sum, cat) => {
      const weight = cat.projectedAmount / totalAmount;
      return sum + cat.confidence * weight;
    }, 0);

    return Math.round(weightedConfidence);
  }

  // Calcular tasa de crecimiento
  private calculateGrowthRate(base: number, projected: number): number {
    if (base === 0) return 0;
    return ((projected - base) / base) * 100;
  }

  // Generar resultado completo de proyección
  private generateProjectionResult(
    projection: ExpenseProjection,
    historicalData: Expense[]
  ): ProjectionResult {
    const breakdown = this.generateBreakdown(projection, historicalData);
    const warnings = this.generateWarnings(projection);
    const recommendations = this.generateRecommendations(projection, warnings);

    return {
      projection,
      breakdown,
      warnings,
      recommendations,
    };
  }

  // Generar desglose de la proyección
  private generateBreakdown(
    projection: ExpenseProjection,
    historicalData: Expense[]
  ) {
    const total = projection.totalProjectedAmount;

    return {
      byCategory: projection.categories.map((cat) => ({
        category: cat.category,
        amount: cat.projectedAmount,
        percentage: (cat.projectedAmount / total) * 100,
      })),
      byMonth: this.generateMonthlyBreakdown(projection),
      comparison: {
        historical: historicalData.reduce((sum, e) => sum + e.amount, 0),
        projected: total,
        difference:
          total - historicalData.reduce((sum, e) => sum + e.amount, 0),
        percentageChange: this.calculateGrowthRate(
          historicalData.reduce((sum, e) => sum + e.amount, 0),
          total
        ),
      },
    };
  }

  // Generar desglose mensual
  private generateMonthlyBreakdown(projection: ExpenseProjection) {
    const start = new Date(projection.startDate);
    const end = new Date(projection.endDate);
    const months = this.getMonthsDifference(start, end);
    const monthlyAverage = projection.totalProjectedAmount / months;

    const breakdown = [];
    const current = new Date(start);

    for (let i = 0; i < months; i++) {
      breakdown.push({
        month: current.toLocaleString('es-ES', {
          year: 'numeric',
          month: 'long',
        }),
        amount: monthlyAverage,
      });
      current.setMonth(current.getMonth() + 1);
    }

    return breakdown;
  }

  // Generar advertencias
  private generateWarnings(projection: ExpenseProjection): ProjectionWarning[] {
    const warnings: ProjectionWarning[] = [];

    // Advertencia por baja confianza general
    if (projection.confidence < this.defaultSettings.confidenceThreshold) {
      warnings.push({
        type: 'low_confidence',
        message: `La confianza general de la proyección es baja (${projection.confidence}%)`,
        severity: 'medium',
      });
    }

    // Advertencias por categoría
    projection.categories.forEach((cat) => {
      if (cat.confidence < this.defaultSettings.confidenceThreshold) {
        warnings.push({
          type: 'low_confidence',
          category: cat.category,
          message: `Baja confianza en la categoría "${cat.category}" (${cat.confidence}%)`,
          severity: 'low',
        });
      }

      if (Math.abs(cat.growthRate) > 50) {
        warnings.push({
          type: 'high_variance',
          category: cat.category,
          message: `Cambio significativo proyectado en "${
            cat.category
          }": ${cat.growthRate.toFixed(1)}%`,
          severity: cat.growthRate > 100 ? 'high' : 'medium',
        });
      }
    });

    return warnings;
  }

  // Generar recomendaciones
  private generateRecommendations(
    projection: ExpenseProjection,
    warnings: ProjectionWarning[]
  ): string[] {
    const recommendations: string[] = [];

    if (warnings.some((w) => w.type === 'low_confidence')) {
      recommendations.push(
        'Considera recopilar más datos históricos para mejorar la precisión'
      );
    }

    if (warnings.some((w) => w.type === 'high_variance')) {
      recommendations.push(
        'Revisa las categorías con cambios significativos y ajusta manualmente si es necesario'
      );
    }

    if (projection.confidence > 80) {
      recommendations.push(
        'La proyección tiene alta confianza, es adecuada para planificación financiera'
      );
    }

    const highestCategory = projection.categories.reduce((max, cat) =>
      cat.projectedAmount > max.projectedAmount ? cat : max
    );

    recommendations.push(
      `La categoría "${highestCategory.category}" representa el mayor gasto proyectado`
    );

    return recommendations;
  }

  // Obtener configuración actual
  async getSettings(): Promise<ProjectionSettings> {
    try {
      const stored = await this.storage.getAll<
        ProjectionSettings & { id: string }
      >('projection-settings');
      return stored && stored.length > 0 ? stored[0] : this.defaultSettings;
    } catch {
      return this.defaultSettings;
    }
  }

  // Actualizar configuración
  async updateSettings(
    settings: Partial<ProjectionSettings>
  ): Promise<ProjectionSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    const settingsWithId = { ...updated, id: 'default-settings' };
    await this.storage.put('projection-settings', settingsWithId);
    return updated;
  }
}
