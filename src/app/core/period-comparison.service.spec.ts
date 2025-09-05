import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { PeriodComparisonService } from './period-comparison.service';
import { StateService } from './state.service';
import { LoadingService } from './loading.service';
import { NotificationService } from './notification.service';
import { DateRange, ComparisonFilter } from '../models/period-comparison.model';
import { Expense } from '../models/expense.model';
import { Income } from '../models/income.model';

describe('PeriodComparisonService', () => {
  let service: PeriodComparisonService;
  let mockStateService: jasmine.SpyObj<StateService>;
  let mockLoadingService: jasmine.SpyObj<LoadingService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  const mockExpenses: Expense[] = [
    {
      id: '1',
      amount: 100,
      category: 'Food',
      date: '2025-08-15',
      notes: 'Lunch',
    },
    {
      id: '2',
      amount: 200,
      category: 'Transport',
      date: '2025-08-20',
      notes: 'Gas',
    },
    {
      id: '3',
      amount: 150,
      category: 'Food',
      date: '2025-09-01',
      notes: 'Groceries',
    },
    {
      id: '4',
      amount: 300,
      category: 'Transport',
      date: '2025-09-05',
      notes: 'Car repair',
    },
  ];

  const mockIncomes: Income[] = [
    {
      id: '1',
      amount: 2000,
      source: 'Salary',
      date: '2025-08-01',
      notes: 'Monthly salary',
    },
    {
      id: '2',
      amount: 500,
      source: 'Freelance',
      date: '2025-08-15',
      notes: 'Project work',
    },
    {
      id: '3',
      amount: 2000,
      source: 'Salary',
      date: '2025-09-01',
      notes: 'Monthly salary',
    },
    {
      id: '4',
      amount: 300,
      source: 'Freelance',
      date: '2025-09-03',
      notes: 'Consulting',
    },
  ];

  beforeEach(() => {
    const stateServiceSpy = jasmine.createSpyObj('StateService', [], {
      expenses: signal(mockExpenses),
      incomes: signal(mockIncomes),
    });
    const loadingServiceSpy = jasmine.createSpyObj('LoadingService', ['wrap']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'success',
      'error',
    ]);

    TestBed.configureTestingModule({
      providers: [
        PeriodComparisonService,
        { provide: StateService, useValue: stateServiceSpy },
        { provide: LoadingService, useValue: loadingServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
      ],
    });

    service = TestBed.inject(PeriodComparisonService);
    mockStateService = TestBed.inject(
      StateService
    ) as jasmine.SpyObj<StateService>;
    mockLoadingService = TestBed.inject(
      LoadingService
    ) as jasmine.SpyObj<LoadingService>;
    mockNotificationService = TestBed.inject(
      NotificationService
    ) as jasmine.SpyObj<NotificationService>;

    mockLoadingService.wrap.and.callFake(async (key, promise) => promise);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have null initial comparison', () => {
      expect(service.currentComparison()).toBeNull();
    });

    it('should have default filter', () => {
      const filter = service.currentFilter();
      expect(filter.includeZeroValues).toBe(true);
      expect(filter.categories).toBeUndefined();
      expect(filter.sources).toBeUndefined();
    });

    it('should not be loading initially', () => {
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('comparePeriods', () => {
    const period1: DateRange = {
      start: '2025-08-01',
      end: '2025-08-31',
      label: 'August 2025',
    };

    const period2: DateRange = {
      start: '2025-09-01',
      end: '2025-09-30',
      label: 'September 2025',
    };

    it('should compare periods successfully', async () => {
      await service.comparePeriods(period1, period2);

      const comparison = service.currentComparison();
      expect(comparison).toBeTruthy();
      expect(comparison?.period1.range).toEqual(period1);
      expect(comparison?.period2.range).toEqual(period2);
    });

    it('should calculate period metrics correctly', async () => {
      await service.comparePeriods(period1, period2);

      const comparison = service.currentComparison();
      expect(comparison).toBeTruthy();

      // August: 2 expenses (100 + 200 = 300), 2 incomes (2000 + 500 = 2500)
      expect(comparison?.period1.data.totalExpenses).toBe(300);
      expect(comparison?.period1.data.totalIncomes).toBe(2500);
      expect(comparison?.period1.data.balance).toBe(2200);

      // September: 2 expenses (150 + 300 = 450), 2 incomes (2000 + 300 = 2300)
      expect(comparison?.period2.data.totalExpenses).toBe(450);
      expect(comparison?.period2.data.totalIncomes).toBe(2300);
      expect(comparison?.period2.data.balance).toBe(1850);
    });

    it('should calculate deltas correctly', async () => {
      await service.comparePeriods(period1, period2);

      const comparison = service.currentComparison();
      const metrics = comparison?.metrics;

      expect(metrics?.expenseDelta.absolute).toBe(150); // 450 - 300
      expect(metrics?.expenseDelta.percentage).toBe(50); // 150/300 * 100

      expect(metrics?.incomeDelta.absolute).toBe(-200); // 2300 - 2500
      expect(metrics?.incomeDelta.percentage).toBe(-8); // -200/2500 * 100

      expect(metrics?.balanceDelta.absolute).toBe(-350); // 1850 - 2200
      expect(metrics?.balanceDelta.percentage).toBeCloseTo(-15.91, 1);
    });

    it('should handle empty periods', async () => {
      const emptyPeriod: DateRange = {
        start: '2025-10-01',
        end: '2025-10-31',
        label: 'October 2025',
      };

      await service.comparePeriods(period1, emptyPeriod);

      const comparison = service.currentComparison();
      expect(comparison?.period2.data.totalExpenses).toBe(0);
      expect(comparison?.period2.data.totalIncomes).toBe(0);
      expect(comparison?.period2.data.balance).toBe(0);
    });

    it('should apply filters correctly', async () => {
      const filter: ComparisonFilter = {
        categories: ['Food'],
        includeZeroValues: false,
      };

      await service.comparePeriods(period1, period2, filter);

      const comparison = service.currentComparison();

      // Should only include Food category
      // August: 1 expense (100), September: 1 expense (150)
      expect(comparison?.period1.data.totalExpenses).toBe(100);
      expect(comparison?.period2.data.totalExpenses).toBe(150);
    });

    it('should handle loading states', async () => {
      let isLoadingDuringExecution = false;

      mockLoadingService.wrap.and.callFake(async (key, promise) => {
        isLoadingDuringExecution = service.isLoading();
        return promise;
      });

      await service.comparePeriods(period1, period2);

      expect(mockLoadingService.wrap).toHaveBeenCalledWith(
        'period-comparison',
        jasmine.any(Promise)
      );
      expect(isLoadingDuringExecution).toBe(true);
      expect(service.isLoading()).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockLoadingService.wrap.and.returnValue(
        Promise.reject(new Error('Comparison failed'))
      );

      await service.comparePeriods(period1, period2);

      expect(mockNotificationService.error).toHaveBeenCalledWith(
        'Error al realizar la comparación'
      );
      expect(service.currentComparison()).toBeNull();
    });
  });

  describe('filter management', () => {
    it('should update filter', () => {
      const newFilter: ComparisonFilter = {
        categories: ['Food', 'Transport'],
        minAmount: 100,
        includeZeroValues: false,
      };

      service.updateFilter(newFilter);

      expect(service.currentFilter()).toEqual(newFilter);
    });

    it('should reset filter', () => {
      const customFilter: ComparisonFilter = {
        categories: ['Food'],
        minAmount: 100,
        includeZeroValues: false,
      };

      service.updateFilter(customFilter);
      // Note: resetFilter method doesn't exist, so we test updateFilter with default values
      service.updateFilter({ includeZeroValues: true });

      const filter = service.currentFilter();
      expect(filter.includeZeroValues).toBe(true);
    });
  });

  describe('category and source analysis', () => {
    it('should calculate category changes correctly', async () => {
      const period1: DateRange = {
        start: '2025-08-01',
        end: '2025-08-31',
        label: 'August',
      };
      const period2: DateRange = {
        start: '2025-09-01',
        end: '2025-09-30',
        label: 'September',
      };

      await service.comparePeriods(period1, period2);

      const comparison = service.currentComparison();
      const categoryChanges = comparison?.metrics.categoryChanges;

      expect(categoryChanges).toBeDefined();
      expect(categoryChanges?.length).toBeGreaterThan(0);

      const foodChange = categoryChanges?.find((c) => c.name === 'Food');
      expect(foodChange?.period1Amount).toBe(100);
      expect(foodChange?.period2Amount).toBe(150);
      expect(foodChange?.delta.absolute).toBe(50);
    });

    it('should calculate source changes correctly', async () => {
      const period1: DateRange = {
        start: '2025-08-01',
        end: '2025-08-31',
        label: 'August',
      };
      const period2: DateRange = {
        start: '2025-09-01',
        end: '2025-09-30',
        label: 'September',
      };

      await service.comparePeriods(period1, period2);

      const comparison = service.currentComparison();
      const sourceChanges = comparison?.metrics.sourceChanges;

      expect(sourceChanges).toBeDefined();
      expect(sourceChanges?.length).toBeGreaterThan(0);

      const salaryChange = sourceChanges?.find((s) => s.name === 'Salary');
      expect(salaryChange?.period1Amount).toBe(2000);
      expect(salaryChange?.period2Amount).toBe(2000);
      expect(salaryChange?.delta.absolute).toBe(0);
    });
  });

  describe('insights generation', () => {
    it('should generate meaningful insights', async () => {
      const period1: DateRange = {
        start: '2025-08-01',
        end: '2025-08-31',
        label: 'August',
      };
      const period2: DateRange = {
        start: '2025-09-01',
        end: '2025-09-30',
        label: 'September',
      };

      await service.comparePeriods(period1, period2);

      const comparison = service.currentComparison();
      const insights = comparison?.insights;

      expect(insights).toBeDefined();
      expect(insights?.length).toBeGreaterThan(0);

      // Should have insights about expense and income changes
      const expenseInsight = insights?.find((i) =>
        i.description.includes('gastos')
      );
      const incomeInsight = insights?.find((i) =>
        i.description.includes('ingresos')
      );

      expect(expenseInsight).toBeDefined();
      expect(incomeInsight).toBeDefined();
    });

    it('should categorize insights by type', async () => {
      const period1: DateRange = {
        start: '2025-08-01',
        end: '2025-08-31',
        label: 'August',
      };
      const period2: DateRange = {
        start: '2025-09-01',
        end: '2025-09-30',
        label: 'September',
      };

      await service.comparePeriods(period1, period2);

      const comparison = service.currentComparison();
      const insights = comparison?.insights;

      const types = new Set(insights?.map((i) => i.type));
      expect(types.size).toBeGreaterThan(0);
      expect(Array.from(types)).toContain('warning'); // Should have warning for balance decrease
    });
  });

  describe('edge cases', () => {
    it('should handle zero amounts correctly', async () => {
      // Mock empty state by updating the spy to return empty arrays
      Object.defineProperty(mockStateService, 'expenses', {
        get: () => signal([]),
      });
      Object.defineProperty(mockStateService, 'incomes', {
        get: () => signal([]),
      });

      const period1: DateRange = {
        start: '2025-08-01',
        end: '2025-08-31',
        label: 'August',
      };
      const period2: DateRange = {
        start: '2025-09-01',
        end: '2025-09-30',
        label: 'September',
      };

      await service.comparePeriods(period1, period2);

      const comparison = service.currentComparison();
      expect(comparison?.period1.data.totalExpenses).toBe(0);
      expect(comparison?.period2.data.totalExpenses).toBe(0);
      expect(comparison?.metrics.expenseDelta.percentage).toBe(0);
    });

    it('should handle invalid date ranges', async () => {
      const invalidPeriod: DateRange = {
        start: '2025-12-31',
        end: '2025-01-01',
        label: 'Invalid',
      };
      const validPeriod: DateRange = {
        start: '2025-08-01',
        end: '2025-08-31',
        label: 'Valid',
      };

      await service.comparePeriods(invalidPeriod, validPeriod);

      // Should still create comparison but with zero values for invalid period
      const comparison = service.currentComparison();
      expect(comparison).toBeTruthy();
    });
  });
});
