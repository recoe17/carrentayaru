"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { differenceInCalendarDays, format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { buildQuotePdf } from "@/lib/quote-pdf";
import { Resend } from "resend";

function makeNumber(prefix: string) {
  const y = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 900000 + 100000);
  return `${prefix}-${y}-${rand}`;
}

const carSchema = z.object({
  name: z.string().min(2),
  brand: z.string().min(2),
  dailyRate: z.coerce.number().positive(),
  status: z.enum(["AVAILABLE", "RENTED", "MAINTENANCE"]).optional().default("AVAILABLE"),
  mileageKm: z.coerce.number().int().min(0).optional().default(0),
  seats: z.coerce.number().int().min(2),
  transmission: z.string().min(3),
  fuelType: z.string().min(3),
  imageUrl: z.string().url().optional().or(z.literal("")),
  location: z.string().min(2),
  insuranceExpiryAt: z.string().date().optional().or(z.literal("")),
  licenseExpiryAt: z.string().date().optional().or(z.literal("")),
  inspectionNotes: z.string().optional().or(z.literal("")),
  conditionReport: z.string().optional().or(z.literal("")),
  serviceDueAt: z.string().date().optional().or(z.literal("")),
  serviceNotes: z.string().optional().or(z.literal("")),
});

const bookingSchema = z.object({
  carId: z.string().cuid(),
  startDate: z.string().date(),
  endDate: z.string().date(),
});

const bookingStatusSchema = z.enum(["CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"]);

const staffBookingSchema = bookingSchema.extend({
  customerName: z.string().min(2),
  customerPhone: z.string().min(5).optional().or(z.literal("")),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerId: z.string().cuid().optional().or(z.literal("")),
});

const customerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(5).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  nationalId: z.string().optional().or(z.literal("")),
  licenseNumber: z.string().optional().or(z.literal("")),
  licenseExpiryAt: z.string().date().optional().or(z.literal("")),
  licenseVerified: z.union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal(""), z.undefined()]),
  blacklisted: z.union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal(""), z.undefined()]),
  riskNotes: z.string().optional().or(z.literal("")),
});

const quoteSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(5).optional().or(z.literal("")),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerId: z.string().cuid().optional().or(z.literal("")),
  carId: z.string().cuid(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  notes: z.string().optional().or(z.literal("")),
});

const paymentSchema = z.object({
  bookingId: z.string().cuid(),
  amount: z.coerce.number().positive(),
  method: z.enum(["CASH", "EFT", "CARD", "MOBILE"]),
  type: z.enum(["PAYMENT", "DEPOSIT", "REFUND", "PENALTY"]).optional().default("PAYMENT"),
  reference: z.string().optional().or(z.literal("")),
});

const quotePaymentSchema = z.object({
  quoteId: z.string().cuid(),
  amount: z.coerce.number().positive(),
  method: z.enum(["CASH", "EFT", "CARD", "MOBILE"]),
  reference: z.string().optional().or(z.literal("")),
});

const sendQuoteSchema = z.object({
  quoteId: z.string().cuid(),
  toEmail: z.string().email(),
});

const serviceSchema = z.object({
  carId: z.string().cuid(),
  serviceDate: z.string().date().optional().or(z.literal("")),
  description: z.string().min(2),
  cost: z.coerce.number().optional(),
  nextDueAt: z.string().date().optional().or(z.literal("")),
});

const expenseSchema = z.object({
  category: z.enum(["FUEL", "MAINTENANCE", "INSURANCE", "OTHER"]),
  carId: z.string().cuid().optional().or(z.literal("")),
  amount: z.coerce.number().positive(),
  notes: z.string().optional().or(z.literal("")),
  expenseDate: z.string().date().optional().or(z.literal("")),
});

const rentalOpsSchema = z.object({
  bookingId: z.string().cuid(),
  handoverFuelLevel: z.string().optional().or(z.literal("")),
  returnFuelLevel: z.string().optional().or(z.literal("")),
  handoverNotes: z.string().optional().or(z.literal("")),
  returnNotes: z.string().optional().or(z.literal("")),
  damageNotes: z.string().optional().or(z.literal("")),
  latePenalty: z.coerce.number().optional(),
  damagePenalty: z.coerce.number().optional(),
  fuelPenalty: z.coerce.number().optional(),
  returnDate: z.string().date().optional().or(z.literal("")),
});

