import React, { useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Archive, Star, StarOff, BellOff, ArchiveRestore, Trash2, Plus, Pin, Info, Ban, LogOut, Check } from 'lucide-react';

export interface ChatListItemProps {
  chat_id: string;
  name: string;
  avatar_url?: string | null;
  last_message?: string | null;
  last_message_time?: string | null;
  unread_count?: number;
  is_muted?: boolean;
  is_archived?: boolean;
  is_favorite?: boolean;
  is_pinned?: boolean;
  chat_type?: 'direct' | 'group';
  isActive?: boolean;
  onClick?: () => void;
  onArchive?: (id: string, current: boolean) => void;
  onFavorite?: (id: string, current: boolean) => void;
  onMute?: (id: string, current: boolean) => void;
  onDelete?: (id: string) => void;
  onManageLists?: (id: string) => void;
  onPin?: (id: string, isPinned: boolean) => void;
  onInfo?: (id: string) => void;
  onBlock?: (id: string) => void;
  onLeaveGroup?: (id: string) => void;
  currentListKey?: string;
  other_user_id?: string | null;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  selectionMode?: boolean;
}

export const ChatListItem: React.FC<ChatListItemProps> = React.memo(({
  chat_id,
  name,
  avatar_url,
  last_message,
  last_message_time,
  unread_count = 0,
  is_muted = false,
  is_archived = false,
  is_favorite = false,
  is_pinned = false,
  isActive = false,
  onClick,
  onArchive,
  onFavorite,
  onMute,
  onDelete,
  onManageLists,
  onPin,
  onInfo,
  onBlock,
  onLeaveGroup,
  currentListKey = 'All Chats',
  chat_type = 'direct',
  other_user_id,
  isSelected = false,
  onSelect,
  selectionMode = false
}) => {
  const longPressTimer = useRef<any>(null);
  const isLongPressActive = useRef(false);

  const startLongPress = () => {
    isLongPressActive.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPressActive.current = true;
      onSelect?.(chat_id);
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleItemClick = () => {
    if (isLongPressActive.current) {
      isLongPressActive.current = false;
      return;
    }
    if (selectionMode) {
      onSelect?.(chat_id);
    } else {
      onClick?.();
    }
  };
  const timestamp = useMemo(() => {
    if (!last_message_time) return '';
    try {
      const date = new Date(last_message_time);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }, [last_message_time]);
  
  const handleAction = (fn?: () => void) => (e?: any) => {
    e?.stopPropagation();
    fn?.();
  };

  const dropdownItems = useMemo(() => [
    { 
      label: is_pinned ? `Unpin from ${currentListKey}` : `Pin to ${currentListKey}`, 
      onClick: handleAction(() => onPin?.(chat_id, is_pinned)),
      icon: <Pin className={cn("w-4 h-4", is_pinned && "fill-primary")} />
    },
    { 
      label: is_favorite ? 'Remove from Favorites' : 'Add to Favorites', 
      onClick: handleAction(() => onFavorite?.(chat_id, is_favorite)),
      icon: is_favorite ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />
    },
    { 
      label: is_archived ? 'Unarchive' : 'Archive', 
      onClick: handleAction(() => onArchive?.(chat_id, is_archived)),
      icon: is_archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />
    },
    { 
      label: is_muted ? 'Unmute' : 'Mute', 
      onClick: handleAction(() => onMute?.(chat_id, is_muted)),
      icon: <BellOff className="w-4 h-4" />
    },
    { 
      label: 'Manage Lists', 
      onClick: handleAction(() => onManageLists?.(chat_id)),
      icon: <Plus className="w-4 h-4" />
    },
    { 
      label: chat_type === 'group' ? 'Group Info' : 'Chat Info', 
      onClick: handleAction(() => onInfo?.(chat_id)),
      icon: <Info className="w-4 h-4" />
    },
    { 
      label: chat_type === 'group' ? 'Exit Group' : 'Block User', 
      onClick: handleAction(() => {
        if (chat_type === 'group') {
          onLeaveGroup?.(chat_id);
        } else if (other_user_id) {
          onBlock?.(other_user_id);
        }
      }),
      textClass: 'text-red-500',
      icon: chat_type === 'group' ? <LogOut className="w-4 h-4" /> : <Ban className="w-4 h-4" />
    },
    { 
      label: 'Delete Chat', 
      onClick: handleAction(() => onDelete?.(chat_id)),
      textClass: 'text-red-500',
      icon: <Trash2 className="w-4 h-4" />
    },
  ], [chat_id, is_favorite, is_archived, is_muted, is_pinned, currentListKey, onFavorite, onArchive, onMute, onManageLists, onDelete, onPin, chat_type, other_user_id, onInfo, onBlock, onLeaveGroup]);

  return (
    <div className={cn("relative group", isSelected && "bg-primary/5")}>
      <button
        onClick={handleItemClick}
        onPointerDown={startLongPress}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        className={cn(
          'w-full flex gap-3 px-4 py-2 premium-transition text-left relative items-center'
        )}
      >
        <div className={cn(
          'absolute left-1.5 right-1.5 top-0 bottom-0',
          isActive ? 'bg-primary/20 border border-black/10 rounded-[20px]' : (isSelected ? 'bg-primary/10 rounded-[20px]' : 'hover:bg-secondary/40')
        )}></div>

        <div className="relative">
          <Avatar src={avatar_url} fallback={name} size="lg" className={cn(isActive || isSelected ? 'scale-110' : '')} />
          {isSelected && (
            <div className="absolute -right-1 -bottom-1 bg-primary text-primary-foreground rounded-full p-0.5 border-2 border-background shadow-sm animate-in zoom-in duration-200">
              <Check className="w-3 h-3 stroke-4" />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden pointer-events-none">
          <div className="flex justify-between items-baseline mb-0.5">
            <h3 className="font-bold font-bricolage-semi-condensed text-[20px] tracking-tight truncate flex items-center gap-2 text-foreground pr-2">
              {name}
            </h3>
            <span className={cn('text-[14px] font-semibold shrink-0', (unread_count || 0) > 0 ? 'text-primary' : 'text-muted-foreground')}>
              {timestamp}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className={cn('text-sm font-medium pr-12 truncate', (unread_count || 0) > 0 ? 'text-foreground' : 'text-muted-foreground/80')}>
              {last_message || 'No messages yet'}
            </p>

            <div className="flex items-center gap-1.5 shrink-0">
              {is_pinned && <Pin className="w-3.5 h-3.5 text-muted-foreground/60" />}
              {is_muted && <BellOff className="w-3.5 h-3.5 text-muted-foreground/60" />}
              {is_favorite && <Star className="w-3 h-3 text-primary fill-primary" />}
              <Badge count={unread_count} />
            </div>
          </div>
        </div>
        <div className="border-b border-secondary-foreground/5 absolute bottom-0 left-22 right-3"></div>
      </button>

      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-80 group-hover:opacity-100 premium-transition hidden md:block">
        <DropdownMenu items={dropdownItems} />
      </div>
    </div>
  );
});
