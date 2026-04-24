import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Send } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { SYSTEM_CHAT_ID, SYSTEM_USER_ID } from '@/lib/constants';


export const AdminAnnouncements: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setLoading(true);
    // Note: chat_id is intentionally left null to indicate a global announcement
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Default 7 days expiry

    const { error: annError } = await supabase.from('announcements').insert({
      title,
      body,
      created_by: profile?.id,
      expires_at: expiresAt.toISOString(),
    });

    // Also send as a chat message to the Official Channel
    const { error: msgError } = await supabase.from('messages').insert({
      chat_id: SYSTEM_CHAT_ID,
      sender_id: SYSTEM_USER_ID,
      content: `*${title}*\n\n${body}`,
      type: 'text'
    });

    if (annError || msgError) {

      toast.error('Failed to broadcast announcement');
    } else {
      toast.success('Global announcement sent successfully!');
      setTitle('');
      setBody('');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar 
        leftElement={
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin')} className="md:hidden p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-lg leading-tight">Global Announcements</span>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-card border border-border/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4">New Broadcast</h3>
            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., Scheduled Maintenance"
                  className="w-full bg-background border border-border/20 rounded-xl px-4 py-3 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea 
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Enter the announcement details..."
                  className="w-full bg-background border border-border/20 rounded-xl px-4 py-3 min-h-30 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <><Send className="w-5 h-5" /> Broadcast Now</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
