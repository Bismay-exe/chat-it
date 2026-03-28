import { useNavigate } from 'react-router';
import { ArrowLeft, Menu, Plus } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';

export const ListsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-secondary/10 absolute inset-0 z-50">
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
          <button className="p-2 hover:bg-secondary rounded-full premium-transition">
            <Plus className="w-5 h-5" />
          </button>
        }
      />
      
      <div className="p-4 border-b border-border bg-background">
        <h3 className="font-medium mb-1">Organize your chats</h3>
        <p className="text-sm text-muted-foreground">
          Create custom lists to organize your conversations and easily filter them in the main view.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-background mt-4 border-y border-border">
          <div className="w-full p-4 flex items-center justify-between group cursor-move">
            <span className="text-[16px] font-medium">All</span>
            <Menu className="w-5 h-5 text-muted-foreground opacity-30" />
          </div>
          <div className="w-full h-px bg-border ml-4" />
          <div className="w-full p-4 flex items-center justify-between group cursor-move">
            <span className="text-[16px] font-medium">Unread</span>
            <Menu className="w-5 h-5 text-muted-foreground opacity-30" />
          </div>
          <div className="w-full h-px bg-border ml-4" />
          <div className="w-full p-4 flex items-center justify-between group cursor-move">
            <span className="text-[16px] font-medium">Favorites</span>
            <Menu className="w-5 h-5 text-muted-foreground opacity-30" />
          </div>
        </div>
      </div>
    </div>
  );
};