const roleSchema = z.object({
  clerkUserId: z.string().min(3),
  role: z.enum(["ADMIN", "ACCOUNTANT", "CLERK"]),
});

async function assertCarIsAvailable(params: {
  carId: string;
  startDate: Date;
  endDate: Date;
}) {
  const overlappingBooking = await prisma.booking.findFirst({
    where: {
      carId: params.carId,
      status: { in: ["CONFIRMED", "ACTIVE"] },
      startDate: { lte: params.endDate },
      endDate: { gte: params.startDate },
    },
  });

  if (overlappingBooking) {
    throw new Error("Car already booked for selected dates.");
  }
}

export async function createCar(formData: FormData) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("You must sign in.");
  }

  const parsed = carSchema.parse(Object.fromEntries(formData));

  await prisma.car.create({
    data: {
      ...parsed,
      imageUrl: parsed.imageUrl || null,
      dailyRate: parsed.dailyRate,
      status: parsed.status,
      mileageKm: parsed.mileageKm,
      insuranceExpiryAt: parsed.insuranceExpiryAt ? new Date(parsed.insuranceExpiryAt) : null,
      licenseExpiryAt: parsed.licenseExpiryAt ? new Date(parsed.licenseExpiryAt) : null,
      inspectionNotes: parsed.inspectionNotes || null,
      conditionReport: parsed.conditionReport || null,
      serviceDueAt: parsed.serviceDueAt ? new Date(parsed.serviceDueAt) : null,
      serviceNotes: parsed.serviceNotes || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/cars");
  revalidatePath("/dashboard");
}

export async function createBooking(formData: FormData) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("You must sign in.");
  }

  const parsed = bookingSchema.parse(Object.fromEntries(formData));
  const car = await prisma.car.findUnique({ where: { id: parsed.carId } });
  if (!car) {
    throw new Error("Car not found.");
  }

  const startDate = new Date(parsed.startDate);
  const endDate = new Date(parsed.endDate);
  const rentalDays = differenceInCalendarDays(endDate, startDate) + 1;

  if (rentalDays <= 0) {
    throw new Error("End date must be after start date.");
  }

  await assertCarIsAvailable({ carId: parsed.carId, startDate, endDate });

  const totalPrice = Number(car.dailyRate) * rentalDays;

  await prisma.booking.create({
    data: {
      carId: parsed.carId,
      clerkUserId: userId,
      createdByClerkUserId: userId,
      startDate,
      endDate,
      totalPrice,
    },
  });

  revalidatePath("/");
  revalidatePath("/cars");
  revalidatePath("/my-bookings");
}

