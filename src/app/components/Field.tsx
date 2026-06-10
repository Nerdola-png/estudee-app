import { cn } from "@/lib/utils";
import { Label } from "@/app/components/ui/label";

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, error, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label
        className={cn(
          "text-xs font-semibold tracking-wide uppercase",
          error ? "text-red-400" : "text-muted"
        )}
      >
        {label}
      </Label>
      {children}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
