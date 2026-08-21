import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useNetworkStore } from '@/stores/networkStore';

export function useNetworkStatus() {
  const { isOnline, lastSyncAt, setOnline, setLastSyncAt } = useNetworkStore();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      setOnline(online);
      if (online) {
        setLastSyncAt(Date.now());
      }
    });

    // Fetch once on mount
    NetInfo.fetch()
      .then((state) => {
        const online = state.isConnected === true && state.isInternetReachable !== false;
        setOnline(online);
      })
      .catch(() => {}); // The subscription above still delivers the next change.

    return () => unsubscribe();
  }, [setOnline, setLastSyncAt]);

  return { isOnline, lastSyncAt };
}
