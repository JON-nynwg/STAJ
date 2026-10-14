# STAJ

A multi-business beauty and wellness booking app for Nairobi. Business owners have separate accounts and dashboards; customers can select a service, request an available slot, and check the booking status with their reference and phone number.

## Open in VS Code

1. Extract the ZIP and open the `staj` folder in VS Code.
2. Install Node.js 22.13 or newer and pnpm (`corepack enable`).
3. Run `pnpm install`.
4. Run `pnpm dev` for the site UI. The backend uses Cloudflare D1; configure a local D1 binding or deploy to a Cloudflare Workers compatible environment to use accounts and bookings.

The site was built with Next.js/Vinext, React, TypeScript, Tailwind CSS, Drizzle migrations, and Cloudflare D1. No credentials are included.

## Main code

- `app/page.tsx`: homepage and example Westlands service prices.
- `app/b/[slug]/page.tsx`: each business's booking page.
- `app/dashboard/page.tsx` and `components/Dashboard.tsx`: owner workspace.
- `app/api/`: signup, login, business settings, services, availability, bookings and status lookup.
- `db/schema.ts` and `drizzle/`: persistent database tables and migrations.
- `app/globals.css`: STAJ colours and responsive styling (fonts are self-hosted in `public/fonts`).
- `app/privacy` and `app/terms`: draft privacy notice and terms. The contact address is `CONTACT_EMAIL` in `lib/site.ts`. Have both pages reviewed before launch.

## Booking rules

Business owners choose opening hours and days, add services with prices and durations, and can hide or edit services. Clients see half-hour appointment starts that fit a service within those hours. Pending and confirmed bookings reserve time. A request stays pending until the owner confirms it. STAJ does not take payments or send SMS/email alerts in this version. Overlap is checked per business, so a business holds one appointment at a time.

Phone numbers are stored in `+254…` form, so customers can track a booking however they type their number. A phone number can have at most three pending requests per business.

## Security notes

- Passwords use PBKDF2-SHA256 at 100,000 iterations, the Cloudflare Workers maximum. Each owner's iteration count is stored, and older hashes are upgraded on login.
- Signup, login, booking, tracking and password changes are rate-limited per IP address (and per email for login) using the `rate_limits` table.
- Owners can change their password from the dashboard, which signs out other devices. There is no self-service "forgot password" yet, because it needs an email provider.

## Deployment

The `.openai/hosting.json` file associates this source with the existing STAJ Site. Keep it when editing that Site. The hosted environment applies the Drizzle SQL migrations and provides the `DB` binding. Do not put passwords, API keys or tokens in source files.
