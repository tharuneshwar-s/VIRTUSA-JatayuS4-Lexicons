import * as React from "react"
// import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-priceai text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-priceai-blue text-white hover:bg-priceai-blue/90",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline:
          "border border-priceai-gray bg-transparent hover:bg-priceai-gray/10 text-priceai-gray hover:text-priceai-blue", 
        secondary:"bg-gradient-to-r from-priceai-blue/30 to-priceai-lightgreen/30 text-priceai-dark hover:bg-gradient-to-r hover:from-priceai-blue/10 hover:to-priceai-lightgreen/10",
        ghost: "hover:bg-priceai-gray/10 text-priceai-gray hover:text-priceai-blue",
        link: "text-priceai-blue underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-priceai px-3",
        lg: "h-11 rounded-priceai px-8",
        icon: "h-10 w-10",
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
    // const Comp = asChild ? Slot : "button"
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
