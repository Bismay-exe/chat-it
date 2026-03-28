import { useNavigate } from 'react-router';
import { ArrowLeft, Users, UserPlus } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';

export const AddContactPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-background absolute inset-0 z-50">
      <TopBar 
        leftElement={
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
        }
        title={<span className="font-semibold text-lg">New Chat</span>}
      />
      
      <div className="p-2 mt-2">
        <button 
          onClick={() => navigate('/groups/new')}
          className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/40 premium-transition text-left group"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground premium-transition">
            <Users className="w-6 h-6" />
          </div>
          <span className="font-medium text-[15px]">New Group</span>
        </button>

        <button 
          onClick={() => navigate('/search')}
          className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/40 premium-transition text-left group"
        >
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-foreground premium-transition">
            <UserPlus className="w-6 h-6" />
          </div>
          <span className="font-medium text-[15px]">Find Contacts</span>
        </button>
      </div>

      <div className="px-5 py-3 mt-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Contacts on Chat-It</h3>
        <p className="text-sm text-muted-foreground">Contacts linked to your profile will appear here.</p>
      </div>
    </div>
  );
};
