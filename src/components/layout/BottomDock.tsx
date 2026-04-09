import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { MessageCircle, Megaphone, Plus, MessageSquare, Users, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const BottomDock: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNewMenu, setShowNewMenu] = useState(false);

  const handleMenuClick = (action: () => void) => {
    setShowNewMenu(false);
    action();
  };

  return (
    <>
      {/* New Menu Sub-sheet / Popover */}
      {showNewMenu && (
        <>
          <div 
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 transition-opacity" 
            onClick={() => setShowNewMenu(false)} 
          />
          <div className="fixed bottom-20 left-4 right-4 bg-background border border-border shadow-2xl rounded-3xl p-2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => handleMenuClick(() => navigate('/add?type=chat'))}
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <MessageSquare className="w-5 h-5 fill-primary/20" />
                </div>
                <div>
                  <div className="font-semibold text-sm">New Chat</div>
                  <div className="text-xs text-muted-foreground">Send a message to a user or friend</div>
                </div>
              </button>
              
              <button 
                onClick={() => handleMenuClick(() => navigate('/add/new-group'))}
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Users className="w-5 h-5 fill-primary/20" />
                </div>
                <div>
                  <div className="font-semibold text-sm">New Group</div>
                  <div className="text-xs text-muted-foreground">Create a group with friends</div>
                </div>
              </button>
              
              <button 
                onClick={() => handleMenuClick(() => navigate('/invite'))}
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Share2 className="w-5 h-5 fill-primary/20" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Invite a Friend</div>
                  <div className="text-xs text-muted-foreground">Share your link to chat</div>
                </div>
              </button>
              
              <button 
                onClick={() => handleMenuClick(() => {
                  toast.info('Announcements coming soon');
                })}
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Megaphone className="w-5 h-5 fill-primary/20" />
                </div>
                <div>
                  <div className="font-semibold text-sm">New Announcement</div>
                  <div className="text-xs text-muted-foreground">Broadcast messages to users</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 flex items-center justify-around gap-10 z-50 px-10 pb-safe">
        <button
          onClick={() => navigate('/chats')}
          className={cn(
            'flex flex-col items-center justify-center h-full gap-1 premium-transition w-16 -z-20',
            location.pathname.startsWith('/chats') ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            showNewMenu && 'blur-sm pointer-events-none'
          )}
        >
          <div className="relative">
            <MessageCircle className={cn('w-6 h-6', location.pathname.startsWith('/chats') && 'fill-primary/20')} />
          </div>
          <span className="text-[10px] font-medium leading-none">Chats</span>
        </button>

        <button
          onClick={() => setShowNewMenu(!showNewMenu)}
          className={cn(
            "flex items-center justify-center gap-2 h-10 w-full rounded-full hover:scale-105 active:scale-95 premium-transition duration-300 shadow-lg",
            showNewMenu ? "bg-white text-black" : "bg-foreground text-background"
          )}
        >
          {showNewMenu ? (
            <span className="font-semibold text-sm">Cancel</span>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              <span className="font-semibold text-sm">New</span>
            </>
          )}
        </button>

        <button
          onClick={() => navigate('/announcements')}
          className={cn(
            'flex flex-col items-center justify-center h-full gap-1 premium-transition w-16',
            location.pathname.startsWith('/announcements') ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            showNewMenu && 'blur-sm pointer-events-none'
          )}
        >
          <div className="relative">
            <Megaphone className={cn('w-6 h-6', location.pathname.startsWith('/announcements') && 'fill-primary/20')} />
          </div>
          <span className="text-[10px] font-medium leading-none">News</span>
        </button>
      </div>
    </>
  );
};
