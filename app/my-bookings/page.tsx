import { cancelBooking } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function MyBookingsPage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Please sign in.</div>;
  }

  const bookings = await prisma.booking.findMany({
    where: { clerkUserId: userId },
    include: { car: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <p className="mt-1 text-slate-600">View and manage your reservations.</p>
      </section>

      {bookings.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-slate-500 shadow-sm">
          You do not have any bookings yet.
        </div>
      ) : (
        <section className="grid gap-4">
          {bookings.map((booking) => (
            <article key={booking.id} className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">
                {booking.car.brand} {booking.car.name}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {format(booking.startDate, "dd MMM yyyy")} -{" "}
                {format(booking.endDate, "dd MMM yyyy")}
              </p>
              <p className="mt-1 text-sm">
                Total: ${Number(booking.totalPrice).toFixed(2)} | Status:{" "}
                <span className="font-semibold">{booking.status}</span>
              </p>
              {booking.status === "CONFIRMED" && (
                <form action={cancelBooking} className="mt-3">
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <button
                    type="submit"
                    className="rounded-md bg-red-600 px-3 py-2 text-sm text-white"
                  >
                    Cancel booking
                  </button>
                </form>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
