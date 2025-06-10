import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth, db } from '../../lib/firebase';
import { ref, update, get } from 'firebase/database';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { motion } from 'framer-motion';
import { ShieldCheck, X, AlertCircle, Check } from 'lucide-react';
import { geocodeAddress } from '../../lib/geo';
import { resolveInstaller } from '../../lib/regionResolver';

type SessionStatus = 'loading' | 'success' | 'failed' | 'error';

const CheckoutReturn: React.FC = () => {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const [sessionDetails, setSessionDetails] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        console.error('No session_id found in URL parameters');
        setStatus('error');
        return;
      }

      console.log('Session ID received:', sessionId);

      try {
        // First verify the Stripe session status with our Cloud Function
        const functions = getFunctions();
        const verifyStripeSessionFunc = httpsCallable(functions, 'verifyStripeSession');
        
        console.log('Calling verifyStripeSession with:', { sessionId });
        const verifyResponse = await verifyStripeSessionFunc({ sessionId });
        
        console.log('Stripe session verification response:', verifyResponse.data);
        setSessionDetails(verifyResponse.data);
        
        // Check if the payment was successful
        if (!verifyResponse.data?.success || verifyResponse.data?.paymentStatus !== 'paid') {
          console.error('Payment verification failed:', verifyResponse.data);
          setStatus('failed');
          return;
        }
        
        // First check if current user is authenticated
        if (!auth.currentUser) {
          console.error('No authenticated user found');
          setStatus('error');
          return;
        }

        const userId = auth.currentUser.uid;
        console.log('Current user ID:', userId);

        // Reference to user data in Realtime Database
        const userRef = ref(db, `users/${userId}`);
        
        // Get the current user data to access system details
        const userSnapshot = await get(userRef);
        if (!userSnapshot.exists()) {
          console.error('User data not found');
          setStatus('error');
          return;
        }
        
        const userData = userSnapshot.val();
        
        // Calculate system size (similar to CustomerPortal.tsx)
        const calculateSystemSize = () => {
          if (!userData.panels) return 0;
          
          const activePanels = userData.panels.filter((panel: any) => {
            const isActive = panel.isActiveInCurrentConfig;
            const panelId = `${panel.segmentIndex}-${panel.center.latitude.toFixed(8)}-${panel.center.longitude.toFixed(8)}`;
            const isObstructed = userData.obstructedPanels?.includes(panelId);
            
            return isActive && !isObstructed;
          });
          
          const panelWattage = userData.panels[0]?.wattage || 400;
          return Number(((activePanels.length * panelWattage) / 1000).toFixed(1));
        };
        
        const systemSize = calculateSystemSize();
        const panelCount = userData.panels?.filter((panel: any) => {
          const isActive = panel.isActiveInCurrentConfig;
          const panelId = `${panel.segmentIndex}-${panel.center.latitude.toFixed(8)}-${panel.center.longitude.toFixed(8)}`;
          const isObstructed = userData.obstructedPanels?.includes(panelId);
          return isActive && !isObstructed;
        }).length || 0;
        
        // Determine the correct installer for the customer's region
        const geoParts = await geocodeAddress(userData.address || '');
        const installerUid =
          (await resolveInstaller(geoParts, db)) ?? 'AryLmMuQPQO1X67tfLIlxsO1VB52';
        if (!installerUid) {
          // This should not happen because of the fallback above, but TypeScript may still complain.
          throw new Error('Installer UID could not be resolved');
        }

        // Look up installer metadata for convenience
        let installerMeta: { email?: string; name?: string } = {};
        try {
          const installerSnap = await get(ref(db, `installers/${installerUid}`));
          if (installerSnap.exists()) {
            const data = installerSnap.val();
            installerMeta = {
              email: data.email,
              name: data.companyName || data.name
            };
          }
        } catch (err) {
          console.error('Failed to fetch installer metadata', err);
        }

        // Reference to the installer's assignedProjects
        const installerRef = ref(db, `installers/${installerUid}/assignedProjects/${userId}`);

        try {
          // Record the deposit payment in Realtime Database
          await update(userRef, {
            paymentStatus: 'deposit_paid',
            depositPaid: true,
            depositAmount: verifyResponse.data.amountTotal ? verifyResponse.data.amountTotal / 100 : 500.00, // Convert from cents
            depositPaymentDate: new Date().toISOString(),
            stripeSessionId: sessionId,
            submittedDesign: true,
            email: userData.email || auth.currentUser.email || null,
            phone: userData.phone || auth.currentUser.phoneNumber || null,
            assignedDate: new Date().toISOString(),
            installer: { uid: installerUid, email: installerMeta.email || null, name: installerMeta.name || null }
          });
          
          // Write to the installer's assignedProjects
          await update(installerRef, {
            customerName: userData.name,
            address: userData.address,
            email: userData.email || auth.currentUser.email || null,
            phone: userData.phone || auth.currentUser.phoneNumber || null,
            systemSize: systemSize,
            panelCount: panelCount,
            assignedDate: new Date().toISOString(),
            projectStatus: 'new',
            totalManualPanels: userData.totalManualPanels
          });
          
          console.log('Payment data successfully updated in database');
          
          // Dispatch a custom event for other components to respond to
          window.dispatchEvent(new CustomEvent('payment-complete'));
          
          setStatus('success');
          
          // Remove automatic redirect - user will use the button instead
        } catch (dbError: any) {
          console.error('Error updating database:', dbError);
          alert(`Database error: ${dbError.message || 'Unknown database error'}`);
          setStatus('error');
        }
      } catch (error: any) {
        console.error('Error in payment verification process:', error);
        alert(`Verification error: ${error.message || 'Unknown error'}`);
        setStatus('error');
      }
    };

    verifyPayment();
  }, [sessionId, navigate]);

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
      <motion.div 
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={modalVariants}
        className="relative max-w-md w-full"
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
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-white/30 to-blue-500/20 rounded-3xl blur-xl" />
        </motion.div>

        {/* Content */}
        <div className="relative z-10 bg-black/80 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
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
              <h2 className="text-xl font-semibold mb-4">Verifying your payment...</h2>
              <p className="text-gray-400">Please wait while we confirm your deposit.</p>
          
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="bg-gradient-to-r from-green-400/20 to-green-600/20 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6"
              >
                <Check className="h-10 w-10 text-green-400" />
              </motion.div>
              <h2 className="text-2xl font-semibold mb-4">Payment Successful!</h2>
              <p className="text-gray-400 mb-6">
                Your $500 deposit has been successfully processed. You can now access your customer portal to track your solar installation progress.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/'}
                className="btn-sheen w-full flex items-center justify-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-xl transition-all duration-300"
              >
                <span>Go to Customer Portal</span>
                <ShieldCheck className="w-5 h-5" />
              </motion.button>
            </div>
          )}

          {status === 'failed' && (
            <div className="text-center">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6"
              >
                <AlertCircle className="h-10 w-10 text-yellow-400" />
              </motion.div>
              <h2 className="text-2xl font-semibold mb-4">Payment Incomplete</h2>
              <p className="text-gray-400 mb-4">
                Your payment has not been completed. The session status is: {sessionDetails?.status || 'unknown'}.
              </p>
              <p className="text-gray-400 mb-6">
                Payment status: {sessionDetails?.paymentStatus || 'unknown'}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/design')}
                className="btn-sheen w-full flex items-center justify-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-xl transition-all duration-300"
              >
                Return to Design
              </motion.button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="bg-gradient-to-r from-red-400/20 to-red-600/20 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6"
              >
                <X className="h-10 w-10 text-red-400" />
              </motion.div>
              <h2 className="text-2xl font-semibold mb-4">Payment Verification Failed</h2>
              <p className="text-gray-400 mb-6">
                We were unable to verify your payment. Please try again or contact support.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/design')}
                className="btn-sheen w-full flex items-center justify-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-xl transition-all duration-300"
              >
                Return to Design
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CheckoutReturn; 