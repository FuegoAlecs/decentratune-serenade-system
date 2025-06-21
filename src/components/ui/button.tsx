import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles: mobile-first focus, padding, font size.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs sm:text-sm font-medium ring-offset-light-background dark:ring-offset-dark-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3 sm:[&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Default variant uses new accent colors and gradients
        default:
          "bg-light-accent-primary text-white hover:bg-light-accent-hover dark:bg-dark-accent-primary dark:hover:bg-dark-accent-hover dark:text-dark-text-primary bg-accent-gradient-light dark:bg-accent-gradient-dark",
        destructive:
          "bg-light-error text-white hover:bg-light-error/90 dark:bg-dark-error dark:text-dark-text-primary dark:hover:bg-dark-error/90",
        outline:
          "border border-light-borders-lines bg-transparent hover:bg-light-accent-primary/10 hover:text-light-accent-primary dark:border-dark-borders-lines dark:hover:bg-dark-accent-primary/20 dark:hover:text-dark-accent-primary",
        secondary:
          "bg-light-text-secondary/10 text-light-text-secondary hover:bg-light-text-secondary/20 dark:bg-dark-text-secondary/20 dark:text-dark-text-secondary dark:hover:bg-dark-text-secondary/30",
        ghost:
          "hover:bg-light-accent-primary/10 hover:text-light-accent-primary dark:hover:bg-dark-accent-primary/20 dark:hover:text-dark-accent-primary",
        link:
          "text-light-accent-primary underline-offset-4 hover:underline dark:text-dark-accent-primary",
      },
      size: {
        // Mobile first sizes, then sm+
        default: "h-9 px-3 py-1.5 sm:h-10 sm:px-4 sm:py-2", // Adjusted for mobile
        sm: "h-8 rounded-md px-2.5 sm:h-9 sm:px-3", // Adjusted for mobile
        lg: "h-10 rounded-md px-6 sm:h-11 sm:px-8", // Adjusted for mobile
        icon: "h-9 w-9 sm:h-10 sm:w-10", // Adjusted for mobile
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
