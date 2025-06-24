import React, { useEffect, useState } from "react";

// Simple SVG icon components to replace lucide-react
const FileTextIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M14,2 L14,8 L20,8 M14,2 L4,2 C2.9,2 2,2.9 2,4 L2,20 C2,21.1 2.9,22 4,22 L20,22 C21.1,22 22,21.1 22,20 L22,8 L14,2 Z" />
    <polyline points="16,13 8,13 8,17 16,17" />
    <polyline points="16,9 8,9" />
  </svg>
);

const ShieldIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12,22 C12,22 20,18 20,12 L20,5 L12,2 L4,5 L4,12 C4,18 12,22 12,22 Z" />
  </svg>
);

const WrenchIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M14.7,6.3 C16.1,4.9 18.3,4.9 19.7,6.3 C21.1,7.7 21.1,9.9 19.7,11.3 L18.3,12.7 L11.3,19.7 C10.9,20.1 10.3,20.1 9.9,19.7 L4.3,14.1 C3.9,13.7 3.9,13.1 4.3,12.7 L11.3,5.7 L12.7,4.3 Z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M22,11.08 L22,12 C22,17.52 17.52,22 12,22 C6.48,22 2,17.52 2,12 C2,6.48 6.48,2 12,2 C13.23,2 14.42,2.22 15.52,2.61" />
    <polyline points="22,4 12,14.01 9,11.01" />
  </svg>
);

const XIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const AlertCircleIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const MailIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M4,4 L20,4 C21.1,4 22,4.9 22,6 L22,18 C22,19.1 21.1,20 20,20 L4,20 C2.9,20 2,19.1 2,18 L2,6 C2,4.9 2.9,4 4,4 Z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const UserIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M20,21 L20,19 C20,16.79 18.21,15 16,15 L8,15 C5.79,15 4,16.79 4,19 L4,21" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const InstallerContract: React.FC = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [showSigningModal, setShowSigningModal] = useState(false);
  const [signingUrl, setSigningUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [signedStatus, setSignedStatus] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
  });

  // DocuSign configuration - In a real app, these would come from environment variables
  const CLIENT_ID = import.meta.env.VITE_DOCUSIGN_CLIENT_ID;
  const ACCOUNT_ID = import.meta.env.VITE_DOCUSIGN_ACCOUNT_ID;
  const TEMPLATE_ID = import.meta.env.VITE_DOCUSIGN_TEMPLATEID;
  const REDIRECT_URI = import.meta.env.VITE_DOCUSIGN_REDIRECTURI;
  const BASE_PATH = "https://demo.docusign.net/restapi";
  const CLIENT_SECRET = import.meta.env.VITE_DOCUSIGN_CLIENT_SECRET;

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get("access_token");
    const envelopeId = params.get("envelopeId");

    const isPopup = window.opener && window.opener !== window;

    if (token) {
      setAccessToken(token);
      createEnvelopeForEmbeddedSigning(token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (envelopeId) {
      window.history.replaceState({}, document.title, window.location.pathname);

      if (isPopup) {
        // Notify the main window
        window.opener.postMessage({ type: "SIGNING_COMPLETED" }, "*");
        // Close this popup
        window.close();
      } else {
        // Fallback — maybe user didn't go through popup
        handleSigningComplete();
      }
    }
  }, []);
  useEffect(() => {
    // Initialize from global if available
    debugger;
    setUserInfo({
      name: localStorage.getItem("nameGlobal") || "",
      email: localStorage.getItem("emailGlobal") || "",
    });
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Ensure message is from same origin (security)
      if (event.origin !== window.origin) return;

      if (event.data?.type === "SIGNING_COMPLETED") {
        console.log("Received SIGNING_COMPLETED message from popup");
        setShowSigningModal(false); // ✅ This closes the modal
        handleSigningComplete();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleLogin = () => {
    const authUrl = `https://account-d.docusign.com/oauth/auth?response_type=token&scope=signature%20cors&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}`;
    window.location.href = authUrl;
  };

  const createEnvelopeForEmbeddedSigning = async (token: string) => {
    setIsLoading(true);

    try {
      // Create envelope with embedded signing
      const envelopeResponse = await fetch(
        `${BASE_PATH}/v2.1/accounts/${ACCOUNT_ID}/envelopes`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            templateId: TEMPLATE_ID,
            templateRoles: [
              {
                email: userInfo.email,
                name: userInfo.name,
                roleName: "Signer",
                clientUserId: "embedded_signer_001", // Required for embedded signing
              },
            ],
            status: "sent",
          }),
        }
      );

      const envelopeData = await envelopeResponse.json();

      if (!envelopeResponse.ok) {
        throw new Error(
          `Failed to create envelope: ${
            envelopeData.message || "Unknown error"
          }`
        );
      }

      console.log("Envelope created:", envelopeData);

      // Get recipient view URL for embedded signing
      const recipientViewResponse = await fetch(
        `${BASE_PATH}/v2.1/accounts/${ACCOUNT_ID}/envelopes/${envelopeData.envelopeId}/views/recipient`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userName: userInfo.name,
            email: userInfo.email,
            recipientId: "1",
            clientUserId: "embedded_signer_001",
            authenticationMethod: "none",
            returnUrl: `${window.location.origin}/installer-contract#envelopeId=${envelopeData.envelopeId}`,
          }),
        }
      );

      const recipientViewData = await recipientViewResponse.json();

      if (!recipientViewResponse.ok) {
        throw new Error(
          `Failed to get signing URL: ${
            recipientViewData.message || "Unknown error"
          }`
        );
      }

      console.log("Recipient view URL:", recipientViewData);

      setSigningUrl(recipientViewData.url);
      setShowSigningModal(true);
    } catch (error) {
      console.error("Error in embedded signing process:", error);
      // alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignContract = () => {
    if (!accessToken) {
      handleLogin();
      return;
    }

    createEnvelopeForEmbeddedSigning(accessToken);
  };

  const handleSigningComplete = () => {
    setSignedStatus("completed");
    setShowSigningModal(false);
    // Simulate email notifications
    setTimeout(() => {
      alert(
        "🎉 Contract signed successfully! Confirmation emails have been sent to you and our admin team."
      );
    }, 500);
  };

  const handleSigningCancel = () => {
    setSignedStatus("cancelled");
    setShowSigningModal(false);
  };

  // // Listen for messages from the signing iframe
  // useEffect(() => {
  //   const handleMessage = (event: MessageEvent) => {
  //     debugger;
  //     window.addEventListener("message", handleMessage);
  //     return () => window.removeEventListener("message", handleMessage);
  //   };
  //   debugger;
  //   const hash = window.location.hash.substring(1);
  //   const params = new URLSearchParams(hash);
  //   const envelopeId = params.get("envelopeId");
  //   if (envelopeId) {
  //     setShowSigningModal(false);
  //     handleSigningComplete();
  //   }
  //   window.addEventListener("message", handleMessage);
  //   return () => window.removeEventListener("message", handleMessage);
  // });
  // useEffect(() => {
  //   const handleMessage = (event: MessageEvent) => {
  //     if (event.data?.type === "SIGNING_COMPLETED") {
  //       handleSigningComplete();
  //     }
  //   };

  //   window.addEventListener("message", handleMessage);
  //   return () => window.removeEventListener("message", handleMessage);
  // }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Home Improvement Contract</h1>
          <p className="text-slate-300">
            Review your solar installation agreement and warranties
          </p>

          {/* User Info Display */}
          {accessToken && (
            <div className="mt-4 inline-flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
              <UserIcon />
              <span className="text-sm text-slate-300">
                Logged in as: {userInfo.name} ({userInfo.email})
              </span>
            </div>
          )}
        </div>

        {/* Status Display */}
        {signedStatus && (
          <div
            className={`mb-8 p-4 rounded-lg flex items-center space-x-3 ${
              signedStatus === "completed"
                ? "bg-green-900/30 border border-green-700"
                : "bg-red-900/30 border border-red-700"
            }`}
          >
            {signedStatus === "completed" ? (
              <CheckCircleIcon />
            ) : (
              <AlertCircleIcon />
            )}
            <div>
              <p
                className={`font-medium ${
                  signedStatus === "completed"
                    ? "text-green-300"
                    : "text-red-300"
                }`}
              >
                {signedStatus === "completed"
                  ? "Contract Signed Successfully!"
                  : "Signing Process Cancelled"}
              </p>
              {signedStatus === "completed" && (
                <div className="flex items-center gap-2 mt-1 text-sm text-green-400">
                  <MailIcon />
                  <span>Confirmation emails sent to all parties</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Contract Details */}
          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileTextIcon />
              Contract Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <p className="text-sm text-slate-400">Contract Number</p>
                <p className="font-semibold">#SOL-2025-0123</p>
              </div>
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <p className="text-sm text-slate-400">Installation Address</p>
                <p className="font-semibold">
                  123 Solar Street, Sunnyville, CA 92123
                </p>
              </div>
            </div>
          </section>

          {/* Warranties */}
          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ShieldIcon />
              Warranties & Guarantees
            </h2>
            <div className="space-y-4">
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Production Guarantee</h3>
                <p className="text-slate-300">
                  We guarantee your system will produce at least 92% of the
                  estimated annual production or we'll pay you the difference.
                </p>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Workmanship Warranty</h3>
                <p className="text-slate-300">
                  25-year comprehensive warranty covering all aspects of the
                  installation, including roof penetrations and mounting
                  hardware.
                </p>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Equipment Warranties</h3>
                <ul className="space-y-2 text-slate-300">
                  <li>
                    • Solar Panels: 25-year product and performance warranty
                  </li>
                  <li>• Inverter: 25-year warranty</li>
                  <li>• Battery: 10-year warranty</li>
                  <li>• Mounting System: 25-year warranty</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <WrenchIcon />
              Installation Timeline
            </h2>
            <div className="space-y-4">
              {[
                "Site Survey & Design",
                "Permitting",
                "Installation",
                "Final Inspection & Activation",
              ].map((title, i) => (
                <div
                  key={i}
                  className="relative pl-8 pb-8 border-l-2 border-slate-700 last:border-0"
                >
                  <div className="absolute left-0 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-500"></div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-slate-300">
                    {
                      {
                        0: "Completed within 7 days",
                        1: "2-3 weeks processing time",
                        2: "1-2 days for installation",
                        3: "Within 1 week of installation",
                      }[i]
                    }
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Button */}
          <div className="flex justify-center pt-8">
            <button
              onClick={handleSignContract}
              disabled={isLoading || signedStatus === "completed"}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-8 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Preparing Document...</span>
                </>
              ) : signedStatus === "completed" ? (
                <>
                  <CheckCircleIcon />
                  <span>Contract Signed</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon />
                  <span>
                    {accessToken
                      ? "Accept & Sign Contract"
                      : "Login with DocuSign"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* DocuSign Signing Modal */}
      {showSigningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg w-full max-w-6xl h-5/6 flex flex-col border border-slate-700">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <FileTextIcon />
                <h3 className="text-lg font-semibold text-white">
                  Sign Your Solar Installation Contract
                </h3>
              </div>
              <button
                onClick={handleSigningCancel}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <XIcon />
              </button>
            </div>

            {/* DocuSign Iframe Container */}
            <div className="flex-1 p-4">
              <div className="w-full h-full bg-white rounded-lg overflow-hidden">
                {signingUrl ? (
                  <iframe
                    src={signingUrl}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    title="DocuSign Document Signing"
                    className="rounded-lg"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600">
                        Loading signing interface...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Info */}
            <div className="p-4 border-t border-slate-700 bg-slate-900/50">
              <div className="flex items-center justify-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldIcon />
                  <span>Secure & Legally Binding</span>
                </div>
                <div className="flex items-center gap-2">
                  <MailIcon />
                  <span>Auto-notification Enabled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallerContract;
