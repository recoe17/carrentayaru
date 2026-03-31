import { assignUserRole } from "@/app/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AccessPage() {
  const [roles, logs] = await Promise.all([
    prisma.userRole.findMany({ orderBy: { updatedAt: "desc" }, take: 100 }),
    prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <h1 className="text-2xl font-bold">User & Access Control</h1>
        <p className="text-slate-600">Role assignment and activity tracking for accountability.</p>
      </section>

      <section className="surface-card p-6">
        <h2 className="mb-3 text-xl font-semibold">Assign role</h2>
        <form action={assignUserRole} className="grid gap-3 md:grid-cols-2">
          <input name="clerkUserId" placeholder="Clerk User ID" required className="input" />
          <select name="role" required className="input" defaultValue="CLERK">
            <option value="ADMIN">Admin</option>
            <option value="ACCOUNTANT">Accountant</option>
            <option value="CLERK">Clerk</option>
          </select>
          <button type="submit" className="btn-primary md:col-span-2">Save role</button>
        </form>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-6">
          <h2 className="mb-3 text-xl font-semibold">Assigned roles</h2>
          <ul className="space-y-2 text-sm">
            {roles.map((r) => (
              <li key={r.id} className="rounded-md border border-slate-200 p-3">
                <p className="font-medium">{r.clerkUserId}</p>
                <p className="text-slate-600">Role: {r.role}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="surface-card p-6">
          <h2 className="mb-3 text-xl font-semibold">Activity log</h2>
          <ul className="space-y-2 text-sm">
            {logs.map((l) => (
              <li key={l.id} className="rounded-md border border-slate-200 p-3">
                <p className="font-medium">{l.action}</p>
                <p className="text-slate-600">{l.entityType} • {l.entityId ?? "—"}</p>
                <p className="text-slate-500">{new Date(l.createdAt).toISOString().replace("T", " ").slice(0, 16)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

