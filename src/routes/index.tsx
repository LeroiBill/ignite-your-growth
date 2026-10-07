import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo, LiveBadge } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OUT — Every night is an activity" },
      { name: "description", content: "The social nightlife tracker. Start a Night, log drinks, earn XP and get your recap." },
      { property: "og:title", content: "OUT — Every night is an activity" },
      { property: "og:description", content: "The social nightlife tracker. Start a Night, log drinks, earn XP and get your recap." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);
  const cta = signedIn ? "/home" : "/auth";

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-glow" />
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-10 pt-8">
        <header className="flex items-center justify-between">
          <Logo className="text-2xl" />
          <Link to={cta} className="text-sm font-medium text-muted-foreground">
            {signedIn ? "Open app" : "Sign in"}
          </Link>
        </header>

        <main className="flex flex-1 flex-col justify-center py-12">
          <LiveBadge />
          <h1 className="mt-6 text-[3.4rem] font-black leading-[0.92]">
            Every night is an <span className="text-primary">activity.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Start a Night with your crew. Log drinks, chase sidequests, climb the live leaderboard — and wake up to your recap.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              ["2,480", "XP"],
              ["4h 12m", "Out"],
              ["#1", "Rank"],
            ].map(([n, l]) => (
              <div key={l} className="rounded-2xl border bg-card-gradient p-4">
                <div className="font-display text-xl font-bold">{n}</div>
                <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        </main>

        <Link
          to={cta}
          className="flex h-16 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground shadow-glow transition-transform active:scale-[0.98]"
        >
          {signedIn ? "Open OUT" : "Get started"}
        </Link>
        <p className="mt-4 text-center text-xs text-muted-foreground">18+ only. Drink responsibly.</p>
      </div>
    </div>
  );
}
