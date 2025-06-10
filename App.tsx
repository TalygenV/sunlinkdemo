import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar, Hero } from './components/layout';
import { GoogleOverlayTest } from './components/map';
import { InstallationSection, SavingsSection, ReviewSection, ContactSection } from './components/sections';
import { trackEvent, AnalyticsEvents } from './lib/analytics';
import { SystemDesign } from './components/design';
import { CustomerPortal } from './components/portal/CustomerPortal';
import { InstallationProgressTracker } from './components/portal/progress/InstallationProgressTracker';
import { DocumentRepository } from './components/portal/documents/DocumentRepository';
import { SystemVisualization } from './components/portal/visualization/SystemVisualization';
import { SiteSurvey } from './components/portal/sitesurvey/SiteSurvey';
import { CustomerPortalLayout } from './components/portal/layout/CustomerPortalLayout';
// Installer portal imports
import { InstallerProjectsPage } from './components/portal/installer/InstallerProjectsPage';
import { ProjectDetailsPage } from './components/portal/installer/ProjectDetailsPage';
import { InstallerProgressTracker } from './components/portal/installer/InstallerProgressTracker';
import { InstallerDocumentsPage } from './components/portal/installer/InstallerDocumentsPage';
// Installer Settings imports
import { InstallerSettingsPage } from './components/portal/installer/settings/InstallerSettingsPage';
import { AddInstallerPage } from './components/portal/installer/settings/AddInstallerPage';
import { ManageRegionsPage } from './components/portal/installer/settings/ManageRegionsPage';
import { auth, db } from './lib/firebase';
import { ref, get, onValue, set } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';

import CheckoutReturn from './components/design/CheckoutReturn';

// Define data interfaces
interface UserData {
  name: string;
  address: string;
  phoneNumber?: string;
  uid?: string;
  solarData?: any;
  monthlyBill?: number;
}

interface InstallerData {
  name: string;
  email: string;
  uid: string;
}

interface AdminData {
  name: string;
  email: string;
  uid: string;
  companyName?: string;
}

// Create context for form state and authentication state
export const FormContext = React.createContext<{
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  userData: UserData;
  setUserData: (data: UserData) => void;
}>({
  showForm: false,
  setShowForm: () => {},
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  userData: { name: '', address: '' },
  setUserData: () => {},
});

// Debug logging helper - set to true during development, false in production
const DEBUG_ROUTING = true;

function logRouting(message: string, data?: any) {
  if (DEBUG_ROUTING) {
    console.log(`[ROUTING] ${message}`, data || '');
  }
}

// --- Route Controller Component ---
/**
 * A simplified route controller that determines the correct component to display
 * based on authentication status, purchase status, and current route.
 *
 * This approach eliminates complex conditional redirects and prevents screen flashing.
 */
interface RouteControllerProps {
  isAuthenticated: boolean;
  isInstaller?: boolean;             // Added isInstaller flag for installer routes
  isAdmin?: boolean;                 // Added isAdmin flag for admin access
  hasCompletedPurchase: boolean;
  isDataLoaded: boolean;
  portalComponent?: React.ReactNode;  // Component to show for portal routes
  designComponent?: React.ReactNode;  // Component to show for design routes
  homeComponent?: React.ReactNode;    // Component to show for home route
  loadingComponent?: React.ReactNode; // Component to show while loading
}

