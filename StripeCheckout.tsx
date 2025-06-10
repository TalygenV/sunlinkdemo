import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { auth } from '../../lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface StripeCheckoutProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  customerName?: string;
  customerEmail?: string;
  className?: string;
}

// Define Stripe global interface
declare global {
  interface Window {
    Stripe?: (apiKey: string) => any;
  }
}

const StripeCheckout: React.FC<StripeCheckoutProps> = ({ 
  onSuccess, 
  onCancel,
  customerName,
  customerEmail,
  className = ''
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripe, setStripe] = useState<any>(null);
  const [checkout, setCheckout] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const checkoutElementRef = useRef<HTMLDivElement>(null);
  
  // Load Stripe.js
  useEffect(() => {
    const loadStripe = async () => {
      // Use correct publishable key for your environment
      const STRIPE_PUBLISHABLE_KEY = 'pk_test_51Qykpb4bJILH7FojW2uWBl8Q5E0OetYGf78FCaT6RwIoT7r3We0ssmQabHMnsZ4FmvUBzmiRQZXA5LsVWTS5Zoxw0047XEEW0I';
      
      if (window.Stripe) {
        setStripe(window.Stripe(STRIPE_PUBLISHABLE_KEY));
      } else {
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.async = true;
        script.onload = () => {
          if (window.Stripe) {
            setStripe(window.Stripe(STRIPE_PUBLISHABLE_KEY));
          }
        };
        document.body.appendChild(script);
      }
    };
    
    loadStripe();
  }, []);
  
  // Create checkout session
  useEffect(() => {
    const createSession = async () => {
      try {
        setStatus('loading');
        
        // Get current URL for return URL
        const origin = window.location.origin;
        
        // Determine name and email - use props if provided, fallback to auth if available
        const name = customerName || auth.currentUser?.displayName || 'Solar Customer';
        const email = customerEmail || auth.currentUser?.email || '';
        
        console.log('Calling createCheckoutSession with: ', {
          name,
          email,
          origin
        });
        
        // Create checkout session via Firebase function using httpsCallable
        const functions = getFunctions();
        const testCallable = httpsCallable(functions, 'testCallable');
        testCallable().then((result: { data: any }) => console.log(result));
        const createCheckoutSessionFunc = httpsCallable(functions, 'createStripe');
        const response = await createCheckoutSessionFunc({
          name,
          email,
          origin
        });
        
        console.log('Response received:', response);
        
        // Extract client secret from response
        const secret = response.data?.clientSecret;
        
        if (secret) {
          setClientSecret(secret);
          setStatus('ready');
        } else {
          throw new Error('No client secret returned');
        }
      } catch (error) {
        console.error('Error creating checkout session:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
      }
    };
    
    if (stripe && !clientSecret && status === 'idle') {
      createSession();
    }
  }, [stripe, clientSecret, status, customerName, customerEmail]);
  
  // Initialize and mount checkout when we have both stripe and clientSecret
  useEffect(() => {
    if (!stripe || !clientSecret || !checkoutElementRef.current || status !== 'ready') return;
    
    // Ensure any existing checkout is destroyed first
    if (checkout) {
      checkout.destroy();
    }
    
    const initializeCheckout = async () => {
      try {
        // Initialize checkout
        const newCheckout = await stripe.initEmbeddedCheckout({
          clientSecret,
          // Remove onComplete callback to let the redirect URL handle completion
          // The CheckoutReturn component will handle success logic instead
        });
        
        // Mount checkout
        await newCheckout.mount(checkoutElementRef.current);
        setCheckout(newCheckout);
      } catch (error) {
        console.error('Error mounting Stripe Checkout:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Failed to initialize payment form');
      }
    };
    
    initializeCheckout();
    
    // Cleanup function
    return () => {
      if (checkout) {
        checkout.destroy();
      }
    };
  }, [stripe, clientSecret, status]);
  
  // Handle checkout cancellation
  const handleCancel = () => {
    if (checkout) {
      checkout.destroy();
      setCheckout(null);
    }
    setClientSecret(null);
    setStatus('idle');
    setErrorMessage(null);
    if (onCancel) {
      onCancel();
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (checkout) {
        checkout.destroy();
        setCheckout(null);
      }
    };
  }, [checkout]);
  
  return (
    <motion.div
      className={`relative max-w-full w-full ${className}`}
    >
      {/* Background Glow */}
      <motion.div
        className="absolute -inset-1 rounded-3xl z-0"
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.02, 1]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r rounded-3xl from-purple-400/20 via-white/30 to-blue-500/20 blur-xl" />
      </motion.div>

      {/* Content */}
      <div className={`relative z-10 bg-black/80 backdrop-blur-xl rounded-3xl border border-white/10 p-8  overflow-hidden`}>
      {status === 'loading' && (
        <div className="text-center">
          <motion.div
            className="mx-auto w-16 h-16 relative mb-6"
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <div className="absolute inset-0 rounded-full border-t-2 border-purple-400 opacity-75"></div>
            <div className="absolute inset-0 rounded-full border-l-2 border-transparent"></div>
            <div className="absolute inset-0 rounded-full border-b-2 border-blue-400 opacity-75"></div>
          </motion.div>
          <h2 className="text-xl font-semibold mb-4">Initializing secure payment...</h2>
        </div>
      )}
      
      {status === 'error' && (
        <div className="bg-red-500/10 p-6 rounded-xl border border-red-500/30 mb-6">
          <h3 className="text-red-400 font-semibold mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Error
          </h3>
          <p className="text-red-300">{errorMessage || 'There was a problem setting up the payment form.'}</p>
          <div className="mt-6 flex gap-4">
            <button 
              className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-md transition shadow-lg shadow-purple-900/20 "
              onClick={() => {
                if (checkout) {
                  checkout.destroy();
                  setCheckout(null);
                }
                setClientSecret(null);
                setStatus('idle');
              }}
            >
              Try Again
            </button>
            <button 
              className="px-5 py-2 bg-transparent border border-white/20 hover:border-white/40 text-white rounded-md transition"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {status === 'ready' && (
        <div className="space-y-5">
          {/* <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 p-4 rounded-xl border border-white/10">
          <h2 className="text-3xl text-white font-light">Complete Your $500 Deposit</h2>
            <p className="text-white text-base leading-relaxed">
              Your $500 deposit locks in your system price and secures your installation slot. This payment is fully refundable if you decide not to proceed.
            </p>
          </div> */}
          
          <div className="bg-black/40 backdrop-blur-sm p-6 rounded-xl  min-h-[400px] relative overflow-hidden">
            {/* Subtle accent lights */}
            <div className="absolute top-0 right-0 w-32 h-32 -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 translate-y-1/2 -translate-x-1/2"></div>
            
            <div 
              id="checkout-element" 
              ref={checkoutElementRef} 
              className="h-full relative z-10"
            ></div>
          </div>
          
          <div className="flex items-center gap-3 mt-4 p-3  rounded-lg ">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-yellow-300/80">
              Your payment information is securely processed by Stripe. We do not store your card details.
            </p>
          </div>
        </div>
      )}
    </div>
  </motion.div>
  );
};

export default StripeCheckout; 