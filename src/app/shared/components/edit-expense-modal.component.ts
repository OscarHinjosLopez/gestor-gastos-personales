import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Expense } from '../models/expense.model';

@Component({
  selector: 'app-edit-expense-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen) {
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      (click)="onCancel()"
    >
      <!-- Modal -->
      <div
        class="bg-white rounded-xl shadow-xl max-w-md w-full transform transition-all"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="p-6 pb-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3
              class="text-lg font-semibold text-gray-900 flex items-center gap-2"
            >
              <span class="text-2xl">✏️</span>
              Editar Gasto
            </h3>
            <button
              (click)="onCancel()"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span class="text-xl">×</span>
            </button>
          </div>
        </div>

        <!-- Form -->
        <form (ngSubmit)="onSave()" class="p-6">
          <!-- Monto -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Monto (€)
            </label>
            <input
              type="number"
              [(ngModel)]="amount"
              name="amount"
              step="0.01"
              min="0"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <!-- Categoría -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              [(ngModel)]="category"
              name="category"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Seleccionar categoría</option>
              <option value="Alimentación">🍽️ Alimentación</option>
              <option value="Transporte">🚗 Transporte</option>
              <option value="Vivienda">🏠 Vivienda</option>
              <option value="Entretenimiento">🎬 Entretenimiento</option>
              <option value="Salud">🏥 Salud</option>
              <option value="Educación">📚 Educación</option>
              <option value="Ropa">👕 Ropa</option>
              <option value="Servicios">⚡ Servicios</option>
              <option value="Otros">📦 Otros</option>
            </select>
          </div>

          <!-- Fecha -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Fecha
            </label>
            <input
              type="date"
              [(ngModel)]="date"
              name="date"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <!-- Notas -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Notas (opcional)
            </label>
            <textarea
              [(ngModel)]="notes"
              name="notes"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              placeholder="Descripción adicional..."
            ></textarea>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 justify-end">
            <button
              type="button"
              (click)="onCancel()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              [disabled]="!isFormValid()"
              class="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
    }
  `,
})
export class EditExpenseModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() expense: Expense | null = null;

  @Output() save = new EventEmitter<Expense>();
  @Output() cancel = new EventEmitter<void>();

  // Form properties
  amount: number = 0;
  category: string = '';
  date: string = '';
  notes: string = '';

  ngOnInit(): void {
    if (this.expense) {
      this.amount = this.expense.amount || 0;
      this.category = this.expense.category || '';
      this.date = this.expense.date || '';
      this.notes = this.expense.notes || '';
    }
  }

  ngOnChanges(): void {
    if (this.expense && this.isOpen) {
      this.amount = this.expense.amount || 0;
      this.category = this.expense.category || '';
      this.date = this.expense.date || '';
      this.notes = this.expense.notes || '';
    }
  }

  isFormValid(): boolean {
    return !!(
      this.amount &&
      this.amount > 0 &&
      this.category?.trim() &&
      this.date
    );
  }

  onSave(): void {
    if (this.isFormValid() && this.expense) {
      const updatedExpense: Expense = {
        ...this.expense,
        amount: Number(this.amount),
        category: this.category?.trim() || '',
        date: this.date,
        notes: this.notes?.trim() || '',
      };
      this.save.emit(updatedExpense);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
