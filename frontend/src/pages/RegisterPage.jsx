import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { registerUser, clearError } from '../features/auth/authSlice'
import { MessageSquare, Eye, EyeOff } from 'lucide-react'
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
    <div className="min-h-screen bg-chat-bg flex items-center justify-center px-4">
      <div className="absolute top-0 left-0 right-0 h-52 bg-chat-accent" />

      <div className="relative w-full max-w-md bg-chat-sidebar rounded-lg shadow-2xl p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-chat-accent rounded-full mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-chat-text">Create Account</h1>
          <p className="text-chat-muted text-sm mt-1">Join ChatSmart today</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm animate-slide-up">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-chat-muted text-sm mb-1.5">Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-chat-input border border-chat-border rounded-lg text-chat-text placeholder-chat-muted focus:outline-none focus:border-chat-accent transition-colors"
              placeholder="Choose a username"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-chat-muted text-sm mb-1.5">Display Name</label>
            <input
              type="text"
              name="display_name"
              value={form.display_name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-chat-input border border-chat-border rounded-lg text-chat-text placeholder-chat-muted focus:outline-none focus:border-chat-accent transition-colors"
              placeholder="Your display name (optional)"
            />
          </div>

          <div>
            <label className="block text-chat-muted text-sm mb-1.5">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-chat-input border border-chat-border rounded-lg text-chat-text placeholder-chat-muted focus:outline-none focus:border-chat-accent transition-colors"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-chat-muted text-sm mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-chat-input border border-chat-border rounded-lg text-chat-text placeholder-chat-muted focus:outline-none focus:border-chat-accent transition-colors pr-10"
                placeholder="Min 6 characters"
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
            disabled={loading || !isValid}
            className="w-full py-2.5 bg-chat-accent hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-chat-muted text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-chat-accent hover:underline font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
