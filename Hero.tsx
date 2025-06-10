import React, { useState, useContext, useEffect } from "react";
import { ArrowRight, Sun, Zap, LineChart, MousePointerClick, ChevronDown } from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { DesignForm } from "../forms";
import { FormContext } from "../../App";
import { trackEvent, AnalyticsEvents } from "../../lib/analytics";
import phoneScreen from "../../images/solar_panels/phone_screen.png";
import macbook from "../../images/solar_panels/macbook_hero.png";

const IPhoneMockup = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, delay: 0.2 }}
    className="relative mx-auto w-[280px] h-[560px] sm:w-[320px] sm:h-[640px]"
  >
    {/* Enhanced Glow Effects */}
    <motion.div
      animate={{
        scale: [1, 1.05, 1],
        opacity: [0.4, 0.5, 0.4],
      }}
      transition={{ duration: 4, repeat: Infinity }}
      className="absolute -inset-8 bg-gradient-to-r from-purple-400/20 via-accent-400/20 to-purple-500/20 blur-[100px] z-[-1]"
    />
    
    {/* iPhone Frame */}
    <motion.div
      className="relative w-full h-full"
      whileHover={{ y: -10 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {/* Side Buttons */}
      {/* Power Button */}
      <div className="absolute -right-[3px] top-24 w-[4px] h-14 bg-gradient-to-b from-gray-400 to-gray-300 rounded-l-md shadow-[inset_1px_0_2px_rgba(0,0,0,0.2)]">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
      </div>
      {/* Volume Buttons */}
      <div className="absolute -left-[3px] top-24 w-[4px] h-10 bg-gradient-to-b from-gray-400 to-gray-300 rounded-r-md shadow-[-1px_0_2px_rgba(0,0,0,0.2)]">
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white/20" />
      </div>
      <div className="absolute -left-[3px] top-36 w-[4px] h-10 bg-gradient-to-b from-gray-400 to-gray-300 rounded-r-md shadow-[-1px_0_2px_rgba(0,0,0,0.2)]">
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white/20" />
      </div>
      
      {/* Main Frame */}
      <div className="absolute inset-0 bg-white rounded-[3rem] border-[2px] border-gray-300 shadow-[0_0_60px_rgba(0,0,0,0.15)] backdrop-blur-sm overflow-hidden">

      {/* Notch */}
      <div className="absolute top-0 inset-x-0 h-7 bg-orange-100 rounded-b-3xl">
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-20 h-4 bg-orange-200 rounded-full" />
      </div>
      
      {/* Screen Content */}
      <div className="absolute inset-[2px] overflow-hidden rounded-[2.8rem]">
        {/* Phone Screen Image */}
        <img
          src={phoneScreen}
          alt="Sunlink App Screen"
          className="absolute inset-0 w-full h-full object-cover brightness-75"
        />

        {/* Darkening Overlay */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Subtle Moving Glare Effect */}
        <motion.div
          initial={{ x: '-150%' }}
          animate={{ x: '150%' }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          className="absolute top-0 left-0 w-[150%] h-[100%] -rotate-45 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%)',
            opacity: 0.2,
            mixBlendMode: 'screen',
            filter: 'blur(6px)'
          }}
        />

        {/* Screen Reflection Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/15 via-black/5 to-transparent pointer-events-none" />
      </div>
      </div>
    </motion.div>
  </motion.div>
);

export default function Hero() {
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 500], ['0%', '20%']);
  const { showForm, setShowForm } = useContext(FormContext);

  // Track when users start the design process
  const handleStartDesign = () => {
    trackEvent(AnalyticsEvents.BUTTON_CLICK, { button: 'start_design' });
    setShowForm(true);
  };

  return (
    <div className="relative min-h-screen overflow-hidden border-b-0">
      {/* Background Image */}
      <motion.div 
        className="absolute inset-0 z-0 max-w-[2400px] mx-auto overflow-hidden"
        style={{ y: backgroundY }}
      >
        <motion.img
          src="https://i.imgur.com/Hy6j9ar.png"
          alt="Solar Background"
          className="w-full h-[120%] object-cover object-center scale-110"
        />
        <motion.div 
          className="absolute inset-0"
          animate={{ 
            backgroundColor: showForm ? "rgba(0, 0, 0, 0.75)" : "rgba(0, 0, 0, 0.6)",
            backdropFilter: showForm ? "blur(10px)" : "blur(0px)"
          }}
          transition={{ duration: 0.5 }}
        />
      </motion.div>

      {/* Enhanced Background Gradients */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80"
      />

      {/* Content */}
      <div className="relative z-10 container-fluid px-6 sm:px-8 lg:px-12 pt-32 pb-16 min-h-[100vh] flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          {!showForm ? (
            <div 
              className="animate-fade-in space-y-6 max-w-5xl w-full" 
            >
              <div className="grid md:grid-cols-2 lg:gap-12 gap-8 items-center">
                <div className="text-left">
                  <motion.div
                    key="hero-text"
                    initial={{ opacity: 1, x: 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                  {/* Main Heading */}
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-4xl sm:text-5xl lg:text-7xl font-light text-white tracking-tight mb-6"
                  >
                    Design Your Perfect
                    <span className="block mt-2 text-white font-medium relative text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/80">
                      Solar Solution
                    </span>
                  </motion.h1>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-base sm:text-lg lg:text-xl text-gray-400 mb-8 leading-relaxed font-light max-w-xl"
                  >
                    Create your custom solar setup in minutes with our advanced design tool. 
                    Get instant cost estimates and see your savings in real-time.
                  </motion.p>

                  {/* CTA Buttons */}
                  <div className="w-full md:w-auto">
                    <motion.button
                      key="cta-button"
                      onClick={handleStartDesign}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative w-full md:w-auto overflow-visible"
                    >
                      {/* Glow Effect */}
                      <motion.div
                        className="absolute -inset-1 rounded-full z-0"
                        animate={{ 
                          opacity: [0.4, 0.6, 0.4],
                          scale: [1, 1.03, 1]
                        }}
                        transition={{ 
                          duration: 6,
                          repeat: Infinity,
                          ease: "easeInOut",
                          times: [0, 0.5, 1]
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-white/30 to-blue-500/20 rounded-full blur-[20px]" />
                      </motion.div>

                      {/* Button Core */}
                      <div className="btn-sheen relative z-10 flex items-center justify-center gap-3 px-8 py-4 text-white rounded-full shadow-xl transition-all duration-500 border border-white/10">
                        {/* Text Content */}
                        <span className="relative font-light text-base tracking-wider">
                          Start Designing Now
                        </span>
                        
                        {/* Arrow with Enhanced Animation */}
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ArrowRight
                          className="relative w-5 h-5" 
                          strokeWidth={2.5}
                          />
                        </motion.div>
                      </div>
                    </motion.button>
                  </div>
                  </motion.div>
                </div>                

                <motion.div
  /* container */
  key="iphone-container"
  initial={{ opacity: 1, x: 0 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: 100 }}
  whileHover={{ y: -10, transition: { type: "spring", stiffness: 400, damping: 10 } }}
  transition={{ duration: 0.5, ease: "easeInOut" }}
  className="relative group flex justify-center md:justify-end overflow-visible"  /* ← keeps overspill visible */
>  <motion.div
      animate={{
        scale: [1, 1.05, 1],
        opacity: [0.4, 0.5, 0.4],
      }}
      transition={{ duration: 4, repeat: Infinity }}
      className="absolute -inset-8 bg-gradient-to-r from-purple-400/20 via-accent-400/20 to-purple-500/20 blur-[100px] z-[-1]"
    />
  <img
    src={macbook}
    alt="Macbook"
    className="object-contain w-[120%] md:w-[120%] lg:w-[120%] max-w-none"  /* ← this max-w-none removes the cap */
  />
</motion.div>
              </div>
            </div>
          ) : (
            <DesignForm 
              key="design-form" 
              onBack={() => setShowForm(false)} 
            />
          )}
        </AnimatePresence>

        {/* Animated Down Arrow */}
        <AnimatePresence mode="wait">
          {!showForm && (
            <motion.div
              key="down-arrow"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.6,
                delay: 1,
                y: {
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }
              }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block"
            >
              <ChevronDown className="w-8 h-8 text-gray-500" strokeWidth={1.5} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}