/**
 * ===========================================
 * LABEL COMPONENT
 * ===========================================
 * Reusable label component for form inputs.
 * Styled to match the Majestic design system.
 */

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Label component props.
 */
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  // All standard label props are inherited
}

/**
 * Label component.
 * Used for form field labels throughout the app.
 */
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground",
          className
        )}
        {...props}
      />
    )
  }
)

Label.displayName = "Label"

export { Label }
