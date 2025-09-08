export type AlertType = 'info' | 'warning' | 'danger';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Budget {
  id: string;
  name: string;
  category: string;
  monthlyLimit: number;
  warningThreshold: number; // Percentage (e.g., 80 for 80%)
  dangerThreshold: number; // Percentage (e.g., 95 for 95%)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  budgetName: string;
  category: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  currentAmount: number;
  budgetLimit: number;
  percentageUsed: number;
  isRead: boolean;
  isDismissed: boolean;
  triggeredAt: Date;
  expiresAt?: Date;
}

export interface BudgetStatus {
  budgetId: string;
  budgetName: string;
  category: string;
  currentSpending: number;
  budgetLimit: number;
  remainingAmount: number;
  percentageUsed: number;
  daysRemaining: number;
  projectedOverrun?: number;
  status: 'safe' | 'warning' | 'danger' | 'exceeded';
  alerts: BudgetAlert[];
}

export interface BudgetConfiguration {
  id: string;
  enableNotifications: boolean;
  soundEnabled: boolean;
  emailNotifications: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
  autoCreateMonthlyBudgets: boolean;
  defaultWarningThreshold: number;
  defaultDangerThreshold: number;
  categories: string[];
}

export interface BudgetSummary {
  totalBudgets: number;
  activeBudgets: number;
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  overBudgetCount: number;
  alertsCount: number;
  averageUsagePercentage: number;
}

export interface MonthlyBudgetReport {
  month: string;
  year: number;
  budgets: BudgetStatus[];
  summary: BudgetSummary;
  insights: string[];
  recommendations: string[];
}

// Utility types for budget operations
export type CreateBudgetRequest = Omit<
  Budget,
  'id' | 'createdAt' | 'updatedAt'
>;
export type UpdateBudgetRequest = Partial<CreateBudgetRequest> & { id: string };

// Alert filtering and sorting
export interface AlertFilters {
  type?: AlertType[];
  priority?: AlertPriority[];
  category?: string[];
  isRead?: boolean;
  isDismissed?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface AlertSortOptions {
  field: 'triggeredAt' | 'priority' | 'percentageUsed' | 'category';
  direction: 'asc' | 'desc';
}
