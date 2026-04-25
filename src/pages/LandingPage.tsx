import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-svh p-4 relative overflow-hidden pt-safe">
      <div className="w-24 h-24 mb-8 bg-primary rounded-3xl flex items-center justify-center shadow-xl shadow-primary/20">
        <img src="/logo/chat-it-logo.svg" alt="Chat-It" className="h-7 w-auto dark:invert" />
      </div>
      
      <h1 className="text-[3rem] md:text-[4rem] font-thunder font-extrabold mb-4 bg-linear-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
        Welcome to Chat-It
      </h1>
      
      <p className="text-[1.2rem] font-bricolage-semi-condensed text-primary/70 max-w-sm text-center px-4 mb-10 leading-relaxed">
        {/* Simple, real-time, organised chat. Connect with friends or manage group discussions seamlessly. */}
        Fast chats, Zero noise, Pure vibes. <br/> Connect with friends or manage group discussions seamlessly. <br/> Whatever's on your mind - just chat it.
      </p>

      <Button 
        size="lg" 
        className="absolute md:static bottom-[calc(16px+env(safe-area-inset-bottom))] h-14 left-4 right-4 max-w-sm rounded-full text-base font-semibold shadow-lg shadow-primary/25 active:scale-95 hover:-translate-y-1 premium-transition"
        onClick={() => navigate('/auth')}
      >
        Get Started
      </Button>
    </div>
  );
};
