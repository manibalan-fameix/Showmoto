/**
 * Every user-facing string lives here so Tamil can be added later
 * (turn this into a per-locale map keyed by the same shape).
 */
export const copy = {
  brand: {
    name: "Fameix",
    tagline: "Your cars. Your brand. One link.",
  },
  marketing: {
    heading: "Sell used cars from one link",
    body: "Add a car in under two minutes. Share one link on Instagram and WhatsApp. Get test drive leads under your own name.",
    cta: "Dealer sign in",
  },
  tenant: {
    poweredBy: "Powered by",
    cars: (n: number) => (n === 1 ? "1 car available" : `${n} cars available`),
    noCars: "No cars listed right now. Please check back soon.",
    emptyHint: "Ask the dealer about upcoming stock.",
    priceOnRequest: "Price on request",
    call: "Call dealer",
    km: "km",
  },
  auth: {
    signInTitle: "Dealer sign in",
    signInBody: "Sign in with your Google account to manage your cars and leads.",
    signInGoogle: "Continue with Google",
    signOut: "Sign out",
    devBypass: "Development mode: Google sign-in is not configured, so this button opens a demo dealer without signing in.",
    notConfigured: "Sign-in is not configured yet. Add the Google keys to the environment.",
  },
  admin: {
    nav: {
      menu: "Menu",
      viewPage: "View my page",
      adminCrumb: "Dealer admin",
      dashboard: "Dashboard",
      cars: "Cars",
      leads: "Leads",
      transfers: "RC transfers",
      reports: "Reports",
      settings: "Settings",
      soon: "Soon",
    },
    dashboard: {
      title: "Dashboard",
      welcome: (name: string) => `Welcome, ${name}`,
      liveCars: "Live cars",
      plan: "Plan",
      publicPage: "Your public page",
      openPage: "Open",
      noDealerTitle: "No dealership linked yet",
      noDealerBody:
        "Your Google account is not linked to a dealership. Setting up a new dealership arrives in the next release. Ask the owner to invite you as staff.",
      capUsage: (used: number, cap: number) => `${used} of ${cap}`,
    },
  },
} as const
