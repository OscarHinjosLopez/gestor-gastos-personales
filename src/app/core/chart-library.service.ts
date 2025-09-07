import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

declare var Chart: any;

@Injectable({
  providedIn: 'root'
})
export class ChartLibraryService {
  private chartJsLoaded = false;
  private loadingPromise: Promise<boolean> | null = null;
  private readonly CDN_URL = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
  private readonly FALLBACK_CDN = 'https://unpkg.com/chart.js@4.4.0/dist/chart.umd.js';
  private readonly TIMEOUT_MS = 10000; // 10 seconds timeout

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  async loadChartJs(): Promise<boolean> {
    // Skip if not in browser environment
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('⚠️ Chart.js cannot be loaded in SSR environment');
      return false;
    }

    // Return immediately if already loaded
    if (this.chartJsLoaded && typeof Chart !== 'undefined') {
      return true;
    }

    // Return existing promise if already loading
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Start loading process
    this.loadingPromise = this.attemptLoad();
    return this.loadingPromise;
  }

  private async attemptLoad(): Promise<boolean> {
    try {
      // Try primary CDN first
      console.log('🔄 Loading Chart.js from primary CDN...');
      const success = await this.loadFromUrl(this.CDN_URL);
      
      if (success) {
        console.log('✅ Chart.js loaded successfully from primary CDN');
        this.chartJsLoaded = true;
        return true;
      }

      // Try fallback CDN
      console.log('🔄 Primary CDN failed, trying fallback CDN...');
      const fallbackSuccess = await this.loadFromUrl(this.FALLBACK_CDN);
      
      if (fallbackSuccess) {
        console.log('✅ Chart.js loaded successfully from fallback CDN');
        this.chartJsLoaded = true;
        return true;
      }

      // Try loading from npm package as last resort
      console.log('🔄 CDNs failed, trying npm package...');
      const npmSuccess = await this.loadFromNpm();
      
      if (npmSuccess) {
        console.log('✅ Chart.js loaded successfully from npm package');
        this.chartJsLoaded = true;
        return true;
      }

      console.error('❌ All Chart.js loading methods failed');
      return false;

    } catch (error) {
      console.error('❌ Critical error loading Chart.js:', error);
      return false;
    }
  }

  private loadFromUrl(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      const timeoutId = setTimeout(() => {
        console.warn(`⏰ Timeout loading Chart.js from ${url}`);
        document.head.removeChild(script);
        resolve(false);
      }, this.TIMEOUT_MS);

      script.onload = () => {
        clearTimeout(timeoutId);
        if (typeof Chart !== 'undefined') {
          resolve(true);
        } else {
          console.warn(`⚠️ Chart.js script loaded but Chart object not available from ${url}`);
          resolve(false);
        }
      };

      script.onerror = () => {
        clearTimeout(timeoutId);
        console.warn(`❌ Failed to load Chart.js from ${url}`);
        resolve(false);
      };

      script.src = url;
      script.async = true;
      script.crossOrigin = 'anonymous';
      
      // Add integrity check for jsdelivr CDN
      if (url.includes('jsdelivr')) {
        script.integrity = 'sha384-ChL2BKTX0Qa8p7qtH8Iq6WqMcrmZxLN4QQOdLd8p9a3B6KcdPNQGxL2GJ19G3hE';
      }
      
      document.head.appendChild(script);
    });
  }

  private async loadFromNpm(): Promise<boolean> {
    try {
      // Dynamic import as fallback
      const chartModule = await import('chart.js');
      if (chartModule && chartModule.Chart) {
        // Make it globally available
        (window as any).Chart = chartModule.Chart;
        return true;
      }
    } catch (error) {
      console.warn('⚠️ Failed to load Chart.js from npm:', error);
    }
    return false;
  }

  isChartJsAvailable(): boolean {
    return this.chartJsLoaded && typeof Chart !== 'undefined';
  }

  getChart(): any {
    if (this.isChartJsAvailable()) {
      return Chart;
    }
    throw new Error('Chart.js is not available. Call loadChartJs() first.');
  }

  // Cleanup method for testing
  reset(): void {
    this.chartJsLoaded = false;
    this.loadingPromise = null;
  }
}
