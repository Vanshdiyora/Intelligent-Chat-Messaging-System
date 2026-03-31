export default function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 animate-fade-in">
      <div className="text-chat-muted mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-medium text-chat-text mb-2">{title}</h3>
      {subtitle && (
        <p className="text-chat-muted text-sm max-w-md">{subtitle}</p>
      )}
    </div>
  )
}
