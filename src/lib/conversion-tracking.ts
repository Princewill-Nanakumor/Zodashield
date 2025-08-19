// lib/conversion-tracking.ts

// Define types for better type safety
type ConversionEventName =
  | "purchase"
  | "signup"
  | "lead_generation"
  | "add_to_cart"
  | "view_content"
  | string;
type CurrencyCode = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | string;

interface AdditionalConversionData {
  productId?: string;
  productName?: string;
  category?: string;
  campaign?: string;
  source?: string;
  medium?: string;
  content?: string;
  term?: string;
  [key: string]: string | number | boolean | undefined | null;
}

interface ConversionData {
  event: ConversionEventName;
  value: number;
  currency: CurrencyCode;
  timestamp: number;
  url: string;
  sessionId: string | null;
  userId: string | null;
}

interface FullConversionData extends ConversionData, AdditionalConversionData {}

// Google Analytics gtag interface - simplified approach
interface GtagEventParameters {
  send_to?: string;
  value?: number;
  currency?: string;
  event_category?: string;
  event_label?: string;
  [key: string]: string | number | boolean | undefined;
}

// Type-safe gtag function
function safeGtag(
  command: string,
  eventName: string,
  parameters: GtagEventParameters
): void {
  if (
    typeof window !== "undefined" &&
    "gtag" in window &&
    typeof window.gtag === "function"
  ) {
    (
      window.gtag as (
        command: string,
        eventName: string,
        parameters: GtagEventParameters
      ) => void
    )(command, eventName, parameters);
  }
}

/**
 * Track conversion events for analytics
 * @param eventName - The name of the conversion event
 * @param value - The monetary value of the conversion (default: 0)
 * @param currency - The currency code (default: 'USD')
 * @param additionalData - Additional data to include with the conversion
 */
export function trackConversion(
  eventName: ConversionEventName,
  value: number = 0,
  currency: CurrencyCode = "USD",
  additionalData: AdditionalConversionData = {}
): void {
  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    console.warn("trackConversion called on server side, skipping...");
    return;
  }

  const conversionData: FullConversionData = {
    event: eventName,
    value: value,
    currency: currency,
    timestamp: Date.now(),
    url: window.location.href,
    sessionId: getOrCreateSessionId(),
    userId: getUserId(),
    ...additionalData,
  };

  // Send to your analytics API
  fetch("/api/analytics/conversions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(conversionData),
  }).catch((error: Error) => {
    console.error("Failed to track conversion:", error);
  });

  // Also send to Google Analytics if available
  safeGtag("event", "conversion", {
    send_to: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "GA_MEASUREMENT_ID",
    value: value,
    currency: currency,
    event_category: "Ecommerce",
    event_label: eventName,
  });

  console.log("Conversion tracked:", conversionData);
}

/**
 * Get or create a session ID for tracking user sessions
 * @returns The session ID or null if sessionStorage is not available
 */
function getOrCreateSessionId(): string | null {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return null;
  }

  try {
    let sessionId = sessionStorage.getItem("sessionId");
    if (!sessionId) {
      sessionId =
        Date.now().toString() + Math.random().toString(36).substring(2, 11);
      sessionStorage.setItem("sessionId", sessionId);
    }
    return sessionId;
  } catch (error) {
    console.error("Error accessing sessionStorage:", error);
    return null;
  }
}

/**
 * Get the current user ID if available
 * @returns The user ID or null if not logged in or localStorage not available
 */
function getUserId(): string | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    return localStorage.getItem("userId") || null;
  } catch (error) {
    console.error("Error accessing localStorage:", error);
    return null;
  }
}

/**
 * Set user ID for tracking (call this when user logs in)
 * @param userId - The user ID to set
 */
export function setUserId(userId: string): void {
  if (typeof window === "undefined" || !window.localStorage) {
    console.warn("setUserId called but localStorage not available");
    return;
  }

  try {
    localStorage.setItem("userId", userId);
  } catch (error) {
    console.error("Error setting user ID:", error);
  }
}

/**
 * Clear user ID (call this when user logs out)
 */
export function clearUserId(): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    localStorage.removeItem("userId");
  } catch (error) {
    console.error("Error clearing user ID:", error);
  }
}

/**
 * Helper function to track Google Analytics events with proper typing
 */
export function trackGoogleAnalyticsEvent(
  eventName: string,
  parameters: GtagEventParameters = {}
): void {
  safeGtag("event", eventName, parameters);
}

/**
 * Track specific ecommerce events with predefined parameters
 */
export const ecommerceTracking = {
  /**
   * Track a purchase conversion
   */
  trackPurchase: (
    value: number,
    currency: CurrencyCode = "USD",
    productData?: {
      productId?: string;
      productName?: string;
      category?: string;
    }
  ) => {
    trackConversion("purchase", value, currency, productData);
  },

  /**
   * Track user signup
   */
  trackSignup: (method?: string) => {
    trackConversion("signup", 0, "USD", { signup_method: method });
  },

  /**
   * Track lead generation
   */
  trackLead: (leadValue?: number, source?: string) => {
    trackConversion("lead_generation", leadValue || 0, "USD", {
      lead_source: source,
    });
  },

  /**
   * Track add to cart
   */
  trackAddToCart: (
    value: number,
    productData?: {
      productId?: string;
      productName?: string;
      category?: string;
    }
  ) => {
    trackConversion("add_to_cart", value, "USD", productData);
  },
};
