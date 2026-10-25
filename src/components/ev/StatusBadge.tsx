import { cn } from "@/lib/utils";
import type { ShortageStatus } from "@/lib/ev-data";

const styles: Record<ShortageStatus, string> = {
  CRITICAL: "bg-destructive/15 text-destructive border-destructive/40",
  MODERATE: "bg-warning/15 text-warning border-warning/40",
  ADEQUATE: "bg-primary/15 text-primary border-primary/40",
};

export function StatusBadge({ status }: { status: ShortageStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-wider", styles[status] ?? styles.MODERATE)}>
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
