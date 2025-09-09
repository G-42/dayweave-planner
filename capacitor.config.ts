import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d455cf4bc7694fbea62f938d69576f20',
  appName: 'fulfill',
  webDir: 'dist',
  server: {
    url: 'https://d455cf4b-c769-4fbe-a62f-938d69576f20.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small"
    }
  }
};

export default config;