import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchConversations } from '../features/chat/chatSlice'
import { useWebSocket } from '../hooks/useWebSocket'
import Sidebar from '../features/chat/Sidebar'
import ChatWindow from '../features/chat/ChatWindow'
import EmptyState from '../components/EmptyState'
import { MessageSquare, Sparkles } from 'lucide-react'

export default function ChatPage() {
  const dispatch = useDispatch()
  const { activeConversationId } = useSelector((state) => state.chat)
  useWebSocket()

  useEffect(() => {
    dispatch(fetchConversations())
  }, [dispatch])

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Sidebar with glass effect */}
      <Sidebar />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
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
                <span className="flex items-center gap-2 justify-center">
                  <Sparkles size={14} className="text-accent-light" />
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
