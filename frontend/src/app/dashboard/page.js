'use client';

import { useState, useEffect, Suspense } from 'react';
import { apiFetch } from '@/lib/api';
import { Zap, Plus, Mic, ArrowUp, Sparkles, HelpCircle, PlayCircle, Swords } from 'lucide-react';
import ReportResult from '@/components/ReportResult';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const homeContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const homeItemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

function DashboardContent() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const [currentHistoryId, setCurrentHistoryId] = useState(null);
  
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  useEffect(() => {
    if (id && id !== currentHistoryId) {
      const loadHistory = async () => {
        setIsLoading(true);
        try {
          const data = await apiFetch(`/research/history/${id}`);
          if (data && data.data) {
            setResult(data.data.rawOutput);
            setCurrentQuery(data.data.companyName);
            setCurrentHistoryId(id);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      };
      loadHistory();
    } else if (!id) {
      // Clear state if we navigate back to the home route without an ID
      setResult(null);
      setCurrentQuery('');
      setCurrentHistoryId(null);
    }
  }, [id, currentHistoryId]);

  const submitQuery = async (searchQuery) => {
    if (!searchQuery.trim() || isLoading) return;
    
    setIsLoading(true);
    setCurrentQuery(searchQuery);
    setQuery('');
    setResult(null);
    setCurrentHistoryId(null);
    
    try {
      const data = await apiFetch('/research', {
        method: 'POST',
        body: JSON.stringify({ companyName: searchQuery }),
      });
      if (data && data.data) {
        setResult(data.data.rawOutput);
        setCurrentHistoryId(data.data.historyId);
        window.history.pushState(null, '', `/dashboard?id=${data.data.historyId}`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Error generating research: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitQuery(query);
  };

  const isHome = !currentQuery && !isLoading && !result;

  const renderInputArea = () => (
    <div className="w-full relative">
      <div className="flex justify-between items-center text-xs text-gray-500 mb-2 px-2">
        <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Unlock more features with the Pro plan.</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Active extensions</span>
      </div>
      
      <form onSubmit={handleSubmit} className="glass-input rounded-2xl p-2 flex items-center gap-2 w-full transition-all focus-within:ring-1 focus-within:ring-white/20 shadow-2xl bg-[#09090b]/80 backdrop-blur-xl">
        <button type="button" className="p-2 hover:bg-white/10 rounded-xl transition-colors"><Plus className="w-5 h-5 text-gray-400" /></button>
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask anything ..." 
          className="flex-1 bg-transparent outline-none text-white placeholder-gray-500 text-lg py-2" 
          disabled={isLoading}
        />
        <button type="button" className="p-2 hover:bg-white/10 rounded-xl transition-colors"><Mic className="w-5 h-5 text-gray-400" /></button>
        <button type="submit" disabled={isLoading || !query.trim()} className="p-2 hover:bg-white/10 disabled:opacity-50 rounded-xl transition-colors">
           <ArrowUp className="w-5 h-5 text-gray-400 hover:text-white" />
        </button>
      </form>
    </div>
  );

  return (
    <div className="flex-1 w-full h-full flex flex-col relative overflow-hidden bg-transparent">
      
      {isHome ? (
        // Home Screen Layout (Matched exactly to ui-sample-home.html)
        <motion.div 
          className="flex-1 flex flex-col justify-center items-center w-full max-w-3xl px-4 mx-auto pb-24"
          variants={homeContainerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={homeItemVariants} className="w-16 h-16 rounded-2xl glass-input flex items-center justify-center mb-6 shadow-2xl">
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
          <motion.h1 variants={homeItemVariants} className="text-4xl font-semibold mb-2 text-center">Good to See You!</motion.h1>
          <motion.h2 variants={homeItemVariants} className="text-3xl font-medium text-gray-400 mb-2 text-center">How Can I be an Assistance?</motion.h2>
          <motion.p variants={homeItemVariants} className="text-gray-500 mb-12 text-center">I'm available 24/7 for you, ask me anything.</motion.p>

          <motion.div variants={homeItemVariants} className="w-full">
            {renderInputArea()}
          </motion.div>

          <motion.div variants={homeItemVariants} className="flex gap-3 mt-6 flex-wrap justify-center">
            <button type="button" onClick={() => submitQuery('Any advice for me?')} className="px-4 py-2 glass-input rounded-full text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2 shadow-lg"><HelpCircle className="w-4 h-4" /> Any advice for me?</button>
            <button type="button" onClick={() => submitQuery('Research Apple for investment')} className="px-4 py-2 glass-input rounded-full text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2 shadow-lg"><PlayCircle className="w-4 h-4" /> Research Apple</button>
            <button type="button" onClick={() => submitQuery('Research TSLA for investment')} className="px-4 py-2 glass-input rounded-full text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2 shadow-lg"><Swords className="w-4 h-4" /> Research TSLA</button>
            <button type="button" className="px-4 py-2 glass-input rounded-full text-sm text-gray-400 hover:text-white transition-colors">•••</button>
          </motion.div>
          
          <motion.div variants={homeItemVariants} className="absolute bottom-6 text-xs text-gray-600 text-center">
            Unlock new era with AetherAI. <a href="#" className="underline hover:text-white">share us</a>
          </motion.div>
        </motion.div>
      ) : (
        // Result Screen Layout (Matched to flex chat layout)
        <div className="flex-1 flex flex-col w-full h-full min-h-0 overflow-hidden">
          {/* Scrollable Chat Area */}
          <div className="flex-1 w-full overflow-y-auto scroll-smooth flex flex-col items-center">
            <div className="w-full max-w-3xl px-4 py-8 flex flex-col">
              
              <AnimatePresence mode="popLayout">
                {currentQuery && (
                  <motion.div 
                    key="query"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="flex justify-end mb-8 mt-12"
                  >
                    <div className="chat-bubble shadow-lg border border-white/5">{currentQuery}</div>
                  </motion.div>
                )}

                {isLoading && (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="w-full flex justify-center mb-8"
                  >
                    <div className="px-5 py-2 glass-input rounded-full flex items-center gap-3 text-sm text-gray-300 shadow-lg">
                      <Sparkles className="w-4 h-4 animate-pulse text-white" />
                      Generating
                    </div>
                  </motion.div>
                )}

                {result && !isLoading && (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="flex flex-col gap-4 text-gray-300"
                  >
                     <p className="leading-relaxed">Here's a comprehensive AI analysis of {currentQuery} based on real-time financial data, filings, and market sentiment:</p>
                     <ReportResult result={result} />
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

          {/* Fixed Input Area at Bottom */}
          <div className="w-full shrink-0 flex flex-col items-center bg-gradient-to-t from-[#09090b] via-[#09090b] to-transparent pt-8 pb-6 px-4 z-20">
            <div className="w-full max-w-3xl">
              {renderInputArea()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="flex-1 flex justify-center items-center w-full"><div className="spinner-border"></div></div>}>
      <DashboardContent />
    </Suspense>
  );
}
