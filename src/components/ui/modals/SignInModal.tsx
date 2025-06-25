import {
  createUserWithEmailAndPassword,
  getAuth,
  RecaptchaVerifier,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
} from "firebase/auth";
import { get, ref } from "firebase/database";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Lock, Mail, Phone, User, X } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnalyticsEvents, trackEvent } from "../../../lib/analytics";
import { app, db, firestore } from "../../../lib/firebase";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignInSuccess?: () => void; // Optional callback for successful sign-in
}

const auth = getAuth(app);

type Step = "phone" | "verify" | "email" | "forgot-password";

export default function SignInModal({
  isOpen,
  onClose,
  onSignInSuccess,
}: SignInModalProps) {
  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState("Customer");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [formErrors, setFormErrors] = useState({
    phone: "",
    email: "",
    password: "",
    verificationCode: "",
  });
  const navigate = useNavigate();
  const recaptchaContainerRef = React.useRef<HTMLDivElement>(null);

  // Cleanup reCAPTCHA on modal close
  React.useEffect(() => {
    if (!isOpen) {
      // Track modal close if it was open
      if (step !== "phone") {
        trackEvent(AnalyticsEvents.FORM_ABANDON, { step });
      }

      // Clear the existing reCAPTCHA
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        delete window.recaptchaVerifier;
      }
    }
  }, [isOpen]);

  const setupRecaptcha = async () => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      delete window.recaptchaVerifier;
    }

    if (!recaptchaContainerRef.current) {
      setError("Recaptcha container not found");
      setLoading(false);
      return;
    }

    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      recaptchaContainerRef.current,
      {
        size: "invisible",
        callback: () => {
          // recaptcha solved
        },
        "expired-callback": () => {
          setError("reCAPTCHA expired. Please try again.");
          if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            delete window.recaptchaVerifier;
          }
        },
      }
    );

    await window.recaptchaVerifier.render();
  };

  const validatePhoneNumber = (phone: string) => {
    if (!phone) {
      setFormErrors((prev) => ({ ...prev, phone: "Phone number is required" }));
      return false;
    }
    if (!/^\+?[1-9]\d{1,14}$/.test(phone)) {
      setFormErrors((prev) => ({
        ...prev,
        phone: "Please enter a valid phone number",
      }));
      return false;
    }
    setFormErrors((prev) => ({ ...prev, phone: "" }));
    return true;
  };

  const validateEmail = (email: string) => {
    if (!email) {
      setFormErrors((prev) => ({ ...prev, email: "Email is required" }));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormErrors((prev) => ({
        ...prev,
        email: "Please enter a valid email address",
      }));
      return false;
    }
    setFormErrors((prev) => ({ ...prev, email: "" }));
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setFormErrors((prev) => ({ ...prev, password: "Password is required" }));
      return false;
    }
    if (password.length < 6) {
      setFormErrors((prev) => ({
        ...prev,
        password: "Password must be at least 6 characters",
      }));
      return false;
    }
    setFormErrors((prev) => ({ ...prev, password: "" }));
    return true;
  };

  const validateVerificationCode = (code: string) => {
    if (!code) {
      setFormErrors((prev) => ({
        ...prev,
        verificationCode: "Verification code is required",
      }));
      return false;
    }
    if (!/^\d{6}$/.test(code)) {
      setFormErrors((prev) => ({
        ...prev,
        verificationCode: "Please enter a valid 6-digit code",
      }));
      return false;
    }
    setFormErrors((prev) => ({ ...prev, verificationCode: "" }));
    return true;
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePhoneNumber(phoneNumber)) return;

    setLoading(true);
    setError("");

    try {
      await setupRecaptcha(); // Await here to ensure token ready
      const formattedNumber = phoneNumber; // Ensure it's E.164 formatted, e.g. "+923119739851"
      const confirmation = await signInWithPhoneNumber(
        auth,
        formattedNumber,
        window.recaptchaVerifier
      );
      setConfirmationResult(confirmation);
      setStep("verify");
    } catch (err: any) {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        delete window.recaptchaVerifier;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateVerificationCode(verificationCode)) return;

    setLoading(true);
    setError("");

    try {
      const userCredential = await confirmationResult.confirm(verificationCode);
      trackEvent(AnalyticsEvents.SIGN_IN_SUCCESS);

      console.log(
        "Phone authentication successful, checking purchase status..."
      );

      // Check for purchase completion status
      const user = userCredential.user;
      if (user) {
        console.log("User authenticated:", user.uid);
        // Fetch user data to check purchase status
        const userRef = ref(db, `users/${user.uid}`);
        console.log("Fetching user data from:", `${user.uid}`);

        try {
          const snapshot = await get(userRef);
          console.log("Firebase data retrieved:", snapshot.exists());

          if (snapshot.exists()) {
            const data = snapshot.val();
            console.log("User data:", data);
            console.log("Purchase completed status:", data.purchaseCompleted);

            // If purchase is completed, redirect to portal
            if (data.purchaseCompleted) {
              console.log("Purchase completed! Redirecting to portal...");
              // Close modal first
              onClose();
              // Then redirect to portal
              window.location.href = "/portal";
              return;
            } else {
              console.log("No completed purchase found");
            }
          } else {
            console.log("No user data found in database");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        console.log("No user object available after authentication");
      }

      // Default fallback for users without completed purchase
      if (onSignInSuccess) {
        onSignInSuccess();
      } else {
        onClose();
      }
    } catch (err: any) {
      trackEvent(AnalyticsEvents.SIGN_IN_ERROR, { error: err.message });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email) || !validatePassword(password)) return;

    setLoading(true);
    setError("");

    try {
      trackEvent(AnalyticsEvents.SIGN_IN_START, { method: "email" });
      let userCredential;
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;
        await setDoc(
          doc(firestore, "users", user.uid),
          {
            email: user.email,
            role,
            createdAt: new Date(),
          },
          { merge: true }
        );
        console.log("emailGlobal", user.email || "");
        localStorage.setItem("emailGlobal", user.email || "");
        console.log("nameGlobal", user.displayName || "");
        localStorage.setItem("nameGlobal", user.displayName || "");
      } else {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const userDoc = await getDoc(
          doc(firestore, "users", userCredential.user.uid)
        );

        const userData = userDoc.exists() ? userDoc.data() : null;
        const userRole = userData?.role || "Customer";
        console.log("emailGlobal", userCredential.user.email || "");
        localStorage.setItem("emailGlobal", userCredential.user.email || "");
        console.log("nameGlobal", userCredential.user.displayName || "");
        localStorage.setItem(
          "nameGlobal",
          userCredential.user.displayName || ""
        );
        if (userRole === "Admin") {
          navigate("/installer");
        } else if (userRole === "Installer") {
          navigate("/installer");
        } else {
          navigate("/design");
        }
      }
      trackEvent(AnalyticsEvents.SIGN_IN_SUCCESS, { method: "email" });

      const user = userCredential.user;
      if (user) {
        const userRef = ref(db, `users/${user.uid}`);
        try {
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            const data = snapshot.val();
            if (data.purchaseCompleted) {
              onClose();
              window.location.href = "/portal";
              return;
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }

      if (onSignInSuccess) {
        onSignInSuccess();
      } else {
        onClose();
      }
    } catch (err: any) {
      console.log("Firebase Error:", err); // Debug log
      trackEvent(AnalyticsEvents.SIGN_IN_ERROR, {
        method: "email",
        error: err.message,
      });

      // Convert Firebase error messages to user-friendly messages
      let userFriendlyError =
        "An error occurred during sign in. Please try again.";

      // Handle FirebaseError
      if (err.code) {
        switch (err.code) {
          case "auth/invalid-email":
            userFriendlyError = "Please enter a valid email address.";
            break;
          case "auth/user-disabled":
            userFriendlyError =
              "This account has been disabled. Please contact support.";
            break;
          case "auth/user-not-found":
            userFriendlyError =
              "No account found with this email. Please sign up first.";
            break;
          case "auth/wrong-password":
            userFriendlyError = "Incorrect password. Please try again.";
            break;
          case "auth/email-already-in-use":
            userFriendlyError =
              "This email is already registered. Please sign in instead.";
            break;
          case "auth/weak-password":
            userFriendlyError =
              "Password should be at least 6 characters long.";
            break;
          case "auth/operation-not-allowed":
            userFriendlyError =
              "Email/password accounts are not enabled. Please contact support.";
            break;
          case "auth/too-many-requests":
            userFriendlyError =
              "Too many failed attempts. Please try again later.";
            break;
          case "auth/invalid-credential":
            userFriendlyError =
              "Invalid email or password. Please check your credentials and try again.";
            break;
          default:
            console.log("Unhandled Firebase Error:", err);
            userFriendlyError =
              "An error occurred during sign in. Please try again.";
        }
      }

      setError(userFriendlyError);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) return;

    setLoading(true);
    setError("");

    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
      trackEvent(AnalyticsEvents.PASSWORD_RESET_EMAIL_SENT);
    } catch (err: any) {
      trackEvent(AnalyticsEvents.PASSWORD_RESET_ERROR, { error: err.message });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  const getStepContent = () => {
    switch (step) {
      case "phone":
        return (
          <>
            <div className="flex justify-center mb-4">
              <Phone className="w-12 h-12 text-accent-400" />
            </div>
            <h2 className="text-2xl font-light text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-400 text-sm">
              Enter your phone number to sign in
            </p>
            <form
              onSubmit={handleSendCode}
              className="mt-8 space-y-6"
              noValidate
            >
              <div>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="text-sm text-accent-400 hover:text-accent-300 transition-colors duration-300 mb-4"
                >
                  Use email instead
                </button>
              </div>
              <div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      setFormErrors((prev) => ({ ...prev, phone: "" }));
                    }}
                    placeholder="(555) 555-5555"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                  />
                </div>
                {formErrors.phone && (
                  <p className="mt-2 text-sm text-red-400">
                    {formErrors.phone}
                  </p>
                )}
              </div>
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-sheen w-full flex items-center justify-center gap-3 px-8 py-3 text-white rounded-full shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Send Code
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>
          </>
        );

      case "verify":
        return (
          <>
            <div className="flex justify-center mb-4">
              <Lock className="w-12 h-12 text-accent-400" />
            </div>
            <h2 className="text-2xl font-light text-white mb-2">
              Verify Your Number
            </h2>
            <p className="text-gray-400 text-sm">
              Enter the verification code sent to your phone
            </p>
            <form
              onSubmit={handleVerifyCode}
              className="mt-8 space-y-6"
              noValidate
            >
              <div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => {
                      setVerificationCode(e.target.value);
                      setFormErrors((prev) => ({
                        ...prev,
                        verificationCode: "",
                      }));
                    }}
                    placeholder="Enter 6-digit code"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-400/20"
                  />
                </div>
                {formErrors.verificationCode && (
                  <p className="mt-2 text-sm text-red-400">
                    {formErrors.verificationCode}
                  </p>
                )}
              </div>
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-sheen w-full flex items-center justify-center gap-3 px-8 py-3 text-white rounded-full shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>
          </>
        );

      case "email":
        return (
          <>
            <div className="flex justify-center mb-4">
              <Mail className="w-12 h-12 text-accent-400 animate-pulse icon-glow-accent animate-fade-slide-up" />
            </div>
            <h2 className="text-2xl font-light text-white mb-2 animate-fade-slide-up">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-gray-400 text-sm animate-fade-slide-up">
              {isSignUp ? "Sign up with your email" : "Sign in with your email"}
            </p>
            <form
              onSubmit={handleEmailAuth}
              className="mt-8 space-y-6"
              noValidate
            >
              <div>
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="text-sm text-accent-400 hover:text-accent-300 transition-colors duration-300 mb-4"
                >
                  Use phone instead
                </button>
              </div>
              <div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFormErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    placeholder="Enter your email"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                  />
                </div>
                {formErrors.email && (
                  <p className="mt-2 text-sm text-red-400">
                    {formErrors.email}
                  </p>
                )}
              </div>
              <div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFormErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                  />
                </div>
                {formErrors.password && (
                  <p className="mt-2 text-sm text-red-400">
                    {formErrors.password}
                  </p>
                )}
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setStep("forgot-password")}
                    className="text-sm text-accent-400 hover:text-accent-300 transition-colors duration-300 mt-2"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              {isSignUp && (
                <div>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400/20 appearance-none"
                      required
                    >
                      <option value="Customer">Customer</option>
                      <option value="Installer">Installer</option>
                      {/* <option value="Admin">Admin</option> */}
                    </select>
                  </div>
                </div>
              )}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-sheen w-full flex items-center justify-center gap-3 px-8 py-3 text-white rounded-full shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isSignUp ? "Sign Up" : "Sign In"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-gray-400 hover:text-white transition-colors duration-300 mt-4"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            </form>
          </>
        );

      case "forgot-password":
        return (
          <div>
            <h2 className="mb-6 text-2xl font-bold text-white">
              Reset Password
            </h2>
            {resetEmailSent ? (
              <div className="text-center">
                <p className="mb-4 text-green-400">
                  Password reset email sent! Please check your inbox.
                </p>
                <button
                  onClick={() => setStep("email")}
                  className="text-accent-400 hover:text-accent-300"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleForgotPassword}
                className="space-y-4"
                noValidate
              >
                <div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      inputMode="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setFormErrors((prev) => ({ ...prev, email: "" }));
                      }}
                      placeholder="Enter your email"
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                    />
                  </div>
                  {formErrors.email && (
                    <p className="mt-2 text-sm text-red-400">
                      {formErrors.email}
                    </p>
                  )}
                </div>
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 text-sm font-medium">{error}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="w-full text-sm text-gray-600 hover:text-gray-800"
                >
                  Back to Sign In
                </button>
              </form>
            )}
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-lg"
          />

          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-md"
          >
            <motion.div
              className="absolute -inset-1 rounded-3xl z-0"
              animate={{
                opacity: [0.3, 0.5, 0.3],
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-white/30 to-blue-500/20 rounded-3xl blur-xl" />
            </motion.div>

            <div className="relative z-10 bg-black/80 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
                  >
                    <div className="flex items-center gap-2 text-red-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  </motion.div>
                )}
                {getStepContent()}
              </div>
            </div>
          </motion.div>

          <div ref={recaptchaContainerRef} className="absolute invisible" />
        </div>
      )}
    </AnimatePresence>
  );
}
