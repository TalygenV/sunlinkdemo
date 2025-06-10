import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

export const checkSurveyAvailability = httpsCallable(
  functions,
  "checkSurveyAvailability"
);

// Add new function for Stripe checkout
export const createCheckoutSession = httpsCallable(
  functions,
  "createCheckoutSession"
);

export type SurveyResponse = {
  success: boolean;
  message: string;
  data?: any;
};

// Add type for checkout session response
export type CheckoutSessionResponse = {
  clientSecret?: string;
  error?: string;
};

// Export the mosaicAnalysis function
export const mosaicAnalysis = httpsCallable(functions, "mosaicAnalysis");
