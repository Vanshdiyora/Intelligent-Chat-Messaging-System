import { useState, useRef, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { sendMessage } from './chatSlice'
import { fetchSmartReplies, clearSmartReplies, summarizeChat, clearSummary } from '../ai/aiSlice'
import { wsClient } from '../../services/websocket'
import Avatar from '../../components/Avatar'
import LoadingSpinner from '../../components/LoadingSpinner'
import ToxicityBadge from '../../components/ToxicityBadge'
import MessageBubble from './MessageBubble'
import SmartReplies from './SmartReplies'
import SummaryPanel from './SummaryPanel'
import { Send, Sparkles, FileText, MoreVertical, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'

export default function ChatWindow() {
  const dispatch = useDispatch()
  const { activeConversationId, conversations, messages, typingUsers } = useSelector((state) => state.chat)
  const { user } = useSelector((state) => state.auth)
  const { smartReplies, smartReplyLoading, summary, showSummary, summaryLoading } = useSelector((state) => state.ai)

  const [input, setInput] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const conversation = conversations.find(c => c.id === activeConversationId)
  const chatMessages = messages[activeConversationId] || []
  const typingInConv = typingUsers[activeConversationId] || {}
  const typingNames = Object.values(typingInConv)

  const otherParticipant = conversation?.participants?.find(p => p.id !== user?.id)
  const chatName = conversation?.name || otherParticipant?.display_name || otherParticipant?.username || 'Chat'

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages.length])

  // Focus input on conversation change
  useEffect(() => {
    inputRef.current?.focus()
    dispatch(clearSmartReplies())
    dispatch(clearSummary())
  }, [activeConversationId, dispatch])

  // Fetch smart replies when new messages arrive
  useEffect(() => {
    if (chatMessages.length > 0) {
      const lastMessages = chatMessages.slice(-5).map(m => m.content)
      const lastMsg = chatMessages[chatMessages.length - 1]
      if (lastMsg.sender_id !== user?.id) {
        dispatch(fetchSmartReplies(lastMessages))
      }
    }
  }, [chatMessages.length, activeConversationId])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || !activeConversationId) return

    dispatch(sendMessage({ conversationId: activeConversationId, content: text }))
    wsClient.sendMessage(activeConversationId, text)
    setInput('')
    dispatch(clearSmartReplies())
    inputRef.current?.focus()
  }, [input, activeConversationId, dispatch])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
    // Send typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    wsClient.sendTyping(activeConversationId)
    typingTimeoutRef.current = setTimeout(() => {}, 3000)
  }

  const handleSmartReplyClick = (reply) => {
    setInput(reply)
    dispatch(clearSmartReplies())
    inputRef.current?.focus()
  }

  const handleSummarize = () => {
    const allMessages = chatMessages.map(m => `${m.sender_username}: ${m.content}`)
    dispatch(summarizeChat({ messages: allMessages, numSentences: 5 }))
    setShowMenu(false)
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-chat-panel border-b border-chat-border">
        <div className="flex items-center gap-3">
          <Avatar
            name={chatName}
            url={otherParticipant?.avatar_url}
            size="md"
            isOnline={otherParticipant?.is_online}
          />
          <div>
            <h2 className="font-medium text-chat-text text-[15px]">{chatName}</h2>
            <p className="text-xs text-chat-muted">
              {typingNames.length > 0
                ? `${typingNames.join(', ')} typing...`
                : otherParticipant?.is_online
                  ? 'online'
                  : 'offline'}
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-chat-hover text-chat-muted hover:text-chat-text transition-colors"
          >
            <MoreVertical size={20} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-chat-panel border border-chat-border rounded-lg shadow-xl z-50 animate-fade-in">
              <button
                onClick={handleSummarize}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-chat-text hover:bg-chat-hover transition-colors rounded-t-lg"
              >
                <FileText size={16} />
                Summarize Chat
              </button>
              <button
                onClick={() => { dispatch(clearSummary()); setShowMenu(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-chat-text hover:bg-chat-hover transition-colors rounded-b-lg"
              >
                <Sparkles size={16} />
                Clear Summary
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Panel */}
      {showSummary && (
        <SummaryPanel summary={summary} loading={summaryLoading} onClose={() => dispatch(clearSummary())} />
      )}

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto px-16 py-4 bg-chat-bg"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
        onClick={() => setShowMenu(false)}
      >
        {chatMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-chat-muted animate-fade-in">
              <Sparkles size={40} strokeWidth={1} className="mx-auto mb-3" />
              <p className="text-sm">No messages yet. Say hello! 👋</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {chatMessages.map((msg, index) => {
              const isMine = msg.sender_id === user?.id
              const showAvatar = index === 0 || chatMessages[index - 1]?.sender_id !== msg.sender_id

              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isMine={isMine}
                  showAvatar={showAvatar}
                />
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Smart Replies */}
      {smartReplies.length > 0 && (
        <SmartReplies
          replies={smartReplies}
          loading={smartReplyLoading}
          onSelect={handleSmartReplyClick}
        />
      )}

      {/* Typing indicator */}
      {typingNames.length > 0 && (
        <div className="px-16 py-1 bg-chat-bg">
          <span className="text-xs text-chat-accent italic animate-pulse-soft">
            {typingNames.join(', ')} is typing...
          </span>
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 py-3 bg-chat-panel border-t border-chat-border">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message"
              rows={1}
              className="w-full px-4 py-2.5 bg-chat-input rounded-lg text-sm text-chat-text placeholder-chat-muted focus:outline-none resize-none max-h-32 overflow-y-auto"
              style={{ minHeight: '42px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2.5 bg-chat-accent hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-full text-white transition-colors flex-shrink-0"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
