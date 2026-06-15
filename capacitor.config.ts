import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.notfit.app",
  appName: "NoteFit",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0A0A0B",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
  },
  android: {
    buildOptions: {
      releaseType: "APK",
    },
  },
};

export default config;
