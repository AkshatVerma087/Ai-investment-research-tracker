'use client';

import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LayoutSidebar, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({ children }) {
  const { user, loading, logout } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <div className="spinner-border"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar - Phase 6.5 will populate this */}
      <div className="w-64 glass-input border-t-0 border-b-0 border-l-0 hidden md:flex flex-col relative z-20 shadow-2xl bg-[#09090b]/80">
        <div className="p-6 font-bold flex items-center gap-2 border-b border-white/5">
           <Sparkles className="w-5 h-5 text-white" />
           AetherAI
        </div>
        <div className="flex-1 overflow-y-auto p-4" id="history-sidebar-container">
          {/* History goes here */}
        </div>
        <div className="p-4 border-t border-white/5 flex items-center justify-between">
           <div className="text-sm truncate mr-2">{user.email}</div>
           <button onClick={logout} className="text-xs text-red-400 hover:text-red-300">Logout</button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 relative flex flex-col h-full overflow-hidden">
         {/* Top Mobile Nav */}
         <div className="md:hidden w-full p-4 flex justify-between items-center absolute top-0 left-0 right-0 z-10 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md">
            <button className="p-2 glass-input rounded-md"><LayoutSidebar className="w-5 h-5 text-gray-400" /></button>
            <div className="font-bold flex items-center gap-2">AetherAI</div>
         </div>
         {children}
      </div>
    </div>
  );
}
