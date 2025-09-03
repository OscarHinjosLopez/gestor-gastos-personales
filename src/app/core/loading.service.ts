import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private _loadingStates = signal<Map<string, boolean>>(new Map());

  // Global loading state
  private _globalLoading = signal<boolean>(false);
  globalLoading = this._globalLoading.asReadonly();

  setLoading(key: string, loading: boolean): void {
    this._loadingStates.update((states) => {
      const newStates = new Map(states);
      if (loading) {
        newStates.set(key, true);
      } else {
        newStates.delete(key);
      }
      return newStates;
    });

    // Update global loading state
    this._globalLoading.set(this._loadingStates().size > 0);
  }

  isLoading(key: string): boolean {
    return this._loadingStates().has(key);
  }

  isAnyLoading(): boolean {
    return this._loadingStates().size > 0;
  }

  async wrap<T>(key: string, promise: Promise<T>): Promise<T> {
    try {
      this.setLoading(key, true);
      const result = await promise;
      return result;
    } finally {
      this.setLoading(key, false);
    }
  }

  // Convenience methods for common operations
  async wrapExpenseOperation<T>(
    operation: string,
    promise: Promise<T>
  ): Promise<T> {
    return this.wrap(`expense-${operation}`, promise);
  }

  async wrapIncomeOperation<T>(
    operation: string,
    promise: Promise<T>
  ): Promise<T> {
    return this.wrap(`income-${operation}`, promise);
  }

  isExpenseLoading(operation: string): boolean {
    return this.isLoading(`expense-${operation}`);
  }

  isIncomeLoading(operation: string): boolean {
    return this.isLoading(`income-${operation}`);
  }
}
