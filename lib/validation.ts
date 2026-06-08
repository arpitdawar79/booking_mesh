import { z } from "zod";

export const bookingCreateSchema = z.object({
  guestFullName: z.string().min(1, "Guest name is required"),
  guestEmail: z.string().email("Invalid email address"),
  guestPhone: z.string().optional().nullable(),
  adultCount: z.coerce.number().int().min(1).default(1),
  childCount: z.coerce.number().int().min(0).default(0),
  checkInDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (yyyy-MM-dd)"),
  checkOutDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (yyyy-MM-dd)"),
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
  checkInDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  checkOutDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  roomCount: z.coerce.number().int().min(1).optional(),
  roomType: z.string().optional(),
  mealPlan: z.string().optional(),
  totalAmount: z.coerce.number().min(0).optional(),
  amountPaidOnline: z.coerce.number().min(0).optional(),
  status: z
    .enum(["confirmed", "cancelled", "completed", "archived"])
    .optional(),
  paymentStatus: z
    .enum(["pending", "partially_paid", "paid_in_full", "refunded"])
    .optional(),
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

export const whatsAppConfigSchema = z.object({
  adminGroupId: z.string().min(1, "Admin group ID is required"),
});

export const expenseCreateSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (yyyy-MM-dd)"),
  category: z.enum([
    "utilities",
    "maintenance",
    "salaries",
    "food_beverages",
    "supplies",
    "marketing",
    "transport",
    "misc",
  ]),
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  paymentMethod: z
    .enum(["upi", "card", "cash", "bank_transfer"])
    .default("cash"),
  recordedBy: z.string().optional(),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
});

export const expenseUpdateSchema = z.object({
  id: z.string().min(1),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  category: z
    .enum([
      "utilities",
      "maintenance",
      "salaries",
      "food_beverages",
      "supplies",
      "marketing",
      "transport",
      "misc",
    ])
    .optional(),
  description: z.string().min(1).optional(),
  amount: z.coerce.number().min(0).optional(),
  paymentMethod: z.enum(["upi", "card", "cash", "bank_transfer"]).optional(),
  recordedBy: z.string().optional(),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
});

export const restaurantSaleCreateSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (yyyy-MM-dd)"),
  itemName: z.string().min(1, "Item name is required"),
  quantity: z.coerce
    .number()
    .int()
    .min(1, "Quantity must be at least 1")
    .default(1),
  unitPrice: z.coerce.number().min(0, "Unit price must be positive"),
  totalAmount: z.coerce.number().min(0, "Total amount must be positive"),
  paymentMethod: z
    .enum(["upi", "card", "cash", "bank_transfer"])
    .default("cash"),
  recordedBy: z.string().optional(),
  notes: z.string().optional(),
});

export const restaurantSaleUpdateSchema = z.object({
  id: z.string().min(1),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  itemName: z.string().min(1).optional(),
  quantity: z.coerce.number().int().min(1).optional(),
  unitPrice: z.coerce.number().min(0).optional(),
  totalAmount: z.coerce.number().min(0).optional(),
  paymentMethod: z.enum(["upi", "card", "cash", "bank_transfer"]).optional(),
  recordedBy: z.string().optional(),
  notes: z.string().optional(),
});

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
export type BookingUpdateInput = z.infer<typeof bookingUpdateSchema>;
export type GuestCreateInput = z.infer<typeof guestCreateSchema>;
export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;
export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>;
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>;
export type RestaurantSaleCreateInput = z.infer<
  typeof restaurantSaleCreateSchema
>;
export type RestaurantSaleUpdateInput = z.infer<
  typeof restaurantSaleUpdateSchema
>;

export const employeeCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  designation: z.string().default("Staff"),
  monthlySalary: z.coerce.number().min(0).default(0),
  joiningDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (yyyy-MM-dd)"),
  status: z.string().default("active"),
});

export const employeeUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  designation: z.string().optional(),
  monthlySalary: z.coerce.number().min(0).optional(),
  joiningDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  status: z.string().optional(),
});

export const salarySlipCreateSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  daysWorked: z.coerce.number().int().min(0).max(31).default(30),
  totalDays: z.coerce.number().int().min(1).max(31).default(30),
  basicSalary: z.coerce.number().min(0).default(0),
  overtimeDays: z.coerce.number().int().min(0).default(0),
  overtimeRate: z.coerce.number().min(0).default(0),
  overtimeAmount: z.coerce.number().min(0).default(0),
  allowance: z.coerce.number().min(0).default(0),
  deduction: z.coerce.number().min(0).default(0),
  deductionReason: z.string().optional(),
  netSalary: z.coerce.number().min(0).default(0),
  paymentMethod: z
    .enum(["upi", "card", "cash", "bank_transfer"])
    .default("cash"),
  paymentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (yyyy-MM-dd)")
    .optional(),
  notes: z.string().optional(),
});

export const salarySlipUpdateSchema = z.object({
  id: z.string().min(1),
  daysWorked: z.coerce.number().int().min(0).max(31).optional(),
  totalDays: z.coerce.number().int().min(1).max(31).optional(),
  basicSalary: z.coerce.number().min(0).optional(),
  overtimeDays: z.coerce.number().int().min(0).optional(),
  overtimeRate: z.coerce.number().min(0).optional(),
  overtimeAmount: z.coerce.number().min(0).optional(),
  allowance: z.coerce.number().min(0).optional(),
  deduction: z.coerce.number().min(0).optional(),
  deductionReason: z.string().optional(),
  netSalary: z.coerce.number().min(0).optional(),
  paymentMethod: z.enum(["upi", "card", "cash", "bank_transfer"]).optional(),
  paymentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  notes: z.string().optional(),
});

export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;
export type SalarySlipCreateInput = z.infer<typeof salarySlipCreateSchema>;
export type SalarySlipUpdateInput = z.infer<typeof salarySlipUpdateSchema>;
