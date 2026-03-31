import { createQuote } from "@/app/actions";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const [customers, cars, quotes] = await Promise.all([
    prisma.customer.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.car.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.quote.findMany({
      orderBy: { createdAt: "desc" },
      include: { car: true },
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Quotations</h1>
        <p className="mt-1 text-slate-600">
          Create, preview, and track quote status before payment.
        </p>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Create quotation</h2>
        <form action={createQuote} className="grid gap-3 md:grid-cols-2">
          <select name="customerId" className="input" defaultValue="">
            <option value="">Select existing customer (optional)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ""}
              </option>
            ))}
          </select>
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
          <input name="customerEmail" placeholder="Email (optional)" className="input md:col-span-2" />
          <input name="startDate" type="date" required className="input" />
          <input name="endDate" type="date" required className="input" />
          <textarea
            name="notes"
            placeholder="Notes (optional)"
            className="input md:col-span-2"
          />
          <button type="submit" className="btn-primary md:col-span-2">
            Create quote
          </button>
        </form>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-xl font-semibold">Recent quotes</h2>
        {quotes.length === 0 ? (
          <p className="text-slate-600">No quotes yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {quotes.map((q) => (
              <li key={q.id} className="rounded-md border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {q.quoteNumber} • {q.customerName} • {q.car.brand} {q.car.name}
                  </p>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                    {q.status}
                  </span>
                </div>
                <p className="text-slate-600">
                  {format(q.startDate, "dd MMM yyyy")} - {format(q.endDate, "dd MMM yyyy")} • Total $
                  {Number(q.totalPrice).toFixed(2)}
                </p>
                <div className="mt-2 flex gap-2">
                  <Link href={`/dashboard/quotes/${q.id}`} className="btn-dark text-xs px-2.5 py-1.5">
                    Preview
                  </Link>
                  <Link href="/dashboard/payments" className="btn-primary text-xs px-2.5 py-1.5">
                    Receive payment
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

