import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { wsClient } from '../services/websocket'
import { addMessage, setUserTyping, clearUserTyping, setUserOnline } from '../features/chat/chatSlice'

export function useWebSocket() {
  const dispatch = useDispatch()
  const { token } = useSelector((state) => state.auth)
  const typingTimeoutRef = useRef({})

  useEffect(() => {
    if (!token) return

    wsClient.connect(token)

    const unsubMessage = wsClient.on('new_message', (data) => {
      dispatch(addMessage(data.message))
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
      unsubMessage()
      unsubTyping()
      unsubStatus()
      wsClient.disconnect()
    }
  }, [token, dispatch])

  return wsClient
}
