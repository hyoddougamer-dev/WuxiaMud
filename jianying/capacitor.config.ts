import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.hyoddou.jianying',
  appName: 'Jianying',
  webDir: 'dist',
  android: {
    // The game draws its own dark ground; a white webview flash between the
    // splash screen and the first rendered frame is very visible on OLED.
    backgroundColor: '#0d0d0d',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0d0d0d',
      showSpinner: false,
    },
  },
}

export default config
