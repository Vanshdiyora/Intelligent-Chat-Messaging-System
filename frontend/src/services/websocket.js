class WebSocketClient {
  constructor() {
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 2000
    this.handlers = {}
  }

  connect(token) {
    if (this.ws?.readyState === WebSocket.OPEN) return

    const wsBase = import.meta.env.VITE_WS_URL
    if (wsBase) {
      this.ws = new WebSocket(`${wsBase}/ws/${token}`)
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      this.ws = new WebSocket(`${protocol}//${host}/ws/${token}`)
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0
      this._emit('connected')
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this._emit(data.type, data)
      } catch (e) {
        console.error('WebSocket message parse error:', e)
      }
    }

    this.ws.onclose = (event) => {
      this._emit('disconnected')
      if (event.code !== 4001 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        setTimeout(() => this.connect(token), this.reconnectDelay * this.reconnectAttempts)
      }
    }

    this.ws.onerror = () => {
      this._emit('error')
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.handlers = {}
  }

  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  sendMessage(conversationId, content) {
    this.send({
      type: 'message',
      conversation_id: conversationId,
      content,
      message_type: 'text',
    })
  }

  sendTyping(conversationId) {
    this.send({
      type: 'typing',
      conversation_id: conversationId,
    })
  }

  on(event, handler) {
    if (!this.handlers[event]) {
      this.handlers[event] = []
    }
    this.handlers[event].push(handler)
    return () => {
      this.handlers[event] = this.handlers[event].filter(h => h !== handler)
    }
  }

  _emit(event, data) {
    const handlers = this.handlers[event] || []
    handlers.forEach(handler => handler(data))
  }
}

export const wsClient = new WebSocketClient()
