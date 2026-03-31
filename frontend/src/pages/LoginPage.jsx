import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { loginUser, clearError } from '../features/auth/authSlice'
import { MessageSquare, Eye, EyeOff, Sparkles, Zap } from 'lucide-react'
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
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 relative overflow-hidden bg-orbs">
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-20 w-2 h-2 bg-accent-light/30 rounded-full animate-float" />
      <div className="absolute top-40 right-32 w-1.5 h-1.5 bg-accent/40 rounded-full animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-32 left-1/4 w-1 h-1 bg-accent-light/20 rounded-full animate-float" style={{ animationDelay: '4s' }} />

      <div className="relative w-full max-w-md animate-scale-in">
        {/* Card */}
        <div className="glass-card rounded-2xl p-8 relative">
          {/* Glow effect behind card */}
          <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 via-transparent to-accent-light/20 rounded-2xl blur-xl opacity-60 -z-10 animate-glow-pulse" />

          {/* Logo */}
          <div className="text-center mb-8 animate-slide-down" style={{ animationDelay: '0.1s' }}>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-accent rounded-2xl mb-4 shadow-glow animate-float">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-chat-text tracking-tight">ChatSmart</h1>
            <p className="text-chat-muted text-sm mt-1 flex items-center justify-center gap-1.5">
              <Sparkles size={12} className="text-accent-light" />
              AI-Powered Messaging
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 bg-red-500/8 border border-red-500/15 rounded-xl text-red-400 text-sm animate-slide-up flex items-start gap-2">
              <Zap size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <label className="block text-chat-muted text-xs font-medium mb-2 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); dispatch(clearError()) }}
                className="glass-input w-full"
                placeholder="Enter your username"
                autoFocus
              />
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <label className="block text-chat-muted text-xs font-medium mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); dispatch(clearError()) }}
                  className="glass-input w-full pr-11"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-chat-muted hover:text-accent-light transition-colors duration-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.25s' }}>
              <button
                type="submit"
                disabled={loading || !username.trim() || !password.trim()}
                className="btn-accent w-full flex items-center justify-center gap-2"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex-1 h-px bg-glass-border" />
            <span className="text-xs text-chat-muted">or</span>
            <div className="flex-1 h-px bg-glass-border" />
          </div>

          {/* Register link */}
          <p className="text-center text-chat-muted text-sm animate-fade-in" style={{ animationDelay: '0.35s' }}>
            Don't have an account?{' '}
            <Link to="/register" className="text-accent-light hover:text-accent font-medium transition-colors duration-200">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
