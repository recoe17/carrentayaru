"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { differenceInCalendarDays } from "date-fns";
import { prisma } from "@/lib/prisma";

const carSchema = z.object({
  name: z.string().min(2),
  brand: z.string().min(2),
  dailyRate: z.coerce.number().positive(),
  seats: z.coerce.number().int().min(2),
  transmission: z.string().min(3),
  fuelType: z.string().min(3),
  imageUrl: z.string().url().optional().or(z.literal("")),
  location: z.string().min(2),
});

const bookingSchema = z.object({
  carId: z.string().cuid(),
  startDate: z.string().date(),
  endDate: z.string().date(),
});

const bookingStatusSchema = z.enum(["CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"]);

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
    },
  });

  revalidatePath("/");
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

  const overlappingBooking = await prisma.booking.findFirst({
    where: {
      carId: parsed.carId,
      status: "CONFIRMED",
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  });

  if (overlappingBooking) {
    throw new Error("Car already booked for selected dates.");
  }

  const totalPrice = Number(car.dailyRate) * rentalDays;

  await prisma.booking.create({
    data: {
      carId: parsed.carId,
      clerkUserId: userId,
      startDate,
      endDate,
      totalPrice,
    },
  });

  revalidatePath("/");
  revalidatePath("/my-bookings");
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
}
