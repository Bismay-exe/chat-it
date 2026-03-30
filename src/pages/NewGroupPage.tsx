import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, Camera, Check, X, Shield, MessageSquare, UserPlus, Link, ShieldCheck, Loader2 } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useRef } from 'react';

interface Contact {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

export const NewGroupPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [step, setStep] = useState(1);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [permissions, setPermissions] = useState({
    can_edit_group_settings: false,
    can_send_messages: true,
    can_add_members: true,
    can_invite_via_link: true,
    require_admin_approval: false
  });

  useEffect(() => {
    const fetchContacts = async () => {
      if (!user) return;
      const { data } = await (supabase as any).rpc('get_recent_contacts', { p_user_id: user.id });
      if (data) setContacts(data);
    };
    fetchContacts();
  }, [user]);

  const toggleUser = (u: Contact) => {
    setSelectedUsers(prev => 
      prev.find(item => item.id === u.id) 
        ? prev.filter(item => item.id !== u.id) 
        : [...prev, u]
    );
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `group-${Math.random()}.${fileExt}`;
      const filePath = `group-avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast.success('Avatar uploaded');
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!name.trim() || !user) return;
    setIsCreating(true);

    try {
      console.log('Starting group creation...');
      // 1. Create chat
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert({ type: 'group', created_by: user.id })
        .select()
        .single();
      
      if (chatError) {
        console.error('Chat creation error:', chatError);
        throw new Error('Failed to initialize group chat: ' + chatError.message);
      }
      if (!chatData) throw new Error('No chat data returned after creation');

      console.log('Chat created:', chatData.id);

      // 2. Group info
      const { error: infoError } = await supabase.from('group_info').insert({ 
        chat_id: chatData.id, 
        name: name.trim(), 
        about: about.trim(),
        is_public: isPublic,
        avatar_url: avatarUrl
      });
      
      if (infoError) {
        console.error('Group info error:', infoError);
        throw new Error('Failed to save group details: ' + infoError.message);
      }

      console.log('Group info saved');

      // 3. Permissions
      const { error: permError } = await supabase.from('group_permissions').insert({
        chat_id: chatData.id,
        ...permissions
      });

      if (permError) {
        console.error('Group permissions error:', permError);
        throw new Error('Failed to set group permissions: ' + permError.message);
      }

      console.log('Permissions saved');

      // 4. Members (self as admin + selected members)
      const members = [
        { chat_id: chatData.id, user_id: user.id, role: 'admin' },
        ...selectedUsers.map(u => ({ chat_id: chatData.id, user_id: u.id, role: 'member' }))
      ];
      
      const { error: membersError } = await supabase.from('chat_members').insert(members);
      
      if (membersError) {
        console.error('Members insertion error:', membersError);
        throw new Error('Failed to add group members: ' + membersError.message);
      }

      console.log('Group members added. Success!');
      toast.success('Group created!');
      navigate(`/chats/${chatData.id}`);
    } catch (err: any) {
      console.error('Group creation failure:', err);
      toast.error(err.message || 'An unexpected error occurred during group creation');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.full_name.toLowerCase().includes(search.toLowerCase()) || 
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  if (step === 1) {
    return (
      <div className="flex flex-col h-full bg-background absolute inset-0 z-50">
        <TopBar 
          leftElement={
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex flex-col">
                <span className="font-semibold text-lg leading-tight">Add Members</span>
                <span className="text-xs text-muted-foreground">{selectedUsers.length} of {contacts.length} selected</span>
              </div>
            </div>
          }
        />
        
        <div className="px-4 py-2">
          <Input 
            placeholder="Search contacts" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="bg-secondary/50 border-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto mt-2">
          {filteredContacts.map(c => {
            const isSelected = selectedUsers.find(u => u.id === c.id);
            return (
              <button 
                key={c.id} 
                onClick={() => toggleUser(c)}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-secondary/30 premium-transition group"
              >
                <div className="relative">
                  <Avatar src={c.avatar_url} fallback={c.full_name} />
                  {isSelected && (
                    <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5 border-2 border-background">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left border-b border-border/50 pb-3 group-last:border-none">
                  <div className="font-medium">{c.full_name}</div>
                  <div className="text-sm text-muted-foreground">@{c.username}</div>
                </div>
              </button>
            );
          })}
        </div>

        {selectedUsers.length > 0 && (
          <div className="bg-background border-t border-border p-4">
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {selectedUsers.map(u => (
                <div key={u.id} className="relative shrink-0 flex flex-col items-center gap-1 w-14">
                  <Avatar src={u.avatar_url} fallback={u.full_name} size="md" />
                  <span className="text-[10px] text-muted-foreground truncate w-full text-center">{u.full_name}</span>
                  <button 
                    onClick={() => toggleUser(u)}
                    className="absolute -top-1 -right-1 bg-secondary rounded-full p-1 shadow-sm border border-border"
                  >
                    <X className="w-2 h-2" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={cn("p-4 flex justify-end transition-all", selectedUsers.length === 0 && "opacity-0 pointer-events-none")}>
          <button 
            onClick={() => setStep(2)}
            className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 shadow-lg"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background absolute inset-0 z-50 overflow-y-auto">
      <TopBar 
        leftElement={
          <div className="flex items-center gap-2">
            <button onClick={() => setStep(1)} className="p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-lg">New Group</span>
          </div>
        }
      />

      <div className="p-6 space-y-8 max-w-xl mx-auto w-full">
        <div className="flex flex-col items-center space-y-4">
          <div 
            className="relative group cursor-pointer"
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <Avatar 
              src={avatarUrl || undefined} 
              fallback={name} 
              className="w-24 h-24 rounded-full border-4 border-background shadow-xl"
              size="xl"
            />
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 premium-transition flex items-center justify-center">
              {isUploading ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white" />}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarUpload} 
              className="hidden" 
              accept="image/*"
            />
          </div>
          <Input 
            className="text-center text-xl py-6 border-x-0 border-t-0 border-b rounded-none focus:ring-0"
            placeholder="Group Subject"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest px-1">About</label>
          <textarea 
            placeholder="Group description (optional)"
            className="w-full bg-secondary/30 rounded-2xl p-4 min-h-24 resize-none outline-none focus:ring-1 focus:ring-primary/20"
            value={about}
            onChange={e => setAbout(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="font-medium">Public Group</div>
              <div className="text-xs text-muted-foreground">Anyone can join via search</div>
            </div>
          </div>
          <button 
            onClick={() => setIsPublic(!isPublic)}
            className={cn("w-12 h-6 rounded-full transition-colors relative", isPublic ? "bg-primary" : "bg-muted-foreground/30")}
          >
            <div className={cn("absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform", isPublic && "translate-x-6")} />
          </button>
        </div>

        <button 
          onClick={() => setShowPermissions(true)}
          className="w-full flex items-center justify-between p-4 bg-secondary/30 rounded-2xl hover:bg-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 bg-accent/10 text-accent rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-medium">Group Permissions</span>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest px-1">Selected Members: {selectedUsers.length}</label>
          <div className="flex gap-4 overflow-x-auto py-2 scrollbar-hide">
            {selectedUsers.map(u => (
              <div key={u.id} className="shrink-0 flex flex-col items-center gap-1 w-14">
                <Avatar src={u.avatar_url} fallback={u.full_name} size="md" />
                <span className="text-[10px] text-muted-foreground truncate w-full text-center">{u.full_name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto p-4 flex justify-end">
        <button 
          onClick={handleCreateGroup}
          disabled={!name.trim() || isCreating}
          className="w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed premium-transition shadow-lg shadow-primary/20"
        >
          {isCreating ? <span className="animate-spin w-5 h-5 border-2 border-white rounded-full border-t-transparent" /> : <Check className="w-6 h-6" />}
        </button>
      </div>

      <BottomSheet isOpen={showPermissions} onClose={() => setShowPermissions(false)} title="Group Permissions">
        <div className="p-4 space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Members can:</h3>
            <PermissionToggle label="Edit group settings" icon={Shield} value={permissions.can_edit_group_settings} onChange={(v: boolean) => setPermissions(p => ({ ...p, can_edit_group_settings: v }))} />
            <PermissionToggle label="Send new messages" icon={MessageSquare} value={permissions.can_send_messages} onChange={(v: boolean) => setPermissions(p => ({ ...p, can_send_messages: v }))} />
            <PermissionToggle label="Add other members" icon={UserPlus} value={permissions.can_add_members} onChange={(v: boolean) => setPermissions(p => ({ ...p, can_add_members: v }))} />
            <PermissionToggle label="Invite via link or QR code" icon={Link} value={permissions.can_invite_via_link} onChange={(v: boolean) => setPermissions(p => ({ ...p, can_invite_via_link: v }))} />
          </div>
          
          <div className="space-y-4 pt-4 border-t border-border">
             <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Admin Controls:</h3>
             <PermissionToggle label="Approve new members" icon={ShieldCheck} value={permissions.require_admin_approval} onChange={(v: boolean) => setPermissions(p => ({ ...p, require_admin_approval: v }))} />
          </div>

          <button onClick={() => setShowPermissions(false)} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium mt-4">Done</button>
        </div>
      </BottomSheet>
    </div>
  );
};

const PermissionToggle = ({ label, icon: Icon, value, onChange }: { label: string; icon: any; value: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5 text-muted-foreground" />
      <span className="text-[15px]">{label}</span>
    </div>
    <button 
      onClick={() => onChange(!value)}
      className={cn("w-10 h-5 rounded-full transition-colors relative", value ? "bg-primary" : "bg-muted-foreground/30")}
    >
      <div className={cn("absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform", value && "translate-x-5")} />
    </button>
  </div>
);