export async function createBookingForCustomer(formData: FormData) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("You must sign in.");
  }

  const parsed = staffBookingSchema.parse(Object.fromEntries(formData));
  const car = await prisma.car.findUnique({ where: { id: parsed.carId } });
  if (!car) {
    throw new Error("Car not found.");
  }

  const startDate = new Date(parsed.startDate);
  const endDate = new Date(parsed.endDate);
  const rentalDays = differenceInCalendarDays(endDate, startDate) + 1;

  if (rentalDays <= 0) {
    throw new Error("End date must be after start date.");
  }

  await assertCarIsAvailable({ carId: parsed.carId, startDate, endDate });

  const totalPrice = Number(car.dailyRate) * rentalDays;

  await prisma.booking.create({
    data: {
      carId: parsed.carId,
      createdByClerkUserId: userId,
      customerId: parsed.customerId || null,
      customerName: parsed.customerName,
      customerPhone: parsed.customerPhone || null,
      customerEmail: parsed.customerEmail || null,
      startDate,
      endDate,
      totalPrice,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/");
  revalidatePath("/cars");
}

export async function createGuestBooking(formData: FormData) {
  const parsed = staffBookingSchema.parse(Object.fromEntries(formData));
  const car = await prisma.car.findUnique({ where: { id: parsed.carId } });
  if (!car) {
    throw new Error("Car not found.");
  }

  const startDate = new Date(parsed.startDate);
  const endDate = new Date(parsed.endDate);
  const rentalDays = differenceInCalendarDays(endDate, startDate) + 1;

  if (rentalDays <= 0) {
    throw new Error("End date must be after start date.");
  }

  await assertCarIsAvailable({ carId: parsed.carId, startDate, endDate });

  const totalPrice = Number(car.dailyRate) * rentalDays;

  await prisma.booking.create({
    data: {
      carId: parsed.carId,
      customerId: parsed.customerId || null,
      customerName: parsed.customerName,
      customerPhone: parsed.customerPhone || null,
      customerEmail: parsed.customerEmail || null,
      startDate,
      endDate,
      totalPrice,
      status: "CONFIRMED",
    },
  });

  revalidatePath("/cars");
  revalidatePath("/dashboard");
}

export async function createCustomer(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("You must sign in.");

  const parsed = customerSchema.parse(Object.fromEntries(formData));

  await prisma.customer.create({
    data: {
      name: parsed.name,
      phone: parsed.phone || null,
      email: parsed.email || null,
      nationalId: parsed.nationalId || null,
      licenseNumber: parsed.licenseNumber || null,
      licenseExpiryAt: parsed.licenseExpiryAt ? new Date(parsed.licenseExpiryAt) : null,
      licenseVerified: parsed.licenseVerified === "on" || parsed.licenseVerified === "true",
      blacklisted: parsed.blacklisted === "on" || parsed.blacklisted === "true",
      riskNotes: parsed.riskNotes || null,
    },
  });

  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard");
}

export async function createQuote(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("You must sign in.");

  const parsed = quoteSchema.parse(Object.fromEntries(formData));
  const car = await prisma.car.findUnique({ where: { id: parsed.carId } });
  if (!car) throw new Error("Car not found.");

  const startDate = new Date(parsed.startDate);
  const endDate = new Date(parsed.endDate);
  const rentalDays = differenceInCalendarDays(endDate, startDate) + 1;
  if (rentalDays <= 0) throw new Error("End date must be after start date.");

  const totalPrice = Number(car.dailyRate) * rentalDays;

  await prisma.quote.create({
    data: {
      quoteNumber: makeNumber("QTE"),
      createdByClerkUserId: userId,
      customerId: parsed.customerId || null,
      customerName: parsed.customerName,
      customerPhone: parsed.customerPhone || null,
      customerEmail: parsed.customerEmail || null,
      carId: parsed.carId,
      startDate,
      endDate,
      dailyRate: car.dailyRate,
      totalPrice,
      notes: parsed.notes || null,
    },
  });

  revalidatePath("/dashboard/quotes");
  revalidatePath("/dashboard");
}

export async function convertQuoteToBooking(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("You must sign in.");

  const quoteId = String(formData.get("quoteId") || "");
  if (!quoteId) throw new Error("Quote ID is required.");

  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote) throw new Error("Quote not found.");

  await assertCarIsAvailable({
    carId: quote.carId,
    startDate: quote.startDate,
    endDate: quote.endDate,
  });

  const booking = await prisma.booking.create({
    data: {
      carId: quote.carId,
      createdByClerkUserId: userId,
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerPhone: quote.customerPhone,
      customerEmail: quote.customerEmail,
      startDate: quote.startDate,
      endDate: quote.endDate,
      totalPrice: quote.totalPrice,
      status: "CONFIRMED",
    },
  });

  await prisma.quote.update({
    where: { id: quote.id },
    data: { status: "CONVERTED", bookingId: booking.id },
  });

  revalidatePath("/dashboard/quotes");
  revalidatePath("/dashboard");
}

export async function recordQuotePayment(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("You must sign in.");

  const parsed = quotePaymentSchema.parse(Object.fromEntries(formData));
  const quote = await prisma.quote.findUnique({ where: { id: parsed.quoteId } });
  if (!quote) throw new Error("Quote not found.");

  let bookingId = quote.bookingId;
  if (!bookingId) {
    await assertCarIsAvailable({
      carId: quote.carId,
      startDate: quote.startDate,
      endDate: quote.endDate,
    });

    const booking = await prisma.booking.create({
      data: {
        carId: quote.carId,
        createdByClerkUserId: userId,
        customerId: quote.customerId,
        customerName: quote.customerName,
        customerPhone: quote.customerPhone,
        customerEmail: quote.customerEmail,
        startDate: quote.startDate,
        endDate: quote.endDate,
        totalPrice: quote.totalPrice,
        status: "CONFIRMED",
      },
    });
    bookingId = booking.id;
  }

  const payment = await prisma.payment.create({
    data: {
      bookingId,
      amount: parsed.amount,
      method: parsed.method,
      reference: parsed.reference || null,
      createdByClerkUserId: userId,
    },
  });

  await prisma.receipt.create({
    data: {
      receiptNumber: makeNumber("RCP"),
      bookingId,
      paymentId: payment.id,
      issuedByClerkUserId: userId,
    },
  });

  await prisma.quote.update({
    where: { id: quote.id },
    data: {
      status: "PAID",
      bookingId,
    },
  });

  revalidatePath("/dashboard/quotes");
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard");
}

export async function sendQuoteByEmail(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("You must sign in.");

  const parsed = sendQuoteSchema.parse(Object.fromEntries(formData));
  const quote = await prisma.quote.findUnique({
    where: { id: parsed.quoteId },
    include: { car: true },
  });
  if (!quote) throw new Error("Quote not found.");

  if (!process.env.RESEND_API_KEY || !process.env.QUOTE_FROM_EMAIL) {
    throw new Error("Email is not configured. Set RESEND_API_KEY and QUOTE_FROM_EMAIL.");
  }

  const pdf = await buildQuotePdf({
    quoteNumber: quote.quoteNumber,
    status: quote.status,
    customerName: quote.customerName,
    customerPhone: quote.customerPhone,
    customerEmail: quote.customerEmail,
    carLabel: `${quote.car.brand} ${quote.car.name}`,
    startDate: format(quote.startDate, "dd MMM yyyy"),
    endDate: format(quote.endDate, "dd MMM yyyy"),
    dailyRate: Number(quote.dailyRate),
    totalPrice: Number(quote.totalPrice),
    notes: quote.notes,
  });

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.QUOTE_FROM_EMAIL,
    to: parsed.toEmail,
    subject: `Your quote ${quote.quoteNumber} - Yarutso Car Rental`,
    html: `
      <p>Hello ${quote.customerName},</p>
      <p>Please find your quotation attached.</p>
      <p><strong>Quote:</strong> ${quote.quoteNumber}<br/>
      <strong>Vehicle:</strong> ${quote.car.brand} ${quote.car.name}<br/>
      <strong>Total:</strong> $${Number(quote.totalPrice).toFixed(2)}</p>
      <p>Regards,<br/>Yarutso Car Rental</p>
    `,
    attachments: [
      {
        filename: `${quote.quoteNumber}.pdf`,
        content: Buffer.from(pdf),
      },
    ],
  });

  await prisma.quote.update({
    where: { id: quote.id },
    data: { status: quote.status === "DRAFT" ? "SENT" : quote.status },
  });

  revalidatePath(`/dashboard/quotes/${quote.id}`);
  revalidatePath("/dashboard/quotes");
}

