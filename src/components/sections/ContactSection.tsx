import React from 'react';
import { motion } from 'framer-motion';
import { Send, Instagram } from 'lucide-react';

export default function ContactSection() {
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ amount: 0.3 }}
            transition={{ duration: 0.8 }}
            className="text-left"
          >
            <h2 className="text-4xl sm:text-5xl font-light text-white tracking-tight mb-8">
              Contact Us
              <span className="block mt-2 text-gray-400">Let's talk solar</span>
            </h2>
            
            <p className="text-xl text-gray-300 leading-relaxed mb-8">
              Get in touch with us today to explore how solar can benefit your home. Whether you
              have questions, need a quote, or are ready to start your solar journey, we're here to assist you.
            </p>

            <motion.a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -2 }}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <Instagram className="w-5 h-5" />
              <span>Follow us on Instagram</span>
            </motion.a>
          </motion.div>

          {/* Right Column - Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-black/50 rounded-2xl shadow-lg p-8 border border-neutral-800/50 backdrop-blur-sm"
          >
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    className="w-full px-4 py-3 rounded-full bg-black/50 border border-neutral-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent transition-all backdrop-blur-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    className="w-full px-4 py-3 rounded-full bg-black/50 border border-neutral-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent transition-all backdrop-blur-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 rounded-full bg-black/50 border border-neutral-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent transition-all backdrop-blur-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl bg-black/50 border border-neutral-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-white focus:border-transparent transition-all resize-none backdrop-blur-sm"
                  required
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="btn-sheen w-full inline-flex items-center justify-center gap-3 px-8 py-4 text-white rounded-full shadow-xl transition-all duration-300"
              >
                <span className="text-sm font-medium tracking-wider">SEND MESSAGE</span>
                <Send className="w-4 h-4" />
              </motion.button>
            </form>
          </motion.div>
        </div>

        {/* Footer Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-24 text-center"
        >
          <div className="space-x-6">
            {['Home', 'Services', 'About', 'Contact', 'Privacy Policy', 'Terms of Service'].map((link) => (
              <motion.a
                key={link}
                href={`#${link.toLowerCase().replace(/ /g, '-')}`}
                className="text-sm text-gray-400 hover:text-white transition-colors"
                whileHover={{ y: -2 }}
              >
                {link}
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}