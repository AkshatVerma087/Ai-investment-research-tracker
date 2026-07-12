import { TrendingUp, Minus, XCircle, Copy } from 'lucide-react';

export default function ReportResult({ result }) {
  if (!result || !result.decision) return null;

  const isInvest = result.decision.toUpperCase() === 'INVEST';
  const isPass = result.decision.toUpperCase() === 'PASS';

  let icon = <Minus className="w-7 h-7 text-yellow-400" />;
  let colorClass = "bg-yellow-500/10 border-yellow-500/20 text-yellow-400";
  
  if (isInvest) {
    icon = <TrendingUp className="w-7 h-7 text-green-400" />;
    colorClass = "bg-green-500/10 border-green-500/20 text-green-400";
  } else if (isPass) {
    icon = <XCircle className="w-7 h-7 text-red-400" />;
    colorClass = "bg-red-500/10 border-red-500/20 text-red-400";
  }

  const score = result.overall_score || 0;
  
  return (
    <div className="code-block rounded-xl overflow-hidden mt-2 w-full text-left">
      <div className="flex justify-between items-center bg-[#1a1a1c] px-4 py-3 border-b border-white/5 text-xs text-gray-400">
        <span className="font-medium text-gray-300 uppercase tracking-widest text-[10px]">Investment Verdict</span>
        <button 
          className="flex items-center gap-1 hover:text-white transition-colors"
          onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}
        >
          <Copy className="w-3 h-3" /> Copy data
        </button>
      </div>
      <div className="p-6 bg-[#131315]">
        <div className="flex items-center gap-4 mb-8">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center border ${colorClass}`}>
            {icon}
          </div>
          <div>
            <h3 className="text-3xl font-bold text-white mb-1 capitalize">{result.decision}</h3>
            <p className="text-sm text-gray-400">
              Final Score: <span className="text-white font-medium">{score.toFixed(1)} / 10</span> 
              {result.confidence && ` (Confidence: ${result.confidence})`}
            </p>
          </div>
        </div>
        
        <div className="space-y-6 text-sm leading-relaxed text-gray-300">
          {result.reasoning && (
            <div>
              <span className="text-gray-500 text-xs block mb-2 font-medium tracking-wide uppercase">Rationale</span>
              {result.reasoning}
            </div>
          )}
          {result.risks && (
            <div>
              <span className="text-gray-500 text-xs block mb-2 font-medium tracking-wide uppercase">Risks & Counter-case</span>
              {result.risks}
            </div>
          )}
        </div>

        {/* Detailed Scores */}
        {result.scores && (
          <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(result.scores).map(([key, val]) => (
               <div key={key} className="glass-input p-3 rounded-lg text-center">
                 <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{key}</div>
                 <div className="font-semibold text-white">{val}/10</div>
               </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
