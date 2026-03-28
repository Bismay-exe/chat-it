import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { MessageSquareText } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-svh bg-background px-4">
      <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-primary/5">
        <MessageSquareText className="w-12 h-12 text-primary" />
      </div>
      
      <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight bg-linear-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
        Welcome to Chat-It
      </h1>
      
      <p className="text-lg text-muted-foreground max-w-md text-center mb-10 leading-relaxed">
        Simple, real-time, organised chat. Connect with friends or manage group discussions seamlessly.
      </p>

      <Button 
        size="lg" 
        className="w-full max-w-sm rounded-full text-base font-semibold shadow-lg shadow-primary/25 hover:-translate-y-1 premium-transition"
        onClick={() => navigate('/auth')}
      >
        Get Started
      </Button>
    </div>
  );
};
