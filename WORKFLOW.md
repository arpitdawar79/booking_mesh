# Workflow — booking_mesh

How code goes from your laptop to production, and how the database stays in
sync at every stage. Read once, follow always.

---

## Environments

| Env | Machine | Branch | DB | Port | Command |
|---|---|---|---|---|---|
| Dev | your Mac | `main` (or feature branch) | local Postgres `localhost:5432` | 4001 | `npm run dev` |
| Staging | EC2 (same box as prod) | `staging` | `booking_mesh_staging` | 5051 | PM2 `*-staging` apps |
| Prod | EC2 | `main` | prod Postgres | 5050 | PM2 `env_production` apps |

Golden rule for the DB:

> **`migrate dev` on your laptop. `migrate deploy` on staging/prod.
> `db push` and `migrate reset` never touch staging/prod.**

---

## 1. First-time local setup

```bash
git clone git@github.com:arpitdawar79/booking_mesh.git
cd booking_mesh
cp .env.example .env          # fill in DATABASE_URL + secrets
npm install                   # postinstall runs `prisma generate`
npx prisma migrate dev        # apply all migrations to local DB
npm run dev                   # http://localhost:4001
```

Note: package.json scripts use `dotenv -e .env.local` but this repo uses
`.env`. Prisma auto-loads `.env`, so plain `npx prisma ...` works — prefer it.

## 2. Day-to-day development

```bash
git checkout -b feature/my-thing     # or work directly on main for solo dev
npm run dev                          # local dev server
```

### Code checks before pushing

```bash
npm run typecheck     # tsc --noEmit — must pass (except known @hapi/boom error)
npm run lint:semgrep  # semgrep rules in .semgrep.yml
npm run search:ast    # ast-grep scan
```

Known issues to ignore for now:
- `lib/whatsapp.ts` fails typecheck: missing `@hapi/boom` types (pre-existing).
- `npm run lint` (`next lint`) is dead — `next lint` was removed in Next 16.

### Schema changes — ALWAYS like this

```bash
# 1. Edit prisma/schema.prisma
# 2. Create + apply migration, regenerate client
npx prisma migrate dev --name describe_the_change
# 3. Commit BOTH the schema and the generated migration folder
git add prisma/schema.prisma prisma/migrations/
git commit -m "add foo to bookings"
```

The migration folder IS how the change reaches prod. Never commit
`schema.prisma` without its migration.

Never do on shared/prod DBs:
- `npx prisma db push` — bypasses migration history
- `npx prisma migrate reset` — wipes the DB
- editing an already-pushed `migration.sql` — checksum mismatch on deploy

## 3. Database quick reference

| Task | Command |
|---|---|
| New migration (dev only) | `npx prisma migrate dev --name xxx` |
| Apply pending migrations (staging/prod) | `npx prisma migrate deploy` |
| Regenerate client (no DB touch) | `npx prisma generate` |
| See applied vs pending | `npx prisma migrate status` |
| Preview SQL a change would make | `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma` (see docs) |
| Browse data locally | `npm run db:studio` |
| Reseed local DB | `npm run db:seed` |
| Wipe + rebuild LOCAL db | `npx prisma migrate reset` |

## 4. Deploy to production (EC2)

Two PM2 apps run on prod (see `ecosystem.config.js`):
`ekantah-email-templates` (Next.js, port 5050) and `ekantah-cron-runner`
(`tsx jobs/cron-runner.ts`). PM2 Deploy manages the checkout under
`/home/ubuntu/apps/booking_mesh`; persistent environment, logs, and WhatsApp
credentials live under its `shared` directory.

Provision the PM2 checkout once:

```bash
pnpm deploy:pm2:setup
```

For each production release:

```bash
git checkout main
git pull --ff-only
pnpm typecheck
pnpm build
git push origin main
pnpm deploy:prod
```

The deployment wrapper refuses to deploy a dirty working tree or a commit that
does not match `origin/main`. The remote hook installs the exact pnpm lockfile,
generates Prisma Client, applies migrations, builds Next.js, reloads both PM2
processes, checks `/api/health`, and saves the healthy PM2 process list for
reboot recovery.

Useful commands:

```bash
pnpm deploy:pm2:status
./scripts/pm2_deploy.sh curr
./scripts/pm2_deploy.sh prev
./scripts/pm2_deploy.sh list
./scripts/pm2_deploy.sh exec "pm2 logs --lines 50 --nostream"
./scripts/pm2_deploy.sh revert 1
```

