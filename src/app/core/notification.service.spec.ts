import { TestBed } from '@angular/core/testing';
import {
  NotificationService,
  NotificationConfig,
  Notification,
} from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('notification creation', () => {
    it('should add success notification', () => {
      const message = 'Success message';

      service.success(message);

      const notifications = service.notifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].message).toBe(message);
      expect(notifications[0].type).toBe('success');
      expect(notifications[0].id).toBeDefined();
      expect(notifications[0].timestamp).toBeInstanceOf(Date);
    });

    it('should add error notification', () => {
      const message = 'Error message';

      service.error(message);

      const notifications = service.notifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].message).toBe(message);
      expect(notifications[0].type).toBe('error');
    });

    it('should add warning notification', () => {
      const message = 'Warning message';

      service.warning(message);

      const notifications = service.notifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].message).toBe(message);
      expect(notifications[0].type).toBe('warning');
    });

    it('should add info notification', () => {
      const message = 'Info message';

      service.info(message);

      const notifications = service.notifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].message).toBe(message);
      expect(notifications[0].type).toBe('info');
    });

    it('should add custom notification with config', () => {
      const config: NotificationConfig = {
        message: 'Custom notification',
        type: 'success',
        duration: 5000,
        action: 'Undo',
      };

      service.show(config);

      const notifications = service.notifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].message).toBe(config.message);
      expect(notifications[0].type).toBe(config.type);
      expect(notifications[0].duration).toBe(config.duration);
      expect(notifications[0].action).toBe(config.action);
    });
  });

  describe('notification management', () => {
    it('should remove notification by id', () => {
      service.success('Test notification');
      const notifications = service.notifications();
      const notificationId = notifications[0].id;

      service.remove(notificationId);

      expect(service.notifications().length).toBe(0);
    });

    it('should clear all notifications', () => {
      service.success('Notification 1');
      service.error('Notification 2');
      service.warning('Notification 3');

      expect(service.notifications().length).toBe(3);

      service.clear();

      expect(service.notifications().length).toBe(0);
    });

    it('should handle removing non-existent notification', () => {
      service.success('Test notification');
      const initialCount = service.notifications().length;

      service.remove('non-existent-id');

      expect(service.notifications().length).toBe(initialCount);
    });
  });

  describe('multiple notifications', () => {
    it('should maintain order of notifications', () => {
      service.success('First');
      service.error('Second');
      service.warning('Third');

      const notifications = service.notifications();
      expect(notifications.length).toBe(3);
      expect(notifications[0].message).toBe('First');
      expect(notifications[1].message).toBe('Second');
      expect(notifications[2].message).toBe('Third');
    });

    it('should generate unique ids for each notification', () => {
      service.success('Notification 1');
      service.success('Notification 2');
      service.success('Notification 3');

      const notifications = service.notifications();
      const ids = notifications.map((n) => n.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(3);
    });
  });

  describe('auto-dismiss functionality', () => {
    it('should auto-dismiss notification after duration', (done) => {
      const config: NotificationConfig = {
        message: 'Auto dismiss test',
        type: 'info',
        duration: 100,
      };

      service.show(config);
      expect(service.notifications().length).toBe(1);

      setTimeout(() => {
        expect(service.notifications().length).toBe(0);
        done();
      }, 150);
    });

    it('should not auto-dismiss notifications without duration', (done) => {
      service.success('Persistent notification');
      expect(service.notifications().length).toBe(1);

      setTimeout(() => {
        expect(service.notifications().length).toBe(1);
        done();
      }, 100);
    });

    it('should handle multiple auto-dismiss notifications', (done) => {
      service.show({ message: 'Short', type: 'info', duration: 50 });
      service.show({ message: 'Long', type: 'info', duration: 150 });
      service.success('Persistent');

      expect(service.notifications().length).toBe(3);

      setTimeout(() => {
        expect(service.notifications().length).toBe(2);

        setTimeout(() => {
          expect(service.notifications().length).toBe(1);
          expect(service.notifications()[0].message).toBe('Persistent');
          done();
        }, 120);
      }, 70);
    });
  });

  describe('signal reactivity', () => {
    it('should emit notifications signal when adding', () => {
      let notificationCount = 0;

      // Subscribe to signal changes
      service.notifications(); // Initial read to establish tracking

      service.success('Test');
      notificationCount = service.notifications().length;

      expect(notificationCount).toBe(1);
    });

    it('should emit notifications signal when removing', () => {
      service.success('Test');
      const notificationId = service.notifications()[0].id;

      service.remove(notificationId);

      expect(service.notifications().length).toBe(0);
    });

    it('should emit notifications signal when clearing', () => {
      service.success('Test 1');
      service.success('Test 2');

      service.clear();

      expect(service.notifications().length).toBe(0);
    });
  });
});
