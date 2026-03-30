import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { TopBar } from '@/components/layout/TopBar';
import { Avatar } from '@/components/ui/Avatar';
import { ArrowLeft, MoreVertical, Phone, Video, Loader2, Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { useMessages } from '@/hooks/useMessages';
import { useChats } from '@/hooks/useChats';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

import { useChatPermissions } from '@/hooks/useChatPermissions';

export const ChatScreen: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, sendMessage } = useMessages(id);
  const { chats } = useChats();
  const chatInfo = chats.find(c => c.chat_id === id);
  const { canSend } = useChatPermissions(id);

  const [isSearchVisible, setIsSearchVisible] = useState(false);
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

  useEffect(() => {
    if (!isSearchVisible && !isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, id, isSearchVisible, isLoading]);

  const displayTime = (ts: string) => {
    try {
      return format(new Date(ts), 'h:mm a');
    } catch {
      return '';
    }
  };

  const isRestricted = chatInfo?.chat_type === 'group' && !canSend;

  return (
    <div className="flex flex-col h-full w-full bg-secondary/10 relative overflow-hidden">
      <div className="flex flex-col shrink-0 z-20">
        <TopBar 
          className="bg-background/95 border-b border-border shadow-sm"
          leftElement={
            <div className="flex items-center gap-1">
              <button onClick={() => navigate('/chats')} className="md:hidden p-2 mr-1 hover:bg-secondary rounded-full premium-transition">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="cursor-pointer" onClick={() => navigate(`/chats/${id}/info`)}>
                <Avatar src={chatInfo?.avatar_url} fallback={chatInfo?.name || 'C'} size="sm" />
              </div>
            </div>
          }
          title={
            <div className="flex flex-col cursor-pointer" onClick={() => navigate(`/chats/${id}/info`)}>
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
              <button className="p-2 hover:bg-secondary rounded-full premium-transition" onClick={() => navigate(`/chats/${id}/info`)}><MoreVertical className="w-5 h-5" /></button>
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
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
            <p className="text-xs text-muted-foreground font-medium animate-pulse">Checking for messages...</p>
          </div>
        ) : messages.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center opacity-30 select-none grayscale">
              <MessageSquare className="w-16 h-16 mb-4" />
              <p className="text-sm font-bold tracking-widest uppercase">No messages yet</p>
              <p className="text-[10px] mt-1">Start the conversation below.</p>
           </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div key={msg.id} id={`msg-${msg.id}`} className="transition-all duration-300">
                <MessageBubble 
                  id={msg.id}
                  content={msg.content}
                  timestamp={displayTime(msg.created_at)}
                  isSentByMe={msg.sender_id === user?.id}
                  senderName={msg.profiles?.full_name}
                  isSequence={idx > 0 && messages[idx-1].sender_id === msg.sender_id}
                  highlight={searchQuery}
                  isCurrentHighlight={isSearchVisible && searchResults[currentMatchIndex] === idx}
                />
              </div>
            ))}
            <div ref={messagesEndRef} className="pb-4" />
          </>
        )}
      </div>

      <MessageComposer 
        onSendMessage={(text) => sendMessage(text)} 
        disabled={isLoading && messages.length === 0 || isRestricted} 
        placeholder={isRestricted ? "Only admins can send messages" : "Type a message..."}
      />
    </div>
  );
};

import { MessageSquare } from 'lucide-react';
