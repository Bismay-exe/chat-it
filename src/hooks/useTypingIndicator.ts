import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export interface TypingEvent {
  user_id: string;
  full_name: string;
}

export function useTypingIndicator(chatId: string | undefined) {
  const { user, profile } = useAuthStore();
  const [typingUsers, setTypingUsers] = useState<TypingEvent[]>([]);
  const timeoutsRef = useRef<Record<string, number>>({});

  const setTyping = useCallback((userId: string, fullName: string, isTyping: boolean) => {
    setTypingUsers((prev) => {
      const filtered = prev.filter((u) => u.user_id !== userId);
      if (isTyping) {
        return [...filtered, { user_id: userId, full_name: fullName }];
      }
      return filtered;
    });

    if (isTyping) {
      if (timeoutsRef.current[userId]) {
        window.clearTimeout(timeoutsRef.current[userId]);
      }
      timeoutsRef.current[userId] = window.setTimeout(() => {
        setTyping(userId, fullName, false);
      }, 3000);
    }
  }, []);

  useEffect(() => {
    if (!chatId || !user) return;

    const channelName = `typing:${chatId}`;
    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id !== user.id) {
          setTyping(payload.user_id, payload.full_name, payload.isTyping);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      Object.values(timeoutsRef.current).forEach(window.clearTimeout);
    };
  }, [chatId, user?.id, setTyping]);

  const sendTypingStatus = useCallback((isTyping: boolean) => {
    if (!chatId || !user) return;
    const channelName = `typing:${chatId}`;
    const channel = supabase.channel(channelName);
    
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: user.id,
        full_name: profile?.full_name || 'Someone',
        isTyping,
      },
    });
  }, [chatId, user?.id, profile?.full_name]);

  return { typingUsers, sendTypingStatus };
}
