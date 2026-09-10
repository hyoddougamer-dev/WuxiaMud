import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.hyoddou.ninefold',
  appName: 'Ninefold',
  webDir: 'dist',
  android: {
    backgroundColor: '#070A12',
  },
  server: {
    androidScheme: 'https',
  },
}

export default config
