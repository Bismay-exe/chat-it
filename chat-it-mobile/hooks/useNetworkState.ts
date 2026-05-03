import { useState, useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";

/**
 * Tracks real network connectivity state.
 * Uses NetInfo which checks actual internet reachability, not just wifi/cell.
 */
export function useNetworkState() {
  // Start as `true` to avoid false offline flash on mount
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Fetch current state immediately
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected !== false && state.isInternetReachable !== false);
    });

    // Subscribe to future changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected !== false && state.isInternetReachable !== false);
    });

    return unsubscribe;
  }, []);

  return { isConnected };
}