export async function recordPayment(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("You must sign in.");

  const parsed = paymentSchema.parse(Object.fromEntries(formData));

  const payment = await prisma.payment.create({
    data: {
      bookingId: parsed.bookingId,
      amount: parsed.amount,
      method: parsed.method,
      type: parsed.type,
      reference: parsed.reference || null,
      createdByClerkUserId: userId,
    },
  });

  await prisma.receipt.create({
    data: {
      receiptNumber: makeNumber("RCP"),
      bookingId: parsed.bookingId,
      paymentId: payment.id,
      issuedByClerkUserId: userId,
    },
  });

  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard");
}

export async function createServiceRecord(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("You must sign in.");

  const parsed = serviceSchema.parse(Object.fromEntries(formData));
  const serviceDate = parsed.serviceDate ? new Date(parsed.serviceDate) : new Date();
  const nextDueAt = parsed.nextDueAt ? new Date(parsed.nextDueAt) : null;
  const cost = Number.isFinite(parsed.cost as number) ? (parsed.cost as number) : undefined;

  await prisma.serviceRecord.create({
    data: {
      carId: parsed.carId,
      serviceDate,
      description: parsed.description,
      cost: cost ?? null,
      nextDueAt,
    },
  });

  await prisma.car.update({
    where: { id: parsed.carId },
    data: {
      serviceDueAt: nextDueAt,
    },
  });

  revalidatePath("/dashboard/service");
  revalidatePath("/dashboard");
}

