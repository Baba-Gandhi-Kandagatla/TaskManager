# Cloud setup — Supabase

1. Create a free project at https://supabase.com.
2. Open **SQL Editor**, paste `supabase/schema.sql`, and run it once.
3. Open **Authentication → Providers → Email** and turn off **Confirm email**. Orbit uses private synthetic identifiers under the Supabase project domain so people can sign in using only a name.
4. Open **Project Settings → API**. Copy the project URL and anon/public key into `src/config.js`.
5. Restart Orbit with `npm start`.

When both configuration values exist, Orbit automatically switches to cloud accounts. Every save is written locally first and then synchronized to the signed-in user’s protected database row.

## Important

- Never place the `service_role` key in this app. Use only the anon/public key.
- Usernames are case-insensitive.
- There is no email-based password recovery in username-only mode. Add a real email flow before a public launch if recovery is required.
