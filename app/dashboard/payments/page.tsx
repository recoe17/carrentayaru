import { recordPayment } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      car: true,
      payments: true,
      receipts: true,
    },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Payments & Receipts</h1>
        <p className="mt-1 text-slate-600">
          Record payments and automatically generate receipts.
        </p>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-xl font-semibold">Record payment</h2>
        <form action={recordPayment} className="grid gap-3 md:grid-cols-2">
          <select name="bookingId" required className="input" defaultValue="">
            <option value="" disabled>
              Select booking
            </option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.customerName ?? "Account booking"} • {b.car.brand} {b.car.name} • $
                {Number(b.totalPrice).toFixed(2)}
              </option>
            ))}
          </select>
          <select name="method" required className="input" defaultValue="CASH">
            <option value="CASH">Cash</option>
            <option value="EFT">EFT</option>
            <option value="CARD">Card</option>
            <option value="MOBILE">Mobile</option>
          </select>
          <input
            name="amount"
            type="number"
            step="0.01"
            min={0.01}
            required
            placeholder="Amount"
            className="input"
          />
          <input name="reference" placeholder="Reference (optional)" className="input" />
          <button type="submit" className="btn-primary md:col-span-2">
            Save payment + receipt
          </button>
        </form>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-xl font-semibold">Recent bookings (with balances)</h2>
        <ul className="space-y-2 text-sm">
          {bookings.map((b) => {
            const paid = b.payments.reduce((sum, p) => sum + Number(p.amount), 0);
            const balance = Number(b.totalPrice) - paid;
            return (
              <li key={b.id} className="rounded-md border border-slate-200 p-3">
                <p className="font-medium">
                  {b.customerName ?? "Account booking"} • {b.car.brand} {b.car.name}
                </p>
                <p className="text-slate-600">
                  Total ${Number(b.totalPrice).toFixed(2)} • Paid ${paid.toFixed(2)} • Balance $
                  {balance.toFixed(2)}
                </p>
                {b.receipts.length > 0 && (
                  <p className="text-slate-600">
                    Latest receipt:{" "}
                    {b.receipts[0]?.receiptNumber ?? "—"} ({format(b.receipts[0].issuedAt, "dd MMM yyyy")})
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

