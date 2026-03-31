export default function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 animate-fade-in">
      <div className="text-accent-light/40 mb-5 p-5 bg-surface-200/40 rounded-2xl border border-glass-border">
        {icon}
      </div>
      <h3 className="text-xl font-medium text-chat-text mb-2">{title}</h3>
      {subtitle && (
        <p className="text-chat-muted text-sm max-w-md leading-relaxed">{subtitle}</p>
      )}
    </div>
  )
}
