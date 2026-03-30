import React, { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Search, Plus, Settings, MessageSquareText, List as ListIcon, Check } from 'lucide-react';
import { ChatListItem } from '@/components/chat/ChatListItem';
import { cn } from '@/lib/utils';
import { useChats } from '@/hooks/useChats';
import { useChatLists } from '@/hooks/useChatLists';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Skeleton } from '@/components/ui/Skeleton';

export const ChatsPage: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('All');
  const [managingChatId, setManagingChatId] = useState<string | null>(null);

  const { chats, isLoading: isChatsLoading, toggleArchive, toggleFavorite, toggleMute, deleteChat } = useChats();
  const { customLists, memberships, isLoading: isListsLoading, toggleMembership } = useChatLists();

  const isLoading = isChatsLoading || isListsLoading;

  const handleChatClick = useCallback((chatId: string) => {
    navigate(`/chats/${chatId}`);
  }, [navigate]);

  const defaultTabs = ['All', 'Unread', 'Favourite', 'Groups'];
  const allTabs = [...defaultTabs, ...customLists.map(l => l.name), '+'];

  const isChildActive = !!children;

  const filteredChats = chats.filter(chat => {
    // Basic filter: only non-archived for these tabs
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

  return (
    <div className="flex w-full h-full">
      {/* Sidebar Chat List */}
      <div className={cn(
        "flex-col w-full md:w-[320px] lg:w-95 h-full bg-background border-r border-border shrink-0 top-0",
        isChildActive ? "hidden md:flex" : "flex"
      )}>
        {/* Top Navigation */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border bg-background/90 backdrop-blur-sm z-10 shrink-0">
          <h1 className="text-xl font-bold bg-linear-to-r from-primary to-[#aa3bffCC] bg-clip-text text-transparent">
            Chat-It
          </h1>
          <div className="flex items-center gap-1 text-muted-foreground">
            <button onClick={() => navigate('/search')} className="p-2 hover:bg-secondary rounded-full premium-transition"><Search className="w-5 h-5" /></button>
            <button onClick={() => navigate('/add')} className="p-2 hover:bg-secondary rounded-full premium-transition"><Plus className="w-5 h-5" /></button>
            <button onClick={() => navigate('/settings')} className="p-2 hover:bg-secondary rounded-full premium-transition"><Settings className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-3 py-2 border-b border-border overflow-x-auto no-scrollbar shrink-0">
          <div className="flex gap-2 min-w-max">
            {allTabs.map(tab => (
              <button
                key={tab}
                onClick={() => tab === '+' ? navigate('/chats/lists') : setActiveTab(tab)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium premium-transition whitespace-nowrap",
                  activeTab === tab 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2 pb-20 md:pb-2 space-y-0.5">
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
              {filteredChats.map(chat => (
                <ChatListItem
                  key={chat.chat_id}
                  {...chat}
                  isActive={id === chat.chat_id}
                  onClick={() => handleChatClick(chat.chat_id)}
                  onArchive={toggleArchive}
                  onFavorite={toggleFavorite}
                  onMute={toggleMute}
                  onDelete={deleteChat}
                  onManageLists={setManagingChatId}
                />
              ))}
              {filteredChats.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                  <p>No chats found. <br/><span className="text-sm">Click + to start one.</span></p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Panel */}
      <div className={cn(
        "flex-1 h-full bg-[#f4f3ec] dark:bg-[#16171d] relative overflow-hidden",
        !isChildActive ? "hidden md:flex flex-col items-center justify-center p-8 text-center" : "flex flex-col"
      )}>
        {!isChildActive && (
          <div className="max-w-md bg-background/50 p-8 rounded-3xl border border-border/50 shadow-sm backdrop-blur-sm">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl mx-auto mb-6 flex items-center justify-center mix-blend-multiply dark:mix-blend-screen">
              <MessageSquareText className="w-10 h-10 text-primary opacity-80" />
            </div>
            <h2 className="text-2xl font-medium mb-3">Chat-It Web</h2>
            <p className="text-muted-foreground">Select a chat from the sidebar to start messaging, or create a new conversation.</p>
          </div>
        )}
        {children}
      </div>

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
