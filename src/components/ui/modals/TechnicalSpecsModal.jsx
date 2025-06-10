import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const TechnicalSpecsModal = ({ isOpen, onClose, panelData }) => {
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: custom => ({
      y: 0,
      opacity: 1,
      transition: { 
        delay: custom * 0.1,
        duration: 0.4,
        ease: "easeOut"
      }
    })
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="flex items-center justify-center px-4 technical-specs-modal ">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-lg"
          />

          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-4xl"
          >
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

            <div className="relative z-10 bg-black/80 backdrop-blur-xl rounded-3xl border border-white/10 p-8 max-h-[80vh] overflow-y-auto">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <motion.h2 
                  className="text-2xl font-light text-white"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  custom={0}
                >
                  Solar Panel Technical Specifications
                </motion.h2>
                <motion.p 
                  className="text-gray-400 text-sm mt-2"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  custom={1}
                >
                  Detailed specifications for all available models
                </motion.p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {panelData?.solarPanels?.map((panel, index) => (
                  <motion.div
                    key={`${panel.brand}-${panel.model}`}
                    className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-white/20 transition-colors"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    custom={index + 2}
                    whileHover={{ 
                      y: -5, 
                      boxShadow: "0 10px 30px -10px rgba(0,0,0,0.4)",
                      transition: {
                        type: "spring",
                        stiffness: 300,
                        damping: 15
                      }
                    }}
                  >
                    <div className="mb-4 pb-4 border-b border-white/10">
                      <h3 className="text-xl text-white font-medium">{panel.brand} {panel.model}</h3>
                      <p className="text-accent-400 mt-1">{panel.wattage}W, {panel.efficiency}% efficiency</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Description</p>
                        <p className="text-white text-sm">{panel.specs.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Cell Type</p>
                          <p className="text-white text-sm">{panel.specs.cellType}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Temp Coefficient</p>
                          <p className="text-white text-sm">{panel.specs.temperatureCoefficient}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Dimensions</p>
                        <p className="text-white text-sm">{panel.specs.dimensions}</p>
                      </div>
                      
                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Frame</p>
                        <p className="text-white text-sm">{panel.specs.frame}</p>
                      </div>
                      
                      <div>
                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Key Features</p>
                        <ul className="text-white text-sm space-y-1 mt-2">
                          {panel.keyFeatures.map((feature, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-400 mt-1.5 mr-2"></span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TechnicalSpecsModal;