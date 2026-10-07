import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { myNightsQuery, profileQuery } from "@/lib/queries";
import { Logo, LiveBadge } from "@/components/Logo";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Home — OUT" }, { name: "description", content: "Your nights, your XP." }] }),
  loader: async ({ context }) => {
    const profile = await context.queryClient.ensureQueryData(profileQuery(context.user.id));
    if (!profile?.username || !profile.is_adult) throw redirect({ to: "/welcome" });
    await context.queryClient.ensureQueryData(myNightsQuery(context.user.id));
  },
  component: Home,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still out";
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Tonight's the night";
}

function useCountUp(target: number, ms = 1100) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function duration(start?: string | null, end?: string | null) {
  if (!start) return "—";
  const mins = Math.max(0, Math.round(((end ? new Date(end) : new Date()).getTime() - new Date(start).getTime()) / 60000));
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function Home() {
  const { user } = Route.useRouteContext();
  const { data: profile } = useSuspenseQuery(profileQuery(user.id));
  const { data: nights } = useSuspenseQuery(myNightsQuery(user.id));
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [joinOpen, setJoinOpen] = useState(false);
  const xp = useCountUp(profile?.lifetime_xp ?? 0);

  const active = nights.find((n) => n.night && n.night.status !== "ended");
  const recent = nights.filter((n) => n.night?.status === "ended").slice(0, 6);
  const soon = () => toast("Coming in the next update", { description: "Nights are being built right now." });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const initials = (profile?.display_name ?? "?").slice(0, 1).toUpperCase();

  return (
    <div className="relative min-h-dvh bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-glow" />
      <div className="relative mx-auto max-w-md px-5 pb-16 pt-6">
        <header className="flex items-center justify-between">
          <Logo className="text-xl" />
          <DropdownMenu>
            <DropdownMenuTrigger className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary/60 bg-card">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="font-display font-bold">{initials}</span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>@{profile?.username}</DropdownMenuItem>
              <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <section className="mt-8">
          <p className="text-sm text-muted-foreground">{greeting()},</p>
          <h1 className="text-3xl font-black">{profile?.display_name?.split(" ")[0]}</h1>
        </section>

        <section className="mt-6 rounded-3xl border bg-card-gradient p-5">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Lifetime XP</div>
          <div className="mt-1 font-display text-6xl font-black tabular-nums text-primary">{xp.toLocaleString()}</div>
          <div className="mt-3 flex gap-6 text-sm text-muted-foreground">
            <span><b className="text-foreground">{nights.length}</b> nights</span>
            <span><b className="text-foreground">{nights.reduce((a, n) => a + (n.night?.drink_count ?? 0), 0)}</b> drinks logged</span>
          </div>
        </section>

        {active?.night ? (
          <section className="mt-4 rounded-3xl border border-primary/30 bg-card p-5 shadow-glow">
            <div className="flex items-center justify-between">
              {active.night.status === "live" ? <LiveBadge /> : <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Lobby</span>}
              <span className="text-xs text-muted-foreground">{active.night.night_members?.[0]?.count ?? 1} friends</span>
            </div>
            <h2 className="mt-3 text-2xl font-black">{active.night.name}</h2>
            <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
              <span>My XP <b className="text-foreground">{active.xp}</b></span>
              <span>{duration(active.night.started_at)}</span>
            </div>
            <button onClick={soon} className="mt-5 h-14 w-full rounded-full bg-primary font-display font-bold text-primary-foreground active:scale-[0.98]">
              OPEN
            </button>
          </section>
        ) : (
          <button
            onClick={soon}
            className="mt-4 flex h-36 w-full flex-col items-start justify-end rounded-3xl bg-primary p-6 text-left text-primary-foreground shadow-glow transition-transform active:scale-[0.98]"
          >
            <span className="text-sm font-semibold opacity-70">Ready?</span>
            <span className="font-display text-3xl font-black leading-none">START A NIGHT →</span>
          </button>
        )}

        <button
          onClick={() => setJoinOpen(true)}
          className="mt-3 h-14 w-full rounded-full border border-input bg-card font-display font-bold active:scale-[0.98]"
        >
          JOIN A NIGHT
        </button>

        <section className="mt-10">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent nights</h3>
          {recent.length === 0 ? (
            <div className="mt-3 rounded-3xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No nights yet. Your first recap will land here.
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {recent.map(({ night, xp }) =>
                night ? (
                  <div key={night.id} className="rounded-3xl border bg-card p-5">
                    <div className="flex items-baseline justify-between">
                      <h4 className="font-display text-lg font-bold">{night.name}</h4>
                      <span className="text-xs text-muted-foreground">{new Date(night.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {[
                        [duration(night.started_at, night.ended_at), "Time"],
                        [night.venue_count, "Venues"],
                        [night.drink_count, "Drinks"],
                        [xp, "XP"],
                      ].map(([v, l]) => (
                        <div key={l as string}>
                          <div className="font-display text-base font-bold">{v}</div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null,
              )}
            </div>
          )}
        </section>
      </div>

      <JoinDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </div>
  );
}

function JoinDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [code, setCode] = useState("OUT-");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">Join a Night</DialogTitle>
        </DialogHeader>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={8}
          className="h-16 rounded-2xl border border-input bg-background text-center font-display text-2xl font-bold tracking-widest outline-hidden focus:border-primary"
        />
        <button
          onClick={() => {
            toast("Joining is coming in the next update");
            onOpenChange(false);
          }}
          className="h-14 rounded-full bg-primary font-display font-bold text-primary-foreground"
        >
          Join
        </button>
      </DialogContent>
    </Dialog>
  );
}
