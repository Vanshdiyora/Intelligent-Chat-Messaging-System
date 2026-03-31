export default function Avatar({ name, url, size = 'md', isOnline = false }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  }

  const dotSizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
  }

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const colors = [
    'bg-violet-600', 'bg-indigo-600', 'bg-purple-600', 'bg-fuchsia-600',
    'bg-blue-600', 'bg-sky-600', 'bg-rose-600', 'bg-pink-600',
  ]
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0

  return (
    <div className="relative inline-flex flex-shrink-0">
      {url ? (
        <img
          src={url}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-glass-border`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-white/10`}
        >
          {initials}
        </div>
      )}
      {isOnline && (
        <span
          className={`absolute bottom-0 right-0 ${dotSizeClasses[size]} bg-emerald-400 rounded-full border-2 border-surface-50`}
        />
      )}
    </div>
  )
}
