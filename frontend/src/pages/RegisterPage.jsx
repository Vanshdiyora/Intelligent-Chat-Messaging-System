import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { registerUser, clearError } from '../features/auth/authSlice'
import { MessageSquare, Eye, EyeOff, Sparkles, Zap } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', display_name: '' })
  const [showPassword, setShowPassword] = useState(false)
  const dispatch = useDispatch()
  const { loading, error } = useSelector((state) => state.auth)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    dispatch(clearError())
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (form.username.trim() && form.email.trim() && form.password.trim()) {
      dispatch(registerUser({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        display_name: form.display_name.trim() || form.username.trim(),
      }))
    }
  }

  const isValid = form.username.trim() && form.email.trim() && form.password.length >= 6

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 relative overflow-hidden bg-orbs">
      <div className="absolute top-20 right-20 w-2 h-2 bg-accent-light/30 rounded-full animate-float" />
      <div className="absolute bottom-40 left-32 w-1.5 h-1.5 bg-accent/40 rounded-full animate-float" style={{ animationDelay: '3s' }} />

      <div className="relative w-full max-w-md animate-scale-in">
        <div className="glass-card rounded-2xl p-8 relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-accent-light/20 via-transparent to-accent/20 rounded-2xl blur-xl opacity-60 -z-10 animate-glow-pulse" />

          {/* Logo */}
          <div className="text-center mb-7 animate-slide-down" style={{ animationDelay: '0.1s' }}>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-accent rounded-2xl mb-4 shadow-glow animate-float">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-chat-text tracking-tight">Create Account</h1>
            <p className="text-chat-muted text-sm mt-1 flex items-center justify-center gap-1.5">
              <Sparkles size={12} className="text-accent-light" />
              Join ChatSmart today
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-500/8 border border-red-500/15 rounded-xl text-red-400 text-sm animate-slide-up flex items-start gap-2">
              <Zap size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <label className="block text-chat-muted text-xs font-medium mb-2 uppercase tracking-wider">Username</label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                className="glass-input w-full"
                placeholder="Choose a username"
                autoFocus
              />
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <label className="block text-chat-muted text-xs font-medium mb-2 uppercase tracking-wider">Display Name</label>
              <input
                type="text"
                name="display_name"
                value={form.display_name}
                onChange={handleChange}
                className="glass-input w-full"
                placeholder="Your display name (optional)"
              />
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <label className="block text-chat-muted text-xs font-medium mb-2 uppercase tracking-wider">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="glass-input w-full"
                placeholder="your@email.com"
              />
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.25s' }}>
              <label className="block text-chat-muted text-xs font-medium mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="glass-input w-full pr-11"
                  placeholder="Min 6 characters"
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

            <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <button
                type="submit"
                disabled={loading || !isValid}
                className="btn-accent w-full flex items-center justify-center gap-2"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="flex items-center gap-3 my-6 animate-fade-in" style={{ animationDelay: '0.35s' }}>
            <div className="flex-1 h-px bg-glass-border" />
            <span className="text-xs text-chat-muted">or</span>
            <div className="flex-1 h-px bg-glass-border" />
          </div>

          <p className="text-center text-chat-muted text-sm animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Already have an account?{' '}
            <Link to="/login" className="text-accent-light hover:text-accent font-medium transition-colors duration-200">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
