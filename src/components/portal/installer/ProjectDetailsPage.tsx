import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Zap, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone, 
  FileText, 
  Users, 
  ArrowLeft
} from 'lucide-react';
import { auth, db } from '../../../lib/firebase';
import { ref, get } from 'firebase/database';
import { InstallerPortalLayout } from '../layout/InstallerPortalLayout';
import { LoadingState } from '../../ui/loaders';
import { SystemVisualization } from '../visualization/SystemVisualization';
import { InstallationProgressTracker } from '../progress/InstallationProgressTracker';

// Project data interface
interface ProjectDetailsPageProps {
  isAdmin?: boolean;
}

interface ProjectData {
  customerName: string;
  address: string;
  email: string;
  phoneNumber?: string;
  systemSize?: number;
  panelCount?: number;
  assignedDate?: string;
  projectStatus?: string;
  submittedDesign?: boolean;
  depositPaid?: boolean;
  depositPaymentDate?: string;
  panels?: any[];
  obstructedPanels?: string[];
  progress?: any;
  totalManualPanels?: number;
  // Additional fields as they may exist in the user record
}

export const ProjectDetailsPage: React.FC<ProjectDetailsPageProps> = ({ isAdmin = false }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Fetch project data
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!projectId) {
        setError('No project ID provided');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Get current user
        const user = auth.currentUser;
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Check if the user is an admin (admins have access to all projects)
        const adminRef = ref(db, `admins/${user.uid}`);
        const adminSnapshot = await get(adminRef);
        const isAdmin = adminSnapshot.exists();
        
        if (!isAdmin) {
          // Verify the installer has access to this project
          const installerProjectRef = ref(db, `installers/${user.uid}/assignedProjects/${projectId}`);
          const installerProjectSnapshot = await get(installerProjectRef);
          
          if (!installerProjectSnapshot.exists()) {
            setError('You do not have access to this project');
            setLoading(false);
            return;
          }
          
          // Fetch the full project data from the user's record
          const userRef = ref(db, `users/${projectId}`);
          const userSnapshot = await get(userRef);
          
          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            
            // Combine data from both sources
            const installerProjectData = installerProjectSnapshot.val();
            
            setProjectData({
              ...userData,
              ...installerProjectData,
              customerName: userData.name || installerProjectData.customerName || 'Unknown Customer',
              email: userData.email || installerProjectData.email || 'No Email',
            });
          } else {
            // If user data doesn't exist, use the limited data from installer's record
            setProjectData(installerProjectSnapshot.val());
          }
        } else {
          // Admin: fetch project data directly from the user record
          const userRef = ref(db, `users/${projectId}`);
          const userSnapshot = await get(userRef);
          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            setProjectData({
              ...userData,
              customerName: userData.name || 'Unknown Customer',
              email: userData.email || 'No Email',
            });
          } else {
            setError('Project not found');
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching project data:', error);
        setError('Failed to load project data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjectData();
  }, [projectId]);
  
  // Calculate system size
  const calculateSystemSize = (): number => {
    if (!projectData) return 0;
    
    // Prefer totalManualPanels if available, otherwise derive from panels length
    const panelCount = projectData.totalManualPanels ?? projectData.panels?.length ?? 0;
    
    return (panelCount * 400) / 1000; // Assuming 400 W panels converted to kW
  };
  
  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Return to projects list
  const handleBackClick = () => {
    navigate('/installer/projects');
  };
  
  // Navigate to progress page
  const handleProgressClick = () => {
    navigate(`/installer/project/${projectId}/progress`);
  };
  
  // Navigate to documents page
  const handleDocumentsClick = () => {
    navigate(`/installer/project/${projectId}/documents`);
  };
  
  // Handle error state
  if (error) {
    return (
      <InstallerPortalLayout isAdmin={isAdmin}>
        <div className="p-6 bg-black/20 backdrop-blur-sm rounded-xl border border-red-500/20">
          <h3 className="text-xl font-medium text-white mb-2">Project Error</h3>
          <p className="text-white/70">{error}</p>
          <div className="mt-6">
            <button
              onClick={handleBackClick}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
            >
              <ArrowLeft size={18} />
              <span>Back to Projects</span>
            </button>
          </div>
        </div>
      </InstallerPortalLayout>
    );
  }
  
  // Handle loading state
  if (loading || !projectData) {
    return (
      <InstallerPortalLayout isAdmin={isAdmin}>
        <LoadingState />
      </InstallerPortalLayout>
    );
  }
  
  // System size (use calculated or stored value)
  const systemSize = calculateSystemSize();
  
  return (
    <InstallerPortalLayout isAdmin={isAdmin}>
      <div className="w-full space-y-8">
        {/* Back button */}
        <button
          onClick={handleBackClick}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors mb-4"
        >
          <ArrowLeft size={18} />
          <span>Back to Projects</span>
        </button>
        
        {/* Customer Information */}
        <div className="bg-black/20 backdrop-blur-lg rounded-xl border border-white/10 p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center">
                <User size={24} className="text-yellow-400" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">
                  Customer: {projectData.customerName}
                </h1>
                <p className="text-white/60">
                  Project Status: <span className="text-yellow-400 font-medium">{projectData.projectStatus || 'New'}</span>
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleProgressClick}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-yellow-400 rounded-lg transition-colors"
              >
                <Calendar size={18} />
                <span>Update Progress</span>
              </button>
              
              <button
                onClick={handleDocumentsClick}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors"
              >
                <FileText size={18} />
                <span>Manage Documents</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Contact */}
            <div className="bg-black/30 rounded-lg border border-white/5 p-4">
              <h3 className="text-white/60 text-sm font-medium mb-3">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-white/50" />
                  <span className="text-white">{projectData.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-white/50" />
                  <span className="text-white">{projectData.phoneNumber || 'Not provided'}</span>
                </div>
              </div>
            </div>
            
            {/* Address */}
            <div className="bg-black/30 rounded-lg border border-white/5 p-4">
              <h3 className="text-white/60 text-sm font-medium mb-3">Installation Address</h3>
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-white/50 mt-0.5" />
                <span className="text-white">{projectData.address}</span>
              </div>
            </div>
            
            {/* System Specs */}
            <div className="bg-black/30 rounded-lg border border-white/5 p-4">
              <h3 className="text-white/60 text-sm font-medium mb-3">System Specifications</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Zap size={16} className="text-white/50" />
                  <span className="text-white">{systemSize} kW System</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users size={16} className="text-white/50" />
                  <span className="text-white">{projectData.totalManualPanels || '0'} Panels</span>
                </div>
              </div>
            </div>
            
            {/* Dates */}
            <div className="bg-black/30 rounded-lg border border-white/5 p-4">
              <h3 className="text-white/60 text-sm font-medium mb-3">Important Dates</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-white/50" />
                  <div>
                    <p className="text-white/50 text-xs">Assigned Date</p>
                    <p className="text-white">{formatDate(projectData.assignedDate)}</p>
                  </div>
                </div>
          
              </div>
            </div>
          </div>
        </div>
        
       
        
        {/* System Visualization */}
        {projectData.panels && projectData.panels.length > 0 && (
          <div className="bg-black/20 backdrop-blur-lg rounded-xl border border-white/10 p-6">
        
            <div className="overflow-hidden rounded-xl">
              <SystemVisualization className="w-full" customerUid={projectId} />
            </div>
          </div>
        )}
      </div>
    </InstallerPortalLayout>
  );
};