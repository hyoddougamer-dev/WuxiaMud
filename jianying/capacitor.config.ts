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
      // The app calls SplashScreen.hide() as soon as the first frame is on
      // screen, so in practice the splash goes away well before this deadline.
      //
      // But autoHide stays TRUE as a native safety net. It was false in the
      // first build, with no hide() call anywhere in the code — so the splash
      // sat on top of the webview forever and the game rendered, invisibly,
      // underneath it. A pure black screen with no way to tell why. With
      // autoHide on, even a total JavaScript failure still reveals the webview
      // and whatever error it is showing.
      launchAutoHide: true,
      launchShowDuration: 3000,
      backgroundColor: '#0d0d0d',
      showSpinner: false,
    },
  },
}

export default config
