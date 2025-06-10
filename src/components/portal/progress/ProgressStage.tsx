import React from 'react';
import { styled } from '@mui/material/styles';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import { StepIconProps } from '@mui/material/StepIcon';
import CheckIcon from '@mui/icons-material/Check';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningIcon from '@mui/icons-material/Warning';

// Type for stage status
export type StageStatus = 'completed' | 'current' | 'upcoming' | 'delayed';

interface ProgressStageProps {
  name: string;
  status: StageStatus;
  index: number;
  totalStages: number;
  date?: string;
  onClick: () => void;
  compact?: boolean;
}

// Custom step icon styling
const StageIconRoot = styled('div')<{
  ownerState: { status: StageStatus };
}>(({ theme, ownerState }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  zIndex: 1,
  color: '#fff',
  width: ownerState.status === 'upcoming' ? 24 : 32,
  height: ownerState.status === 'upcoming' ? 24 : 32,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  border: '2px solid rgba(255, 255, 255, 0.2)',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'scale(1.1)',
  },
  '&:active': {
    transform: 'scale(0.95)',
  },
  ...(ownerState.status === 'completed' && {
    backgroundColor: '#10b981',
    border: '2px solid #10b981',
  }),
  ...(ownerState.status === 'current' && {
    backgroundColor: '#3b82f6',
    border: '2px solid #3b82f6',
    boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
  }),
  ...(ownerState.status === 'delayed' && {
    backgroundColor: '#f59e0b',
    border: '2px solid #f59e0b',
  }),
}));

// Custom step label styling
const StageLabelStyled = styled(StepLabel)<{
  ownerState: { status: StageStatus; compact: boolean }
}>(({ theme, ownerState }) => ({
  '& .MuiStepLabel-label': {
    color: ownerState.status === 'upcoming' ? 'rgba(255, 255, 255, 0.5)' : '#fff',
    fontSize: ownerState.compact ? '0.75rem' : '0.875rem',
    fontWeight: 500,
    marginTop: 6,
    textAlign: 'center',
    cursor: 'pointer',
  },
  '& .MuiStepLabel-iconContainer': {
    paddingRight: 0,
  },
}));

// Wrapper to ensure proper alignment
const StageContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  position: 'relative',
});

// Helper to format the date for display
const formatDate = (dateString?: string) => {
  if (!dateString) return null;
  
  // If it's a valid date string, format it nicely
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) {
    return dateString; // If parsing fails, just return the original string
  }
};

/**
 * Individual stage component within the progress tracker
 * Shows stage name, status, and completion date
 * Adapts to different screen sizes with responsive design
 */
export const ProgressStage: React.FC<ProgressStageProps> = ({
  name,
  status,
  index,
  totalStages,
  date,
  onClick,
  compact = false
}) => {
  // Custom step icon component
  const StageIcon = (props: StepIconProps) => {
    return (
      <StageIconRoot ownerState={{ status }} onClick={onClick}>
        {status === 'completed' && <CheckIcon fontSize={compact ? 'small' : 'medium'} />}
        {status === 'current' && <AccessTimeIcon fontSize={compact ? 'small' : 'medium'} />}
        {status === 'delayed' && <WarningIcon fontSize={compact ? 'small' : 'medium'} />}
        {status === 'upcoming' && null}
      </StageIconRoot>
    );
  };

  return (
    <StageContainer
      sx={{
        width: `${100 / totalStages}%`,
        padding: compact ? '0 4px' : '0 8px',
      }}
    >
      {/* Add connector line if not the last stage */}
      {index < totalStages - 1 && (
        <div 
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            width: '100%',
            height: 2,
            backgroundColor: status === 'completed' ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
            zIndex: 0,
          }}
        />
      )}
      
      <Step completed={status === 'completed'}>
        <StageLabelStyled
          StepIconComponent={StageIcon}
          onClick={onClick}
          ownerState={{ status, compact }}
        >
          <div className="text-center w-full">
            {name}
          </div>
        </StageLabelStyled>
      </Step>
      
      {/* Date - Hide on very small screens */}
      {date && (
        <div 
          className={`mt-1 ${compact ? 'text-[10px]' : 'text-xs'} text-gray-400 text-center`}
          onClick={onClick}
        >
          {formatDate(date)}
        </div>
      )}
    </StageContainer>
  );
};