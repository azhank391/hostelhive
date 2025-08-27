'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { 
  BuildingIcon, 
  MailIcon, 
  LockIcon, 
  EyeIcon, 
  EyeOffIcon 
} from 'lucide-react'
import Link from 'next/link'
import { useForm, SubmitHandler } from 'react-hook-form'
import { notification } from '@/lib/toast'

interface LoginFormData {
  email: string
  password: string
}

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    mode: 'onChange',
  })

  // Check for error messages and logout messages in URL
  useEffect(() => {
    const errorParam = searchParams?.get('error')
    const messageParam = searchParams?.get('message')
    
    if (errorParam === 'unauthorized') {
      setError('You must be logged in to access this page. Please sign in to continue.')
    } else if (errorParam === 'insufficient_permissions') {
      setError('You do not have permission to access this page. Please contact your administrator.')
    } else if (messageParam === 'logged_out') {
      setError('You have been successfully logged out. Please sign in again to continue.')
    } else if (messageParam === 'registration_success') {
      // Show success message for registration
      notification.success('Registration successful!', {
        description: 'Your account has been created. Please sign in to continue.',
      })
    }
  }, [searchParams])

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    setLoading(true)
    setError('')

    try {
      const credentials = { email: data.email, password: data.password };
      
      await login(credentials)
      
      notification.success('Welcome back!', {
        description: 'You have been successfully logged in.',
      })
      
      // The login function in AuthContext will handle the user state
      // We'll redirect after a brief delay to ensure state is updated
      setTimeout(() => {
        // Default redirect - the dashboard will handle role-based routing
        router.push('/dashboard')
      }, 100)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      setError(errorMessage)
      notification.error('Login failed', {
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <BuildingIcon className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Hostel<span className="text-blue-600">Hive</span>
          </h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <Card>
          <div className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                  <FormField
                    id="email"
                    type="email"
                    className="pl-10"
                    placeholder="Enter your email"
                    error={errors.email}
                    {...register('email')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                  <FormField
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="pl-10 pr-10"
                    placeholder="Enter your password"
                    error={errors.password}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                  >
                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || isSubmitting}
              >
                {(loading || isSubmitting) ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <Link href="/auth/register-owner" className="text-blue-600 hover:text-blue-500 font-medium">
                  Register as Owner
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
