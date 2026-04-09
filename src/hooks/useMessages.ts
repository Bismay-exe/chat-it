import { useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, supabaseUrl } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export interface MessageData {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'file';
  media_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  created_at: string;
  profiles?: { full_name: string; avatar_url: string | null } | null;
  status?: 'sending' | 'sent' | 'error' | 'read';
}

export function useMessages(chatId: string | undefined) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['messages', chatId, user?.id],
    queryFn: async ({ pageParam }) => {
      if (!chatId || !user) return [];
      const { data, error } = await (supabase as any).rpc('get_chat_messages', {
        p_chat_id: chatId,
        p_user_id: user.id,
        p_before: pageParam ?? null,
        p_limit: 30
      });
      if (error) throw error;
      return (data as any[]).map(m => ({
        id: m.res_id,
        chat_id: m.res_chat_id,
        sender_id: m.res_sender_id,
        content: m.res_content,
        type: m.res_type,
        created_at: m.res_created_at,
        profiles: m.res_profiles,
        status: m.res_status,
        media_url: m.res_media_url,
        file_name: m.res_file_name,
        file_size: m.res_file_size || m.file_size
      })).reverse() as MessageData[];
    },
    enabled: !!chatId && !!user,
    initialPageParam: null as string | null,
    getNextPageParam: (firstPage) => {
      // Since we reverse each page, the "earliest" message in the page is at index 0
      return firstPage.length === 30 ? firstPage[0].created_at : undefined;
    },
    staleTime: Infinity,
  });

  // Flatten messages for UI: Reverse pages so oldest page is first, then flatten
  const messages = data?.pages ? [...data.pages].reverse().flat() : [];


  useEffect(() => {
    if (!chatId || !user) return;

    const messageChannel = supabase.channel(`messages:${chatId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, async (payload) => {
        const newMessage = payload.new as any;
        if (newMessage.sender_id === user.id) return;

        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', newMessage.sender_id).single();

        queryClient.setQueryData(['messages', chatId, user.id], (old: any) => {
          if (!old) return old;
          
          // Check for existing message to prevent duplicates (Realtime vs Fetching race)
          const messageExists = old.pages.some((page: any[]) => 
            page.some((m: any) => m.id === newMessage.id)
          );
          if (messageExists) return old;

          // Append to the most recent page (which is at index 0 in the pages array)
          const updatedPages = [...old.pages];
          updatedPages[0] = [...updatedPages[0], { ...newMessage, profiles: profile, status: 'sent' }];
          return { ...old, pages: updatedPages };
        });
      })
      .subscribe();

    const readChannel = supabase.channel(`reads:${chatId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'chat_members', 
        filter: `chat_id=eq.${chatId}` 
      }, (payload) => {
        const updatedMember = payload.new as any;
        // Only trigger if another user read the messages
        if (updatedMember.user_id !== user.id) {
          queryClient.invalidateQueries({ queryKey: ['messages', chatId, user.id] });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(readChannel);
    };
  }, [chatId, user?.id, queryClient]);

  // Optimized Mark as Read: Updates last_read_at in chat_members
  useEffect(() => {
    if (!chatId || !user || messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    // Only mark as read if the last message is not from us
    if (lastMessage.sender_id === user.id) return;

    const markRead = async () => {
      try {
        const { error } = await supabase
          .from('chat_members')
          .update({ last_read_at: new Date().toISOString() })
          .eq('chat_id', chatId)
          .eq('user_id', user.id);
        
        if (!error) {
          // Invalidate chats to update unread badges
          queryClient.invalidateQueries({ queryKey: ['chats', user.id] });
        }
      } catch (err) {
        console.error('Failed to update last_read_at:', err);
      }
    };
    markRead();
  }, [messages.length, chatId, user?.id, queryClient]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!chatId || !user) throw new Error('Not initialized');
      const { data, error } = await supabase
        .from('messages')
        .insert({ chat_id: chatId, sender_id: user.id, content: content.trim(), type: 'text' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: ['messages', chatId, user?.id] });
      const previousData = queryClient.getQueryData(['messages', chatId, user?.id]);
      
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: MessageData = {
        id: tempId,
        chat_id: chatId!,
        sender_id: user!.id,
        content: content.trim(),
        type: 'text',
        created_at: new Date().toISOString(),
        status: 'sending'
      };

      queryClient.setQueryData(['messages', chatId, user?.id], (old: any) => {
        if (!old) return { pages: [[optimisticMessage]], pageParams: [null] };
        const updatedPages = [...old.pages];
        updatedPages[0] = [...updatedPages[0], optimisticMessage];
        return { ...old, pages: updatedPages };
      });

      return { previousData, tempId };
    },
    onError: (err: any, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['messages', chatId, user?.id], context.previousData);
      }
      toast.error('Failed to send: ' + err.message);
    },
    onSuccess: (data, _, context) => {
      queryClient.setQueryData(['messages', chatId, user?.id], (old: any) => {
        if (!old || !old.pages?.[0]) return old;
        const updatedPages = [...old.pages];
        updatedPages[0] = updatedPages[0].map((m: MessageData) => 
          m.id === context?.tempId ? { ...data, status: 'sent' as const, profiles: { full_name: user?.user_metadata?.full_name || 'Me' } } : m
        );
        return { ...old, pages: updatedPages };
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chats', user?.id] });
    }
  });

  const sendFileMutation = useMutation({
    mutationFn: async ({ file, type, tempId }: { file: File, type: 'image' | 'video' | 'file', tempId: string }) => {
      if (!chatId || !user) throw new Error('Not initialized');

      // 1. Upload to Telegram via Edge Function
      const formData = new FormData();
      formData.append('file', file);
      
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

      const uploadData: any = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${supabaseUrl}/functions/v1/telegram-upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            queryClient.setQueryData(['messages', chatId, user?.id], (old: any) => {
              if (!old || !old.pages?.[0]) return old;
              const updatedPages = [...old.pages];
              updatedPages[0] = updatedPages[0].map((m: any) => 
                m.id === tempId ? { ...m, uploadProgress: percent } : m
              );
              return { ...old, pages: updatedPages };
            });
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (err) {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            try {
              const errData = JSON.parse(xhr.responseText);
              reject(new Error(errData?.error || `API returned ${xhr.status}`));
            } catch {
              reject(new Error(`API returned ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.send(formData);
      });
      
      const fileId = uploadData?.file_id;
      if (!fileId) throw new Error('Failed to retrieve file_id from Telegram');

      const publicUrl = `${supabaseUrl}/functions/v1/telegram-proxy?file_id=${encodeURIComponent(fileId)}`;

      // 2. Insert Message
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content: '',
          type,
          media_url: publicUrl,
          file_name: file.name,
          file_size: file.size
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ file, type, tempId }) => {
      await queryClient.cancelQueries({ queryKey: ['messages', chatId, user?.id] });
      const previousData = queryClient.getQueryData(['messages', chatId, user?.id]);
      
      const optimisticMessage: MessageData & { uploadProgress?: number } = {
        id: tempId,
        chat_id: chatId!,
        sender_id: user!.id,
        content: '',
        type,
        file_name: file.name,
        file_size: file.size,
        media_url: URL.createObjectURL(file), // Local preview
        created_at: new Date().toISOString(),
        status: 'sending',
        uploadProgress: 0
      };

      queryClient.setQueryData(['messages', chatId, user?.id], (old: any) => {
        if (!old) return { pages: [[optimisticMessage]], pageParams: [null] };
        const updatedPages = [...old.pages];
        updatedPages[0] = [optimisticMessage, ...updatedPages[0]];
        return { ...old, pages: updatedPages };
      });

      return { previousData, tempId };
    },
    onError: (err: any, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['messages', chatId, user?.id], context.previousData);
      }
      toast.error('Upload failed: ' + err.message);
    },
    onSuccess: (data, _, context) => {
      queryClient.setQueryData(['messages', chatId, user?.id], (old: any) => {
        if (!old || !old.pages?.[0]) return old;
        const updatedPages = [...old.pages];
        updatedPages[0] = updatedPages[0].map((m: any) => 
          m.id === context?.tempId ? { ...data, status: 'sent' as const, profiles: { full_name: user?.user_metadata?.full_name || 'Me' } } : m
        );
        return { ...old, pages: updatedPages };
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chats', user?.id] });
    }
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
      if (error) throw error;
      return messageId;
    },
    onSuccess: (messageId) => {
      queryClient.setQueryData(['messages', chatId, user?.id], (old: any) => {
        if (!old) return old;
        const updatedPages = old.pages.map((page: any) => 
          page.filter((m: any) => m.id !== messageId)
        );
        return { ...old, pages: updatedPages };
      });
      toast.success('Message deleted');
    }
  });

  return { 
    messages, 
    isLoading, 
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    sendMessage: (content: string) => sendMessageMutation.mutate(content),
    sendFile: (file: File, type: 'image' | 'video' | 'file') => {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return sendFileMutation.mutateAsync({ file, type, tempId });
    },
    deleteMessage: (id: string) => deleteMessageMutation.mutate(id)
  };
}
