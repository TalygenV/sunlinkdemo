import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Calendar, AlertCircle, Info, ArrowLeft } from 'lucide-react';
import { auth, db } from '../../../lib/firebase';
import { ref, get, update } from 'firebase/database';
import { InstallerPortalLayout } from '../layout/InstallerPortalLayout';
import { LoadingState } from '../../ui/loaders';
import { InstallationStage } from '../progress/InstallationProgressTracker';

interface InstallerProgressTrackerProps {
  isAdmin?: boolean;
}

interface ProgressStage {
  key: InstallationStage;
  label: string;
  description: string;
  date?: string;
  completed: boolean;
}

export const InstallerProgressTracker: React.FC<InstallerProgressTrackerProps> = ({ isAdmin = false }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [stages, setStages] = useState<ProgressStage[]>([
    {
      key: 'siteSurveyApproval',
      label: 'Site Survey Approval',
      description: 'Property assessment and system design finalization',
      completed: false
    },
    {
      key: 'hicContract',
      label: 'HIC Contract',
      description: 'Home Improvement Contract signed',
      completed: false
    },
    {
      key: 'installation',
      label: 'Installation',
      description: 'Solar panel system installation',
      completed: false
    },
    {
      key: 'interconnection',
      label: 'Interconnection',
      description: 'Connection to the utility grid',
      completed: false
    },
    {
      key: 'service',
      label: 'Service',
      description: 'System active and generating power',
      completed: false
    }
  ]);
  const [activeCalendarStage, setActiveCalendarStage] = useState<string | null>(null);
  const [savingStage, setSavingStage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Navigation
  const navigateBack = () => {
    window.history.back();
  };
  
  // Fetch project progress data
  useEffect(() => {
    const fetchProgressData = async () => {
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
        
        let customerNameTemp = 'Customer';
        
        if (!isAdmin) {
          // Verify the installer has access to this project
          const installerProjectRef = ref(db, `installers/${user.uid}/assignedProjects/${projectId}`);
          const installerProjectSnapshot = await get(installerProjectRef);
          
          if (!installerProjectSnapshot.exists()) {
            setError('You do not have access to this project');
            setLoading(false);
            return;
          }
          
          // Get customer name from installer record
          const installerProjectData = installerProjectSnapshot.val();
          customerNameTemp = installerProjectData.customerName || 'Customer';
        } else {
          // For admins, attempt to fetch the customer name directly from the user record
          const userRef = ref(db, `users/${projectId}`);
          const userSnapshot = await get(userRef);
          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            customerNameTemp = userData.name || userData.customerName || 'Customer';
          }
        }
        
        // Set customer name
        setCustomerName(customerNameTemp);
        
        // Fetch the full project data from the user's record to get progress info
        const userRef = ref(db, `users/${projectId}`);
        const userSnapshot = await get(userRef);
        
        if (userSnapshot.exists()) {
          const userData = userSnapshot.val();
          
          // Check for progress data
          if (userData.progress) {
            // Update stages with existing progress data
            setStages(prevStages => 
              prevStages.map(stage => {
                const stageData = userData.progress[stage.key];
                return {
                  ...stage,
                  date: stageData?.date || undefined,
                  completed: !!stageData?.completed
                };
              })
            );
          }
        }
      } catch (error) {
        console.error('Error fetching progress data:', error);
        setError('Failed to load progress data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProgressData();
  }, [projectId]);
  
  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Not completed';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Toggle calendar for a stage
  const toggleCalendar = (stageKey: string) => {
    if (activeCalendarStage === stageKey) {
      setActiveCalendarStage(null);
    } else {
      setActiveCalendarStage(stageKey);
      // Set the selected date to the stage's date if it exists, otherwise current date
      const stage = stages.find(s => s.key === stageKey);
      if (stage?.date) {
        setSelectedDate(new Date(stage.date));
      } else {
        setSelectedDate(new Date());
      }
    }
  };
  
  // Save progress update
  const saveProgress = async (stageKey: string, completed: boolean, date?: string) => {
    if (!projectId) return;
    
    try {
      setSavingStage(stageKey);
      
      // Reference to the user's progress data
      const progressRef = ref(db, `users/${projectId}/progress/${stageKey}`);
      
      // Update the progress data
      await update(progressRef, {
        completed,
        date: date || new Date().toISOString()
      });
      
      // Update local state
      setStages(prevStages => 
        prevStages.map(stage => 
          stage.key === stageKey
            ? { ...stage, completed, date: date || new Date().toISOString() }
            : stage
        )
      );
      
      // Update the current stage in the user data if necessary
      const currentStageIndex = stages.findIndex(stage => stage.key === stageKey);
      const nextStageIndex = currentStageIndex + 1;
      
      if (completed && nextStageIndex < stages.length) {
        // Set the next stage as current
        const userProgressRef = ref(db, `users/${projectId}/progress`);
        await update(userProgressRef, { currentStage: stages[nextStageIndex].key });
      }
      
      // Show success message
      setSaveSuccess(stageKey);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating progress:', error);
      setError('Failed to update progress');
    } finally {
      setSavingStage(null);
    }
  };
  
  // Handle date selection
  const handleDateSelect = (stageKey: string, date: Date) => {
    // Format date to ISO string
    const dateString = date.toISOString();
    
    // Save progress with the selected date
    saveProgress(stageKey, true, dateString);
    
    // Close calendar
    setActiveCalendarStage(null);
  };
  
  // Generate calendar days
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  // Handle error state
  if (error) {
    return (
      <InstallerPortalLayout isAdmin={isAdmin}>
        <div className="p-6 bg-black/20 backdrop-blur-sm rounded-xl border border-red-500/20">
          <h3 className="text-xl font-medium text-white mb-2">Progress Tracker Error</h3>
          <p className="text-white/70">{error}</p>
          <div className="mt-6">
            <button
              onClick={navigateBack}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
            >
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>
          </div>
        </div>
      </InstallerPortalLayout>
    );
  }
  
  // Handle loading state
  if (loading) {
    return (
      <InstallerPortalLayout isAdmin={isAdmin}>
        <LoadingState />
      </InstallerPortalLayout>
    );
  }
  
  return (
    <InstallerPortalLayout isAdmin={isAdmin}>
      <div className="w-full space-y-8">
        {/* Back button */}
        <button
          onClick={navigateBack}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors mb-4"
        >
          <ArrowLeft size={18} />
          <span>Back to Project</span>
        </button>
        
        {/* Header */}
        <div className="bg-black/20 backdrop-blur-lg rounded-xl border border-white/10 p-6">
          <h1 className="text-2xl font-semibold text-white">Installation Progress</h1>
          <p className="text-white/60 mt-1">
            Customer: {customerName}
          </p>
          
          <div className="mt-4 p-4 rounded-lg bg-white/5  ">
            <div className="flex items-start gap-3">
              <Info className="text-white flex-shrink-0 mt-1" size={18} />
              <div>
                <p className="text-white font-medium">Managing Progress</p>
                <p className="text-white/70 text-sm mt-1">
                  Update the installation progress by marking stages as complete and setting completion dates.
                  Each update will be immediately visible to the customer in their portal.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress stages */}
        <div className="bg-black/20 backdrop-blur-lg rounded-xl border border-white/10 p-6">
          <div className="space-y-10">
            {stages.map((stage, index) => {
              // Determine status based on completion
              const isCompleted = stage.completed;
              const isPrevCompleted = index === 0 || stages[index - 1].completed;
              const isAvailable = isPrevCompleted;
              
              return (
                <div key={stage.key} className="relative">
                  {/* Vertical connector line */}
                  {index < stages.length - 1 && (
                    <div 
                      className={`absolute left-6 top-[100%] w-0.5 h-10 ${
                        isCompleted ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400' : 'bg-white/10'
                      }`}
                    />
                  )}
                  
                  <div className="flex items-start gap-4">
                    {/* Status circle */}
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCompleted 
                          ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400 ' 
                          : isAvailable 
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                            : 'bg-white/5 text-white/30 border border-white/10'
                      }`}
                    >
                      {isCompleted ? (
                        <Check size={20} />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    
                    {/* Stage content */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-white">
                            {stage.label}
                          </h3>
                          <p className="text-white/60 text-sm">
                            {stage.description}
                          </p>
                        </div>
                        
                        {isAvailable && (
                          <div className="flex items-center gap-2">
                            {isCompleted ? (
                              <button
                                onClick={() => toggleCalendar(stage.key)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm"
                              >
                                <Calendar size={16} />
                                <span>{formatDate(stage.date)}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => saveProgress(stage.key, true)}
                                disabled={!!savingStage}
                                className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {savingStage === stage.key ? (
                                  <span>Saving...</span>
                                ) : (
                                  <>
                                    <Check size={16} />
                                    <span>Mark as Completed</span>
                                  </>
                                )}
                              </button>
                            )}
                            
                            {saveSuccess === stage.key && (
                              <motion.span
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-green-400 text-sm"
                              >
                                Saved!
                              </motion.span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Date picker calendar */}
                      {activeCalendarStage === stage.key && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 p-4 bg-black/40 rounded-lg border border-white/10"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <button
                              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                              className="p-2 hover:bg-white/5 rounded-full text-white/70 hover:text-white"
                            >
                              &lt;
                            </button>
                            <h4 className="text-white font-medium">
                              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </h4>
                            <button
                              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                              className="p-2 hover:bg-white/5 rounded-full text-white/70 hover:text-white"
                            >
                              &gt;
                            </button>
                          </div>
                          
                          {/* Day headers */}
                          <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                              <div key={day} className="text-center text-white/50 text-xs p-1">
                                {day}
                              </div>
                            ))}
                          </div>
                          
                          {/* Calendar days */}
                          <div className="grid grid-cols-7 gap-1">
                            {/* Empty cells for days before first day of month */}
                            {Array.from({ length: getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => (
                              <div key={`empty-start-${i}`} className="h-8" />
                            ))}
                            
                            {/* Days of the month */}
                            {Array.from({ length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => {
                              const day = i + 1;
                              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                              const isSelected = selectedDate.getDate() === day && 
                                               selectedDate.getMonth() === currentDate.getMonth() && 
                                               selectedDate.getFullYear() === currentDate.getFullYear();
                              const isToday = new Date().getDate() === day && 
                                             new Date().getMonth() === currentDate.getMonth() && 
                                             new Date().getFullYear() === currentDate.getFullYear();
                              
                              return (
                                <button
                                  key={`day-${day}`}
                                  onClick={() => {
                                    setSelectedDate(date);
                                    handleDateSelect(stage.key, date);
                                  }}
                                  className={`h-8 flex items-center justify-center rounded-full text-sm ${
                                    isSelected 
                                      ? 'bg-orange-500 text-white' 
                                      : isToday
                                        ? 'border border-blue-500/50 text-yellow-400'
                                        : 'hover:bg-white/10 text-white/80'
                                  }`}
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </InstallerPortalLayout>
  );
};