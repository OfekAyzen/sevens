import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sevens.app',
  appName: 'Sevens',
  webDir: 'dist',
  android: {
    // Debug APKs are sideloaded by friends; allow the mixed-content-free default.
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 600,
      backgroundColor: '#0B0D12',
      showSpinner: false,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#7C5CFF',
    },
    // Android 15+ ignores backgroundColor and treats the status bar as
    // transparent regardless of this setting (see MainActivity.java) — style
    // is what actually matters now: light icons/text for our dark app.
    StatusBar: {
      style: 'DARK',
      overlaysWebView: true,
    },
  },
};

export default config;
