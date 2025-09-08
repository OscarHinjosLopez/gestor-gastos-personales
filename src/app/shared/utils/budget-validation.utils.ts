import { z } from 'zod';
import {
  Budget,
  BudgetAlert,
  BudgetConfiguration,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  AlertType,
  AlertPriority,
} from '../models/budget.model';

// Enum schemas
export const AlertTypeSchema = z.enum(['info', 'warning', 'danger']);
export const AlertPrioritySchema = z.enum([
  'low',
  'medium',
  'high',
  'critical',
]);

// Budget validation schemas
export const CreateBudgetSchema = z
  .object({
    name: z
      .string()
      .min(1, 'El nombre es requerido')
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      .max(50, 'El nombre no puede exceder 50 caracteres'),

    category: z.string().min(1, 'La categoría es requerida'),

    monthlyLimit: z
      .number()
      .positive('El límite mensual debe ser positivo')
      .min(1, 'El límite mensual debe ser de al menos €1')
      .max(999999, 'El límite mensual no puede exceder €999,999'),

    warningThreshold: z
      .number()
      .min(1, 'El umbral de advertencia debe ser al menos 1%')
      .max(100, 'El umbral de advertencia no puede exceder 100%'),

    dangerThreshold: z
      .number()
      .min(1, 'El umbral de peligro debe ser al menos 1%')
      .max(100, 'El umbral de peligro no puede exceder 100%'),

    isActive: z.boolean(),
  })
  .refine((data) => data.warningThreshold < data.dangerThreshold, {
    message: 'El umbral de advertencia debe ser menor que el umbral de peligro',
    path: ['warningThreshold'],
  });

export const UpdateBudgetSchema = CreateBudgetSchema.partial().extend({
  id: z.string().min(1, 'ID es requerido'),
});

// Budget alert validation
export const BudgetAlertSchema = z.object({
  id: z.string(),
  budgetId: z.string(),
  budgetName: z.string(),
  category: z.string(),
  type: AlertTypeSchema,
  priority: AlertPrioritySchema,
  title: z.string().min(1, 'El título es requerido'),
  message: z.string().min(1, 'El mensaje es requerido'),
  currentAmount: z.number().min(0),
  budgetLimit: z.number().positive(),
  percentageUsed: z.number().min(0),
  isRead: z.boolean(),
  isDismissed: z.boolean(),
  triggeredAt: z.date(),
  expiresAt: z.date().optional(),
});

// Configuration validation
export const BudgetConfigurationSchema = z
  .object({
    id: z.string(),
    enableNotifications: z.boolean(),
    soundEnabled: z.boolean(),
    emailNotifications: z.boolean(),
    dailyDigest: z.boolean(),
    weeklyReport: z.boolean(),
    autoCreateMonthlyBudgets: z.boolean(),

    defaultWarningThreshold: z
      .number()
      .min(1, 'El umbral de advertencia por defecto debe ser al menos 1%')
      .max(99, 'El umbral de advertencia por defecto debe ser menor a 99%'),

    defaultDangerThreshold: z
      .number()
      .min(2, 'El umbral de peligro por defecto debe ser al menos 2%')
      .max(100, 'El umbral de peligro por defecto no puede exceder 100%'),

    categories: z
      .array(z.string().min(1))
      .min(1, 'Debe haber al menos una categoría'),
  })
  .refine(
    (data) => data.defaultWarningThreshold < data.defaultDangerThreshold,
    {
      message:
        'El umbral de advertencia por defecto debe ser menor que el umbral de peligro por defecto',
      path: ['defaultWarningThreshold'],
    }
  );

// Alert filtering validation
export const AlertFiltersSchema = z.object({
  type: z.array(AlertTypeSchema).optional(),
  priority: z.array(AlertPrioritySchema).optional(),
  category: z.array(z.string()).optional(),
  isRead: z.boolean().optional(),
  isDismissed: z.boolean().optional(),
  dateRange: z
    .object({
      start: z.date(),
      end: z.date(),
    })
    .optional(),
});

