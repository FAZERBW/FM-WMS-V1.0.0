
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', title, action }) => {
  return (
    <div className={`
      relative overflow-hidden rounded-3xl 
      border border-white/20 dark:border-white/10 
      bg-white/60 dark:bg-white/5 
      backdrop-blur-xl shadow-xl 
      transition-colors duration-300
      ${className}
    `}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 px-6 py-4">
          {title && <h3 className="text-lg font-bold text-slate-800 dark:text-white/90">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};
