import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors select-none',
  {
    variants: {
      variant: {
        default:
          'border-purple/40 bg-purple/20 text-purple-light hover:bg-purple/30',
        secondary:
          'border-navy-mid bg-navy-mid text-muted hover:bg-navy-mid/80',
        outline:
          'border-purple/40 text-muted bg-transparent',
        success:
          'border-emerald-500/40 bg-emerald-500/15 text-emerald-400',
        gold:
          'border-gold/40 bg-gold/15 text-gold',
        destructive:
          'border-red-500/40 bg-red-500/15 text-red-400',
      },
    },
    defaultVariants: {
      variant: 'default',
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
