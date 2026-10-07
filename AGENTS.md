<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Signed-in screens live under `src/routes/_authenticated/` and read data via the browser client with shared queryOptions in `src/lib/queries.ts` — keeps RLS as the single access boundary.
- Night visibility is enforced in RLS via the `is_night_member` security-definer function — avoids recursive policies on night_members.
- Profiles are auto-created by an auth trigger; `/welcome` completes username + 18+ gate before `/home` — keeps onboarding one screen.
- The app is dark-only; all colors come from tokens in `src/styles.css` — one accent token drives the whole brand.
