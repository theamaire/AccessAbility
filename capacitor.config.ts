import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.accessability.app",
  appName: "AccessAbility",
  webDir: "public",
  server: {
    url: "https://capstone-map-fajovs-projects.vercel.app",
    cleartext: true,
  },
  plugins: {
     SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidScaleType: "CENTER_CROP",
      showSpinner: false
    }
  },
};

export default config;
