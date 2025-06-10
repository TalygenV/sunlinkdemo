import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ProgressBar, { ProgressStage } from './progressbar';

const ProgressBarDemo: React.FC = () => {
  const [currentStage, setCurrentStage] = useState<ProgressStage>('Panels');

  // Handle stage click to navigate between stages
  const handleStageClick = (stage: ProgressStage) => {
    setCurrentStage(stage);
  };

  // Animation variants for the container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  // Animation variants for individual items
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <motion.div
        className="w-full max-w-4xl space-y-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <div className="relative inline-block">
            {/* Top left corner border */}
            <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-white/30 rounded-tl-md"></div>
            <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-white/30 rounded-br-md"></div>
            
            <h1 className="text-4xl text-white font-light px-6 py-2">
              Solar System Configuration
            </h1>
          </div>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            Track your progress through the solar system design process with our intuitive progress tracker.
            Click on any stage to navigate directly to it.
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div variants={itemVariants}>
          <ProgressBar 
            currentStage={currentStage} 
            onStageClick={handleStageClick} 
          />
        </motion.div>

        {/* Stage Content Preview */}
        <motion.div 
          variants={itemVariants}
          className="mt-12 bg-black/60 backdrop-blur-xl rounded-xl border border-white/10 p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl text-white font-light">
              {currentStage} Stage
            </h2>
            <div className="flex space-x-2">
              {currentStage !== 'Panels' && (
                <motion.button
                  className="px-4 py-2 bg-black/50 hover:bg-black/70 text-white rounded-lg border border-white/10 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const currentIndex = ['Panels', 'Inverter', 'Batteries', 'Design', 'Overview', 'Completion'].indexOf(currentStage);
                    if (currentIndex > 0) {
                      setCurrentStage(['Panels', 'Inverter', 'Batteries', 'Design', 'Overview', 'Completion'][currentIndex - 1] as ProgressStage);
                    }
                  }}
                >
                  Previous
                </motion.button>
              )}
              {currentStage !== 'Completion' && (
                <motion.button
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const currentIndex = ['Panels', 'Inverter', 'Batteries', 'Design', 'Overview', 'Completion'].indexOf(currentStage);
                    if (currentIndex < 5) {
                      setCurrentStage(['Panels', 'Inverter', 'Batteries', 'Design', 'Overview', 'Completion'][currentIndex + 1] as ProgressStage);
                    }
                  }}
                >
                  Next
                </motion.button>
              )}
            </div>
          </div>

          {/* Placeholder content for each stage */}
          <div className="text-gray-300">
            {getStageContent(currentStage)}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

// Helper function to get content for each stage
const getStageContent = (stage: ProgressStage): JSX.Element => {
  switch (stage) {
    case 'Panels':
      return (
        <div className="space-y-4">
          <p>Select from our premium range of solar panels to match your energy needs and aesthetic preferences.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer">
              <div className="text-white font-medium">Premium Black Panels</div>
              <div className="text-gray-400 text-sm">400W, 22.1% efficiency</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer">
              <div className="text-white font-medium">Ultra High Efficiency</div>
              <div className="text-gray-400 text-sm">430W, 23.5% efficiency</div>
            </div>
          </div>
        </div>
      );
    case 'Inverter':
      return (
        <div className="space-y-4">
          <p>Choose the right inverter to convert DC electricity from your solar panels into AC electricity for your home.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer">
              <div className="text-white font-medium">String Inverter</div>
              <div className="text-gray-400 text-sm">Cost-effective, 97% efficiency</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer">
              <div className="text-white font-medium">Microinverters</div>
              <div className="text-gray-400 text-sm">Panel-level optimization, 99% efficiency</div>
            </div>
          </div>
        </div>
      );
    case 'Batteries':
      return (
        <div className="space-y-4">
          <p>Add battery storage to your solar system to store excess energy for use when the sun isn't shining.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer">
              <div className="text-white font-medium">Standard Capacity</div>
              <div className="text-gray-400 text-sm">10kWh, 95% round-trip efficiency</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer">
              <div className="text-white font-medium">High Capacity</div>
              <div className="text-gray-400 text-sm">15kWh, 96% round-trip efficiency</div>
            </div>
          </div>
        </div>
      );
    case 'Design':
      return (
        <div className="space-y-4">
          <p>Customize the layout and placement of your solar system to maximize energy production and aesthetic appeal.</p>
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/10 mt-4">
            <div className="text-white font-medium mb-2">Roof Layout Preview</div>
            <div className="h-40 bg-orange-800/50 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">Interactive roof layout tool</span>
            </div>
          </div>
        </div>
      );
    case 'Overview':
      return (
        <div className="space-y-4">
          <p>Review your complete solar system configuration before finalizing your design.</p>
          <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/10 mt-4 space-y-3">
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-gray-400">Panels:</span>
              <span className="text-white">Premium Black Panels (400W)</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-gray-400">Inverter:</span>
              <span className="text-white">Microinverters</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-gray-400">Battery:</span>
              <span className="text-white">Standard Capacity (10kWh)</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
              <span className="text-gray-400">System Size:</span>
              <span className="text-white">5.6 kW</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-gray-400">Estimated Cost:</span>
              <span className="text-white">$18,500</span>
            </div>
          </div>
        </div>
      );
    case 'Completion':
      return (
        <div className="space-y-4">
          <p>Your solar system design is complete! Review your final configuration and prepare for the next steps.</p>
          <div className="bg-indigo-900/30 p-4 rounded-lg border border-indigo-800/40 mt-4">
            <div className="text-white font-medium mb-2">Next Steps</div>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Schedule a virtual consultation with our solar experts</li>
              <li>Receive a detailed quote for your custom system</li>
              <li>Arrange a site assessment for final verification</li>
              <li>Begin the installation process</li>
            </ul>
          </div>
        </div>
      );
    default:
      return <></>;
  }
};

export default ProgressBarDemo;