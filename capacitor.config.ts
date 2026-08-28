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
    // Edge-to-edge: the WebView draws under the status bar (see
    // MainActivity.java's setDecorFitsSystemWindows for the part of this that
    // actually matters on Android 15+, where this plugin config alone is a
    // no-op). Style DARK = light icons, for the app's dark background.
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
    },
  },
};

export default config;
