import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { wsClient } from '../services/websocket'
import { addMessage, addConversation, setUserTyping, clearUserTyping, setUserOnline, fetchConversations } from '../features/chat/chatSlice'

export function useWebSocket() {
  const dispatch = useDispatch()
  const { token } = useSelector((state) => state.auth)
  const conversationsRef = useRef([])
  const typingTimeoutRef = useRef({})

  const { conversations } = useSelector((state) => state.chat)
  useEffect(() => {
    conversationsRef.current = conversations
  }, [conversations])

  useEffect(() => {
    if (!token) return

    wsClient.connect(token)

    const unsubNewConv = wsClient.on('new_conversation', (data) => {
      dispatch(addConversation(data.conversation))
    })

    const unsubMessage = wsClient.on('new_message', (data) => {
      const msg = data.message
      dispatch(addMessage(msg))
      // If message is for a conversation we don't have yet, fetch conversations
      const knownConv = conversationsRef.current.some(c => c.id === msg.conversation_id)
      if (!knownConv) {
        dispatch(fetchConversations())
      }
    })

    const unsubTyping = wsClient.on('typing', (data) => {
      const { conversation_id, user_id, username } = data
      dispatch(setUserTyping({ conversationId: conversation_id, userId: user_id, username }))

      // Clear typing after 3 seconds
      if (typingTimeoutRef.current[`${conversation_id}-${user_id}`]) {
        clearTimeout(typingTimeoutRef.current[`${conversation_id}-${user_id}`])
      }
      typingTimeoutRef.current[`${conversation_id}-${user_id}`] = setTimeout(() => {
        dispatch(clearUserTyping({ conversationId: conversation_id, userId: user_id }))
      }, 3000)
    })

    const unsubStatus = wsClient.on('status', (data) => {
      dispatch(setUserOnline({ userId: data.user_id, isOnline: data.is_online }))
    })

    return () => {
      unsubNewConv()
      unsubMessage()
      unsubTyping()
      unsubStatus()
      wsClient.disconnect()
    }
  }, [token, dispatch])

  return wsClient
}
