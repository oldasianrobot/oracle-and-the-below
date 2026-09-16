# Private student access codes

Students enter a unique two-word code plus four digits, such as `otter-lantern-4827` (example only). Capitalization is ignored; spaces may replace hyphens. No student email, name, Supabase Auth account, or email delivery is required.

## Instructor workflow

1. Open **Instructor access** on the game’s welcome screen and sign in with your instructor email.
2. Open instructor records, select the class, and generate the desired number of private codes.
3. Download the private code list before leaving the page. Plaintext codes are shown only when issued or replaced. The website cannot retrieve them later.
4. Keep the list privately. Add student names in your own local roster or institution-approved system, not in the game. Give each student only their own code through your LMS or another private channel.
5. Monitor worker IDs, assignment counts, reflections, and completion. Export the gradebook and match worker IDs to your separate roster.
6. If a code is lost or shared, choose **Replace code** for that worker. Give the new code to the same student. Their record is preserved; the old code and all its sessions stop working immediately.
7. **Disable** stops a worker’s access while preserving their saved record. Issuing a replacement re-enables access.

Code generation creates a reserved worker record. The first successful login marks it started. The same code resumes the same record on another device. Codes are valid for 180 days after issuance; sessions last 12 hours and are retained only in the current browser tab’s session storage. Students can sign out explicitly or enter their code again after a session expires.

The account owner requested 60 codes, with 20 students expected. Unassigned codes are spares. Do not distribute a shared code: anyone using it would access the same record.

## What is saved and shared

- Supabase stores a worker ID, course membership, responses, optional MAX exchanges, reflection, and completion dates.
- The game does not collect student names or email addresses. Hosting providers can still process connection information such as IP addresses; written responses may identify a student if they include personal details.
- The instructor keeps the identifying roster separately. This is pseudonymous participation, not a claim of complete anonymity or automatic FERPA compliance.
- Classmates see aggregate totals for the private-code cohort, not other workers’ individual records.
- MAX remains optional live AI. Consent is required before sending messages and remembered per worker and class in that browser. Only the conversation is sent to OpenRouter and the selected model provider—not access codes, worker IDs, assignment responses, or final reflections. Students should avoid identifying details in messages.
- MAX cannot grade, alter the ledger, or file real appeals. Up to three exchanges are available per worker, subject to the existing project-wide AI allowance. Provider failures return authored replies.
- Earlier email-based records remain available to the instructor and are labeled separately.

## Security and maintenance

Private records and credential digests are in the non-public database schema. Anonymous and ordinary authenticated clients cannot call the code database functions directly. The `oracle-access` function verifies an opaque student session for every student operation. Instructor operations separately verify the instructor’s Supabase login and course ownership. The existing service credential can also provision codes through the trusted Supabase dashboard; it must never be used in the public website.

Codes are generated with cryptographic randomness from 7,772 alphabetic entries in the EFF long wordlist, plus four random digits. The server stores a domain-separated HMAC-SHA-256 digest, keyed with its service credential, rather than a retrievable code. Rotating that credential requires reissuing access codes, but does not erase records. Random 256-bit session tokens are stored as SHA-256 digests on the server.

Login attempts have shared, transactional limits of 120 per minute and 1,000 per hour. These limits do not depend on client-supplied IP headers and cannot be evaded by trying different codes. They can temporarily affect legitimate sign-ins during an attack. No security system prevents students from voluntarily sharing their codes.

Code expiry does not delete records. Set a course retention schedule with your institution; the game does not automatically delete submitted work. Keep private exports out of Git and the website. The repository’s `private/` directory is ignored by Git and excluded from the public build and upload package.

## Setup

Apply `backend/004-private-access.sql` after migrations 001–003 (`schema.sql`, `outcomes.sql`, `002-writing-and-dialogue.sql`, `003-visual-max.sql`). Deploy `supabase/functions/oracle-access/` alongside the existing dialogue function. Both validate access inside the function; their legacy gateway JWT check is disabled in `supabase/config.toml`.

The new function uses the existing server environment variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGINS`, `OPENROUTER_API_KEY`, and optional `OPENROUTER_MODEL`. No secret belongs in `public/config.js`.

`node scripts/bundle-access.js` prepares an equivalent single-file source in `/tmp/oracle-access-deploy.ts` for dashboard deployment. It contains code and the public wordlist, not secrets.

## Website paths

- Game: `https://oracle.mleungphd.org/`
- Hosting: independent `oracle-and-the-below` Vercel project. See [HOSTING.md](HOSTING.md).

For a manual static copy, run `npm run build`, then `python3 scripts/package-site.py`. The ZIP contains only game files. The old educational projects landing page is no longer used.

The final game address is configured in Supabase’s Site URL and allowed redirect URLs. Student code sign-in does not use an email redirect. Keep the localhost redirect during local review. The allowed AI/API origins include `https://oracle.mleungphd.org`, the original main-site origin, and local review.

## Wordlist attribution

Electronic Frontier Foundation, [EFF’s New Wordlists for Random Passphrases](https://www.eff.org/deeplinks/2016/07/new-wordlists-random-passphrases), [long wordlist](https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt). The bundled list retains alphabetic entries; four punctuation-containing entries are omitted. This short classroom access-code format is our design, not an EFF recommendation for general-purpose passwords.
