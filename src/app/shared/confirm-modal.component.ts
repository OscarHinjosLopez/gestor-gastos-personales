import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ConfirmModalData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
}

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      (click)="onCancel()"
    >
      <!-- Modal -->
      <div
        class="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 transform transition-all"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="p-6 pb-4">
          <div class="flex items-center gap-3">
            <div [class]="getIconClass()">
              {{ getIcon() }}
            </div>
            <h3 class="text-lg font-semibold text-gray-900">
              {{ data.title }}
            </h3>
          </div>
        </div>

        <!-- Content -->
        <div class="px-6 pb-6">
          <p class="text-gray-600">
            {{ data.message }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 px-6 pb-6 justify-end">
          <button
            (click)="onCancel()"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {{ data.cancelText || 'Cancelar' }}
          </button>
          <button
            (click)="onConfirm()"
            [class]="getConfirmButtonClass()"
            class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          >
            {{ data.confirmText || 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>
    }
  `,
})
export class ConfirmModalComponent {
  @Input() isOpen = false;
  @Input() data: ConfirmModalData = {
    title: 'Confirmar acción',
    message: '¿Estás seguro?',
  };

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  getIcon(): string {
    switch (this.data.type) {
      case 'danger':
        return '⚠️';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❓';
    }
  }

  getIconClass(): string {
    const base = 'text-2xl flex-shrink-0';
    switch (this.data.type) {
      case 'danger':
        return `${base} text-red-500`;
      case 'warning':
        return `${base} text-yellow-500`;
      case 'info':
        return `${base} text-blue-500`;
      default:
        return `${base} text-gray-500`;
    }
  }

  getConfirmButtonClass(): string {
    switch (this.data.type) {
      case 'danger':
        return 'bg-red-600 text-white hover:bg-red-700';
      case 'warning':
        return 'bg-yellow-600 text-white hover:bg-yellow-700';
      case 'info':
        return 'bg-blue-600 text-white hover:bg-blue-700';
      default:
        return 'bg-gray-600 text-white hover:bg-gray-700';
    }
  }

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
