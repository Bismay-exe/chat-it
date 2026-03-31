import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export const useCapacitor = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. Status Bar Setup
    const setupStatusBar = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#000000' });
      } catch (e) {
        console.warn('StatusBar not available', e);
      }
    };

    // 2. Back Button Handling
    const setupBackButton = () => {
      App.addListener('backButton', () => {
        if (location.pathname === '/chats' || location.pathname === '/' || location.pathname === '/auth') {
          // If we are at a root page, exit the app
          App.exitApp();
        } else {
          // Otherwise, navigate back in the app
          navigate(-1);
        }
      });
    };

    // 3. Hide Splash Screen when app is ready
    const hideSplashScreen = async () => {
      try {
        await SplashScreen.hide();
      } catch (e) {
        console.warn('SplashScreen not available', e);
      }
    };

    setupStatusBar();
    setupBackButton();
    hideSplashScreen();

    // Cleanup listeners
    return () => {
      App.removeAllListeners();
    };
  }, [navigate, location]);

  return null;
};
