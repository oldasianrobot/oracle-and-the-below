# Oracle hosting

The game has its own Vercel project, `oracle-and-the-below`, connected to this repository’s `main` branch. Vercel builds with `npm run build` and publishes only `dist/`.

- Student address: https://oracle.mleungphd.org/
- Vercel project: https://vercel.com/maxwell-leungs-projects/oracle-and-the-below
- Deployment origin: https://oracle-and-the-below.vercel.app/

Cloudflare's DNS-only CNAME `oracle` points to `f906e2376666d74e.vercel-dns-017.com`. Vercel connects this domain directly to the Oracle production deployment. Push game updates to this repository; no main website deployment is required.

Max’s Lab links directly to the subdomain. The former `/edutech/`, `/edutech/oracle/`, and `/oracle/` paths have been removed without forwarding.

Supabase's Site URL is `https://oracle.mleungphd.org/`. The same URL is allowed for instructor redirects; local review remains allowed. The Edge Function ALLOWED_ORIGINS includes `https://oracle.mleungphd.org`, `https://mleungphd.org`, and `http://127.0.0.1:5188`.

Private access codes and Supabase records remain separate from hosting. Do not add secret keys to Vercel or public files; the existing Supabase functions hold the OpenRouter key. Instructor email redirects should allow https://oracle.mleungphd.org/ in Supabase Authentication URL Configuration.