export async function createExpense(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("You must sign in.");

  const parsed = expenseSchema.parse(Object.fromEntries(formData));
  await prisma.expense.create({
    data: {
      category: parsed.category,
      carId: parsed.carId || null,
      amount: parsed.amount,
      notes: parsed.notes || null,
      expenseDate: parsed.expenseDate ? new Date(parsed.expenseDate) : new Date(),
    },
  });

  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard");
}

export async function updateRentalOperations(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("You must sign in.");

  const parsed = rentalOpsSchema.parse(Object.fromEntries(formData));
  const existing = await prisma.booking.findUnique({ where: { id: parsed.bookingId } });
  if (!existing) throw new Error("Booking not found.");

  const addLate = parsed.latePenalty ?? 0;
  const addDamage = parsed.damagePenalty ?? 0;
  const addFuel = parsed.fuelPenalty ?? 0;
  const newTotal = Number(existing.totalPrice) + addLate + addDamage + addFuel;

  await prisma.booking.update({
    where: { id: parsed.bookingId },
    data: {
      handoverFuelLevel: parsed.handoverFuelLevel || existing.handoverFuelLevel,
      returnFuelLevel: parsed.returnFuelLevel || existing.returnFuelLevel,
      handoverNotes: parsed.handoverNotes || existing.handoverNotes,
      returnNotes: parsed.returnNotes || existing.returnNotes,
      damageNotes: parsed.damageNotes || existing.damageNotes,
      latePenalty: Number(existing.latePenalty) + addLate,
      damagePenalty: Number(existing.damagePenalty) + addDamage,
      fuelPenalty: Number(existing.fuelPenalty) + addFuel,
      returnDate: parsed.returnDate ? new Date(parsed.returnDate) : existing.returnDate,
      totalPrice: newTotal,
      status: parsed.returnDate ? "COMPLETED" : existing.status,
    },
  });

  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/reports");
  revalidatePath("/my-bookings");
  revalidatePath("/dashboard");
}

export async function assignUserRole(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("You must sign in.");

  const parsed = roleSchema.parse(Object.fromEntries(formData));
  await prisma.userRole.upsert({
    where: { clerkUserId: parsed.clerkUserId },
    update: { role: parsed.role },
    create: { clerkUserId: parsed.clerkUserId, role: parsed.role },
  });

  await prisma.activityLog.create({
    data: {
      clerkUserId: userId,
      action: "ASSIGN_ROLE",
      entityType: "UserRole",
      entityId: parsed.clerkUserId,
      metadata: `role=${parsed.role}`,
    },
  });

  revalidatePath("/dashboard/access");
}

export async function cancelBooking(formData: FormData) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("You must sign in.");
  }

  const bookingId = String(formData.get("bookingId") || "");
  if (!bookingId) {
    throw new Error("Booking ID is required.");
  }

  await prisma.booking.updateMany({
    where: {
      id: bookingId,
      clerkUserId: userId,
      status: "CONFIRMED",
    },
    data: {
      status: "CANCELLED",
    },
  });

  revalidatePath("/my-bookings");
  revalidatePath("/");
  revalidatePath("/cars");
}

export async function updateBookingStatus(formData: FormData) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("You must sign in.");
  }

  const bookingId = String(formData.get("bookingId") || "");
  const rawStatus = String(formData.get("status") || "");
  const status = bookingStatusSchema.parse(rawStatus);

  if (!bookingId) {
    throw new Error("Booking ID is required.");
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status },
  });

  revalidatePath("/dashboard");
  revalidatePath("/my-bookings");
  revalidatePath("/");
}

export async function deleteCar(formData: FormData) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("You must sign in.");
  }

  const carId = String(formData.get("carId") || "");
  if (!carId) {
    throw new Error("Car ID is required.");
  }

  await prisma.car.delete({
    where: { id: carId },
  });

  revalidatePath("/dashboard");
  revalidatePath("/");
  revalidatePath("/cars");
}
