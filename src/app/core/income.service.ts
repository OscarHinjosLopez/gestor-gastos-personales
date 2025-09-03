import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Income } from '../models/income.model';

@Injectable({ providedIn: 'root' })
export class IncomeService {
  constructor(private storage: StorageService) {}

  getAll() {
    return this.storage.getAll<Income>('incomes');
  }

  create(income: Income) {
    return this.storage.put<Income>('incomes', income);
  }

  update(income: Income) {
    return this.storage.put<Income>('incomes', income);
  }

  delete(id: string) {
    return this.storage.delete('incomes', id);
  }
}
