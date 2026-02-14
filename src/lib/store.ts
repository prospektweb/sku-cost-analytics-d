import { create } from 'zustand';
import type { Snapshot } from './types';

interface DashboardState {
  offerId: number | null;
  snapshots: Snapshot[];
  isInitialized: boolean;
  initializeFromPostMessage: (offerId: number, history: Snapshot[] | string) => void;
  reset: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  offerId: null,
  snapshots: [],
  isInitialized: false,
  
  initializeFromPostMessage: (offerId: number, history: Snapshot[] | string) => {
    // Handle both string and parsed object
    const snapshots = typeof history === 'string' ? JSON.parse(history) : history;
    
    set({
      offerId,
      snapshots,
      isInitialized: true,
    });
  },
  
  reset: () => {
    set({
      offerId: null,
      snapshots: [],
      isInitialized: false,
    });
  },
}));

// Set up postMessage listener
if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    // Validate message type first
    if (event.data?.type !== 'PROSPEKTWEB_CALC_DASHBOARD_INIT') {
      return;
    }

    // Note: Origin validation is intentionally permissive for iframe embedding.
    // In production, you should validate event.origin against trusted domains:
    // const trustedOrigins = ['https://your-bitrix-domain.com'];
    // if (!trustedOrigins.includes(event.origin)) {
    //   console.warn('Rejected postMessage from untrusted origin:', event.origin);
    //   return;
    // }
    
    const { offerId, history } = event.data;
    
    if (offerId && history) {
      useDashboardStore.getState().initializeFromPostMessage(offerId, history);
    }
  });
}
