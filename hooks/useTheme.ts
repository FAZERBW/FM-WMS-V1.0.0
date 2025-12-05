

import { create } from 'zustand';

type AppTheme = 'blue' | 'orange';
type ColorMode = 'light' | 'dark';

interface ThemeState {
  theme: AppTheme; // Context Color (C1/C2)
  mode: ColorMode; // Dark/Light Mode
  setTheme: (theme: AppTheme) => void;
  toggleMode: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'blue',
  mode: 'dark',
  setTheme: (theme) => set({ theme }),
  toggleMode: () => {
    const newMode = get().mode === 'dark' ? 'light' : 'dark';
    set({ mode: newMode });
    // Apply class to html element
    if (newMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}));

export const getThemeColors = (theme: AppTheme) => {
  const mode = useThemeStore.getState().mode;

  // Theming Logic based on user prompt:
  // Dark: Sky Blue and White shaded text
  // Light: Dark Blue and Black/Navy Blue shaded text

  if (mode === 'dark') {
    // DARK MODE PALETTE (Sky Blue/White)
    if (theme === 'orange') {
        // C2 Dark
        return {
            primary: 'bg-orange-500',
            primaryHover: 'hover:bg-orange-600',
            text: 'text-orange-100',
            subText: 'text-orange-200/70',
            border: 'border-orange-500/30',
            gradient: 'from-orange-500/20 to-amber-500/20',
            glass: 'bg-orange-500/10'
        };
    }
    // C1 Dark (Default Sky Blue)
    return {
        primary: 'bg-sky-500',
        primaryHover: 'hover:bg-sky-600',
        text: 'text-sky-50',
        subText: 'text-sky-200/70',
        border: 'border-sky-500/30',
        gradient: 'from-sky-500/20 to-blue-600/20',
        glass: 'bg-sky-500/10'
    };
  } else {
    // LIGHT MODE PALETTE (Navy/Black)
    if (theme === 'orange') {
        // C2 Light
        return {
            primary: 'bg-orange-600',
            primaryHover: 'hover:bg-orange-700',
            text: 'text-orange-950',
            subText: 'text-orange-900/70',
            border: 'border-orange-600/30',
            gradient: 'from-orange-100 to-amber-100',
            glass: 'bg-orange-600/10'
        };
    }
    // C1 Light (Navy Blue)
    return {
        primary: 'bg-blue-900', // Navy Blue
        primaryHover: 'hover:bg-blue-800',
        text: 'text-slate-900',
        subText: 'text-slate-700',
        border: 'border-blue-900/20',
        gradient: 'from-sky-100 to-blue-200',
        glass: 'bg-blue-900/5'
    };
  }
};
