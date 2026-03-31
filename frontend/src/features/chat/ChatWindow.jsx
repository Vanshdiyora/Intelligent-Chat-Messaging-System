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
    <div className="flex-1 flex flex-col h-full bg-surface animate-fade-in">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-surface-100/60 backdrop-blur-sm border-b border-glass-border relative z-20">
        <div className="flex items-center gap-3">
          <Avatar
            name={chatName}
            url={otherParticipant?.avatar_url}
            size="md"
            isOnline={otherParticipant?.is_online}
          />
          <div>
            <h2 className="font-medium text-chat-text text-[14px]">{chatName}</h2>
            <p className="text-[11px]">
              {typingNames.length > 0
                ? <span className="text-accent-light flex items-center gap-1">
                    <span className="flex gap-0.5">
                      <span className="w-1 h-1 bg-accent-light rounded-full animate-typing-dot" />
                      <span className="w-1 h-1 bg-accent-light rounded-full animate-typing-dot" style={{ animationDelay: '0.2s' }} />
                      <span className="w-1 h-1 bg-accent-light rounded-full animate-typing-dot" style={{ animationDelay: '0.4s' }} />
                    </span>
                    {typingNames.join(', ')} typing
                  </span>
                : <span className={otherParticipant?.is_online ? 'text-emerald-400' : 'text-chat-muted'}>
                    {otherParticipant?.is_online ? 'online' : 'offline'}
                  </span>}
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="btn-ghost"
          >
            <MoreVertical size={18} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-surface-200 border border-glass-border rounded-xl shadow-2xl z-50 animate-scale-in overflow-hidden">
              <button
                onClick={handleSummarize}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-chat-text hover:bg-glass-hover transition-all duration-200"
              >
                <FileText size={15} className="text-accent-light" />
                Summarize Chat
              </button>
              <div className="h-px bg-glass-border" />
              <button
                onClick={() => { dispatch(clearSummary()); setShowMenu(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-chat-text hover:bg-glass-hover transition-all duration-200"
              >
                <Sparkles size={15} className="text-accent-light" />
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
        className="flex-1 overflow-y-auto px-6 md:px-16 py-5 bg-surface relative"
        onClick={() => setShowMenu(false)}
      >
        {/* Subtle background grid */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(124,58,237,0.3) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />

        <div className="relative">
          {chatMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
              <div className="text-center text-chat-muted animate-fade-in">
                <div className="inline-flex p-4 bg-surface-200/50 rounded-2xl border border-glass-border mb-4">
                  <Sparkles size={32} strokeWidth={1} className="text-accent-light/50" />
                </div>
                <p className="text-sm">No messages yet. Say hello!</p>
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
        <div className="px-6 md:px-16 py-1.5 bg-surface">
          <span className="text-xs text-accent-light/70 italic flex items-center gap-1.5">
            <span className="flex gap-0.5">
              <span className="w-1 h-1 bg-accent-light rounded-full animate-typing-dot" />
              <span className="w-1 h-1 bg-accent-light rounded-full animate-typing-dot" style={{ animationDelay: '0.2s' }} />
              <span className="w-1 h-1 bg-accent-light rounded-full animate-typing-dot" style={{ animationDelay: '0.4s' }} />
            </span>
            {typingNames.join(', ')} is typing
          </span>
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 py-3 bg-surface-100/60 backdrop-blur-sm border-t border-glass-border">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-3 bg-surface-200/80 border border-glass-border rounded-xl text-sm text-chat-text placeholder-chat-muted/50 focus:outline-none focus:border-accent/30 focus:ring-2 focus:ring-accent/5 transition-all duration-300 resize-none max-h-32 overflow-y-auto"
              style={{ minHeight: '46px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="h-[46px] w-[46px] flex items-center justify-center bg-gradient-accent disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-white transition-all duration-300 flex-shrink-0 hover:shadow-glow hover:scale-105 active:scale-95 disabled:hover:shadow-none disabled:hover:scale-100"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
