'use client';

import { Sparkles, Gem, Zap, Plus, Mic, ArrowUp, HelpCircle, Swords } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user } = useUser();
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col items-center relative overflow-hidden">
      {/* Top Nav */}
      <div className="w-full p-6 flex justify-between items-center absolute top-0 left-0 right-0 z-10">
        <div className="text-xl font-bold flex items-center gap-2">
           <Sparkles className="w-5 h-5 text-white" />
           Quantix
        </div>
        <div className="flex gap-4 items-center">
          {user ? (
            <Link href="/dashboard" className="px-4 py-2 glass-input rounded-full text-sm font-medium hover:bg-white/5 transition-colors">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 glass-input rounded-full text-sm font-medium hover:bg-white/5 transition-colors">
                Login
              </Link>
              <Link href="/register" className="px-4 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center w-full max-w-3xl px-4 mt-20 z-10">
        <div className="w-16 h-16 rounded-2xl glass-input flex items-center justify-center mb-6 shadow-2xl">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-semibold mb-2 text-center">Good to See You!</h1>
        <h2 className="text-3xl font-medium text-gray-400 mb-2 text-center">How Can I be of Assistance?</h2>
        <p className="text-gray-500 mb-12 text-center">I'm available 24/7 for you, ask me anything about stocks.</p>

        {/* Input Section - Fake for landing page, redirects to login/dashboard */}
        <div className="w-full relative cursor-text" onClick={() => router.push(user ? '/dashboard' : '/login')}>
          <div className="flex justify-between items-center text-xs text-gray-500 mb-2 px-2">
            <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Unlock AI analysis with the Pro plan.</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> System Online</span>
          </div>
          <div className="glass-input rounded-2xl p-2 flex items-center gap-2 w-full transition-all hover:ring-1 hover:ring-white/20">
            <button className="p-2 hover:bg-white/10 rounded-xl transition-colors"><Plus className="w-5 h-5 text-gray-400" /></button>
            <input 
              type="text" 
              placeholder="Research NVIDIA for investment..." 
              className="flex-1 bg-transparent outline-none text-white placeholder-gray-500 text-lg py-2 pointer-events-none" 
              readOnly 
            />
            <button className="p-2 hover:bg-white/10 rounded-xl transition-colors"><Mic className="w-5 h-5 text-gray-400" /></button>
            <button className="p-2 hover:bg-white/10 rounded-xl transition-colors"><ArrowUp className="w-5 h-5 text-gray-400" /></button>
          </div>
        </div>
        
        {/* Suggestions */}
        <div className="flex gap-3 mt-6 flex-wrap justify-center">
          <button className="px-4 py-2 glass-input rounded-full text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            <HelpCircle className="w-4 h-4" /> Is Tesla a good buy right now?
          </button>
          <button className="px-4 py-2 glass-input rounded-full text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            <Gem className="w-4 h-4" /> Analyze Apple's Q3 earnings
          </button>
          <button className="px-4 py-2 glass-input rounded-full text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            <Swords className="w-4 h-4" /> AMD vs Intel risks
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-6 text-xs text-gray-600 z-10">Unlock new era with Quantix. <Link href="#" className="underline">share us</Link></div>
    </div>
  );
}
