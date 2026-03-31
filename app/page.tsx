import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-10">
      <section className="rounded-xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold">Welcome to Yarutso Car Rental</h1>
        <p className="mt-2 text-slate-600">
          Sign in for full account features, or continue as guest to book your car.
        </p>
      </section>

      <section className="rounded-xl bg-white p-8 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <SignInButton mode="modal">
            <button className="btn-dark">Sign in</button>
          </SignInButton>
          <Link href="/cars" className="rounded-md border border-slate-300 px-3 py-2 text-center">
            Continue as guest
          </Link>
        </div>
      </section>
    </div>
  );
}
