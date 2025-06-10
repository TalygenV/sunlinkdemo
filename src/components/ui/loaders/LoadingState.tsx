import { motion } from 'framer-motion';
import { containerVariants } from '../../utils/animations';
import React from 'react';

export const LoadingState = () => (
  <motion.div
    variants={containerVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="flex items-center justify-center h-[600px] relative"
  >
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
      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-white/20 to-blue-500/20 rounded-3xl blur-[60px] opacity-60" />
    </motion.div>
    
    <div className="relative z-10 flex flex-col items-center">
     
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-xl font-light text-white"
      >
        Loading solar design...
      </motion.h3>
    </div>
  </motion.div>
);