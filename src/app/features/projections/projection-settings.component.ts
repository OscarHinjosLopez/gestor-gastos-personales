import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectionService } from './projection.service';
import { NotificationService } from '../../core/notification.service';
import { ProjectionSettings } from '../../shared/models/projection.model';

@Component({
  selector: 'app-projection-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-semibold mb-4">
        ⚙️ Configuración de Proyecciones
      </h3>

      <form
        (ngSubmit)="saveSettings()"
        #settingsForm="ngForm"
        class="space-y-6"
      >
        <!-- Configuración básica -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Período base por defecto (meses)
            </label>
            <select
              [(ngModel)]="formData.defaultBasePeriodMonths"
              name="defaultBasePeriodMonths"
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option [value]="3">3 meses</option>
              <option [value]="6">6 meses</option>
              <option [value]="12">12 meses</option>
              <option [value]="24">24 meses</option>
            </select>
            <p class="text-xs text-gray-500 mt-1">
              Cuántos meses de historial usar por defecto para calcular
              proyecciones
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Tasa de crecimiento por defecto (%)
            </label>
            <input
              type="number"
              [(ngModel)]="formData.defaultGrowthRate"
              name="defaultGrowthRate"
              min="-100"
              max="1000"
              step="0.1"
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p class="text-xs text-gray-500 mt-1">
              Tasa de crecimiento aplicada cuando no se detecta tendencia clara
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Mínimo de datos requeridos
            </label>
            <input
              type="number"
              [(ngModel)]="formData.minimumDataPoints"
              name="minimumDataPoints"
              min="1"
              max="100"
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p class="text-xs text-gray-500 mt-1">
              Número mínimo de gastos necesarios para generar proyecciones
              confiables
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Umbral de confianza (%)
            </label>
            <input
              type="number"
              [(ngModel)]="formData.confidenceThreshold"
              name="confidenceThreshold"
              min="0"
              max="100"
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p class="text-xs text-gray-500 mt-1">
              Nivel mínimo de confianza para mostrar advertencias
            </p>
          </div>
        </div>

        <!-- Configuración avanzada -->
        <div class="border-t pt-6">
          <h4 class="text-md font-semibold mb-4">Funciones Avanzadas</h4>

          <div class="space-y-4">
            <div class="flex items-center">
              <input
                type="checkbox"
                [(ngModel)]="formData.enableSeasonalAdjustment"
                name="enableSeasonalAdjustment"
                id="seasonalAdjustment"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                for="seasonalAdjustment"
                class="ml-2 block text-sm text-gray-900"
              >
                Habilitar ajustes estacionales
              </label>
            </div>
            <p class="text-xs text-gray-500 ml-6">
              Aplica factores de corrección según la época del año (ej: más
              gastos en diciembre)
            </p>

            <div class="flex items-center">
              <input
                type="checkbox"
                [(ngModel)]="formData.enableTrendAnalysis"
                name="enableTrendAnalysis"
                id="trendAnalysis"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                for="trendAnalysis"
                class="ml-2 block text-sm text-gray-900"
              >
                Habilitar análisis de tendencias
              </label>
            </div>
            <p class="text-xs text-gray-500 ml-6">
              Detecta tendencias de crecimiento/decrecimiento en los gastos
              históricos
            </p>
          </div>
        </div>

        <!-- Información actual -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="text-md font-semibold mb-2">Estado Actual</h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-gray-600">Proyecciones activas:</span>
              <span class="font-semibold ml-1">{{
                activeProjectionsCount()
              }}</span>
            </div>
            <div>
              <span class="text-gray-600">Total proyecciones:</span>
              <span class="font-semibold ml-1">{{
                totalProjectionsCount()
              }}</span>
            </div>
            <div>
              <span class="text-gray-600">Ajustes estacionales:</span>
              <span class="font-semibold ml-1">{{
                currentSettings().enableSeasonalAdjustment ? 'Sí' : 'No'
              }}</span>
            </div>
            <div>
              <span class="text-gray-600">Análisis de tendencias:</span>
              <span class="font-semibold ml-1">{{
                currentSettings().enableTrendAnalysis ? 'Sí' : 'No'
              }}</span>
            </div>
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="flex space-x-4">
          <button
            type="submit"
            [disabled]="!settingsForm.valid || isSaving()"
            class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {{ isSaving() ? 'Guardando...' : 'Guardar Configuración' }}
          </button>

          <button
            type="button"
            (click)="resetToDefaults()"
            class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Restaurar Valores Por Defecto
          </button>
        </div>
      </form>
    </div>
  `,
})
export class ProjectionSettingsComponent {
  private projectionService = inject(ProjectionService);
  private notificationService = inject(NotificationService);

  // Signals
  private currentSettingsSignal = signal<ProjectionSettings | null>(null);
  private savingSignal = signal(false);

  // Computed
  currentSettings = computed(
    () => this.currentSettingsSignal() || this.getDefaultSettings()
  );
  activeProjectionsCount = computed(
    () => this.projectionService.activeProjections().length
  );
  totalProjectionsCount = computed(
    () => this.projectionService.projections().length
  );
  isSaving = this.savingSignal.asReadonly();

  // Form data
  formData: ProjectionSettings = this.getDefaultSettings();

  ngOnInit() {
    this.loadCurrentSettings();
  }

  private async loadCurrentSettings() {
    try {
      const settings = await this.projectionService.getSettings();
      this.currentSettingsSignal.set(settings);
      this.formData = { ...settings };
    } catch (error) {
      console.error('Error loading settings:', error);
      this.notificationService.error('Error al cargar la configuración');
    }
  }

  async saveSettings() {
    try {
      this.savingSignal.set(true);

      const updatedSettings = await this.projectionService.updateSettings(
        this.formData
      );
      this.currentSettingsSignal.set(updatedSettings);

      this.notificationService.success('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.notificationService.error('Error al guardar la configuración');
    } finally {
      this.savingSignal.set(false);
    }
  }

  resetToDefaults() {
    if (
      confirm(
        '¿Estás seguro de que quieres restaurar la configuración por defecto?'
      )
    ) {
      this.formData = this.getDefaultSettings();
      this.notificationService.info(
        'Configuración restaurada a valores por defecto'
      );
    }
  }

  private getDefaultSettings(): ProjectionSettings {
    return {
      defaultBasePeriodMonths: 6,
      defaultGrowthRate: 0,
      minimumDataPoints: 3,
      confidenceThreshold: 70,
      enableSeasonalAdjustment: true,
      enableTrendAnalysis: true,
    };
  }
}
