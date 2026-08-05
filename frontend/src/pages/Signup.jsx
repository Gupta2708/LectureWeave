import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const validateForm = () => {
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validateForm()) return
    setLoading(true)
    const result = await register(formData.email, formData.password, formData.username)
    if (result?.success) {
      navigate('/app')
    } else {
      setError(result?.error || 'Registration failed')
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Create your account</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Start turning lectures into cited study material.
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
          name="username"
          label="Username"
          value={formData.username}
          onChange={handleChange}
          leftIcon={<User className="h-4 w-4" />}
          placeholder="Your name"
          autoComplete="username"
          required
        />
        <Input
          type="email"
          name="email"
          label="Email address"
          value={formData.email}
          onChange={handleChange}
          leftIcon={<Mail className="h-4 w-4" />}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            name="password"
            label="Password"
            value={formData.password}
            onChange={handleChange}
            leftIcon={<Lock className="h-4 w-4" />}
            placeholder="At least 6 characters"
            autoComplete="new-password"
            hint="At least 6 characters"
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
        <Input
          type={showPassword ? 'text' : 'password'}
          name="confirmPassword"
          label="Confirm password"
          value={formData.confirmPassword}
          onChange={handleChange}
          leftIcon={<Lock className="h-4 w-4" />}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          required
        />

        <Button type="submit" size="lg" loading={loading} className="w-full">
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default Signup
