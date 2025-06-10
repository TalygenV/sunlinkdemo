import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, PenTool as Wrench, Shield, Clock, Wallet } from 'lucide-react';

const fadeInUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function InstallationSection() {
  return (
    <div className="relative bg-black py-24 overflow-hidden -mt-1">
      {/* Subtle gradient overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 bg-gradient-to-b from-black via-neutral-900/50 to-transparent pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ amount: 0.3 }}
            className="text-center mb-12"
          >
            <motion.h2
              variants={fadeInUpVariant}
              transition={{ duration: 0.8 }}
              className="text-4xl sm:text-5xl font-light text-white tracking-tight mb-8"
            >
              <motion.span
                variants={fadeInUpVariant}
                transition={{ duration: 0.8 }}
              >
                Expert Installation
              </motion.span>
              <motion.span
                variants={fadeInUpVariant}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="block mt-2 text-white/80"
              >
                by certified experts
              </motion.span>
            </motion.h2>
            
            <div className="space-y-8">
              <motion.p
                variants={fadeInUpVariant}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-xl text-white/90 leading-relaxed mx-auto max-w-2xl"
              >
                Our network of certified installers ensures your solar system is set up correctly, safely, and efficiently—maximizing your energy production from day one.
              </motion.p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12 max-w-3xl mx-auto">
                {[
                  {
                    icon: Wrench,
                    title: 'Expert Installation',
                    description: 'Certified professionals with years of experience',
                  },
                  {
                    icon: Shield,
                    title: '25-Year Warranty',
                    description: 'Complete coverage for peace of mind',
                  },
                  {
                    icon: Clock,
                    title: 'Quick Setup',
                    description: 'Most installations completed within a day',
                  },
                  {
                    icon: Wallet,
                    title: '0% Financing',
                    description: 'Build & Secure your Solar investment with no risk',
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    variants={fadeInUpVariant}
                    transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                    viewport={{ amount: 0.3 }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="flex flex-col p-6 bg-black/50 rounded-2xl shadow-lg border border-neutral-800/50 backdrop-blur-sm"
                  >
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      viewport={{ amount: 0.3 }}
                      transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                    >
                      <feature.icon className="h-8 w-8 text-white mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">{feature.title}</h3>
                      <p className="text-gray-400 text-sm">{feature.description}</p>
                    </motion.div>
                  </motion.div>
                ))}
              </div>

            
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}