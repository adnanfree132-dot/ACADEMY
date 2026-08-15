# DEPLOYMENT — LOCAL FIRST → SUPABASE LATER

## Phase 1: Local
1. `docker run -d --name academy-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16`
2. `npx prisma migrate dev` · `npx prisma db seed`
3. Run server + client locally. Backup: `pg_dump > backup_$(date +%F).sql` (daily cron).

## Phase 2: Supabase Cutover (zero schema rewrite)
1. Create Supabase project (region near users, Postgres 16).
2. Settings → Database → connection string (session pooler) → set as DATABASE_URL on API host.
3. Run `npx prisma migrate deploy` (applies same migration history).
4. Storage: create bucket `academy-files` (private); implement `FileStore` Supabase adapter;
   migrate old /uploads via one-off script that uploads + rewrites file_url.
5. Deploy API to Render/Railway (small instance fine); client to Vercel/Netlify.
6. Secrets in host env: DATABASE_URL, JWT secrets, SUPABASE keys. CORS = client domain only.
7. Backups: Supabase automated backups ON + weekly `pg_dump` to your storage.
8. Cutover checklist: smoke login (all 4 roles) · mark attendance · record payment ·
   upload material · verify notifications · verify audit logs · verify receipt no sequence.
9. Rollback: keep local DB + backups until 7 days clean run; point DATABASE_URL back if needed.

## Optional later (NOT Phase 2): Supabase Auth/RLS only if you drop the Express layer —
decide separately; current plan keeps Express for mobile-API stability.