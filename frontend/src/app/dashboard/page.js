'use client';

import { useState, useEffect, Suspense } from 'react';
import { apiFetch } from '@/lib/api';
import { Zap, Plus, Mic, ArrowUp } from 'lucide-react';
import ReportResult from '@/components/ReportResult';
import { useSearchParams } from 'next/navigation';

function DashboardContent() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [currentQuery, setCurrentQuery] = useState('');
  
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  useEffect(() => {
    if (id) {
      const loadHistory = async () => {
        setIsLoading(true);
        try {
          const data = await apiFetch(`/research/history/${id}`);
          if (data && data.data) {
            setResult(data.data.result);
            setCurrentQuery(data.data.company);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      };
      loadHistory();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    
    setIsLoading(true);
    setCurrentQuery(query);
    setQuery('');
    setResult(null);
    
    try {
      const data = await apiFetch('/research/generate', {
        method: 'POST',
        body: JSON.stringify({ company: query }),
      });
      setResult(data);
    } catch (error) {
      console.error(error);
      alert('Error generating research: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-gradient-radial">
      
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center pb-48 pt-20 px-4 scroll-smooth">
        
        {/* Empty State */}
        {!currentQuery && !isLoading && !result && (
          <div className="flex-1 flex flex-col justify-center items-center max-w-2xl w-full text-center mb-12">
             <h2 className="text-3xl font-semibold mb-2">What company should we research?</h2>
             <p className="text-gray-500">Enter a stock ticker or company name to get started.</p>
          </div>
        )}

        {/* User Query Bubble */}
        {currentQuery && (
          <div className="w-full max-w-3xl flex justify-end mb-8 mt-4">
            <div className="chat-bubble shadow-lg border border-white/5">{currentQuery}</div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="w-full max-w-3xl flex justify-center mb-8">
            <div className="px-5 py-3 glass-input rounded-full flex items-center gap-3 text-sm text-gray-300">
              <div className="spinner-border"></div>
              Agent is researching...
            </div>
          </div>
        )}

        {/* Result Area */}
        {result && !isLoading && (
          <div className="w-full max-w-3xl flex flex-col gap-4 text-gray-300">
             <p className="leading-relaxed">Here is the research report for {currentQuery}:</p>
             <ReportResult result={result} />
          </div>
        )}

      </div>

      {/* Input Box Fixed at Bottom */}
      <div className="absolute bottom-6 w-full px-4 left-0">
        <div className="max-w-3xl mx-auto relative bg-[#09090b]/60 backdrop-blur-xl rounded-3xl p-1 pb-2 shadow-2xl ring-1 ring-white/10">
          <div className="flex justify-between items-center text-xs text-gray-500 mb-2 px-4 pt-2">
            <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Pro agents available</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> System Online</span>
          </div>
          <form onSubmit={handleSubmit} className="glass-input rounded-2xl p-2 flex items-center gap-2 w-full transition-all focus-within:ring-1 focus-within:ring-white/30 bg-[#131315]/80">
            <button type="button" className="p-2 hover:bg-white/10 rounded-xl transition-colors"><Plus className="w-5 h-5 text-gray-400" /></button>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Research NVIDIA for investment..." 
              className="flex-1 bg-transparent outline-none text-white placeholder-gray-500 text-lg py-2" 
              disabled={isLoading}
            />
            <button type="button" className="p-2 hover:bg-white/10 rounded-xl transition-colors"><Mic className="w-5 h-5 text-gray-400" /></button>
            <button type="submit" disabled={isLoading || !query.trim()} className="p-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-xl transition-colors">
               <ArrowUp className="w-5 h-5 text-white" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="flex-1 flex justify-center items-center"><div className="spinner-border"></div></div>}>
      <DashboardContent />
    </Suspense>
  );
}
