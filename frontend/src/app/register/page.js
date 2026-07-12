'use client';

import { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useUser();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 my-12">
      <Link href="/" className="absolute top-8 left-8 text-xl font-bold flex items-center gap-2 hover:opacity-80 transition-opacity">
         <Sparkles className="w-5 h-5 text-white" />
         AetherAI
      </Link>
      
      <div className="glass-input p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
        <h2 className="text-3xl font-bold text-white mb-2">Create an account</h2>
        <p className="text-gray-400 mb-8">Start your AI investment research journey today.</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#131315] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-white/30 transition-colors"
              placeholder="John Doe"
              required
            />
          </div>
          
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
            <label className="text-sm font-medium text-gray-300 block mb-2">Password</label>
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
            Create account <ArrowRight className="w-4 h-4" />
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          Already have an account? <Link href="/login" className="text-white hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
