# SwiftRide Rentals (Demo Ready)

Full-stack car rental system using:

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Clerk authentication
- Neon PostgreSQL via Prisma ORM
- Vercel hosting

## Features

- Public car listing page
- Clerk sign-in and protected dashboard routes
- Fleet management (add cars)
- Bookings with overlap checks to prevent double-booking
- My Bookings page with cancellation

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill values:

```bash
cp .env.example .env
```

3. Push Prisma schema to Neon:

```bash
npx prisma db push
```

4. Run the app:

```bash
npm run dev
```

## Clerk setup

1. Create an app in Clerk.
2. Add keys to `.env`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
3. In Clerk dashboard, add your local URL (`http://localhost:3000`) and deployed Vercel URL to allowed origins.

## Neon setup

1. Create a Neon project and database.
2. Copy the connection string into `DATABASE_URL`.
3. Use SSL mode in the connection string (`sslmode=require`).

## Deploy to Vercel

1. Push this project to GitHub.
2. Import the repo in Vercel.
3. Add environment variables in Vercel:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. Deploy.

After deploy, run this once against production database:

```bash
npx prisma db push
```
