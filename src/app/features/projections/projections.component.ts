import {
  Component,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectionService } from './projection.service';
import { LoadingService } from '../../core/loading.service';
import { NotificationService } from '../../core/notification.service';
import {
  ExpenseProjection,
  ProjectionResult,
  ProjectionType,
  ProjectionWarning,
} from '../../shared/models/projection.model';
import { CreateProjectionData } from '../../shared/utils/projection-validation.utils';
import { PieChartComponent } from '../../shared/components/charts/pie-chart.component';
import { ProjectionSettingsComponent } from './projection-settings.component';
import {
  ConfirmModalComponent,
  ConfirmModalData,
} from '../../shared/components/confirm-modal.component';

@Component({
  selector: 'app-projections',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    DatePipe,
    PieChartComponent,
    ProjectionSettingsComponent,
    ConfirmModalComponent,
  ],
  template: `
    <div class="max-w-7xl mx-auto p-6 space-y-6">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              📈 Proyecciones de Gastos
            </h1>
            <p class="text-gray-600 mt-2">
              Planifica y proyecta tus gastos futuros basándote en datos
              históricos
            </p>
          </div>
          <button
            (click)="showCreateForm = !showCreateForm"
            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            [disabled]="isLoading()"
          >
            {{ showCreateForm ? 'Cancelar' : '+ Nueva Proyección' }}
          </button>
        </div>

        <!-- Form para crear nueva proyección -->
        @if (showCreateForm) {
        <div class="border-t pt-6">
          <h3 class="text-lg font-semibold mb-4">Crear Nueva Proyección</h3>

          <form
            (ngSubmit)="createProjection()"
            #projectionForm="ngForm"
            class="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Nombre de la Proyección</label
              >
              <input
                type="text"
                [(ngModel)]="formData.name"
                name="name"
                required
                maxlength="100"
                class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Proyección Q1 2025"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Tipo de Proyección</label
              >
              <select
                [(ngModel)]="formData.projectionType"
                name="projectionType"
                required
                class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="historical_average">Promedio Histórico</option>
                <option value="trending">Basado en Tendencias</option>
                <option value="seasonal">Con Ajuste Estacional</option>
                <option value="hybrid">Híbrido (Recomendado)</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Fecha de Inicio</label
              >
              <input
                type="date"
                [(ngModel)]="formData.startDate"
                name="startDate"
                required
                [min]="todayString"
                class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Fecha de Fin</label
              >
              <input
                type="date"
                [(ngModel)]="formData.endDate"
                name="endDate"
                required
                [min]="formData.startDate"
                class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Período Base (meses históricos)
              </label>
              <select
                [(ngModel)]="formData.basePeriodMonths"
                name="basePeriodMonths"
                class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option [value]="3">Últimos 3 meses</option>
                <option [value]="6">Últimos 6 meses</option>
                <option [value]="12">Último año</option>
                <option [value]="24">Últimos 2 años</option>
              </select>
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1"
                >Notas (opcional)</label
              >
              <textarea
                [(ngModel)]="formData.notes"
                name="notes"
                rows="3"
                maxlength="500"
                class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notas adicionales sobre la proyección..."
              ></textarea>
            </div>

            <div class="md:col-span-2 flex space-x-4">
              <button
                type="submit"
                [disabled]="!projectionForm.valid || isLoading()"
                class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {{ isLoading() ? 'Creando...' : 'Crear Proyección' }}
              </button>
              <button
                type="button"
                (click)="resetForm()"
                class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Limpiar
              </button>
            </div>
          </form>
        </div>
        }
      </div>

      <!-- Lista de proyecciones existentes -->
      @if (projections().length > 0) {
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Mis Proyecciones</h2>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          @for (projection of projections(); track projection.id) {
          <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start mb-3">
              <div>
                <h3 class="font-semibold text-lg">{{ projection.name }}</h3>
                <p class="text-sm text-gray-600">
                  {{ projection.startDate | date : 'mediumDate' }} -
                  {{ projection.endDate | date : 'mediumDate' }}
                </p>
              </div>

              <div class="flex items-center space-x-2">
                <span
                  class="px-2 py-1 rounded-full text-xs font-medium"
                  [class]="getConfidenceClass(projection.confidence)"
                >
                  {{ projection.confidence }}% confianza
                </span>
                <div class="flex space-x-1">
                  <button
                    (click)="viewProjection(projection)"
                    class="text-blue-600 hover:text-blue-800 text-sm"
                    title="Ver detalles"
                  >
                    👁️
                  </button>
                  <button
                    (click)="toggleProjectionStatus(projection)"
                    class="text-sm"
                    [class]="
                      projection.isActive
                        ? 'text-green-600 hover:text-green-800'
                        : 'text-gray-400 hover:text-gray-600'
                    "
                    [title]="projection.isActive ? 'Desactivar' : 'Activar'"
                  >
                    {{ projection.isActive ? '✅' : '⚫' }}
                  </button>
                  <button
                    (click)="deleteProjection(projection.id)"
                    class="text-red-600 hover:text-red-800 text-sm"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-gray-600">Total Proyectado:</span>
                <span class="font-semibold">{{
                  projection.totalProjectedAmount
                    | currency : 'EUR' : 'symbol' : '1.2-2'
                }}</span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-600">Tipo:</span>
                <span class="text-sm">{{
                  getProjectionTypeLabel(projection.projectionType)
                }}</span>
              </div>

              <div class="flex justify-between">
                <span class="text-gray-600">Categorías:</span>
                <span class="text-sm">{{ projection.categories.length }}</span>
              </div>

              @if (projection.notes) {
              <div class="mt-3 p-2 bg-gray-50 rounded text-sm">
                {{ projection.notes }}
              </div>
              }
            </div>
          </div>
          }
        </div>
      </div>
      } @else {
      <div class="bg-white rounded-lg shadow p-12 text-center">
        <div class="text-6xl mb-4">📊</div>
        <h3 class="text-xl font-semibold mb-2">No hay proyecciones creadas</h3>
        <p class="text-gray-600 mb-4">
          Crea tu primera proyección para planificar tus gastos futuros
        </p>
        <button
          (click)="showCreateForm = true"
          class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Crear Primera Proyección
        </button>
      </div>
      }

      <!-- Modal de detalles de proyección -->
      @if (selectedProjection() && showProjectionDetails) {
      <div
        class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      >
        <div
          class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div class="p-6">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold">
                {{ selectedProjection()!.name }}
              </h2>
              <button
                (click)="closeProjectionDetails()"
                class="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            @if (selectedProjectionResult()) {
            <div class="space-y-6">
              <!-- Resumen general -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-blue-50 p-4 rounded-lg">
                  <h4 class="font-semibold text-blue-800">Total Proyectado</h4>
                  <p class="text-2xl font-bold text-blue-900">
                    {{
                      selectedProjectionResult()!.projection
                        .totalProjectedAmount
                        | currency : 'EUR' : 'symbol' : '1.2-2'
                    }}
                  </p>
                </div>

                <div class="bg-green-50 p-4 rounded-lg">
                  <h4 class="font-semibold text-green-800">Confianza</h4>
                  <p class="text-2xl font-bold text-green-900">
                    {{ selectedProjectionResult()!.projection.confidence }}%
                  </p>
                </div>

                <div class="bg-purple-50 p-4 rounded-lg">
                  <h4 class="font-semibold text-purple-800">
                    Cambio vs Histórico
                  </h4>
                  <p
                    class="text-2xl font-bold"
                    [class]="
                      selectedProjectionResult()!.breakdown.comparison
                        .percentageChange >= 0
                        ? 'text-red-900'
                        : 'text-green-900'
                    "
                  >
                    {{
                      selectedProjectionResult()!.breakdown.comparison
                        .percentageChange | number : '1.1-1'
                    }}%
                  </p>
                </div>
              </div>

              <!-- Gráfico de distribución por categorías -->
              @if (categoryChartData()) {
              <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-semibold mb-4">Distribución por Categorías</h4>
                <app-pie-chart
                  [data]="categoryChartData()!"
                  [height]="300"
                  title="Proyección por Categorías"
                ></app-pie-chart>
              </div>
              }

              <!-- Advertencias -->
              @if (selectedProjectionResult()!.warnings.length > 0) {
              <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 class="font-semibold text-yellow-800 mb-2">
                  ⚠️ Advertencias
                </h4>
                @for (warning of selectedProjectionResult()!.warnings; track
                $index) {
                <div class="text-sm text-yellow-700 mb-1">
                  • {{ warning.message }}
                </div>
                }
              </div>
              }

              <!-- Recomendaciones -->
              @if (selectedProjectionResult()!.recommendations.length > 0) {
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 class="font-semibold text-blue-800 mb-2">
                  💡 Recomendaciones
                </h4>
                @for (recommendation of
                selectedProjectionResult()!.recommendations; track $index) {
                <div class="text-sm text-blue-700 mb-1">
                  • {{ recommendation }}
                </div>
                }
              </div>
              }

              <!-- Desglose por categorías -->
              <div class="bg-white border rounded-lg">
                <h4 class="font-semibold p-4 border-b">
                  Desglose por Categorías
                </h4>
                <div class="divide-y">
                  @for (category of
                  selectedProjectionResult()!.breakdown.byCategory; track
                  category.category) {
                  <div class="p-4 flex justify-between items-center">
                    <span class="font-medium">{{ category.category }}</span>
                    <div class="text-right">
                      <div class="font-semibold">
                        {{
                          category.amount
                            | currency : 'EUR' : 'symbol' : '1.2-2'
                        }}
                      </div>
                      <div class="text-sm text-gray-600">
                        {{ category.percentage | number : '1.1-1' }}%
                      </div>
                    </div>
                  </div>
                  }
                </div>
              </div>
            </div>
            }
          </div>
        </div>
      </div>
      }

      <!-- Configuración de proyecciones -->
      <app-projection-settings></app-projection-settings>

      <!-- Modal de confirmación para eliminar -->
      <app-confirm-modal
        [isOpen]="showDeleteModal"
        [data]="deleteModalData"
        (confirm)="confirmDelete()"
        (cancel)="showDeleteModal = false"
      ></app-confirm-modal>
    </div>
  `,
})
export class ProjectionsComponent implements OnInit {
  private projectionService = inject(ProjectionService);
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);

  // Signals
  private loadingKey = 'projections';
  isLoading = computed(() => this.loadingService.isLoading(this.loadingKey));
  projections = this.projectionService.projections;
  selectedProjection = signal<ExpenseProjection | null>(null);
  selectedProjectionResult = signal<ProjectionResult | null>(null);

  // State
  showCreateForm = false;
  showProjectionDetails = false;
  showDeleteModal = false;
  projectionToDelete: string | null = null;
  todayString = new Date().toISOString().split('T')[0];

  // Modal configuration
  deleteModalData: ConfirmModalData = {
    title: 'Eliminar Proyección',
    message:
      '¿Estás seguro de que deseas eliminar esta proyección? Esta acción no se puede deshacer.',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    type: 'danger',
  };

  // Form data
  formData: CreateProjectionData = {
    name: '',
    startDate: this.getNextMonthDate(),
    endDate: this.getThreeMonthsLaterDate(),
    projectionType: 'hybrid',
    basePeriodMonths: 6,
    notes: '',
  };

  // Chart data
  categoryChartData = computed(() => {
    const result = this.selectedProjectionResult();
    if (!result) return null;

    return result.breakdown.byCategory.map((cat) => ({
      name: cat.category,
      amount: cat.amount,
      percentage: cat.percentage,
    }));
  });

  ngOnInit() {
    // Los datos se cargan automáticamente mediante el servicio
  }

  async createProjection() {
    if (!this.validateForm()) return;

    try {
      this.loadingService.setLoading(this.loadingKey, true);

      const result = await this.projectionService.createProjection(
        this.formData
      );

      this.notificationService.success('Proyección creada exitosamente');
      this.showCreateForm = false;
      this.resetForm();

      // Mostrar automáticamente los detalles de la nueva proyección
      this.selectedProjection.set(result.projection);
      this.selectedProjectionResult.set(result);
      this.showProjectionDetails = true;
    } catch (error) {
      console.error('Error creating projection:', error);
      this.notificationService.error(
        'Error al crear la proyección: ' + (error as Error).message
      );
    } finally {
      this.loadingService.setLoading(this.loadingKey, false);
    }
  }

  async viewProjection(projection: ExpenseProjection) {
    try {
      this.loadingService.setLoading(this.loadingKey, true);

      // Para ver una proyección existente, necesitamos recalcular el resultado
      // Por ahora usamos un resultado básico, en una implementación completa
      // el servicio tendría un método para generar el resultado de proyecciones existentes
      const mockResult: ProjectionResult = {
        projection,
        breakdown: {
          byCategory: projection.categories.map((cat) => ({
            category: cat.category,
            amount: cat.projectedAmount,
            percentage:
              (cat.projectedAmount / projection.totalProjectedAmount) * 100,
          })),
          byMonth: [],
          comparison: {
            historical: 0,
            projected: projection.totalProjectedAmount,
            difference: 0,
            percentageChange: 0,
          },
        },
        warnings:
          projection.confidence < 70
            ? [
                {
                  type: 'low_confidence',
                  message: 'La confianza de esta proyección es baja',
                  severity: 'medium',
                },
              ]
            : [],
        recommendations: [
          'Revisa los datos periódicamente para mantener la precisión',
        ],
      };

      this.selectedProjection.set(projection);
      this.selectedProjectionResult.set(mockResult);
      this.showProjectionDetails = true;
    } catch (error) {
      console.error('Error viewing projection:', error);
      this.notificationService.error(
        'Error al cargar los detalles de la proyección'
      );
    } finally {
      this.loadingService.setLoading(this.loadingKey, false);
    }
  }

  async toggleProjectionStatus(projection: ExpenseProjection) {
    try {
      await this.projectionService.updateProjection({
        id: projection.id,
        isActive: !projection.isActive,
      });

      this.notificationService.success(
        `Proyección ${
          projection.isActive ? 'desactivada' : 'activada'
        } correctamente`
      );
    } catch (error) {
      console.error('Error updating projection status:', error);
      this.notificationService.error(
        'Error al actualizar el estado de la proyección'
      );
    }
  }

  deleteProjection(id: string) {
    this.projectionToDelete = id;
    this.showDeleteModal = true;
  }

  async confirmDelete() {
    if (!this.projectionToDelete) return;

    try {
      this.loadingService.setLoading(this.loadingKey, true);

      const success = await this.projectionService.deleteProjection(
        this.projectionToDelete
      );

      if (success) {
        this.notificationService.success('Proyección eliminada correctamente');

        // Si estamos viendo esta proyección, cerrar los detalles
        if (this.selectedProjection()?.id === this.projectionToDelete) {
          this.closeProjectionDetails();
        }
      } else {
        this.notificationService.error('Error al eliminar la proyección');
      }
    } catch (error) {
      console.error('Error deleting projection:', error);
      this.notificationService.error('Error al eliminar la proyección');
    } finally {
      this.loadingService.setLoading(this.loadingKey, false);
      this.showDeleteModal = false;
      this.projectionToDelete = null;
    }
  }

  closeProjectionDetails() {
    this.showProjectionDetails = false;
    this.selectedProjection.set(null);
    this.selectedProjectionResult.set(null);
  }

  resetForm() {
    this.formData = {
      name: '',
      startDate: this.getNextMonthDate(),
      endDate: this.getThreeMonthsLaterDate(),
      projectionType: 'hybrid',
      basePeriodMonths: 6,
      notes: '',
    };
  }

  private validateForm(): boolean {
    if (!this.formData.name.trim()) {
      this.notificationService.error('El nombre de la proyección es requerido');
      return false;
    }

    const startDate = new Date(this.formData.startDate);
    const endDate = new Date(this.formData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      this.notificationService.error(
        'La fecha de inicio no puede ser anterior a hoy'
      );
      return false;
    }

    if (endDate <= startDate) {
      this.notificationService.error(
        'La fecha de fin debe ser posterior a la fecha de inicio'
      );
      return false;
    }

    return true;
  }

  private getNextMonthDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(1); // Primer día del próximo mes
    return date.toISOString().split('T')[0];
  }

  private getThreeMonthsLaterDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 4);
    date.setDate(0); // Último día del mes (3 meses después)
    return date.toISOString().split('T')[0];
  }

  getConfidenceClass(confidence: number): string {
    if (confidence >= 80) return 'bg-green-100 text-green-800';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  getProjectionTypeLabel(type: ProjectionType): string {
    const labels: Record<ProjectionType, string> = {
      historical_average: 'Promedio Histórico',
      trending: 'Basado en Tendencias',
      seasonal: 'Con Ajuste Estacional',
      hybrid: 'Híbrido',
      manual: 'Manual',
    };
    return labels[type];
  }
}
