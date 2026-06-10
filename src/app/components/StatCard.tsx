import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint: React.ReactNode;
  accentValue?: boolean;
}

export function StatCard({ label, value, hint, accentValue = false }: StatCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="text-[11px] font-bold tracking-widest uppercase text-muted mb-2">
        {label}
      </div>
      <div
        className={cn(
          "font-bebas text-3xl tracking-wide leading-none mb-1",
          accentValue ? "text-accent" : "text-text-base"
        )}
      >
        {value}
      </div>
      <div className="text-[11px] text-muted">{hint}</div>
    </div>
  );
}
