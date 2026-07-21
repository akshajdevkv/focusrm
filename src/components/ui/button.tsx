import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(135deg,#6a45ff,#ff7a2f,#ffd15f)] bg-[length:180%_180%] px-4 text-primary-foreground shadow-[0_16px_34px_rgba(99,72,255,0.25)] hover:-translate-y-0.5 hover:bg-[position:100%_50%] hover:brightness-105",
        outline:
          "border border-[#ffe3c9]/72 bg-[#fff6eb]/78 px-4 text-foreground shadow-[0_8px_20px_rgba(38,49,99,0.06)] hover:-translate-y-0.5 hover:bg-[#fff9f1]",
        ghost: "px-3 hover:-translate-y-0.5 hover:bg-white/40",
        icon: "h-10 w-10 border border-[#ffe3c9]/72 bg-[#fff6eb]/78 shadow-sm hover:-translate-y-0.5 hover:bg-[#fff9f1]"
      },
      size: {
        default: "h-10",
        lg: "h-12 px-5",
        sm: "h-9 px-3"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
