# Connect the free AI conversation

## What is ready

The game now accepts students' written responses. Only assignment seven keeps a route selector, with a written explanation. After assignment six, students can optionally converse with the Help Moth. All ordinary assignments and the final reflection stay within the class database. Only messages students explicitly send to the Help Moth, plus earlier exchanges in that conversation, go to OpenRouter and the selected model provider.

Practice mode uses labeled authored dialogue and never calls OpenRouter. The live integration requires the following setup. It has been tested with simulated provider responses and a local PostgreSQL-compatible database; a real account call remains to be verified after connection.

## Connected project status

On September 15, 2026, all three SQL files were installed in project `okprvvuvxjpcoydhjnds`, and `oracle-dialogue` was deployed through the dashboard. The dashboard copy inlines `dialogue.js` into `index.ts`; the repository keeps the equivalent two-file source for CLI deployments. The legacy gateway JWT check is off; in-function user verification remains required. Allowed origins are configured for `https://mleungphd.org` and `http://127.0.0.1:5188`. The OpenRouter key has been saved by the project owner. An unauthenticated request to the deployed function returned the expected 401 with “Sign in first.” The temporary Auth Site URL is `http://127.0.0.1:5188/`; change this to the final hosted game address before classroom use. A sign-in email was requested for the instructor; email delivery, instructor course creation, and a real signed-in AI exchange remain to be verified.

## 1. Prepare the database

For a new project, run these in the Supabase SQL Editor in order:

1. `backend/schema.sql`
2. `backend/outcomes.sql`
3. `backend/002-writing-and-dialogue.sql`

For a project with the original game already installed, run only the third file. It preserves existing submissions. The migration replaces direct multiple-choice submission access with validated written submission access. New writing is required to be 10–2,000 characters. Existing completed records are preserved rather than reset.

## 2. Keep secrets on the server

In your Supabase project's Edge Functions secrets, add:

- `OPENROUTER_API_KEY`: your OpenRouter API key.
- `OPENROUTER_MODEL`: `openrouter/free`, or a chosen model ID ending in `:free`.
- `ALLOWED_ORIGINS`: exact comma-separated origins, initially `https://mleungphd.org,http://127.0.0.1:5188`. Add a different preview/deployment origin if you use one. An origin has no path or trailing slash.

Never put the OpenRouter key in `public/config.js`, the website, chat, or GitHub. Supabase provides its own project URL, anon key, and service-role key to the hosted function automatically. The service-role key is used only within the server function to finalize dialogue records.

The public website still needs only the Supabase project URL and publishable/anon key in `public/config.js` as explained in README.md.

## 3. Deploy the function

Using the Supabase CLI from the project folder (after logging in and linking the project):

```sh
supabase functions deploy oracle-dialogue
```

The function lives in `supabase/functions/oracle-dialogue/`. The supplied `supabase/config.toml` disables the legacy gateway JWT check, because the function itself calls Supabase Auth `getUser()` to verify the bearer token before accessing any records or requesting AI. Do not remove that in-function verification. No unauthenticated AI requests are supported.

A dashboard editor deployment is also possible: create the `oracle-dialogue` function and include both `index.ts` and `dialogue.js`, preserving the relative import. Apply the equivalent JWT gateway setting. CLI deployment is less error-prone for multiple files.

## 4. Limits and fallback

- Three reserved AI exchanges per student per class, enforced in the database.
- At least 15 seconds between a student's reservations.
- Default project-wide budget: 40 requests per UTC day and 15 per rolling minute, including failed attempts. This leaves headroom under an otherwise unused 50/day account allowance. Other apps using the same OpenRouter account share OpenRouter's quota and can still exhaust it.
- Request identifiers prevent replaying a reservation from making a duplicate upstream request. Concurrent requests are serialized against a shared budget row.
- Replies are limited to 220 generated tokens and a 15-second provider timeout.
- The server accepts only `openrouter/free` or `:free` IDs; it also sets prompt, completion, and request price ceilings to zero. No paid-model fallback.
- Routing requests `data_collection: deny`. This may reduce available free providers. If no matching provider exists, the game uses authored fallback rather than relaxing the restriction.
- No automatic retries. Provider errors, malformed responses, and timeouts return labeled authored dialogue. Connection failures also expose an authored fallback in the browser; that unsaved fallback is identified as such.

If your OpenRouter account has a higher free-request allowance, deliberately update the game's limit in SQL:

```sql
update oracle_private.ai_limits set daily_limit = 1000 where id = 1;
```

Use a value consistent with your account's actual allowance and other usage. The database allows a maximum of 1000/day and 20/minute. Free model availability is not guaranteed. Hosting or email service costs are separate from free model inference.

## 5. Verify before class

- Sign in with a test student, join the class, submit six written assignments, then send a fictional appeal.
- Confirm the reply says **AI reply** and the conversation is readable in instructor records. Confirm the ledger and participation totals did not change because of dialogue.
- Test fallback and blocked fourth exchange. Check that a second student cannot see the first student's messages.
- Inspect OpenRouter usage to confirm the actual model and zero charge.
- Confirm the production domain is in the allowed origins, email-link redirect list, and email delivery works for actual student addresses.

Student messages can influence the model despite role instructions. The model has no database tools, payment authority, or grading authority. The authoritative ledger is computed independently. Generated responses are rendered as escaped plain text, never executable HTML.

## References

- OpenRouter request API: https://openrouter.ai/docs/api-reference/overview
- OpenRouter provider price and data controls: https://openrouter.ai/docs/guides/routing/provider-selection
- Supabase protected function settings: https://supabase.com/docs/guides/functions/secrets
