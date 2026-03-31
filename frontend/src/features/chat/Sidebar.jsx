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

function parseUTC(dateStr) {
  if (!dateStr) return new Date()
  if (!dateStr.endsWith('Z') && !dateStr.includes('+')) return new Date(dateStr + 'Z')
  return new Date(dateStr)
}

export default function Sidebar() {
  const dispatch = useDispatch()
  const { conversations, activeConversationId, loading, unreadCounts } = useSelector((state) => state.chat)
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
    <div className="w-full bg-surface-50 border-r border-glass-border flex flex-col h-full relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-glass-border bg-surface-100/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Avatar name={user?.display_name || user?.username} size="md" isOnline />
          <div>
            <span className="font-medium text-chat-text text-sm block">{user?.display_name || user?.username}</span>
            <span className="text-[10px] text-accent-light font-medium uppercase tracking-wider">Online</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setShowNewChat(true)}
            className="btn-ghost group"
            title="New Chat"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
          <button
            onClick={() => dispatch(logout())}
            className="btn-ghost group"
            title="Logout"
          >
            <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-chat-muted group-focus-within:text-accent-light transition-colors duration-200" size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-200/60 border border-glass-border rounded-xl text-sm text-chat-text placeholder-chat-muted/50 focus:outline-none focus:border-accent/30 focus:bg-surface-200 transition-all duration-300"
          />
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="absolute inset-0 z-50 bg-surface-50 flex flex-col animate-slide-in-left">
          <div className="flex items-center gap-4 px-4 py-3.5 border-b border-glass-border bg-surface-100/50">
            <button onClick={() => { setShowNewChat(false); setSearchResults([]) }} className="btn-ghost">
              <X size={18} />
            </button>
            <h2 className="font-medium text-chat-text text-sm">New Chat</h2>
          </div>
          <div className="px-3 py-2.5">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-chat-muted group-focus-within:text-accent-light transition-colors" size={15} />
              <input
                type="text"
                placeholder="Search users..."
                onChange={(e) => handleSearchUsers(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-200/60 border border-glass-border rounded-xl text-sm text-chat-text placeholder-chat-muted/50 focus:outline-none focus:border-accent/30 transition-all duration-300"
                autoFocus
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {searching && <div className="p-4 flex justify-center"><LoadingSpinner size="sm" /></div>}
            {searchResults.map((u, i) => (
              <button
                key={u.id}
                onClick={() => handleStartChat(u.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-glass-hover transition-all duration-200 animate-slide-up"
                style={{ animationDelay: `${i * 0.05}s` }}
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
          <div className="flex flex-col items-center justify-center py-16 text-chat-muted animate-fade-in">
            <div className="p-4 bg-surface-200/50 rounded-2xl border border-glass-border mb-4">
              <MessageSquare size={32} strokeWidth={1} className="text-accent-light/50" />
            </div>
            <p className="text-sm mb-1">No conversations yet</p>
            <button
              onClick={() => setShowNewChat(true)}
              className="text-accent-light text-sm hover:text-accent transition-colors duration-200"
            >
              Start a new chat
            </button>
          </div>
        ) : (
          filteredConversations.map((conv, i) => {
            const other = getOtherParticipant(conv)
            const name = getConversationName(conv, user)
            const lastMsg = conv.last_message
            const isActive = conv.id === activeConversationId
            const unreadCount = unreadCounts[conv.id] || 0

            return (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all duration-200 relative group ${
                  isActive
                    ? 'bg-accent/8'
                    : 'hover:bg-glass-hover'
                }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-accent rounded-r-full" />
                )}
                <Avatar
                  name={name}
                  url={other?.avatar_url}
                  size="lg"
                  isOnline={other?.is_online}
                />
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium text-[14px] truncate ${isActive ? 'text-accent-light' : unreadCount > 0 ? 'text-white' : 'text-chat-text'}`}>{name}</span>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {lastMsg && (
                        <span className="text-[11px] text-chat-muted">
                          {formatDistanceToNow(parseUTC(lastMsg.created_at), { addSuffix: false })}
                        </span>
                      )}
                      {unreadCount > 0 && (
                        <span className="min-w-[20px] h-5 flex items-center justify-center px-1.5 text-[11px] font-semibold text-white bg-accent rounded-full">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  {lastMsg && (
                    <p className={`text-[13px] truncate mt-0.5 ${unreadCount > 0 ? 'text-chat-text font-medium' : 'text-chat-muted'}`}>
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
