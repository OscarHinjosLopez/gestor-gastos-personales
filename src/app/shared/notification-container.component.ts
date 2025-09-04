import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../core/notification.service';

@Component({
  selector: 'app-notification-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-2" style="max-width: 400px;">
      @for (notification of notificationService.notifications(); track
      notification.id) {
      <div
        class="flex items-center p-4 rounded-lg shadow-lg border-l-4 animate-slide-in"
        [class]="getNotificationClasses(notification.type)"
        role="alert"
      >
        <div class="flex-shrink-0 mr-3">
          <span class="text-lg">{{
            getNotificationIcon(notification.type)
          }}</span>
        </div>

        <div class="flex-1 min-w-0">
          <p
            class="text-sm font-medium"
            [class]="getTextClasses(notification.type)"
          >
            {{ notification.message }}
          </p>
          @if (notification.action) {
          <button
            class="mt-1 text-xs underline hover:no-underline"
            [class]="getActionClasses(notification.type)"
          >
            {{ notification.action }}
          </button>
          }
        </div>

        <button
          (click)="notificationService.remove(notification.id)"
          class="flex-shrink-0 ml-3 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
          [class]="getCloseButtonClasses(notification.type)"
          aria-label="Cerrar notificación"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            ></path>
          </svg>
        </button>
      </div>
      }
    </div>
  `,
  styles: [
    `
      @keyframes slide-in {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .animate-slide-in {
        animation: slide-in 0.3s ease-out;
      }
    `,
  ],
})
export class NotificationContainerComponent {
  public notificationService = inject(NotificationService);

  getNotificationClasses(type: string): string {
    const baseClasses = 'bg-white border-l-4';

    switch (type) {
      case 'success':
        return `${baseClasses} border-green-500`;
      case 'error':
        return `${baseClasses} border-red-500`;
      case 'warning':
        return `${baseClasses} border-yellow-500`;
      case 'info':
        return `${baseClasses} border-blue-500`;
      default:
        return `${baseClasses} border-gray-500`;
    }
  }

  getTextClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  }

  getActionClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'text-green-600 hover:text-green-800';
      case 'error':
        return 'text-red-600 hover:text-red-800';
      case 'warning':
        return 'text-yellow-600 hover:text-yellow-800';
      case 'info':
        return 'text-blue-600 hover:text-blue-800';
      default:
        return 'text-gray-600 hover:text-gray-800';
    }
  }

  getCloseButtonClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'text-green-600 hover:text-green-800';
      case 'error':
        return 'text-red-600 hover:text-red-800';
      case 'warning':
        return 'text-yellow-600 hover:text-yellow-800';
      case 'info':
        return 'text-blue-600 hover:text-blue-800';
      default:
        return 'text-gray-600 hover:text-gray-800';
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  }
}
