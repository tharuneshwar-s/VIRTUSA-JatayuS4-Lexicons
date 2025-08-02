import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-priceai border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:"bg-priceai-blue text-priceai-white border-transparent hover:bg-priceai-blue/80",
        secondary: "bg-priceai-lightgreen text-priceai-dark border-transparent hover:bg-priceai-lightgreen/80",
        outline: "border-priceai-gray bg-transparent text-priceai-gray hover:bg-priceai-gray/10",
        destructive: "bg-red-500 text-white border-transparent hover:bg-red-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
