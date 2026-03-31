import { X, FileText } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function SummaryPanel({ summary, loading, onClose }) {
  return (
    <div className="px-4 py-3 bg-chat-panel/90 border-b border-chat-border animate-slide-up">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-chat-accent/20 rounded-lg flex-shrink-0">
            <FileText size={18} className="text-chat-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-chat-text mb-1">Chat Summary</h4>
            {loading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span className="text-xs text-chat-muted">Generating summary...</span>
              </div>
            ) : (
              <p className="text-sm text-chat-muted leading-relaxed">{summary}</p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-chat-hover text-chat-muted hover:text-chat-text transition-colors flex-shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
