import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Search, Settings, MessageSquareText, List as ListIcon, Check, X, Pin, PinOff, Bell, BellOff, Archive, ArchiveRestore, Trash2, MoreVertical, Star, Info, Ban, LogOut } from 'lucide-react';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { ChatListItem } from '@/components/chat/ChatListItem';
import { cn } from '@/lib/utils';
import { useChats } from '@/hooks/useChats';
import { useChatLists } from '@/hooks/useChatLists';
import { usePinnedChats } from '@/hooks/usePinnedChats';
import { GradualScroll } from '@/components/ui/GradualScroll';
import { AnimatedItem } from '@/components/ui/AnimatedItem';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useAuthStore } from '@/stores/authStore';
import { Skeleton } from '@/components/ui/Skeleton';
import { Outlet } from 'react-router';
import { ChatInfoSidebar } from '@/components/chat/ChatInfoSidebar';
import { supabase } from '@/lib/supabase';
import { Avatar } from '@/components/ui/Avatar';
import GradualBlur from '@/components/ui/GradualBlur';
import { useUserActions } from '@/hooks/useUserActions';

export const ChatsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('All Chats');
  const [managingChatId, setManagingChatId] = useState<string | null>(null);

  const { chats, isLoading: isChatsLoading, toggleArchive, toggleFavorite, toggleMute, deleteChat } = useChats();
  const { customLists, memberships, isLoading: isListsLoading, toggleMembership } = useChatLists();
  const { pins, togglePin } = usePinnedChats();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showInfo, setShowInfo] = useState(true);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const { blockUser } = useUserActions();

  const isLoading = isChatsLoading || isListsLoading;

  const handleChatClick = useCallback((chatId: string) => {
    navigate(`/chats/${chatId}`);
  }, [navigate]);

  const defaultTabs = ['All Chats', 'Unread', 'Favourite', 'Groups', 'Archived'];
  const allTabs = [...defaultTabs, ...customLists.map(l => l.name), '+'];

  const isChildActive = !!id;

  const filteredChats = chats.filter(chat => {
    // Handling specific filters
    if (activeTab === 'Archived') return chat.is_archived;
    if (chat.is_archived) return false;

    if (activeTab === 'Unread') return (chat.unread_count || 0) > 0;
    if (activeTab === 'Favourite') return chat.is_favorite;
    if (activeTab === 'Groups') return chat.chat_type === 'group';

    const customList = customLists.find(l => l.name === activeTab);
    if (customList) {
      return memberships[customList.id]?.includes(chat.chat_id);
    }

    return true;
  });

  const sortedChats = useMemo(() => {
    return [...filteredChats].sort((a, b) => {
      const isPinnedA = pins.some(p => p.chat_id === a.chat_id && p.list_key === activeTab);
      const isPinnedB = pins.some(p => p.chat_id === b.chat_id && p.list_key === activeTab);
      if (isPinnedA && !isPinnedB) return -1;
      if (!isPinnedA && isPinnedB) return 1;
      return 0;
    });
  }, [filteredChats, pins, activeTab]);

  // Sidebar Search Logic
  const handleSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await (supabase.rpc as any)('search_user_chats', {
        p_user_id: useAuthStore.getState().user?.id,
        p_query: trimmed
      });

      if (!error && data) {
        setSearchResults(data.map((d: any) => ({
          id: d.chat_id,
          type: d.chat_type,
          name: d.name,
          avatar_url: d.avatar_url,
          username: d.username
        })));
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    handleSearch(val);
  };

  const toggleSelection = useCallback((chatId: string) => {
    setSelectedChatIds(prev => 
      prev.includes(chatId) ? prev.filter(id => id !== chatId) : [...prev, chatId]
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedChatIds([]);
  }, []);

  const handleBulkAction = async (action: (id: string, ...args: any[]) => void, ...args: any[]) => {
    for (const chatId of selectedChatIds) {
      await action(chatId, ...args);
    }
    clearSelection();
  };

  const isSelectionMode = selectedChatIds.length > 0;

  const selectionDropdownItems = useMemo(() => {
    const firstId = selectedChatIds[0];
    const firstChat = chats.find(c => c.chat_id === firstId);
    
    return [
      {
        label: 'Add to Favorites',
        onClick: () => handleBulkAction((id) => toggleFavorite(id, false)),
        icon: <Star className="w-4 h-4" />
      },
      {
        label: 'Manage Lists',
        onClick: () => setManagingChatId(firstId),
        icon: <ListIcon className="w-4 h-4" />
      },
      ...(selectedChatIds.length === 1 ? [
        {
          label: firstChat?.chat_type === 'group' ? 'Group Info' : 'Chat Info',
          onClick: () => {
            if (window.innerWidth < 1024) {
              if (firstChat?.chat_type === 'group') {
                navigate(`/chats/${firstId}/info`);
              } else if (firstChat?.other_user_id) {
                navigate(`/profile/${firstChat.other_user_id}`);
              }
            } else {
              handleChatClick(firstId);
              setShowInfo(true);
            }
            clearSelection();
          },
          icon: <Info className="w-4 h-4" />
        },
        {
          label: firstChat?.chat_type === 'group' ? 'Exit Group' : 'Block User',
          onClick: () => {
            if (firstChat?.chat_type === 'group') {
              deleteChat(firstId);
            } else if (firstChat?.other_user_id) {
              blockUser(firstChat.other_user_id);
            }
            clearSelection();
          },
          textClass: 'text-red-500',
          icon: firstChat?.chat_type === 'group' ? <LogOut className="w-4 h-4" /> : <Ban className="w-4 h-4" />
        }
      ] : [])
    ];
  }, [selectedChatIds, chats, toggleFavorite, deleteChat, blockUser, handleChatClick, clearSelection]);

  return (
    <div className="flex w-full h-full bg-[#212023] md:pr-3 md:py-3 md:gap-3">
      {/* Sidebar Chat List */} 
      <div className={cn(
        "flex-col w-full md:w-[320px] lg:w-95 h-full bg-background md:rounded-2xl border-r border-border shrink-0 top-0 relative",
        isChildActive ? "hidden md:flex" : "flex"
      )}>
        {/* Top Navigation */}
        <div className="h-20 flex items-center justify-between px-4 bg-background/90 md:rounded-4xl backdrop-blur-sm z-10 shrink-0">
          {isSelectionMode ? (
            <div className="flex items-center justify-between w-full animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <button 
                  onClick={clearSelection}
                  className="p-2 hover:bg-secondary rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <span className="text-xl font-bold font-bricolage-semi-condensed">{selectedChatIds.length}</span>
              </div>
              
              <div className="flex items-center gap-1 text-muted-foreground">
                <button 
                  onClick={() => {
                    const allPinned = selectedChatIds.every(id => pins.some(p => p.chat_id === id && p.list_key === activeTab));
                    handleBulkAction((id) => togglePin(id, activeTab, allPinned));
                  }}
                  className="p-2 hover:bg-secondary rounded-full transition-colors"
                  title={selectedChatIds.every(id => pins.some(p => p.chat_id === id && p.list_key === activeTab)) ? "Unpin" : "Pin"}
                >
                  {selectedChatIds.every(id => pins.some(p => p.chat_id === id && p.list_key === activeTab)) ? <PinOff className="w-5 h-5" /> : <Pin className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => {
                    const allMuted = selectedChatIds.every(id => chats.find(c => c.chat_id === id)?.is_muted);
                    handleBulkAction((id) => toggleMute(id, allMuted));
                  }}
                  className="p-2 hover:bg-secondary rounded-full transition-colors"
                  title={selectedChatIds.every(id => chats.find(c => c.chat_id === id)?.is_muted) ? "Unmute" : "Mute"}
                >
                  {selectedChatIds.every(id => chats.find(c => c.chat_id === id)?.is_muted) ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => {
                    const allArchived = selectedChatIds.every(id => chats.find(c => c.chat_id === id)?.is_archived);
                    handleBulkAction((id) => toggleArchive(id, allArchived));
                  }}
                  className="p-2 hover:bg-secondary rounded-full transition-colors"
                  title={selectedChatIds.every(id => chats.find(c => c.chat_id === id)?.is_archived) ? "Unarchive" : "Archive"}
                >
                  {selectedChatIds.every(id => chats.find(c => c.chat_id === id)?.is_archived) ? <ArchiveRestore className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => {
                    if (confirm(`Delete ${selectedChatIds.length} chat(s)?`)) {
                      handleBulkAction(deleteChat);
                    }
                  }}
                  className="p-2 hover:bg-secondary rounded-full transition-colors text-red-500"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="relative">
                  <DropdownMenu 
                    items={selectionDropdownItems} 
                    icon={<MoreVertical className="w-5 h-5" />}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <img src="/logo/chat-it.svg" alt="Chat-It" className="h-10 w-auto xdark:invert" />
              <div className="flex items-center gap-1 text-muted-foreground">
                <button 
                  onClick={() => {
                    setShowSearchBar(!showSearchBar);
                    if (showSearchBar) {
                      setSearchQuery('');
                      setSearchResults([]);
                    }
                  }} 
                  className={cn(
                    "p-2 rounded-full premium-transition", 
                    showSearchBar ? "bg-primary/10 text-primary" : "hover:bg-secondary"
                  )}
                >
                  <Search className={cn("w-5 h-5", showSearchBar ? "fill-primary" : "")} />
                </button>
                <button onClick={() => navigate('/settings')} className="p-2 hover:bg-secondary rounded-full premium-transition"><Settings className="w-5 h-5" /></button>
              </div>
            </>
          )}
        </div>

        {/* Sidebar Search Bar */}
        {showSearchBar && (
          <div className="px-4 py-3 border-b border-border bg-background animate-in slide-in-from-top-2 duration-200">
            <div className="relative group border border-black/10 rounded-full">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={onSearchChange}
                placeholder="Search chats..."
                className="w-full h-10 pl-10 pr-4 rounded-full bg-secondary/70 border-none text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/60"
              />
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
              {isSearching && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className={cn("px-3 py-1", showSearchBar ? "hidden" : "block")}>
          <div className="p-0.5 bg-muted-foreground/10 rounded-full border border-black/10 overflow-x-auto no-scrollbar shrink-0">
            <div className="flex gap-2 min-w-max">
              {allTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => tab === '+' ? navigate('/chats/lists') : setActiveTab(tab)}
                  className={cn(
                    "px-5 py-1 rounded-full text-sm font-bold premium-transition whitespace-nowrap",
                    activeTab === tab
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat List or Search Results */}
        <GradualScroll className="flex-1" scrollClassName="pb-20 md:pb-2 space-y-0.5 no-scrollbar">
          {searchQuery.trim().length >= 2 ? (
            <div className="space-y-1">
              <div className="px-3 py-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-60">Search Results</div>
              {searchResults.map((r, i) => (
                <AnimatedItem key={r.id} index={i} delay={i * 0.05}>
                  <button
                    onClick={() => {
                      handleChatClick(r.id);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/40 transition-all text-left"
                  >
                    <Avatar src={r.avatar_url} fallback={r.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[15px] truncate">{r.name}</div>
                      <div className="text-[10px] text-muted-foreground">@{r.username || r.type}</div>
                    </div>
                  </button>
                </AnimatedItem>
              ))}
              {searchResults.length === 0 && !isSearching && (
                <div className="text-center p-8 text-muted-foreground text-sm">No results found</div>
              )}
            </div>
          ) : (
            <>
              {isLoading ? (
                <div className="space-y-1">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2 py-1">
                        <Skeleton className="h-4 w-[40%]" />
                        <Skeleton className="h-3 w-[70%]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {sortedChats.map((chat, i) => (
                    <AnimatedItem key={chat.chat_id} index={i}>
                      <ChatListItem
                        {...chat}
                        is_pinned={pins.some(p => p.chat_id === chat.chat_id && p.list_key === activeTab)}
                        isActive={id === chat.chat_id}
                        currentListKey={activeTab}
                        onClick={() => handleChatClick(chat.chat_id)}
                        onArchive={toggleArchive}
                        onFavorite={toggleFavorite}
                        onMute={toggleMute}
                        onPin={(id, current) => togglePin(id, activeTab, current)}
                        onDelete={deleteChat}
                        onManageLists={setManagingChatId}
                        onInfo={(chatId) => {
                          const chat = chats.find(c => c.chat_id === chatId);
                          if (window.innerWidth < 1024) {
                            if (chat?.chat_type === 'group') {
                              navigate(`/chats/${chatId}/info`);
                            } else if (chat?.other_user_id) {
                              navigate(`/profile/${chat.other_user_id}`);
                            }
                          } else {
                            handleChatClick(chatId);
                            setShowInfo(true);
                          }
                        }}
                        onBlock={(userId) => {
                          if (confirm('Are you sure you want to block this user?')) {
                            blockUser(userId);
                          }
                        }}
                        onLeaveGroup={(chatId) => {
                          if (confirm('Are you sure you want to leave this group?')) {
                            deleteChat(chatId);
                          }
                        }}
                        isSelected={selectedChatIds.includes(chat.chat_id)}
                        onSelect={toggleSelection}
                        selectionMode={isSelectionMode}
                      />
                    </AnimatedItem>
                  ))}
                  {sortedChats.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center opacity-40">
                      <MessageSquareText className="w-10 h-10 mb-3" />
                      <p className="text-sm font-medium">No chats found in "{activeTab}"</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </GradualScroll>
        <div className="md:hidden block pointer-events-none">
          <GradualBlur position="bottom" className="z-10" height="5rem" opacity={1} curve="ease-in-out" />
        </div>
      </div>

      {/* Main Panel */}
      <div className={cn(
        "flex-1 h-full bg-[#f4f3ec] md:rounded-2xl dark:bg-[#16171d] relative overflow-hidden flex flex-col shadow-inner",
        !id ? "hidden md:flex flex-col items-center justify-center p-8 text-center" : "flex"
      )}>
        {!id && (
          <div className="max-w-md bg-background/50 p-8 rounded-2xl border border-border/50 shadow-sm backdrop-blur-sm animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl mx-auto mb-6 flex items-center justify-center mix-blend-multiply dark:mix-blend-screen">
              <MessageSquareText className="w-10 h-10 text-primary opacity-80" />
            </div>
            <h2 className="text-2xl font-bold mb-3 tracking-tight">Chat-It Web</h2>
            <p className="text-muted-foreground text-[15px] leading-relaxed">Select a chat from the sidebar to start messaging, or create a new conversation.</p>
          </div>
        )}
        <Outlet context={{ showInfo, setShowInfo }} />
      </div>

      {id && showInfo && (
        <div className="hidden lg:block w-[320px] xl:w-80 md:rounded-2xl overflow-hidden shrink-0 h-full animate-in slide-in-from-right duration-300">
          <ChatInfoSidebar chatId={id} onClose={() => setShowInfo(false)} />
        </div>
      )}

      <BottomSheet
        isOpen={!!managingChatId}
        onClose={() => setManagingChatId(null)}
        title="Move to List"
      >
        <div className="p-4 space-y-2">
          {customLists.map(list => {
            const isMember = memberships[list.id]?.includes(managingChatId || '');
            return (
              <button
                key={list.id}
                onClick={() => toggleMembership(managingChatId || '', list.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-secondary rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <ListIcon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{list.name}</span>
                </div>
                {isMember && <Check className="w-5 h-5 text-primary" />}
              </button>
            );
          })}
          {customLists.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
              <p>No custom lists yet.</p>
              <button
                onClick={() => { setManagingChatId(null); navigate('/chats/lists'); }}
                className="text-primary font-medium mt-2"
              >
                Create one now
              </button>
            </div>
          )}
          <button
            onClick={() => setManagingChatId(null)}
            className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold mt-4 shadow-lg shadow-primary/20"
          >
            Done
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};
