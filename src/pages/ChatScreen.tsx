import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router';
import { supabase } from '@/lib/supabase';
import { TopBar } from '@/components/layout/TopBar';
import { Avatar } from '@/components/ui/Avatar';
import {
  ArrowLeft, Phone, Video, Search, X,
  ChevronUp, ChevronDown, MessageSquare, Image,
  FileText, Link as LinkIcon, BellOff, Bell, Palette,
  MoreHorizontal, LogOut, Download, List as ListIcon, Star, Check, Info,
  Copy, Forward, Trash2,
  MoreVertical,
  Globe,
  User,
  TriangleAlert
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
import GradualBlur from '@/components/ui/GradualBlur';
import { usePresence } from '@/hooks/usePresence';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { GradualScroll } from '@/components/ui/GradualScroll';
import { AnimatedItem } from '@/components/ui/AnimatedItem';

export const ChatScreen: React.FC = () => {
  const { showInfo, setShowInfo } = useOutletContext<{ showInfo: boolean; setShowInfo: (v: boolean) => void }>() || { showInfo: false, setShowInfo: () => { } };
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
  const { canSend, isAdmin } = useChatPermissions(id);
  
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const { isOnline } = usePresence();
  const { typingUsers, sendTypingStatus } = useTypingIndicator(id);

  const isLoading = isMessagesLoading;
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isListsOpen, setIsListsOpen] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isDeleteSheetOpen, setIsDeleteSheetOpen] = useState(false);

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
  
  // Group Typing Cycle Logic
  const [currentTyperIndex, setCurrentTyperIndex] = useState(0);
  useEffect(() => {
    if (typingUsers.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentTyperIndex(prev => (prev + 1) % typingUsers.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [typingUsers.length]);

  const typingStatus = useMemo(() => {
    if (typingUsers.length === 0) return null;
    if (chatInfo?.chat_type === 'direct') return 'typing...';
    
    // Group logic
    const user = typingUsers[currentTyperIndex];
    if (!user) return null;
    return `${user.full_name} is typing...`;
  }, [typingUsers, currentTyperIndex, chatInfo?.chat_type]);

  const onlineStatus = useMemo(() => {
    if (typingStatus) return typingStatus;
    if (chatInfo?.chat_type === 'group') return 'Tap for group details';
    
    if (otherUserId && isOnline(otherUserId)) return 'Online';
    
    // Fallback/Last seen - we need last_seen_at from profiles
    // For now, if not online, show static "View profile"
    return 'View profile';
  }, [typingStatus, chatInfo?.chat_type, otherUserId, isOnline]);
  const [mediaTab, setMediaTab] = useState<'media' | 'docs' | 'links'>('media');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Message Selection State
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const isSelectionMode = selectedMessageIds.length > 0;

  const handleMessageSelect = useCallback((messageId: string) => {
    setSelectedMessageIds(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedMessageIds([]);
  }, []);

  const handleCopySelected = useCallback(() => {
    const selectedMessages = messages.filter(m => selectedMessageIds.includes(m.id));
    const textToCopy = selectedMessages
      .map(m => m.content)
      .filter(Boolean)
      .join('\n---\n');
    
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      toast.success(`${selectedMessageIds.length} messages copied to clipboard`);
      clearSelection();
    } else {
      toast.info('No text content to copy');
    }
  }, [messages, selectedMessageIds, clearSelection]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedMessageIds.length === 0) return;
    setIsDeleteSheetOpen(true);
  }, [selectedMessageIds.length]);

  const handleConfirmDelete = useCallback(async (forEveryone: boolean) => {
    setIsDeleteSheetOpen(false);
    
    if (forEveryone) {
      try {
        for (const msgId of selectedMessageIds) {
          await deleteMessage(msgId);
        }
        clearSelection();
      } catch (err: any) {
        toast.error('Bulk delete failed: ' + err.message);
      }
    } else {
      // Placeholder for Delete for Me
      toast.info('Delete for me is coming soon!');
      clearSelection();
    }
  }, [selectedMessageIds, deleteMessage, clearSelection]);

  const canDeleteForEveryone = useMemo(() => {
    if (isAdmin) return true;
    const selectedMsgs = messages.filter(m => selectedMessageIds.includes(m.id));
    return selectedMsgs.length > 0 && selectedMsgs.every(m => m.sender_id === user?.id);
  }, [messages, selectedMessageIds, isAdmin, user?.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const query = debouncedQuery.toLowerCase();
    const matches: { messageIndex: number; matchIndexInContent: number }[] = [];

    messages.forEach((msg, msgIndex) => {
      // Fast check: Only search text messages or messages with content
      if (msg.type !== 'text' && !msg.content) return;

      const content = msg.content.toLowerCase();
      let pos = content.indexOf(query);

      while (pos !== -1) {
        matches.push({ messageIndex: msgIndex, matchIndexInContent: pos });
        pos = content.indexOf(query, pos + 1);
      }
    });

    return matches;
  }, [messages, debouncedQuery]);

  useEffect(() => {
    if (!isSearchVisible) {
      setSearchQuery('');
      setCurrentMatchIndex(0);
    }
  }, [isSearchVisible]);

  useEffect(() => {
    if (isSearchVisible && searchResults.length > 0) {
      // Small delay to ensure the DOM has updated with the ID "active-search-match"
      requestAnimationFrame(() => {
        const activeMatchElement = document.getElementById('active-search-match');
        if (activeMatchElement) {
          activeMatchElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          // Fallback to bubble if word match element isn't found
          const match = searchResults[currentMatchIndex];
          const targetMessage = messages[match.messageIndex];
          const element = document.getElementById(`msg-${targetMessage.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      });
    }
  }, [currentMatchIndex, searchResults, messages, isSearchVisible]);

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
  }, [lastMessageId, id, isLoading, isFetchingNextPage]);

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

  // Message grouping logic
  const groupedMessages = useMemo(() => {
    const groups: {
      sender_id: string;
      profile: any;
      messages: { msg: any; originalIndex: number }[];
    }[] = [];

    // Reverse messages for flex-col-reverse: newest first
    const reversedMessages = [...messages].reverse();

    reversedMessages.forEach((msg, idx) => {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.sender_id === msg.sender_id) {
        lastGroup.messages.push({ msg, originalIndex: messages.length - 1 - idx });
      } else {
        groups.push({
          sender_id: msg.sender_id,
          profile: msg.profiles,
          messages: [{ msg, originalIndex: messages.length - 1 - idx }]
        });
      }
    });

    return groups;
  }, [messages]);

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
    <div className="flex flex-col h-full w-full md:bg-secondary relative overflow-hidden">
      <div className="absolute left-0 top-0 right-0 flex flex-col shrink-0 z-20">
        {isSelectionMode ? (
          <TopBar
            className="animate-in slide-in-from-top-2 duration-300"
            leftElement={
              <div className="flex items-center gap-3">
                <button 
                  onClick={clearSelection}
                  className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground"
                >
                  <X className="w-6 h-6" />
                </button>
                <span className="text-xl font-bold font-bricolage-semi-condensed">{selectedMessageIds.length}</span>
              </div>
            }
            title={null}
            rightElement={
              <div className="flex items-center gap-1 text-muted-foreground">
                <button 
                  onClick={handleCopySelected}
                  className="p-2 hover:bg-secondary rounded-full transition-all active:scale-90"
                  title="Copy"
                >
                  <Copy className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => toast.info('Starring coming soon!')}
                  className="p-2 hover:bg-secondary rounded-full transition-all active:scale-90"
                  title="Star"
                >
                  <Star className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => toast.info('Forwarding coming soon!')}
                  className="p-2 hover:bg-secondary rounded-full transition-all active:scale-90"
                  title="Forward"
                >
                  <Forward className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleDeleteSelected}
                  className="p-2 hover:bg-secondary rounded-full transition-all active:scale-90 text-red-500"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <DropdownMenu
                  items={[
                    { 
                      label: 'Message Info', 
                      icon: <Info className="w-4 h-4" />, 
                      onClick: () => toast.info('Detailed info coming soon') 
                    },
                    { 
                      label: 'Select all', 
                      icon: <ListIcon className="w-4 h-4" />, 
                      onClick: () => setSelectedMessageIds(messages.map(m => m.id))
                    }
                  ]}
                  icon={
                    <button className="py-2 -mr-2 hover:bg-secondary rounded-full transition-all active:scale-90">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  }
                />
              </div>
            }
          />
        ) : (
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
                  <span className="text-xl font-bricolage-semi-condensed font-bold tracking-tight">{chatInfo?.name || 'Chat'}</span>
                  {chatInfo?.chat_type === 'group' && <span className="text-[9px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm border border-primary/20 leading-none">GP</span>}
                </div>
                <span className={cn(
                  "text-[11px] font-medium leading-none transition-colors",
                  typingStatus ? "text-primary italic animate-pulse" : 
                  onlineStatus === 'Online' ? "text-green-400 font-bold" : "text-muted-foreground"
                )}>
                  {onlineStatus}
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
        )}

        {isSearchVisible && (
          <>
            <div className="pointer-events-none">
              <GradualBlur position="top" className="z-10" height="10rem" opacity={1} curve="ease-in-out" />
            </div>
            <div className="p-2 flex items-center gap-2 animate-in slide-in-from-top duration-300 relative z-10">
              <div className="relative flex-1">
                <Input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in chat..."
                  className="pl-10 pr-24 h-10 rounded-xl bg-secondary-foreground/20 backdrop-blur-sm border-black/10 text-sm"
                />
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                {searchQuery && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/10 transition-all">
                    {searchQuery !== debouncedQuery ? (
                      <span className="animate-pulse">SEARCHING...</span>
                    ) : (
                      searchResults.length > 0 ? `${currentMatchIndex + 1} OF ${searchResults.length}` : '0 RESULTS'
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={searchResults.length === 0}
                  onClick={handleNextMatch}
                  className="p-2 hover:bg-secondary rounded-xl disabled:opacity-20 active:scale-90 transition-all"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  disabled={searchResults.length === 0}
                  onClick={handlePrevMatch}
                  className="p-2 hover:bg-secondary rounded-xl disabled:opacity-20 active:scale-90 transition-all"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button onClick={() => setIsSearchVisible(false)} className="p-2 hover:bg-secondary rounded-xl active:scale-90 transition-all"><X className="w-4 h-4" /></button>
              </div>
            </div>
          </>
        )}
      </div>

      <GradualScroll 
        scrollRef={scrollContainerRef as any}
        className="flex-1 w-full bg-secondary rounded-b-2xl"
        scrollClassName="pt-16 pb-0 flex flex-col-reverse gap-1 px-2 md:px-6 lg:px-12 scroll-smooth"
      >
        <div ref={messagesEndRef} className="h-0 w-full" />
        
        {isLoading && messages.length === 0 ? (
          <div className="flex flex-col gap-4 mb-auto">
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
          <div className="h-full mt-auto mb-auto flex flex-col items-center justify-center opacity-30 select-none grayscale">
            <MessageSquare className="w-16 h-16 mb-4" />
            <p className="text-sm font-bold tracking-widest uppercase">No messages yet</p>
            <p className="text-[10px] mt-1">Start the conversation below.</p>
          </div>
        ) : (
          <>
            {groupedMessages.map((group, gIdx) => {
              const isSentByMe = group.sender_id === user?.id;
              
              return (
                <div 
                  key={`group-${group.sender_id}-${gIdx}`} 
                  className={cn(
                    "flex items-end w-full gap-2 mb-4",
                    isSentByMe ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* Sticky Avatar Sidebar - Glide Logic */}
                  <div className="shrink-0 w-13 flex flex-col justify-end self-stretch">
                    <div className="sticky top-24 bottom-0 -mb-1">
                      <AnimatedItem index={gIdx}>
                        <Avatar 
                          src={group.profile?.avatar_url} 
                          fallback={group.profile?.full_name?.charAt(0) || '?'} 
                          size="sm"
                          className="shadow-lg rounded-xl border border-black/5"
                        />
                      </AnimatedItem>
                    </div>
                  </div>

                  {/* Messages list for this group (reversed internally to preserve DOM injection anchor) */}
                  <div className="flex flex-col-reverse gap-1 flex-1 min-w-0">
                    {group.messages.map(({ msg, originalIndex }: { msg: any; originalIndex: number }, mIdx: number) => (
                      <AnimatedItem key={msg.id} index={mIdx} delay={0.05}>
                        <div id={`msg-${msg.id}`} className="transition-all duration-300">
                          <MessageBubble
                            id={msg.id}
                            content={msg.content}
                            type={msg.type}
                            media_url={msg.media_url}
                            file_name={msg.file_name}
                            file_size={msg.file_size}
                            timestamp={displayTime(msg.created_at)}
                            isSentByMe={isSentByMe}
                            senderName={group.profile?.full_name}
                            senderAvatar={group.profile?.avatar_url}
                            isSequence={mIdx > 0}
                            isLastInSequence={mIdx === group.messages.length - 1}
                            status={msg.status}
                            uploadProgress={msg.uploadProgress}
                            highlight={debouncedQuery}
                            activeMatchWithinMessage={isSearchVisible && searchResults[currentMatchIndex]?.messageIndex === originalIndex ? searchResults[currentMatchIndex].matchIndexInContent : -1}
                            onDelete={deleteMessage}
                            hideAvatar={true}
                            isSelected={selectedMessageIds.includes(msg.id)}
                            onSelect={handleMessageSelect}
                            isSelectionMode={isSelectionMode}
                          />
                        </div>
                      </AnimatedItem>
                    ))}
                  </div>
                </div>
              );
            })}
            <div ref={loadMoreRef} className="h-4 flex items-center justify-center py-4">
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 text-[10px] font-black text-primary animate-pulse uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                  Loading History
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              )}
            </div>
          </>
        )}
      </GradualScroll>

      <MessageComposer
        onSendMessage={(text) => sendMessage(text)}
        onSendFile={(file, type) => sendFile(file, type)}
        onTyping={(isTyping) => sendTypingStatus(isTyping)}
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

      {/* Delete Confirmation BottomSheet */}
      <BottomSheet
        isOpen={isDeleteSheetOpen}
        onClose={() => setIsDeleteSheetOpen(false)}
        title="Delete Messages ?"
      >
        <div className="px-6 pb-8 pt-4 flex flex-col items-center">

          {/* Text Context */}
          <div className="text-left mb-8">
            <p className="text-sm text-muted-foreground font-mono font-bold tracking-tight flex flex-col gap-2">
              <TriangleAlert className="w-10 h-10 text-yellow-500" /> This will permanently delete them from the chat and cannot be undone.
            </p>
          </div>


          {/* CSS Floating Message Stack Graphic */}
          <div className="relative w-full h-36 flex items-center justify-center mb-6 pointer-events-none">
            {/* Ambient danger glow */}
            <div className="absolute w-32 h-32 bg-red-500/15 rounded-full blur-2xl animate-pulse"></div>

            {/* Background Card */}
            <div className="absolute w-16 h-22 bg-secondary-foreground border border-border rounded-xl transform -rotate-12 -translate-x-6 translate-y-3 opacity-40 shadow-sm transition-transform"></div>

            {/* Middle Card */}
            <div className="absolute w-16 h-22 bg-secondary-foreground border border-border rounded-xl transform rotate-6 translate-x-6 translate-y-1 opacity-70 shadow-sm"></div>

            {/* Foreground Target Card */}
            <div className="absolute w-20 h-28 bg-accent-foreground/30 backdrop-blur-md border-2 border-accent-foreground rounded-xl transform -rotate-3 flex flex-col items-center justify-center shadow-xl shadow-accent-foreground/20 z-10">
              <span className="text-3xl font-black text-foreground tracking-tighter">
                {selectedMessageIds.length}
              </span>
              <span className="text-[9px] font-bold text-foreground uppercase tracking-widest mt-1">
                Items
              </span>
            </div>
          </div>

          
          {/* Actions */}
          <div className="w-full space-y-3">

            {canDeleteForEveryone && (
              <button
                onClick={() => handleConfirmDelete(true)}
                className="relative w-full h-14 bg-red-600/10 rounded-2xl overflow-hidden group touch-none border border-red-600/20"
              >
                <div className="absolute top-0 left-0 h-full bg-red-600 w-0 group-active:w-full transition-all duration-100 ease-out z-0"></div>

                {/* Button Content */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 z-10 text-red-600 group-active:text-white transition-colors duration-300">
                  <Globe className="w-4 h-4" />
                  <span className="font-bold text-sm">Delete for Everyone</span>
                </div>
              </button>
            )}

            {/* Standard Quick Tap Button */}
            <button
              onClick={() => handleConfirmDelete(false)}
              className="relative w-full h-14 bg-background border-2 border-border hover:border-foreground/20 rounded-2xl flex items-center justify-center gap-2 hover:bg-secondary/50 transition-all text-muted-foreground hover:text-foreground active:scale-[0.98]"
            >
              <User className="w-4 h-4" />
              <span className="font-bold text-sm">Delete just for me</span>
            </button>

            {/* Subtle Cancel Link */}
            <button
              onClick={() => setIsDeleteSheetOpen(false)}
              className="w-full pt-4 text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors"
            >
              Keep Messages
            </button>

          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
