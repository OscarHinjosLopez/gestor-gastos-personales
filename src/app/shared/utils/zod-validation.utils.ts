import { z } from 'zod';

// Base schemas for reusable validation rules
const dateStringSchema = z
  .string()
  .min(1, 'La fecha es requerida')
  .regex(/^\d{4}-\d{2}-\d{2}/, 'Formato de fecha inválido (YYYY-MM-DD)')
  .refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) && parsed <= new Date();
  }, 'La fecha no puede ser futura');

const amountSchema = z
  .number()
  .min(0.01, 'El monto debe ser mayor a 0')
  .max(999999.99, 'El monto no puede exceder 999,999.99')
  .refine(
    (amount) => Number.isFinite(amount) && amount > 0,
    'El monto debe ser un número válido y positivo'
  );

const categorySchema = z
  .string()
  .min(1, 'La categoría es requerida')
  .max(50, 'La categoría no puede exceder 50 caracteres')
  .regex(
    /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s\-_0-9]+$/,
    'La categoría contiene caracteres inválidos'
  )
  .transform((val) => val.trim());

const sourceSchema = z
  .string()
  .min(1, 'La fuente de ingresos es requerida')
  .max(50, 'La fuente no puede exceder 50 caracteres')
  .regex(
    /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s\-_0-9]+$/,
    'La fuente contiene caracteres inválidos'
  )
  .transform((val) => val.trim());

const notesSchema = z
  .string()
  .max(200, 'Las notas no pueden exceder 200 caracteres')
  .optional()
  .transform((val) => val?.trim() || '');

// Main entity schemas
export const ExpenseSchema = z
  .object({
    id: z.string().optional(), // Optional for creation
    amount: amountSchema,
    category: categorySchema,
    date: dateStringSchema,
    notes: notesSchema,
  })
  .strict();

export const IncomeSchema = z
  .object({
    id: z.string().optional(), // Optional for creation
    amount: amountSchema,
    source: sourceSchema,
    date: dateStringSchema,
    notes: notesSchema,
  })
  .strict();

// Creation schemas (without id)
export const CreateExpenseSchema = ExpenseSchema.omit({ id: true });
export const CreateIncomeSchema = IncomeSchema.omit({ id: true });

// Validation result types
export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: string[];
};

// Enhanced validation class with Zod integration
export class ZodValidator {
  /**
   * Validate expense data
   */
  static validateExpense(
    data: unknown
  ): ValidationResult<z.infer<typeof ExpenseSchema>> {
    const result = ExpenseSchema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        errors: result.error.issues.map(
          (issue) => `${issue.path.join('.')}: ${issue.message}`
        ),
      };
    }
  }

  /**
   * Validate income data
   */
  static validateIncome(
    data: unknown
  ): ValidationResult<z.infer<typeof IncomeSchema>> {
    const result = IncomeSchema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        errors: result.error.issues.map(
          (issue) => `${issue.path.join('.')}: ${issue.message}`
        ),
      };
    }
  }

  /**
   * Validate creation data (without id)
   */
  static validateExpenseCreation(
    data: unknown
  ): ValidationResult<z.infer<typeof CreateExpenseSchema>> {
    const result = CreateExpenseSchema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        errors: result.error.issues.map(
          (issue) => `${issue.path.join('.')}: ${issue.message}`
        ),
      };
    }
  }

  static validateIncomeCreation(
    data: unknown
  ): ValidationResult<z.infer<typeof CreateIncomeSchema>> {
    const result = CreateIncomeSchema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        errors: result.error.issues.map(
          (issue) => `${issue.path.join('.')}: ${issue.message}`
        ),
      };
    }
  }

  /**
   * Safe parsing that returns either success with data or failure with errors
   */
  static safeParse<T>(
    schema: z.ZodSchema<T>,
    data: unknown
  ): ValidationResult<T> {
    const result = schema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return {
        success: false,
        errors: result.error.issues.map(
          (issue) => `${issue.path.join('.')}: ${issue.message}`
        ),
      };
    }
  }

  /**
   * Get field-specific validation for reactive forms
   */
  static getFieldValidationErrors(
    field: string,
    value: unknown,
    schema: z.ZodObject<any>
  ): string[] {
    try {
      const fieldSchema = schema.shape[field];
      if (fieldSchema) {
        fieldSchema.parse(value);
        return [];
      }
      return ['Campo no válido'];
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.issues.map((issue) => issue.message);
      }
      return ['Error de validación'];
    }
  }

  /**
   * Transform data using Zod transform functions
   */
  static sanitizeExpenseData(data: any): any {
    const result = CreateExpenseSchema.safeParse(data);
    return result.success ? result.data : data;
  }

  static sanitizeIncomeData(data: any): any {
    const result = CreateIncomeSchema.safeParse(data);
    return result.success ? result.data : data;
  }
}

// Type exports for use throughout the application
export type ExpenseType = z.infer<typeof ExpenseSchema>;
export type IncomeType = z.infer<typeof IncomeSchema>;
export type CreateExpenseType = z.infer<typeof CreateExpenseSchema>;
export type CreateIncomeType = z.infer<typeof CreateIncomeSchema>;
