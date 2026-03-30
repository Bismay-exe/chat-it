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

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/chats'
      }
    });
    if (error) toast.error(error.message);
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

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-1 gap-3">
          <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </Button>
        </div>
      </div>
    </div>
  );
};
