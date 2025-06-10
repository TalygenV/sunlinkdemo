import axios from "axios";
import cors from "cors";
import * as dotenv from "dotenv";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";
import Stripe from "stripe";

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
admin.initializeApp();
const corsHandler = cors({ origin: true });

// Type declarations for better code organization
interface SurveyResponse {
  success: boolean;
  message: string;
  data?: Record<string, any>;
}

interface SurveyRequestData {
  address: string;
}

// Add this helper function at the top of the file, after imports
function safeStringify(obj: any): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);
    }
    return value;
  });
}

// Helper function to make the API call to check survey availability
async function callSurveyApi(address: string, preview: boolean): Promise<any> {
  const apiKey = process.env.NEARMAP_API_KEY;
  if (!apiKey) {
    functions.logger.error("Missing Nearmap API key");
    throw new functions.https.HttpsError(
      "internal",
      "Missing Nearmap API key."
    );
  }

  // Format address to match the working example
  const formattedAddress = address.trim();

  const config = {
    method: "get",
    // maxBodyLength: Infinity,
    url: `https://api.nearmap.com/coverage/v2/tx/address?address=${formattedAddress}&country=US&dates=single&resources=raster:Vert,aiPacks:roof_char&limit=1&sort=captureDate&preview=${preview}&apikey=${apiKey}`,
    // params: {
    //   address: formattedAddress,
    //   country: "US",
    //   dates: "single",
    //   resources: "raster:Vert,aiPacks:roof_char",
    //   limit: 1,
    //   sort: "captureDate",
    //   preview: preview,
    //   apikey: apiKey,
    // },
    // headers: {
    //   Accept: "application/json",
    // },
    // paramsSerializer: (params) => {
    //   return Object.entries(params)
    //     .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
    //     .join("&");
    // },
  };

  functions.logger.info("Making API call with config:", {
    url: config.url,
    // params: config.params,
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey.length,
  });

  try {
    const response = await axios.request(config);
    functions.logger.info("API call successful:", {
      status: response.status,
      hasData: !!response.data,
      dataKeys: response.data ? Object.keys(response.data) : [],
    });
    return response.data;
  } catch (error) {
    functions.logger.error("Nearmap API call failed:", {
      error: error.response?.data || error.message,
      status: error.response?.status,
      headers: error.response?.headers,
      config: {
        url: config.url,
        // params: config.params,
        // headers: config.headers,
      },
    });

    if (error.response) {
      throw new Error(
        `API Error: ${error.response.status} - ${JSON.stringify(
          error.response.data
        )}`
      );
    } else if (error.request) {
      throw new Error("No response received from Nearmap API");
    } else {
      throw new Error(`Request setup error: ${error.message}`);
    }
  }
}

// Helper function to fetch the actual survey image
async function getSurveyImage(
  surveyId: string,
  bbox: string,
  transactionToken: string
): Promise<any> {
  const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: `https://api.nearmap.com/staticmap/v3/surveys/${surveyId}/Vert.png`,
    params: {
      bbox: bbox,
      transactionToken: transactionToken,
    },
    headers: {},
    responseType: "arraybuffer",
  };

  return await axios.request(config);
}

/**
 * Cloud function to check survey availability and retrieve survey data and image if available
 */
async function getRoofData(aiResourceId, transactionToken) {
  const config = {
    method: "get",
    maxBodyLength: Infinity,
    url: `https://api.nearmap.com/ai/features/v4/tx/surveyresources/${aiResourceId}/features.json`,
    params: {
      transactionToken: transactionToken,
    },
    headers: {},
  };
  try {
    return await axios.request(config);
  } catch (error) {
    functions.logger.error("Roof data retrieval failed", {
      aiResourceId,
      error:
        (error === null || error === void 0 ? void 0 : error.message) ||
        "Unknown error",
    });
    throw error;
  }
}

