import { create } from 'zustand';

interface NetworkState {
  isOnline: boolean;
  lastSyncAt: number | null;
  setOnline: (online: boolean) => void;
  setLastSyncAt: (timestamp: number) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: true,
  lastSyncAt: null,
  setOnline: (online) => set({ isOnline: online }),
  setLastSyncAt: (timestamp) => set({ lastSyncAt: timestamp }),
}));
