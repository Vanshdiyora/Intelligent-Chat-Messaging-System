const API_BASE = import.meta.env.VITE_API_URL || '/api'

function getHeaders() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

async function request(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: getHeaders(),
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))
    const err = new Error(error.detail || 'Request failed')
    err.response = { data: error, status: response.status }
    throw err
  }

  return { data: await response.json(), status: response.status }
}

export const authAPI = {
  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  register: (userData) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  me: () => request('/auth/me'),
  searchUsers: (search) => request(`/auth/users?search=${encodeURIComponent(search)}`),
}

export const chatAPI = {
  getConversations: () => request('/chat/conversations'),
  getMessages: (conversationId, limit = 50) => request(`/chat/conversations/${conversationId}/messages?limit=${limit}`),
  sendMessage: (conversationId, data) => request(`/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  createConversation: (data) => request('/chat/conversations', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
}

export const aiAPI = {
  getSmartReplies: (messages) => request('/ai/smart-reply', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  }),
  checkToxicity: (text) => request('/ai/toxicity', {
    method: 'POST',
    body: JSON.stringify({ text }),
  }),
  summarize: (messages, numSentences = 5) => request('/ai/summarize', {
    method: 'POST',
    body: JSON.stringify({ messages, num_sentences: numSentences }),
  }),
}
