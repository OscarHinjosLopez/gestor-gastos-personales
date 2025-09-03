import { Pipe, PipeTransform } from '@angular/core';
import { Expense } from '../models/expense.model';

@Pipe({ name: 'filterByCategory', standalone: true })
export class FilterByCategoryPipe implements PipeTransform {
  transform(items: Expense[] | null | undefined, category?: string): Expense[] {
    if (!items) return [];
    if (!category) return items;
    return items.filter((i) => i.category === category);
  }
}