const RouteController: React.FC<RouteControllerProps> = ({
  isAuthenticated,
  isInstaller = false,               // Default to false if not provided
  isAdmin = false,                   // Default to false if not provided
  hasCompletedPurchase,
  isDataLoaded,
  portalComponent,
  designComponent,
  homeComponent,
  loadingComponent
}) => {
  const location = useLocation();
  
  
  // Debug logging
  useEffect(() => {
    logRouting(`Route: ${location.pathname}, isAuthenticated=${isAuthenticated}, hasCompletedPurchase=${hasCompletedPurchase}, isDataLoaded=${isDataLoaded}`);
  }, [location.pathname, isAuthenticated, hasCompletedPurchase, isDataLoaded]);

  // If data isn't loaded yet, show loading component
  if (!isDataLoaded) {
    return loadingComponent ? <>{loadingComponent}</> : <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-24 h-24 bg-orange-500/20 rounded-full mb-4"></div>
        <div className="h-4 w-48 bg-orange-500/20 rounded mb-3"></div>
        <div className="h-3 w-36 bg-orange-500/10 rounded"></div>
      </div>
    </div>;
  }

  // Not authenticated? Show home component or redirect to home
  if (!isAuthenticated) {
    return homeComponent ? <>{homeComponent}</> : <Navigate to="/" replace />;
  }
  
  // Get the current location
  const pathname = location.pathname;
  
  // Handle installer-specific routes
  if (pathname.startsWith('/installer')) {
    if (isInstaller || isAdmin) {
      // Allow installer or admin to access installer routes
      logRouting(isAdmin ? "Admin accessing installer component" : "Showing installer component");
      return <>{portalComponent}</>;
    } else {
      // Regular user trying to access installer routes
      logRouting("Non-installer/admin trying to access installer routes");
      return <Navigate to="/" replace />;
    }
  }
  
  // Handle customer portal routes
  if (pathname.startsWith('/portal')) {
    // Installer or admin trying to access customer portal
    if (isInstaller || isAdmin) {
      logRouting(isAdmin ? "Admin redirected to installer portal" : "Installer trying to access customer portal");
      return <Navigate to="/installer/projects" replace />;
    }
    
    // Regular authenticated user with completed purchase trying to access portal
    if (portalComponent && hasCompletedPurchase) {
      logRouting("Showing portal component");
      return <>{portalComponent}</>;
    }
    
    // Regular authenticated user without completed purchase trying to access portal
    logRouting("User without completed purchase trying to access portal");
    return <Navigate to="/design" replace />;
  }
  
  // Handle design routes
  if (pathname.startsWith('/design')) {
    // Installer or admin trying to access design
    if (isInstaller || isAdmin) {
      logRouting(isAdmin ? "Admin redirected to installer portal" : "Installer trying to access design");
      return <Navigate to="/installer/projects" replace />;
    }
    
    // Authenticated without completed purchase trying to access design
    if (designComponent && !hasCompletedPurchase) {
      logRouting("Showing design component");
      return <>{designComponent}</>;
    }
    
    // Authenticated with completed purchase trying to access design
    logRouting("User with completed purchase trying to access design");
    return <Navigate to="/portal" replace />;
  }
  
  // Default redirect based on user type and purchase status
  if (isInstaller || isAdmin) {
    return <Navigate to="/installer/projects" replace />;
  }
  
  return hasCompletedPurchase ?
    <Navigate to="/portal" replace /> :
    <Navigate to="/design" replace />;
};

// Helper function to consistently determine purchase status
const determineHasCompletedPurchase = (userData: any): boolean => {
  // Check both the new condition (submittedDesign && depositPaid) and the legacy condition (purchaseCompleted)
  // This ensures compatibility with both App.tsx routing and SignInModal.tsx routing
  if (!userData) return false;
  
  // Check for explicit purchaseCompleted flag (used in SignInModal.tsx)
  if (userData.purchaseCompleted === true) {
    logRouting("Purchase completion determined by purchaseCompleted flag");
    return true;
  }
  
  // Check for design submission and deposit payment (used in App.tsx)
  if (userData.submittedDesign && userData.depositPaid) {
    logRouting("Purchase completion determined by submittedDesign && depositPaid");
    return true;
  }
  
  return false;
};

