import { createCustomer } from "@/app/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="mt-1 text-slate-600">
          Keep customer contacts and booking history in one place.
        </p>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Add customer</h2>
        <form action={createCustomer} className="grid gap-3 md:grid-cols-2">
          <input name="name" placeholder="Full name" required className="input" />
          <input name="phone" placeholder="Phone (optional)" className="input" />
          <input name="email" placeholder="Email (optional)" className="input md:col-span-2" />
          <input name="nationalId" placeholder="National ID (optional)" className="input" />
          <input name="licenseNumber" placeholder="Driver license number" className="input" />
          <input name="licenseExpiryAt" type="date" className="input" />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="licenseVerified" />
            License verified
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
            <input type="checkbox" name="blacklisted" />
            Blacklist / High risk customer
          </label>
          <textarea name="riskNotes" placeholder="Risk notes (optional)" className="input md:col-span-2" />
          <button type="submit" className="btn-primary md:col-span-2">
            Save customer
          </button>
        </form>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-xl font-semibold">Recent customers</h2>
        {customers.length === 0 ? (
          <p className="text-slate-600">No customers yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {customers.map((c) => (
              <li key={c.id} className="rounded-md border border-slate-200 p-3">
                <p className="font-medium">{c.name}</p>
                <p className="text-slate-600">
                  {c.phone ?? "—"} • {c.email ?? "—"}
                </p>
                <p className="text-slate-600">
                  ID: {c.nationalId ?? "—"} • License: {c.licenseNumber ?? "—"}
                </p>
                <p className="text-slate-600">
                  Verified: {c.licenseVerified ? "Yes" : "No"} • Risk: {c.blacklisted ? "High" : "Normal"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

