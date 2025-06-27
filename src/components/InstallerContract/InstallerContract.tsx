import { httpsCallable } from "firebase/functions";
import { getFunctions } from "firebase/functions";
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Simple SVG icon components
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

const EditIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M11,4 L4,4 C2.9,4 2,4.9 2,6 L2,20 C2,21.1 2.9,22 4,22 L18,22 C19.1,22 20,21.1 20,20 L20,13" />
    <path d="M18.5,2.5 C19.3,1.7 20.7,1.7 21.5,2.5 C22.3,3.3 22.3,4.7 21.5,5.5 L12,15 L8,16 L9,12 L18.5,2.5 Z" />
  </svg>
);

const InstallerContract: React.FC = () => {
  const [showSigningModal, setShowSigningModal] = useState(false);
  const [signingUrl, setSigningUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [signedStatus, setSignedStatus] = useState<string | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    uid: "",
  });
  const [error, setError] = useState<string | null>(null);

  // Firebase function configuration
  const FIREBASE_FUNCTION_URL =
    "https://createsigninglink-6wr3ut5iuq-uc.a.run.app/createSigningLink";
  const templateId = import.meta.env.VITE_DOCUSIGN_TEMPLATEID; // Replace with your actual template ID

  useEffect(() => {
    // Check URL parameters for signing completion
    const urlParams = new URLSearchParams(window.location.search);
    const event = urlParams.get("event");

    if (event === "signing_complete") {
      handleSigningComplete();
      // Clean up URL parameters
      //window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Initialize user info from storage or show form
    const storedName = localStorage.getItem("nameGlobal") || "";
    const storedEmail = localStorage.getItem("emailGlobal") || "";
    const uidGlobal = localStorage.getItem("uidGlobal") || "";

    if (storedName && storedEmail) {
      setUserInfo({ name: storedName, email: storedEmail, uid: uidGlobal });
    } else {
      setShowUserForm(true);
    }
  }, []);

  useEffect(() => {
    // Listen for messages from signing popup/iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.origin) return;

      if (event.data?.type === "SIGNING_COMPLETED") {
        console.log("Received SIGNING_COMPLETED message");
        setShowSigningModal(false);
        //handleSigningComplete();
        setShowUserForm(false);
        setError(null);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);
  useEffect(() => {
    if (window.top && window.top !== window.self) {
      window.top.location.href = window.location.href;
    }
  }, []);
  const createSigningLink = async () => {
    setIsLoading(true);
    setError(null);

    try {
      //debugger;
      console.log("templateId", templateId);
      console.log("userInfo", userInfo);
      const returnUrl = `${window.location.origin}${window.location.pathname}?event=signing_complete`;
      console.log("returnUrl", returnUrl);
      const response = await fetch(
        "https://us-central1-sunlink-21942.cloudfunctions.net/createSigningLink",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            signerName: userInfo.name,
            signerEmail: userInfo.email,
            returnUrl: returnUrl,
            templateId: templateId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();

      if (result?.url) {
        setSigningUrl(result.url);
        setShowSigningModal(true);
      } else {
        throw new Error("No signing URL received from server");
      }
    } catch (error: any) {
      console.log("Error creating signing link:", error);
      setError(
        error.message || "Failed to create signing link. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };
  const handleSignContract = () => {
    createSigningLink();
  };

  const handleSigningComplete = () => {
    setSignedStatus("completed");
    setShowSigningModal(false);

    // Show success message
    setTimeout(() => {
      setShowSuccessModal(true);
    }, 500);
  };

  const handleSigningCancel = () => {
    setSignedStatus("cancelled");
    setShowSigningModal(false);
  };

  const handleEditUserInfo = () => {
    setShowUserForm(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Home Improvement Contract</h1>
          <p className="text-slate-300">
            Review your solar installation agreement and warranties
          </p>

          {/* User Info Display */}
          {!showUserForm && userInfo.name && userInfo.email && (
            <div className="mt-4 inline-flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
              <UserIcon />
              <span className="text-sm text-slate-300">
                {userInfo.name} ({userInfo.email})
              </span>
              <button
                onClick={handleEditUserInfo}
                className="ml-2 text-slate-400 hover:text-white transition-colors"
                title="Edit user information"
              >
                <EditIcon />
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 rounded-lg flex items-center space-x-3 bg-red-900/30 border border-red-700">
            <AlertCircleIcon />
            <div>
              <p className="font-medium text-red-300">Error</p>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

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
                  <span>Accept & Sign Contract</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuccessModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md p-8 bg-black/90 backdrop-blur-xl rounded-3xl border border-white/10 z-10 text-center"
            >
              <h2 className="text-2xl font-medium text-white mb-4">
                🎉 Document Signed Successfully!
              </h2>
              <p className="text-white/70 mb-6">
                Confirmation emails have been sent to you and our admin team.
              </p>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setShowSigningModal(false); // Close other modals
                }}
                className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 rounded-lg text-white transition-colors"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
