import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "min-h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-black shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-black focus:ring-2 focus:ring-black/10",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
