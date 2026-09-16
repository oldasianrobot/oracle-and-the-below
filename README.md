# The Oracle and The Below

A short, asynchronous classroom game about human labor behind AI. Built for upload to mleungphd.org or another static host.

## Current delivery status

The visual edition adds real photographs, circled-object description, label correction, A/B/C shape selection, and three separate beauty assignments (three paintings, three flower scenes, and three sculptures). AI sharing consent is remembered per user and class on the same browser, with a withdrawal control. MAX, a sometimes useful, distracted, or cranky fictional 80-year-old advocate, is available from the first assignment. See [AI setup](AI-SETUP.md) for the migration and protected server function.

- Full nine-assignment game, three acts, three ending routes, four generated illustrations with crossfades.
- Device-local practice, ledger, reflection, downloadable receipt.
- Private student codes, Supabase records, authoritative submissions, completion tracking, class totals, and instructor CSV implemented. Instructor access uses email-link sign-in.
- Database functions tested in local PostgreSQL-compatible PGlite; full practice journey checked in the browser.
- Supabase database, `oracle-dialogue`, and `oracle-access` functions installed in project `okprvvuvxjpcoydhjnds`; public connection settings configured. Instructor email sign-in and class ownership are verified. The instructor reported completing the game and receiving live AI replies. Student sign-in no longer uses email. The updated website has not yet been uploaded to the production host.

The private-code update is deployed to Supabase. Sixty codes were issued for Social Problems — Fall 2026. A live code login, reload, return login, sign-out, and unchecked MAX consent were verified. The private distribution CSV is excluded from Git and upload packages.

## Preview

`npm install`, then `npm run dev -- --port 5188`.

`npm test` checks accounting branches, CSV escaping, and database authorization/sequence/completion rules.

`npm run build` creates `dist/`. Upload the contents of `dist/`, not the project source. Relative paths support a subdirectory such as `/oracle/`. Do not upload backend SQL, node_modules, or account secrets to the public website.

## Activate classroom records

Student sign-in now uses private access codes. See [ACCESS-CODES.md](ACCESS-CODES.md) for setup, code distribution, replacement, privacy, and the instructor workflow. Instructor access retains email-link authentication.

For a new project, apply `backend/schema.sql`, `backend/outcomes.sql`, `backend/002-writing-and-dialogue.sql`, `backend/003-visual-max.sql`, then `backend/004-private-access.sql`. Deploy `oracle-dialogue` and `oracle-access`. Existing installations need only unapplied migrations. Preserve server secrets and use only the public Supabase connection settings in the website.

The intended website addresses are `https://mleungphd.org/edutech/` and `https://mleungphd.org/edutech/oracle/`. Set the latter as the instructor sign-in destination when published. Students do not need email delivery. Run `python3 scripts/package-site.py` after building to prepare both the complete directory package and the game-only ZIP.

## Grading and privacy

The visual edition records responses for all nine assignments. Most use writing (10–1,500 characters); assignment three uses A/B/C shape selection, assignments four through six each record three beauty judgments plus a category-specific explanation, and assignment seven retains a route selector because that choice drives the ending. Fixed story payments do not evaluate the writing. Optional AI exchanges do not affect completion or pay.

The app records completion, not an automatically awarded grade. Completion requires nine distinct ordered submissions plus a trimmed reflection of 40–5000 characters. This length check does not assess reflection quality. Earnings, speed, and response choices are not grading criteria. Instructors make final grading decisions.

Private-code records contain a worker ID, responses, submission dates, reflection, and completion date; the instructor keeps the name-to-ID mapping separately. Earlier email records are preserved. Students cannot read other students' identifiable records. Class totals expose aggregate contributions, fictional revenue, fictional payments, and completed count to class members. No public roster. Practice stores its own progress locally and never submits class records.

A static page can always be inspected or automated by a determined student. Server-side sequence checks prevent forged totals and duplicate credit; this is a participation activity, not a proctored exam or proof of attention.

## Teaching notes

Students interpret fictional evidence; only the optional MAX conversation calls an AI model when connected. The fixed ledger amounts and reform effects are invented for comparison. Revenue is not profit. Assignment 2 supplies a locomotive-label correction for comparison and fixed story pay; it does not automatically score free text. Assignments 4–6 each reject the work regardless of the selected judgments, demonstrating withheld standards; this is documented here for instructors, not explained in the in-game rejection. Assignment 7 offers a hypothetical individual branch, not an actual vote or a live negotiation among classmates. The outside review remains pending and releases no payment; negotiated prospective payment does not erase past rejections. The revised version offers 60 crowns total and pays 36 on route A or 24 on routes B/C.

All four Oracle stages follow individual progress (0, 3, 6, 9 assignments). Class totals are cumulative and refreshed after submissions or on request. Crossfades respect reduced-motion preferences. No timer, sound, or sign-in is needed for practice.

## Source

Rebecca Tan and Regine Cabato, “Behind the AI boom, an army of overseas workers in ‘digital sweatshops,’” The Washington Post, August 28, 2023. The supplied course reading includes company responses disputing payment problems. Fictional mechanics explore the reported themes, not present-day claims about a company or a simulation of a particular worker's life. Use the assigned PDF via the LMS; it is not redistributed in the website.

## Service documentation

- Email links: https://supabase.com/docs/guides/auth/auth-email-passwordless
- Redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Email delivery: https://supabase.com/docs/guides/auth/auth-smtp
- Database security: https://supabase.com/docs/guides/database/postgres/row-level-security

## Updating tasks

Edit `src/visual.js`; run `node scripts/seed-visual-outcomes.js`; review and apply `backend/003-visual-max.sql`; then rebuild. Existing saved responses retain their original results. For substantive task changes, create a new class/version rather than mixing versions in one graded cohort.

Illustration provenance and prompts: `ARTWORK.md`.

## Visual edition compatibility

`src/visual.js` supplies the new prompts and presentation feedback; the original task definitions remain for interpreting earlier records. New responses include an edition marker, task title, and all selected labels in the existing response field. The server still controls fixed accounting and completion. Apply `backend/003-visual-max.sql` for version 3; it adds an authoritative visual submission endpoint and makes MAX available before assignment six. No database reset is required. Earlier records are not overwritten. Partly completed earlier editions cannot mix with version 3 submissions; use a new class for those players. Completed records remain readable. Practice uses a new storage key, leaving old practice data intact. Use a new class for a new cohort rather than mixing editions within a graded cohort.

Beauty judgments are subjective and receive the client rejection regardless of the selections. Shape answers are recorded and followed by an authored explanation; no answer affects participation credit. Photographs include descriptive alternative text and full-size links. Image credits and reuse terms ship in `public/assignments/CREDITS.md` and appear alongside each photograph.
