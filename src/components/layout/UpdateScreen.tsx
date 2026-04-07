import React, { useState, useEffect } from 'react';
import { useUpdateStore } from '@/stores/updateStore';
import { Download, X } from 'lucide-react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { toast } from 'sonner';

export const UpdateScreen: React.FC = () => {
  const { updateAvailable, latestVersion, downloadUrl, releaseNotes, channel, closeUpdate, autoStartDownload } = useUpdateStore();

  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [xhr, setXhr] = useState<XMLHttpRequest | null>(null);

  if (!updateAvailable) return null;

  useEffect(() => {
    if (updateAvailable && downloadUrl && autoStartDownload && downloadProgress === null) {
      handleDownload();
    }
  }, [updateAvailable, downloadUrl, autoStartDownload]);

  const handleDownload = async () => {
    if (!downloadUrl || downloadProgress !== null) return;

    const request = new XMLHttpRequest();
    setXhr(request);
    setDownloadProgress(0);

    request.open('GET', downloadUrl, true);
    request.responseType = 'blob';

    request.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setDownloadProgress(percent);
      }
    };

    request.onload = async () => {
      if (request.status === 200) {
        const blob = request.response;
        const fileName = `chat-it-${channel}-${latestVersion}.apk`;

        try {
          // Native file save
          const permissions = await Filesystem.checkPermissions();
          if (permissions.publicStorage !== 'granted') await Filesystem.requestPermissions();

          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            await Filesystem.writeFile({
              path: `Download/${fileName}`,
              data: base64Data,
              directory: Directory.ExternalStorage,
              recursive: true
            });

            toast.success('Update downloaded!', {
              description: `Saved to Downloads folder as ${fileName}. Please open your file manager to install it.`,
              duration: 8000
            });
            setDownloadProgress(null);
            closeUpdate();
          };
          reader.readAsDataURL(blob);
        } catch (err: any) {
          toast.error('Download failed: ' + err.message);
          setDownloadProgress(null);
        }
      } else {
        toast.error('Download failed');
        setDownloadProgress(null);
      }
      setXhr(null);
    };

    request.onerror = () => {
      toast.error('Network error. Check your connection.');
      setDownloadProgress(null);
      setXhr(null);
    };

    request.send();
  };

  const cancelDownload = () => {
    if (xhr) {
      xhr.abort();
      setDownloadProgress(null);
      setXhr(null);
      toast.info('Update cancelled');
    }
  };

  return (
    <div className="fixed inset-0 z-9999 bg-background flex flex-col items-center justify-center p-6 animate-in slide-in-from-bottom-full duration-500">
      {/* Top Text */}
      <h1 className="text-2xl font-black mb-12 tracking-tighter">Update Chat-It</h1>

      {/* Big Logo */}
      <div className="w-32 h-32 bg-primary rounded-[3rem] flex items-center justify-center shadow-2xl shadow-primary/30 mb-8 animate-bounce" style={{ animationDuration: '3s' }}>
        <img src="/logo/chat-it-logo.svg" alt="Chat-It" className="h-16 w-auto xdark:invert" />
      </div>

      {/* Texts Below Logo */}
      <div className="text-center max-w-sm mb-12 flex flex-col gap-2">
        <h2 className="text-xl font-bold">New Version Available</h2>
        <div className="inline-flex items-center justify-center">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold font-mono">
            {latestVersion} ({channel})
          </span>
        </div>
        <p className="text-muted-foreground text-sm mt-4">
          Chat-It has a new update with fresh features, improved speed, and bug fixes.
          {releaseNotes && (
            <span className="block mt-2 opacity-80 italic line-clamp-3">"{releaseNotes}"</span>
          )}
        </p>
      </div>

      {/* Button & Progress Area */}
      <div className="w-full max-w-xs mt-auto mb-8 flex flex-col gap-4">
        {downloadProgress !== null ? (
          <div className="w-full flex flex-col items-center gap-3">
            <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            <div className="flex w-full justify-between items-center px-1">
              <span className="text-sm font-bold text-primary">{downloadProgress}%</span>
              <button onClick={cancelDownload} className="text-xs font-bold text-muted-foreground hover:text-red-500 uppercase flex items-center gap-1 transition-colors">
                <X className="w-3 h-3" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              onClick={handleDownload}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
            >
              <Download className="w-5 h-5" />
              Download Update
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
