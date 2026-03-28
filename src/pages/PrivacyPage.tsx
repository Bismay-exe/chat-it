import { Fragment } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Ban, Clock, ShieldCheck, EyeOff } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';

export const PrivacyPage = () => {
  const navigate = useNavigate();

  const privacyItems = [
    { icon: Ban, label: 'Blocked contacts', desc: 'Manage people you have blocked' },
    { icon: Clock, label: 'Disappearing messages', desc: 'Set a timer for messages in new chats' },
    { icon: ShieldCheck, label: 'Last seen & online', desc: 'Who can see my last seen' },
    { icon: EyeOff, label: 'Read receipts', desc: 'If turned off, you won\'t send or receive read receipts' },
  ];

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
              <button className="w-full p-4 flex items-center gap-4 hover:bg-secondary/50 premium-transition text-left group">
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
