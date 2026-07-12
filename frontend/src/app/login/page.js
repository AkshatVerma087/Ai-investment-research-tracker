'use client';

import { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithGoogle } = useUser();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setIsLoading(true);
    try {
      await loginWithGoogle(credentialResponse.credential);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Google Login failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4">
      <Link href="/" className="absolute top-8 left-8 text-xl font-bold flex items-center gap-2 hover:opacity-80 transition-opacity">
        <Sparkles className="w-5 h-5 text-white" />
        Quantix
      </Link>

      <div className="glass-input p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
        <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
        <p className="text-gray-400 mb-8">Enter your details to access your account.</p>

        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#131315] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-white/30 transition-colors"
              placeholder="name@company.com"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <Link href="#" className="text-xs text-gray-500 hover:text-white transition-colors">Forgot password?</Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#131315] border border-white/10 rounded-xl px-4 py-3 pr-10 text-white outline-none focus:border-white/30 transition-colors"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                tabIndex="-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-white text-black font-semibold rounded-xl px-4 py-3 mt-2 hover:bg-gray-200 transition-colors flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="spinner-border w-4 h-4 border-black"></div>
                Signing in...
              </>
            ) : (
              <>
                Sign in <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="my-6 flex items-center justify-center">
          <div className="h-px bg-white/10 w-full flex-1"></div>
          <span className="px-4 text-xs text-gray-500">OR</span>
          <div className="h-px bg-white/10 w-full flex-1"></div>
        </div>

        <div className="flex justify-center w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              setError('Google Login was unsuccessful');
            }}
            theme="filled_black"
            shape="pill"
            width="100%"
            text="continue_with"
          />
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          Don&apos;t have an account? <Link href="/register" className="text-white hover:underline">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
