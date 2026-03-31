import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [carsCount, bookingsCount, customersCount, quotesCount, payments, dueServiceCount] =
    await Promise.all([
      prisma.car.count(),
      prisma.booking.count(),
      prisma.customer.count(),
      prisma.quote.count(),
      prisma.payment.findMany({ select: { amount: true }, take: 500 }),
      prisma.car.count({
        where: {
          serviceDueAt: {
            lte: (() => {
              const dueBy = new Date();
              dueBy.setDate(dueBy.getDate() + 14);
              return dueBy;
            })(),
          },
        },
      }),
    ]);

  const paymentsTotal = payments.reduce((sum, item) => sum + Number(item.amount), 0);

  const modules = [
    {
      title: "Fleet Management",
      description: "Manage cars, pricing, and availability.",
      href: "/dashboard",
      badge: `${carsCount} cars`,
    },
    {
      title: "Customers",
      description: "Save customer profiles and contact details.",
      href: "/dashboard/customers",
      badge: `${customersCount} customers`,
    },
    {
      title: "Quotations",
      description: "Create quotes and convert them into bookings.",
      href: "/dashboard/quotes",
      badge: `${quotesCount} quotes`,
    },
    {
      title: "Payments & Receipts",
      description: "Track payments and generate receipts.",
      href: "/dashboard/payments",
      badge: `$${paymentsTotal.toFixed(2)} paid`,
    },
    {
      title: "Financial Reports",
      description: "View revenue, balances, and performance.",
      href: "/dashboard/reports",
      badge: `${bookingsCount} bookings`,
    },
    {
      title: "Service & Maintenance",
      description: "Track service logs and due dates.",
      href: "/dashboard/service",
      badge: `${dueServiceCount} due soon`,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Management Dashboard</h1>
        <p className="mt-1 text-slate-600">
          All modules in one place for daily rental operations.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Cars</p>
          <p className="text-2xl font-bold">{carsCount}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Customers</p>
          <p className="text-2xl font-bold">{customersCount}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Bookings</p>
          <p className="text-2xl font-bold">{bookingsCount}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Payments</p>
          <p className="text-2xl font-bold">${paymentsTotal.toFixed(2)}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--brand-red)] hover:shadow-md"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">{module.title}</h2>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                {module.badge}
              </span>
            </div>
            <p className="text-sm text-slate-600">{module.description}</p>
            <p className="mt-4 text-sm font-medium text-[var(--brand-red)]">Open module</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
