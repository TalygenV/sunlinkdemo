import React, {
  useState,
  useEffect,
  createContext,
  Dispatch,
  SetStateAction,
} from "react";
import {
  Routes,
  BrowserRouter as Router,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { AnimatePresence, motion } from "framer-motion";
import { ManageInstallersPage } from "./components/portal/installer/settings/ManageInstallersPage";
import { InstallerProjectsPage } from "./components/portal/installer/InstallerProjectsPage";
import CheckoutReturn from "./components/design/CheckoutReturn";
import { SystemDesign } from "./components/design";
import { Hero, Navbar } from "./components/layout";
import {
  ContactSection,
  InstallationSection,
  ReviewSection,
  SavingsSection,
} from "./components/sections";
import { ProjectDetailsPage } from "./components/portal/installer/ProjectDetailsPage";
import { InstallerProgressTracker } from "./components/portal/installer/InstallerProgressTracker";
import { InstallerDocumentsPage } from "./components/portal/installer/InstallerDocumentsPage";
import { InstallerSettingsPage } from "./components/portal/installer/settings/InstallerSettingsPage";
import { AddInstallerPage } from "./components/portal/installer/settings/AddInstallerPage";
import { AnalyticsEvents, trackEvent } from "./lib/analytics";
import OrderSummary from "./components/OrderSummary/OrderSummary";
import InstallerContract from "./components/InstallerContract/InstallerContract";
import { onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db, firestore } from "./lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { CustomerPortal } from "./components/portal/CustomerPortal";
import {
  CustomerPortalLayout,
  DocumentRepository,
  InstallationProgressTracker,
  SystemVisualization,
} from "./components/portal";
import { SiteSurvey } from "./components/portal/sitesurvey/SiteSurvey";
import { GoogleOverlayTest } from "./components/map";

interface UserData {
  name: string;
  address: string;
  phoneNumber?: string;
  uid?: string;
  solarData?: any;
  monthlyBill?: number;
  submittedDesign?: boolean;
  depositPaid?: boolean;
  purchaseCompleted?: boolean;
}

interface FormContextType {
  showForm: boolean;
  setShowForm: Dispatch<SetStateAction<boolean>>;
  isAuthenticated: boolean;
  setIsAuthenticated: Dispatch<SetStateAction<boolean>>;
  userData: UserData;
  setUserData: Dispatch<SetStateAction<UserData>>;
}

export const FormContext = createContext<FormContextType>({
  showForm: false,
  setShowForm: () => {},
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  userData: { name: "", address: "" },
  setUserData: () => {},
});

const DEBUG_ROUTING = true;
function logRouting(message: string, data?: any) {
  if (DEBUG_ROUTING) {
    console.log(`[ROUTING] ${message}`, data || "");
  }
}

const determineHasCompletedPurchase = (userData: UserData): boolean => {
  if (!userData) return false;
  if (userData.purchaseCompleted === true) {
    logRouting("✅ Purchase completed via flag");
    return true;
  }
  if (userData.submittedDesign && userData.depositPaid) {
    logRouting("✅ Purchase inferred from design + deposit");
    return true;
  }
  return false;
};

const LoadingComponent = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <motion.div
      className="w-16 h-16 relative"
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    >
      <div className="absolute inset-0 rounded-full border-t-2 border-purple-400 opacity-75"></div>
      <div className="absolute inset-0 rounded-full border-l-2 border-transparent"></div>
      <div className="absolute inset-0 rounded-full border-b-2 border-blue-400 opacity-75"></div>
    </motion.div>
  </div>
);

