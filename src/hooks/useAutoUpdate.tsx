import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { useUpdateStore } from '@/stores/updateStore';

// This should match the latest STABLE tag you've released (e.g., v1.0.0)
// For beta builds, the CI/CD will append -beta.RUN_ID
export const CURRENT_VERSION = 'v1.0.0';
const GITHUB_REPO = 'Bismay-exe/chat-it';

export const useAutoUpdate = () => {
  const { isChecking, setChecking, setUpdateAvailable } = useUpdateStore();

  const sanitizeVersion = (v: string) => v.trim().toLowerCase().replace(/^v/, '');

  const checkForUpdates = useCallback(async (manual = false) => {
    // Only check automatically if on a native platform (Android/iOS)
    const isNative = Capacitor.isNativePlatform();
    if (!isNative && !manual) return;

    let currentVersion = sanitizeVersion(CURRENT_VERSION);
    if (isNative) {
      try {
        const info = await App.getInfo();
        currentVersion = sanitizeVersion(info.version);
      } catch (e) {
        console.warn('Failed to get native App info:', e);
      }
    }

    let channel = localStorage.getItem('chat-it-update-channel') || 'stable';
    // If the installed version is beta, forcefully check beta channel to prevent false stable downgrades
    if (currentVersion.includes('beta') && channel === 'stable') {
      channel = 'beta';
    }

    if (manual) setChecking(true);

    try {
      const url = channel === 'stable'
        ? `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
        : `https://api.github.com/repos/${GITHUB_REPO}/releases`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch releases');

      const data = await response.json();
      let latestRelease = Array.isArray(data) ? data[0] : data;
      if (Array.isArray(data) && channel === 'beta') {
        latestRelease = data.find((r: any) => r.prerelease || r.tag_name?.toLowerCase().includes('beta')) || data[0];
      }

      const latestVersion = sanitizeVersion(latestRelease.tag_name || '');

      const isNewerVersion = (latest: string, current: string) => {
        if (latest === current) return false;
        const parse = (v: string) => {
          // Handles both "1.0.1-beta.31" and "1.0.1-beta"
          const [main, pre] = v.split(/-beta\.?|beta\.?/);
          const parts = main.split('.').map(n => parseInt(n) || 0);
          
          // If it's a beta, we need to extract the number if it exists. 
          // If "1.0.1-beta" (no number), we treat it as beta 0.
          // If "1.0.1" (stable), it gets 999999 to rank higher than any beta.
          let preNumber = 0;
          if (!v.includes('beta')) {
            preNumber = 999999;
          } else if (pre) {
            preNumber = parseInt(pre) || 0;
          }
          
          return { parts, preNumber };
        };
        const l = parse(latest);
        const c = parse(current);

        for (let i = 0; i < Math.max(l.parts.length, c.parts.length); i++) {
          const pL = l.parts[i] || 0;
          const pC = c.parts[i] || 0;
          if (pL > pC) return true;
          if (pL < pC) return false;
        }
        return l.preNumber > c.preNumber;
      };

      if (latestVersion && isNewerVersion(latestVersion, currentVersion)) {
        // If it's the web version, we don't show the update notification automatically
        if (!isNative) {
          if (manual) {
            toast.info(`New version available: ${latestRelease.tag_name}`, {
              description: "Updates are provided via the Android/iOS app. Please check your mobile device for the latest APK/Build."
            });
          }
          return;
        }

        if (isNative) {
          const apkAsset = latestRelease.assets?.find((asset: any) => asset.name.endsWith('.apk'));
          const downloadUrl = apkAsset ? apkAsset.browser_download_url : latestRelease.html_url;

          setUpdateAvailable(latestVersion, downloadUrl, latestRelease.body || '', channel);
        }
      } else if (manual) {
        toast.success("You're on the latest version!", {
          description: `Current version ${CURRENT_VERSION} is up to date.`
        });
      }
    } catch (error) {
      console.error('Update check failed:', error);
      if (manual) toast.error("Check failed. Please check your internet connection.");
    } finally {
      if (manual) setChecking(false);
    }
  }, [setChecking, setUpdateAvailable]);

  useEffect(() => {
    // Initial check (respecting platform rules inside checkForUpdates)
    checkForUpdates();
    const interval = setInterval(() => checkForUpdates(), 4 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkForUpdates]);

  return { isChecking, checkForUpdates };
};
