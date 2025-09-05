import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  OnInit,
  OnChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Income } from '../models/income.model';

@Component({
  selector: 'app-edit-income-modal',
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
              Editar Ingreso
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
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <!-- Fuente -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Fuente
            </label>
            <input
              type="text"
              [(ngModel)]="source"
              name="source"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Ej: Salario, Freelance, Bonificación..."
            />
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
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
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
              class="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
export class EditIncomeModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() income: Income | null = null;

  @Output() save = new EventEmitter<Income>();
  @Output() cancel = new EventEmitter<void>();

  // Use regular properties instead of signals for form binding
  amount: number = 0;
  source: string = '';
  date: string = '';
  notes: string = '';

  ngOnInit(): void {
    if (this.income) {
      this.amount = this.income.amount || 0;
      this.source = this.income.source || '';
      this.date = this.income.date || '';
      this.notes = this.income.notes || '';
    }
  }

  ngOnChanges(): void {
    if (this.income && this.isOpen) {
      this.amount = this.income.amount || 0;
      this.source = this.income.source || '';
      this.date = this.income.date || '';
      this.notes = this.income.notes || '';
    }
  }

  isFormValid(): boolean {
    return !!(
      this.amount &&
      this.amount > 0 &&
      this.source?.trim() &&
      this.date
    );
  }

  onSave(): void {
    if (this.isFormValid() && this.income) {
      const updatedIncome: Income = {
        ...this.income,
        amount: Number(this.amount),
        source: this.source?.trim() || '',
        date: this.date,
        notes: this.notes?.trim() || '',
      };
      this.save.emit(updatedIncome);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
