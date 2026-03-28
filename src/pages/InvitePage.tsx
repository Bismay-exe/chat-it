import { useNavigate } from 'react-router';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { toast } from 'sonner';

export const InvitePage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-secondary/10 absolute inset-0 z-50">
      <TopBar 
        leftElement={
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-lg">Invite a friend</span>
          </div>
        }
      />
      
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
          <UserPlus className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-medium mb-2 text-foreground">Invite friends to Chat-It</h2>
        <p className="text-sm max-w-sm mb-8">
          Share a link to invite your friends to chat with you on Chat-It, making it easier to stay in touch.
        </p>
        <button 
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'Join me on Chat-It!',
                text: 'Hey! Chat with me on Chat-It, a premium messaging app.',
                url: window.location.origin
              }).catch(() => {});
            } else {
              navigator.clipboard.writeText(window.location.origin);
              toast.success('Link copied to clipboard!');
            }
          }}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium shadow-md shadow-primary/20 hover:shadow-lg premium-transition active:scale-95"
        >
          Share Link
        </button>
      </div>
    </div>
  );
};
