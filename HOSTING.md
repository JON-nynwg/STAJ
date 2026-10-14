# Host STAJ in your own Cloudflare account

This package adds a separate standalone configuration. The original Sites configuration and application pages are preserved. The new Worker uses STAJ's existing owner login and D1 database; it does not need ChatGPT authentication or connector preview services.

## 1. Open the project

Extract this ZIP into a new folder, then open STAJ in VS Code. Use Node.js 22.13 or newer and pnpm 11.25.0 (the version pinned in package.json).

```bash
pnpm install --frozen-lockfile
pnpm exec wrangler login
```

The login command opens your browser. Sign into the Cloudflare account you control.

## 2. Create the database

```bash
pnpm exec wrangler d1 create staj-db
```

Copy the database_id from the result, then replace YOUR_DATABASE_ID below:

```bash
pnpm cf:database YOUR_DATABASE_ID
pnpm db:remote
```

`db:remote` asks you to confirm applying the SQL migrations. This prepares your new remote database. The database UUID is a configuration identifier, not a password. Existing data on another hosted STAJ instance is not transferred by these steps.

## 3. Build and deploy

```bash
pnpm lint
pnpm deploy:cloudflare
```

This builds using vite.cloudflare.config.ts, then deploys the generated dist/server/wrangler.json with Wrangler. It refuses to deploy with the placeholder database ID. Wrangler prints your live workers.dev address. If the Worker name `staj` is already used in your account, change `name` in wrangler.cloudflare.json before deploying.

## 4. Check the live app

Create an owner account, create a business, add a service and opening hours, then open that business's booking link in another browser. Request an appointment, confirm it from the owner dashboard, and check its status using the customer's phone and booking reference. Check that an overlapping request cannot take the same appointment. Log out and back in to verify persistence.

The current version supports one appointment at a time per business. It does not collect payments or send SMS/email notifications, and has no self-service password reset. The contact address is in lib/site.ts; confirm it is yours before launch. Review the draft privacy and terms pages.

## 5. Connect your own domain

After the workers.dev version works, open Cloudflare's Workers & Pages dashboard, select your Worker and open Settings > Domains & Routes > Add > Custom Domain. Use a domain you own and follow Cloudflare's DNS instructions. Keep domain registration and hosting access under your own account.

## Local development

```bash
pnpm db:local
pnpm dev:cloudflare
```

Open http://localhost:5173. Local D1 data is separate from the remote database. Use the live HTTPS deployment for the final login and booking checks.

## Future updates

After changing source files, run `pnpm lint`, apply `pnpm db:remote` if you have added SQL migrations, then run `pnpm deploy:cloudflare` again. Do not edit generated files in dist.

You can store the source in a private GitHub repository. Keep node_modules, dist, .wrangler, .sites-runtime, .env files and .dev.vars files out of Git. The supplied .gitignore covers these directories and secrets. GitHub Pages cannot run this application's Workers backend or D1 database.

## Verification

See VALIDATION.md for the checks actually completed on this prepared package. A successful local build does not create your remote database or prove a live deployment; complete the steps above in your own account.

References:
- https://developers.cloudflare.com/workers/vite-plugin/
- https://developers.cloudflare.com/d1/reference/migrations/
- https://developers.cloudflare.com/workers/configuration/routing/custom-domains/

## Updated service pricing

This version includes the uploaded pricing changes: new and edited service prices must be KES 250 or more, in multiples of KES 250, up to KES 1,000,000. Both API validation and the dashboard price input enforce this rule. Existing saved prices are not automatically changed; update older services to a permitted price before editing or toggling them.
