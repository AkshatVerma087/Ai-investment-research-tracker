'use client';

import { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useUser();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4">
      <Link href="/" className="absolute top-8 left-8 text-xl font-bold flex items-center gap-2 hover:opacity-80 transition-opacity">
         <Sparkles className="w-5 h-5 text-white" />
         AetherAI
      </Link>
      
      <div className="glass-input p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
        <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
        <p className="text-gray-400 mb-8">Enter your details to access your account.</p>
        
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
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <Link href="#" className="text-xs text-gray-500 hover:text-white transition-colors">Forgot password?</Link>
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#131315] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-white/30 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button type="submit" className="w-full bg-white text-black font-semibold rounded-xl px-4 py-3 mt-2 hover:bg-gray-200 transition-colors flex justify-center items-center gap-2">
            Sign in <ArrowRight className="w-4 h-4" />
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          Don't have an account? <Link href="/register" className="text-white hover:underline">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
