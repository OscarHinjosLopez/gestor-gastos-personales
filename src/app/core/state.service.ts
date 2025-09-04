import { Injectable, signal, computed, inject } from '@angular/core';
import { Expense } from '../models/expense.model';
import { Income } from '../models/income.model';
import { ExpenseService } from './expense.service';
import { IncomeService } from './income.service';
import { LoadingService } from './loading.service';
import { NotificationService } from './notification.service';
import { DataValidator } from '../shared/validation.utils';
import { generateId } from '../utils/id';

@Injectable({ providedIn: 'root' })
export class StateService {
  private _expenses = signal<Expense[]>([]);
  private _incomes = signal<Income[]>([]);
  private _error = signal<string | null>(null);

  expenses = this._expenses.asReadonly();
  incomes = this._incomes.asReadonly();
  error = this._error.asReadonly();

  balance = computed(
    () =>
      this._incomes().reduce((s, i) => s + (i.amount ?? 0), 0) -
      this._expenses().reduce((s, e) => s + (e.amount ?? 0), 0)
  );

  private expSvc = inject(ExpenseService);
  private incSvc = inject(IncomeService);
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);

  constructor() {
    this.loadAll();
  }

  async loadAll(): Promise<void> {
    try {
      this._error.set(null);
      const [exps, incs] = await this.loadingService.wrap(
        'initial-load',
        Promise.all([this.expSvc.getAll(), this.incSvc.getAll()])
      );

      this._expenses.set(exps || []);
      this._incomes.set(incs || []);

      this.notificationService.success('Datos cargados correctamente');
    } catch (error) {
      const errorMessage = 'Error al cargar los datos';
      this._error.set(errorMessage);
      this.notificationService.error(errorMessage);
      console.error('Error loading data:', error);
    }
  }

  async addExpense(payload: Omit<Expense, 'id'>): Promise<Expense | null> {
    try {
      this._error.set(null);

      // Validate data
      const validation = DataValidator.validateExpense(payload);
      if (!validation.isValid) {
        validation.errors.forEach((error) =>
          this.notificationService.error(error)
        );
        return null;
      }

      // Sanitize data
      const sanitizedPayload = {
        ...payload,
        amount: DataValidator.sanitizeAmount(payload.amount),
        category: DataValidator.sanitizeString(payload.category),
        notes: DataValidator.sanitizeString(payload.notes || ''),
      };

      const item: Expense = { ...sanitizedPayload, id: generateId() };

      await this.loadingService.wrapExpenseOperation(
        'create',
        this.expSvc.create(item)
      );

      this._expenses.update((arr) => [...arr, item]);
      this.notificationService.success('Gasto agregado correctamente');

      return item;
    } catch (error) {
      const errorMessage = 'Error al agregar el gasto';
      this._error.set(errorMessage);
      this.notificationService.error(errorMessage);
      console.error('Error adding expense:', error);
      return null;
    }
  }

  async updateExpense(item: Expense): Promise<boolean> {
    try {
      this._error.set(null);

      // Validate data
      const validation = DataValidator.validateExpense(item);
      if (!validation.isValid) {
        validation.errors.forEach((error) =>
          this.notificationService.error(error)
        );
        return false;
      }

      await this.loadingService.wrapExpenseOperation(
        'update',
        this.expSvc.update(item)
      );

      this._expenses.update((arr) =>
        arr.map((e) => (e.id === item.id ? item : e))
      );

      this.notificationService.success('Gasto actualizado correctamente');
      return true;
    } catch (error) {
      const errorMessage = 'Error al actualizar el gasto';
      this._error.set(errorMessage);
      this.notificationService.error(errorMessage);
      console.error('Error updating expense:', error);
      return false;
    }
  }

  async deleteExpense(id: string): Promise<boolean> {
    try {
      this._error.set(null);

      await this.loadingService.wrapExpenseOperation(
        'delete',
        this.expSvc.delete(id)
      );

      this._expenses.update((arr) => arr.filter((e) => e.id !== id));
      this.notificationService.success('Gasto eliminado correctamente');

      return true;
    } catch (error) {
      const errorMessage = 'Error al eliminar el gasto';
      this._error.set(errorMessage);
      this.notificationService.error(errorMessage);
      console.error('Error deleting expense:', error);
      return false;
    }
  }

  async addIncome(payload: Omit<Income, 'id'>): Promise<Income | null> {
    try {
      this._error.set(null);

      // Validate data
      const validation = DataValidator.validateIncome(payload);
      if (!validation.isValid) {
        validation.errors.forEach((error) =>
          this.notificationService.error(error)
        );
        return null;
      }

      // Sanitize data
      const sanitizedPayload = {
        ...payload,
        amount: DataValidator.sanitizeAmount(payload.amount),
        source: DataValidator.sanitizeString(payload.source),
        notes: DataValidator.sanitizeString(payload.notes || ''),
      };

      const item: Income = { ...sanitizedPayload, id: generateId() };

      await this.loadingService.wrapIncomeOperation(
        'create',
        this.incSvc.create(item)
      );

      this._incomes.update((arr) => [...arr, item]);
      this.notificationService.success('Ingreso agregado correctamente');

      return item;
    } catch (error) {
      const errorMessage = 'Error al agregar el ingreso';
      this._error.set(errorMessage);
      this.notificationService.error(errorMessage);
      console.error('Error adding income:', error);
      return null;
    }
  }

  async updateIncome(item: Income): Promise<boolean> {
    try {
      this._error.set(null);

      // Validate data
      const validation = DataValidator.validateIncome(item);
      if (!validation.isValid) {
        validation.errors.forEach((error) =>
          this.notificationService.error(error)
        );
        return false;
      }

      await this.loadingService.wrapIncomeOperation(
        'update',
        this.incSvc.update(item)
      );

      this._incomes.update((arr) =>
        arr.map((i) => (i.id === item.id ? item : i))
      );

      this.notificationService.success('Ingreso actualizado correctamente');
      return true;
    } catch (error) {
      const errorMessage = 'Error al actualizar el ingreso';
      this._error.set(errorMessage);
      this.notificationService.error(errorMessage);
      console.error('Error updating income:', error);
      return false;
    }
  }

  async deleteIncome(id: string): Promise<boolean> {
    try {
      this._error.set(null);

      await this.loadingService.wrapIncomeOperation(
        'delete',
        this.incSvc.delete(id)
      );

      this._incomes.update((arr) => arr.filter((i) => i.id !== id));
      this.notificationService.success('Ingreso eliminado correctamente');

      return true;
    } catch (error) {
      const errorMessage = 'Error al eliminar el ingreso';
      this._error.set(errorMessage);
      this.notificationService.error(errorMessage);
      console.error('Error deleting income:', error);
      return false;
    }
  }

  // Utility methods for better UX
  isLoading(): boolean {
    return this.loadingService.isAnyLoading();
  }

  clearError(): void {
    this._error.set(null);
  }
}
