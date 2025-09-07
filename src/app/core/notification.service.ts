import { Injectable, signal } from '@angular/core';

export interface NotificationConfig {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: string;
}

export interface Notification extends NotificationConfig {
  id: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private _notifications = signal<Notification[]>([]);
  notifications = this._notifications.asReadonly();

  show(config: NotificationConfig): string {
    const notification: Notification = {
      ...config,
      id: this.generateId(),
      timestamp: new Date(),
      duration: config.duration ?? 3000,
    };

    this._notifications.update((notifications) => [
      ...notifications,
      notification,
    ]);

    // Auto remove after duration
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.remove(notification.id);
      }, notification.duration);
    }

    return notification.id;
  }

  remove(id: string): void {
    this._notifications.update((notifications) =>
      notifications.filter((n) => n.id !== id)
    );
  }

  clear(): void {
    this._notifications.set([]);
  }

  success(message: string, duration?: number): string {
    return this.show({ message, type: 'success', duration: duration ?? 2000 });
  }

  error(message: string, duration?: number): string {
    return this.show({ message, type: 'error', duration: duration ?? 8000 });
  }

  warning(message: string, duration?: number): string {
    return this.show({ message, type: 'warning', duration });
  }

  info(message: string, duration?: number): string {
    return this.show({ message, type: 'info', duration });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
