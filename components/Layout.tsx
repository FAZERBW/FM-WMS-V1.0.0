
import React from 'react';
import { LayoutDashboard, Users, ShieldCheck, Wallet, Settings as SettingsIcon, Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../hooks/useTheme';
import { useShopStore } from '../hooks/useShopStore';
import { Toast } from './ui/Toast';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { mode, toggleMode } = useThemeStore();
  const { shop } = useShopStore();

  const NavItem = ({ id, icon: Icon, label }: any) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`
          relative group flex flex-col items-center justify-center w-full h-full transition-all duration-300
          ${isActive ? 'text-cyan-600 dark:text-cyan-400 -translate-y-1' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}
        `}
      >
        {/* Liquid Indicator */}
        <div className={`
          absolute -top-12 w-12 h-12 rounded-full blur-xl opacity-60 transition-all duration-500
          ${isActive ? 'bg-cyan-400 scale-100' : 'scale-0'}
        `} />
        
        <div className={`
          relative z-10 p-2 rounded-2xl transition-all duration-300
          ${isActive ? 'bg-white/80 dark:bg-white/10 shadow-lg scale-110' : ''}
        `}>
          <Icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        
        <span className={`
          text-[10px] font-bold mt-1 tracking-wide transition-all duration-300
          ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        `}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <div className="h-screen w-full relative overflow-hidden flex flex-col">
      <Toast />

      {/* Animated Liquid Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* Top Bar */}
      <header className="relative z-50 px-6 py-4 flex items-center justify-between bg-white/30 dark:bg-black/20 backdrop-blur-md border-b border-white/10 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg animate-pop">
            FM
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
              {shop.name || 'FM WMS'}
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">
              {shop.slogan || 'Auto Parts Manager'}
            </p>
          </div>
        </div>
        
        <button 
          onClick={toggleMode}
          className="p-2.5 rounded-full bg-white/50 dark:bg-black/40 hover:scale-110 transition-transform shadow-sm border border-white/20"
        >
          {mode === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-600" />}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 scroll-smooth">
         <div className="min-h-full p-4 pb-32 md:p-8 md:pb-32 max-w-7xl mx-auto">
           {children}
         </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[600px] h-20 z-50">
        <div className="
          w-full h-full 
          bg-white/80 dark:bg-[#0f172a]/80 
          backdrop-blur-2xl 
          border border-white/20 dark:border-white/10 
          rounded-3xl 
          shadow-2xl shadow-black/10 dark:shadow-black/50
          flex items-center justify-around px-2
        ">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Home" />
          <NavItem id="customers" icon={Users} label="Sales" />
          <NavItem id="warranty" icon={ShieldCheck} label="Warranty" />
          <NavItem id="ledger" icon={Wallet} label="Labour" />
          <NavItem id="settings" icon={SettingsIcon} label="Config" />
        </div>
      </nav>
    </div>
  );
};
