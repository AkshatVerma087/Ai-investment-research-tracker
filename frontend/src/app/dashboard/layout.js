'use client';

import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PanelLeft, Diamond, Sparkles, X } from 'lucide-react';
import HistorySidebar from '@/components/HistorySidebar';

export default function DashboardLayout({ children }) {
  const { user, loading, logout } = useUser();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex-1 flex justify-center items-center w-full">
        <div className="spinner-border"></div>
      </div>
    );
  }

  return (
    <>
      {/* Top Nav (from ui-sample-home.html) */}
      <div className="w-full p-6 flex justify-between items-center absolute top-0 left-0 right-0 z-40 pointer-events-none">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 glass-input rounded-md hover:bg-white/5 transition-colors pointer-events-auto"
        >
          <PanelLeft className="w-5 h-5 text-gray-400" />
        </button>
        
        <div className="flex gap-4 pointer-events-auto">
          <button onClick={logout} className="px-4 py-2 glass-input rounded-full text-sm font-medium flex items-center hover:bg-white/5 transition-colors text-gray-400">
             Logout
          </button>
          <button className="px-4 py-2 glass-input rounded-full text-sm font-medium flex items-center gap-2 hover:bg-white/5 transition-colors">
            <Diamond className="w-4 h-4 text-gray-400" /> Upgrade
          </button>
        </div>
      </div>

      {/* Sidebar Overlay */}
      <div 
        className={`fixed inset-0 z-50 flex transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
         <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)}></div>
         <div 
           className={`w-64 glass-input border-t-0 border-b-0 border-l-0 flex flex-col relative z-20 shadow-2xl bg-[#09090b]/90 h-full transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
         >
            <div className="p-6 font-bold flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-white" />
                AetherAI
              </div>
              <button onClick={() => setSidebarOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <HistorySidebar />
            </div>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full flex flex-col relative min-h-0 overflow-hidden">
         {children}
      </div>
    </>
  );
}
