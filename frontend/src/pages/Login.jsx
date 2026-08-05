import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(email, password)
    if (result?.success) {
      navigate('/app')
    } else {
      setError(result?.error || 'Login failed')
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Welcome back</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Log in to pick up where you left off.
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          label="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="h-4 w-4" />}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <div>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              placeholder="Your password"
              autoComplete="current-password"
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-[34px] text-ink-faint hover:text-ink"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" size="lg" loading={loading} className="w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-semibold text-brand-700 hover:text-brand-800">
          Sign up
        </Link>
      </p>
    </div>
  )
}

export default Login
