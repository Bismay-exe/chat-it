import React, { useState, useCallback, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router';
import { useForm as useRHForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import bg from '/backgrounds/002.jpg';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';
import { Capacitor } from '@capacitor/core';
import { useAuthStore } from '@/stores/authStore';

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
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // For browser OAuth: sessionStorage flag survives the full page reload.
  // Initialize googleSuccess to true if we're returning from a Google OAuth redirect.
  const [googleSuccess, setGoogleSuccess] = useState(() => {
    const pending = sessionStorage.getItem('google_auth_pending');
    if (pending) {
      sessionStorage.removeItem('google_auth_pending');
      return true;
    }
    return false;
  });

  // Ref to block redirect while an auth call is in-flight (for native/email flows)
  const authInProgress = useRef(false);

  const handleDone = useCallback(() => {
    navigate('/chats');
  }, [navigate]);

  // RENDER-TIME redirect: if user is signed in but we're not showing
  // a success screen and no auth call is in-flight, redirect to /chats.
  if (user && !googleSuccess && !emailSuccess && !authInProgress.current) {
    return <Navigate to="/chats" replace />;
  }


  const loginForm = useRHForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const signupForm = useRHForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
  });

  const onLogin = async (data: z.infer<typeof loginSchema>) => {
    try {
      authInProgress.current = true;
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) {
        authInProgress.current = false;
        if (error.message.includes('Email not confirmed')) {
          setOtpEmail(data.email);
          setStep('otp');
          toast.info('Please verify your email code.');
          return;
        }
        throw error;
      }
      setEmailSuccess(true);
    } catch (error: any) {
      authInProgress.current = false;
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

      setOtpEmail(data.email);
      setStep('otp');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpToken.length !== 6) return;
    setOtpLoading(true);
    try {
      authInProgress.current = true;
      const { error } = await supabase.auth.verifyOtp({
        email: otpEmail,
        token: otpToken,
        type: 'signup'
      });
      if (error) throw error;
      setEmailSuccess(true);
    } catch (error: any) {
      authInProgress.current = false;
      toast.error(error.message);
    } finally {
      setOtpLoading(false);
    }
  };


  const handleGoogleLogin = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await GoogleSignIn.signIn();
        const idToken = result.idToken;

        if (!idToken) throw new Error("No ID Token found");

        // Set ref BEFORE signInWithIdToken — ref is synchronous,
        // so the useEffect redirect check sees it immediately
        authInProgress.current = true;

        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });

        if (error) {
          authInProgress.current = false;
          throw error;
        }

        // NOW show the visible success overlay
        setGoogleSuccess(true);
      } else {
        // Browser OAuth: page will fully reload after Google auth.
        // Save flag to sessionStorage so we can show success screen on return.
        sessionStorage.setItem('google_auth_pending', '1');
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + '/auth'
          }
        });

        if (error) {
          sessionStorage.removeItem('google_auth_pending');
          throw error;
        }
      }
    } catch (error: any) {
      authInProgress.current = false;
      console.error(error);
      toast.error(error.message || "Failed to sign in with Google");
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-between bg-cover bg-center bg-no-repeat py-12 px-6 text-[#1b1b1b] relative min-h-svh overflow-x-hidden pt-safe"
      style={{
        backgroundImage: `url(${bg})`,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }}
    >
      {/* ── Google Login Full-Screen Success Overlay ── */}
      {googleSuccess && (
        <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-cover bg-no-repeat bg-center animate-in fade-in duration-500" style={{
          backgroundImage: `url(${bg})`
        }}>
          {/* Animated checkmark */}
          <div className="relative mb-18">
            <div className="relative mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 24 24" fill="#000000" stroke="#000000" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-badge-icon lucide-badge"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" /></svg>
              <div className='absolute inset-0 h-full w-full flex items-center justify-center'>
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-check-icon lucide-check"><path d="M20 6 9 17l-5-5" /></svg>
              </div>
            </div>
            {/* Decorative particles */}
            <div className="absolute -top-3 -right-3 w-4 h-2 -rotate-75 bg-[#686BBD]" />
            <div className="absolute bottom-2 left-2 w-2 h-4 rotate-45 bg-[#BF90A8]" />
            <div className="absolute top-0 -left-6 w-4 h-2.5 rotate-45 bg-[#FCCCFB]" />
            <div className="absolute bottom-0 right-2 w-2 h-4 -rotate-45 bg-[#627B99]" />
          </div>
          <h1 className="text-[4rem] font-thunder font-extrabold leading-none md:leading-normal text-primary mb-2 animate-in slide-in-from-bottom-4 duration-500">You're In!</h1>
          <p className="text-primary/60 font-bricolage-semi-condensed font-bold text-2xl text-center px-8 mb-8 animate-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '0.15s' }}>Signed in with Google successfully.</p>
          <button
            onClick={handleDone}
            className="absolute md:static bottom-8 left-6 right-6 h-14 md:w-100  rounded-4xl bg-primary text-primary-foreground text-lg font-bold shadow-xl hover:shadow-[0_12px_40px_rgba(76,175,80,0.5)] transition-all active:scale-95 hover:scale-[1.02] animate-in slide-in-from-bottom-6 duration-700"
            style={{ animationDelay: '0.3s' }}
          >
            Start Chatting
          </button>
        </div>
      )}
      {/* Chat Bubbles Section */}
      <section className="scale-90 w-full max-w-sm relative h-75.5 mt-18 shrink-0">
        {/* Chat Card 1: Daniel */}
        <div className="absolute top-0 left-[5%] right-[10%] bg-[#ffe8e2] text-[#1D1137] rounded-3xl p-2 flex items-center gap-4 -rotate-2 z-30 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3),0_8px_10px_-6px_rgba(0,0,0,0.2)]">
          <div className="w-18 h-18 rounded-2xl overflow-hidden bg-[#F2B5B0] shrink-0">
            <img alt="Daniel Garcia" className="w-full h-full object-cover mix-blend-multiply" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWjYhzVDE4fkGh6648Gwswj86H6MQcq9p7BlhZdJcXSXDdW4OHTwQyWAD8rYgTK-yZxIsCkhfCjya8hYZ1csttATb4T59MCCEnnSFfQ2ew_uotW4Kenq8r6_TOeGPuiwf_g-el4ZCQ1gSFgpD5uclbHl7p6djS-lFsc5IYSftnsoQed_gPeyibvb_D3jURgwunwhj5uZEyqL4cVyNBIQDS8YHVSej9tjkTvEUqy7CoaR-hUSZHdzjLnLDUepP93XgUhK4vd2nkE-uT" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[1.1rem] leading-tight mb-0.5">Daniel Garcia</h3>
            <p className="text-[1.05rem]">Hi, guys!</p>
          </div>
          <div className="text-gray-400 self-end mb-1">
            <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
        </div>
        {/* Heart Reaction for Daniel/Lana */}
        <div className="absolute top-17.5 right-[15%] bg-[#FF8A8A] text-primary rounded-full px-3 py-1 flex items-center gap-1 z-30 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.2),0_2px_4px_-1px_rgba(0,0,0,0.1)]">
          <span className="text-lg">❤️</span>
          <span className="font-semibold text-sm">3</span>
        </div>
        {/* Chat Card 2: Lana */}
        <div className="absolute top-22.5 left-[-2%] right-[2%] bg-[#fff3c3] text-[#1D1137] rounded-3xl p-2 flex items-center justify-between gap-4 rotate-5 z-20 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3),0_8px_10px_-6px_rgba(0,0,0,0.2)]">
          <div className="flex items-end gap-2 pl-2">
            <div className="text-gray-400 mb-1">
              <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div className="text-right">
              <h3 className="font-bold text-[1.1rem] leading-tight mb-0.5">Lana Rodkevych</h3>
              <p className="text-[1.05rem]">I working on my garden</p>
            </div>
          </div>
          <div className="w-18 h-18 rounded-2xl overflow-hidden bg-[#E2E0D8] shrink-0">
            <img alt="Lana Rodkevych" className="w-full h-full object-cover mix-blend-multiply" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAThaHdUjOflmsXiyzLZ4pV4RYPaUAwDrDG3nKIh8Ti1MOC7X2BjN24_IT2Ova-knxtxagb-9wGZ2x0M242dhynPEYt86iu-Zs0HuuZdAgEHaTSYv9x60UZF6PAzkelfjjJIYRJhOKoQkrjvg36i7hVDb4FWjR42PFVOUi1CRjFhpMzcTu5h6zAcxQ3MzlYjcPiUescG-PiF1ObQ1p72p4ILz5G55v9fwwz8UeIkVAFxasgT3_E5HosOWyGtt-LwlLB0vcyzXuwAfmo" />
          </div>
        </div>
        {/* Chat Card 3: Eric */}
        <div className="absolute top-47.5 left-[12%] right-[8%] bg-[#e2deff] border border-[#c9c2ff]/50 text-[#1D1137] rounded-3xl p-2 flex items-center gap-4 -rotate-1 z-10 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3),0_8px_10px_-6px_rgba(0,0,0,0.2)]">
          <div className="w-18 h-18 rounded-2xl overflow-hidden bg-[#B5B0EB] shrink-0">
            <img alt="Eric Solomon" className="w-full h-full object-cover mix-blend-multiply" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8w04QV_Fka9ebwWcLjytndiPGKvubGYgx96KP0_IFus-OXivSgZmpBroDBzbOdfgdorOZw4NRuTBHe1jkmt-1FyGMe2n33ZQao0_V_DuDZB6GALlDTb6yMARhiy5ZWnDz7R_ACl1pB_MI8sk21wcvCdgPw6Zg8iZlMpw0YusuI-vDqxhtM2oo4SrPrFWJzlI4N0ChtEIdotnwJBB9WsaqQE8x45QKdhiHPDYMMme167f3lqyHpfEvXqZ8VIjwVDy6MHSOrOGrvOph" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[1.1rem] leading-tight mb-0.5">Eric Solomon</h3>
            <p className="text-[1.05rem]">What's up?</p>
          </div>
          <div className="text-gray-400 self-end mb-1">
            <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
        </div>
        {/* Clap Reaction for Eric */}
        <div className="absolute top-67.5 right-[18%] bg-[#A8A4DF] text-primary rounded-full px-3 py-1 flex items-center gap-1 z-30 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.2),0_2px_4px_-1px_rgba(0,0,0,0.1)]">
          <span className="text-lg">👏</span>
          <span className="font-semibold text-sm">1</span>
        </div>
      </section>

      {/* Hero Content & Login */}
      <main className="w-full max-w-sm text-center flex flex-col items-center z-10 shrink-0 mb-8 mt-auto">
        <div className="mb-10">
          <h1 className="text-5xl font-extrabold tracking-tight leading-[1.1] mb-4">
            Stop waiting.<br />Chat It
          </h1>
          <p className="text-[#3b3b3b] text-[1.1rem] leading-relaxed px-4">
            Simple, fast, and built for real moments.
          </p>
        </div>

        {/* Login Buttons */}
        <div className="flex justify-center gap-4 w-full">
          {/* GitHub */}
          <button
            aria-label="Login with GitHub"
            className="w-16 h-16 bg-[#181717] rounded-2xl flex items-center justify-center transition-transform active:scale-95 hover:bg-[#2b2b2b] shadow-[0_4px_14px_0_rgba(0,0,0,0.4)]"
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <mask id="github-mask">
                  {/* Hide the circle */}
                  <circle cx="12" cy="12" r="10" fill="white" />
                </mask>
              </defs>

              {/* White base */}
              <rect width="100%" height="100%" fill="white" mask="url(#github-mask)" />

              {/* Original GitHub logo (same as bg → invisible except cutout) */}
              <path
                fill="#181717"
                d="M12 .5C5.73.5.5 5.73.5 12c0 4.87 3.16 9 7.55 10.46.55.1.75-.24.75-.53
      0-.26-.01-1.13-.02-2.05-3.07.67-3.72-1.48-3.72-1.48-.5-1.27-1.23-1.61-1.23-1.61
      -1-.69.08-.68.08-.68 1.1.08 1.68 1.14 1.68 1.14
      .98 1.67 2.56 1.19 3.18.91.1-.71.38-1.19.7-1.46
      -2.45-.28-5.02-1.23-5.02-5.47
      0-1.21.43-2.2 1.14-2.98-.11-.28-.5-1.4.11-2.92
      0 0 .93-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0
      c2.12-1.44 3.05-1.14 3.05-1.14.61 1.52.22 2.64.11 2.92
      .71.78 1.14 1.77 1.14 2.98
      0 4.25-2.58 5.19-5.04 5.46
      .39.34.73 1 .73 2.02
      0 1.46-.01 2.63-.01 2.99
      0 .29.2.64.76.53C20.34 21 23.5 16.87 23.5 12
      23.5 5.73 18.27.5 12 .5z"
              />
            </svg>
          </button>
          {/* Google */}
          <button onClick={handleGoogleLogin} aria-label="Login with Google" className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center transition-transform active:scale-95 hover:bg-gray-50 shadow-[0_4px_14px_0_rgba(255,255,255,0.15)]">
            <svg height="28" viewBox="0 0 48 48" width="28" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" fill="#EA4335"></path>
              <path d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" fill="#4285F4"></path>
              <path d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" fill="#FBBC05"></path>
              <path d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" fill="#34A853"></path>
            </svg>
          </button>
          {/* Discord */}
          <button aria-label="Login with Discord" className="w-16 h-16 bg-[#5865F2] rounded-2xl flex items-center justify-center transition-transform active:scale-95 text-primary hover:bg-[#4752C4] shadow-[0_4px_14px_0_rgba(88,101,242,0.39)]">
            <svg fill="currentColor" height="32" viewBox="0 0 127.14 96.36" width="32" xmlns="http://www.w3.org/2000/svg">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.33,46,96.22,53,91.08,65.69,84.69,65.69Z"></path>
            </svg>
          </button>
          {/* Email */}
          <button onClick={() => setShowEmailForm(true)} aria-label="Login with Email" className="w-16 h-16 bg-white border border-white/20 rounded-2xl flex items-center justify-center transition-transform active:scale-95 text-[#1D1137] hover:bg-white/20 backdrop-blur-sm shadow-[0_4px_14px_0_rgba(0,0,0,0.1)]">
            <svg fill="none" height="28" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="28" xmlns="http://www.w3.org/2000/svg">
              <rect height="16" rx="2" width="20" x="2" y="4"></rect>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
            </svg>
          </button>
        </div>
      </main>

      {/* Email Bottom Sheet */}
      <BottomSheet
        isOpen={showEmailForm}
        onClose={() => setShowEmailForm(false)}
        title={isLogin ? 'Welcome Back' : 'Create Account'}
      >
        <div className="flex-1 flex flex-col pt-0">
          {/* <h1 className="text-[2.5rem] leading-[1.1] font-extrabold tracking-tight mb-3">
            {isLogin ? 'Welcome back.' : 'Create account.'}
          </h1> */}
          {/* <p className="text-[#A79BBD] text-[1.1rem] mb-10">
            {isLogin ? 'Sign in to access your chats.' : 'Join Chat-It and connect instantly.'}
          </p> */}

          {/* Premium Pill Tab Switcher */}
          <div className={`flex bg-primary/5 p-1.5 rounded-[1.25rem] mb-8 border border-black/5 relative
            ${step === 'otp' || emailSuccess ? 'hidden' : ''}
          `}>
            <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-background/50 border-border/50 border rounded-2xl shadow-sm transition-all duration-300 ease-out ${isLogin ? 'left-1.5' : 'left-[calc(50%)]'}`} />
            <button
              className={`flex-1 py-3 text-[0.95rem] font-semibold rounded-xl transition-all z-10 ${isLogin ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}
              onClick={() => setIsLogin(true)}
            >
              Log In
            </button>
            <button
              className={`flex-1 py-3 text-[0.95rem] font-semibold rounded-xl transition-all z-10 ${!isLogin ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </button>
          </div>

          {/* Forms Container */}
          <div className="relative w-full">
            {emailSuccess ? (
              /* ── Email Auth Success View (inside bottom sheet) ── */
              <div className="flex flex-col items-center justify-center py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="relative mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 24 24" fill="#000000" stroke="#000000" stroke-width="0.5" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-badge-icon lucide-badge"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" /></svg>
                  <div className='absolute inset-0 h-full w-full flex items-center justify-center'>
                    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-check-icon lucide-check"><path d="M20 6 9 17l-5-5" /></svg>
                  </div>

                  {/* Decorative particles */}
                  <div className="absolute -top-3 -right-3 w-4 h-2 -rotate-75 bg-[#686BBD]" />
                  <div className="absolute bottom-2 left-2 w-2 h-4 rotate-45 bg-[#BF90A8]" />
                  <div className="absolute top-0 -left-6 w-4 h-2.5 rotate-45 bg-[#FCCCFB]" />
                  <div className="absolute bottom-0 right-2 w-2 h-4 -rotate-45 bg-[#627B99]" />
                </div>
                <h2 className="text-[3rem] font-thunder font-extrabold text-primary mb-1 animate-in slide-in-from-bottom-4 duration-500">Successful</h2>
                <p className="text-primary/70 font-bricolage-semi-condensed text-xl text-center px-4 mb-8 animate-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '0.15s' }}>
                  {isLogin ? 'Welcome back — pick up where you left off.' : 'Your account is ready. Start chatting.'}
                </p>
                <button
                  onClick={handleDone}
                  className="w-full h-14 rounded-2xl text-[1.05rem] font-semibold bg-primary text-primary-foreground shadow-xl"
                  style={{ animationDelay: '0.3s' }}
                >
                  Start Chatting
                </button>
              </div>
            ) : step === 'otp' ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground italic">Check your inbox for a 6-digit code</p>
                  <p className="text-xs font-bold text-primary">{otpEmail}</p>
                </div>

                <div className="flex justify-center">
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpToken}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setOtpToken(val);
                    }}
                    placeholder="000000"
                    className="w-64 text-center text-3xl font-black tracking-[0.5em] h-20 bg-primary/5 border-black/5 rounded-3xl"
                    autoFocus
                  />
                </div>

                <Button
                  onClick={handleVerifyOtp}
                  disabled={otpToken.length !== 6 || otpLoading}
                  isLoading={otpLoading}
                  className="w-full h-14 rounded-2xl text-[1.05rem] font-semibold bg-primary text-primary-foreground shadow-xl"
                >
                  Verify & Join
                </Button>

                <button
                  onClick={() => setStep('form')}
                  className="w-full text-xs font-bold text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors"
                >
                  Wait, I made a mistake
                </button>
              </div>
            ) : isLogin ? (
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4 animate-in fade-in zoom-in-[0.98] duration-300">
                <div className="space-y-1.5">
                  <Input
                    type="email"
                    placeholder="Email Address"
                    className="h-14 bg-primary/5 border-black/5 text-primary placeholder:text-gray-500 rounded-2xl px-5 text-base focus-visible:ring-1 focus-visible:ring-black/10 focus-visible:border-black/10 transition-all shadow-sm"
                    {...loginForm.register('email')}
                  />
                  {loginForm.formState.errors.email && <p className="text-xs text-red-400 px-2">{loginForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Input
                    type="password"
                    placeholder="Password"
                    className="h-14 bg-primary/5 border-black/5 text-primary placeholder:text-gray-500 rounded-2xl px-5 text-base focus-visible:ring-1 focus-visible:ring-black/10 focus-visible:border-black/10 transition-all shadow-sm"
                    {...loginForm.register('password')}
                  />
                  {loginForm.formState.errors.password && <p className="text-xs text-red-400 px-2">{loginForm.formState.errors.password.message}</p>}
                </div>

                <div className="pt-6">
                  <Button
                    type="submit"
                    className="w-full h-14 rounded-2xl text-[1.05rem] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl transition-all hover:scale-[1.01] active:scale-[0.98]"
                    isLoading={loginForm.formState.isSubmitting}
                  >
                    Continue
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4 animate-in fade-in zoom-in-[0.98] duration-300">
                <div className="space-y-1.5">
                  <Input
                    type="text"
                    placeholder="Full Name"
                    className="h-14 bg-primary/5 border-black/5 text-primary placeholder:text-gray-500 rounded-2xl px-5 text-base focus-visible:ring-1 focus-visible:ring-black/10 focus-visible:border-black/10 transition-all shadow-sm"
                    {...signupForm.register('fullName')}
                  />
                  {signupForm.formState.errors.fullName && <p className="text-xs text-red-400 px-2">{signupForm.formState.errors.fullName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Input
                    type="text"
                    placeholder="Username"
                    className="h-14 bg-primary/5 border-black/5 text-primary placeholder:text-gray-500 rounded-2xl px-5 text-base focus-visible:ring-1 focus-visible:ring-black/10 focus-visible:border-black/10 transition-all shadow-sm"
                    {...signupForm.register('username')}
                  />
                  {signupForm.formState.errors.username && <p className="text-xs text-red-400 px-2">{signupForm.formState.errors.username.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Input
                    type="email"
                    placeholder="Email Address"
                    className="h-14 bg-primary/5 border-black/5 text-primary placeholder:text-gray-500 rounded-2xl px-5 text-base focus-visible:ring-1 focus-visible:ring-black/10 focus-visible:border-black/10 transition-all shadow-sm"
                    {...signupForm.register('email')}
                  />
                  {signupForm.formState.errors.email && <p className="text-xs text-red-400 px-2">{signupForm.formState.errors.email.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Input
                    type="password"
                    placeholder="Password (Min 8 characters)"
                    className="h-14 bg-primary/5 border-black/5 text-primary placeholder:text-gray-500 rounded-2xl px-5 text-base focus-visible:ring-1 focus-visible:ring-black/10 focus-visible:border-black/10 transition-all shadow-sm"
                    {...signupForm.register('password')}
                  />
                  {signupForm.formState.errors.password && <p className="text-xs text-red-400 px-2">{signupForm.formState.errors.password.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Input
                    type="password"
                    placeholder="Confirm Password"
                    className="h-14 bg-primary/5 border-black/5 text-primary placeholder:text-gray-500 rounded-2xl px-5 text-base focus-visible:ring-1 focus-visible:ring-black/10 focus-visible:border-black/10 transition-all shadow-sm"
                    {...signupForm.register('confirmPassword')}
                  />
                  {signupForm.formState.errors.confirmPassword && <p className="text-xs text-red-400 px-2">{signupForm.formState.errors.confirmPassword.message}</p>}
                </div>

                <div className="pt-6">
                  <Button
                    type="submit"
                    className="w-full h-14 rounded-2xl text-[1.05rem] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl transition-all hover:scale-[1.01] active:scale-[0.98]"
                    isLoading={signupForm.formState.isSubmitting}
                  >
                    Create Account
                  </Button>
                </div>
              </form>
            )}
          </div>

        </div>
      </BottomSheet>
    </div>
  );
};
