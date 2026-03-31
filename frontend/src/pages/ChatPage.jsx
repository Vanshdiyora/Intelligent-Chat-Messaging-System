import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchConversations } from '../features/chat/chatSlice'
import { useWebSocket } from '../hooks/useWebSocket'
import Sidebar from '../features/chat/Sidebar'
import ChatWindow from '../features/chat/ChatWindow'
import EmptyState from '../components/EmptyState'
import { MessageSquare } from 'lucide-react'

export default function ChatPage() {
  const dispatch = useDispatch()
  const { activeConversationId } = useSelector((state) => state.chat)
  useWebSocket()

  useEffect(() => {
    dispatch(fetchConversations())
  }, [dispatch])

  return (
    <div className="flex h-screen bg-chat-bg">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversationId ? (
          <ChatWindow />
        ) : (
          <EmptyState
            icon={<MessageSquare size={72} strokeWidth={1} />}
            title="ChatSmart Web"
            subtitle="Send and receive messages with AI-powered features. Select a conversation to get started."
          />
        )}
      </div>
    </div>
  )
}
