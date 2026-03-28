import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Edit3, ImagePlus, Check, X, Loader2 } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const OwnProfilePage = () => {
  const navigate = useNavigate();
  const { profile, setProfile, user } = useAuthStore();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [newName, setNewName] = useState(profile?.full_name || '');
  const [newAbout, setNewAbout] = useState(profile?.about || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

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
    </div>
  );
};
