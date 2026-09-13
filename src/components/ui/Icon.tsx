type IconProps = {
  name: IconName
  size?: number
  strokeWidth?: number
}

export type IconName =
  | 'plus'
  | 'search'
  | 'close'
  | 'trash'
  | 'pin'
  | 'link'
  | 'instagram'
  | 'chevron'
  | 'chevron-right'
  | 'layers'
  | 'sync'
  | 'panel'
  | 'calendar'
  | 'check'
  | 'spinner'

const paths: Record<IconName, string> = {
  plus: 'M12 5v14M5 12h14',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3',
  close: 'M6 6l12 12M18 6L6 18',
  trash: 'M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3',
  pin: 'M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  link: 'M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1',
  instagram:
    'M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M17 7h.01',
  chevron: 'M6 9l6 6 6-6',
  'chevron-right': 'M9 6l6 6-6 6',
  layers: 'M12 3l9 5-9 5-9-5 9-5Z M3 13l9 5 9-5 M3 17l9 5 9-5',
  sync: 'M4 12a8 8 0 0 1 13.7-5.7L20 8M20 12a8 8 0 0 1-13.7 5.7L4 16 M20 4v4h-4 M4 20v-4h4',
  panel: 'M4 5h16v14H4z M9 5v14',
  calendar: 'M4 6h16v14H4z M4 10h16 M8 3v4M16 3v4',
  check: 'M5 13l4 4L19 7',
  spinner: 'M12 3a9 9 0 1 0 9 9',
}

export function Icon({ name, size = 18, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}
