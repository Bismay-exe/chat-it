import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  Check, 
  CheckCheck, 
  RefreshCw, 
  Download, 
  Play, 
  MoreHorizontal, 
  Share2, 
  Trash2, 
  Info, 
  FolderDown,
  X,
  FileText
} from 'lucide-react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { toast } from 'sonner';
import { DropdownMenu } from '@/components/ui/DropdownMenu';

export interface MessageBubbleProps {
  id: string;
  content: string;
  type?: 'text' | 'image' | 'video' | 'file';
  media_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  timestamp: string;
  isSentByMe: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  senderName?: string;
  isSequence?: boolean;
  highlight?: string | boolean;
  isCurrentHighlight?: boolean;
  onDelete?: (id: string) => void;
}

const formatBytes = (bytes: number, decimals = 1) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const ProgressCircle = ({ progress, size = 48, strokeWidth = 3, isDownloading = false, onCancel }: { 
  progress: number, 
  size?: number, 
  strokeWidth?: number,
  isDownloading: boolean,
  onCancel?: () => void
}) => {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center group/btn cursor-pointer" onClick={(e) => {
      e.stopPropagation();
      if (isDownloading && onCancel) onCancel();
    }}>
      <div className="absolute inset-0 bg-black/40 rounded-full backdrop-blur-sm group-hover/btn:bg-black/50 transition-colors" />
      <svg width={size} height={size} className="relative z-10 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.2)" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="white"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-150"
        />
      </svg>
      <div className="absolute inset-0 z-20 flex items-center justify-center text-white">
        {isDownloading ? <X className="w-5 h-5 fill-white" /> : <Download className="w-5 h-5 fill-white" />}
      </div>
    </div>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({
  id, content, type = 'text', media_url, file_name, file_size, timestamp, isSentByMe, status, senderName, isSequence = false, highlight, isCurrentHighlight = false, onDelete
}) => {
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [xhr, setXhr] = useState<XMLHttpRequest | null>(null);

  const handleDownload = useCallback(async (saveAs = false) => {
    if (!media_url || downloadProgress !== null) return;

    const isMobile = (window as any).Capacitor?.isNative;
    const request = new XMLHttpRequest();
    setXhr(request);
    setDownloadProgress(0);

    request.open('GET', media_url, true);
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
        const fileName = file_name || `file_${Date.now()}`;

        if (isMobile) {
          try {
            const permissions = await Filesystem.checkPermissions();
            if (permissions.publicStorage !== 'granted') await Filesystem.requestPermissions();

            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64Data = (reader.result as string).split(',')[1];
              const savedFile = await Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Documents,
                recursive: true
              });

              if (saveAs) {
                await Share.share({ title: fileName, url: savedFile.uri });
              } else {
                toast.success('Saved to Documents');
              }
              setDownloadProgress(null);
            };
            reader.readAsDataURL(blob);
          } catch (err: any) {
            toast.error('Mobile save failed: ' + err.message);
            setDownloadProgress(null);
          }
        } else {
          try {
            if (saveAs && 'showSaveFilePicker' in window) {
              const handle = await (window as any).showSaveFilePicker({ suggestedName: fileName });
              const writable = await handle.createWritable();
              await writable.write(blob);
              await writable.close();
              toast.success('File saved');
            } else {
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              toast.success('Download started');
            }
          } catch (err: any) {
            if (err.name !== 'AbortError') toast.error('Web save failed');
          } finally {
            setDownloadProgress(null);
          }
        }
      } else {
        toast.error('Download failed');
        setDownloadProgress(null);
      }
      setXhr(null);
    };

    request.onerror = () => {
      toast.error('Network error');
      setDownloadProgress(null);
      setXhr(null);
    };

    request.send();
  }, [media_url, file_name, downloadProgress]);

  const cancelDownload = () => {
    if (xhr) {
      xhr.abort();
      setDownloadProgress(null);
      setXhr(null);
      toast.info('Cancelled');
    }
  };

  const handleShare = async () => {
    if (!media_url) return;
    try {
      await Share.share({ title: file_name || 'File', text: content, url: media_url });
    } catch {
      navigator.clipboard.writeText(media_url);
      toast.success('Copied link');
    }
  };

  const menuItems = [
    ...(type !== 'text' ? [
      { label: 'Save to...', icon: <FolderDown className="w-4 h-4" />, onClick: () => handleDownload(true) },
      { label: 'Share', icon: <Share2 className="w-4 h-4" />, onClick: handleShare },
      { divider: true },
      { label: 'File Info', icon: <Info className="w-4 h-4" />, onClick: () => toast.info(`${file_name} (${formatBytes(file_size || 0)})`) },
    ] : []),
    { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, textClass: 'text-red-500', onClick: () => onDelete?.(id) },
  ];

  return (
    <div className={cn("flex flex-col w-full px-4 group", isSentByMe ? "items-end" : "items-start", isSequence ? "mt-1" : "mt-6")}>
      {!isSentByMe && senderName && !isSequence && <span className="text-[11px] text-muted-foreground ml-1 mb-1 font-bold uppercase tracking-tighter opacity-70">{senderName}</span>}
      <div className="flex items-end gap-1 max-w-[85%] md:max-w-[75%] group/bubble relative">
        <div className={cn(
          "relative px-4 py-2.5 text-[15px] leading-snug transition-all duration-300 shadow-sm flex flex-col min-w-45",
          isSentByMe ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm" : "bg-card border border-border text-foreground rounded-2xl rounded-tl-sm text-left",
          isCurrentHighlight && "ring-2 ring-accent ring-offset-2 ring-offset-background scale-[1.02]",
          (type === 'image' || type === 'video') && "p-1 overflow-hidden"
        )}>
          {/* Action Menu Inside Bubble */}
          <div className="absolute top-1.5 right-1.5 z-30 opacity-0 group-hover/bubble:opacity-100 transition-opacity">
            <DropdownMenu items={menuItems} icon={<MoreHorizontal className="w-5 h-5 bg-black/10 hover:bg-black/30 text-white rounded-full p-1 backdrop-blur-sm" />} />
          </div>

          {type === 'text' ? (
            <p className="whitespace-pre-wrap wrap-break-word px-1 pr-6">
              {highlight && typeof highlight === 'string' ? content.split(new RegExp(`(${highlight})`, 'gi')).map((p, i) => p.toLowerCase() === highlight.toLowerCase() ? <span key={i} className="bg-accent text-accent-foreground font-bold px-0.5">{p}</span> : p) : content}
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {type === 'image' && media_url && (
                <div className="relative group/media rounded-xl overflow-hidden bg-black/5 aspect-square max-h-80 shadow-inner">
                  <img src={media_url} alt="Shared" className="w-full h-full object-cover" />
                  {!isSentByMe && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                      <ProgressCircle progress={downloadProgress || 0} isDownloading={downloadProgress !== null} onCancel={cancelDownload} />
                    </div>
                  )}
                </div>
              )}
              {type === 'video' && media_url && (
                <div className="relative group/media rounded-xl overflow-hidden bg-black/5 aspect-video max-h-80 flex items-center justify-center shadow-inner">
                  <video src={media_url} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    {!isSentByMe ? (
                      downloadProgress !== null ? <ProgressCircle progress={downloadProgress} isDownloading={true} onCancel={cancelDownload} /> : (
                        <div className="w-14 h-14 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm cursor-pointer hover:bg-black/60 transition-colors shadow-xl" onClick={() => handleDownload()}>
                          <Play className="w-7 h-7 text-white fill-white ml-0.5" />
                        </div>
                      )
                    ) : <Play className="w-10 h-10 text-white/30" />}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/50 px-2 py-1 rounded text-[10px] text-white backdrop-blur-md font-bold tracking-tight">
                    {formatBytes(file_size || 0)}
                  </div>
                </div>
              )}
              {type === 'file' && (
                <div className={cn("flex items-center gap-4 p-2.5 rounded-xl transition-colors", !isSentByMe ? "cursor-pointer hover:bg-secondary/20" : "bg-primary-foreground/5")} onClick={() => !isSentByMe && handleDownload()}>
                  <div className="shrink-0 relative">
                    {!isSentByMe ? (
                      <ProgressCircle progress={downloadProgress || 0} size={44} strokeWidth={2.5} isDownloading={downloadProgress !== null} onCancel={cancelDownload} />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-primary-foreground/10 flex items-center justify-center shadow-inner">
                        <FileText className="w-5 h-5 text-primary-foreground/70" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 pr-6">
                    <span className="text-[14px] font-bold truncate tracking-tight">{file_name || 'Document'}</span>
                    <span className="text-[11px] opacity-70 font-bold uppercase tracking-tighter">
                      {formatBytes(file_size || 0)} • {downloadProgress !== null ? `${downloadProgress}%` : (isSentByMe ? 'Cloud Stored' : 'Download')}
                    </span>
                  </div>
                </div>
              )}
              {content && <p className="mt-1 px-1 text-[14px] whitespace-pre-wrap opacity-90 pr-6">{content}</p>}
            </div>
          )}

          <div className={cn("flex items-center gap-1 mt-1.5 text-[10px] self-end pr-0.5 opacity-60 font-bold", isSentByMe ? "text-primary-foreground" : "text-muted-foreground")}>
            <span>{timestamp}</span>
            {isSentByMe && status && (
              <span className="flex items-center">
                {status === 'read' ? <CheckCheck className="w-3.5 h-3.5 text-blue-300" /> : status === 'delivered' ? <CheckCheck className="w-3.5 h-3.5" /> : status === 'sending' ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
