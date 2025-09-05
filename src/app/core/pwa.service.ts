import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class PwaService {
  private promptEvent: any;
  private isBrowser: boolean;

  constructor(
    private swUpdate: SwUpdate,
    private notificationService: NotificationService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      this.initializeServiceWorker();
      this.listenForInstallPrompt();
    }
  }

  private initializeServiceWorker(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    // Check for updates
    this.swUpdate.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
      )
      .subscribe(() => {
        this.notificationService.info(
          'Nueva versión disponible. Recarga la página para actualizar.'
        );
      });

    // Periodic update check
    setInterval(() => {
      this.swUpdate.checkForUpdate();
    }, 60000); // Check every minute
  }

  private listenForInstallPrompt(): void {
    if (!this.isBrowser) return;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.promptEvent = e;
      this.showInstallNotification();
    });
  }

  private showInstallNotification(): void {
    this.notificationService.info(
      '¡Instala la aplicación en tu dispositivo para una mejor experiencia!'
    );
  }

  async installPwa(): Promise<boolean> {
    if (!this.promptEvent) {
      return false;
    }

    const result = await this.promptEvent.prompt();
    const userChoice = await result.userChoice;

    if (userChoice === 'accepted') {
      this.notificationService.success('¡Aplicación instalada exitosamente!');
      this.promptEvent = null;
      return true;
    }

    return false;
  }

  async updateApp(): Promise<void> {
    if (this.swUpdate.isEnabled) {
      await this.swUpdate.activateUpdate();
      document.location.reload();
    }
  }

  isInstallable(): boolean {
    return !!this.promptEvent;
  }

  // Check if running as PWA
  isRunningAsPwa(): boolean {
    if (!this.isBrowser) return false;

    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    );
  }

  // Network status
  isOnline(): boolean {
    if (!this.isBrowser) return true;
    return navigator.onLine;
  }

  // Listen to network changes
  onNetworkChange(callback: (online: boolean) => void): void {
    if (!this.isBrowser) return;

    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  }
}
