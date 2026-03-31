import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { chatAPI } from '../../services/api'

export const fetchConversations = createAsyncThunk('chat/fetchConversations', async (_, { rejectWithValue }) => {
  try {
    const response = await chatAPI.getConversations()
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to fetch conversations')
  }
})

export const fetchMessages = createAsyncThunk('chat/fetchMessages', async (conversationId, { rejectWithValue }) => {
  try {
    const response = await chatAPI.getMessages(conversationId)
    return { conversationId, messages: response.data }
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to fetch messages')
  }
})

export const sendMessage = createAsyncThunk('chat/sendMessage', async ({ conversationId, content }, { rejectWithValue }) => {
  try {
    const response = await chatAPI.sendMessage(conversationId, { content })
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to send message')
  }
})

export const createConversation = createAsyncThunk('chat/createConversation', async (data, { rejectWithValue }) => {
  try {
    const response = await chatAPI.createConversation(data)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to create conversation')
  }
})

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    conversations: [],
    activeConversationId: null,
    messages: {},  // { conversationId: [messages] }
    typingUsers: {},  // { conversationId: { userId: username } }
    onlineUsers: {},  // { userId: boolean }
    loading: false,
    messagesLoading: false,
    error: null,
  },
  reducers: {
    setActiveConversation: (state, action) => {
      state.activeConversationId = action.payload
    },
    addMessage: (state, action) => {
      const msg = action.payload
      const convId = msg.conversation_id
      if (!state.messages[convId]) {
        state.messages[convId] = []
      }
      // Avoid duplicates
      const exists = state.messages[convId].some(m => m.id === msg.id)
      if (!exists) {
        state.messages[convId].push(msg)
      }
      // Update conversation's last message
      const conv = state.conversations.find(c => c.id === convId)
      if (conv) {
        conv.last_message = msg
        conv.updated_at = msg.created_at
      }
    },
    setUserTyping: (state, action) => {
      const { conversationId, userId, username } = action.payload
      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = {}
      }
      state.typingUsers[conversationId][userId] = username
    },
    clearUserTyping: (state, action) => {
      const { conversationId, userId } = action.payload
      if (state.typingUsers[conversationId]) {
        delete state.typingUsers[conversationId][userId]
      }
    },
    setUserOnline: (state, action) => {
      const { userId, isOnline } = action.payload
      state.onlineUsers[userId] = isOnline
      // Update in conversations participants
      state.conversations.forEach(conv => {
        conv.participants?.forEach(p => {
          if (p.id === userId) {
            p.is_online = isOnline
          }
        })
      })
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false
        state.conversations = action.payload
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchMessages.pending, (state) => {
        state.messagesLoading = true
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesLoading = false
        state.messages[action.payload.conversationId] = action.payload.messages
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.messagesLoading = false
        state.error = action.payload
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const msg = action.payload
        const convId = msg.conversation_id
        if (!state.messages[convId]) {
          state.messages[convId] = []
        }
        const exists = state.messages[convId].some(m => m.id === msg.id)
        if (!exists) {
          state.messages[convId].push(msg)
        }
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        // Refetch conversations will be triggered separately
      })
  },
})

export const {
  setActiveConversation,
  addMessage,
  setUserTyping,
  clearUserTyping,
  setUserOnline,
} = chatSlice.actions

export default chatSlice.reducer
