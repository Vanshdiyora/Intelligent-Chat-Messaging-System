import { Sparkles } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function SmartReplies({ replies, loading, onSelect }) {
  if (loading) {
    return (
      <div className="px-16 py-2 bg-chat-bg border-t border-chat-border/30">
        <div className="flex items-center gap-2 text-chat-muted text-xs">
          <LoadingSpinner size="sm" />
          <span>Generating smart replies...</span>
        </div>
      </div>
    )
  }

  if (!replies || replies.length === 0) return null

  return (
    <div className="px-16 py-2 bg-chat-bg border-t border-chat-border/30 animate-slide-up">
      <div className="flex items-center gap-2 mb-1.5">
        <Sparkles size={12} className="text-chat-accent" />
        <span className="text-xs text-chat-muted">Smart Replies</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {replies.map((reply, index) => (
          <button
            key={index}
            onClick={() => onSelect(reply)}
            className="px-3 py-1.5 bg-chat-input hover:bg-chat-panel border border-chat-border rounded-full text-sm text-chat-text transition-all hover:border-chat-accent hover:scale-[1.02] active:scale-95"
          >
            {reply}
          </button>
        ))}
      </div>
    </div>
  )
}
