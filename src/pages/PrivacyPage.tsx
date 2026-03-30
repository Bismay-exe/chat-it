import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Ban, Clock, ShieldCheck, EyeOff } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { useUserActions } from '@/hooks/useUserActions';
import { supabase } from '@/lib/supabase';
import { Avatar } from '@/components/ui/Avatar';

export const PrivacyPage = () => {
  const navigate = useNavigate();
  const [showBlocked, setShowBlocked] = useState(false);
  const { blockedUsers, unblockUser, isLoading } = useUserActions();
  const [blockedProfiles, setBlockedProfiles] = useState<any[]>([]);

  useEffect(() => {
    if (showBlocked && blockedUsers.length > 0) {
      const fetchProfiles = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .in('id', blockedUsers);
        if (data) setBlockedProfiles(data);
      };
      fetchProfiles();
    } else if (blockedUsers.length === 0) {
      setBlockedProfiles([]);
    }
  }, [showBlocked, blockedUsers]);

  const privacyItems = [
    { icon: Ban, label: 'Blocked contacts', desc: `${blockedUsers.length} contacts`, onClick: () => setShowBlocked(true) },
    { icon: Clock, label: 'Disappearing messages', desc: 'Set a timer for messages in new chats' },
    { icon: ShieldCheck, label: 'Last seen & online', desc: 'Who can see my last seen' },
    { icon: EyeOff, label: 'Read receipts', desc: 'If turned off, you won\'t send or receive read receipts' },
  ];

  if (showBlocked) {
    return (
      <div className="flex flex-col h-full bg-secondary/10 absolute inset-0 z-50 overflow-y-auto">
        <TopBar 
          leftElement={
            <div className="flex items-center gap-4">
              <button onClick={() => setShowBlocked(false)} className="p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="font-semibold text-lg">Blocked contacts</span>
            </div>
          }
        />
        <div className="max-w-xl w-full mx-auto p-4 space-y-2">
          {blockedProfiles.length === 0 ? (
            <div className="bg-background rounded-3xl p-12 text-center border border-border">
              <Ban className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">No blocked contacts yet</p>
            </div>
          ) : (
            <div className="bg-background rounded-3xl shadow-sm border border-border overflow-hidden">
              {blockedProfiles.map((p, idx) => (
                <Fragment key={p.id}>
                  <div className="w-full p-4 flex items-center gap-4 group">
                    <Avatar src={p.avatar_url} fallback={p.full_name || 'U'} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-medium truncate">{p.full_name}</div>
                      <div className="text-[12px] text-muted-foreground truncate">@{p.username}</div>
                    </div>
                    <button 
                      disabled={isLoading}
                      onClick={() => unblockUser(p.id)}
                      className="px-4 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-full hover:bg-primary hover:text-white transition-all disabled:opacity-50"
                    >
                      Unblock
                    </button>
                  </div>
                  {idx < blockedProfiles.length - 1 && <div className="h-px bg-border ml-14" />}
                </Fragment>
              ))}
            </div>
          )}
          <p className="text-[11px] text-muted-foreground px-4 py-2">
            Blocked contacts will no longer be able to call you or send you messages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-secondary/10 absolute inset-0 z-50 overflow-y-auto">
      <TopBar 
        leftElement={
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-lg">Privacy</span>
          </div>
        }
      />
      
      <div className="max-w-xl w-full mx-auto p-4 space-y-4">
        <div className="bg-background rounded-3xl shadow-sm border border-border overflow-hidden">
          {privacyItems.map((item, idx) => (
            <Fragment key={item.label}>
              <button 
                onClick={item.onClick}
                className="w-full p-4 flex items-center gap-4 hover:bg-secondary/50 premium-transition text-left group"
              >
                <div className="p-2 bg-secondary rounded-full text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary premium-transition">
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-[15px] font-medium">{item.label}</div>
                  <div className="text-[12px] text-muted-foreground">{item.desc}</div>
                </div>
              </button>
              {idx < privacyItems.length - 1 && <div className="h-px bg-border ml-14" />}
            </Fragment>
          ))}
        </div>

        <div className="bg-background rounded-3xl p-4 shadow-sm border border-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Privacy settings apply to your personal chats. Groups always have read receipts enabled by default.
          </p>
        </div>
      </div>
    </div>
  );
};
