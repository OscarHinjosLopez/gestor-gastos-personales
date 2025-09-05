import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { StateService } from './state.service';
import { ExpenseService } from './expense.service';
import { IncomeService } from './income.service';
import { LoadingService } from './loading.service';
import { NotificationService } from './notification.service';
import { DataValidator } from '../shared/validation.utils';
import { Expense } from '../models/expense.model';
import { Income } from '../models/income.model';

describe('StateService', () => {
  let service: StateService;
  let mockExpenseService: jasmine.SpyObj<ExpenseService>;
  let mockIncomeService: jasmine.SpyObj<IncomeService>;
  let mockLoadingService: jasmine.SpyObj<LoadingService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  const mockExpense: Expense = {
    id: '1',
    amount: 100,
    category: 'Food',
    date: '2025-09-05',
    notes: 'Test expense',
  };

  const mockIncome: Income = {
    id: '1',
    amount: 500,
    source: 'Salary',
    date: '2025-09-05',
    notes: 'Test income',
  };

  beforeEach(() => {
    const expenseServiceSpy = jasmine.createSpyObj('ExpenseService', [
      'getAll',
      'create',
      'update',
      'delete',
    ]);
    const incomeServiceSpy = jasmine.createSpyObj('IncomeService', [
      'getAll',
      'create',
      'update',
      'delete',
    ]);
    const loadingServiceSpy = jasmine.createSpyObj('LoadingService', [
      'wrap',
      'wrapExpenseOperation',
      'wrapIncomeOperation',
      'isAnyLoading',
    ]);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'success',
      'error',
    ]);

    TestBed.configureTestingModule({
      providers: [
        StateService,
        { provide: ExpenseService, useValue: expenseServiceSpy },
        { provide: IncomeService, useValue: incomeServiceSpy },
        { provide: LoadingService, useValue: loadingServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
      ],
    });

    service = TestBed.inject(StateService);
    mockExpenseService = TestBed.inject(
      ExpenseService
    ) as jasmine.SpyObj<ExpenseService>;
    mockIncomeService = TestBed.inject(
      IncomeService
    ) as jasmine.SpyObj<IncomeService>;
    mockLoadingService = TestBed.inject(
      LoadingService
    ) as jasmine.SpyObj<LoadingService>;
    mockNotificationService = TestBed.inject(
      NotificationService
    ) as jasmine.SpyObj<NotificationService>;

    // Setup default spies
    mockLoadingService.wrap.and.returnValue(Promise.resolve([[], []]));
    mockLoadingService.wrapExpenseOperation.and.returnValue(Promise.resolve());
    mockLoadingService.wrapIncomeOperation.and.returnValue(Promise.resolve());
    mockExpenseService.getAll.and.returnValue(Promise.resolve([]));
    mockIncomeService.getAll.and.returnValue(Promise.resolve([]));
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadAll', () => {
    it('should load expenses and incomes successfully', async () => {
      const expenses = [mockExpense];
      const incomes = [mockIncome];

      mockLoadingService.wrap.and.returnValue(
        Promise.resolve([expenses, incomes])
      );

      await service.loadAll();

      expect(service.expenses()).toEqual(expenses);
      expect(service.incomes()).toEqual(incomes);
      expect(mockNotificationService.success).toHaveBeenCalledWith(
        'Datos cargados correctamente'
      );
      expect(service.error()).toBeNull();
    });

    it('should handle load errors', async () => {
      const error = new Error('Load failed');
      mockLoadingService.wrap.and.returnValue(Promise.reject(error));

      await service.loadAll();

      expect(service.error()).toBe('Error al cargar los datos');
      expect(mockNotificationService.error).toHaveBeenCalledWith(
        'Error al cargar los datos'
      );
    });
  });

  describe('addExpense', () => {
    beforeEach(() => {
      spyOn(DataValidator, 'validateExpense').and.returnValue({
        isValid: true,
        errors: [],
      });
      spyOn(DataValidator, 'sanitizeAmount').and.returnValue(100);
      spyOn(DataValidator, 'sanitizeString').and.returnValue('Food');
    });

    it('should add expense successfully', async () => {
      const expensePayload = {
        amount: 100,
        category: 'Food',
        date: '2025-09-05',
        notes: 'Test',
      };
      mockExpenseService.create.and.returnValue(Promise.resolve());

      const result = await service.addExpense(expensePayload);

      expect(result).toBeTruthy();
      expect(result?.amount).toBe(100);
      expect(mockLoadingService.wrapExpenseOperation).toHaveBeenCalledWith(
        'create',
        jasmine.any(Promise)
      );
      expect(mockNotificationService.success).toHaveBeenCalledWith(
        'Gasto agregado correctamente'
      );
    });

    it('should handle validation errors', async () => {
      const expensePayload = {
        amount: -100,
        category: '',
        date: '',
        notes: '',
      };
      (DataValidator.validateExpense as jasmine.Spy).and.returnValue({
        isValid: false,
        errors: ['Amount must be positive'],
      });

      const result = await service.addExpense(expensePayload);

      expect(result).toBeNull();
      expect(mockNotificationService.error).toHaveBeenCalledWith(
        'Amount must be positive'
      );
    });

    it('should handle creation errors', async () => {
      const expensePayload = {
        amount: 100,
        category: 'Food',
        date: '2025-09-05',
        notes: 'Test',
      };
      mockLoadingService.wrapExpenseOperation.and.returnValue(
        Promise.reject(new Error('Creation failed'))
      );

      const result = await service.addExpense(expensePayload);

      expect(result).toBeNull();
      expect(service.error()).toBe('Error al agregar el gasto');
      expect(mockNotificationService.error).toHaveBeenCalledWith(
        'Error al agregar el gasto'
      );
    });
  });

  describe('updateExpense', () => {
    beforeEach(() => {
      spyOn(DataValidator, 'validateExpense').and.returnValue({
        isValid: true,
        errors: [],
      });
    });

    it('should update expense successfully', async () => {
      mockLoadingService.wrapExpenseOperation.and.returnValue(
        Promise.resolve()
      );

      const result = await service.updateExpense(mockExpense);

      expect(result).toBe(true);
      expect(mockLoadingService.wrapExpenseOperation).toHaveBeenCalledWith(
        'update',
        jasmine.any(Promise)
      );
      expect(mockNotificationService.success).toHaveBeenCalledWith(
        'Gasto actualizado correctamente'
      );
    });

    it('should handle validation errors', async () => {
      (DataValidator.validateExpense as jasmine.Spy).and.returnValue({
        isValid: false,
        errors: ['Invalid expense'],
      });

      const result = await service.updateExpense(mockExpense);

      expect(result).toBe(false);
      expect(mockNotificationService.error).toHaveBeenCalledWith(
        'Invalid expense'
      );
    });
  });

  describe('deleteExpense', () => {
    it('should delete expense successfully', async () => {
      mockLoadingService.wrapExpenseOperation.and.returnValue(
        Promise.resolve()
      );

      const result = await service.deleteExpense('1');

      expect(result).toBe(true);
      expect(mockLoadingService.wrapExpenseOperation).toHaveBeenCalledWith(
        'delete',
        jasmine.any(Promise)
      );
      expect(mockNotificationService.success).toHaveBeenCalledWith(
        'Gasto eliminado correctamente'
      );
    });

    it('should handle deletion errors', async () => {
      mockLoadingService.wrapExpenseOperation.and.returnValue(
        Promise.reject(new Error('Delete failed'))
      );

      const result = await service.deleteExpense('1');

      expect(result).toBe(false);
      expect(service.error()).toBe('Error al eliminar el gasto');
    });
  });

  describe('income operations', () => {
    beforeEach(() => {
      spyOn(DataValidator, 'validateIncome').and.returnValue({
        isValid: true,
        errors: [],
      });
      spyOn(DataValidator, 'sanitizeAmount').and.returnValue(500);
      spyOn(DataValidator, 'sanitizeString').and.returnValue('Salary');
    });

    it('should add income successfully', async () => {
      const incomePayload = {
        amount: 500,
        source: 'Salary',
        date: '2025-09-05',
        notes: 'Test',
      };
      mockIncomeService.create.and.returnValue(Promise.resolve());

      const result = await service.addIncome(incomePayload);

      expect(result).toBeTruthy();
      expect(result?.amount).toBe(500);
      expect(mockNotificationService.success).toHaveBeenCalledWith(
        'Ingreso agregado correctamente'
      );
    });

    it('should update income successfully', async () => {
      mockLoadingService.wrapIncomeOperation.and.returnValue(Promise.resolve());

      const result = await service.updateIncome(mockIncome);

      expect(result).toBe(true);
      expect(mockNotificationService.success).toHaveBeenCalledWith(
        'Ingreso actualizado correctamente'
      );
    });

    it('should delete income successfully', async () => {
      mockLoadingService.wrapIncomeOperation.and.returnValue(Promise.resolve());

      const result = await service.deleteIncome('1');

      expect(result).toBe(true);
      expect(mockNotificationService.success).toHaveBeenCalledWith(
        'Ingreso eliminado correctamente'
      );
    });
  });

  describe('computed properties', () => {
    it('should calculate balance correctly', () => {
      // Manually set the signals for testing
      service['_expenses'].set([mockExpense]);
      service['_incomes'].set([mockIncome]);

      expect(service.balance()).toBe(400); // 500 - 100
    });
  });

  describe('utility methods', () => {
    it('should return loading state', () => {
      mockLoadingService.isAnyLoading.and.returnValue(true);
      expect(service.isLoading()).toBe(true);
    });

    it('should clear error', () => {
      service['_error'].set('Some error');
      service.clearError();
      expect(service.error()).toBeNull();
    });
  });
});
