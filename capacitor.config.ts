import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.abolfazldigital.focussanctum',
  appName: 'FocusSanctum',
  webDir: 'dist',
  assets: {
    icon: {
      android: {
        foreground: 'assets/icon.png', 
        background: 'assets/icon-background.png',
        fallback: 'assets/icon.png',
    },
    splash: {
      android: 'assets/splash.png', // (Optional) Add a splash screen image
    },
  },
};

export default config;
