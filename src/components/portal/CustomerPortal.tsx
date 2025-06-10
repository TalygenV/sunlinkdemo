import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../lib/firebase';
import { ref, get } from 'firebase/database';
import { 
  Home, 
  BarChart3, 
  FileText, 
  MessageSquare,
  Users,
  ArrowRight,
  Upload,
  Camera,
  X,
  Zap,
  BatteryCharging,
  Sun
} from 'lucide-react';

import { CustomerPortalLayout } from './layout/CustomerPortalLayout';
import { InstallationProgressTracker, InstallationStage } from './progress/InstallationProgressTracker';
import { DocumentRepository } from './documents/DocumentRepository';
import { SystemVisualization } from './visualization/SystemVisualization';

/**
 * Main CustomerPortal component
 * Serves as the dashboard displaying key information about the customer's system
 */
export const CustomerPortal: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<InstallationStage>('siteSurveyApproval');
  const [showSiteSurveyModal, setShowSiteSurveyModal] = useState(false);
  const navigate = useNavigate();

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const user = auth.currentUser;
        if (!user) {
          // Redirect to login if not authenticated
          navigate('/login');
          return;
        }
        
        // Fetch user data from Firebase
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          
          // Ensure the user has completed the purchase process (using depositPaid and submittedDesign)
          const hasPaidDeposit = data.depositPaid === true;
          const hasSubmittedDesign = data.submittedDesign === true;
          if (!hasPaidDeposit || !hasSubmittedDesign) {
            navigate('/design');
            return;
          }
          
          setUserData(data);
          
          // Check if site survey has been submitted
          if (!data.sitesurveysubmitted) {
            setShowSiteSurveyModal(true);
          }
          
          // Determine current installation stage
          if (data.progress) {
            const stageOrder: InstallationStage[] = [
              'siteSurveyApproval', 
              'hicContract', 
              'installation', 
              'interconnection', 
              'service'
            ];
            
            // Find the last completed stage
            let lastCompletedStageIndex = -1;
            
            for (let i = 0; i < stageOrder.length; i++) {
              const stageName = stageOrder[i];
              if (data.progress[stageName] && data.progress[stageName].date) {
                lastCompletedStageIndex = i;
              } else {
                break;
              }
            }
            
            // The current stage is the next one after the last completed
            // If no stages are completed, default to the first stage
            const currentStageIndex = Math.min(lastCompletedStageIndex + 1, stageOrder.length - 1);
            setCurrentStage(stageOrder[currentStageIndex]);
          }
          
        } else {
          // No user data found, redirect to design
          navigate('/design');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load your customer portal');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [navigate]);

  // Format the user's address for display
  const formatAddress = (address: string): string => {
    if (!address) return 'Your Project';
    
    // Split by commas and return first part (street address)
    const parts = address.split(',');
    return parts[0].trim();
  };

  // Format installation stage for display
  const formatStageName = (stage: InstallationStage): string => {
    switch(stage) {
      case 'siteSurveyApproval':
        return 'Site Survey Approval';
      case 'hicContract':
        return 'HIC Contract';
      case 'installation':
        return 'Installation';
      case 'interconnection':
        return 'Interconnection';
      case 'service':
        return 'Service';
      default:
        return stage;
    }
  };

  // Calculate system size in kW
  const calculateSystemSize = (): number => {
    if (!userData?.panels) return 0;
    
 
      
      return userData.totalManualPanels * 400 / 1000;
    
    
    // Calculate total system size (assume 400W panels if wattage not specified)
    
  };
  const calculatePanelOutput = (): number => {
    if (!userData?.panels) return 0;
    return userData.totalManualPanels * 550 ;
  };

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white-900 to-black text-white flex items-center justify-center">
        <div className="w-full max-w-md p-8 bg-black/30 backdrop-blur-lg rounded-xl border border-red-500/20">
          <h2 className="text-2xl font-medium text-white mb-4">Error</h2>
          <p className="text-white/70 mb-6">{error}</p>
          <button 
            className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 rounded-lg text-white transition-colors"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
const capitalizedName = userData?.name?.split(' ')[0]?.charAt(0)?.toUpperCase() + userData?.name?.split(' ')[0]?.slice(1) || '';
  return (
    <CustomerPortalLayout>
    
      {/* Site Survey Modal */}
      <AnimatePresence>
        {showSiteSurveyModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center px-4" onClick={(e) => e.stopPropagation()}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSiteSurveyModal(false)}
              className="absolute inset-0 bg-black backdrop-blur-lg"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md"
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
                {/* Close Button */}
                <button
                  onClick={() => setShowSiteSurveyModal(false)}
                  className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>

                {/* Content */}
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full  text-white icon-glow-white">
                      <Camera size={28} />
                    </div>
                  </div>
                  <h2 className="text-2xl font-light text-white mb-2">
                    Site Survey Required
                  </h2>
                  <p className="text-white/70 mb-6">
                    Before we can proceed with your installation, we need you to upload required site survey images of your property.
                  </p>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-sheen relative z-10 w-full h-[52px] flex items-center justify-center gap-3 px-8 text-white rounded-full shadow-xl transition-all duration-500 text-sm font-medium tracking-wider group"
                    onClick={() => {
                      setShowSiteSurveyModal(false);
                      setTimeout(() => {
                        navigate('/portal/sitesurvey');
                      }, 300);
                    }}
                  >
                    <Upload size={18} className="group-hover:scale-110 transition-transform duration-300" />
                    <span>Upload Site Survey Images</span>
                  </motion.button>

                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="space-y-10">
        {/* Welcome Section with Integrated System Visualization */}
        <section>
          <div className="relative">
            {/* Subtle background glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-white/5 via-transparent to-white/5 rounded-2xl blur-xl opacity-10" />
            
            <motion.div 
              className="relative p-8 bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Subtle decorative element */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
              
              <div className="relative flex flex-col gap-6">
                {/* User greeting and system info */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                  <div className="space-y-1">
                   
                    <h1 className="text-3xl md:text-4xl font-semibold text-white tracking-tight text-white/90">
                      Welcome Back, <span className="text-white/80">{capitalizedName}</span>
                    </h1>
                    <p className="text-gray-400 text-base">
                      {formatAddress(userData?.address)}
                    </p>
                  </div>
                  
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10"
                  >
                    <div className="h-2.5 w-2.5 rounded-full bg-white/70 animate-pulse" />
                    <div>
                      <p className="text-gray-400 text-sm">Pending {formatStageName(currentStage)}</p>
                    </div>
                  </motion.div>
                </div>
                
                {/* Stats and metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
                  <motion.div 
                    className="bg-black/20 rounded-xl border border-white/10 p-5 flex items-center space-x-4 transition-all duration-300 ease-in-out"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <Zap size={28} className="text-white" />
                    <div className="pl-4 pr-2 border-l border-white/20">
                      <p className="text-xs text-gray-400 uppercase tracking-widest">System Size</p>
                      <p className="text-2xl font-light text-white tabular-nums">{calculateSystemSize()} kW</p>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-black/20 rounded-xl border border-white/10 p-5 flex items-center space-x-4 transition-all duration-300 ease-in-out"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <BatteryCharging size={28} className="text-white" />
                    <div className="pl-4 pr-2 border-l border-white/20">
                      <p className="text-xs text-gray-400 uppercase tracking-widest">Battery Storage</p>
                      {userData?.batteryCount > 0 ? (
                        <p className="text-2xl font-light text-white tabular-nums">
                          {userData.batteryCount} {userData.batteryCount === 1 ? 'Battery' : 'Batteries'}
                        </p>
                      ) : (
                        <p className="text-2xl font-light text-white/70">None Installed</p>
                      )}
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-black/20 rounded-xl border border-white/10 p-5 flex items-center space-x-4 transition-all duration-300 ease-in-out"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <Zap size={28} className="text-white" />
                    <div className="pl-4 pr-2 border-l border-white/20">
                      <p className="text-xs text-gray-400 uppercase tracking-widest">Annual Output</p>
                      <p className="text-2xl font-light text-white tabular-nums">{(calculatePanelOutput()).toLocaleString()} kWh</p>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="bg-black/20 rounded-xl border border-white/10 p-5 flex items-center space-x-4 transition-all duration-300 ease-in-out"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <Sun size={28} className="text-white" />
                    <div className="pl-4 pr-2 border-l border-white/20">
                      <p className="text-xs text-gray-400 uppercase tracking-widest">Solar Panels</p>
                      <p className="text-2xl font-light text-white tabular-nums">
                        {userData?.totalManualPanels} Panels
                      </p>
                    </div>
                  </motion.div>
                </div>
                
                {/* Integrated System Visualization */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mt-6"
                >
             
                  <div className="overflow-hidden  rounded-xl">
                    <SystemVisualization className="w-full" />
                  </div>
                </motion.div>
                
                {/* Quick actions */}
           
               
              </div>
            </motion.div>
          </div>
        </section>
        
        {/* Installation Progress Tracker */}
        
        
        {/* Recent Documents */}
       
        
        {/* Quick Actions */}
       
        
        {/* Support Contact */}
        <section>
          <motion.div 
            className="p-6 bg-black/20 rounded-xl border border-white/10 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-medium text-white mb-2">
                  Need Assistance?
                </h2>
                <p className="text-gray-400">
                  Contact your dedicated support team for any questions about your solar system.
                </p>
              </div>
              
              <button 
                className="px-6 py-3 bg-white/10 hover:bg-white/15 rounded-lg text-white border border-white/10 transition-colors flex items-center gap-2 whitespace-nowrap"
                onClick={() => navigate('/portal/support')}
              >
                <MessageSquare size={18} />
                <span>Contact Support</span>
              </button>
            </div>
          </motion.div>
        </section>
      </div>
    </CustomerPortalLayout>
  );
};