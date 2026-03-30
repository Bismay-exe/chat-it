import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Edit3, ImagePlus, Check, X, Loader2, Globe, Link as LinkIcon, Plus, Trash2, AlertCircle } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BottomSheet } from '@/components/ui/BottomSheet';

export const OwnProfilePage = () => {
  const navigate = useNavigate();
  const { profile, setProfile, user } = useAuthStore();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  
  const [newName, setNewName] = useState(profile?.full_name || '');
  const [newAbout, setNewAbout] = useState(profile?.about || '');
  const [newUsername, setNewUsername] = useState(profile?.username || '');
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAddingSocial, setIsAddingSocial] = useState(false);
  const [newSocialPlatform, setNewSocialPlatform] = useState('website');
  const [newSocialUrl, setNewSocialUrl] = useState('');

  // Debounced username check
  useEffect(() => {
    if (!isEditingUsername || newUsername === profile?.username) {
      setUsernameError(null);
      return;
    }

    const checkUsername = async () => {
      if (newUsername.length < 3) {
        setUsernameError('Username too short');
        return;
      }
      setIsCheckingUsername(true);
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', newUsername.toLowerCase())
          .single();
        
        if (data && data.id !== user?.id) {
          setUsernameError('Username is already taken');
        } else {
          setUsernameError(null);
        }
      } catch (err) {
        setUsernameError(null);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const timer = setTimeout(checkUsername, 500);
    return () => clearTimeout(timer);
  }, [newUsername, isEditingUsername, profile?.username]);

  const socialIcons: Record<string, any> = {
    website: Globe,
    default: LinkIcon
  };

  const handleUpdateProfile = async (updates: any) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;
      setProfile({ ...profile, ...updates });
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error('Update failed: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSocialLink = async () => {
    if (!newSocialUrl) return;
    const links = [...(profile?.social_links || []), { platform: newSocialPlatform, url: newSocialUrl }];
    await handleUpdateProfile({ social_links: links });
    setIsAddingSocial(false);
    setNewSocialUrl('');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await handleUpdateProfile({ avatar_url: publicUrl });
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
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
            <span className="font-semibold text-lg">Profile</span>
          </div>
        }
      />
      
      <div className="flex flex-col items-center mt-8 space-y-4 px-4 pb-12">
        <div 
          className="relative group cursor-pointer"
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <Avatar 
            src={profile?.avatar_url} 
            fallback={profile?.full_name} 
            className="w-32 h-32 rounded-full border-4 border-background shadow-xl"
            size="xl"
          />
          <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 premium-transition flex items-center justify-center">
            {isUploading ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <ImagePlus className="w-8 h-8 text-white" />}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarUpload} 
            className="hidden" 
            accept="image/*"
          />
        </div>

        <div className="w-full max-w-md bg-background rounded-3xl p-6 shadow-sm border border-border mt-6 space-y-8">
          {/* Name Section */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Your Name</span>
            <div className="flex items-center justify-between gap-4">
              {isEditingName ? (
                <div className="flex-1 flex items-center gap-2">
                  <input 
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 bg-secondary/50 rounded-lg px-3 py-2 outline-none border-b-2 border-primary"
                  />
                  <button onClick={() => { handleUpdateProfile({ full_name: newName }); setIsEditingName(false); }} className="p-2 text-primary hover:bg-primary/10 rounded-full premium-transition"><Check className="w-5 h-5" /></button>
                  <button onClick={() => { setIsEditingName(false); setNewName(profile?.full_name || ''); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full premium-transition"><X className="w-5 h-5" /></button>
                </div>
              ) : (
                <>
                  <span className="text-lg flex-1">{profile?.full_name || 'Loading...'}</span>
                  <button onClick={() => setIsEditingName(true)} className="p-2 text-muted-foreground hover:text-foreground premium-transition"><Edit3 className="w-4 h-4" /></button>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This is not your username or pin. This name will be visible to your Chat-It contacts.
            </p>
          </div>

          <div className="w-full h-px bg-border/50" />

          {/* Username Section */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Username</span>
            <div className="flex items-center justify-between gap-4">
              {isEditingUsername ? (
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input 
                        autoFocus
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        className="w-full bg-secondary/50 rounded-lg px-3 py-2 outline-none border-b-2 border-primary"
                        placeholder="username"
                      />
                      {isCheckingUsername && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-muted-foreground" />}
                    </div>
                    <button 
                      disabled={!!usernameError || isCheckingUsername}
                      onClick={() => { handleUpdateProfile({ username: newUsername }); setIsEditingUsername(false); }} 
                      className="p-2 text-primary hover:bg-primary/10 rounded-full premium-transition disabled:opacity-30"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button onClick={() => { setIsEditingUsername(false); setNewUsername(profile?.username || ''); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full premium-transition"><X className="w-5 h-5" /></button>
                  </div>
                  {usernameError && (
                    <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium px-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {usernameError}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <span className="text-lg flex-1">@{profile?.username || 'username'}</span>
                  <button onClick={() => setIsEditingUsername(true)} className="p-2 text-muted-foreground hover:text-foreground premium-transition"><Edit3 className="w-4 h-4" /></button>
                </>
              )}
            </div>
          </div>

          <div className="w-full h-px bg-border/50" />

          {/* Social Links Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Social Links</span>
              <button 
                onClick={() => setIsAddingSocial(true)}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Link
              </button>
            </div>
            
            <div className="space-y-3">
              {(profile?.social_links as any[])?.map((link, idx) => {
                const Icon = socialIcons[link.platform.toLowerCase()] || socialIcons.default;
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-secondary/30 rounded-2xl group">
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium truncate max-w-50">{link.url}</span>
                    </div>
                    <button 
                      onClick={() => {
                        const links = (profile?.social_links as any[]).filter((_, i) => i !== idx);
                        handleUpdateProfile({ social_links: links });
                      }}
                      className="p-1.5 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              {(!profile?.social_links || (profile?.social_links as any[]).length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-2 italic">No social links added</p>
              )}
            </div>
          </div>

          <div className="w-full h-px bg-border/50" />

          {/* About Section */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">About</span>
            <div className="flex items-center justify-between gap-4">
              {isEditingAbout ? (
                <div className="flex-1 flex items-center gap-2">
                  <textarea 
                    autoFocus
                    value={newAbout}
                    onChange={(e) => setNewAbout(e.target.value)}
                    className="flex-1 bg-secondary/50 rounded-lg px-3 py-2 outline-none border-b-2 border-primary resize-none"
                    rows={2}
                  />
                  <div className="flex flex-col gap-1">
                    <button onClick={() => { handleUpdateProfile({ about: newAbout }); setIsEditingAbout(false); }} className="p-2 text-primary hover:bg-primary/10 rounded-full premium-transition"><Check className="w-5 h-5" /></button>
                    <button onClick={() => { setIsEditingAbout(false); setNewAbout(profile?.about || ''); }} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full premium-transition"><X className="w-5 h-5" /></button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="text-[15px] flex-1 text-muted-foreground">{profile?.about || 'Available'}</span>
                  <button onClick={() => setIsEditingAbout(true)} className="p-2 text-muted-foreground hover:text-foreground premium-transition"><Edit3 className="w-4 h-4" /></button>
                </>
              )}
            </div>
          </div>
        </div>

        {isSaving && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
             <Loader2 className="w-4 h-4 animate-spin" />
             <span className="text-sm font-medium">Saving changes...</span>
          </div>
        )}
      </div>

      <BottomSheet
        isOpen={isAddingSocial}
        onClose={() => setIsAddingSocial(false)}
        title="Add Social Link"
      >
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Platform</label>
              <div className="grid grid-cols-2 gap-2">
                {['website', 'github', 'twitter', 'instagram', 'linkedin', 'other'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setNewSocialPlatform(p)}
                    className={cn(
                      "px-4 py-3 rounded-2xl text-sm font-medium border-2 transition-all capitalize",
                      newSocialPlatform === p 
                        ? "border-primary bg-primary/5 text-primary" 
                        : "border-transparent bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                    )}
                  >
                    {p}
                  </button>
                ) )}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">URL</label>
              <input 
                type="url"
                placeholder="https://..."
                value={newSocialUrl}
                onChange={(e) => setNewSocialUrl(e.target.value)}
                className="w-full bg-secondary/50 rounded-2xl p-4 outline-none border-2 border-transparent focus:border-primary transition-all"
              />
            </div>
          </div>

          <button 
            disabled={isSaving || !newSocialUrl}
            onClick={handleAddSocialLink}
            className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Add Link'}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};
