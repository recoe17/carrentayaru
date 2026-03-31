/* eslint-disable @next/next/no-img-element */
import { createBooking, createGuestBooking } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function CarsPage() {
  const { userId } = await auth();
  const cars = await prisma.car.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold">Book your next rental car</h1>
        <p className="mt-2 text-slate-600">
          Browse vehicles, choose your dates, and confirm in seconds.
        </p>
      </section>

      {cars.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center text-slate-500 shadow-sm">
          No cars available yet. Add your first car in Dashboard.
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {cars.map((car) => (
            <article key={car.id} className="rounded-xl bg-white p-4 shadow-sm">
              {car.imageUrl ? (
                <img
                  src={car.imageUrl}
                  alt={car.name}
                  className="h-44 w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-44 items-center justify-center rounded-lg bg-slate-200 text-slate-500">
                  No image
                </div>
              )}
              <div className="mt-4 space-y-2">
                <h2 className="text-xl font-semibold">
                  {car.brand} {car.name}
                </h2>
                <p className="text-sm text-slate-600">
                  {car.location} • {car.seats} seats • {car.transmission} • {car.fuelType}
                </p>
                <p className="text-sm text-slate-600">Plate: {car.numberPlate ?? "—"}</p>
                <p className="font-semibold text-[var(--brand-red)]">
                  ${Number(car.dailyRate).toFixed(2)} / day
                </p>
              </div>

              {userId ? (
                <form action={createBooking} className="mt-4 grid gap-2">
                  <input type="hidden" name="carId" value={car.id} />
                  <label className="text-sm">
                    Start date
                    <input
                      type="date"
                      name="startDate"
                      min={format(new Date(), "yyyy-MM-dd")}
                      required
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    />
                  </label>
                  <label className="text-sm">
                    End date
                    <input
                      type="date"
                      name="endDate"
                      min={format(new Date(), "yyyy-MM-dd")}
                      required
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    />
                  </label>
                  <button type="submit" className="btn-primary mt-2">
                    Book now
                  </button>
                </form>
              ) : (
                <form action={createGuestBooking} className="mt-4 grid gap-2">
                  <input type="hidden" name="carId" value={car.id} />
                  <input
                    type="text"
                    name="customerName"
                    required
                    placeholder="Your full name"
                    className="w-full rounded-md border border-slate-300 px-3 py-2"
                  />
                  <input
                    type="text"
                    name="customerPhone"
                    required
                    placeholder="Phone number"
                    className="w-full rounded-md border border-slate-300 px-3 py-2"
                  />
                  <input
                    type="email"
                    name="customerEmail"
                    placeholder="Email (optional)"
                    className="w-full rounded-md border border-slate-300 px-3 py-2"
                  />
                  <label className="text-sm">
                    Start date
                    <input
                      type="date"
                      name="startDate"
                      min={format(new Date(), "yyyy-MM-dd")}
                      required
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    />
                  </label>
                  <label className="text-sm">
                    End date
                    <input
                      type="date"
                      name="endDate"
                      min={format(new Date(), "yyyy-MM-dd")}
                      required
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                    />
                  </label>
                  <button type="submit" className="btn-primary mt-2">
                    Continue as guest and book
                  </button>
                </form>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

