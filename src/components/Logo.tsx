import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("font-display font-black tracking-tighter", className)}>
      OUT<span className="text-primary">.</span>
    </span>
  );
}

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-live/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-live">
      <span className="live-dot h-2 w-2 rounded-full bg-live" />
      Live
    </span>
  );
}
