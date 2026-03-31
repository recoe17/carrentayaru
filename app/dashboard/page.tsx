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
      title: "Cars",
      description: "Browse available cars as guests or signed-in users.",
      href: "/cars",
      badge: `${carsCount} listed`,
    },
    {
      title: "Fleet Management",
      description: "Manage cars, pricing, status, and availability.",
      href: "/dashboard/fleet",
      badge: `${carsCount} fleet`,
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
    {
      title: "My Bookings",
      description: "View and manage user account bookings.",
      href: "/my-bookings",
      badge: "client portal",
    },
    {
      title: "User & Access",
      description: "Assign Admin/Accountant/Clerk roles and monitor activity.",
      href: "/dashboard/access",
      badge: "security",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <h1 className="bg-gradient-to-r from-[var(--brand-indigo)] via-[var(--brand-red)] to-[var(--brand-cyan)] bg-clip-text text-3xl font-bold text-transparent">
          Management Dashboard
        </h1>
        <p className="mt-1 text-slate-600">
          All modules in one place for daily rental operations.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="kpi-card">
          <p className="text-sm text-slate-500">Cars</p>
          <p className="text-3xl font-black text-[var(--brand-indigo)]">{carsCount}</p>
        </div>
        <div className="kpi-card">
          <p className="text-sm text-slate-500">Customers</p>
          <p className="text-3xl font-black text-[var(--brand-green)]">{customersCount}</p>
        </div>
        <div className="kpi-card">
          <p className="text-sm text-slate-500">Bookings</p>
          <p className="text-3xl font-black text-[var(--brand-red)]">{bookingsCount}</p>
        </div>
        <div className="kpi-card">
          <p className="text-sm text-slate-500">Payments</p>
          <p className="text-3xl font-black text-[var(--brand-indigo)]">${paymentsTotal.toFixed(2)}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="module-card group hover:border-[var(--brand-red)]"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">{module.title}</h2>
              <span className="module-badge">{module.badge}</span>
            </div>
            <p className="text-sm text-slate-600">{module.description}</p>
            <p className="mt-4 text-sm font-semibold text-[var(--brand-red)]">Open module</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