Order matters: **install → migrate deploy → build → reload → health check**.
New code must never run against a schema it doesn't have.

### If deploy goes wrong

- **Bad code:** `./scripts/pm2_deploy.sh revert 1`. A PM2 code rollback does
  not reverse database migrations, so migrations must remain backward
  compatible with the prior release.
- **Bad migration:** `migrate deploy` stops at the failure. Check `pm2 logs`,
  fix the migration SQL locally (only safe if it never applied anywhere), or
  `prisma migrate resolve --rolled-back <name>` after manually undoing it in
  the DB.
- **Last resort:** restore DB from `pg_dump` backup.

## 5. Staging

Staging isn't set up yet — when you want it, cheapest version is on the same
EC2 box:

```bash
# one-time on EC2
createdb booking_mesh_staging
cp .env .env.staging                 # edit: DATABASE_URL → staging DB, PORT=5051

# add to ecosystem.config.js as separate apps, e.g.
#   name: "ekantah-email-templates-staging", env: { NODE_ENV:"production", PORT:5051 }
#   name: "ekantah-cron-runner-staging"
```

Then the flow is:

```bash
# laptop
git checkout -b staging && git merge main && git push origin staging

# EC2
git checkout staging && git pull
DATABASE_URL="<staging-db-url>" npx prisma migrate deploy
npm install && npm run build
pm2 startOrReload ecosystem.config.js --env staging   # or only staging apps
```

Use staging to test risky migrations and big UI changes before prod. If it's
more ceremony than you need right now, skip it — just never experiment
against the prod DB directly.

## 6. One-time fix: prod migration history

Prod was managed with `db push` + partial migrations; its `_prisma_migrations`
table has a failed `20260608132211_rename_to_additional_sales` row that blocks
`migrate deploy`. Fix once, then never again:

```bash
# backup first
pg_dump "$PROD_URL" > prod-backup.sql

# confirm prod schema already matches schema.prisma
DATABASE_URL="$PROD_URL" npx prisma migrate diff \
  --from-url "$PROD_URL" --to-schema-datamodel prisma/schema.prisma
# (if it prints SQL, apply it manually first)

# unstick the failed migration
DATABASE_URL="$PROD_URL" npx prisma migrate resolve \
  --rolled-back "20260608132211_rename_to_additional_sales"
DATABASE_URL="$PROD_URL" npx prisma migrate resolve \
  --applied "20260608132211_rename_to_additional_sales"

# mark every repo migration as already applied (schema came from db push)
for m in \
  20260608144650_add_extra_mattress_count_to_bookings \
  20260608200118_cron_jobs \
  20260611142955_passkeys \
  20260930074959_add_extraction_jobs \
  20260930125510_add_is_backdated_to_bookings \
  20260930182549_sheet_referee \
  20260930183153_sheet_row_escalated \
  20261001052000_harden_sheet_referee_imports; do
  DATABASE_URL="$PROD_URL" npx prisma migrate resolve --applied "$m"
done

# if deploy complains about ghost migration 20260608110752_initial:
mkdir -p prisma/migrations/20260608110752_initial
echo "-- baselined" > prisma/migrations/20260608110752_initial/migration.sql

DATABASE_URL="$PROD_URL" npx prisma migrate deploy   # "already up to date"
```

## 7. Environment variables

- `.env` is gitignored — never commit secrets. `.env.example` documents what
  exists; **update it whenever you add a var**.
- Prod `.env` lives only on the EC2 box. New env var → add it to prod `.env`
  manually during deploy, before restarting PM2.
- Vars that matter in prod: `DATABASE_URL`, `AUTH_SECRET`,
  `AUTH_REFRESH_SECRET`, `SMTP_*`, `ADMIN_EMAIL`, `ADMIN_WHATSAPP_GROUP_ID`,
  `GOOGLE_REVIEW_URL`, `INSTAGRAM_URL`.

## 8. Useful commands

```bash
pm2 status                          # app health
pm2 logs <name> --lines 100         # tail logs
pm2 monit                           # live CPU/mem
node check-db.mjs                   # quick DB connectivity check
npm run test:emails                 # render/send test emails
npm run test:whatsapp               # whatsapp connectivity
npm run graph:update                # regenerate code graph (graphify-out/)
```

## TL;DR

```bash
# dev
edit schema.prisma → npx prisma migrate dev --name x → commit schema+migrations → push

# prod
pull → npm install → npx prisma migrate deploy → npm run build → pm2 startOrReload --env production
```
