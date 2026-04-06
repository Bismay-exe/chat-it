import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Archive, ArchiveRestore, Loader2, X, Trash2, MoreVertical, Star, Info } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { useChats } from '@/hooks/useChats';
import { ChatListItem } from '@/components/chat/ChatListItem';
import { useUserActions } from '@/hooks/useUserActions';

export const ArchivedPage = () => {
  const navigate = useNavigate();
  const { chats, isLoading, toggleArchive, toggleFavorite, toggleMute, deleteChat } = useChats();
  const { blockUser } = useUserActions();
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  
  const archivedChats = chats.filter(c => c.is_archived);

  const toggleSelection = (chatId: string) => {
    setSelectedChatIds(prev => 
      prev.includes(chatId) ? prev.filter(id => id !== chatId) : [...prev, chatId]
    );
  };

  const clearSelection = () => setSelectedChatIds([]);

  const isSelectionMode = selectedChatIds.length > 0;

  const handleBulkAction = async (action: (id: string, ...args: any[]) => void, ...args: any[]) => {
    for (const chatId of selectedChatIds) {
      await action(chatId, ...args);
    }
    clearSelection();
  };

  const selectionDropdownItems = [
    {
      label: 'Add to Favorites',
      onClick: () => handleBulkAction((id) => toggleFavorite(id, false)),
      icon: <Star className="w-4 h-4" />
    },
    ...(selectedChatIds.length === 1 ? [
      {
        label: chats.find(c => c.chat_id === selectedChatIds[0])?.chat_type === 'group' ? 'Group Info' : 'Chat Info',
        onClick: () => {
          const firstId = selectedChatIds[0];
          const chat = chats.find(c => c.chat_id === firstId);
          if (window.innerWidth < 1024) {
            if (chat?.chat_type === 'group') {
              navigate(`/chats/${firstId}/info`);
            } else if (chat?.other_user_id) {
              navigate(`/profile/${chat.other_user_id}`);
            }
          } else {
            navigate(`/chats/${firstId}`);
            // Note: ArchivedPage might not have setShowInfo, but the sidebar will toggle if navigated back to Chats
          }
          clearSelection();
        },
        icon: <Info className="w-4 h-4" />
      }
    ] : [])
  ];

  return (
    <div className="flex flex-col h-full bg-background absolute inset-0 z-50">
      <TopBar 
        leftElement={
          isSelectionMode ? (
            <div className="flex items-center gap-4">
              <button onClick={clearSelection} className="p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
                <X className="w-6 h-6" />
              </button>
              <span className="font-bold text-xl">{selectedChatIds.length}</span>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="font-semibold text-lg">Archived</span>
            </div>
          )
        }
        rightElement={
          isSelectionMode && (
            <div className="flex items-center gap-1">
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
              <button onClick={() => handleBulkAction(deleteChat)} className="p-2 hover:bg-secondary rounded-full transition-colors text-red-500" title="Delete">
                <Trash2 className="w-5 h-5" />
              </button>
              <DropdownMenu items={selectionDropdownItems} icon={<MoreVertical className="w-5 h-5" />} />
            </div>
          )
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
                onInfo={(chatId) => {
                  const chat = chats.find(c => c.chat_id === chatId);
                  if (window.innerWidth < 1024) {
                    if (chat?.chat_type === 'group') {
                      navigate(`/chats/${chatId}/info`);
                    } else if (chat?.other_user_id) {
                      navigate(`/profile/${chat.other_user_id}`);
                    }
                  } else {
                    navigate(`/chats/${chatId}`);
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
