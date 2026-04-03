import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router';
import { supabase } from '@/lib/supabase';
import { TopBar } from '@/components/layout/TopBar';
import { Avatar } from '@/components/ui/Avatar';
import { 
  ArrowLeft, Phone, Video, Search, X, 
  ChevronUp, ChevronDown, MessageSquare, Image, 
  FileText, Link as LinkIcon, BellOff, Bell, Palette, 
  MoreHorizontal, LogOut, Download, List as ListIcon, Star, Check, Info
} from 'lucide-react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { useMessages } from '@/hooks/useMessages';
import { useChats } from '@/hooks/useChats';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { useChatPermissions } from '@/hooks/useChatPermissions';
import { Skeleton } from '@/components/ui/Skeleton';
import { useChatLists } from '@/hooks/useChatLists';
import { BottomSheet } from '@/components/ui/BottomSheet';

export const ChatScreen: React.FC = () => {
  const { showInfo, setShowInfo } = useOutletContext<{ showInfo: boolean; setShowInfo: (v: boolean) => void }>() || { showInfo: false, setShowInfo: () => {} };
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { 
    messages, 
    isLoading: isMessagesLoading, 
    sendMessage,
    sendFile,
    deleteMessage,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage 
  } = useMessages(id);
  const { chats, toggleMute } = useChats();
  const { customLists, memberships, toggleMembership } = useChatLists();
  const chatInfo = chats.find(c => c.chat_id === id);
  const { canSend } = useChatPermissions(id);

  const isLoading = isMessagesLoading;
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isListsOpen, setIsListsOpen] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [mediaTab, setMediaTab] = useState<'media' | 'docs' | 'links'>('media');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return messages
      .map((msg, index) => msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ? index : -1)
      .filter(index => index !== -1);
  }, [messages, searchQuery]);

  useEffect(() => {
    if (!isSearchVisible) {
      setSearchQuery('');
      setCurrentMatchIndex(0);
    }
  }, [isSearchVisible]);

  useEffect(() => {
    if (searchResults.length > 0) {
      const targetIndex = searchResults[currentMatchIndex];
      const element = document.getElementById(`msg-${messages[targetIndex].id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentMatchIndex, searchResults, messages]);

  const handleNextMatch = () => {
    if (searchResults.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % searchResults.length);
  };

  const handlePrevMatch = () => {
    if (searchResults.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
  };

  // Scroll to bottom on initial load and NEW messages
  const lastMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    if (!isSearchVisible && !isLoading && !isFetchingNextPage) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lastMessageId, id, isSearchVisible, isLoading, isFetchingNextPage]);

  // Infinite Scroll Trigger
  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const displayTime = (ts: string) => {
    try {
      return format(new Date(ts), 'h:mm a');
    } catch {
      return '';
    }
  };

  const [otherUserId, setOtherUserId] = useState<string | null>(null);

  useEffect(() => {
    if (chatInfo?.chat_type === 'direct' && id && user) {
      const getOtherUser = async () => {
        const { data } = await supabase
          .from('chat_members')
          .select('user_id')
          .eq('chat_id', id)
          .neq('user_id', user.id)
          .single();
        
        if (data) setOtherUserId(data.user_id);
      };
      getOtherUser();
    }
  }, [chatInfo?.chat_type, id, user?.id]);

  const handleHeaderClick = () => {
    if (chatInfo?.chat_type === 'group') {
      navigate(`/chats/${id}/info`);
    } else if (otherUserId) {
      navigate(`/profile/${otherUserId}`);
    }
  };

  const handleClearChat = async () => {
    if (!id || !user) return;
    const confirm = window.confirm("Clear all messages for you? Other participants will still see them.");
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from('cleared_chats')
        .upsert({ 
          chat_id: id, 
          user_id: user.id, 
          cleared_at: new Date().toISOString() 
        }, { onConflict: 'chat_id,user_id' });
      
      if (error) throw error;
      toast.success("Chat cleared");
      // Refresh messages
      window.location.reload();
    } catch (err: any) {
      toast.error("Failed to clear chat: " + err.message);
    }
  };

  const handleExitGroup = async () => {
    if (!id || !user) return;
    const confirm = window.confirm("Are you sure you want to exit this group?");
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from('chat_members')
        .delete()
        .eq('chat_id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      toast.success("Exited group");
      navigate('/chats');
    } catch (err: any) {
      toast.error("Failed to exit group: " + err.message);
    }
  };

  const isRestricted = chatInfo?.chat_type === 'group' && !canSend;
  const isMuted = chatInfo?.is_muted || false;
  const isFavorite = chatInfo?.is_favorite || false;

  return (
    <div className="flex flex-col h-full w-full bg-secondary/10 relative overflow-hidden">
      <div className="absolute left-0 top-0 right-0 flex flex-col shrink-0 z-20">
        <TopBar
          leftElement={
            <div className="flex items-center gap-1">
              <button onClick={() => navigate('/chats')} className="md:hidden mr-1 hover:bg-secondary rounded-full premium-transition">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center cursor-pointer" onClick={handleHeaderClick}>
                <Avatar src={chatInfo?.avatar_url} fallback={chatInfo?.name || 'C'} size="sm" />
              </div>
            </div>
          }
          title={
            <div className="flex flex-col cursor-pointer" onClick={handleHeaderClick}>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold leading-tight tracking-tight">{chatInfo?.name || 'Chat'}</span>
                {chatInfo?.chat_type === 'group' && <span className="text-[9px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm border border-primary/20 leading-none">GP</span>}
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">
                {chatInfo?.chat_type === 'group' ? 'Tap for group details' : 'View profile'}
              </span>
            </div>
          }
          rightElement={
            <div className="flex items-center gap-0.5 text-muted-foreground">
              <button
                onClick={() => setIsSearchVisible(!isSearchVisible)}
                className={cn("p-2 hover:bg-secondary rounded-full premium-transition", isSearchVisible && "text-primary bg-primary/10")}
              >
                <Search className="w-5 h-5" />
              </button>
              
              <button className="p-2 hover:bg-secondary rounded-full premium-transition hidden md:block"><Video className="w-5 h-5" /></button>
              <button className="p-2 hover:bg-secondary rounded-full premium-transition hidden md:block"><Phone className="w-5 h-5" /></button>
              
              <button
                onClick={() => setShowInfo?.(!showInfo)}
                className={cn(
                  "p-2 hover:bg-secondary rounded-full premium-transition hidden lg:block", 
                  showInfo && "text-primary bg-primary/10"
                )}
              >
                <Info className="w-5 h-5" />
              </button>
              
              <DropdownMenu 
                items={[
                  { 
                    label: chatInfo?.chat_type === 'group' ? 'Group Media' : 'Media, Links, Docs', 
                    icon: <Image className="w-4 h-4" />, 
                    onClick: () => setIsMediaOpen(true) 
                  },
                  { 
                    label: 'Search', 
                    icon: <Search className="w-4 h-4" />, 
                    onClick: () => setIsSearchVisible(true) 
                  },
                  { 
                    label: isMuted ? 'Unmute' : 'Mute notifications', 
                    icon: isMuted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />, 
                    onClick: () => {
                      if (id) toggleMute(id, isMuted);
                    }
                  },
                  { 
                    label: 'Chat theme', 
                    icon: <Palette className="w-4 h-4" />, 
                    onClick: () => setIsThemeOpen(true) 
                  },
                  { divider: true },
                  {
                    label: 'More',
                    icon: <MoreHorizontal className="w-4 h-4" />,
                    subItems: [
                      { 
                        label: 'Clear Chat', 
                        icon: <X className="w-4 h-4" />, 
                        onClick: handleClearChat 
                      },
                      { 
                        label: 'Export Chat', 
                        icon: <Download className="w-4 h-4" />, 
                        onClick: () => toast.info('Export chat feature coming soon!') 
                      },
                      {
                        label: 'Add to list...',
                        icon: <ListIcon className="w-4 h-4" />,
                        subItems: [
                          {
                            label: isFavorite ? 'Remove Favorite' : 'Add Favorite',
                            icon: <Star className={cn("w-4 h-4", isFavorite && "fill-primary text-primary")} />,
                            onClick: () => {
                              // We can use the toggleFavorite from useChats if we had it, 
                              // but for now let's just use the BottomSheet for consistency
                              setIsListsOpen(true);
                            }
                          },
                          ...customLists.map(list => ({
                            label: list.name,
                            icon: memberships[list.id]?.includes(id || '') ? <Check className="w-4 h-4 text-primary" /> : <ListIcon className="w-4 h-4" />,
                            onClick: () => toggleMembership(id || '', list.id)
                          }))
                        ]
                      },
                      ...(chatInfo?.chat_type === 'group' ? [{
                        label: 'Exit Group',
                        icon: <LogOut className="w-4 h-4 text-destructive" />,
                        textClass: 'text-destructive',
                        onClick: handleExitGroup
                      }] : [])
                    ]
                  }
                ]}
              />
            </div>
          }
        />

        {isSearchVisible && (
          <div className="bg-background border-b border-border p-2 flex items-center gap-2 animate-in slide-in-from-top duration-300 shadow-md relative z-10">
            <div className="relative flex-1">
              <Input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in chat..."
                className="pl-10 pr-24 h-10 rounded-xl bg-secondary/40 border-none text-sm focus:ring-2 ring-primary/20"
              />
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              {searchQuery && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/10">
                  {searchResults.length > 0 ? `${currentMatchIndex + 1} OF ${searchResults.length}` : '0 RESULTS'}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={searchResults.length === 0}
                onClick={handlePrevMatch}
                className="p-2 hover:bg-secondary rounded-xl disabled:opacity-20 active:scale-90 transition-all"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                disabled={searchResults.length === 0}
                onClick={handleNextMatch}
                className="p-2 hover:bg-secondary rounded-xl disabled:opacity-20 active:scale-90 transition-all"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button onClick={() => setIsSearchVisible(false)} className="p-2 hover:bg-secondary rounded-xl active:scale-90 transition-all"><X className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto w-full py-6 flex flex-col gap-1 px-2 md:px-6 lg:px-12 scroll-smooth">
        {isLoading && messages.length === 0 ? (
          <div className="flex flex-col gap-4">
            <div className="flex justify-start">
              <Skeleton className="h-12 w-[60%] rounded-2xl rounded-bl-none" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-10 w-[45%] rounded-2xl rounded-br-none" />
            </div>
            <div className="flex justify-start">
              <Skeleton className="h-16 w-[70%] rounded-2xl rounded-bl-none" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-12 w-[35%] rounded-2xl rounded-br-none" />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 select-none grayscale">
            <MessageSquare className="w-16 h-16 mb-4" />
            <p className="text-sm font-bold tracking-widest uppercase">No messages yet</p>
            <p className="text-[10px] mt-1">Start the conversation below.</p>
          </div>
        ) : (
          <>
            <div ref={loadMoreRef} className="h-4 flex items-center justify-center py-4">
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 text-[10px] font-black text-primary animate-pulse uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                  Loading History
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              )}
            </div>
            {messages.map((msg, idx) => (
              <div key={msg.id} id={`msg-${msg.id}`} className="transition-all duration-300">
                <MessageBubble
                  id={msg.id}
                  content={msg.content}
                  type={msg.type}
                  media_url={msg.media_url}
                  file_name={msg.file_name}
                  file_size={msg.file_size}
                  timestamp={displayTime(msg.created_at)}
                  isSentByMe={msg.sender_id === user?.id}
                  senderName={msg.profiles?.full_name}
                  isSequence={idx > 0 && messages[idx - 1].sender_id === msg.sender_id}
                  status={msg.status}
                  highlight={searchQuery}
                  isCurrentHighlight={isSearchVisible && searchResults[currentMatchIndex] === idx}
                  onDelete={deleteMessage}
                />
              </div>
            ))}
            <div ref={messagesEndRef} className="pb-4" />
          </>
        )}
      </div>

      <MessageComposer
        onSendMessage={(text) => sendMessage(text)}
        onSendFile={(file, type) => sendFile(file, type)}
        disabled={isLoading && messages.length === 0 || isRestricted}
        placeholder={isRestricted ? "Only admins can send messages" : "Type a message..."}
      />

      {/* List Management BottomSheet */}
      <BottomSheet 
        isOpen={isListsOpen} 
        onClose={() => setIsListsOpen(false)}
        title="Add to List"
      >
        <div className="p-4 pt-0">
          <p className="text-sm text-muted-foreground mb-4">
            Categorize this chat to filter your chat list.
          </p>
          <div className="space-y-1">
            {customLists.map(list => {
              const isMember = memberships[list.id]?.includes(id || '');
              return (
                <button
                  key={list.id}
                  onClick={() => toggleMembership(id || '', list.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-secondary rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <ListIcon className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium">{list.name}</span>
                  </div>
                  {isMember && (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </button>
              );
            })}

            {customLists.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">You haven't created any custom lists yet.</p>
                <button 
                  onClick={() => navigate('/chats')} 
                  className="mt-4 text-primary font-bold text-sm"
                >
                  Go back to organize
                </button>
              </div>
            )}
          </div>
        </div>
      </BottomSheet>

      {/* Media Browser BottomSheet */}
      <BottomSheet 
        isOpen={isMediaOpen} 
        onClose={() => setIsMediaOpen(false)}
        title={chatInfo?.chat_type === 'group' ? 'Group Media' : 'Media, Links, Docs'}
      >
        <div className="flex flex-col h-[60vh]">
          <div className="flex border-b border-border px-4">
            {(['media', 'docs', 'links'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setMediaTab(tab)}
                className={cn(
                  "px-4 py-3 text-sm font-bold border-b-2 transition-all capitalize",
                  mediaTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              {mediaTab === 'media' && <Image className="w-8 h-8 opacity-20" />}
              {mediaTab === 'docs' && <FileText className="w-8 h-8 opacity-20" />}
              {mediaTab === 'links' && <LinkIcon className="w-8 h-8 opacity-20" />}
            </div>
            <p className="text-sm font-medium">No {mediaTab} found</p>
            <p className="text-[10px] mt-1 opacity-60">Shared {mediaTab} will appear here</p>
          </div>
        </div>
      </BottomSheet>

      {/* Theme Picker BottomSheet */}
      <BottomSheet 
        isOpen={isThemeOpen} 
        onClose={() => setIsThemeOpen(false)}
        title="Chat Theme"
      >
        <div className="p-6 grid grid-cols-4 gap-4">
          {[
            { name: 'Default', color: 'bg-primary' },
            { name: 'Sunset', color: 'bg-orange-500' },
            { name: 'Ocean', color: 'bg-blue-500' },
            { name: 'Forest', color: 'bg-emerald-500' },
            { name: 'Berry', color: 'bg-purple-500' },
            { name: 'Rose', color: 'bg-pink-500' },
            { name: 'Slate', color: 'bg-slate-700' },
            { name: 'Midnight', color: 'bg-zinc-900' },
          ].map(theme => (
            <button
              key={theme.name}
              onClick={() => {
                toast.success(`Theme "${theme.name}" applied!`);
                setIsThemeOpen(false);
              }}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={cn("w-12 h-12 rounded-2xl shadow-sm group-hover:scale-110 transition-transform", theme.color)} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{theme.name}</span>
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
};
