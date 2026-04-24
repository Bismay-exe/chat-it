import React, { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  FileText,
  Eye
} from 'lucide-react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { toast } from 'sonner';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Avatar } from '@/components/ui/Avatar';
import { useUploadStore } from '@/stores/uploadStore';

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
  uploadProgress?: number;
  senderName?: string;
  senderAvatar?: string | null;
  isSequence?: boolean;
  isLastInSequence?: boolean;
  showSenderName?: boolean; // <-- ADD THIS
  showMetadata?: boolean; // <-- ADD THIS
  highlight?: string | boolean;
  activeMatchWithinMessage?: number;
  onDelete?: (id: string) => void;
  hideAvatar?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  isSelectionMode?: boolean;
  isSystemMessage?: boolean;
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
  id, content, type = 'text', media_url, file_name, file_size, timestamp, isSentByMe, showSenderName, showMetadata, status, uploadProgress, senderName, senderAvatar, isSequence = false, isLastInSequence = false, highlight, activeMatchWithinMessage = -1, onDelete, hideAvatar = false, isSelected = false, onSelect, isSelectionMode = false, isSystemMessage = false
}) => {

  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [xhr, setXhr] = useState<XMLHttpRequest | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const longPressTimer = useRef<any>(null);
  const isLongPress = useRef(false);

  const startLongPress = useCallback(() => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      if (onSelect) onSelect(id);
    }, 500);
  }, [id, onSelect]);

  const endLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (isSelectionMode && onSelect) {
      onSelect(id);
    }
  }, [id, onSelect, isSelectionMode]);

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

  const bubbleContent = (
    <div
      onClick={handleClick}
      onPointerDown={startLongPress}
      onPointerUp={endLongPress}
      onPointerLeave={endLongPress}
      className={cn(
        "flex flex-col max-w-[calc(100%-5rem)] md:max-w-[75%] group/bubble relative min-w-0 w-full transition-transform active:scale-[0.99]",
        isSentByMe ? "items-end" : "items-start"
      )}
    >
      {/* Sender Name for groups (Moved outside bubble for cleaner look) */}
      {/* UPDATE 1: Use showSenderName for the Sender Name */}
      {!isSentByMe && senderName && (showSenderName ?? !isSequence) && (
        <div className="flex items-center gap-1.5 mb-1.5 px-1">
          <span className="text-[14px] font-serif text-[#1c1c1a]">{senderName}</span>
          {isSystemMessage && (
            <span className="text-[9px] font-black bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-sm border border-blue-500/20 scale-90 -translate-x-0.5">OFFICIAL</span>
          )}
        </div>
      )}


      {/* THE ELEGANT BUBBLE */}
      <div className={cn(
        "relative text-[15px] leading-normal tracking-[-0.01em] transition-all duration-300 flex flex-col min-w-12",
        type === 'text' ? "px-4 py-3" : "p-1.5", // Media gets tighter padding to look like a frame

        isSentByMe
          ? cn(
            "bg-[#1C1C1E] text-white shadow-[0_8px_24px_rgba(28,28,30,0.12)]",
            "rounded-2xl",
            isLastInSequence ? "rounded-br-sm" : "rounded-br-2xl",
            isSelected && "ring-2 ring-zinc-800 scale-[0.99] opacity-90"
          )
          : cn(
            "bg-white text-[#333333] border border-black/3 shadow-[0_8px_30px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)]",
            "rounded-2xl",
            isLastInSequence ? "rounded-bl-sm" : "rounded-bl-2xl",
            isSelected && "ring-2 ring-zinc-300 scale-[0.99] bg-zinc-50"
          )
      )}>

        {/* Selection Checkmark - Monochrome theme */}
        {isSelected && (
          <div className={cn(
            "absolute -left-3 -top-3 z-40 w-6 h-6 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-200 shadow-md border border-white/10",
            isSentByMe ? "bg-[#1C1C1E] text-white" : "bg-white text-black"
          )}>
            <Check className="w-3.5 h-3.5 stroke-3" />
          </div>
        )}

        {/* Action Menu - Monochrome theme */}
        {!isSelectionMode && (
          <div className={cn(
            "absolute -top-3 -right-3 z-30 opacity-0 group-hover/bubble:opacity-100 transition-opacity hidden md:block"
          )}>
            <DropdownMenu items={menuItems} icon={<MoreHorizontal className={cn("w-7 h-7 rounded-full p-1.5 shadow-sm border border-white/10", isSentByMe ? "bg-[#2C2C2E] text-white hover:bg-[#3C3C3E]" : "bg-white text-zinc-600 hover:bg-zinc-50")} />} />
          </div>
        )}

        {/* Text Content */}
        {type === 'text' && (
          <p className="whitespace-pre-wrap wrap-break-words break-all min-w-0 max-w-full">
            {(() => {
              if (highlight && typeof highlight === 'string') {
                const parts = content.split(new RegExp(`(${highlight})`, 'gi'));
                let currentOffset = 0;
                return parts.map((part, i) => {
                  const isMatch = part.toLowerCase() === highlight.toLowerCase();
                  const isActive = isMatch && currentOffset === activeMatchWithinMessage;
                  const element = isMatch ? (
                    <span
                      key={i}
                      id={isActive ? "active-search-match" : undefined}
                      className={cn(
                        "transition-all duration-300 rounded-sm font-semibold",
                        isActive ? "bg-yellow-300 text-yellow-900 px-1" : "bg-zinc-200 text-zinc-900 px-0.5",
                        isSentByMe && !isActive && "bg-zinc-700 text-white"
                      )}
                    >
                      {part}
                    </span>
                  ) : part;
                  currentOffset += part.length;
                  return element;
                });
              }
              return content;
            })()}
          </p>
        )}

        {/* Media Content */}
        {type !== 'text' && (
          <div className="flex flex-col gap-1.5 relative w-full">
            {type === 'image' && media_url && (
              <>
                <div onClick={() => setIsViewerOpen(true)} className="relative group/media rounded-xl overflow-hidden bg-black/5 aspect-square max-h-80 cursor-pointer">
                  <img src={media_url} alt="Shared" loading="lazy" className="w-full h-full object-cover" />
                  {!isSentByMe && downloadProgress !== null && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                      <ProgressCircle progress={downloadProgress || 0} isDownloading={true} onCancel={cancelDownload} />
                    </div>
                  )}
                  {/* Internal Upload Progress overlay */}
                  {isSentByMe && status === 'sending' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                      {uploadProgress !== undefined ? (
                        <span className="flex flex-col items-center gap-2 pointer-events-auto text-white">
                          <span className="font-bold tracking-tighter">{uploadProgress}%</span>
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); useUploadStore.getState().cancelUpload(id); }} className="bg-white/20 rounded-full p-2 hover:bg-white/30 transition-colors cursor-pointer" aria-label="Cancel upload">
                            <X className="w-4 h-4" />
                          </button>
                        </span>
                      ) : <RefreshCw className="w-6 h-6 animate-spin text-white" />}
                    </div>
                  )}
                </div>
                {/* Expanded Viewer */}
                {isViewerOpen && createPortal(
                  <div className="fixed inset-0 z-100 bg-[#09090B]/95 flex items-center justify-center p-2 animate-in fade-in duration-200" onClick={() => setIsViewerOpen(false)}>
                    <button onClick={(e) => { e.stopPropagation(); setIsViewerOpen(false); }} className="absolute top-6 right-6 z-50 p-3 bg-white/10 rounded-full hover:bg-white/20 text-white backdrop-blur-md transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                    <img src={media_url} alt="Expanded" className="max-w-full max-h-full object-contain cursor-default rounded-lg" onClick={(e) => e.stopPropagation()} />
                  </div>,
                  document.body
                )}
              </>
            )}

            {type === 'video' && media_url && (
              <>
                <div className="relative group/media rounded-xl overflow-hidden bg-black/5 aspect-video max-h-80 flex items-center justify-center cursor-pointer" onClick={() => setIsViewerOpen(true)}>
                  <video
                    src={media_url}
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    {!isSentByMe ? (
                      downloadProgress !== null ? <ProgressCircle progress={downloadProgress} isDownloading={true} onCancel={cancelDownload} /> : (
                        <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white transition-colors shadow-lg">
                          <Play className="w-6 h-6 text-black fill-black ml-1" />
                        </div>
                      )
                    ) : <Play className="w-10 h-10 text-white/50 fill-white/50" />}
                  </div>
                </div>
                {/* Expanded Viewer */}
                {isViewerOpen && createPortal(
                  <div className="fixed inset-0 z-100 bg-[#09090B]/95 flex items-center justify-center p-2 animate-in fade-in duration-200" onClick={() => setIsViewerOpen(false)}>
                    <button onClick={(e) => { e.stopPropagation(); setIsViewerOpen(false); }} className="absolute top-6 right-6 z-50 p-3 bg-white/10 rounded-full hover:bg-white/20 text-white backdrop-blur-md transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                    <video src={media_url} controls autoPlay className="max-w-full max-h-full object-contain cursor-default rounded-lg" onClick={(e) => e.stopPropagation()} />
                  </div>,
                  document.body
                )}
              </>
            )}

            {type === 'file' && (
              <div className={cn("flex items-center gap-4 p-2 rounded-xl transition-colors", !isSentByMe ? "cursor-pointer hover:bg-black/5" : "bg-white/10")} onClick={() => !isSentByMe && handleDownload()}>
                <div className="shrink-0 relative">
                  {!isSentByMe ? (
                    <ProgressCircle progress={downloadProgress || 0} size={44} strokeWidth={2.5} isDownloading={downloadProgress !== null} onCancel={cancelDownload} />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white/90" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col min-w-0 pr-4">
                  <span className="text-[14px] font-medium truncate tracking-tight">{file_name || 'Document'}</span>
                  <span className="text-[11px] opacity-70 font-medium tracking-wide">
                    {formatBytes(file_size || 0)} • {downloadProgress !== null ? `${downloadProgress}%` : (isSentByMe ? 'Cloud' : 'Download')}
                  </span>
                </div>
              </div>
            )}

            {/* Optional caption below media */}
            {content && <p className={cn("mt-1 px-2 text-[14px] whitespace-pre-wrap", isSentByMe ? "text-white/90" : "text-zinc-700")}>{content}</p>}
          </div>
        )}
      </div>

      {/* METADATA EXTRACTED OUTSIDE THE BUBBLE */}
      {/* UPDATE 2: Wrap the metadata inside a condition checking showMetadata */}
      {showMetadata !== false && (
        <div className={cn(
          "flex items-center gap-1.5 mt-0.5 text-[11px] font-medium text-[#424242] px-1",
          isSentByMe ? "justify-end" : "justify-start"
        )}>
          {!isSentByMe && (
            <div className="flex items-center gap-0.5 mr-1">
              <Eye className="w-3.5 h-3.5" />
              <span>23</span>
            </div>
          )}
          <span>{timestamp}</span>
          {isSentByMe && status && (
            <span className="flex items-center ml-0.5">
              {status === 'read' ? <CheckCheck className="w-3.5 h-3.5 text-zinc-500" />
                : status === 'delivered' ? <CheckCheck className="w-3.5 h-3.5" />
                  : status === 'sending' && type === 'text' ? <RefreshCw className="w-3 h-3 animate-spin" />
                    : status !== 'sending' ? <Check className="w-3.5 h-3.5" /> : null}
            </span>
          )}
        </div>
      )}

    </div>
  );

  if (hideAvatar) {
    return (
      <div className={cn(
        "flex w-full",
        // If it shows the time row, give it breathing room. Otherwise, keep it tight (2px gap).
        showMetadata ? "mb-2" : "mb-0.5", 
        isSentByMe ? "justify-end" : "justify-start"
      )}>
        {bubbleContent}
      </div>
    );
  }

  return (
    <div className={cn(
      "flex w-full px-2 md:px-4 group mb-2", // Increased bottom margin slightly for elegant spacing
      isSentByMe ? "flex-row-reverse" : "flex-row",
      isSequence ? "mt-1" : "mt-6" // Increased top margin between different senders
    )}>
      {/* Avatar Side */}
      <div className={cn("shrink-0 flex items-end mb-5", isSentByMe ? "ml-3" : "mr-3")}>
        {isLastInSequence ? (
          <Avatar
            src={senderAvatar || undefined}
            fallback={senderName?.charAt(0) || '?'}
            size="sm"
            className="shadow-sm rounded-full border border-black/5" // Switched back to round avatars for elegance
          />
        ) : (
          <div className="w-9" /> // Matches typical Avatar 'sm' width
        )}
      </div>

      {bubbleContent}
    </div>
  );
});

export default MessageBubble;