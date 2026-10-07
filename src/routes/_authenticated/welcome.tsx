import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/lib/queries";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/_authenticated/welcome")({
  head: () => ({ meta: [{ title: "Set up your profile — OUT" }, { name: "description", content: "Pick your name and @username." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(profileQuery(context.user.id)),
  component: Welcome,
});

function Welcome() {
  const { user } = Route.useRouteContext();
  const { data: profile } = useSuspenseQuery(profileQuery(user.id));
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState(profile?.display_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [adult, setAdult] = useState(profile?.is_adult ?? false);
  const [saving, setSaving] = useState(false);

  const valid = name.trim().length > 0 && /^[a-z0-9_]{3,20}$/.test(username) && adult;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: name.trim(),
      username,
      is_adult: true,
      age_confirmed_at: profile?.age_confirmed_at ?? new Date().toISOString(),
      avatar_url: profile?.avatar_url ?? (user.user_metadata?.["avatar_url"] as string | undefined) ?? null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.code === "23505" ? "That @username is taken" : error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["profile", user.id] });
    navigate({ to: "/home", replace: true });
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-10 pt-8">
      <Logo className="text-2xl" />
      <form onSubmit={save} className="flex flex-1 flex-col justify-end gap-4">
        <h1 className="text-4xl font-black leading-none">Who's coming out?</h1>
        <p className="text-muted-foreground">Ten seconds, then you're in.</p>
        <label className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Display name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          className="h-14 rounded-2xl border border-input bg-card px-5 text-base outline-hidden focus:border-primary"
        />
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Username</label>
        <div className="flex h-14 items-center rounded-2xl border border-input bg-card px-5 focus-within:border-primary">
          <span className="text-muted-foreground">@</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            maxLength={20}
            placeholder="nightowl"
            className="h-full flex-1 bg-transparent pl-1 text-base outline-hidden"
          />
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">3–20 characters: letters, numbers, underscores.</p>
        <button
          type="button"
          onClick={() => setAdult(!adult)}
          className="flex items-center gap-4 rounded-2xl border bg-card p-4 text-left"
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 ${adult ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}
          >
            {adult && "✓"}
          </span>
          <span className="text-sm">I confirm I am 18 or older.</span>
        </button>
        <button
          disabled={!valid || saving}
          className="mt-2 h-16 rounded-full bg-primary font-display text-lg font-bold text-primary-foreground shadow-glow active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
        >
          {saving ? "Saving…" : "Let's go"}
        </button>
      </form>
    </div>
  );
}
