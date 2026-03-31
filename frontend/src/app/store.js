import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import chatReducer from '../features/chat/chatSlice'
import aiReducer from '../features/ai/aiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    ai: aiReducer,
  },
})
