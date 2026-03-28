import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm as useRHForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { MessageSquareText } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  fullName: z.string().min(2),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const loginForm = useRHForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const signupForm = useRHForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
  });

  const onLogin = async (data: z.infer<typeof loginSchema>) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) throw error;
      toast.success('Welcome back!');
      navigate('/chats');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const onSignup = async (data: z.infer<typeof signupSchema>) => {
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            full_name: data.fullName,
          }
        }
      });
      if (error) throw error;
      toast.success('Account created! Please check your email.');
      if(!supabase.auth.getSession()) {
        setIsLogin(true);
      } else {
        navigate('/chats');
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-svh bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[100px]" />
      
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 md:p-8 shadow-xl shadow-black/5 z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
            <MessageSquareText className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-muted-foreground text-sm mt-1 text-center">
            {isLogin ? 'Enter your details to sign in.' : 'Join Chat-It and connect with friends.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-secondary p-1 rounded-lg mb-6">
          <button 
            className={`flex-1 py-1.5 text-sm font-medium rounded-md premium-transition ${isLogin ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button 
            className={`flex-1 py-1.5 text-sm font-medium rounded-md premium-transition ${!isLogin ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        {/* Forms */}
        {isLogin ? (
          <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
            <div>
              <Input type="email" placeholder="Email Address" {...loginForm.register('email')} />
              {loginForm.formState.errors.email && <p className="text-xs text-destructive mt-1">{loginForm.formState.errors.email.message}</p>}
            </div>
            <div>
              <Input type="password" placeholder="Password" {...loginForm.register('password')} />
              {loginForm.formState.errors.password && <p className="text-xs text-destructive mt-1">{loginForm.formState.errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full mt-6!" isLoading={loginForm.formState.isSubmitting}>
              Log In
            </Button>
          </form>
        ) : (
          <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
            <div>
              <Input type="text" placeholder="Full Name" {...signupForm.register('fullName')} />
              {signupForm.formState.errors.fullName && <p className="text-xs text-destructive mt-1">{signupForm.formState.errors.fullName.message}</p>}
            </div>
            <div>
              <Input type="text" placeholder="Username" {...signupForm.register('username')} />
              {signupForm.formState.errors.username && <p className="text-xs text-destructive mt-1">{signupForm.formState.errors.username.message}</p>}
            </div>
            <div>
              <Input type="email" placeholder="Email Address" {...signupForm.register('email')} />
              {signupForm.formState.errors.email && <p className="text-xs text-destructive mt-1">{signupForm.formState.errors.email.message}</p>}
            </div>
            <div>
              <Input type="password" placeholder="Password (Min 8 characters)" {...signupForm.register('password')} />
              {signupForm.formState.errors.password && <p className="text-xs text-destructive mt-1">{signupForm.formState.errors.password.message}</p>}
            </div>
            <div>
              <Input type="password" placeholder="Confirm Password" {...signupForm.register('confirmPassword')} />
              {signupForm.formState.errors.confirmPassword && <p className="text-xs text-destructive mt-1">{signupForm.formState.errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" className="w-full mt-6!" isLoading={signupForm.formState.isSubmitting}>
              Create Account
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
