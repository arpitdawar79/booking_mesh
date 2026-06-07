import { z } from "zod";

export const bookingCreateSchema = z.object({
  guestFullName: z.string().min(1, "Guest name is required"),
  guestEmail: z.string().email("Invalid email address"),
  guestPhone: z.string().optional().nullable(),
  adultCount: z.coerce.number().int().min(1).default(1),
  childCount: z.coerce.number().int().min(0).default(0),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (yyyy-MM-dd)"),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (yyyy-MM-dd)"),
  checkInTime: z.string().default("1:00 PM"),
  checkOutTime: z.string().default("10:00 AM"),
  roomCount: z.coerce.number().int().min(1).default(1),
  roomType: z.string().default("Boutique Room"),
  mealPlan: z.string().default("As per booking"),
  currency: z.string().default("INR"),
  totalAmount: z.coerce.number().min(0),
  amountPaidOnline: z.coerce.number().min(0).default(0),
  propertyAddress: z.string().optional(),
  propertyPhone: z.string().optional(),
  propertyEmail: z.string().optional(),
  caretakerNumber: z.string().optional(),
  parkingDetails: z.string().optional(),
  mapLink: z.string().optional(),
  cancellationPolicy: z.string().optional(),
  specialRequests: z.string().optional(),
});

export const bookingUpdateSchema = z.object({
  id: z.string().min(1),
  guestFullName: z.string().min(1).optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional().nullable(),
  adultCount: z.coerce.number().int().min(1).optional(),
  childCount: z.coerce.number().int().min(0).optional(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  roomCount: z.coerce.number().int().min(1).optional(),
  roomType: z.string().optional(),
  mealPlan: z.string().optional(),
  totalAmount: z.coerce.number().min(0).optional(),
  amountPaidOnline: z.coerce.number().min(0).optional(),
  status: z.enum(["confirmed", "cancelled", "completed", "archived"]).optional(),
  paymentStatus: z.enum(["pending", "partially_paid", "paid_in_full", "refunded"]).optional(),
  specialRequests: z.string().optional(),
});

export const bookingStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["confirmed", "cancelled", "completed", "archived"]),
});

export const sendEmailSchema = z.object({
  bookingId: z.string().min(1),
  type: z.string().min(1),
  to: z.array(z.string().email()),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  subject: z.string().optional(),
  customMessage: z.string().optional(),
});

export const sendWhatsAppSchema = z.object({
  bookingId: z.string().min(1),
  type: z.string().min(1),
  sendPdf: z.boolean().optional(),
  customMessage: z.string().optional(),
});

export const authSchema = z.object({
  password: z.string().optional(),
  logout: z.boolean().optional(),
});

export const guestCreateSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  address: z.string().optional(),
  preferences: z.string().optional(),
});

export const guestUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  address: z.string().optional(),
  preferences: z.string().optional(),
});

export const paymentCreateSchema = z.object({
  bookingId: z.string().min(1),
  amount: z.coerce.number().min(0),
  method: z.enum(["upi", "card", "cash", "bank_transfer"]),
  referenceNumber: z.string().optional(),
  recordedBy: z.string().optional(),
  isRefund: z.boolean().default(false),
  refundReason: z.string().optional(),
});

export const availabilityQuerySchema = z.object({
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  roomType: z.string().optional(),
});

export const gstrExportSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/), // yyyy-MM
});

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
export type BookingUpdateInput = z.infer<typeof bookingUpdateSchema>;
export type GuestCreateInput = z.infer<typeof guestCreateSchema>;
export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;