exports.checkSurveyAvailability = functions.https.onCall(
  async (data, context) => {
    try {
      functions.logger.info("Received data in checkSurveyAvailability:", {
        data: safeStringify(data),
        dataType: typeof data,
        hasAddress: data && "address" in data,
        addressValue: data && data.address,
      });

      // Input validation
      if (!data || typeof data !== "object") {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Data must be an object"
        );
      }

      // Extract address from the nested structure
      const address = data.data?.address || data.address;

      if (!address) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Address is required"
        );
      }

      functions.logger.info(
        "Making API call to Nearmap with address:",
        address
      );

      // Step 1: Check availability with preview=true
      try {
        const previewResponse = await callSurveyApi(address, true);
        functions.logger.info("Preview response received:", {
          hasSurveys: !!previewResponse?.surveys,
          surveyCount: previewResponse?.surveys?.length,
          responseKeys: Object.keys(previewResponse || {}),
          fullResponse: safeStringify(previewResponse),
        });

        // If preview check succeeds, proceed to get actual data
        if (
          previewResponse &&
          previewResponse.surveys &&
          previewResponse.surveys.length > 0
        ) {
          // Step 2: Get actual survey data with preview=false
          const actualResponse = await callSurveyApi(address, false);
          functions.logger.info("Actual survey response received:", {
            actualResponse,
            hasSurveys: !!actualResponse?.surveys,
            surveyCount: actualResponse?.surveys?.length,
            responseKeys: Object.keys(actualResponse || {}),
            fullResponse: safeStringify(actualResponse),
          });

          const surveyData = actualResponse;
          // Ensure we have the required data for the image request
          if (
            surveyData &&
            surveyData.surveys &&
            surveyData.surveys.length > 0
          ) {
            const firstSurvey = surveyData.surveys[0];
            const surveyId = firstSurvey.id;
            const bbox = surveyData.bbox;
            const transactionToken = surveyData.transactionToken;

            functions.logger.info("Making image request with:", {
              surveyId,
              bbox,
              hasTransactionToken: !!transactionToken,
            });

            // Step 3: Get the actual survey image
            const imageResponse = await getSurveyImage(
              surveyId,
              bbox,
              transactionToken
            );
            functions.logger.info("Survey image retrieved", {
              imageResponse,
              address: address,
              surveyId: surveyId,
              status: imageResponse.status,
              contentType: imageResponse.headers["content-type"],
              hasImageData: !!imageResponse.data,
            });

            // Convert binary image data to base64 for transmission
            const imageBase64 = Buffer.from(imageResponse.data).toString(
              "base64"
            );
            const imageDataUrl = `data:${
              imageResponse.headers["content-type"] || "image/png"
            };base64,${imageBase64}`;

            // Step 4: Get roof data if aiResourceId is available
            let roofData = null;
            if (firstSurvey.aiResourceId) {
              try {
                const roofResponse = await getRoofData(
                  firstSurvey.aiResourceId,
                  transactionToken
                );
                roofData = roofResponse.data;
                functions.logger.info("Roof data retrieved successfully", {
                  roofResponse,
                  address: address,
                  aiResourceId: firstSurvey.aiResourceId,
                  hasRoofData: !!roofData,
                  roofDataKeys: roofData ? Object.keys(roofData) : [],
                });
              } catch (roofError) {
                functions.logger.error("Roof data retrieval failed", {
                  address: address,
                  aiResourceId: firstSurvey.aiResourceId,
                  error:
                    roofError instanceof Error
                      ? roofError.message
                      : "Unknown error",
                  errorStack:
                    roofError instanceof Error ? roofError.stack : undefined,
                });
                // Continue even if roof data fails - the rest of the process will work
              }
            }

            const responseData = {
              success: true,
              message:
                "Survey data, image, and roof data retrieved successfully",
              data: {
                surveyData: surveyData,
                imageData: imageDataUrl, // Use the data URL instead of raw base64
                contentType:
                  imageResponse.headers["content-type"] || "image/png",
                roofData: roofData,
              },
            };

            functions.logger.info("Sending response to client:", {
              responseData,
              hasSurveyData: !!responseData.data.surveyData,
              hasImageData: !!responseData.data.imageData,
              hasRoofData: !!responseData.data.roofData,
              responseKeys: Object.keys(responseData),
              imageDataLength: responseData.data.imageData.length,
            });

            return responseData;
          }
        }
        // If we got here, either the preview check failed or we couldn't get the actual data/image
        const errorResponse = {
          success: false,
          message: "No survey available for this address",
          data: previewResponse,
        };

        functions.logger.info("Sending error response to client:", {
          hasPreviewData: !!errorResponse.data,
          responseKeys: Object.keys(errorResponse),
        });

        return errorResponse;
      } catch (apiError) {
        functions.logger.error("API call failed", {
          error: apiError instanceof Error ? apiError.message : "Unknown error",
          errorStack: apiError instanceof Error ? apiError.stack : undefined,
          address: address,
        });
        throw new functions.https.HttpsError(
          "internal",
          "Failed to retrieve survey data: " +
            (apiError instanceof Error ? apiError.message : "Unknown error")
        );
      }
    } catch (error) {
      // Log the error for debugging
      functions.logger.error("Survey check failed", {
        address: data?.address || "not provided",
        error: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : undefined,
        errorType:
          error instanceof Error ? error.constructor.name : typeof error,
      });

      // Error handling
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      if (error.isAxiosError) {
        if (error.response) {
          throw new functions.https.HttpsError(
            "invalid-argument",
            `API returned error: ${error.response.status}`,
            {
              status: error.response.status,
              data: safeStringify(error.response.data),
            }
          );
        } else if (error.request) {
          throw new functions.https.HttpsError(
            "unavailable",
            "No response received from survey API"
          );
        }
      }
      throw new functions.https.HttpsError(
        "internal",
        "Failed to check survey availability: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  }
);

/**
 * Cloud function to create a Stripe Checkout session for the $500 deposit
 */
exports.createStripe = functions.https.onCall(async (data, context) => {
  try {
    functions.logger.info("Creating Stripe session with data:", data);

    // @ts-ignore
    if (!functions.config()) {
      throw new functions.https.HttpsError(
        "internal",
        "CHECKPOINT 1: functions.config() is undefined",
        { checkpoint: 1 }
      );
    }

    // @ts-ignore
    if (!functions.config().stripe) {
      throw new functions.https.HttpsError(
        "internal",
        "CHECKPOINT 2: functions.config().stripe is undefined",
        // @ts-ignore
        { checkpoint: 2, configKeys: Object.keys(functions.config() || {}) }
      );
    }

    // @ts-ignore
    const stripeSecretKey = functions.config().stripe?.secret_key;

    if (!stripeSecretKey) {
      throw new functions.https.HttpsError(
        "internal",
        "CHECKPOINT 3: Missing Stripe secret key in environment variables",
        { checkpoint: 3 }
      );
    }

    // Try initializing Stripe
    let stripe;
    try {
      stripe = new Stripe(stripeSecretKey);
    } catch (stripeInitError) {
      throw new functions.https.HttpsError(
        "internal",
        "CHECKPOINT 4: Failed to initialize Stripe client",
        {
          checkpoint: 4,
          error:
            stripeInitError instanceof Error
              ? stripeInitError.message
              : "Unknown error",
          keyLength: stripeSecretKey.length,
        }
      );
    }

    // Extract customer data and amount
    const { name, email, amount = 50000, orderSummary } = data; // Default to $500 if not provided
    if (!name || !email) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "CHECKPOINT 5: Missing name or email in request data",
        { checkpoint: 5, hasName: !!name, hasEmail: !!email }
      );
    }

    // Create a new customer directly with provided data
    let customerId;
    try {
      const customer = await stripe.customers.create({
        name: name || "Solar Customer",
        email,
        metadata: {
          address: orderSummary?.customerInfo?.address || "",
          city: orderSummary?.customerInfo?.city || "",
          state: orderSummary?.customerInfo?.state || "",
          zipCode: orderSummary?.customerInfo?.zipCode || "",
          systemSize: orderSummary?.systemDetails?.baseSystemCost
            ? `${orderSummary.systemDetails.baseSystemCost / 1000}kW`
            : "",
          batteryCount:
            orderSummary?.systemDetails?.batteryCount?.toString() || "0",
          includeRoof:
            orderSummary?.systemDetails?.includeRoof?.toString() || "false",
          includeEvCharger:
            orderSummary?.systemDetails?.includeEvCharger?.toString() ||
            "false",
          selectedPlan: orderSummary?.selectedPlan?.title || "",
          totalCost: orderSummary?.systemDetails?.totalCost?.toString() || "",
          taxCreditAmount:
            orderSummary?.systemDetails?.taxCreditAmount?.toString() || "",
          finalCost:
            orderSummary?.systemDetails?.costAfterTaxCredit?.toString() || "",
        },
      });

      customerId = customer.id;
      functions.logger.info("Created Stripe customer:", customerId);
    } catch (customerError) {
      throw new functions.https.HttpsError(
        "internal",
        "CHECKPOINT 6: Failed to create Stripe customer",
        {
          checkpoint: 6,
          error:
            customerError instanceof Error
              ? customerError.message
              : "Unknown error",
          errorDetails: JSON.stringify(
            customerError,
            Object.getOwnPropertyNames(customerError)
          ),
        }
      );
    }

    // Define the return URL - ensure the path matches your routes
    const returnUrl = `${
      data.origin || "http://localhost:5173"
    }/design-return?session_id={CHECKOUT_SESSION_ID}`;
    functions.logger.info("Return URL:", returnUrl);

    // Create the checkout session with dynamic amount
    let session;
    try {
      session = await stripe.checkout.sessions.create({
        ui_mode: "embedded",
        ...(customerId && { customer: customerId }),
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Solar System Design Deposit",
                description: `Initial deposit for ${
                  orderSummary?.selectedPlan?.title || "solar system"
                } installation`,
                metadata: {
                  systemSize: orderSummary?.systemDetails?.baseSystemCost
                    ? `${orderSummary.systemDetails.baseSystemCost / 1000}kW`
                    : "",
                  batteryCount:
                    orderSummary?.systemDetails?.batteryCount?.toString() ||
                    "0",
                  includeRoof:
                    orderSummary?.systemDetails?.includeRoof?.toString() ||
                    "false",
                  includeEvCharger:
                    orderSummary?.systemDetails?.includeEvCharger?.toString() ||
                    "false",
                  selectedPlan: orderSummary?.selectedPlan?.title || "",
                  totalCost:
                    orderSummary?.systemDetails?.totalCost?.toString() || "",
                  taxCreditAmount:
                    orderSummary?.systemDetails?.taxCreditAmount?.toString() ||
                    "",
                  finalCost:
                    orderSummary?.systemDetails?.costAfterTaxCredit?.toString() ||
                    "",
                },
              },
              unit_amount: amount, // Use the provided amount
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        return_url: returnUrl,
        metadata: {
          systemSize: orderSummary?.systemDetails?.baseSystemCost
            ? `${orderSummary.systemDetails.baseSystemCost / 1000}kW`
            : "",
          batteryCount:
            orderSummary?.systemDetails?.batteryCount?.toString() || "0",
          includeRoof:
            orderSummary?.systemDetails?.includeRoof?.toString() || "false",
          includeEvCharger:
            orderSummary?.systemDetails?.includeEvCharger?.toString() ||
            "false",
          selectedPlan: orderSummary?.selectedPlan?.title || "",
          totalCost: orderSummary?.systemDetails?.totalCost?.toString() || "",
          taxCreditAmount:
            orderSummary?.systemDetails?.taxCreditAmount?.toString() || "",
          finalCost:
            orderSummary?.systemDetails?.costAfterTaxCredit?.toString() || "",
        },
      });

      functions.logger.info("Created Stripe session successfully", {
        sessionId: session.id,
        hasClientSecret: !!session.client_secret,
        amount: amount,
      });
    } catch (sessionError) {
      throw new functions.https.HttpsError(
        "internal",
        "CHECKPOINT 7: Failed to create checkout session",
        {
          checkpoint: 7,
          error:
            sessionError instanceof Error
              ? sessionError.message
              : "Unknown error",
          errorDetails: JSON.stringify(
            sessionError,
            Object.getOwnPropertyNames(sessionError)
          ),
        }
      );
    }

    if (!session || !session.client_secret) {
      throw new functions.https.HttpsError(
        "internal",
        "CHECKPOINT 8: Session created but client_secret is missing",
        { checkpoint: 8, hasSession: !!session }
      );
    }

    // Success! Return only the client secret
    return { clientSecret: session.client_secret };
  } catch (error) {
    functions.logger.error("Error in createStripe:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to create Stripe session",
      { error: error instanceof Error ? error.message : "Unknown error" }
    );
  }
});

