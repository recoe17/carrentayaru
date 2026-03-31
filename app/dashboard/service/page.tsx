import { createServiceRecord } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function ServicePage() {
  const dueBy = new Date();
  dueBy.setDate(dueBy.getDate() + 14);

  const [cars, dueSoon] = await Promise.all([
    prisma.car.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.car.findMany({
      where: {
        serviceDueAt: {
          lte: dueBy,
        },
      },
      orderBy: { serviceDueAt: "asc" },
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Service & Maintenance</h1>
        <p className="mt-1 text-slate-600">
          Track servicing and see what’s due soon.
        </p>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-xl font-semibold">Cars due for service (next 14 days)</h2>
        {dueSoon.length === 0 ? (
          <p className="text-slate-600">No cars due soon.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {dueSoon.map((car) => (
              <li key={car.id} className="rounded-md border border-slate-200 p-3">
                <p className="font-medium">
                  {car.brand} {car.name}
                </p>
                <p className="text-slate-600">
                  Due: {car.serviceDueAt ? format(car.serviceDueAt, "dd MMM yyyy") : "—"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Log service</h2>
        <form action={createServiceRecord} className="grid gap-3 md:grid-cols-2">
          <select name="carId" required className="input" defaultValue="">
            <option value="" disabled>
              Select car
            </option>
            {cars.map((car) => (
              <option key={car.id} value={car.id}>
                {car.brand} {car.name}
              </option>
            ))}
          </select>
          <input name="serviceDate" type="date" className="input" />
          <input name="description" placeholder="Service description" required className="input md:col-span-2" />
          <input name="cost" type="number" step="0.01" min={0} placeholder="Cost (optional)" className="input" />
          <input name="nextDueAt" type="date" className="input" />
          <button type="submit" className="btn-primary md:col-span-2">
            Save service record
          </button>
        </form>
      </section>
    </div>
  );
}

