import React, { useEffect, useState } from 'react';
import { useHistoryStore } from '../../hooks/useHistory';
import { RotateCcw, RotateCw, CheckCircle2, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useHistoryStore();
  const [isPaused, setIsPaused] = useState(false);

  if (!toast || !toast.isVisible) return null;

  const handleAction = () => {
    if (toast.onAction) {
      toast.onAction();
    }
    // We don't hide immediately if it's an undo, the store handles the transition to 'Redo' toast
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-slide-up w-full max-w-sm px-4">
      <div 
        className="relative bg-[#1e293b] border border-white/10 shadow-2xl rounded-xl overflow-hidden flex flex-col"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            {toast.type === 'success' && <CheckCircle2 className="text-emerald-400" size={20} />}
            {toast.type === 'undo' && <RotateCcw className="text-amber-400" size={20} />}
            {toast.type === 'redo' && <RotateCw className="text-blue-400" size={20} />}
            
            <span className="font-medium text-white text-sm">{toast.message}</span>
          </div>

          <div className="flex items-center space-x-3">
            {toast.onAction && (
              <button 
                onClick={handleAction}
                className="text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-white transition-colors"
              >
                {toast.actionLabel}
              </button>
            )}
            <button onClick={hideToast} className="text-slate-500 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 w-full bg-white/5">
          <div 
            className="h-full bg-cyan-500 animate-shrink"
            style={{ 
              animationDuration: `${toast.duration}ms`,
              animationPlayState: isPaused ? 'paused' : 'running'
            }}
            onAnimationEnd={hideToast}
          />
        </div>
      </div>
    </div>
  );
};