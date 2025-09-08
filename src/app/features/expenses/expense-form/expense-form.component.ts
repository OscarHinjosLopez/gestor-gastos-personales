import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { StateService } from '../../../core/state.service';

@Component({
  selector: 'app-expense-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        ➕ Agregar Nuevo Gasto
      </h3>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Importe -->
          <div>
            <label
              for="amount"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Importe *
            </label>
            <div class="relative">
              <div
                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              >
                <span class="text-gray-500 text-sm">€</span>
              </div>
              <input
                id="amount"
                formControlName="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                class="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                [class.border-red-500]="
                  form.get('amount')?.invalid && form.get('amount')?.touched
                "
              />
            </div>
            @if (form.get('amount')?.invalid && form.get('amount')?.touched) {
            <p class="mt-1 text-sm text-red-600">
              El importe es requerido y debe ser mayor a 0
            </p>
            }
          </div>

          <!-- Fecha -->
          <div>
            <label
              for="date"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Fecha *
            </label>
            <input
              id="date"
              formControlName="date"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              [class.border-red-500]="
                form.get('date')?.invalid && form.get('date')?.touched
              "
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Categoría -->
          <div>
            <label
              for="category"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Categoría *
            </label>
            <select
              id="category"
              formControlName="category"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              [class.border-red-500]="
                form.get('category')?.invalid && form.get('category')?.touched
              "
            >
              <option value="">Selecciona una categoría</option>
              @for (cat of expenseCategories; track cat) {
              <option [value]="cat">{{ cat }}</option>
              }
            </select>
            @if (form.get('category')?.invalid && form.get('category')?.touched)
            {
            <p class="mt-1 text-sm text-red-600">La categoría es requerida</p>
            }
          </div>

          <!-- Notas -->
          <div>
            <label
              for="notes"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Notas (opcional)
            </label>
            <textarea
              id="notes"
              formControlName="notes"
              rows="2"
              placeholder="Descripción adicional..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            ></textarea>
          </div>
        </div>

        <!-- Botón de envío -->
        <div class="flex justify-end pt-4">
          <button
            type="submit"
            [disabled]="form.invalid || isSubmitting"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            @if (isSubmitting) {
            <svg
              class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Guardando... } @else { 💰 Agregar Gasto }
          </button>
        </div>
      </form>
    </div>
  `,
})
export class ExpenseFormComponent {
  private fb = inject(FormBuilder);
  private state = inject(StateService);

  isSubmitting = false;

  expenseCategories = [
    'Alimentación',
    'Transporte',
    'Vivienda',
    'Entretenimiento',
    'Salud',
    'Educación',
    'Ropa',
    'Tecnología',
    'Otros',
  ];

  form = this.fb.group({
    amount: [null, [Validators.required, Validators.min(0.01)]],
    date: [new Date().toISOString().slice(0, 10), [Validators.required]],
    category: ['', [Validators.required]],
    notes: [''],
  });

  async onSubmit() {
    if (this.form.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      try {
        const raw = this.form.value;
        if (raw.amount && raw.date && raw.category) {
          await this.state.addExpense({
            amount: Number(raw.amount),
            date: raw.date,
            category: raw.category,
            notes: raw.notes || '',
          });
        }
        this.form.reset({
          date: new Date().toISOString().slice(0, 10),
          category: '',
          notes: '',
        });
      } finally {
        this.isSubmitting = false;
      }
    }
  }
}
