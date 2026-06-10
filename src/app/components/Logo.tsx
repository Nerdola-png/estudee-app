import { cn } from "@/lib/utils";

const sizes = {
  sm: "text-xl tracking-widest",
  md: "text-2xl tracking-widest",
  lg: "text-4xl tracking-widest",
};

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ size = "md", className }: LogoProps) {
  return (
    <span className={cn("font-bebas text-accent", sizes[size], className)}>
      ESTU<span className="text-text-base">DEE</span>
    </span>
  );
}
