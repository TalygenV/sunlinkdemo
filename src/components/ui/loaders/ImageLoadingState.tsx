import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Map, Image as ImageIcon } from 'lucide-react';
import { containerVariants } from '../../utils/animations';

interface ImageLoadingStateProps {
  progress?: number; // 0-100
}

// Simple progress bar specifically for the image loading state
const SimpleProgressBar: React.FC<{value: number, className?: string, barClassName?: string}> = ({
  value,
  className = "",
  barClassName = ""
}) => (
  <div className={`w-full bg-white/10 rounded-full overflow-hidden ${className}`}>
    <motion.div 
      className={`h-full rounded-full ${barClassName || 'bg-gradient-to-r from-blue-500 to-purple-500'}`}
      initial={{ width: "0%" }}
      animate={{ width: `${value}%` }}
      transition={{ duration: 0.3 }}
    />
  </div>
);

export const ImageLoadingState: React.FC<ImageLoadingStateProps> = ({
  progress = 0
}) => {
  // Add console log to confirm the component is rendering
  React.useEffect(() => {
    console.log("ImageLoadingState rendered with progress:", progress);
  }, [progress]);
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex items-center justify-center h-[600px] relative"
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute -inset-8 rounded-3xl"
        animate={{
          opacity: [0.2, 0.4, 0.4, 0.2],
          scale: [1, 1.015, 1.015, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: [0.4, 0, 0.2, 1],
          times: [0, 0.4, 0.6, 1],
          repeatType: "loop"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-white/20 to-purple-500/20 rounded-3xl blur-[60px] opacity-60" />
      </motion.div>
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Satellite/Map icon animation */}
        <div className="relative mb-8">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ 
              y: 0, 
              opacity: 1,
              rotate: [0, 5, 0, -5, 0],
            }}
            transition={{
              duration: 2.5,
              rotate: {
                repeat: Infinity,
                duration: 5,
                ease: "easeInOut"
              }
            }}
            className="text-yellow-500 mb-2"
          >
           
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ 
              y: 0, 
              opacity: 1,
              scale: [1, 1.05, 1, 0.95, 1]
            }}
            transition={{
              delay: 0.2,
              duration: 1.8,
              scale: {
                repeat: Infinity,
                duration: 4,
                ease: "easeInOut"
              }
            }}
            className="absolute top-0 left-0 right-0 text-purple-500 opacity-70 flex justify-center"
          >
          
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.5,
              duration: 0.8,
              type: "spring",
              stiffness: 200
            }}
            className="absolute -bottom-2 left-0 right-0 flex justify-center"
          >
            
          </motion.div>
        </div>
        
        {/* Progress indicator */}
        <div className="w-80 mb-6">
          <SimpleProgressBar 
            value={progress}
            className="h-2" 
          />
        </div>
        
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl font-light text-white"
        >
          Loading Satellite Imagery
        </motion.h3>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-white/60 mt-2 text-sm"
        >
          Preparing high-resolution map view...
        </motion.p>
      </div>
    </motion.div>
  );
};