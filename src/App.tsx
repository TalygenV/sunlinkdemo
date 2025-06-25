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
import { useIdleTimer } from "./components/common/useIdleTimer";
import { signOut } from "firebase/auth";

// ---------------------------
// ✅ Correct Context Types
// ---------------------------
interface UserData {
  name: string;
  address: string;
  phoneNumber?: string;
  uid?: string;
  solarData?: any;
  monthlyBill?: number;
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

// ---------------------------
// Route Controller Component
// ---------------------------
interface RouteControllerProps {
  isAuthenticated: boolean;
  isInstaller?: boolean;
  isAdmin?: boolean;
  hasCompletedPurchase: boolean;
  isDataLoaded: boolean;
  portalComponent?: React.ReactNode;
  designComponent?: React.ReactNode;
  homeComponent?: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

const RouteController: React.FC<RouteControllerProps> = ({
  isAuthenticated,
  isInstaller = false,
  isAdmin = false,
  hasCompletedPurchase,
  isDataLoaded,
  portalComponent,
  designComponent,
  homeComponent,
  loadingComponent,
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

  if (pathname.startsWith("/design")) {
    return !hasCompletedPurchase ? (
      <>{designComponent}</>
    ) : (
      <Navigate to="/portal" replace />
    );
  }

  return <>{homeComponent}</>;
};

// ---------------------------
// Main App Component
// ---------------------------
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInstaller, setIsInstaller] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasCompletedPurchase] = useState(true);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);

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

        const adminRef = ref(db, `admins/${uid}`);
        const adminSnap = await get(adminRef);
        const userDoc = await getDoc(doc(firestore, "users", uid));
        const userData = userDoc.exists() ? userDoc.data() : null;
        const userRole = userData?.role || "Customer";

        if (userRole.toLowerCase() === "admin") {
          setIsAdmin(true);
          setIsInstaller(false);
        } else if (userRole.toLowerCase() === "installer") {
          setIsAdmin(false);
          setIsInstaller(true);
        } else {
          setIsAdmin(false);
          setIsInstaller(false); // in case it's a customer
        }

        setUserData({
          name: user.displayName || "User",
          address: "Default Address",
          phoneNumber: user.phoneNumber || "",
          uid: user.uid,
          solarData: {},
          monthlyBill: 0,
        });
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
  const portalAccessProps = {
    isAuthenticated,
    isInstaller,
    isAdmin,
    hasCompletedPurchase: true,
    isDataLoaded: initialDataLoaded,
  };
  // Auto logout after 10 seconds of inactivity
  // useIdleTimer(() => {
  //
  //   if (isAuthenticated) {
  //     console.log("Auto-logout due to 10s inactivity");

  //     (async () => {
  //       try {
  //         await signOut(auth);
  //         window.location.href = "/";
  //       } catch (error) {
  //         console.error("Error signing out:", error);
  //       }
  //     })();
  //   }
  // }, 60 * 1000); // 60 seconds

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
        <Navbar />
        <div className="min-h-screen">
          <Routes>
            {(isInstaller || isAdmin) && (
              <>
                <Route
                  path="/installer"
                  element={
                    <RouteController
                      {...portalAccessProps}
                      portalComponent={
                        <Navigate to="/installer/projects" replace />
                      }
                      loadingComponent={<LoadingComponent />}
                    />
                  }
                />
                <Route
                  path="/installer/settings/manage-installers"
                  element={
                    <RouteController
                      {...portalAccessProps}
                      portalComponent={
                        <ManageInstallersPage isAdmin={isAdmin} />
                      }
                      loadingComponent={<LoadingComponent />}
                    />
                  }
                />
                <Route
                  path="/installer/projects"
                  element={
                    <RouteController
                      {...portalAccessProps}
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
                      {...portalAccessProps}
                      portalComponent={<ProjectDetailsPage isAdmin={isAdmin} />}
                      loadingComponent={<LoadingComponent />}
                    />
                  }
                />
                <Route
                  path="/installer/project/:projectId/progress"
                  element={
                    <RouteController
                      {...portalAccessProps}
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
                      {...portalAccessProps}
                      portalComponent={
                        <InstallerDocumentsPage isAdmin={isAdmin} />
                      }
                      loadingComponent={<LoadingComponent />}
                    />
                  }
                />
                <Route
                  path="/installer/settings"
                  element={
                    <RouteController
                      {...portalAccessProps}
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
                      {...portalAccessProps}
                      portalComponent={<AddInstallerPage isAdmin={isAdmin} />}
                      loadingComponent={<LoadingComponent />}
                    />
                  }
                />
              </>
            )}

            <Route
              path="/design"
              element={
                <RouteController
                  {...portalAccessProps}
                  designComponent={<SystemDesign userData={userData} />}
                  loadingComponent={<LoadingComponent />}
                />
              }
            />

            <Route path="/design-return" element={<CheckoutReturn />} />

            <Route
              index
              element={
                <RouteController
                  {...portalAccessProps}
                  homeComponent={
                    <>
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

// ---------------------------
// Utility Component
// ---------------------------
const LoadingComponent = () => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center">
    Loading...
  </div>
);
