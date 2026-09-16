# Oracle hosting

The game has its own Vercel project, `oracle-and-the-below`, connected to this repository’s `main` branch. Vercel builds with `npm run build` and publishes only `dist/`.

- Student address: https://mleungphd.org/oracle/
- Vercel project: https://vercel.com/maxwell-leungs-projects/oracle-and-the-below
- Deployment origin: https://oracle-and-the-below.vercel.app/

The main website (`max-lab-home`) forwards `/oracle/` and its assets to the Oracle deployment using an external rewrite. The address stays on mleungphd.org. Future game updates are pushed to this repository; copying builds into the main website is no longer needed.

The former `/edutech/` landing page and `/edutech/oracle/` route have been removed without forwarding. The main homepage Projects section links directly to the game.

Private access codes and Supabase records remain separate from hosting. Do not add secret keys to Vercel or public files; the existing Supabase functions hold the OpenRouter key. Instructor email redirects should allow https://mleungphd.org/oracle/ in Supabase Authentication URL Configuration.
