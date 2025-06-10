import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Percent, DollarSign, LineChart, ShieldCheck } from 'lucide-react';

export default function SavingsSection() {
  return (
    <div className="relative bg-black py-24 overflow-hidden -mt-1">
      {/* Background Pattern */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-black via-neutral-900/30 to-black"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-light text-white tracking-tight mb-8"
          >
            30%+ less in cost
            <span className="block mt-2 text-gray-400">Premium Installation</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-4xl mx-auto text-xl text-gray-300 leading-relaxed"
          >
            At Unlimited Energy we only care about maximizing your savings. We can provide premium solar installations with top-tier equipment and warranties—at a fraction of the cost.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
        >
          <motion.div
            whileHover={{ y: -5 }}
            className="flex flex-col p-8 bg-black/50 rounded-2xl shadow-lg border border-neutral-800/50 backdrop-blur-sm"
          >
            <h3 className="text-2xl font-light text-white mb-6">Transparent Pricing</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              Our online platform eliminates sales markups and inflated financing, letting homeowners customize their system, choose financing, and get same-day funding with full transparency.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: DollarSign, text: "No Sales Markup" },
                { icon: Percent, text: "Fair Financing" },
                { icon: LineChart, text: "Real-time Pricing" },
                { icon: ShieldCheck, text: "Price Match Guarantee" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -2 }}
                  className="flex items-center gap-3 p-4"
                >
                  <item.icon className="w-5 h-5 text-white" />
                  <span className="text-sm text-gray-400">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="flex flex-col p-8 bg-black/50 rounded-2xl shadow-lg border border-neutral-800/50 backdrop-blur-sm"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 flex items-center justify-center">
                  <span className="text-2xl font-light text-white">1</span>
                </div>
                <div>
                  <h4 className="text-xl text-white mb-1">Design</h4>
                  <p className="text-gray-400">Skip the solar sales pitch</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 flex items-center justify-center">
                  <span className="text-2xl font-light text-white">2</span>
                </div>
                <div>
                  <h4 className="text-xl text-white mb-1">Finalize</h4>
                  <p className="text-gray-400">Lock in your design</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 flex items-center justify-center">
                  <span className="text-2xl font-light text-white">3</span>
                </div>
                <div>
                  <h4 className="text-xl text-white mb-1">Save</h4>
                  <p className="text-gray-400">Start saving immediately</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-sheen inline-flex items-center gap-3 px-12 py-5 text-white rounded-full shadow-xl transition-all duration-300"
          >
            <span className="text-lg font-medium tracking-wider">GET STARTED</span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}