import React, { useState, useEffect, useRef } from 'react';
import { useUpdateStore } from '@/stores/updateStore';
import { Download, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

type DownloadState = 'idle' | 'downloading' | 'saving' | 'done' | 'error';

export const UpdateScreen: React.FC = () => {
  const { updateAvailable, latestVersion, downloadUrl, releaseNotes, channel, closeUpdate, autoStartDownload } = useUpdateStore();

  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<DownloadState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const autoStartFired = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-start download if flagged (from "Install Latest" button in AboutPage)
  useEffect(() => {
    if (updateAvailable && downloadUrl && autoStartDownload && !autoStartFired.current && state === 'idle') {
      autoStartFired.current = true;
      handleDownload();
    }
  }, [updateAvailable, downloadUrl, autoStartDownload]);

  // Reset ref when update screen closes
  useEffect(() => {
    if (!updateAvailable) {
      autoStartFired.current = false;
      setState('idle');
      setProgress(0);
      setErrorMsg('');
    }
  }, [updateAvailable]);

  if (!updateAvailable) return null;

  const handleDownload = async () => {
    if (!downloadUrl || state === 'downloading' || state === 'saving') return;

    setState('downloading');
    setProgress(0);
    setErrorMsg('');

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      // fetch() correctly follows GitHub's redirect chain (302 → CDN → S3)
      // XHR in Android WebView often fails silently on these redirects
      const response = await fetch(downloadUrl, {
        signal: abort.signal,
        redirect: 'follow',
      });

      if (!response.ok) throw new Error(`Server returned ${response.status}`);

      // Stream the response body to track real download progress
      const contentLength = Number(response.headers.get('content-length') || 0);
      const reader = response.body!.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (contentLength > 0) {
          setProgress(Math.min(Math.round((received / contentLength) * 100), 99));
        } else {
          // No content-length header — show indeterminate progress
          setProgress(prev => Math.min(prev + 2, 90));
        }
      }

      setProgress(99);
      setState('saving');

      // Combine chunks into a single Uint8Array, then convert to base64
      const total = chunks.reduce((acc, c) => acc + c.length, 0);
      const combined = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }

      // Convert to base64 via FileReader (most compatible with Capacitor)
      const blob = new Blob([combined], { type: 'application/vnd.android.package-archive' });
      const base64Data = await blobToBase64(blob);
      const fileName = `chat-it-${channel}-${latestVersion}.apk`;

      if (Capacitor.isNativePlatform()) {
        // Write to app's own external files dir — works on Android 10+ without special permissions
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.External,  // App's own external dir, no MANAGE_EXTERNAL_STORAGE needed
          recursive: true,
        });

        // Get the actual URI so we can prompt install
        const { uri } = await Filesystem.getUri({
          path: fileName,
          directory: Directory.External,
        });

        setProgress(100);
        setState('done');

        // Open the APK using '_system' — Capacitor intercepts this target
        // and fires Intent.ACTION_VIEW on Android, triggering the package installer
        setTimeout(() => {
          window.open(uri, '_system');
        }, 500);

      } else {
        // Web fallback — trigger browser download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        setProgress(100);
        setState('done');
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setState('idle');
        setProgress(0);
        return;
      }
      console.error('Update download failed:', err);
      setErrorMsg(err.message || 'Unknown error');
      setState('error');
      toast.error('Download failed: ' + (err.message || 'Unknown error'));
    } finally {
      abortRef.current = null;
    }
  };

  const cancelDownload = () => {
    abortRef.current?.abort();
    setState('idle');
    setProgress(0);
    toast.info('Update cancelled');
  };

  const retry = () => {
    setState('idle');
    setProgress(0);
    setErrorMsg('');
    handleDownload();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-6 animate-in slide-in-from-bottom-full duration-500">
      {/* Top Text */}
      <h1 className="text-2xl font-black mb-12 tracking-tighter">Update Chat-It</h1>

      {/* Big Logo */}
      <div className="w-32 h-32 bg-primary rounded-4xl flex items-center justify-center shadow-2xl shadow-primary/30 mb-8 animate-bounce" style={{ animationDuration: '3s' }}>
        <img src="/logo/chat-it-logo.svg" alt="Chat-It" className="h-16 xdark:invert" />
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

        {/* Downloading */}
        {(state === 'downloading' || state === 'saving') && (
          <div className="w-full flex flex-col items-center gap-3">
            <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex w-full justify-between items-center px-1">
              <span className="text-sm font-bold text-primary">
                {state === 'saving' ? 'Saving…' : `${progress}%`}
              </span>
              <button onClick={cancelDownload} className="text-xs font-bold text-muted-foreground hover:text-red-500 uppercase flex items-center gap-1 transition-colors">
                <X className="w-3 h-3" /> Cancel
              </button>
            </div>
          </div>
        )}

        {/* Done */}
        {state === 'done' && (
          <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <p className="text-sm font-bold text-center">Downloaded! Opening installer…</p>
            <p className="text-xs text-muted-foreground text-center">If the installer doesn't open, go to your Files app and tap the APK.</p>
            <button onClick={closeUpdate} className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-2">
              Dismiss
            </button>
          </div>
        )}

        {/* Error */}
        {state === 'error' && (
          <div className="flex flex-col items-center gap-3 animate-in fade-in duration-300">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <p className="text-sm font-bold text-red-500 text-center">Download Failed</p>
            {errorMsg && <p className="text-xs text-muted-foreground text-center line-clamp-2">{errorMsg}</p>}
            <div className="flex gap-3 w-full mt-1">
              <button onClick={retry} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Retry
              </button>
              <button onClick={closeUpdate} className="flex-1 bg-secondary text-foreground py-3 rounded-xl font-bold text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Idle — show Download button */}
        {state === 'idle' && (
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

/** Convert a Blob to base64 string (without the data:...;base64, prefix) */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip the data URL prefix to get just the base64 data
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
