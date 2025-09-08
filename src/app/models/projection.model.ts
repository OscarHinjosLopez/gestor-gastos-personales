export interface ExpenseProjection {
  id: string;
  name: string; // Nombre de la proyección (ej: "Proyección Enero 2025")
  startDate: string; // Fecha de inicio de la proyección (ISO)
  endDate: string; // Fecha de fin de la proyección (ISO)
  projectionType: ProjectionType;
  basePeriod?: BasePeriod; // Período base para los cálculos
  categories: CategoryProjection[];
  totalProjectedAmount: number;
  confidence: number; // Nivel de confianza (0-100)
  createdAt: string; // Fecha de creación (ISO)
  updatedAt: string; // Fecha de última actualización (ISO)
  isActive: boolean;
  notes?: string;
}

export interface CategoryProjection {
  category: string;
  historicalAverage: number; // Promedio histórico de gastos
  projectedAmount: number; // Cantidad proyectada
  growthRate: number; // Tasa de crecimiento aplicada (en porcentaje)
  confidence: number; // Nivel de confianza específico para esta categoría
  adjustmentReason?: string; // Razón del ajuste manual si existe
}

export interface BasePeriod {
  startDate: string; // Inicio del período base
  endDate: string; // Fin del período base
  totalMonths: number; // Número de meses considerados
  description: string; // Descripción del período (ej: "Últimos 6 meses")
}

export type ProjectionType =
  | 'historical_average' // Basado en promedio histórico
  | 'trending' // Basado en tendencias
  | 'seasonal' // Considerando estacionalidad
  | 'manual' // Configuración manual
  | 'hybrid'; // Combinación de métodos

export interface ProjectionSettings {
  defaultBasePeriodMonths: number; // Número de meses por defecto para el período base
  defaultGrowthRate: number; // Tasa de crecimiento por defecto
  minimumDataPoints: number; // Mínimo de gastos necesarios para proyección confiable
  confidenceThreshold: number; // Umbral de confianza para mostrar advertencias
  enableSeasonalAdjustment: boolean; // Habilitar ajustes estacionales
  enableTrendAnalysis: boolean; // Habilitar análisis de tendencias
}

export interface ProjectionResult {
  projection: ExpenseProjection;
  breakdown: {
    byCategory: { category: string; amount: number; percentage: number }[];
    byMonth: { month: string; amount: number }[];
    comparison: {
      historical: number;
      projected: number;
      difference: number;
      percentageChange: number;
    };
  };
  warnings: ProjectionWarning[];
  recommendations: string[];
}

export interface ProjectionWarning {
  type:
    | 'low_confidence'
    | 'insufficient_data'
    | 'high_variance'
    | 'seasonal_alert';
  category?: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

// Tipos para el análisis temporal
export interface TimeSeriesPoint {
  date: string;
  amount: number;
  category?: string;
}

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  strength: number; // 0-1, donde 1 es tendencia muy fuerte
  monthlyChange: number; // Cambio promedio mensual
  seasonalPattern?: SeasonalPattern[];
}

export interface SeasonalPattern {
  month: number; // 1-12
  multiplier: number; // Factor de ajuste estacional
  confidence: number;
}
