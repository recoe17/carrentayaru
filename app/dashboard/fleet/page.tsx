import {
  createBookingForCustomer,
  createCar,
  deleteCar,
  updateBookingStatus,
  updateRentalOperations,
} from "@/app/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FleetPage() {
  const [cars, bookings] = await Promise.all([
    prisma.car.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      include: { car: true },
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <h1 className="text-2xl font-bold">Fleet Management</h1>
        <p className="text-slate-600">Vehicle registry, bookings, and rental operations.</p>
      </section>

      <section className="surface-card p-6">
        <h2 className="mb-4 text-xl font-semibold">Register vehicle</h2>
        <form action={createCar} className="grid gap-3 md:grid-cols-2">
          <input name="brand" placeholder="Brand" required className="input" />
          <input name="name" placeholder="Model" required className="input" />
          <input name="dailyRate" type="number" step="0.01" min={1} placeholder="Daily rate" required className="input" />
          <select name="status" className="input" defaultValue="AVAILABLE">
            <option value="AVAILABLE">Available</option>
            <option value="RENTED">Rented</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
          <input name="mileageKm" type="number" min={0} placeholder="Mileage KM" className="input" />
          <input name="seats" type="number" min={2} placeholder="Seats" required className="input" />
          <input name="transmission" placeholder="Transmission" required className="input" />
          <input name="fuelType" placeholder="Fuel type" required className="input" />
          <input name="location" placeholder="Location" required className="input" />
          <input name="imageUrl" placeholder="Image URL (optional)" className="input" />
          <input name="insuranceExpiryAt" type="date" className="input" />
          <input name="licenseExpiryAt" type="date" className="input" />
          <textarea name="inspectionNotes" placeholder="Inspection notes" className="input md:col-span-2" />
          <textarea name="conditionReport" placeholder="Condition report" className="input md:col-span-2" />
          <input name="serviceDueAt" type="date" className="input" />
          <input name="serviceNotes" placeholder="Service notes" className="input" />
          <button type="submit" className="btn-primary md:col-span-2">Save vehicle</button>
        </form>
      </section>

      <section className="surface-card p-6">
        <h2 className="mb-4 text-xl font-semibold">Create booking</h2>
        <form action={createBookingForCustomer} className="grid gap-3 md:grid-cols-2">
          <select name="carId" required className="input" defaultValue="">
            <option value="" disabled>Select car</option>
            {cars.map((car) => (
              <option key={car.id} value={car.id}>
                {car.brand} {car.name} • {car.status}
              </option>
            ))}
          </select>
          <input name="customerName" placeholder="Customer name" required className="input" />
          <input name="customerPhone" placeholder="Phone" className="input" />
          <input name="customerEmail" placeholder="Email" className="input" />
          <input name="startDate" type="date" required className="input" />
          <input name="endDate" type="date" required className="input" />
          <button type="submit" className="btn-primary md:col-span-2">Create booking</button>
        </form>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-6">
          <h2 className="mb-3 text-xl font-semibold">Vehicle list</h2>
          <ul className="space-y-2 text-sm">
            {cars.map((car) => (
              <li key={car.id} className="rounded-md border border-slate-200 p-3">
                <p className="font-medium">{car.brand} {car.name} • {car.status}</p>
                <p className="text-slate-600">
                  ${Number(car.dailyRate).toFixed(2)} • {car.mileageKm} KM • Service due: {car.serviceDueAt ? car.serviceDueAt.toISOString().slice(0, 10) : "—"}
                </p>
                <form action={deleteCar} className="mt-2">
                  <input type="hidden" name="carId" value={car.id} />
                  <button type="submit" className="btn-danger text-xs px-2 py-1">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-card p-6">
          <h2 className="mb-3 text-xl font-semibold">Rental Operations</h2>
          <ul className="space-y-3 text-sm">
            {bookings.map((booking) => (
              <li key={booking.id} className="rounded-md border border-slate-200 p-3">
                <p className="font-medium">{booking.car.brand} {booking.car.name} • {booking.customerName ?? "Account booking"}</p>
                <form action={updateBookingStatus} className="mt-2 flex gap-2">
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <select name="status" defaultValue={booking.status} className="input">
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  <button type="submit" className="btn-dark">Update status</button>
                </form>
                <form action={updateRentalOperations} className="mt-2 grid gap-2 md:grid-cols-2">
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <input name="handoverFuelLevel" placeholder="Handover fuel level" className="input" />
                  <input name="returnFuelLevel" placeholder="Return fuel level" className="input" />
                  <input name="latePenalty" type="number" step="0.01" min={0} placeholder="Late penalty" className="input" />
                  <input name="damagePenalty" type="number" step="0.01" min={0} placeholder="Damage penalty" className="input" />
                  <input name="fuelPenalty" type="number" step="0.01" min={0} placeholder="Fuel penalty" className="input" />
                  <input name="returnDate" type="date" className="input" />
                  <textarea name="damageNotes" placeholder="Damage notes" className="input md:col-span-2" />
                  <button type="submit" className="btn-primary md:col-span-2">Save rental ops</button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

