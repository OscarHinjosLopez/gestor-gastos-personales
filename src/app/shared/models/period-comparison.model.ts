export interface DateRange {
  start: string; // ISO date string YYYY-MM-DD
  end: string; // ISO date string YYYY-MM-DD
  label?: string; // Optional human-readable label
}

export interface PeriodData {
  totalIncomes: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
  averageDailyExpense: number;
  averageDailyIncome: number;
  categoryBreakdown: CategoryData[];
  sourceBreakdown: SourceData[];
  topCategory?: CategoryData;
  topSource?: SourceData;
  daysWithTransactions: number;
  savingsRate: number; // Percentage
}

export interface CategoryData {
  name: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface SourceData {
  name: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface PeriodComparison {
  period1: {
    range: DateRange;
    data: PeriodData;
  };
  period2: {
    range: DateRange;
    data: PeriodData;
  };
  metrics: ComparisonMetrics;
  insights: ComparisonInsight[];
}

export interface ComparisonMetrics {
  incomeDelta: DeltaMetric;
  expenseDelta: DeltaMetric;
  balanceDelta: DeltaMetric;
  transactionCountDelta: DeltaMetric;
  averageDailyExpenseDelta: DeltaMetric;
  averageDailyIncomeDelta: DeltaMetric;
  savingsRateDelta: DeltaMetric;
  categoryChanges: CategoryComparison[];
  sourceChanges: SourceComparison[];
}

export interface DeltaMetric {
  absolute: number; // Difference in absolute terms
  percentage: number; // Percentage change
  trend: 'up' | 'down' | 'stable';
  significance: 'high' | 'medium' | 'low';
}

export interface CategoryComparison {
  name: string;
  period1Amount: number;
  period2Amount: number;
  delta: DeltaMetric;
  isNew: boolean; // Category didn't exist in period1
  isRemoved: boolean; // Category existed in period1 but not in period2
}

export interface SourceComparison {
  name: string;
  period1Amount: number;
  period2Amount: number;
  delta: DeltaMetric;
  isNew: boolean;
  isRemoved: boolean;
}

export interface ComparisonInsight {
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  category: 'income' | 'expense' | 'balance' | 'behavior' | 'trend';
  title: string;
  description: string;
  value?: number;
  percentage?: number;
  priority: 'high' | 'medium' | 'low';
}

export interface ComparisonFilter {
  categories?: string[];
  sources?: string[];
  minAmount?: number;
  maxAmount?: number;
  includeZeroValues?: boolean;
}

export type PeriodPreset = {
  id: string;
  label: string;
  description: string;
  getPeriods: () => { period1: DateRange; period2: DateRange };
};

export const PERIOD_PRESETS: PeriodPreset[] = [
  {
    id: 'this-vs-last-month',
    label: 'Este mes vs Mes anterior',
    description: 'Compara el mes actual con el mes anterior',
    getPeriods: () => {
      const now = new Date();
      const thisMonth = {
        start: new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split('T')[0],
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString()
          .split('T')[0],
        label: 'Este mes',
      };
      const lastMonth = {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1)
          .toISOString()
          .split('T')[0],
        end: new Date(now.getFullYear(), now.getMonth(), 0)
          .toISOString()
          .split('T')[0],
        label: 'Mes anterior',
      };
      return { period1: thisMonth, period2: lastMonth };
    },
  },
  {
    id: 'last-vs-previous-month',
    label: 'Mes anterior vs Antepenúltimo',
    description: 'Compara el mes anterior con el antepenúltimo mes',
    getPeriods: () => {
      const now = new Date();
      const lastMonth = {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1)
          .toISOString()
          .split('T')[0],
        end: new Date(now.getFullYear(), now.getMonth(), 0)
          .toISOString()
          .split('T')[0],
        label: 'Mes anterior',
      };
      const previousMonth = {
        start: new Date(now.getFullYear(), now.getMonth() - 2, 1)
          .toISOString()
          .split('T')[0],
        end: new Date(now.getFullYear(), now.getMonth() - 1, 0)
          .toISOString()
          .split('T')[0],
        label: 'Antepenúltimo mes',
      };
      return { period1: lastMonth, period2: previousMonth };
    },
  },
  {
    id: 'this-quarter-vs-last',
    label: 'Este trimestre vs Anterior',
    description: 'Compara el trimestre actual con el anterior',
    getPeriods: () => {
      const now = new Date();
      const currentQuarter = Math.floor(now.getMonth() / 3);

      const thisQuarter = {
        start: new Date(now.getFullYear(), currentQuarter * 3, 1)
          .toISOString()
          .split('T')[0],
        end: new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0)
          .toISOString()
          .split('T')[0],
        label: 'Este trimestre',
      };

      const lastQuarterStart =
        currentQuarter === 0
          ? new Date(now.getFullYear() - 1, 9, 1)
          : new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
      const lastQuarterEnd =
        currentQuarter === 0
          ? new Date(now.getFullYear() - 1, 12, 0)
          : new Date(now.getFullYear(), currentQuarter * 3, 0);

      const lastQuarter = {
        start: lastQuarterStart.toISOString().split('T')[0],
        end: lastQuarterEnd.toISOString().split('T')[0],
        label: 'Trimestre anterior',
      };

      return { period1: thisQuarter, period2: lastQuarter };
    },
  },
  {
    id: 'this-year-vs-last',
    label: 'Este año vs Año anterior',
    description: 'Compara el año actual con el año anterior',
    getPeriods: () => {
      const now = new Date();
      const thisYear = {
        start: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
        end: new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0],
        label: 'Este año',
      };
      const lastYear = {
        start: new Date(now.getFullYear() - 1, 0, 1)
          .toISOString()
          .split('T')[0],
        end: new Date(now.getFullYear() - 1, 11, 31)
          .toISOString()
          .split('T')[0],
        label: 'Año anterior',
      };
      return { period1: thisYear, period2: lastYear };
    },
  },
  {
    id: 'last-30-vs-previous-30',
    label: 'Últimos 30 vs Anteriores 30 días',
    description: 'Compara los últimos 30 días con los 30 días anteriores',
    getPeriods: () => {
      const now = new Date();
      const last30 = {
        start: new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        end: now.toISOString().split('T')[0],
        label: 'Últimos 30 días',
      };
      const previous30 = {
        start: new Date(now.getTime() - 59 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        end: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        label: 'Anteriores 30 días',
      };
      return { period1: last30, period2: previous30 };
    },
  },
];
