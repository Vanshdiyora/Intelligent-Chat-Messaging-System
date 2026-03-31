import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { aiAPI } from '../../services/api'

export const fetchSmartReplies = createAsyncThunk('ai/smartReply', async (messages, { rejectWithValue }) => {
  try {
    const response = await aiAPI.getSmartReplies(messages)
    return response.data.suggestions
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to get smart replies')
  }
})

export const checkToxicity = createAsyncThunk('ai/toxicity', async (text, { rejectWithValue }) => {
  try {
    const response = await aiAPI.checkToxicity(text)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Toxicity check failed')
  }
})

export const summarizeChat = createAsyncThunk('ai/summarize', async ({ messages, numSentences }, { rejectWithValue }) => {
  try {
    const response = await aiAPI.summarize(messages, numSentences)
    return response.data.summary
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Summarization failed')
  }
})

const aiSlice = createSlice({
  name: 'ai',
  initialState: {
    smartReplies: [],
    smartReplyLoading: false,
    toxicityResult: null,
    toxicityLoading: false,
    summary: null,
    summaryLoading: false,
    showSummary: false,
  },
  reducers: {
    clearSmartReplies: (state) => {
      state.smartReplies = []
    },
    clearToxicity: (state) => {
      state.toxicityResult = null
    },
    clearSummary: (state) => {
      state.summary = null
      state.showSummary = false
    },
    toggleSummary: (state) => {
      state.showSummary = !state.showSummary
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSmartReplies.pending, (state) => {
        state.smartReplyLoading = true
      })
      .addCase(fetchSmartReplies.fulfilled, (state, action) => {
        state.smartReplyLoading = false
        state.smartReplies = action.payload
      })
      .addCase(fetchSmartReplies.rejected, (state) => {
        state.smartReplyLoading = false
        state.smartReplies = []
      })
      .addCase(checkToxicity.pending, (state) => {
        state.toxicityLoading = true
      })
      .addCase(checkToxicity.fulfilled, (state, action) => {
        state.toxicityLoading = false
        state.toxicityResult = action.payload
      })
      .addCase(checkToxicity.rejected, (state) => {
        state.toxicityLoading = false
      })
      .addCase(summarizeChat.pending, (state) => {
        state.summaryLoading = true
      })
      .addCase(summarizeChat.fulfilled, (state, action) => {
        state.summaryLoading = false
        state.summary = action.payload
        state.showSummary = true
      })
      .addCase(summarizeChat.rejected, (state) => {
        state.summaryLoading = false
      })
  },
})

export const { clearSmartReplies, clearToxicity, clearSummary, toggleSummary } = aiSlice.actions
export default aiSlice.reducer
