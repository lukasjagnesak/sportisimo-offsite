import type { ReactNode, ElementType } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  as?: ElementType
  [key: string]: unknown
}

export function GlassCard({ children, className = '', as: Tag = 'div', ...rest }: GlassCardProps) {
  return (
    <Tag className={`glass rounded-3xl ${className}`} {...rest}>
      {children}
    </Tag>
  )
}
