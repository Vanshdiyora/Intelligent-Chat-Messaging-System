import { format } from 'date-fns'
import ToxicityBadge from '../../components/ToxicityBadge'
import Avatar from '../../components/Avatar'

function parseUTC(dateStr) {
  if (!dateStr) return new Date()
  // Ensure the backend UTC timestamp is parsed as UTC
  if (!dateStr.endsWith('Z') && !dateStr.includes('+')) return new Date(dateStr + 'Z')
  return new Date(dateStr)
}

export default function MessageBubble({ message, isMine, showAvatar }) {
  const time = format(parseUTC(message.created_at), 'HH:mm')

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-slide-up`}>
      <div className={`flex gap-2 max-w-[65%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className="flex-shrink-0 w-8">
          {showAvatar && !isMine && (
            <Avatar name={message.sender_username} size="sm" />
          )}
        </div>

        {/* Bubble */}
        <div
          className={`relative px-3.5 py-2.5 shadow-sm transition-all duration-200 ${
            isMine
              ? 'bg-gradient-to-br from-accent to-purple-600 bubble-sent text-white rounded-2xl rounded-br-md'
              : 'bg-surface-200/80 border border-glass-border bubble-received text-chat-text rounded-2xl rounded-bl-md'
          }`}
        >
          {/* Sender name for group chats */}
          {showAvatar && !isMine && (
            <p className="text-xs font-medium text-accent-light mb-0.5">
              {message.sender_username}
            </p>
          )}

          {/* Toxicity warning */}
          {message.is_toxic && (
            <div className="mb-1">
              <ToxicityBadge isToxic={message.is_toxic} score={message.toxicity_score} />
            </div>
          )}

          {/* Message content */}
          <p className="text-[14.2px] leading-[19px] break-words whitespace-pre-wrap">
            {message.content}
          </p>

          {/* Timestamp */}
          <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-[11px] ${isMine ? 'text-white/50' : 'text-chat-muted'}`}>
              {time}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
