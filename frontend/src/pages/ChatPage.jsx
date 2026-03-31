import { useEffect, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchConversations, setActiveConversation } from '../features/chat/chatSlice'
import { useWebSocket } from '../hooks/useWebSocket'
import Sidebar from '../features/chat/Sidebar'
import ChatWindow from '../features/chat/ChatWindow'
import EmptyState from '../components/EmptyState'
import { MessageSquare, Sparkles } from 'lucide-react'

export default function ChatPage() {
  const dispatch = useDispatch()
  const { activeConversationId } = useSelector((state) => state.chat)
  const prevActiveRef = useRef(activeConversationId)
  useWebSocket()

  useEffect(() => {
    dispatch(fetchConversations())
  }, [dispatch])

  // Push a history entry when a conversation is opened on mobile,
  // so the hardware back button returns to the sidebar instead of leaving the app.
  useEffect(() => {
    if (activeConversationId && !prevActiveRef.current) {
      window.history.pushState({ chatOpen: true }, '')
    }
    prevActiveRef.current = activeConversationId
  }, [activeConversationId])

  const handlePopState = useCallback((e) => {
    if (activeConversationId) {
      dispatch(setActiveConversation(null))
    }
  }, [activeConversationId, dispatch])

  useEffect(() => {
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [handlePopState])

  return (
    <div className="flex h-[100dvh] bg-surface overflow-hidden">
      {/* Sidebar — full width on mobile, fixed width on md+ */}
      <div className={`${activeConversationId ? 'hidden md:flex' : 'flex'} w-full md:w-[360px] md:min-w-[300px] flex-shrink-0`}>
        <Sidebar />
      </div>

      {/* Main Chat Area — hidden on mobile when no conversation selected */}
      <div className={`${activeConversationId ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0 relative`}>
        {activeConversationId ? (
          <ChatWindow />
        ) : (
          <div className="flex-1 flex items-center justify-center relative bg-orbs">
            <EmptyState
              icon={
                <div className="relative">
                  <div className="absolute inset-0 bg-accent/20 rounded-3xl blur-2xl animate-glow-pulse" />
                  <div className="relative bg-surface-200/80 p-6 rounded-3xl border border-glass-border">
                    <MessageSquare size={48} strokeWidth={1} className="text-accent-light" />
                  </div>
                </div>
              }
              title="ChatSmart"
              subtitle={
                <span className="flex items-center gap-2 justify-center text-center px-4">
                  <Sparkles size={14} className="text-accent-light flex-shrink-0" />
                  Send messages with AI-powered smart replies, toxicity detection & chat summaries
                </span>
              }
            />
          </div>
        )}
      </div>
    </div>
  )
}
