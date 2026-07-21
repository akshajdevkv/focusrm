import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn("gloss-panel rounded-lg text-card-foreground", className)}
      {...props}
    />
  );
}
