// Adapted from neobrutalism.dev/r/button.json (MIT).
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import * as React from "react"

import clsx from "clsx"

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg text-sm font-bold transition-all gap-2 border-2 border-ink shadow-[4px_4px_0_var(--color-base-content)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none focus-visible:outline-3 focus-visible:outline-(--focus) disabled:opacity-50 disabled:shadow-none",
  {
    variants: {
      variant: {
        default:
          "text-on-azure bg-azure",
        noShadow: "text-on-azure bg-azure shadow-none",
        neutral:
          "bg-paper text-ink",
        reverse:
          "text-on-azure bg-azure shadow-none hover:shadow-[4px_4px_0_var(--color-base-content)] hover:translate-x-0 hover:translate-y-0",
      },
      size: {
        default: "h-10 px-4 py-2",
        xs: "h-8 gap-1.5 px-2.5 text-xs [&_svg]:size-3.5",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "size-10",
        "icon-xs": "size-8 [&_svg]:size-3.5",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ButtonPrimitive> &
  VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={clsx(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
