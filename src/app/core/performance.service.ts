import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private memoCache = new Map<string, any>();
  private readonly CACHE_TTL = 5000; // 5 seconds

  /**
   * Memoiza el resultado de una función con TTL
   */
  memoize<T>(key: string, fn: () => T, ttl: number = this.CACHE_TTL): T {
    const cached = this.memoCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.value;
    }

    const result = fn();
    this.memoCache.set(key, {
      value: result,
      timestamp: Date.now()
    });

    return result;
  }

  /**
   * Limpia la caché de memoización
   */
  clearMemoCache(): void {
    this.memoCache.clear();
  }

  /**
   * Limpia entradas de caché expiradas
   */
  cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.memoCache.entries()) {
      if (now - cached.timestamp >= this.CACHE_TTL) {
        this.memoCache.delete(key);
      }
    }
  }

  /**
   * Debounce function para reducir llamadas frecuentes
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * Throttle function para limitar frecuencia de ejecución
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Lazy load de recursos pesados
   */
  async lazyLoad<T>(loader: () => Promise<T>): Promise<T> {
    try {
      return await loader();
    } catch (error) {
      console.error('Error in lazy loading:', error);
      throw error;
    }
  }

  /**
   * Medición de rendimiento
   */
  measurePerformance<T>(label: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    console.log(`🔍 Performance [${label}]: ${(end - start).toFixed(2)}ms`);
    return result;
  }

  /**
   * Async performance measurement
   */
  async measureAsyncPerformance<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    console.log(`🔍 Async Performance [${label}]: ${(end - start).toFixed(2)}ms`);
    return result;
  }
}
