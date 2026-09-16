# The Oracle and The Below

A short, asynchronous classroom game about human labor behind AI. Built for upload to mleungphd.org or another static host.

## Current delivery status

Version 1.1 adds written responses and an optional OpenRouter-powered payment appeal. See [AI setup](AI-SETUP.md) for the migration and protected server function.

- Full nine-assignment game, three acts, three ending routes, four generated illustrations with crossfades.
- Device-local practice, ledger, reflection, downloadable receipt.
- Supabase email-link sign-in, class membership, authoritative submissions, completion records, class totals, instructor CSV implemented.
- Database functions tested in local PostgreSQL-compatible PGlite; full practice journey checked in the browser.
- Supabase database and `oracle-dialogue` function installed in project `okprvvuvxjpcoydhjnds`; public connection settings configured. Instructor email sign-in and class ownership are verified. Instructor-screen access, classroom email delivery, and an actual AI exchange still require end-to-end verification. The updated website has not yet been uploaded to the production host.

## Preview

`npm install`, then `npm run dev -- --port 5188`.

`npm test` checks accounting branches, CSV escaping, and database authorization/sequence/completion rules.

`npm run build` creates `dist/`. Upload the contents of `dist/`, not the project source. Relative paths support a subdirectory such as `/oracle/`. Do not upload backend SQL, node_modules, or account secrets to the public website.

## Activate classroom records

1. Create a Supabase project under your own account. Review its current terms and pricing yourself before accepting them.
2. Run `backend/schema.sql` once in that project's SQL Editor. Then run `backend/outcomes.sql`, followed by `backend/002-writing-and-dialogue.sql`. Use a dedicated project or check for name conflicts before running migrations.
3. In Authentication URL Configuration, set the final game URL (including trailing slash) as the Site URL and an allowed redirect. During local testing, additionally allow `http://127.0.0.1:5188/`. Remove that local redirect when no longer needed.
4. Configure production email delivery in Supabase. Its default email service is restricted and is not suitable for a class of arbitrary recipients. Configure your own SMTP provider; verify delivery to a student test account. Check current limits and costs before enabling classroom use.
5. Put the project's public URL and **publishable key** (or legacy anon key) in `public/config.js`, then rebuild. Alternatively edit `config.js` in the finished upload folder. **Never use a service-role key or secret key in browser files.** Public keys are protected by database permissions; changing the UI does not grant instructor access.
6. Open the configured game and sign in using your instructor email. This creates your verified account.
7. In the Supabase SQL Editor, create a course tied to that account, using this template with your exact email and a long random class code:

```sql
insert into public.oracle_courses(name, join_code, instructor_id)
select 'Social Problems — Fall 2026', 'REPLACE-WITH-A-LONG-RANDOM-CLASS-CODE', id
from auth.users where email = 'YOUR-INSTRUCTOR-EMAIL';
```

Check that one row was inserted. The class code is an invitation, not an identity credential. Distribute it through your LMS. Students authenticate their email and enter the code. No roster import or automatic LMS grade posting is included.

8. On the signed-in join screen, select **Instructor records**. Export CSV for your gradebook. Only courses assigned to the authenticated account appear.
9. Test two real student accounts before class: verify email links, ordered submissions, refresh/resume, reflection completion, class totals, instructor CSV, and denied instructor access for students.

A class can be closed by setting `active = false` in `oracle_courses`; saved records remain readable but new work and completion are blocked. Deleting a course cascades to its participation records: export what you need first and apply your institution's retention requirements. Use the provider's dashboard for account/record administration.

## Grading and privacy

Version 1.1 records written responses (10–2,000 characters) for all nine assignments. Assignment seven also retains a route selector because that choice drives the ending. Fixed story payments do not evaluate the writing. Optional AI exchanges do not affect completion or pay.

The app records completion, not an automatically awarded grade. Completion requires nine distinct ordered submissions plus a trimmed reflection of 40–5000 characters. This length check does not assess reflection quality. Earnings, speed, and response choices are not grading criteria. Instructors make final grading decisions.

Signed-in records contain authenticated user ID, responses, submission dates, reflection, and completion date; the instructor view joins the verified account email. Students cannot read other students' identifiable records. Class totals expose aggregate contributions, fictional revenue, fictional payments, and completed count to class members. No public roster. Practice stores its own progress locally and never submits class records.

A static page can always be inspected or automated by a determined student. Server-side sequence checks prevent forged totals and duplicate credit; this is a participation activity, not a proctored exam or proof of attention.

## Teaching notes

Students interpret fictional evidence; only the optional Help Moth conversation calls an AI model when connected. The fixed ledger amounts and reform effects are invented for comparison. Revenue is not profit. Assignment 2 now offers an authored example for comparison and fixed story pay; it does not automatically score free text. Assignment 4 is an explicitly scripted rejection regardless of the written response, demonstrating withheld standards. Assignment 7 offers a hypothetical individual branch, not an actual vote or a live negotiation among classmates. An appeal can release prior approved pay without changing future rates; negotiated prospective payment does not erase past unpaid work.

All four Oracle stages follow individual progress (0, 3, 6, 9 assignments). Class totals are cumulative and refreshed after submissions or on request. Crossfades respect reduced-motion preferences. No timer, sound, or student accounts are needed for practice.

## Source

Rebecca Tan and Regine Cabato, “Behind the AI boom, an army of overseas workers in ‘digital sweatshops,’” The Washington Post, August 28, 2023. The supplied course reading includes company responses disputing payment problems. Fictional mechanics explore the reported themes, not present-day claims about a company or a simulation of a particular worker's life. Use the assigned PDF via the LMS; it is not redistributed in the website.

## Service documentation

- Email links: https://supabase.com/docs/guides/auth/auth-email-passwordless
- Redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Email delivery: https://supabase.com/docs/guides/auth/auth-smtp
- Database security: https://supabase.com/docs/guides/database/postgres/row-level-security

## Updating tasks

Edit `src/game.js`; run `node scripts/seed-outcomes.js`; review and apply the new `backend/outcomes.sql`; then rebuild. Existing saved responses retain their original results. For substantive task changes, create a new class/version rather than mixing versions in one graded cohort.

Illustration provenance and prompts: `ARTWORK.md`.
