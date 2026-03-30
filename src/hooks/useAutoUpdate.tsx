import { useEffect } from 'react';
import { toast } from 'sonner';
import { Download } from 'lucide-react';

const CURRENT_VERSION = 'v1.0.0'; // We'll manually increment this when building
const GITHUB_REPO = 'Bismay-exe/chat-it';

export const useAutoUpdate = () => {
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
        if (!response.ok) return;
        
        const data = await response.json();
        const latestVersion = data.tag_name;
        
        if (latestVersion && latestVersion !== CURRENT_VERSION) {
          const apkAsset = data.assets.find((asset: any) => asset.name.endsWith('.apk'));
          const downloadUrl = apkAsset ? apkAsset.browser_download_url : data.html_url;

          toast.info(`New Version Available (${latestVersion})`, {
            description: "A newer version of Chat-It is available. Download the latest APK to get new features and fixes.",
            duration: 10000,
            action: {
              label: "Download",
              onClick: () => window.open(downloadUrl, '_blank')
            },
            icon: <Download className="w-4 h-4" />
          });
        }
      } catch (error) {
        console.error('Failed to check for updates:', error);
      }
    };

    // Check once on mount
    checkForUpdates();
    
    // Then every 4 hours
    const interval = setInterval(checkForUpdates, 4 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
};
