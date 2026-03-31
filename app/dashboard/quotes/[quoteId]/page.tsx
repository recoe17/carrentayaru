import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { sendQuoteByEmail } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function QuotePreviewPage({
  params,
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const { quoteId } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { car: true },
  });

  if (!quote) notFound();

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <h1 className="text-2xl font-bold">Quote Preview</h1>
        <p className="mt-1 text-slate-600">
          {quote.quoteNumber} • Status: {quote.status}
        </p>
      </section>

      <section className="surface-card p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h2 className="font-semibold">Customer</h2>
            <p className="text-slate-700">{quote.customerName}</p>
            <p className="text-slate-600">{quote.customerPhone ?? "—"}</p>
            <p className="text-slate-600">{quote.customerEmail ?? "—"}</p>
          </div>
          <div>
            <h2 className="font-semibold">Vehicle</h2>
            <p className="text-slate-700">
              {quote.car.brand} {quote.car.name}
            </p>
            <p className="text-slate-600">
              {format(quote.startDate, "dd MMM yyyy")} - {format(quote.endDate, "dd MMM yyyy")}
            </p>
            <p className="text-slate-600">${Number(quote.dailyRate).toFixed(2)} per day</p>
          </div>
        </div>
        <div className="mt-5 rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Total quote amount</p>
          <p className="text-3xl font-black text-[var(--brand-indigo)]">
            ${Number(quote.totalPrice).toFixed(2)}
          </p>
          {quote.notes && <p className="mt-2 text-slate-600">Notes: {quote.notes}</p>}
        </div>
      </section>

      <section className="flex gap-3">
        <Link href="/dashboard/quotes" className="btn-dark">
          Back to quotes
        </Link>
        <Link href={`/dashboard/quotes/${quote.id}/pdf`} className="btn-dark">
          Download PDF
        </Link>
        <Link href="/dashboard/payments" className="btn-primary">
          Receive payment and issue receipt
        </Link>
      </section>

      <section className="surface-card p-6">
        <h2 className="text-xl font-semibold">Send quote by email</h2>
        <form action={sendQuoteByEmail} className="mt-4 grid gap-3 md:grid-cols-2">
          <input type="hidden" name="quoteId" value={quote.id} />
          <input
            type="email"
            name="toEmail"
            required
            defaultValue={quote.customerEmail ?? ""}
            placeholder="customer@email.com"
            className="input"
          />
          <button type="submit" className="btn-primary">
            Send quote email
          </button>
        </form>
        <p className="mt-2 text-sm text-slate-600">
          Requires `RESEND_API_KEY` and `QUOTE_FROM_EMAIL` environment variables.
        </p>
      </section>
    </div>
  );
}
