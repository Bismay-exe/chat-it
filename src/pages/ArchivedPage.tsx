import { useNavigate } from 'react-router';
import { ArrowLeft, Archive, Loader2 } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { useChats } from '@/hooks/useChats';
import { ChatListItem } from '@/components/chat/ChatListItem';

export const ArchivedPage = () => {
  const navigate = useNavigate();
  const { chats, isLoading, toggleArchive, toggleFavorite, toggleMute, deleteChat } = useChats();
  
  const archivedChats = chats.filter(c => c.is_archived);

  return (
    <div className="flex flex-col h-full bg-background absolute inset-0 z-50">
      <TopBar 
        leftElement={
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-lg">Archived</span>
          </div>
        }
      />
      
      <div className="text-center p-3 text-[13px] text-muted-foreground bg-secondary/20">
        These chats stay archived when new messages are received.
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : archivedChats.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <Archive className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-sm">No archived chats.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {archivedChats.map(chat => (
              <ChatListItem 
                key={chat.chat_id} 
                {...chat} 
                onClick={() => navigate(`/chats/${chat.chat_id}`)}
                onArchive={() => toggleArchive(chat.chat_id, chat.is_archived)}
                onFavorite={() => toggleFavorite(chat.chat_id, chat.is_favorite)}
                onMute={() => toggleMute(chat.chat_id, chat.is_muted)}
                onDelete={() => deleteChat(chat.chat_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
