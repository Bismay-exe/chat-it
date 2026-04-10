import { CapacitorConfig } from '@capacitor/cli';
import { Style } from '@capacitor/status-bar';

const config: CapacitorConfig = {
  appId: 'com.chatit.app',
  appName: 'Chat-It',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 5000,
      launchAutoHide: false,
      launchFadeOutDuration: 300,
      backgroundColor: "#f5f5f5",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
    StatusBar: {
      overlaysWebView: true,
      style: Style.Light,
      backgroundColor: "#00000000",
    },
  },
  // server: {
  //   url: 'http://10.195.139.211:5173',
  //   cleartext: true
  // },
};

export default config;
