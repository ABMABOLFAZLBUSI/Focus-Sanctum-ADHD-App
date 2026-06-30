import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.abolfazldigital.focussanctum',
  appName: 'FocusSanctum',
  webDir: 'dist',
  assets: {
    icon: {
      android: 'assets/icon.png',   // Path to your source image
    },
    splash: {
      android: 'assets/splash.png', // (Optional) Add a splash screen image
    },
  },
};

export default config;
