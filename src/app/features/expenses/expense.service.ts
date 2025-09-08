import { Injectable, inject } from '@angular/core';
import { StorageService } from '../../core/storage.service';
import { Expense } from '../../shared/models/expense.model';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private storage = inject(StorageService);

  getAll() {
    return this.storage.getAll<Expense>('expenses');
  }

  create(expense: Expense) {
    return this.storage.put<Expense>('expenses', expense);
  }

  update(expense: Expense) {
    return this.storage.put<Expense>('expenses', expense);
  }

  delete(id: string) {
    return this.storage.delete('expenses', id);
  }
}
