import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium',
    'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'focus-visible:ring-purple disabled:pointer-events-none disabled:opacity-50',
    'cursor-pointer select-none',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-purple text-white shadow-lg',
          'hover:bg-purple-light hover:shadow-purple/40 hover:shadow-xl',
          'active:scale-[0.97]',
        ],
        secondary: [
          'bg-navy-mid text-soft-white border border-purple/40',
          'hover:border-purple hover:bg-navy-light',
          'active:scale-[0.97]',
        ],
        outline: [
          'border border-purple/60 text-soft-white bg-transparent',
          'hover:bg-purple/10 hover:border-purple',
          'active:scale-[0.97]',
        ],
        ghost: [
          'text-muted hover:text-soft-white hover:bg-white/5',
          'active:scale-[0.97]',
        ],
        destructive: [
          'bg-red-600 text-white shadow-sm',
          'hover:bg-red-500',
          'active:scale-[0.97]',
        ],
        gold: [
          'bg-gold text-navy font-semibold shadow-lg shadow-gold/30',
          'hover:bg-gold-light hover:shadow-gold/50 hover:shadow-xl',
          'active:scale-[0.97]',
        ],
      },
      size: {
        sm:      'h-8  px-4  text-xs',
        default: 'h-10 px-6  text-sm',
        lg:      'h-12 px-8  text-base',
        xl:      'h-14 px-10 text-lg',
        icon:    'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
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
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
