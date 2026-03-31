import { prisma } from "@/lib/prisma";
import { createExpense } from "@/app/actions";

export const dynamic = "force-dynamic";

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0);
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const from = sp.from ? new Date(sp.from) : undefined;
  const to = sp.to ? new Date(sp.to) : undefined;

  const whereDates =
    from && to
      ? { createdAt: { gte: from, lte: to } }
      : from
        ? { createdAt: { gte: from } }
        : to
          ? { createdAt: { lte: to } }
          : {};

  const [bookings, payments, expenses] = await Promise.all([
    prisma.booking.findMany({
      where: whereDates,
      include: { car: true, payments: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.payment.findMany({
      where: whereDates,
      orderBy: { paidAt: "desc" },
      take: 500,
    }),
    prisma.expense.findMany({
      where: from && to ? { expenseDate: { gte: from, lte: to } } : from ? { expenseDate: { gte: from } } : to ? { expenseDate: { lte: to } } : {},
      orderBy: { expenseDate: "desc" },
      take: 500,
      include: { car: true },
    }),
  ]);

  const bookingTotals = bookings
    .filter((b) => b.status !== "CANCELLED")
    .map((b) => Number(b.totalPrice));
  const paymentTotals = payments.map((p) => Number(p.amount));
  const expenseTotals = expenses.map((e) => Number(e.amount));

  const paidByBooking = new Map<string, number>();
  for (const b of bookings) {
    const paid = b.payments.reduce((s, p) => s + Number(p.amount), 0);
    paidByBooking.set(b.id, paid);
  }
  const outstanding = bookings
    .filter((b) => b.status !== "CANCELLED")
    .map((b) => Math.max(0, Number(b.totalPrice) - (paidByBooking.get(b.id) ?? 0)));

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Financial Reports</h1>
        <p className="mt-1 text-slate-600">
          Revenue, payments, and outstanding balances in one place.
        </p>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-xl font-semibold">Filter by date</h2>
        <form className="grid gap-3 md:grid-cols-3">
          <input name="from" type="date" className="input" defaultValue={sp.from ?? ""} />
          <input name="to" type="date" className="input" defaultValue={sp.to ?? ""} />
          <button type="submit" className="btn-dark">
            Apply
          </button>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Bookings total (non-cancelled)</p>
          <p className="text-2xl font-bold">${sum(bookingTotals).toFixed(2)}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Payments recorded</p>
          <p className="text-2xl font-bold">${sum(paymentTotals).toFixed(2)}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Outstanding balance</p>
          <p className="text-2xl font-bold">${sum(outstanding).toFixed(2)}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Expenses</p>
          <p className="text-2xl font-bold">${sum(expenseTotals).toFixed(2)}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Profit/Loss</p>
          <p className="text-2xl font-bold">${(sum(paymentTotals) - sum(expenseTotals)).toFixed(2)}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Cash flow (inflow - outflow)</p>
          <p className="text-2xl font-bold">${(sum(paymentTotals) - sum(expenseTotals)).toFixed(2)}</p>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-xl font-semibold">Record expense</h2>
        <form action={createExpense} className="grid gap-3 md:grid-cols-2">
          <select name="category" className="input" defaultValue="OTHER">
            <option value="FUEL">Fuel</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="INSURANCE">Insurance</option>
            <option value="OTHER">Other</option>
          </select>
          <input name="amount" type="number" step="0.01" min={0.01} placeholder="Amount" required className="input" />
          <select name="carId" className="input">
            <option value="">No specific car</option>
            {bookings.map((b) => (
              <option key={b.car.id} value={b.car.id}>
                {b.car.brand} {b.car.name}
              </option>
            ))}
          </select>
          <input name="expenseDate" type="date" className="input" />
          <textarea name="notes" placeholder="Notes" className="input md:col-span-2" />
          <button type="submit" className="btn-primary md:col-span-2">Save expense</button>
        </form>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-xl font-semibold">Recent expenses</h2>
        <ul className="space-y-2 text-sm">
          {expenses.map((e) => (
            <li key={e.id} className="rounded-md border border-slate-200 p-3">
              <p className="font-medium">{e.category} • ${Number(e.amount).toFixed(2)}</p>
              <p className="text-slate-600">{e.car ? `${e.car.brand} ${e.car.name}` : "General"} • {new Date(e.expenseDate).toISOString().slice(0, 10)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-xl font-semibold">Top cars by revenue</h2>
        <ul className="space-y-2 text-sm">
          {Object.entries(
            bookings
              .filter((b) => b.status !== "CANCELLED")
              .reduce<Record<string, { name: string; total: number }>>((acc, b) => {
                const key = b.carId;
                const name = `${b.car.brand} ${b.car.name}`;
                acc[key] = acc[key] ?? { name, total: 0 };
                acc[key].total += Number(b.totalPrice);
                return acc;
              }, {}),
          )
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 10)
            .map(([carId, row]) => (
              <li key={carId} className="rounded-md border border-slate-200 p-3">
                <p className="font-medium">{row.name}</p>
                <p className="text-slate-600">${row.total.toFixed(2)}</p>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}

