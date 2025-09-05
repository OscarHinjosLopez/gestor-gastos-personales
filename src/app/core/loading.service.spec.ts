import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loading state management', () => {
    it('should set loading state correctly', () => {
      expect(service.isLoading('test')).toBe(false);
      expect(service.isAnyLoading()).toBe(false);

      service.setLoading('test', true);

      expect(service.isLoading('test')).toBe(true);
      expect(service.isAnyLoading()).toBe(true);
      expect(service.globalLoading()).toBe(true);
    });

    it('should remove loading state correctly', () => {
      service.setLoading('test', true);
      expect(service.isLoading('test')).toBe(true);

      service.setLoading('test', false);

      expect(service.isLoading('test')).toBe(false);
      expect(service.isAnyLoading()).toBe(false);
      expect(service.globalLoading()).toBe(false);
    });

    it('should handle multiple loading states', () => {
      service.setLoading('test1', true);
      service.setLoading('test2', true);

      expect(service.isLoading('test1')).toBe(true);
      expect(service.isLoading('test2')).toBe(true);
      expect(service.isAnyLoading()).toBe(true);

      service.setLoading('test1', false);

      expect(service.isLoading('test1')).toBe(false);
      expect(service.isLoading('test2')).toBe(true);
      expect(service.isAnyLoading()).toBe(true);

      service.setLoading('test2', false);

      expect(service.isAnyLoading()).toBe(false);
      expect(service.globalLoading()).toBe(false);
    });
  });

  describe('wrap method', () => {
    it('should set loading state during promise execution', async () => {
      const promise = new Promise((resolve) =>
        setTimeout(() => resolve('success'), 10)
      );
      const wrapPromise = service.wrap('test', promise);

      expect(service.isLoading('test')).toBe(true);

      const result = await wrapPromise;

      expect(result).toBe('success');
      expect(service.isLoading('test')).toBe(false);
    });

    it('should clear loading state even if promise rejects', async () => {
      const promise = Promise.reject(new Error('Test error'));

      try {
        await service.wrap('test', promise);
      } catch (error) {
        expect((error as Error).message).toBe('Test error');
      }

      expect(service.isLoading('test')).toBe(false);
    });

    it('should handle multiple concurrent promises', async () => {
      const promise1 = new Promise((resolve) =>
        setTimeout(() => resolve('result1'), 20)
      );
      const promise2 = new Promise((resolve) =>
        setTimeout(() => resolve('result2'), 10)
      );

      const wrap1 = service.wrap('test1', promise1);
      const wrap2 = service.wrap('test2', promise2);

      expect(service.isLoading('test1')).toBe(true);
      expect(service.isLoading('test2')).toBe(true);
      expect(service.isAnyLoading()).toBe(true);

      const result2 = await wrap2;
      expect(result2).toBe('result2');
      expect(service.isLoading('test2')).toBe(false);
      expect(service.isAnyLoading()).toBe(true); // test1 still loading

      const result1 = await wrap1;
      expect(result1).toBe('result1');
      expect(service.isLoading('test1')).toBe(false);
      expect(service.isAnyLoading()).toBe(false);
    });
  });

  describe('convenience methods', () => {
    it('should wrap expense operations correctly', async () => {
      const promise = Promise.resolve('expense result');

      const result = await service.wrapExpenseOperation('create', promise);

      expect(result).toBe('expense result');
    });

    it('should wrap income operations correctly', async () => {
      const promise = Promise.resolve('income result');

      const result = await service.wrapIncomeOperation('update', promise);

      expect(result).toBe('income result');
    });

    it('should check expense loading state', () => {
      service.setLoading('expense-create', true);

      expect(service.isExpenseLoading('create')).toBe(true);
      expect(service.isExpenseLoading('update')).toBe(false);
    });

    it('should check income loading state', () => {
      service.setLoading('income-delete', true);

      expect(service.isIncomeLoading('delete')).toBe(true);
      expect(service.isIncomeLoading('create')).toBe(false);
    });
  });

  describe('signal reactivity', () => {
    it('should update global loading signal correctly', () => {
      expect(service.globalLoading()).toBe(false);

      service.setLoading('test', true);
      expect(service.globalLoading()).toBe(true);

      service.setLoading('test', false);
      expect(service.globalLoading()).toBe(false);
    });

    it('should maintain signal state consistency', () => {
      service.setLoading('test1', true);
      service.setLoading('test2', true);

      expect(service.globalLoading()).toBe(true);
      expect(service.isAnyLoading()).toBe(true);

      service.setLoading('test1', false);

      expect(service.globalLoading()).toBe(true);
      expect(service.isAnyLoading()).toBe(true);

      service.setLoading('test2', false);

      expect(service.globalLoading()).toBe(false);
      expect(service.isAnyLoading()).toBe(false);
    });
  });
});