const RouteController = ({
  isAuthenticated,
  isInstaller = false,
  isAdmin = false,
  hasCompletedPurchase,
  isDataLoaded,
  portalComponent,
  designComponent,
  homeComponent,
  loadingComponent,
}: {
  isAuthenticated: boolean;
  isInstaller?: boolean;
  isAdmin?: boolean;
  hasCompletedPurchase: boolean;
  isDataLoaded: boolean;
  portalComponent?: React.ReactNode;
  designComponent?: React.ReactNode;
  homeComponent?: React.ReactNode;
  loadingComponent?: React.ReactNode;
}) => {
  const location = useLocation();
  if (!isDataLoaded) return <>{loadingComponent}</>;
  const pathname = location.pathname;

  if (!isAuthenticated) {
    return homeComponent ? <>{homeComponent}</> : <Navigate to="/" replace />;
  }
  if (pathname.startsWith("/installer")) {
    if (isInstaller || isAdmin) return <>{portalComponent}</>;
    return <Navigate to="/" replace />;
  }
  if (pathname.startsWith("/portal")) {
    if (isInstaller || isAdmin)
      return <Navigate to="/installer/projects" replace />;
    if (portalComponent && hasCompletedPurchase) return <>{portalComponent}</>;
    return <Navigate to="/design" replace />;
  }
  if (pathname.startsWith("/design")) {
    return !hasCompletedPurchase ? (
      <>{designComponent}</>
    ) : (
      <Navigate to="/portal" replace />
    );
  }
  return <>{homeComponent}</>;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInstaller, setIsInstaller] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    name: "",
    address: "",
    phoneNumber: "",
    uid: "",
    solarData: {},
    monthlyBill: 0,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: any) => {
      if (user) {
        setIsAuthenticated(true);
        const uid = user.uid;
        const userDoc = await getDoc(doc(firestore, "users", uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const role = userData?.role || "customer";
        setIsAdmin(role.toLowerCase() === "admin");
        setIsInstaller(role.toLowerCase() === "installer");
        setUserData((prev) => ({ ...prev, ...userData, uid }));
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setIsInstaller(false);
        setUserData({ name: "", address: "" });
      }
      setInitialDataLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    trackEvent(AnalyticsEvents.PAGE_VIEW, {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname,
    });
  }, []);

  const hasCompletedPurchase = determineHasCompletedPurchase(userData);

  const portalAccessProps = {
    isAuthenticated,
    isInstaller,
    isAdmin,
    hasCompletedPurchase,
    isDataLoaded: initialDataLoaded,
  };

  return (
    <FormContext.Provider
      value={{
        showForm,
        setShowForm,
        isAuthenticated,
        setIsAuthenticated,
        userData,
        setUserData,
      }}
    >
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
                      portalComponent={
                        <Navigate to="/installer/projects" replace />
                      }
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
                      portalComponent={
                        <InstallerProjectsPage isAdmin={isAdmin} />
                      }
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
                      portalComponent={
                        <InstallerProgressTracker isAdmin={isAdmin} />
                      }
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
                      portalComponent={
                        <InstallerDocumentsPage isAdmin={isAdmin} />
                      }
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
                      portalComponent={
                        <InstallerSettingsPage isAdmin={isAdmin} />
                      }
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
                      portalComponent={
                        <ManageInstallersPage isAdmin={isAdmin} />
                      }
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
            <Route
              path="/google-overlay-test"
              element={<GoogleOverlayTest />}
            />

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
                  {...portalAccessProps}
                  homeComponent={
                    isAuthenticated ? (
                      isAdmin || isInstaller ? (
                        <Navigate to="/installer/projects" replace />
                      ) : (
                        <Navigate to="/design" replace />
                      )
                    ) : (
                      <>
                        {" "}
                        <Navbar />
                        <Hero />
                        <AnimatePresence>
                          {!showForm && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <div id="why-sunlink">
                                <InstallationSection />
                              </div>
                              <div id="plans-pricing">
                                <SavingsSection />
                              </div>
                              <div id="contact">
                                <ReviewSection />
                                <ContactSection />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )
                  }
                  loadingComponent={<LoadingComponent />}
                />
              }
            />

            <Route path="/order-summary" element={<OrderSummary />} />
            <Route path="/installer-contract" element={<InstallerContract />} />
          </Routes>
        </div>
      </Router>
    </FormContext.Provider>
  );
}

export default App;
