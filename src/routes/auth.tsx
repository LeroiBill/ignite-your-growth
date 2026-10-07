import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — OUT" },
      { name: "description", content: "Sign in to OUT with Google or a magic link." },
      { property: "og:title", content: "Sign in — OUT" },
      { property: "og:description", content: "Sign in to OUT with Google or a magic link." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home", replace: true });
    });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/home", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (result.error) toast.error("Google sign-in failed");
  }

  async function magic(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + "/auth" },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="relative min-h-dvh bg-background">
      <div className="pointer-events-none absolute inset-0 bg-glow" />
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-10 pt-8">
        <Logo className="text-2xl" />
        <div className="flex flex-1 flex-col justify-end">
          <h1 className="text-4xl font-black leading-none">
            Get <span className="text-primary">OUT.</span>
          </h1>
          <p className="mt-3 text-muted-foreground">One tap and you're in.</p>

          {sent ? (
            <div className="mt-8 rounded-3xl border bg-card-gradient p-6">
              <div className="font-display text-xl font-bold">Check your inbox</div>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a sign-in link to <span className="text-foreground">{email}</span>.
              </p>
              <button onClick={() => setSent(false)} className="mt-4 text-sm font-medium text-primary">
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={google}
                className="mt-8 flex h-14 items-center justify-center gap-3 rounded-full bg-foreground font-semibold text-background active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                  <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z" />
                </svg>
                Continue with Google
              </button>
              <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
              </div>
              <form onSubmit={magic} className="flex flex-col gap-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="h-14 rounded-full border border-input bg-card px-6 text-base outline-hidden focus:border-primary"
                />
                <button
                  disabled={loading}
                  className="h-14 rounded-full bg-primary font-display font-bold text-primary-foreground shadow-glow active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? "Sending…" : "Send magic link"}
                </button>
              </form>
            </>
          )}
          <p className="mt-6 text-center text-xs text-muted-foreground">You must be 18+ to use OUT.</p>
        </div>
      </div>
    </div>
  );
}
