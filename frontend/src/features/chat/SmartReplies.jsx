import { Sparkles } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function SmartReplies({ replies, loading, onSelect }) {
  if (loading) {
    return (
      <div className="px-6 md:px-16 py-2.5 bg-surface border-t border-glass-border/30">
        <div className="flex items-center gap-2 text-chat-muted text-xs">
          <LoadingSpinner size="sm" />
          <span className="animate-pulse">Generating smart replies...</span>
        </div>
      </div>
    )
  }

  if (!replies || replies.length === 0) return null

  return (
    <div className="px-6 md:px-16 py-2.5 bg-surface border-t border-glass-border/30 animate-slide-up">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={12} className="text-accent-light" />
        <span className="text-xs text-chat-muted">Smart Replies</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {replies.map((reply, index) => (
          <button
            key={index}
            onClick={() => onSelect(reply)}
            className="px-3.5 py-1.5 bg-surface-200/60 hover:bg-accent/10 border border-glass-border hover:border-accent/40 rounded-full text-sm text-chat-text transition-all duration-300 hover:scale-[1.03] active:scale-95 hover:shadow-[0_0_12px_rgba(124,58,237,0.15)]"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {reply}
          </button>
        ))}
      </div>
    </div>
  )
}
