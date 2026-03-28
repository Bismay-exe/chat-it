import { Fragment } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, HelpCircle, BookOpen, MessageCircleQuestion, Scale } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';

export const HelpPage = () => {
  const navigate = useNavigate();

  const helpItems = [
    { icon: BookOpen, label: 'Help Center', desc: 'Find answers and learn how to use Chat-It' },
    { icon: MessageCircleQuestion, label: 'Contact Support', desc: 'Reach out for help with your account' },
    { icon: Scale, label: 'Privacy & Terms', desc: 'Review our legal policies and guidelines' },
  ];

  return (
    <div className="flex flex-col h-full bg-secondary/10 absolute inset-0 z-50">
      <TopBar 
        leftElement={
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full premium-transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-lg">Help</span>
          </div>
        }
      />
      
      <div className="max-w-xl w-full mx-auto p-4 space-y-4">
        <div className="bg-background rounded-3xl shadow-sm border border-border overflow-hidden">
          {helpItems.map((item, idx) => (
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
              {idx < helpItems.length - 1 && <div className="h-px bg-border ml-14" />}
            </Fragment>
          ))}
        </div>

        <div className="text-center pt-10">
          <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-2" />
          <p className="text-xs text-muted-foreground font-medium">Chat-It v1.0.0</p>
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mt-1">Made with premium standards</p>
        </div>
      </div>
    </div>
  );
};
