type IconName =
  | 'moon' | 'sun' | 'star' | 'sparkle' | 'check' | 'chevron' | 'arrow' | 'arrowL'
  | 'globe' | 'plus' | 'download' | 'play' | 'lock' | 'clock' | 'mail' | 'book'
  | 'heart' | 'gear' | 'user' | 'bolt' | 'paw' | 'wand' | 'rocket' | 'x'

interface IconProps {
  name: IconName
  className?: string
  stroke?: number
}

export function Icon({ name, className, stroke }: IconProps) {
  const sw = stroke ?? 1.8
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const paths: Record<IconName, React.ReactNode> = {
    moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" {...common} />,
    sun: <g {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></g>,
    star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" {...common} />,
    sparkle: <path d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" {...common} />,
    check: <path d="M5 13l4 4L19 7" {...common} />,
    chevron: <path d="M6 9l6 6 6-6" {...common} />,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" {...common} />,
    arrowL: <path d="M19 12H5M11 6l-6 6 6 6" {...common} />,
    globe: <g {...common}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" /></g>,
    plus: <path d="M12 5v14M5 12h14" {...common} />,
    download: <path d="M12 3v12M7 10l5 5 5-5M5 21h14" {...common} />,
    play: <path d="M7 5l12 7-12 7V5Z" {...common} />,
    lock: <g {...common}><rect x="4.5" y="10" width="15" height="10" rx="2.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></g>,
    clock: <g {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></g>,
    mail: <g {...common}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M4 7l8 6 8-6" /></g>,
    book: <path d="M4 5a2 2 0 0 1 2-2h6v17H6a2 2 0 0 0-2 2V5ZM20 5a2 2 0 0 0-2-2h-6v17h6a2 2 0 0 1 2 2V5Z" {...common} />,
    heart: <path d="M12 20s-7-4.4-9.2-8.4A4.7 4.7 0 0 1 12 6a4.7 4.7 0 0 1 9.2 5.6C19 15.6 12 20 12 20Z" {...common} />,
    gear: <g {...common}><circle cx="12" cy="12" r="3.2" /><path d="M19.4 12a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.3 7.3 0 0 0-2-1.2l-.4-2.6h-3.9l-.4 2.6a7.3 7.3 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.3 7.3 0 0 0 2 1.2l.4 2.6h3.9l.4-2.6a7.3 7.3 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z" /></g>,
    user: <g {...common}><circle cx="12" cy="8" r="4" /><path d="M5 21a7 7 0 0 1 14 0" /></g>,
    bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8Z" {...common} />,
    paw: <g {...common}><circle cx="7" cy="9" r="1.6" /><circle cx="12" cy="7" r="1.6" /><circle cx="17" cy="9" r="1.6" /><path d="M12 12c-3 0-5 2.4-5 4.6 0 1.6 1.4 2.4 3 1.8 1.3-.5 2.7-.5 4 0 1.6.6 3-.2 3-1.8C17 14.4 15 12 12 12Z" /></g>,
    wand: <path d="M5 19l9-9M14.5 5.5l1 1M19 9l-.7.7M9 4.5L9.7 5M5.5 8.5l.7.5" {...common} />,
    rocket: <g {...common}><path d="M12 3c3 1.5 5 4.8 5 9l-3 3h-4l-3-3c0-4.2 2-7.5 5-9Z" /><circle cx="12" cy="9" r="1.6" /><path d="M9 17l-2 4M15 17l2 4" /></g>,
    x: <path d="M18 6L6 18M6 6l12 12" {...common} />,
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {paths[name]}
    </svg>
  )
}
