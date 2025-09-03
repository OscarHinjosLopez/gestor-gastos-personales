import { Pipe, PipeTransform } from '@angular/core';
import { Expense } from '../models/expense.model';

@Pipe({ name: 'filterByMonth', standalone: true })
export class FilterByMonthPipe implements PipeTransform {
  transform(items: Expense[] | null | undefined, monthIso?: string): Expense[] {
    if (!items) return [];
    if (!monthIso) return items;
    const m = new Date(monthIso).getMonth();
    const y = new Date(monthIso).getFullYear();
    return items.filter((i) => {
      const d = new Date(i.date);
      return d.getMonth() === m && d.getFullYear() === y;
    });
  }
}
