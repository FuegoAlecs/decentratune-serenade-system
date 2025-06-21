import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // Applied new theme colors for card background, text, border.
    // Light mode gets shadow-card-light, dark mode has no shadow by default here.
    // Padding is mobile-first p-4, then sm:p-6 for larger screens.
    className={cn(
      "rounded-lg border bg-light-card-surface text-light-text-primary dark:bg-dark-card-surface dark:text-dark-text-primary dark:border-dark-borders-lines shadow-card-light dark:shadow-none p-4 sm:p-6",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // Mobile-first padding: p-4 base, sm:p-6. Removed default bottom padding from original p-6.
    className={cn("flex flex-col space-y-1.5 p-4 pb-2 sm:p-6 sm:pb-4", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
// Changed h3 to div and applied text styling to match semantic h3 if needed, or user can use <hX> as child.
// Mobile-first text size: text-lg base, sm:text-xl, md:text-2xl.
>(({ className, ...props }, ref) => (
  <div // Changed from h3 to div for more flexibility, consumer can pass h3.
    ref={ref}
    className={cn(
      "text-lg sm:text-xl md:text-2xl font-semibold leading-none tracking-tight text-light-text-primary dark:text-dark-text-primary",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    // Mobile-first text size: text-xs base, sm:text-sm. Uses new secondary text colors.
    className={cn("text-xs sm:text-sm text-light-text-secondary dark:text-dark-text-secondary", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  // Mobile-first padding: p-4 base, sm:p-6. Removed default top padding from original p-6 pt-0.
  <div ref={ref} className={cn("p-4 sm:p-6", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // Mobile-first padding: p-4 base, sm:p-6. Removed default top padding from original p-6 pt-0.
    className={cn("flex items-center p-4 pt-2 sm:p-6 sm:pt-4", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
