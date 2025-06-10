import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function DesignSection() {
  return (
    <div className="relative bg-white py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-24 items-center">
          {/* Left Column - Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative mb-12 lg:mb-0"
          >
            <div className="relative mx-auto max-w-[320px]">
              {/* Phone Frame */}
              <div className="relative rounded-[3rem] border-[14px] border-black overflow-hidden shadow-2xl">
                {/* Screen Content */}
                <div className="aspect-[9/19.5] bg-accent-400 overflow-hidden">
                  <div className="p-8 text-white">
                    <div className="flex justify-center mb-6">
                      <img
                        src="https://images.squarespace-cdn.com/content/v1/65039030a590031c43338344/a6fc2949-1807-4dce-8215-2f0e55c4fd87/Color+logo+-+no+background.png?format=1500w"
                        alt="Unlimited Energy"
                        className="h-8 brightness-0 invert"
                      />
                    </div>
                    <p className="text-sm text-center mb-6">
                      Get your power from an unlimited source
                    </p>
                    <button className="w-full bg-white text-accent-400 rounded-lg py-3 font-medium text-sm">
                      Build Your System
                    </button>
                    
                    <div className="grid grid-cols-2 gap-4 mt-8">
                      {[
                        { number: '1', text: 'Answer Questions' },
                        { number: '2', text: 'Build System' },
                        { number: '3', text: 'Select Payment' },
                        { number: '4', text: 'Enjoy Savings' }
                      ].map((step) => (
                        <div
                          key={step.number}
                          className="bg-white/10 rounded-lg p-4 text-center"
                        >
                          <div className="text-lg font-medium mb-1">{step.number}</div>
                          <div className="text-xs">{step.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-left"
          >
            <h2 className="text-4xl sm:text-5xl font-light text-gray-900 tracking-tight mb-8">
              Design & Sign up
              <span className="block mt-2 text-gray-500">in minutes</span>
            </h2>
            
            <div className="space-y-8">
              <p className="text-xl text-gray-600 leading-relaxed">
                Take control of your solar journey with transparent pricing, top-tier equipment, and expert installation—all in one platform.
              </p>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Customize your system, see real-time costs, and choose financing that fits your budget, all without a sales call.
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white rounded-full shadow-xl transition-all duration-300"
              >
                <span className="text-sm font-medium tracking-wider">DESIGN SYSTEM</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}