import React from "react";
import { motion } from "framer-motion";

// Define the stages for the progress bar
// export type ProgressStage = 'Panels' | 'Inverter' | 'Batteries' | 'Design' | 'Overview' ;
export type ProgressStage = "Design" | "Batteries" | "Overview";

// Props interface for the ProgressBar component
interface ProgressBarProps {
  currentStage: ProgressStage;
  onStageClick: (stage: ProgressStage) => void;
  completedStages: ProgressStage[];
  className?: string;
}

// Define all stages in order
// const stages: ProgressStage[] = ['Panels', 'Inverter', 'Batteries', 'Design', 'Overview'];
const stages: ProgressStage[] = ["Design", "Batteries", "Overview"];

const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStage,
  onStageClick,
  completedStages,
  className = "",
}) => {
  // Find the index of the current stage
  const currentIndex = stages.indexOf(currentStage);

  // For debugging - log what's happening
  return (
    <div className={`absolute top-[10%] left-0 w-full ${className}`}>
      {/* Main progress bar container */}
      <div className="relative z-50 p-6">
        {/* Stage indicators */}
        <div className="flex justify-between relative">
          {stages.map((stage, index) => {
            // Determine if this stage is active, completed, or upcoming
            const isActive = stage === currentStage;
            const isCompleted = completedStages.includes(stage);
            const isClickable = isCompleted || isActive;

            return (
              <div
                key={stage}
                className="flex flex-col items-center relative z-50"
                style={{ width: `${100 / stages.length}%` }}
              >
                {/* Stage dot - Add z-index and explicit cursor to ensure clickability */}
                <div
                  className={`w-4 h-4 rounded-full mb-2 relative z-50 
                    ${isClickable ? "cursor-pointer" : "cursor-not-allowed"}
                    ${
                      isActive
                        ? "bg-white shadow-lg shadow-white"
                        : isCompleted
                        ? "bg-white"
                        : "bg-gray-700"
                    }`}
                  onClick={() => {
                    if (isClickable) {
                      onStageClick(stage);
                    }
                  }}
                >
                  {/* Pulsing effect for active stage */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-white/50"
                      animate={{
                        scale: [1, 1.6, 1],
                        opacity: [0.7, 0, 0.7],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}

                  {/* Checkmark for completed stages (not the current stage) */}
                  {isCompleted && !isActive && (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Stage label - Add z-index and explicit cursor */}
                <div
                  className={`text-xs text-center tracking-wider z-50
                    ${
                      isActive
                        ? "text-white text-glow-accent"
                        : isCompleted
                        ? "text-gray-300"
                        : "text-gray-500"
                    }`}
                  style={{
                    cursor: isClickable ? "pointer" : "default",
                  }}
                >
                  {stage === "Overview" ? "Choose Your Plan" : stage}
                </div>

                {/* Connecting line between stages */}
                {index < stages.length - 1 && (
                  <div
                    className={`absolute top-2 left-1/2 h-[1px] -z-10
                      ${index < currentIndex ? "bg-white" : "bg-gray-700"}`}
                    style={{
                      width: `${100}%`,
                      transform: "translateY(-50%)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Helper function to get description for each stage
const getStageDescription = (stage: ProgressStage): string => {
  switch (stage) {
    // case "Panels":
    //   return "Select your solar panel type and configuration";
    // case "Inverter":
    //   return "Choose the right inverter for your system";
    case "Design":
      return "Customize the layout and placement of your system";
    case "Batteries":
      return "Add battery storage to your solar solution";
    case "Overview":
      return "Review your complete solar system configuration";

    default:
      return "";
  }
};

export default ProgressBar;
