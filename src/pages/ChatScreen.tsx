import React, { useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { TopBar } from '@/components/layout/TopBar';
import { Avatar } from '@/components/ui/Avatar';
import { ArrowLeft, MoreVertical, Phone, Video, Loader2 } from 'lucide-react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { useMessages } from '@/hooks/useMessages';
import { useChats } from '@/hooks/useChats';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';

export const ChatScreen: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, sendMessage } = useMessages(id);
  const { chats } = useChats();
  const chatInfo = chats.find(c => c.chat_id === id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, [messages, id]);

  const displayTime = (ts: string) => {
    try {
      return format(new Date(ts), 'h:mm a');
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-secondary/10 relative">
      <TopBar 
        className="bg-background/95 border-b border-border shadow-sm shrink-0"
        leftElement={
          <div className="flex items-center gap-1">
            <button onClick={() => navigate('/chats')} className="md:hidden p-2 mr-1 hover:bg-secondary rounded-full premium-transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Avatar src={chatInfo?.avatar_url} fallback={chatInfo?.name || 'C'} size="sm" />
          </div>
        }
        title={
          <div className="flex flex-col">
            <span className="text-base font-semibold leading-tight">{chatInfo?.name || 'Chat'}</span>
            {/* Real presence would replace this */}
          </div>
        }
        rightElement={
          <div className="flex items-center gap-0.5 text-muted-foreground">
            <button className="p-2 hover:bg-secondary rounded-full premium-transition"><Video className="w-5 h-5" /></button>
            <button className="p-2 hover:bg-secondary rounded-full premium-transition"><Phone className="w-5 h-5" /></button>
            <button className="p-2 hover:bg-secondary rounded-full premium-transition"><MoreVertical className="w-5 h-5" /></button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto w-full py-4 flex flex-col gap-1">
        {isLoading && messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <MessageBubble 
                key={msg.id} 
                id={msg.id}
                content={msg.content}
                timestamp={displayTime(msg.created_at)}
                isSentByMe={msg.sender_id === user?.id}
                senderName={msg.profiles?.full_name}
                isSequence={idx > 0 && messages[idx-1].sender_id === msg.sender_id} 
              />
            ))}
            <div ref={messagesEndRef} className="pb-2" />
          </>
        )}
      </div>

      <MessageComposer onSendMessage={(text) => sendMessage(text)} disabled={isLoading && messages.length === 0} />
    </div>
  );
};
