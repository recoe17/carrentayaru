import {
  createBookingForCustomer,
  createCar,
  deleteCar,
  updateBookingStatus,
} from "@/app/actions";
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

  const activeBookings = bookings.filter((booking) =>
    ["CONFIRMED", "ACTIVE"].includes(booking.status),
  ).length;
  const totalRevenue = bookings
    .filter((booking) => booking.status !== "CANCELLED")
    .reduce((sum, booking) => sum + Number(booking.totalPrice), 0);

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Fleet Dashboard</h1>
        <p className="mt-1 text-slate-600">
          Manage inventory, booking lifecycle, and rental operations.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Cars</p>
          <p className="text-2xl font-bold">{cars.length}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Open Rentals</p>
          <p className="text-2xl font-bold">{activeBookings}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Revenue (non-cancelled)</p>
          <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
        </div>
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
          <button type="submit" className="btn-primary md:col-span-2">
            Save car
          </button>
        </form>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Book for customer</h2>
        <form action={createBookingForCustomer} className="grid gap-3 md:grid-cols-2">
          <select name="carId" required className="input" defaultValue="">
            <option value="" disabled>
              Select car
            </option>
            {cars.map((car) => (
              <option key={car.id} value={car.id}>
                {car.brand} {car.name} (${Number(car.dailyRate).toFixed(2)}/day)
              </option>
            ))}
          </select>
          <input name="customerName" placeholder="Customer name" required className="input" />
          <input name="customerPhone" placeholder="Phone (optional)" className="input" />
          <input name="customerEmail" placeholder="Email (optional)" className="input" />
          <input name="startDate" type="date" required className="input" />
          <input name="endDate" type="date" required className="input" />
          <button type="submit" className="btn-primary md:col-span-2">
            Create booking
          </button>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-xl font-semibold">Fleet ({cars.length})</h2>
          <ul className="space-y-2 text-sm">
            {cars.map((car) => (
              <li
                key={car.id}
                className="rounded-md border border-slate-200 p-3"
              >
                <p className="font-medium">
                  {car.brand} {car.name}
                </p>
                <p className="text-slate-600">
                  ${Number(car.dailyRate).toFixed(2)}/day - {car.location}
                </p>
                <form action={deleteCar} className="mt-2">
                  <input type="hidden" name="carId" value={car.id} />
                  <button
                    type="submit"
                    className="btn-danger px-2.5 py-1.5 text-xs"
                  >
                    Remove car
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-xl font-semibold">Manage Bookings</h2>
          <ul className="space-y-2 text-sm">
            {bookings.map((booking) => (
              <li
                key={booking.id}
                className="rounded-md border border-slate-200 p-3"
              >
                <p className="font-medium">
                  {booking.car.brand} {booking.car.name}
                </p>
                {booking.customerName ? (
                  <p className="text-slate-600">
                    Customer: {booking.customerName}
                    {booking.customerPhone ? ` • ${booking.customerPhone}` : ""}
                  </p>
                ) : (
                  <p className="text-slate-600">Customer: (account booking)</p>
                )}
                <p className="text-slate-600">Current status: {booking.status}</p>
                <form action={updateBookingStatus} className="mt-2 flex gap-2">
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <select
                    name="status"
                    defaultValue={booking.status}
                    className="rounded-md border border-slate-300 px-2 py-1"
                  >
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  <button
                    type="submit"
                    className="btn-dark px-2.5 py-1.5 text-xs"
                  >
                    Update
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
