'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HistorySidebar() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await apiFetch('/research/history');
        if (data && data.data) {
          setHistory(data.data);
        }
      } catch (err) {
        console.error('Failed to load history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="text-xs text-gray-500 p-4">Loading history...</div>;
  if (history.length === 0) return <div className="text-xs text-gray-500 p-4">No past research found.</div>;

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2 px-2">Past Research</div>
      {history.map((item) => (
        <button 
          key={item.id} 
          onClick={() => router.push(`/dashboard?id=${item.id}`)}
          className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg transition-colors text-left text-sm text-gray-300 hover:text-white"
        >
          <FileText className="w-4 h-4 text-gray-500 shrink-0" />
          <span className="truncate">{item.company}</span>
        </button>
      ))}
    </div>
  );
}
