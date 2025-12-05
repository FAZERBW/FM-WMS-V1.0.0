import { create } from 'zustand';

export interface HistoryItem {
  id: string;
  description: string;
  timestamp: number;
  undo: () => void;
  redo: () => void;
}

interface ToastState {
  isVisible: boolean;
  message: string;
  type: 'success' | 'undo' | 'redo';
  duration: number; // ms
  actionLabel?: string;
  onAction?: () => void;
}

interface HistoryStore {
  history: HistoryItem[];
  toast: ToastState | null;
  
  // Actions
  addHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  showToast: (message: string, type?: ToastState['type'], onAction?: () => void) => void;
  hideToast: () => void;
  performUndo: (id: string) => void;
  performRedo: (id: string, redoFn: () => void) => void;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  history: [],
  toast: null,

  addHistory: (item) => {
    const newItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };

    set((state) => {
      // Keep last 8 items
      const newHistory = [newItem, ...state.history].slice(0, 8);
      return { history: newHistory };
    });

    // Trigger Toast (5 seconds for initial action)
    get().showToast(item.description, 'success', newItem.undo);
  },

  showToast: (message, type = 'success', onAction) => {
    const duration = type === 'redo' ? 3000 : 5000;
    
    set({
      toast: {
        isVisible: true,
        message,
        type,
        duration,
        actionLabel: type === 'redo' ? 'Redo' : 'Undo',
        onAction,
      }
    });

    // Auto-hide logic is handled in the Toast component via onAnimationEnd
    // or we could use setTimeout here, but CSS animation is cleaner for the bar.
  },

  hideToast: () => {
    set({ toast: null });
  },

  performUndo: (id) => {
    const state = get();
    const item = state.history.find(i => i.id === id);
    if (item) {
      item.undo();
      // Remove from history? Or mark as undone? 
      // For simple history, we usually remove it or replace it.
      // But user asked to "Undo" from history list too.
      // If we undo, we should probably allow Redo.
      
      // We will remove it from history stack to avoid complex tree,
      // BUT we trigger the "Redo" toast.
      
      const newHistory = state.history.filter(i => i.id !== id);
      set({ history: newHistory });

      // Show Redo Toast (3 seconds)
      get().showToast(`Undid: ${item.description}`, 'undo', () => {
        get().performRedo(id, item.redo);
      });
    }
  },

  performRedo: (id, redoFn) => {
    redoFn();
    // We don't add it back to history to prevent infinite loops or just for simplicity,
    // unless we treat it as a new action. 
    // Let's treat it as a new action but identical.
    // However, the prompt says "Undo it... show 3 seconds timer to redo it".
    get().hideToast();
  }
}));