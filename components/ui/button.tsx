import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-sans text-sm font-semibold tracking-[.02em] transition-[background-color,color,transform,border-color] duration-150 ease-[cubic-bezier(.2,.8,.2,1)] disabled:pointer-events-none disabled:bg-[var(--color-grafito-3)] disabled:text-[var(--color-niebla)] disabled:opacity-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 shrink-0 hover:[&_svg]:translate-x-[3px] active:scale-[.98]",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-[#ff7f40] hover:text-[var(--color-grafito)]',
        destructive:
          'bg-destructive text-[var(--color-grafito)] hover:bg-destructive/90',
        outline:
          'border border-[var(--color-linea-fuerte)] bg-transparent text-foreground hover:border-[rgb(247_245_241/0.4)]',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'border border-[var(--color-linea-fuerte)] bg-transparent text-foreground hover:border-[rgb(247_245_241/0.4)]',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-11 px-4',
        lg: 'h-11 px-6',
        icon: 'size-11',
        'icon-sm': 'size-11',
        'icon-lg': 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
