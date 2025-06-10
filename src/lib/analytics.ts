import { getAnalytics, logEvent } from "firebase/analytics";
import { app } from "./firebase";

const analytics = getAnalytics(app);

export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  try {
    logEvent(analytics, eventName, eventParams);
  } catch (error) {
    console.error("Analytics error:", error);
  }
};

// Common analytics events
export const AnalyticsEvents = {
  FORM_START: "form_start",
  FORM_COMPLETE: "form_complete",
  FORM_ABANDON: "form_abandon",
  SIGN_IN_START: "sign_in_start",
  SIGN_IN_SUCCESS: "sign_in_success",
  SIGN_IN_ERROR: "sign_in_error",
  PAGE_VIEW: "page_view",
  BUTTON_CLICK: "button_click",
  SECTION_VIEW: "section_view",
} as const;
