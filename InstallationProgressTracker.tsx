import React from 'react';
import { styled } from '@mui/material/styles';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import { StepIconProps } from '@mui/material/StepIcon';
import Check from '@mui/icons-material/Check';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningIcon from '@mui/icons-material/Warning';

// Define the stage types for the installation process
export type InstallationStage = 'siteSurveyApproval' | 'hicContract' | 'installation' | 'interconnection' | 'service';

interface StageInfo {
  key: InstallationStage;
  label: string;
  description: string;
  estimatedDuration: string;
}

// Define the props interface
interface InstallationProgressTrackerProps {
  currentStage?: InstallationStage | string;
  className?: string;
  compact?: boolean;
}

// Custom connector styling
const CustomConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: 'linear-gradient(to right, #3b82f6, #f59e0b)',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: 'linear-gradient(to right, #3b82f6, #3b82f6)',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 1,
  },
}));

// Custom step icon styling
const CustomStepIconRoot = styled('div')<{
  ownerState: { completed?: boolean; active?: boolean; error?: boolean };
}>(({ theme, ownerState }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  zIndex: 1,
  color: '#fff',
  width: 40,
  height: 40,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  border: '2px solid rgba(255, 255, 255, 0.2)',
  ...(ownerState.active && {
    backgroundColor: '#f59e0b',
    boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)',
    border: '2px solid #f59e0b',
  }),
  ...(ownerState.completed && {
    backgroundColor: '#3b82f6',
    border: '2px solid #3b82f6',
  }),
  ...(ownerState.error && {
    backgroundColor: '#ef4444',
    border: '2px solid #ef4444',
  }),
}));

// Custom step icon component
function CustomStepIcon(props: StepIconProps & { error?: boolean }) {
  const { active, completed, error, className } = props;

  return (
    <CustomStepIconRoot ownerState={{ completed, active, error }} className={className}>
      {completed ? (
        <Check />
      ) : active ? (
        <AccessTimeIcon />
      ) : error ? (
        <WarningIcon />
      ) : null}
    </CustomStepIconRoot>
  );
}

// Styled component for the label
const StepLabelStyled = styled(StepLabel)(({ theme }) => ({
  '& .MuiStepLabel-label': {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '0.875rem',
    fontWeight: 500,
    marginTop: 8,
    textAlign: 'center',
    width: '100%',
    '&.Mui-active': {
      color: '#fff',
      fontWeight: 600,
    },
    '&.Mui-completed': {
      color: '#fff',
    },
  },
  '& .MuiStepLabel-iconContainer': {
    paddingRight: 0,
  },
}));

// Custom Container for StepLabel to ensure proper alignment
const StepContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
});

// For the mobile view - keep this simple and directly control the styling
const StageCircle = styled('div')<{
  status: 'completed' | 'current' | 'upcoming';
}>(({ status }) => ({
  width: 40,
  height: 40,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  position: 'relative',
  zIndex: 2,
color: status === 'completed' ? 'rgb(74 222 128)' : 
                   status === 'current' ? '#f59e0b' : 
                   'rgba(192, 192, 192, 0.1)',
  backgroundColor: status === 'completed' ? 'rgb(34 197 94 / 0.2)' : 
                   status === 'current' ? '#f59e0b' : 
                   'rgba(192, 192, 192, 0.1)',
  border: `2px solid ${status === 'completed' ? 'rgb(34 197 94 / 0.2)' : 
                        status === 'current' ? '#f59e0b' : 
                        'rgb(37, 34, 34)'}`,
                        
  ...(status === 'current' && {
    boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)',
  }),
}));

/**
 * Installation Progress Tracker component
 * Displays a timeline visualization of the 5-stage installation process
 * with the customer's current status highlighted
 */
