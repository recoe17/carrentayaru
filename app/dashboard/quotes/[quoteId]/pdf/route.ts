import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildQuotePdf } from "@/lib/quote-pdf";
import { format } from "date-fns";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ quoteId: string }> },
) {
  const { quoteId } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { car: true },
  });

  if (!quote) {
    return new NextResponse("Quote not found", { status: 404 });
  }

  const pdf = await buildQuotePdf({
    quoteNumber: quote.quoteNumber,
    status: quote.status,
    customerName: quote.customerName,
    customerPhone: quote.customerPhone,
    customerEmail: quote.customerEmail,
    carLabel: `${quote.car.brand} ${quote.car.name}`,
    startDate: format(quote.startDate, "dd MMM yyyy"),
    endDate: format(quote.endDate, "dd MMM yyyy"),
    dailyRate: Number(quote.dailyRate),
    totalPrice: Number(quote.totalPrice),
    notes: quote.notes,
  });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${quote.quoteNumber}.pdf"`,
    },
  });
}