// Add a function to verify Stripe sessions status
exports.verifyStripeSession = functions.https.onCall(async (data, context) => {
  try {
    functions.logger.info("Verifying Stripe session:", data.sessionId);

    if (!data.sessionId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Session ID is required",
        { missingSessionId: true }
      );
    }

    // @ts-ignore
    const stripeSecretKey = functions.config().stripe?.secret_key;

    if (!stripeSecretKey) {
      throw new functions.https.HttpsError(
        "internal",
        "Missing Stripe secret key in environment variables"
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    // Retrieve the session to check its status
    const session = await stripe.checkout.sessions.retrieve(data.sessionId);

    functions.logger.info("Retrieved session status:", {
      id: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
    });

    return {
      success: true,
      sessionId: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email,
      amountTotal: session.amount_total,
    };
  } catch (error) {
    functions.logger.error("Error verifying Stripe session:", error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      "internal",
      "Failed to verify Stripe session: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
  }
});

exports.testCallable = functions.https.onCall(async (data, context) => {
  return { message: "This works!" };
});

// Mosaic API Configuration
const mosaicAuthUrl = defineString("mosaic.auth_url");
const mosaicAudience = defineString("mosaic.audience");
const mosaicClientId = defineString("mosaic.client_id");
const mosaicClientSecret = defineString("mosaic.client_secret");
const mosaicApiBase = defineString("mosaic.api_base");

async function getMosaicAccessToken() {
  if (
    !mosaicAuthUrl.value() ||
    !mosaicAudience.value() ||
    !mosaicClientId.value() ||
    !mosaicClientSecret.value()
  ) {
    throw new HttpsError("internal", "Missing Mosaic API configuration");
  }

  try {
    const response = await axios.post(mosaicAuthUrl.value(), {
      grant_type: "client_credentials",
      audience: mosaicAudience.value(),
      client_id: mosaicClientId.value(),
      client_secret: mosaicClientSecret.value(),
    });
    return (response.data as { access_token: string }).access_token;
  } catch (error) {
    functions.logger.error("Mosaic authentication error", {
      error: error.message,
      details: error.response?.data,
    });
    throw new HttpsError("internal", "Failed to authenticate with Mosaic API");
  }
}

// 1. Get Mosaic Loan Products
exports.getMosaicLoanProducts = onCall(async (request) => {
  try {
    if (!mosaicApiBase.value()) {
      throw new HttpsError("internal", "Missing Mosaic API base URL");
    }

    const accessToken = await getMosaicAccessToken();
    const res = await axios.get(`${mosaicApiBase.value()}/loan-products`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return { success: true, products: res.data };
  } catch (error) {
    functions.logger.error("Mosaic loan products error", {
      error: error.message,
      details: error.response?.data,
    });
    return {
      success: false,
      message: error.message,
      details: error.response?.data,
    };
  }
});

// 2. Get Mosaic Payment Estimate
exports.getMosaicPaymentEstimate = functions.https.onCall(
  async (data, context) => {
    try {
      const { productId, amount } = data;
      if (!productId || !amount) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "productId and amount are required"
        );
      }
      const accessToken = await getMosaicAccessToken();
      // Replace with the actual endpoint for payment estimate (example path)
      const res = await axios.post(
        `${mosaicApiBase.value()}/payment-estimate`,
        { productId, amount },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return { success: true, estimate: res.data };
    } catch (error) {
      functions.logger.error("Mosaic payment estimate error", {
        error: error.message,
        details: error.response?.data,
      });
      return {
        success: false,
        message: error.message,
        details: error.response?.data,
      };
    }
  }
);
