import { X, FileText } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function SummaryPanel({ summary, loading, onClose }) {
  return (
    <div className="px-4 py-3 bg-surface-100/70 backdrop-blur-sm border-b border-glass-border animate-slide-down">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2.5 bg-accent/15 rounded-xl flex-shrink-0 border border-accent/20">
            <FileText size={18} className="text-accent-light" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-chat-text mb-1">Chat Summary</h4>
            {loading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span className="text-xs text-chat-muted animate-pulse">Generating summary...</span>
              </div>
            ) : (
              <p className="text-sm text-chat-muted leading-relaxed">{summary}</p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-glass-hover text-chat-muted hover:text-chat-text transition-all duration-200 flex-shrink-0"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
