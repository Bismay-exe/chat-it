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
  X
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

// Helper to format bytes like Telegram
const formatBytes = (bytes: number, decimals = 1) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

// Circular Progress Component
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
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={strokeWidth}
          fill="none"
        />
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
        {isDownloading ? (
          <X className="w-5 h-5 fill-white" />
        ) : (
          <Download className="w-5 h-5 fill-white" />
        )}
      </div>
    </div>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({
  id,
  content,
  type = 'text',
  media_url,
  file_name,
  file_size,
  timestamp,
  isSentByMe,
  status,
  senderName,
  isSequence = false,
  highlight,
  isCurrentHighlight = false,
  onDelete
}) => {
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [xhr, setXhr] = useState<XMLHttpRequest | null>(null);

  const handleDownload = useCallback(async (saveAs = false) => {
    if (!media_url || downloadProgress !== null) return;

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

        // Platform detection
        const isMobile = (window as any).Capacitor?.isNative;

        if (isMobile) {
          try {
            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64Data = (reader.result as string).split(',')[1];
              
              // On Mobile, we often just save to Documents or use Share API for "Save To"
              const savedFile = await Filesystem.writeFile({
                path: fileName,
                data: base64Data,
                directory: Directory.Documents,
                recursive: true
              });

              if (saveAs) {
                // If user specifically asked for "Save As", we can share the local file URI
                await Share.share({
                  title: fileName,
                  url: savedFile.uri,
                });
              } else {
                toast.success('Saved to Documents');
              }
            };
            reader.readAsDataURL(blob);
          } catch (err: any) {
            toast.error('Mobile save failed: ' + err.message);
          }
        } else {
          // Web version
          if (saveAs && 'showSaveFilePicker' in window) {
            try {
              const handle = await (window as any).showSaveFilePicker({
                suggestedName: fileName,
              });
              const writable = await handle.createWritable();
              await writable.write(blob);
              await writable.close();
              toast.success('File saved successfully');
            } catch (err: any) {
              if (err.name !== 'AbortError') toast.error('Web save failed');
            }
          } else {
            // Standard browser download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Download started');
          }
        }
      }
      setDownloadProgress(null);
      setXhr(null);
    };

    request.onerror = () => {
      toast.error('Download failed');
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
      toast.info('Download cancelled');
    }
  };

  const handleShare = async () => {
    if (!media_url) return;
    try {
      await Share.share({
        title: file_name || 'Shared File',
        text: content,
        url: media_url,
      });
    } catch (err) {
      // Fallback to clipboard
      navigator.clipboard.writeText(media_url);
      toast.success('Link copied to clipboard');
    }
  };

  const menuItems = [
    { label: 'Save to...', icon: <FolderDown className="w-4 h-4" />, onClick: () => handleDownload(true) },
    { label: 'Share', icon: <Share2 className="w-4 h-4" />, onClick: handleShare },
    { divider: true },
    { label: 'About File', icon: <Info className="w-4 h-4" />, onClick: () => toast.info(`Name: ${file_name}\nSize: ${formatBytes(file_size || 0)}`) },
    { label: 'Delete', icon: <Trash2 className="w-4 h-4" />, textClass: 'text-red-500', onClick: () => onDelete?.(id) },
  ];

  return (
    <div className={cn("flex flex-col w-full px-4 group", isSentByMe ? "items-end" : "items-start", isSequence ? "mt-1" : "mt-4")}>
      {!isSentByMe && senderName && !isSequence && (
        <span className="text-xs text-muted-foreground ml-1 mb-1 font-medium">{senderName}</span>
      )}
      
      <div className="flex items-start gap-2 max-w-[85%] md:max-w-[70%]">
        {!isSentByMe && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center">
            <DropdownMenu items={menuItems} icon={<MoreHorizontal className="w-4 h-4" />} />
          </div>
        )}

        <div 
          className={cn(
            "relative px-3 py-2 text-[15px] leading-relaxed premium-transition shadow-sm flex flex-col",
            isSentByMe 
              ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm" 
              : "bg-card border border-border text-foreground rounded-2xl rounded-tl-sm",
            isCurrentHighlight && "ring-2 ring-accent ring-offset-2 ring-offset-background scale-[1.02]",
            (type === 'image' || type === 'video') && "p-1 overflow-hidden"
          )}
        >
          {type === 'text' ? (
            <p className="whitespace-pre-wrap wrap-break-word px-1">
              {highlight && typeof highlight === 'string' ? (
                content.split(new RegExp(`(${highlight})`, 'gi')).map((part, i) => 
                  part.toLowerCase() === highlight.toLowerCase() 
                    ? <span key={i} className="bg-accent text-accent-foreground font-bold rounded-sm px-0.5">{part}</span> 
                    : part
                )
              ) : highlight ? (
                 <span className="bg-accent/30 rounded-sm">{content}</span>
              ) : (
                content
              )}
            </p>
          ) : (
            <div className="flex flex-col gap-1 min-w-45">
              {type === 'image' && media_url && (
                <div className="relative group/media rounded-xl overflow-hidden bg-black/5 aspect-square max-h-80">
                  <img src={media_url} alt="Shared" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ProgressCircle 
                      progress={downloadProgress || 0} 
                      isDownloading={downloadProgress !== null} 
                      onCancel={cancelDownload}
                    />
                  </div>
                </div>
              )}
              
              {type === 'video' && media_url && (
                <div className="relative group/media rounded-xl overflow-hidden bg-black/5 aspect-video max-h-80 flex items-center justify-center">
                  <video src={media_url} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    {downloadProgress !== null ? (
                       <ProgressCircle 
                        progress={downloadProgress} 
                        isDownloading={true} 
                        onCancel={cancelDownload}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm cursor-pointer" onClick={() => handleDownload()}>
                        <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/40 px-1.5 py-0.5 rounded text-[10px] text-white backdrop-blur-sm font-bold">
                    {formatBytes(file_size || 0)}
                  </div>
                </div>
              )}

              {type === 'file' && (
                <div className="flex items-center gap-3 p-2 group/file cursor-pointer" onClick={() => handleDownload()}>
                  <div className="shrink-0">
                    <ProgressCircle 
                      progress={downloadProgress || 0} 
                      size={42} 
                      strokeWidth={2.5}
                      isDownloading={downloadProgress !== null}
                      onCancel={cancelDownload}
                    />
                  </div>
                  <div className="flex flex-col min-w-0 pr-4">
                    <span className="text-[14px] font-bold truncate leading-tight">{file_name || 'Document'}</span>
                    <span className="text-[11px] opacity-70 font-medium">
                      {formatBytes(file_size || 0)} • {downloadProgress !== null ? `${downloadProgress}%` : 'Click to download'}
                    </span>
                  </div>
                </div>
              )}

              {content && <p className="mt-1.5 px-1.5 text-sm whitespace-pre-wrap">{content}</p>}
            </div>
          )}

          <div className={cn(
            "flex items-center gap-1 mt-1 text-[10px] self-end pr-1",
            isSentByMe ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            <span>{timestamp}</span>
            {isSentByMe && status && (
              <span className="flex items-center">
                {status === 'read' ? (
                  <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                ) : status === 'delivered' ? (
                  <CheckCheck className="w-3.5 h-3.5 opacity-70" />
                ) : status === 'sent' ? (
                  <Check className="w-3.5 h-3.5 opacity-70" />
                ) : status === 'sending' ? (
                  <RefreshCw className="w-2.5 h-2.5 animate-spin opacity-50" />
                ) : (
                  <Check className="w-3.5 h-3.5 opacity-70" />
                )}
              </span>
            )}
          </div>
        </div>

        {isSentByMe && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center">
            <DropdownMenu items={menuItems} icon={<MoreHorizontal className="w-4 h-4" />} />
          </div>
        )}
      </div>
    </div>
  );
});