export const InstallationProgressTracker: React.FC<InstallationProgressTrackerProps> = ({
  currentStage = 'siteSurveyApproval',
  className = '',
  compact = false
}) => {
  // Define all stages and their details
  const stages: StageInfo[] = [
    {
      key: 'siteSurveyApproval',
      label: 'Site Survey Approval',
      description: 'We\'ve assessed your property and are finalizing the solar system design.',
      estimatedDuration: '1-2 weeks'
    },
    {
      key: 'hicContract',
      label: 'HIC Contract',
      description: 'We\'re preparing your Home Improvement Contract for your review and signature.',
      estimatedDuration: '1-2 weeks'
    },
    {
      key: 'installation',
      label: 'Installation',
      description: 'Our expert team installs your solar system.',
      estimatedDuration: '1-2 days'
    },
    {
      key: 'interconnection',
      label: 'Interconnection',
      description: 'We work with your utility company to connect your system to the grid.',
      estimatedDuration: '2-4 weeks'
    },
    {
      key: 'service',
      label: 'Service',
      description: 'Your system is activated and generating clean solar energy.',
      estimatedDuration: 'Ongoing'
    }
  ];

  // Convert string stage name to proper stage key if needed
  const normalizedCurrentStage = currentStage as InstallationStage;
  
  // Find the index of the current stage
  const currentStageIndex = stages.findIndex(stage => stage.key === normalizedCurrentStage);

  return (
    <div className={`${className}`}>
      <div className=" backdrop-blur-lg rounded-xl   p-1">
      
        
        {/* Unified vertical progress layout for both mobile and desktop */}
        <div className="">
          <div className="relative">
            {stages.map((stage, index) => {
              // Determine status
              let status: 'completed' | 'current' | 'upcoming';
              if (index < currentStageIndex) status = 'completed';
              else if (index === currentStageIndex) status = 'current';
              else status = 'upcoming';

              return (
                <div key={stage.key} className="flex items-start mb-8 relative">
                  {/* Add connecting line to previous step (except for first step) */}
                  {index > 0 && (
                    <div
                      className="absolute w-0.5 bg-[rgb(37,34,34)]"
                      style={{
                        top: -32, // Position from top of current element to the previous element
                        height: 32, // Height to connect to previous element
                        left: 20,
                        zIndex: 1
                      }}
                    />
                  )}
                  
                  {/* Stage circle container - fixed width for alignment */}
                  <div className="w-10 flex-shrink-0">
                    <StageCircle status={status}>
                      {status === 'completed' && <Check  sx={{ color: '#fff', fontSize: '1.5rem' }} />}
                      {status === 'current' && <AccessTimeIcon  sx={{ color: '#fff', fontSize: '1.5rem' }} />}
                      {status === 'upcoming' && null}
                    </StageCircle>
                  </div>

                  {/* Content in a flex column for proper layout */}
                  <div className="ml-4 flex flex-col">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium ${status === 'upcoming' ? 'text-white/70' : 'text-white'} md:text-base text-sm`}>
                        {stage.label}
                      </h3>
                      
                      {/* Status badge inline with title */}
                      {status === 'current' && (
                        <div className="py-0.5 px-2 bg-amber-500/20 rounded-md inline-block">
                          <span className="text-xs font-medium text-amber-400">In Progress</span>
                        </div>
                      )}
                    </div>
                    
                    {!compact && (
                      <>
                        <p className="text-sm md:text-base text-white/60 mt-1">
                          {stage.description}
                        </p>
                        <p className="text-xs md:text-sm text-white/50 mt-1">
                          Est. duration: {stage.estimatedDuration}
                        </p>
                      </>
                    )}
                  </div>
                  
                  {/* Add horizontal bar for progress steps */}
                  {!compact && index < stages.length - 1 && (
                    <div className="absolute left-5 top-[60px] h-[1px] w-full bg-orange-700/30" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {!compact && (
          <div className="mt-8 p-4 bg-orange-900/20 rounded-lg border border-blue-500/20">
            <h3 className="text-white font-medium mb-2">
              Next Steps
            </h3>
            
            {currentStageIndex === 0 && (
              <p className="text-white/70 text-sm">
                We're reviewing your site survey and finalizing your system design. Our team will contact you within the next 3-5 business days with updates.
              </p>
            )}
            
            {currentStageIndex === 1 && (
              <p className="text-white/70 text-sm">
                We're preparing your Home Improvement Contract. Once ready, you'll receive it for review and signature.
              </p>
            )}
            
            {currentStageIndex === 2 && (
              <p className="text-white/70 text-sm">
                Your installation is scheduled for May 15, 2025. Our expert team will install your solar system, which typically takes 1-2 days depending on system size and complexity.
              </p>
            )}
            
            {currentStageIndex === 3 && (
              <p className="text-white/70 text-sm">
                We've submitted interconnection paperwork to your utility company. This process typically takes 2-4 weeks. We'll notify you as soon as we receive approval.
              </p>
            )}
            
            {currentStageIndex === 4 && (
              <p className="text-white/70 text-sm">
                Congratulations! Your system is now active and generating clean solar energy. Monitor your production through your online dashboard.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};