import { createCar } from "@/app/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [cars, bookings] = await Promise.all([
    prisma.car.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      include: { car: true },
      take: 10,
    }),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Fleet Dashboard</h1>
        <p className="mt-1 text-slate-600">
          Add cars and monitor your latest bookings.
        </p>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Add new car</h2>
        <form action={createCar} className="grid gap-3 md:grid-cols-2">
          <input name="brand" placeholder="Brand (Toyota)" required className="input" />
          <input name="name" placeholder="Model (Corolla)" required className="input" />
          <input
            name="dailyRate"
            type="number"
            min={1}
            step="0.01"
            placeholder="Daily rate"
            required
            className="input"
          />
          <input name="seats" type="number" min={2} placeholder="Seats" required className="input" />
          <input name="transmission" placeholder="Transmission (Automatic)" required className="input" />
          <input name="fuelType" placeholder="Fuel type (Petrol)" required className="input" />
          <input name="location" placeholder="Location (Harare)" required className="input" />
          <input name="imageUrl" placeholder="Image URL (optional)" className="input" />
          <button type="submit" className="rounded-md bg-blue-700 px-4 py-2 text-white md:col-span-2">
            Save car
          </button>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-xl font-semibold">Cars ({cars.length})</h2>
          <ul className="space-y-2 text-sm">
            {cars.map((car) => (
              <li key={car.id} className="rounded-md border border-slate-200 p-2">
                {car.brand} {car.name} - ${Number(car.dailyRate).toFixed(2)}/day
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-xl font-semibold">Latest bookings</h2>
          <ul className="space-y-2 text-sm">
            {bookings.map((booking) => (
              <li key={booking.id} className="rounded-md border border-slate-200 p-2">
                {booking.car.brand} {booking.car.name} - {booking.status}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