function App() {
  const [showForm, setShowForm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInstaller, setIsInstaller] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState<UserData>({ name: '', address: '' });
  const [installerData, setInstallerData] = useState<InstallerData | null>(null);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [hasCompletedPurchase, setHasCompletedPurchase] = useState(false);
  const [checkingAuthStatus, setCheckingAuthStatus] = useState(true);
  // New state to track when initial data loading is complete
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  
  /**
   * Authentication and user data management effect
   *
   * This effect handles:
   * 1. Initial authentication check
   * 2. Setting up Firebase listeners for user data
   * 3. Determining purchase completion status
   * 4. Ensuring data is fully loaded before rendering protected routes
   */
  useEffect(() => {
    let userDataListener: any = null;
    
    // Function to set up the real-time listener for a user
    const setupUserDataListener = (userId: string) => {
  
      
      // Make an immediate check of the database state
      const checkPurchaseStatus = async () => {
        try {
          const userSnapshot = await get(ref(db, `users/${userId}`));
          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            // Use helper function to consistently determine purchase status
            const hasPurchased = determineHasCompletedPurchase(userData);
            logRouting(`Initial purchase status check: ${hasPurchased}`);
            setHasCompletedPurchase(hasPurchased);
          }
        } catch (error) {
          console.error("Error checking immediate purchase status:", error);
        }
      };
      
      // Run the immediate check
      checkPurchaseStatus();
      
      // Set up a new listener
     
    };
    
    const checkAuthStatus = async () => {
      try {
        setCheckingAuthStatus(true);
        
        // Check if user is authenticated
        const user = auth.currentUser;
        if (user) {
          setIsAuthenticated(true);
          
          // Check if user is an admin by looking for admin data
          const adminRef = ref(db, `admins/${user.uid}`);
          const adminSnapshot = await get(adminRef);
          
          if (adminSnapshot.exists()) {
            // User is an admin
            const adminData = adminSnapshot.val();
            setIsAdmin(true);
            setIsInstaller(false);
            
            setAdminData({
              name: adminData.name || '',
              email: adminData.email || user.email || '',
              uid: user.uid,
              companyName: adminData.companyName
            });
            
            logRouting(`Auth check: User is an admin`);
            
            // Admins don't need purchase status
            setHasCompletedPurchase(false);
            
            // Still need a few basic user details
            setUserData({
              name: adminData.name || '',
              address: '',
              uid: user.uid
            });
            
            // No need to set up user data listener for admins
          }
          // If not admin, check if user is an installer
          else {
            const installerRef = ref(db, `installers/${user.uid}`);
            const installerSnapshot = await get(installerRef);
            
            if (installerSnapshot.exists()) {
              // User is an installer
              const installerData = installerSnapshot.val();
              setIsInstaller(true);
              setIsAdmin(false);
              
              setInstallerData({
                name: installerData.name || '',
                email: installerData.email || user.email || '',
                uid: user.uid
              });
              
              logRouting(`Auth check: User is an installer`);
              
              // Installers don't need purchase status
              setHasCompletedPurchase(false);
              
              // Still need a few basic user details
              setUserData({
                name: installerData.name || '',
                address: '',
                uid: user.uid
              });
              
              // No need to set up user data listener for installers
            } else {
              // Regular user flow
              // Fetch user data from Firebase
              const userRef = ref(db, `users/${user.uid}`);
              const snapshot = await get(userRef);
              
              if (snapshot.exists()) {
                const data = snapshot.val();
                
                // Update user data
                setUserData({
                  name: data.name || '',
                  address: data.address || '',
                  phoneNumber: data.phoneNumber,
                  uid: user.uid,
                  solarData: data.solarData,
                  monthlyBill: data.monthlyBill
                });
                
                // Use helper function to consistently determine purchase status
                const hasPurchased = determineHasCompletedPurchase(data);
                logRouting(`Auth check purchase status: ${hasPurchased}`);
                setHasCompletedPurchase(hasPurchased);
                
                // Set up a real-time listener for this user
                setupUserDataListener(user.uid);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setCheckingAuthStatus(false);
        
        // Delay setting initialDataLoaded to ensure state has settled
        setTimeout(() => {
          logRouting('Initial data loading complete');
          setInitialDataLoaded(true);
        }, 500);
      }
    };
    
    // Run auth check on mount
    checkAuthStatus();
    
    // Set up an auth state listener to detect sign-in/sign-out events
    const unsubscribe = onAuthStateChanged(auth, async (user: any) => {
      
      if (user) {
        // Check if auth is in progress
        const authInProgress = localStorage.getItem('authInProgress') === 'true';
        
        // If auth is in progress, don't fully authenticate yet - wait for profile completion
        if (authInProgress) {
          logRouting("Auth in progress - waiting for profile completion");
          // We've detected auth but won't update the state until profile completion
          return;
        }
        
        setIsAuthenticated(true);
        
        // Check if user is an admin
        const adminRef = ref(db, `admins/${user.uid}`);
        try {
          const adminSnapshot = await get(adminRef);
          
          if (adminSnapshot.exists()) {
            // User is an admin
            const adminData = adminSnapshot.val();
            setIsAdmin(true);
            setIsInstaller(false);
            
            setAdminData({
              name: adminData.name || '',
              email: adminData.email || user.email || '',
              uid: user.uid,
              companyName: adminData.companyName
            });
            
            // Admins don't need purchase status checks
            setHasCompletedPurchase(false);
            
            // Basic user data for context
            setUserData({
              name: adminData.name || '',
              address: '',
              uid: user.uid
            });
            
            // Admins are always considered fully authenticated
            return;
          }
          
          // If not admin, check if user is an installer
          const installerRef = ref(db, `installers/${user.uid}`);
          const installerSnapshot = await get(installerRef);
          
          if (installerSnapshot.exists()) {
            // User is an installer
            const installerData = installerSnapshot.val();
            setIsInstaller(true);
            setIsAdmin(false);
            
            setInstallerData({
              name: installerData.name || '',
              email: installerData.email || user.email || '',
              uid: user.uid
            });
            
            // Installers don't need purchase status checks
            setHasCompletedPurchase(false);
            
            // Basic user data for context
            setUserData({
              name: installerData.name || '',
              address: '',
              uid: user.uid
            });
            
            // Installers are always considered fully authenticated
            return;
          }
          
          // Continue with regular user flow if not an installer
          const userRef = ref(db, `users/${user.uid}`);
          const snapshot = await get(userRef);
          
          if (snapshot.exists()) {
            const data = snapshot.val();
            
            // Check if profile is complete
            if (!data.profileComplete) {
              logRouting("User authenticated but profile not complete");
              // Don't fully authenticate until profile is complete
              setIsAuthenticated(false);
              return;
            }
            
            // Update user data
            setUserData({
              name: data.name || '',
              address: data.address || '',
              phoneNumber: data.phoneNumber,
              uid: user.uid,
              solarData: data.solarData,
              monthlyBill: data.monthlyBill
            });
            
            // Use helper function to consistently determine purchase status
            const hasPurchased = determineHasCompletedPurchase(data);
            logRouting(`Auth state change purchase status: ${hasPurchased}`);
            setHasCompletedPurchase(hasPurchased);
            
            // Set up real-time listener for this user
            setupUserDataListener(user.uid);
          } else {
            // No user data exists yet - this likely means profile setup isn't complete
            logRouting("User authenticated but no profile data exists");
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error("Error fetching user data after auth state change:", error);
        }
      } else {
        // Clean up listener when user signs out
        if (userDataListener) {
          userDataListener();
          userDataListener = null;
        }
        
        setIsAuthenticated(false);
        setIsInstaller(false);
        setIsAdmin(false);
        setInstallerData(null);
        setAdminData(null);
        setHasCompletedPurchase(false);
        setUserData({ name: '', address: '' });
        
        // Clear any auth flags
        localStorage.removeItem('authInProgress');
      }
      
      setCheckingAuthStatus(false);
      
      // Ensure initialDataLoaded is set to true after auth state changes
      setTimeout(() => {
        setInitialDataLoaded(true);
      }, 300);
    });
    
    // Clean up all listeners on unmount
    return () => {
      unsubscribe();
      if (userDataListener) {
        userDataListener();
      }
    };
  }, []);

  // Track page view on initial load
  useEffect(() => {
    trackEvent(AnalyticsEvents.PAGE_VIEW, {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname
    });
  }, []);
  
  // Loading component for consistent loading state display
  const LoadingComponent = () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
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
    </div>
  );

  // If still checking auth status or data isn't fully loaded, show loading state
  if (checkingAuthStatus || !initialDataLoaded) {
    return <LoadingComponent />;
  }

  return (
    <FormContext.Provider value={{
      showForm,
      setShowForm,
      isAuthenticated,
      setIsAuthenticated,
      userData,
      setUserData
    }}>
      <Router>
        <div className="min-h-screen">
          <Routes>
            {/* Installer Portal Routes */}
            {(isInstaller || isAdmin) && (
              <>
                <Route
                  path="/installer"
                  element={
                    <RouteController
                      isAuthenticated={isAuthenticated}
                      isInstaller={isInstaller}
                      isAdmin={isAdmin}
                      hasCompletedPurchase={true} // Always true for installers/admins to bypass purchase check
                      isDataLoaded={initialDataLoaded}
                      portalComponent={<Navigate to="/installer/projects" replace />}
                      loadingComponent={<LoadingComponent />}
                    />
                  }
                />
                
                <Route
                  path="/installer/projects"
                  element={
                    <RouteController
                      isAuthenticated={isAuthenticated}
                      isInstaller={isInstaller}
                      isAdmin={isAdmin}
                      hasCompletedPurchase={true} // Always true for installers/admins to bypass purchase check
                      isDataLoaded={initialDataLoaded}
                      portalComponent={<InstallerProjectsPage isAdmin={isAdmin} />}
                      loadingComponent={<LoadingComponent />}
                    />
                  }
                />
                
                <Route
                  path="/installer/project/:projectId"
                  element={
                    <RouteController
                      isAuthenticated={isAuthenticated}
                      isInstaller={isInstaller}
                      isAdmin={isAdmin}
                      hasCompletedPurchase={true} // Always true for installers/admins to bypass purchase check
                      isDataLoaded={initialDataLoaded}
                      portalComponent={<ProjectDetailsPage isAdmin={isAdmin} />}
                      loadingComponent={<LoadingComponent />}
                    />
                  }
                />
                
                <Route
                  path="/installer/project/:projectId/progress"
                  element={
                    <RouteController
                      isAuthenticated={isAuthenticated}
                      isInstaller={isInstaller}
                      isAdmin={isAdmin}
                      hasCompletedPurchase={true} // Always true for installers/admins to bypass purchase check
                      isDataLoaded={initialDataLoaded}
                      portalComponent={<InstallerProgressTracker isAdmin={isAdmin} />}
                      loadingComponent={<LoadingComponent />}
                    />
                  }
                />
                
                <Route
                  path="/installer/project/:projectId/documents"
                  element={
                    <RouteController
                      isAuthenticated={isAuthenticated}
                      isInstaller={isInstaller}
                      isAdmin={isAdmin}
                      hasCompletedPurchase={true} // Always true for installers/admins to bypass purchase check
                      isDataLoaded={initialDataLoaded}
                      portalComponent={<InstallerDocumentsPage isAdmin={isAdmin} />}
                      loadingComponent={<LoadingComponent />}
                    />
                  }
                />
                
                {/* Installer Settings Routes */}
                <Route
                  path="/installer/settings"
                  element={
                    <RouteController
                      isAuthenticated={isAuthenticated}
                      isInstaller={isInstaller}
                      isAdmin={isAdmin}
                      hasCompletedPurchase={true} // Always true for installers/admins to bypass purchase check
                      isDataLoaded={initialDataLoaded}
                      portalComponent={<InstallerSettingsPage isAdmin={isAdmin} />}
                      loadingComponent={<LoadingComponent />}
                    />
                  }
                />
                
                <Route
                  path="/installer/settings/add-installer"
                  element={
                    <RouteController
                      isAuthenticated={isAuthenticated}
                      isInstaller={isInstaller}
                      isAdmin={isAdmin}
                      hasCompletedPurchase={true} // Always true for installers/admins to bypass purchase check
                      isDataLoaded={initialDataLoaded}
                      portalComponent={<AddInstallerPage isAdmin={isAdmin} />}
                      loadingComponent={<LoadingComponent />}
                    />
                  }
                />
                
                <Route
                  path="/installer/settings/manage-installers"
                  element={
                    <RouteController
                      isAuthenticated={isAuthenticated}
                      isInstaller={isInstaller}
                      isAdmin={isAdmin}
                      hasCompletedPurchase={true} // Always true for installers/admins to bypass purchase check
                      isDataLoaded={initialDataLoaded}
                      portalComponent={<ManageRegionsPage isAdmin={isAdmin} />}
                      loadingComponent={<LoadingComponent />}
                    />
                  }
                />
              </>
            )}
            
            {/* Customer Portal Routes */}
            <Route
              path="/portal"
              element={
                <RouteController
                  isAuthenticated={isAuthenticated}
                  isInstaller={isInstaller}
                  isAdmin={isAdmin}
                  hasCompletedPurchase={hasCompletedPurchase}
                  isDataLoaded={initialDataLoaded}
                  portalComponent={<CustomerPortal />}
                  loadingComponent={<LoadingComponent />}
                />
              }
            />
            
            <Route
              path="/portal/progress"
              element={
                <RouteController
                  isAuthenticated={isAuthenticated}
                  isInstaller={isInstaller}
                  isAdmin={isAdmin}
                  hasCompletedPurchase={hasCompletedPurchase}
                  isDataLoaded={initialDataLoaded}
                  portalComponent={
                    <CustomerPortalLayout>
                      <InstallationProgressTracker className="max-w-5xl mx-auto" />
                    </CustomerPortalLayout>
                  }
                  loadingComponent={<LoadingComponent />}
                />
              }
            />
            
            <Route
              path="/portal/documents"
              element={
                <RouteController
                  isAuthenticated={isAuthenticated}
                  isInstaller={isInstaller}
                  isAdmin={isAdmin}
                  hasCompletedPurchase={hasCompletedPurchase}
                  isDataLoaded={initialDataLoaded}
                  portalComponent={
                    <CustomerPortalLayout>
                      <DocumentRepository className="max-w-5xl mx-auto" />
                    </CustomerPortalLayout>
                  }
                  loadingComponent={<LoadingComponent />}
                />
              }
            />
            
            <Route
              path="/portal/system"
              element={
                <RouteController
                  isAuthenticated={isAuthenticated}
                  isInstaller={isInstaller}
                  isAdmin={isAdmin}
                  hasCompletedPurchase={hasCompletedPurchase}
                  isDataLoaded={initialDataLoaded}
                  portalComponent={
                    <CustomerPortalLayout>
                      <SystemVisualization className="max-w-5xl mx-auto" />
                    </CustomerPortalLayout>
                  }
                  loadingComponent={<LoadingComponent />}
                />
              }
            />
            
            <Route
              path="/portal/sitesurvey"
              element={
                <RouteController
                  isAuthenticated={isAuthenticated}
                  isInstaller={isInstaller}
                  isAdmin={isAdmin}
                  hasCompletedPurchase={hasCompletedPurchase}
                  isDataLoaded={initialDataLoaded}
                  portalComponent={
                    <CustomerPortalLayout>
                      <SiteSurvey />
                    </CustomerPortalLayout>
                  }
                  loadingComponent={<LoadingComponent />}
                />
              }
            />
            
            {/* Google Overlay Test Route */}
            <Route path="/google-overlay-test" element={<GoogleOverlayTest />} />
            
            {/* Design System Route */}
            <Route
              path="/design"
              element={
                <RouteController
                  isAuthenticated={isAuthenticated}
                  isInstaller={isInstaller}
                  isAdmin={isAdmin}
                  hasCompletedPurchase={hasCompletedPurchase}
                  isDataLoaded={initialDataLoaded}
                  designComponent={<SystemDesign userData={userData} />}
                  loadingComponent={<LoadingComponent />}
                />
              }
            />
            
            {/* Design Return Route */}
            <Route path="/design-return" element={<CheckoutReturn />} />
            
            {/* Home Route (exact root match) */}
            <Route
              index
              element={
                <RouteController
                  isAuthenticated={isAuthenticated}
                  isInstaller={isInstaller}
                  isAdmin={isAdmin}
                  hasCompletedPurchase={hasCompletedPurchase}
                  isDataLoaded={initialDataLoaded}
                  homeComponent={
                    <>
                      <Navbar />
                      <Hero />
                  
                      <AnimatePresence>
                        {!showForm && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <InstallationSection />
                            <SavingsSection />
                            <ReviewSection />
                            <ContactSection />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  }
                  loadingComponent={<LoadingComponent />}
                />
              }
            />
          </Routes>
        </div>
      </Router>
    </FormContext.Provider>
  );
}

export default App;
