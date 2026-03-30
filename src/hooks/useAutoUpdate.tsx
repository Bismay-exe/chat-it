import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Download } from 'lucide-react';

// This should match the latest STABLE tag you've released (e.g., v1.0.0)
// For beta builds, the CI/CD will append -beta.RUN_ID
export const CURRENT_VERSION = 'v1.0.0'; 
const GITHUB_REPO = 'Bismay-exe/chat-it';

export const useAutoUpdate = () => {
  const [isChecking, setIsChecking] = useState(false);

  const checkForUpdates = useCallback(async (manual = false) => {
    const channel = localStorage.getItem('chat-it-update-channel') || 'stable';
    if (manual) setIsChecking(true);

    try {
      // For 'stable', releases/latest only returns non-prereleases
      // For 'beta', we need the first item from the full releases list
      const url = channel === 'stable' 
        ? `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
        : `https://api.github.com/repos/${GITHUB_REPO}/releases`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch releases');
      
      const data = await response.json();
      const latestRelease = Array.isArray(data) ? data[0] : data;
      const latestVersion = latestRelease.tag_name;

      if (latestVersion && latestVersion !== CURRENT_VERSION) {
        const apkAsset = latestRelease.assets.find((asset: any) => asset.name.endsWith('.apk'));
        const downloadUrl = apkAsset ? apkAsset.browser_download_url : latestRelease.html_url;

        toast.info(`New ${channel.charAt(0).toUpperCase() + channel.slice(1)} Update (${latestVersion})`, {
          description: "A newer version is available. Download the latest APK to stay up to date.",
          duration: manual ? 15000 : 8000,
          action: {
            label: "Download",
            onClick: () => window.open(downloadUrl, '_blank')
          },
          icon: <Download className="w-4 h-4" />
        });
      } else if (manual) {
        toast.success("You're on the latest version!", {
           description: `Current version ${CURRENT_VERSION} is up to date.`
        });
      }
    } catch (error) {
      console.error('Update check failed:', error);
      if (manual) toast.error("Check failed. Please check your internet connection.");
    } finally {
      if (manual) setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    // Check on mount
    checkForUpdates();
    const interval = setInterval(() => checkForUpdates(), 4 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkForUpdates]);

  return { isChecking, checkForUpdates };
};
