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
  highlight?: string | boolean;
  activeMatchWithinMessage?: number;
  onDelete?: (id: string) => void;
  hideAvatar?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  isSelectionMode?: boolean;
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
  id, content, type = 'text', media_url, file_name, file_size, timestamp, isSentByMe, status, uploadProgress, senderName, senderAvatar, isSequence = false, isLastInSequence = false, highlight, activeMatchWithinMessage = -1, onDelete, hideAvatar = false, isSelected = false, onSelect, isSelectionMode = false
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
    }, 500); // 500ms long press
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
        "flex flex-col max-w-[calc(100%-5rem)] md:max-w-[75%] group/bubble relative min-w-0 w-full transition-transform active:scale-[0.98]", 
        isSentByMe ? "items-end" : "items-start",
        isSelected
      )}
    >
      <div className={cn(
        "relative px-1 py-1 text-[14px] md:text-[15px] leading-tight transition-all duration-300 shadow-sm flex flex-col min-w-20 overflow-hidden",
        isSentByMe 
          ? cn("bg-[#7C69EF] text-white rounded-xl", isLastInSequence && "rounded-br-sm", isSelected && "bg-[#6A57E0] ring-1 ring-white/50") 
          : cn("bg-[#F3F4FE] text-slate-900 rounded-xl", isLastInSequence && "rounded-bl-sm", isSelected && "bg-[#E6E8FD] ring-1 ring-[#7C69EF]/50"),
        (type === 'image' || type === 'video') && "p-1 overflow-hidden"
      )}>
        {/* Selection Checkmark */}
        {isSelected && (
          <div className={cn(
            "absolute bottom-1 left-1 z-40 w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-200 shadow-sm",
            isSentByMe ? "bg-white text-[#7C69EF]" : "bg-[#7C69EF] text-white"
          )}>
            <Check className="w-2.5 h-2.5 stroke-3" />
          </div>
        )}

        {/* Action Menu (Desktop Only, and NOT in selection mode) */}
        {!isSelectionMode && (
          <div className="absolute top-1 right-1 z-30 opacity-0 group-hover/bubble:opacity-100 transition-opacity hidden md:block">
            <DropdownMenu items={menuItems} icon={<MoreHorizontal className={cn("w-4 h-4 rounded-full p-0.5 backdrop-blur-sm", isSentByMe ? "bg-white/10 text-white" : "bg-black/5 text-slate-400")} />} />
          </div>
        )}

        {/* Sender Name (Other) */}
        {!isSentByMe && senderName && !isSequence && (
          <span className="text-[12px] font-bold text-[#7C69EF]/80 mb-1 px-1">{senderName}</span>
        )}

        {type === 'text' ? (
          <div className="relative px-1 pb-1 min-w-0 w-full overflow-hidden">
            <p className="whitespace-pre-wrap wrap-anywhere break-all pr-2">
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
                          "transition-all duration-300 rounded-md font-bold",
                          isActive ? "bg-yellow-400 text-yellow-950 px-1 shadow-sm" : "bg-accent text-accent-foreground px-0.5"
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
            
            {/* Meta Info Integrated (Text) */}
            <div className={cn(
              "flex items-center justify-end gap-1.5 mt-2 -mb-1.5 text-[10px] font-medium opacity-60",
              isSentByMe ? "text-white/80" : "text-slate-500"
            )}>
              {!isSentByMe && (
                <div className="flex items-center gap-0.5">
                  <Eye className="w-3 h-3" />
                  <span>23</span>
                </div>
              )}
              <span>{timestamp}</span>
              {isSentByMe && status && (
                <span className="flex items-center">
                  {status === 'read' ? <CheckCheck className="w-3.5 h-3.5 text-blue-200" /> : status === 'delivered' ? <CheckCheck className="w-3.5 h-3.5" /> : status === 'sending' ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 relative">
            {type === 'image' && media_url && (
              <>
                <div onClick={() => setIsViewerOpen(true)} className="relative group/media rounded-xl overflow-hidden bg-black/5 aspect-square max-h-80 shadow-inner cursor-pointer">
                  <img src={media_url} alt="Shared" className="w-full h-full object-cover" />
                  {!isSentByMe && downloadProgress !== null && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                      <ProgressCircle progress={downloadProgress || 0} isDownloading={true} onCancel={cancelDownload} />
                    </div>
                  )}
                  {/* Meta Overlay for Images */}
                  <div className="absolute bottom-1.5 right-1.5 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded-md flex items-center gap-1 text-[9px] text-white/90">
                    <div className="flex items-center gap-0.5">
                      <Eye className="w-2.5 h-2.5" />
                      <span>10</span>
                    </div>
                    <span>{timestamp}</span>
                    {isSentByMe && status && (
                      <span className="flex items-center ml-1">
                        {status === 'read' ? <CheckCheck className="w-3.5 h-3.5 text-blue-300" /> : status === 'delivered' ? <CheckCheck className="w-3.5 h-3.5" /> : status === 'sending' ? (
                          uploadProgress !== undefined ? (
                            <span className="flex items-center gap-0.5 pointer-events-auto">
                              <span className="font-bold tracking-tighter">{uploadProgress}%</span>
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); useUploadStore.getState().cancelUpload(id); }} className="hover:bg-white/20 rounded-full p-px transition-colors cursor-pointer" aria-label="Cancel upload">
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ) : <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        ) : <Check className="w-3.5 h-3.5" />}
                      </span>
                    )}
                  </div>
                </div>
                {isViewerOpen && createPortal(
                  <div className="fixed inset-0 z-100 bg-black/95 flex items-center justify-center p-2 animate-in fade-in duration-200" onClick={() => setIsViewerOpen(false)}>
                    <button onClick={(e) => { e.stopPropagation(); setIsViewerOpen(false); }} className="absolute top-4 right-4 z-50 p-3 bg-white/10 rounded-full hover:bg-white/20 text-white backdrop-blur-md transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                    <img src={media_url} alt="Expanded" className="max-w-full max-h-full object-contain cursor-default" onClick={(e) => e.stopPropagation()} />
                  </div>,
                  document.body
                )}
              </>
            )}
            {type === 'video' && media_url && (
              <>
                <div className="relative group/media rounded-xl overflow-hidden bg-black/5 aspect-video max-h-80 flex items-center justify-center shadow-inner cursor-pointer" onClick={() => setIsViewerOpen(true)}>
                  <video src={media_url} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    {!isSentByMe ? (
                      downloadProgress !== null ? <ProgressCircle progress={downloadProgress} isDownloading={true} onCancel={cancelDownload} /> : (
                        <div className="w-14 h-14 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-black/60 transition-colors shadow-xl">
                          <Play className="w-7 h-7 text-white fill-white ml-0.5" />
                        </div>
                      )
                    ) : <Play className="w-10 h-10 text-white/30" />}
                  </div>
                  {/* Meta Overlay for Videos */}
                  <div className="absolute bottom-1.5 right-1.5 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded-md flex items-center gap-1 text-[9px] text-white/90">
                    <div className="flex items-center gap-0.5">
                      <Eye className="w-2.5 h-2.5" />
                      <span>10</span>
                    </div>
                    <span>{timestamp}</span>
                    {isSentByMe && status && (
                      <span className="flex items-center ml-1">
                        {status === 'read' ? <CheckCheck className="w-3.5 h-3.5 text-blue-300" /> : status === 'delivered' ? <CheckCheck className="w-3.5 h-3.5" /> : status === 'sending' ? (
                          uploadProgress !== undefined ? (
                            <span className="flex items-center gap-0.5 pointer-events-auto">
                              <span className="font-bold tracking-tighter">{uploadProgress}%</span>
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); useUploadStore.getState().cancelUpload(id); }} className="hover:bg-white/20 rounded-full p-px transition-colors cursor-pointer" aria-label="Cancel upload">
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ) : <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        ) : <Check className="w-3.5 h-3.5" />}
                      </span>
                    )}
                  </div>
                </div>
                {isViewerOpen && createPortal(
                  <div className="fixed inset-0 z-100 bg-black/95 flex items-center justify-center p-2 animate-in fade-in duration-200" onClick={() => setIsViewerOpen(false)}>
                    <button onClick={(e) => { e.stopPropagation(); setIsViewerOpen(false); }} className="absolute top-4 right-4 z-50 p-3 bg-white/10 rounded-full hover:bg-white/20 text-white backdrop-blur-md transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                    <video src={media_url} controls autoPlay className="max-w-full max-h-full object-contain cursor-default" onClick={(e) => e.stopPropagation()} />
                  </div>,
                  document.body
                )}
              </>
            )}
            {type === 'file' && (
              <div className={cn("flex items-center gap-4 p-2.5 rounded-xl transition-colors", !isSentByMe ? "cursor-pointer hover:bg-black/5" : "bg-white/10")} onClick={() => !isSentByMe && handleDownload()}>
                <div className="shrink-0 relative">
                  {!isSentByMe ? (
                    <ProgressCircle progress={downloadProgress || 0} size={44} strokeWidth={2.5} isDownloading={downloadProgress !== null} onCancel={cancelDownload} />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shadow-inner">
                      <FileText className="w-5 h-5 text-white/70" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col min-w-0 pr-6">
                  <span className="text-[14px] font-bold truncate tracking-tight">{file_name || 'Document'}</span>
                  <span className="text-[11px] opacity-70 font-bold uppercase tracking-tighter">
                    {formatBytes(file_size || 0)} • {downloadProgress !== null ? `${downloadProgress}%` : (isSentByMe ? 'Cloud' : 'Download')}
                  </span>
                </div>
              </div>
            )}
            {content && <p className="mt-1 px-1 text-[14px] whitespace-pre-wrap opacity-90 pr-2">{content}</p>}
            
            {/* Meta for files/media with captions */}
            {type === 'file' || (content && (type === 'image' || type === 'video')) ? (
              <div className={cn(
                "flex items-center justify-end gap-1.5 mt-1 text-[10px] font-medium opacity-60 px-1 pb-1",
                isSentByMe ? "text-white/80" : "text-slate-500"
              )}>
                {!isSentByMe && (
                  <div className="flex items-center gap-0.5">
                    <Eye className="w-3 h-3" />
                    <span>10</span>
                  </div>
                )}
                <span>{timestamp}</span>
                {isSentByMe && status && (
                  <span className="flex items-center gap-1">
                    {status === 'read' ? <CheckCheck className="w-3.5 h-3.5 text-blue-200" /> : status === 'delivered' ? <CheckCheck className="w-3.5 h-3.5" /> : status === 'sending' ? (
                      uploadProgress !== undefined ? (
                        <span className="flex items-center gap-0.5 pointer-events-auto">
                          <span className="font-bold">{uploadProgress}%</span>
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); useUploadStore.getState().cancelUpload(id); }} className="hover:bg-white/20 rounded-full p-px transition-colors cursor-pointer" aria-label="Cancel upload">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ) : <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    ) : <Check className="w-3.5 h-3.5" />}
                  </span>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );

  if (hideAvatar) {
    return (
      <div className={cn(
        "flex w-full mb-0.5",
        isSentByMe ? "justify-end" : "justify-start"
      )}>
        {bubbleContent}
      </div>
    );
  }

  return (
    <div className={cn(
      "flex w-full px-2 md:px-4 group mb-1", 
      isSentByMe ? "flex-row-reverse" : "flex-row",
      isSequence ? "mt-0.5" : "mt-4"
    )}>
      {/* Avatar Side */}
      <div className={cn("shrink-0 flex items-end", isSentByMe ? "ml-2" : "mr-2")}>
        {isLastInSequence ? (
          <Avatar 
            src={senderAvatar || undefined} 
            fallback={senderName?.charAt(0) || '?'} 
            size="sm"
            className="shadow-lg rounded-xl border border-black/5"
          />
        ) : (
          <div className="w-13" /> 
        )}
      </div>

      {bubbleContent}
    </div>
  );
});
