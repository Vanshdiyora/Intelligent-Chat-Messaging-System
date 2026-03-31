import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { loginUser, clearError } from '../features/auth/authSlice'
import { MessageSquare, Eye, EyeOff } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const dispatch = useDispatch()
  const { loading, error } = useSelector((state) => state.auth)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (username.trim() && password.trim()) {
      dispatch(loginUser({ username: username.trim(), password }))
    }
  }

  return (
    <div className="min-h-screen bg-chat-bg flex items-center justify-center px-4">
      {/* Background pattern */}
      <div className="absolute top-0 left-0 right-0 h-52 bg-chat-accent" />

      <div className="relative w-full max-w-md bg-chat-sidebar rounded-lg shadow-2xl p-8 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-chat-accent rounded-full mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-chat-text">ChatSmart</h1>
          <p className="text-chat-muted text-sm mt-1">Intelligent Messaging System</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm animate-slide-up">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-chat-muted text-sm mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); dispatch(clearError()) }}
              className="w-full px-4 py-2.5 bg-chat-input border border-chat-border rounded-lg text-chat-text placeholder-chat-muted focus:outline-none focus:border-chat-accent transition-colors"
              placeholder="Enter your username"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-chat-muted text-sm mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); dispatch(clearError()) }}
                className="w-full px-4 py-2.5 bg-chat-input border border-chat-border rounded-lg text-chat-text placeholder-chat-muted focus:outline-none focus:border-chat-accent transition-colors pr-10"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-chat-muted hover:text-chat-text"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
            className="w-full py-2.5 bg-chat-accent hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Sign In'}
          </button>
        </form>

        {/* Register link */}
        <p className="text-center text-chat-muted text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-chat-accent hover:underline font-medium">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}
