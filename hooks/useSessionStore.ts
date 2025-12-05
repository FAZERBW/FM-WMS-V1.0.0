

import { create } from 'zustand';
import { CustomerType, ExtraCharge } from '../types';

interface SessionState {
  customerType: CustomerType | null; // Null means red button (unset)
  setCustomerType: (type: CustomerType | null) => void;
  
  // Extra Context for the current session/sale
  activePaymentContext: {
    isLabourIncluded: boolean;
    labourAmount: number;
    // Default charges configured in Context Modal
    defaultCustomCharges: ExtraCharge[];
    margin: number; // For C2 commission
  };
  setPaymentContext: (ctx: Partial<SessionState['activePaymentContext']>) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  customerType: null,
  setCustomerType: (type) => set({ customerType: type }),
  
  activePaymentContext: {
    isLabourIncluded: true,
    labourAmount: 0,
    defaultCustomCharges: [],
    margin: 0
  },
  setPaymentContext: (ctx) => set((state) => ({
    activePaymentContext: { ...state.activePaymentContext, ...ctx }
  }))
}));