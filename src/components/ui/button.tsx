import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-black bg-black px-4 text-white shadow-sm hover:-translate-y-0.5 hover:bg-neutral-800",
        outline:
          "border border-neutral-300 bg-white px-4 text-black shadow-sm hover:-translate-y-0.5 hover:border-black",
        ghost: "px-3 hover:-translate-y-0.5 hover:bg-neutral-100",
        icon: "h-10 w-10 border border-neutral-300 bg-white text-black shadow-sm hover:-translate-y-0.5 hover:border-black"
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
