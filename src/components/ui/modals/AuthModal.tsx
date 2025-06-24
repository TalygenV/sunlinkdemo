import {
  createUserWithEmailAndPassword,
  getAuth,
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  updateProfile,
} from "firebase/auth";
import { ref, set } from "firebase/database";
import { doc, setDoc } from "firebase/firestore";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  Lock,
  Mail,
  Phone,
  Search,
  Shield,
  User,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { app, db, firestore } from "../../../lib/firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userData?: {
    name: string;
    address: string;
    phoneNumber?: string;
    uid?: string;
    solarData?: any;
    monthlyBill?: number;
    annualUsage?: number;
    isAutoPanelsSupported?: boolean;
  }) => void;
  initialAddress?: string;
  solarData?: any;
  monthlyBill?: number;
  annualUsage?: number;
  isAutoPanelsSupported?: boolean;
}

const auth = getAuth(app);

type Step = "phone" | "verify" | "complete" | "email" | "welcome";

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialAddress,
  solarData,
  monthlyBill,
  annualUsage,
  isAutoPanelsSupported,
}: AuthModalProps) {
  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [name, setName] = useState("");
  const [address, setAddress] = useState(initialAddress || "");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const addressInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (addressInputRef.current && window.google && step === "complete") {
      const autocomplete = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          componentRestrictions: { country: "us" },
          fields: ["address_components", "formatted_address", "geometry"],
          types: ["address"],
        }
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          setAddress(place.formatted_address);
        }
      });
    }
  }, [step]);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {},
        }
      );
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      setupRecaptcha();
      const formattedNumber = `+1${phoneNumber.replace(/\D/g, "")}`;
      const confirmation = await signInWithPhoneNumber(
        auth,
        formattedNumber,
        window.recaptchaVerifier
      );
      setConfirmationResult(confirmation);
      setStep("verify");
    } catch (err: any) {
      console.log("Firebase Error:", err); // Debug log

      // Convert Firebase error messages to user-friendly messages
      let userFriendlyError =
        "An error occurred during sign in. Please try again.";

      // Handle FirebaseError
      if (err.code) {
        switch (err.code) {
          case "auth/invalid-email":
            userFriendlyError = "Please enter a valid phone number.";
            break;
          case "auth/user-disabled":
            userFriendlyError =
              "This account has been disabled. Please contact support.";
            break;
          case "auth/user-not-found":
            userFriendlyError =
              "No account found with this phone number. Please sign up first.";
            break;
          case "auth/wrong-password":
            userFriendlyError =
              "Incorrect verification code. Please try again.";
            break;
          case "auth/quota-exceeded":
            userFriendlyError =
              "Too many verification attempts. Please try again later.";
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

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Set a flag in localStorage to indicate authentication is in progress
      localStorage.setItem("authInProgress", "true");

      const result = await confirmationResult.confirm(verificationCode);
      setStep("complete");
    } catch (err: any) {
      console.log("Firebase Error:", err); // Debug log

      // Convert Firebase error messages to user-friendly messages
      let userFriendlyError =
        "An error occurred during sign in. Please try again.";

      // Handle FirebaseError
      if (err.code) {
        switch (err.code) {
          case "auth/invalid-email":
            userFriendlyError = "Please enter a valid verification code.";
            break;
          case "auth/user-disabled":
            userFriendlyError =
              "This account has been disabled. Please contact support.";
            break;
          case "auth/user-not-found":
            userFriendlyError =
              "No account found with this verification code. Please sign up first.";
            break;
          case "auth/wrong-password":
            userFriendlyError =
              "Incorrect verification code. Please try again.";
            break;
          case "auth/quota-exceeded":
            userFriendlyError =
              "Too many verification attempts. Please try again later.";
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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Set a flag in localStorage to indicate authentication is in progress
      localStorage.setItem("authInProgress", "true");

      let userCredential;
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        // Store user metadata in Realtime Database (safe)
        try {
          await setDoc(doc(firestore, "users", user.uid), {
            email: user.email,
            createdAt: new Date(),
          });
          // window.emailGlobal = user.email; // Store email globally for later use
          console.log("emailGlobal", user.email);
          localStorage.setItem("emailGlobal", user.email);
          // alert("User successfully added");
        } catch (error) {
          alert("error");
          console.log(error);
        }
      } else {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
      }

      if (isSignUp) {
        setStep("complete");
      } else {
        // For existing users, check if they have profile data
        const userRef = ref(db, `users/${userCredential.user.uid}`);
        // If they don't have profile data, send them to complete profile
        // Otherwise, consider them successfully authenticated
        setStep("complete");
      }
    } catch (err: any) {
      console.log("Firebase Error:", err); // Debug log

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
          case "auth/invalid-verification-code":
            userFriendlyError = "Invalid verification code. Please try again.";
            break;
          case "auth/code-expired":
            userFriendlyError =
              "Verification code has expired. Please request a new one.";
            break;
          case "auth/quota-exceeded":
            userFriendlyError =
              "Too many verification attempts. Please try again later.";
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

  const handleCompleteProfile = async (e: React.FormEvent) => {
    debugger;
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!auth.currentUser) throw new Error("No authenticated user found");

      // Update the user's display name in Firebase Auth
      await updateProfile(auth.currentUser, {
        displayName: name,
      });
      //window.nameGlobal = name; // Store name globally for later use
      console.log("nameGlobal", name);
      localStorage.setItem("nameGlobal", name);
      // Save user data to Realtime Database
      await set(ref(db, `users/${auth.currentUser.uid}`), {
        name,
        phoneNumber: auth.currentUser.phoneNumber,
        address,
        solarData: solarData || null,
        monthlyBill: monthlyBill || 0,
        annualUsage: annualUsage || 12000, // Default to 12000 if not provided
        isAutoPanelsSupported: isAutoPanelsSupported, // Save isAutoPanelsSupported flag
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Add a flag to indicate profile is complete
        profileComplete: true,
      });

      // Change to welcome step instead of calling onSuccess immediately
      setStep("welcome");
    } catch (err: any) {
      console.log("Firebase Error:", err); // Debug log

      // Convert Firebase error messages to user-friendly messages
      let userFriendlyError =
        "An error occurred during sign in. Please try again.";

      // Handle FirebaseError
      if (err.code) {
        switch (err.code) {
          case "auth/invalid-email":
            userFriendlyError = "Please enter a valid installation address.";
            break;
          case "auth/user-disabled":
            userFriendlyError =
              "This account has been disabled. Please contact support.";
            break;
          case "auth/user-not-found":
            userFriendlyError =
              "No account found with this installation address. Please sign up first.";
            break;
          case "auth/quota-exceeded":
            userFriendlyError =
              "Too many verification attempts. Please try again later.";
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
              <div className="relative">
                <div className="absolute inset-0 text-white blur-sm opacity-70">
                  <Phone className="w-12 h-12" />
                </div>
                <Phone className="w-12 h-12 text-white relative z-10" />
              </div>
            </div>
            <h2 className="text-2xl font-light text-white mb-2">
              Sign Up to Continue
            </h2>
            <p className="text-gray-400 text-sm">
              Enter your phone number to get started
            </p>
            <form onSubmit={handleSendCode} className="mt-8 space-y-6">
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
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="(555) 555-5555"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                    required
                  />
                </div>
              </div>
              <div className="mt-8  border-t border-white/10"></div>
              <div className="relative">
                <motion.div
                  className="absolute -inset-1 rounded-full z-0"
                  animate={{
                    opacity: [0.4, 0.6, 0.4],
                    scale: [1, 1.03, 1],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0, 0.5, 1],
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-white/30 to-blue-500/20 rounded-full blur-[20px]" />
                </motion.div>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-sheen relative z-10 w-full h-[52px] flex items-center justify-center gap-3 px-8 text-white rounded-full shadow-xl transition-all duration-500 border border-white/10 text-sm font-medium tracking-wider group"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Send Code
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </>
        );

      case "email":
        return (
          <>
            <div className="flex justify-center mb-4">
              <Mail className="w-12 h-12 text-accent-400 animate-pulse-slow icon-glow-white" />
            </div>
            <h2 className="text-2xl font-light text-white mb-2">
              {isSignUp ? "Create Your Account" : "Welcome Back"}
            </h2>
            <p className="text-gray-400 text-sm">
              {isSignUp ? "Sign up with your email" : "Sign in with your email"}
            </p>
            <form onSubmit={handleEmailAuth} className="mt-8 space-y-6">
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
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                    required
                  />
                </div>
              </div>
              <div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                    required
                  />
                </div>
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
                    {isSignUp ? "Continue" : "Sign In"}
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

      case "verify":
        return (
          <>
            <div className="flex justify-center mb-4">
              <Shield className="w-12 h-12 text-accent-400" />
            </div>
            <h2 className="text-2xl font-light text-white mb-2">
              Verify Your Number
            </h2>
            <p className="text-gray-400 text-sm">
              Enter the verification code sent to your phone
            </p>
            <form onSubmit={handleVerifyCode} className="mt-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Verification Code
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-400/20"
                    required
                  />
                </div>
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
                    Verify Code
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>
          </>
        );

      case "complete":
        return (
          <>
            <div className="flex justify-center mb-4">
              <User className="w-12 h-12 text-purple-400" />
            </div>
            <h2 className="text-2xl font-light text-white mb-2">
              Finish Setting Up Your Account
            </h2>
            <p className="text-gray-400 text-sm">
              Just a few more details to get started
            </p>
            <form onSubmit={handleCompleteProfile} className="mt-8 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Installation Address
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    ref={addressInputRef}
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your address"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Note: This will be your installation address and can only be
                  changed by contacting support
                </p>
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
                    Complete Setup
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>
          </>
        );

      case "welcome":
        return (
          <>
            <div className="flex justify-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-400" />
            </div>
            <h2 className="text-3xl font-light text-white mb-4">
              Welcome, {name}!
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Your account has been successfully created.
            </p>
            <motion.button
              onClick={() => {
                // Remove the auth in progress flag when profile setup is complete
                localStorage.removeItem("authInProgress");

                console.log(
                  "DEBUG: solarData in AuthModal before passing to onSuccess:",
                  solarData
                );
                const userData = {
                  name,
                  address,
                  phoneNumber: auth.currentUser?.phoneNumber || undefined,
                  uid: auth.currentUser?.uid,
                  solarData: solarData,
                  monthlyBill: monthlyBill,
                  annualUsage: annualUsage,
                  isAutoPanelsSupported: isAutoPanelsSupported,
                };
                console.log("DEBUG: userData passed to onSuccess:", userData);
                onSuccess(userData);
                onClose();
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-sheen relative z-10 w-full h-[52px] flex items-center justify-center gap-3 px-8 text-white rounded-full shadow-xl transition-all duration-500  text-sm font-medium tracking-wider group"
            >
              Let's Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </motion.button>
          </>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-lg"
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-md"
          >
            {/* Background Glow */}
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

            {/* Content */}

            <div className="relative z-10 bg-black/80 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
              {/* Close Button */}

              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="text-center">
                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                {getStepContent()}
              </div>

              {/* Features */}
            </div>
          </motion.div>

          {/* Recaptcha Container */}
          <div id="recaptcha-container" />
        </div>
      )}
    </AnimatePresence>
  );
}
