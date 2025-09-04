import { Pipe, PipeTransform } from '@angular/core';
import { Expense } from '../models/expense.model';
import { Income } from '../models/income.model';

@Pipe({
  name: 'sanitize',
  standalone: true,
})
export class SanitizePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';

    // Basic XSS protection
    return value
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}

export class DataValidator {
  static isValidAmount(amount: number | null | undefined): boolean {
    return (
      typeof amount === 'number' &&
      !isNaN(amount) &&
      isFinite(amount) &&
      amount > 0 &&
      amount <= 999999999
    ); // Max reasonable amount
  }

  static isValidDate(date: string | null | undefined): boolean {
    if (!date) return false;

    const dateObj = new Date(date);
    const now = new Date();
    const minDate = new Date('1900-01-01');
    const maxDate = new Date(now.getFullYear() + 10, 11, 31); // 10 years in future

    return (
      !isNaN(dateObj.getTime()) && dateObj >= minDate && dateObj <= maxDate
    );
  }

  static isValidCategory(category: string | null | undefined): boolean {
    if (!category) return false;

    return (
      category.length >= 2 &&
      category.length <= 50 &&
      /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s\-_0-9]+$/.test(category)
    );
  }

  static isValidNotes(notes: string | null | undefined): boolean {
    if (!notes) return true; // Notes are optional

    return notes.length <= 500; // Max length
  }

  static sanitizeString(value: string | null | undefined): string {
    if (!value) return '';

    return value
      .trim()
      .replace(/\s+/g, ' ') // Multiple spaces to single
      .substring(0, 500); // Max length
  }

  static sanitizeAmount(amount: number | null | undefined): number {
    if (amount === null || amount === undefined || !this.isValidAmount(amount)) return 0;

    // Round to 2 decimal places
    return Math.round(amount * 100) / 100;
  }

  static validateExpense(expense: Partial<Expense>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.isValidAmount(expense.amount)) {
      errors.push('El importe debe ser un número válido mayor a 0');
    }

    if (!this.isValidDate(expense.date)) {
      errors.push('La fecha debe ser válida y dentro de un rango razonable');
    }

    if (!this.isValidCategory(expense.category)) {
      errors.push('La categoría debe tener entre 2 y 50 caracteres');
    }

    if (!this.isValidNotes(expense.notes)) {
      errors.push('Las notas no pueden exceder 500 caracteres');
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateIncome(income: Partial<Income>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.isValidAmount(income.amount)) {
      errors.push('El importe debe ser un número válido mayor a 0');
    }

    if (!this.isValidDate(income.date)) {
      errors.push('La fecha debe ser válida y dentro de un rango razonable');
    }

    if (income.source && !this.isValidCategory(income.source)) {
      errors.push('La fuente debe tener entre 2 y 50 caracteres');
    }

    if (!this.isValidNotes(income.notes)) {
      errors.push('Las notas no pueden exceder 500 caracteres');
    }

    return { isValid: errors.length === 0, errors };
  }
}
