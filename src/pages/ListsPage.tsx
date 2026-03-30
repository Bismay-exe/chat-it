import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Plus, Trash2, Loader2, GripVertical } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Input } from '@/components/ui/Input';

interface List {
  id: string;
  name: string;
  is_default: boolean;
  sort_order: number;
}

export const ListsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchLists = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setLists((data as any[]).map(l => ({
        id: l.id,
        name: l.name,
        is_default: !!l.is_default,
        sort_order: l.sort_order || 0
      })));
    } catch (err: any) {
      toast.error('Failed to load lists');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, [user]);

  const handleCreateList = async () => {
    if (!newListName.trim() || !user) return;
    setIsCreating(true);
    try {
      const { error } = await supabase
        .from('lists')
        .insert({
          user_id: user.id,
          name: newListName.trim(),
          is_default: false,
          sort_order: lists.length
        });
      
      if (error) throw error;
      toast.success('List created');
      setNewListName('');
      setShowCreateModal(false);
      fetchLists();
    } catch (err: any) {
      toast.error('Failed to create list');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteList = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('List deleted');
      fetchLists();
    } catch (err: any) {
      toast.error('Failed to delete list');
    }
  };

  return (
    <div className="flex flex-col h-full bg-secondary/10 absolute inset-0 z-50 overflow-y-auto">
      <TopBar 
        leftElement={
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-lg">Chat Lists</span>
          </div>
        }
        rightElement={
          <button 
            onClick={() => setShowCreateModal(true)}
            className="p-2 hover:bg-secondary rounded-full premium-transition"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />
      
      <div className="p-6 border-b border-border bg-background">
        <h3 className="text-xl font-bold mb-2">Organize your chats</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Create custom lists to organize your conversations and easily filter them in the main view.
        </p>
      </div>

      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary/50" /></div>
        ) : (
          <div className="bg-background rounded-3xl overflow-hidden border border-border shadow-sm divide-y divide-border/50">
            {lists.length === 0 && (
               <div className="p-12 text-center text-muted-foreground">
                  <p className="text-sm">You haven't created any custom lists yet.</p>
               </div>
            )}
            {lists.map(list => (
              <div key={list.id} className="w-full p-4 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                   <GripVertical className="w-4 h-4 text-muted-foreground/30 cursor-grab active:cursor-grabbing" />
                   <span className="text-[16px] font-semibold">{list.name}</span>
                   {list.is_default && <span className="text-[10px] font-black text-primary/60 uppercase tracking-tighter bg-primary/5 px-1.5 py-0.5 rounded">Default</span>}
                </div>
                {!list.is_default && (
                  <button 
                    onClick={() => handleDeleteList(list.id)}
                    className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomSheet 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        title="Create New List"
      >
        <div className="p-6 space-y-6 pb-12">
          <div className="space-y-3">
            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">List Name</label>
            <Input 
              autoFocus
              placeholder="e.g. Work, Family, Study" 
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="bg-secondary/30 border-none py-6 rounded-2xl text-lg focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-3">
             <button 
               onClick={() => setShowCreateModal(false)}
               className="flex-1 py-4 rounded-2xl font-bold text-muted-foreground bg-secondary/50 hover:bg-secondary transition-colors"
             >
               Cancel
             </button>
             <button 
               onClick={handleCreateList}
               disabled={!newListName.trim() || isCreating}
               className="flex-1 py-4 rounded-2xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
             >
               {isCreating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Create List'}
             </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};
