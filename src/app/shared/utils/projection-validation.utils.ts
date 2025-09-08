import { z } from 'zod';

// Schema para el período base
export const BasePeriodSchema = z
  .object({
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Fecha de inicio debe ser una fecha válida',
    }),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Fecha de fin debe ser una fecha válida',
    }),
    totalMonths: z.number().min(1).max(36),
    description: z.string().min(1, 'La descripción es requerida'),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['endDate'],
  });

// Schema para proyección por categoría
export const CategoryProjectionSchema = z.object({
  category: z.string().min(1, 'La categoría es requerida'),
  historicalAverage: z
    .number()
    .min(0, 'El promedio histórico debe ser positivo'),
  projectedAmount: z
    .number()
    .min(0, 'La cantidad proyectada debe ser positiva'),
  growthRate: z.number().min(-100).max(1000), // Permitir decrecer hasta 100% y crecer hasta 1000%
  confidence: z.number().min(0).max(100),
  adjustmentReason: z.string().optional(),
});

// Schema principal para proyección de gastos
export const ExpenseProjectionSchema = z
  .object({
    id: z.string().min(1, 'ID es requerido'),
    name: z.string().min(1, 'El nombre de la proyección es requerido'),
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Fecha de inicio debe ser una fecha válida',
    }),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Fecha de fin debe ser una fecha válida',
    }),
    projectionType: z.enum([
      'historical_average',
      'trending',
      'seasonal',
      'manual',
      'hybrid',
    ]),
    basePeriod: BasePeriodSchema.optional(),
    categories: z
      .array(CategoryProjectionSchema)
      .min(1, 'Al menos una categoría es requerida'),
    totalProjectedAmount: z
      .number()
      .min(0, 'El total proyectado debe ser positivo'),
    confidence: z.number().min(0).max(100),
    createdAt: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Fecha de creación debe ser una fecha válida',
    }),
    updatedAt: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Fecha de actualización debe ser una fecha válida',
    }),
    isActive: z.boolean(),
    notes: z.string().optional(),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['endDate'],
  })
  .refine(
    (data) => {
      // Validar que el total proyectado sea consistente con las categorías
      const categoryTotal = data.categories.reduce(
        (sum, cat) => sum + cat.projectedAmount,
        0
      );
      const tolerance = 0.01; // Tolerancia para errores de redondeo
      return Math.abs(data.totalProjectedAmount - categoryTotal) <= tolerance;
    },
    {
      message:
        'El total proyectado debe coincidir con la suma de las categorías',
      path: ['totalProjectedAmount'],
    }
  );

// Schema para configuración de proyecciones
export const ProjectionSettingsSchema = z.object({
  defaultBasePeriodMonths: z.number().min(1).max(36),
  defaultGrowthRate: z.number().min(-100).max(1000),
  minimumDataPoints: z.number().min(1).max(100),
  confidenceThreshold: z.number().min(0).max(100),
  enableSeasonalAdjustment: z.boolean(),
  enableTrendAnalysis: z.boolean(),
});

// Schema para crear una nueva proyección (sin IDs y fechas generadas automáticamente)
export const CreateProjectionSchema = z
  .object({
    name: z
      .string()
      .min(1, 'El nombre de la proyección es requerido')
      .max(100, 'El nombre es muy largo'),
    startDate: z.string().refine(
      (date) => {
        const parsedDate = new Date(date);
        return !isNaN(parsedDate.getTime()) && parsedDate >= new Date();
      },
      {
        message: 'La fecha de inicio debe ser válida y no anterior a hoy',
      }
    ),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Fecha de fin debe ser una fecha válida',
    }),
    projectionType: z.enum([
      'historical_average',
      'trending',
      'seasonal',
      'manual',
      'hybrid',
    ]),
    basePeriodMonths: z.number().min(1).max(36).optional(),
    notes: z.string().max(500, 'Las notas son muy largas').optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end > start;
    },
    {
      message: 'La fecha de fin debe ser posterior a la fecha de inicio',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const diffMonths =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      return diffMonths <= 24; // Máximo 24 meses de proyección
    },
    {
      message: 'El período de proyección no puede exceder 24 meses',
      path: ['endDate'],
    }
  );

// Schema para actualizar proyección manual
export const UpdateProjectionSchema = z.object({
  id: z.string().min(1, 'ID es requerido'),
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre es muy largo')
    .optional(),
  categories: z
    .array(CategoryProjectionSchema)
    .min(1, 'Al menos una categoría es requerida')
    .optional(),
  notes: z.string().max(500, 'Las notas son muy largas').optional(),
  isActive: z.boolean().optional(),
});

// Funciones de validación helper
export function validateExpenseProjection(projection: unknown) {
  return ExpenseProjectionSchema.safeParse(projection);
}

export function validateCreateProjection(data: unknown) {
  return CreateProjectionSchema.safeParse(data);
}

export function validateUpdateProjection(data: unknown) {
  return UpdateProjectionSchema.safeParse(data);
}

export function validateProjectionSettings(settings: unknown) {
  return ProjectionSettingsSchema.safeParse(settings);
}

// Tipos derivados de los schemas
export type CreateProjectionData = z.infer<typeof CreateProjectionSchema>;
export type UpdateProjectionData = z.infer<typeof UpdateProjectionSchema>;
export type ProjectionSettingsData = z.infer<typeof ProjectionSettingsSchema>;
