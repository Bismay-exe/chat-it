import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Search, Plus, Settings, MessageSquareText, Loader2 } from 'lucide-react';
import { ChatListItem } from '@/components/chat/ChatListItem';
import { cn } from '@/lib/utils';
import { useChats } from '@/hooks/useChats';

export const ChatsPage: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('All');
  const tabs = ['All', 'Unread', 'Favourite', 'Groups', '+'];
  const { chats, isLoading, toggleArchive, toggleFavorite, toggleMute, deleteChat } = useChats();

  const isChildActive = !!children;

  const filteredChats = chats.filter(chat => {
    // Basic filter: only non-archived for these tabs
    if (chat.is_archived) return false;

    if (activeTab === 'Unread') return (chat.unread_count || 0) > 0;
    if (activeTab === 'Favourite') return chat.is_favorite;
    if (activeTab === 'Groups') return chat.chat_type === 'group';
    
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
          <h1 className="text-xl font-bold bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
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
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => tab === '+' ? navigate('/chats/lists') : setActiveTab(tab)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium premium-transition",
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
            <div className="h-20 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {filteredChats.map(chat => (
                <ChatListItem
                  key={chat.chat_id}
                  {...chat}
                  isActive={id === chat.chat_id}
                  onClick={() => navigate(`/chats/${chat.chat_id}`)}
                  onArchive={() => toggleArchive(chat.chat_id, chat.is_archived)}
                  onFavorite={() => toggleFavorite(chat.chat_id, chat.is_favorite)}
                  onMute={() => toggleMute(chat.chat_id, chat.is_muted)}
                  onDelete={() => deleteChat(chat.chat_id)}
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
    </div>
  );
};
