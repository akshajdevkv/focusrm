import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "min-h-10 w-full rounded-lg border border-white/70 bg-white/65 px-3 text-sm shadow-inner outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-primary",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
