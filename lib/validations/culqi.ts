// ============================================================================
// VALIDACIONES ZOD PARA CULQI
// Schemas de validación para endpoints de pago y webhooks.
// Compatible con Zod v4+
// ============================================================================

import { z } from "zod";

// ============================================================================
// CHARGE REQUEST — /api/payments/culqi
// ============================================================================

export const CulqiChargeRequestSchema = z.object({
  bookingId: z
    .number({ message: "bookingId es requerido y debe ser un número" })
    .int("bookingId debe ser un entero")
    .positive("bookingId debe ser positivo"),
  token: z
    .string({ message: "token es requerido" })
    .min(1, "token no puede estar vacío")
    .regex(/^(tkn_|ype_)/, "token inválido"),
});

export type CulqiChargeRequest = z.infer<typeof CulqiChargeRequestSchema>;

// ============================================================================
// ORDER REQUEST — /api/culqi/order
// ============================================================================

export const CulqiOrderRequestSchema = z.object({
  bookingId: z
    .number({ message: "bookingId es requerido y debe ser un número" })
    .int("bookingId debe ser un entero")
    .positive("bookingId debe ser positivo"),
  // Expiration time in minutes (optional, defaults to 60)
  expirationMinutes: z
    .number()
    .int()
    .min(5, "Mínimo 5 minutos de expiración")
    .max(1440, "Máximo 24 horas (1440 minutos)")
    .optional()
    .default(60),
});

export type CulqiOrderRequest = z.infer<typeof CulqiOrderRequestSchema>;

// ============================================================================
// WEBHOOK EVENT — /api/webhooks/culqi
// ============================================================================

const CulqiMetadataSchema = z.object({
  bookingId: z.string().optional(),
  inspectionType: z.string().optional(),
  vehiclePlate: z.string().optional(),
}).passthrough(); // Allow additional metadata fields

const CulqiChargeSourceSchema = z.object({
  object: z.string(),
  card_number: z.string().optional(),
  card_brand: z.string().optional(),
  iin: z.object({
    card_type: z.string().optional(),
    card_brand: z.string().optional(),
  }).optional(),
}).passthrough();

const CulqiChargeOutcomeSchema = z.object({
  type: z.string(),
  code: z.string(),
  merchant_message: z.string(),
  user_message: z.string(),
}).passthrough();

export const CulqiChargeDataSchema = z.object({
  id: z.string().regex(/^chr_/, "charge ID debe empezar con 'chr_'"),
  amount: z.number().int().positive(),
  currency_code: z.string().length(3),
  email: z.string().email(),
  description: z.string().optional(),
  metadata: CulqiMetadataSchema,
  outcome: CulqiChargeOutcomeSchema.optional(),
  source: CulqiChargeSourceSchema.optional(),
  failure_code: z.string().optional(),
  failure_message: z.string().optional(),
}).passthrough();

export const CulqiOrderDataSchema = z.object({
  id: z.string().regex(/^ord_/, "order ID debe empezar con 'ord_'"),
  amount: z.number().int().positive(),
  currency_code: z.string().length(3),
  state: z.enum(["pending", "paid", "expired", "deleted"]),
  metadata: CulqiMetadataSchema,
  charges: z.array(CulqiChargeDataSchema).optional(),
}).passthrough();

export const CulqiWebhookEventSchema = z.object({
  id: z.string().regex(/^evt_/, "event ID debe empezar con 'evt_'"),
  type: z.string().min(1, "type es requerido"),
  created_at: z.number().int(),
  data: z.union([CulqiChargeDataSchema, CulqiOrderDataSchema]),
});

export type CulqiWebhookEvent = z.infer<typeof CulqiWebhookEventSchema>;

// ============================================================================
// ALTERNATIVE PAYMENT REQUEST — /api/payments/alternative
// ============================================================================

export const AlternativePaymentRequestSchema = z.object({
  bookingId: z
    .number({ message: "bookingId es requerido y debe ser un número" })
    .int("bookingId debe ser un entero")
    .positive("bookingId debe ser positivo"),
  paymentMethod: z.enum(["TRANSFER", "YAPE_PLIN", "WHATSAPP"], {
    message: "Método de pago inválido",
  }),
  operationNumber: z
    .string()
    .min(4, "Número de operación muy corto")
    .max(30, "Número de operación muy largo")
    .optional(),
});

export type AlternativePaymentRequest = z.infer<typeof AlternativePaymentRequestSchema>;

// ============================================================================
// AMOUNT VALIDATION
// ============================================================================

export const AmountSchema = z.object({
  amount: z
    .number({ message: "amount es requerido" })
    .int("amount debe ser en céntimos (entero)")
    .min(100, "Monto mínimo es S/1.00 (100 céntimos)")
    .max(100000000, "Monto máximo excedido"), // S/1,000,000
  currency: z
    .string()
    .length(3)
    .default("PEN")
    .refine((val) => val === "PEN" || val === "USD", {
      message: "Moneda debe ser PEN o USD",
    }),
});

// ============================================================================
// HELPER — Safe parse with detailed errors
// ============================================================================

export function parseWithDetails<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Zod v4 uses result.error.issues
  const errors = result.error.issues.map(
    (err: z.ZodIssue) => `${err.path.join(".")}: ${err.message}`
  );

  return { success: false, errors };
}
