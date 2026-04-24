import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Search, ShieldAlert, Ban, Trash2 } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const AdminUsers: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

  const toggleBan = async (id: string, currentlyBanned: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_banned: !currentlyBanned }).eq('id', id);
    if (error) {
      toast.error('Failed to update ban status');
    } else {
      toast.success(currentlyBanned ? 'User unbanned' : 'User banned');
      fetchUsers();
    }
  };

  const filteredUsers = users.filter(u => u.username?.includes(search) || u.full_name?.includes(search));

  return (
    <div className="flex flex-col h-full">
      <TopBar 
        leftElement={
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin')} className="md:hidden p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-lg leading-tight">User Management</span>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search users by name or username..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border/20 rounded-xl pl-10 pr-4 py-3 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="bg-card border border-border/10 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No users found.</div>
            ) : (
              <div className="divide-y divide-border/10">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex flex-col items-center justify-center text-primary font-bold">
                          {user.full_name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-[15px]">{user.full_name}</p>
                          {user.role === 'admin' && <span className="bg-primary/20 text-primary text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm">Admin</span>}
                          {user.is_banned && <span className="bg-red-500/20 text-red-500 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm">Banned</span>}
                        </div>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleBan(user.id, user.is_banned)}
                        className={`p-2 rounded-lg transition-colors ${user.is_banned ? 'text-green-500 hover:bg-green-500/10' : 'text-orange-500 hover:bg-orange-500/10'}`}
                        title={user.is_banned ? "Unban User" : "Ban User"}
                      >
                        {user.is_banned ? <ShieldAlert className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                      </button>
                      <button 
                        className="p-2 rounded-lg text-red-600 hover:bg-red-500/10 transition-colors"
                        title="Soft Delete User"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