// Form validation helpers
export class BudgetValidator {
  static validateCreateBudget(data: any): {
    success: boolean;
    data?: CreateBudgetRequest;
    errors?: string[];
  } {
    try {
      const validatedData = CreateBudgetSchema.parse(data);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((issue: any) => issue.message);
        return { success: false, errors };
      }
      return { success: false, errors: ['Error de validación desconocido'] };
    }
  }

  static validateUpdateBudget(data: any): {
    success: boolean;
    data?: UpdateBudgetRequest;
    errors?: string[];
  } {
    try {
      const validatedData = UpdateBudgetSchema.parse(data);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((issue: any) => issue.message);
        return { success: false, errors };
      }
      return { success: false, errors: ['Error de validación desconocido'] };
    }
  }

  static validateConfiguration(data: any): {
    success: boolean;
    data?: BudgetConfiguration;
    errors?: string[];
  } {
    try {
      const validatedData = BudgetConfigurationSchema.parse(data);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((issue: any) => issue.message);
        return { success: false, errors };
      }
      return { success: false, errors: ['Error de validación desconocido'] };
    }
  }

  static validateAmount(amount: any): { success: boolean; errors?: string[] } {
    try {
      z.number()
        .positive('El monto debe ser positivo')
        .min(0.01, 'El monto mínimo es €0.01')
        .max(999999, 'El monto máximo es €999,999')
        .parse(amount);
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((issue: any) => issue.message);
        return { success: false, errors };
      }
      return { success: false, errors: ['Monto inválido'] };
    }
  }

  static validatePercentage(percentage: any): {
    success: boolean;
    errors?: string[];
  } {
    try {
      z.number()
        .min(0, 'El porcentaje debe ser al menos 0%')
        .max(100, 'El porcentaje no puede exceder 100%')
        .parse(percentage);
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((issue: any) => issue.message);
        return { success: false, errors };
      }
      return { success: false, errors: ['Porcentaje inválido'] };
    }
  }

  static validateCategory(category: any): {
    success: boolean;
    errors?: string[];
  } {
    try {
      z.string()
        .min(1, 'La categoría es requerida')
        .max(30, 'La categoría no puede exceder 30 caracteres')
        .parse(category);
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((issue: any) => issue.message);
        return { success: false, errors };
      }
      return { success: false, errors: ['Categoría inválida'] };
    }
  }

  // Real-time validation for forms
  static validateBudgetName(name: string): string | null {
    try {
      CreateBudgetSchema.shape.name.parse(name);
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.issues[0]?.message || 'Nombre inválido';
      }
      return 'Nombre inválido';
    }
  }

  static validateMonthlyLimit(limit: number): string | null {
    try {
      CreateBudgetSchema.shape.monthlyLimit.parse(limit);
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.issues[0]?.message || 'Límite inválido';
      }
      return 'Límite inválido';
    }
  }

  static validateThresholds(
    warning: number,
    danger: number
  ): {
    warningError: string | null;
    dangerError: string | null;
  } {
    const warningValidation = BudgetValidator.validatePercentage(warning);
    const dangerValidation = BudgetValidator.validatePercentage(danger);

    let warningError = warningValidation.success
      ? null
      : warningValidation.errors?.[0] || 'Error';
    let dangerError = dangerValidation.success
      ? null
      : dangerValidation.errors?.[0] || 'Error';

    // Check relationship between thresholds
    if (
      warningValidation.success &&
      dangerValidation.success &&
      warning >= danger
    ) {
      warningError =
        'El umbral de advertencia debe ser menor que el de peligro';
    }

    return { warningError, dangerError };
  }
}

// Export types for convenience
export type CreateBudgetValidation = z.infer<typeof CreateBudgetSchema>;
export type UpdateBudgetValidation = z.infer<typeof UpdateBudgetSchema>;
export type BudgetConfigurationValidation = z.infer<
  typeof BudgetConfigurationSchema
>;
export type AlertFiltersValidation = z.infer<typeof AlertFiltersSchema>;
