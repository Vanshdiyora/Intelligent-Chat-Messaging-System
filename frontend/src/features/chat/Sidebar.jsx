import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setActiveConversation, fetchConversations, fetchMessages } from './chatSlice'
import { authAPI } from '../../services/api'
import { chatAPI } from '../../services/api'
import { logout } from '../auth/authSlice'
import Avatar from '../../components/Avatar'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Search, Plus, LogOut, X, MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function Sidebar() {
  const dispatch = useDispatch()
  const { conversations, activeConversationId, loading } = useSelector((state) => state.chat)
  const { user } = useSelector((state) => state.auth)
  const [search, setSearch] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  const filteredConversations = conversations.filter((conv) => {
    if (!search) return true
    const name = getConversationName(conv, user)
    return name.toLowerCase().includes(search.toLowerCase())
  })

  function getConversationName(conv, currentUser) {
    if (conv.name) return conv.name
    const other = conv.participants?.find(p => p.id !== currentUser?.id)
    return other?.display_name || other?.username || 'Chat'
  }

  function getOtherParticipant(conv) {
    return conv.participants?.find(p => p.id !== user?.id)
  }

  const handleSelectConversation = (convId) => {
    dispatch(setActiveConversation(convId))
    dispatch(fetchMessages(convId))
  }

  const handleSearchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const res = await authAPI.searchUsers(query)
      setSearchResults(res.data)
    } catch {
      setSearchResults([])
    }
    setSearching(false)
  }

  const handleStartChat = async (userId) => {
    try {
      const res = await chatAPI.createConversation({ participant_ids: [userId] })
      setShowNewChat(false)
      setSearchResults([])
      dispatch(fetchConversations())
      dispatch(setActiveConversation(res.data.id))
      dispatch(fetchMessages(res.data.id))
    } catch (e) {
      console.error('Failed to create conversation:', e)
    }
  }

  return (
    <div className="w-[380px] min-w-[320px] bg-chat-sidebar border-r border-chat-border flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-chat-panel">
        <div className="flex items-center gap-3">
          <Avatar name={user?.display_name || user?.username} size="md" isOnline />
          <span className="font-medium text-chat-text text-sm">{user?.display_name || user?.username}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowNewChat(true)}
            className="p-2 rounded-full hover:bg-chat-hover text-chat-muted hover:text-chat-text transition-colors"
            title="New Chat"
          >
            <Plus size={20} />
          </button>
          <button
            onClick={() => dispatch(logout())}
            className="p-2 rounded-full hover:bg-chat-hover text-chat-muted hover:text-chat-text transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-chat-muted" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search or start new chat"
            className="w-full pl-10 pr-4 py-2 bg-chat-input rounded-lg text-sm text-chat-text placeholder-chat-muted focus:outline-none"
          />
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="absolute inset-0 z-50 bg-chat-sidebar flex flex-col" style={{ width: '380px' }}>
          <div className="flex items-center gap-4 px-4 py-3 bg-chat-panel">
            <button onClick={() => { setShowNewChat(false); setSearchResults([]) }} className="text-chat-muted hover:text-chat-text">
              <X size={20} />
            </button>
            <h2 className="font-medium text-chat-text">New Chat</h2>
          </div>
          <div className="px-3 py-2">
            <input
              type="text"
              placeholder="Search users..."
              onChange={(e) => handleSearchUsers(e.target.value)}
              className="w-full px-4 py-2 bg-chat-input rounded-lg text-sm text-chat-text placeholder-chat-muted focus:outline-none"
              autoFocus
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {searching && <div className="p-4 flex justify-center"><LoadingSpinner size="sm" /></div>}
            {searchResults.map((u) => (
              <button
                key={u.id}
                onClick={() => handleStartChat(u.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-chat-hover transition-colors"
              >
                <Avatar name={u.display_name || u.username} size="md" isOnline={u.is_online} />
                <div className="text-left">
                  <p className="text-sm font-medium text-chat-text">{u.display_name || u.username}</p>
                  <p className="text-xs text-chat-muted">@{u.username}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-chat-muted">
            <MessageSquare size={40} strokeWidth={1} className="mb-3" />
            <p className="text-sm">No conversations yet</p>
            <button
              onClick={() => setShowNewChat(true)}
              className="mt-2 text-chat-accent text-sm hover:underline"
            >
              Start a new chat
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const other = getOtherParticipant(conv)
            const name = getConversationName(conv, user)
            const lastMsg = conv.last_message
            const isActive = conv.id === activeConversationId

            return (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors border-b border-chat-border/30 ${
                  isActive ? 'bg-chat-hover' : 'hover:bg-chat-hover/50'
                }`}
              >
                <Avatar
                  name={name}
                  url={other?.avatar_url}
                  size="lg"
                  isOnline={other?.is_online}
                />
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-chat-text text-[15px] truncate">{name}</span>
                    {lastMsg && (
                      <span className="text-xs text-chat-muted flex-shrink-0">
                        {formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  {lastMsg && (
                    <p className="text-sm text-chat-muted truncate mt-0.5">
                      {lastMsg.sender_id === user?.id ? 'You: ' : ''}
                      {lastMsg.content}
                    </p>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
