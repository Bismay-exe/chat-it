import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, Camera } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export const NewGroupPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // In a real app, you would have a contact picker here before creating the group.
  // For simplicity based on PRD, we create the group with just the current user 
  // and they can invite others via link or adding them later via GroupInfo.

  const handleCreateGroup = async () => {
    if (!name.trim() || !user) return;
    setIsCreating(true);

    try {
      // 1. Create chat
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert({ type: 'group' })
        .select()
        .single();
      if (chatError) throw chatError;

      // 2. Create group info
      const { error: infoError } = await supabase
        .from('group_info')
        .insert({ chat_id: chatData.id, name: name.trim() });
      if (infoError) throw infoError;

      // 3. Add self as admin
      const { error: membersError } = await supabase
        .from('chat_members')
        .insert({ chat_id: chatData.id, user_id: user.id, role: 'admin' });
      if (membersError) throw membersError;

      toast.success('Group created!');
      navigate(`/chats/${chatData.id}`);
    } catch (err: any) {
      toast.error('Failed to create group: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background absolute inset-0 z-50">
      <TopBar 
        leftElement={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <span className="font-semibold text-lg leading-tight">New Group</span>
              <span className="text-xs text-muted-foreground">Add subject</span>
            </div>
          </div>
        }
      />
      
      <div className="flex flex-col items-center p-6 space-y-6">
        <button className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-secondary/80 premium-transition">
          <Camera className="w-8 h-8" />
        </button>

        <Input 
          className="text-center text-lg py-6"
          placeholder="Group Subject"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          disabled={isCreating}
        />

        <p className="text-xs text-muted-foreground text-center">
          Provide a group subject and optional group icon.
        </p>
      </div>

      <div className="mt-auto p-4 flex justify-end">
        <button 
          onClick={handleCreateGroup}
          disabled={!name.trim() || isCreating}
          className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed premium-transition shadow-lg shadow-primary/20"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
